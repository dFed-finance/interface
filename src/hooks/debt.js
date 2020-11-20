import { getPairContract, getIndexContract } from './contract'
import { calculateGasMargin } from '../utils/index'
import { getUSDDTokenStatic } from './token'
import { JSBI } from '@uniswap/sdk'
import TokenAmount from '../hooks/types/tokenAmount'
import { liquidationPoint } from './utils'
import DebtInfo from './types/debt'
import { MaxUint256 } from '@ethersproject/constants'


// Get all debts data
export async function getAllDebt(pairAddress, token) {
  const USDD = getUSDDTokenStatic()
  const dataMap = new Map()
  const contract = getPairContract(pairAddress)
  const logs = await contract.queryFilter("DebtUpdate")
  for (const l of logs) {
    const data = l.args
    const key = data.debtId.toString()
    // remove all repayed debt
    if (data.repayAmount.isZero()) {
      dataMap.delete(key)
      continue
    }
    const parsedData = {
      id: data.debtId,
      pledgeAmount: new TokenAmount(token, data.pledgeAmount),
      repayAmount: new TokenAmount(USDD, data.repayAmount),
      owner: data.owner,
      pairAddress: pairAddress
    }
    dataMap.set(key, parsedData)
  }
  const debtInfo = new DebtInfo(dataMap)
  return debtInfo
}

// According to the amount of input Token, return the amount of USDD that
// need to be input in consideration of liquidation.
export function getUSDDConsiderLiquidation(pair, tokenAmountIn, debtInfo) {
  const usddReserve = pair.reserve0
  const tokenReserve = pair.reserve1
  let [x, y] = [tokenReserve.raw, usddReserve.raw]
  let usedToken = JSBI.BigInt(0)
  let getUSDD = JSBI.BigInt(0)
  const removeList = []
  // find liquidation interval
  for (const d of debtInfo.sortByTokenPoint(usddReserve.raw, tokenReserve.raw)) {
    const [xbegin, ybegin, xend, yend] = liquidationPoint(x, y, d.pledgeAmount.raw, d.repayAmount.raw)
    const a = JSBI.subtract(JSBI.add(x, tokenAmountIn.raw), usedToken)
    if (JSBI.greaterThan(a, xbegin)) {
      usedToken = JSBI.add(usedToken, JSBI.subtract(xbegin, x))
      getUSDD = JSBI.add(getUSDD, JSBI.subtract(y, ybegin))
      x = xend
      y = yend
      removeList.push(d)
    } else {
      break
    }
  }

  // x'*(y-dy) = r0*r1
  // dy = y - r0*r1/x'
  x = JSBI.add(x, JSBI.subtract(tokenAmountIn.raw, usedToken))
  getUSDD = JSBI.add(
    getUSDD,
    JSBI.subtract(
      y,
      JSBI.divide(
        JSBI.multiply(
          usddReserve.raw,
          tokenReserve.raw),
        x)))
  return [getUSDD, removeList]
}

// According to the amount of input USDD, return the amount of tokens that
// need to be input in consideration of liquidation.
export function getTokenConsiderLiquidation(pair, usddAmountIn, debtInfo) {
  const usddReserve = pair.reserve0
  const tokenReserve = pair.reserve1
  let [x, y] = [tokenReserve.raw, usddReserve.raw]
  let usedUSDD = JSBI.BigInt(0)
  let getToken = JSBI.BigInt(0)
  const removeList = []
  // find liquidation interval
  for (const d of debtInfo.sortByTokenPoint(usddReserve.raw, tokenReserve.raw)) {
    const [xbegin, ybegin, xend, yend] = liquidationPoint(x, y, d.pledgeAmount.raw, d.repayAmount.raw)
    const a = JSBI.add(JSBI.subtract(y, usddAmountIn.raw), usedUSDD)
    if (JSBI.lessThan(a, ybegin)) {
      usedUSDD = JSBI.add(usedUSDD, JSBI.subtract(y, ybegin))
      getToken = JSBI.add(getToken, JSBI.subtract(xbegin, x))
      x = xend
      y = yend
      removeList.push(d)
    } else {
      break
    }
  }

  // (x+dx)*y' = r0*r1
  // dx = r0*r1/y' - x
  y = JSBI.subtract(y, JSBI.subtract(usddAmountIn.raw, usedUSDD))
  getToken = JSBI.add(
    getToken,
    JSBI.subtract(
      JSBI.divide(
        JSBI.multiply(
          usddReserve.raw,
          tokenReserve.raw),
        y), x))
  return [getToken, removeList]
}

// @return
// 1. usddAmount: Amount of USDD considering liquidation
// 2. tokenAmount: Amount of token considering liquidation
// 3. usddDebtAmount: The number of usdds in arrears due to collateral overlap
// 4. impactNum: Number of mortgages affected by withdrawal from the flow pool
export function getInfoAfterRemoveLpConsiderLiquidation(pair, totalSupply, removeAmount, debtsInfo) {
  const [x, y] = [pair.reserve1.raw, pair.reserve0.raw]
  const usddOri = JSBI.divide(JSBI.multiply(removeAmount, y), totalSupply)
  const tokenOri = JSBI.divide(JSBI.multiply(removeAmount, x), totalSupply)
  const [tokenExtraRec, usddSpend, usddDebtAmount, impactNum] = overlapDebit(JSBI.subtract(y, usddOri), JSBI.subtract(x, tokenOri), debtsInfo)
  return [JSBI.subtract(JSBI.subtract(usddOri, usddSpend), usddDebtAmount).toString(), JSBI.add(tokenOri, tokenExtraRec).toString(), usddDebtAmount.toString(), impactNum]
}

// @return
// tokenExtraRec: Token that users need to buy to withdraw from the flow pool
// usddSpend: USDD to be paid for the purchase of tokenextrarec
// usddDebit: The number of USDD in the form of debt
function overlapDebit(_reserve0, _reserve1, debtInfos) {
  let _lastStartX = JSBI.BigInt(MaxUint256);
  let _tmpStartX = JSBI.BigInt(0);
  let _tmpToken0 = JSBI.BigInt(0);
  let _tmpToken1 = JSBI.BigInt(0);
  let _getToken1Amount = JSBI.BigInt(0);
  let _payToken0Amount = JSBI.BigInt(0);
  let _refundToken0Amount = JSBI.BigInt(0);
  let impactDebitNum = 0
  let mark = false
  let clearAll = false
  for (let i = debtInfos.length - 1; i >= 0; i--) {
    const info = debtInfos[i];
    [_tmpStartX] = liquidationPoint(_reserve1, _reserve0, info.pledgeAmount.raw, info.repayAmount.raw);
    if (JSBI.equal(JSBI.BigInt(0), _tmpStartX) || clearAll) {
      _getToken1Amount = JSBI.add(_getToken1Amount, info.pledgeAmount.raw);
      _payToken0Amount = JSBI.add(_payToken0Amount, info.repayAmount.raw);
      impactDebitNum += 1;
      clearAll = true;
      continue
    }
    if (JSBI.lessThan(_tmpStartX, _reserve1)) {
      if (JSBI.lessThanOrEqual(JSBI.add(_tmpStartX, info.pledgeAmount.raw), _reserve1)) {
        _getToken1Amount = JSBI.add(_getToken1Amount, info.pledgeAmount.raw)
        _payToken0Amount = JSBI.add(_payToken0Amount, info.repayAmount.raw)
        impactDebitNum += 1
        continue
      }
      // ????
      _tmpToken1 = JSBI.subtract(_reserve1, _tmpStartX)
      _tmpToken0 = JSBI.divide(JSBI.subtract(JSBI.multiply(_reserve0, _reserve1), JSBI.multiply(_tmpStartX, _reserve0)), _tmpStartX);
      _getToken1Amount = JSBI.add(_getToken1Amount, _tmpToken1);
      _payToken0Amount = JSBI.add(_payToken0Amount, _tmpToken0);
      info.pledgeAmount = new TokenAmount(info.pledgeAmount.token, JSBI.subtract(info.pledgeAmount.raw, _tmpToken1));
      info.repayAmount = new TokenAmount(info.repayAmount.token, JSBI.subtract(info.repayAmount.raw, _tmpToken0));
      _tmpStartX = _reserve1
      mark = true
      impactDebitNum += 1
    }
    if (JSBI.lessThanOrEqual(_lastStartX, _tmpStartX)) {
      _refundToken0Amount = JSBI.add(_refundToken0Amount, info.repayAmount.raw);
      if (!mark) {
        impactDebitNum += 1
      }
      continue
    }
    if (JSBI.lessThan(_lastStartX, JSBI.add(_tmpStartX, info.pledgeAmount.raw))) {
      _tmpToken1 = JSBI.subtract(JSBI.add(_tmpStartX, info.pledgeAmount.raw), _lastStartX);
      // y = r0 * r1 * (tmpx + p - lastx) / (lastx * (tmpx + p))
      _tmpToken0 = JSBI.divide(JSBI.multiply(JSBI.multiply(_reserve0, _reserve1), _tmpToken1),
        JSBI.multiply(_lastStartX, JSBI.add(_tmpStartX, info.pledgeAmount.raw)));
      _refundToken0Amount = JSBI.add(_refundToken0Amount, _tmpToken0);
      if (!mark) {
        impactDebitNum += 1
      }
    }
    mark = false
    _lastStartX = _tmpStartX;
  }
  return [_getToken1Amount, _payToken0Amount, _refundToken0Amount, impactDebitNum];
}

// Get the mapping of USDD amount on the y-axis
export function getUSDDYMapping(usddReserve, tokenReserve, debtInfo) {
  const clearingList = []
  // get all clearing interval
  for (const d of debtInfo.sortByUSDDPoint(usddReserve.raw, tokenReserve.raw)) {
    const [, ybegin, , yend] = liquidationPoint(usddReserve.raw, tokenReserve.raw, d.pledgeAmount.raw, d.repayAmount.raw)
    clearingList.push({
      minVal: yend,
      maxVal: ybegin,
      disabled: true
    })
  }

  const fullList = []
  for (let i = 0; i < clearingList.length; i++) {
    const d = clearingList[i]
    if (i === 0 && JSBI.greaterThan(d.minVal, JSBI.BigInt(0))) {
      fullList.push({
        minVal: JSBI.BigInt(0),
        maxVal: d.minVal,
        disabled: false
      })
    }
    if (i !== 0 && JSBI.greaterThan(d.minVal, clearingList[i - 1].maxVal)) {
      fullList.push({
        minVal: clearingList[i - 1].maxVal,
        maxVal: d.minVal,
        disabled: false
      })
    }
    fullList.push(d)

    if (i === clearingList.length - 1 && JSBI.lessThan(d.maxVal, usddReserve.raw)) {
      fullList.push({
        minVal: d.maxVal,
        maxVal: usddReserve.raw,
        disabled: false
      })
    }
  }

  if (fullList.length === 0) {
    fullList.push({
      minVal: JSBI.BigInt(0),
      maxVal: usddReserve.raw,
      disabled: false
    })
  }

  return fullList
}


export async function mortgage(networkId, tokenAddress, pledgeAmount, targetNum, to, deadline) {
  const contract = getIndexContract(networkId, true)
  const gas = await contract.estimateGas.mortgage(tokenAddress, pledgeAmount, targetNum, to, deadline)
  const gasLimits = calculateGasMargin(gas)
  return contract.mortgage(tokenAddress, pledgeAmount, targetNum, to, deadline, {
    gasLimit: gasLimits
  })
}

export async function repay(networkId, tokenAddress, id, value, deadline, v, r, s) {
  const contract = getIndexContract(networkId, true)
  const gas = await contract.estimateGas.repayWithPermit(tokenAddress, id, value, deadline, v, r, s)
  const gasLimits = calculateGasMargin(gas)
  return contract.repayWithPermit(tokenAddress, id, value, deadline, v, r, s, {
    gasLimit: gasLimits
  })
}

