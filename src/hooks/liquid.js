import { getFactoryContract, getIndexContract, getPairContract } from './contract'
import { JSBI } from '@uniswap/sdk'
import { calculateGasMargin } from '../utils/index'

// Get the poo token amount
// @userAddress: account address
// @pairAddress: token pair address
export function getMintAmount(userAddress, pairAddress) {
  return getPairContract(pairAddress).balanceOf(userAddress)
}

export function getOtherLiquids(address) {
  // TODO: get user liquid data from other dex
  return new Promise((resolve, reject) => {
    const testData = [
      {
        name0: 'MTV',
        name1: 'USDT',
        address0: '0x123456...',
        address1: '0x654321...',
        pairAddress: '0xabcdef1111111111111111111111111111111111',
        Pooled0: '12.3456',
        Pooled1: '0.01',
        PoolTokens: '1.234',
        PoolShares: '0.08%',
        location: 'Uniswap',
        isApproved: false
      },
      {
        name0: 'FED',
        name1: 'USDT',
        address0: '0xabcdef...',
        address1: '0xfedcba...',
        pairAddress: '0xabcdef2222222222222222222222222222222222',
        Pooled0: '22.2222',
        Pooled1: '0.02',
        PoolTokens: '1.234',
        PoolShares: '0.13%',
        location: 'Sushiswap',
        isApproved: false
      }
    ]
    resolve(testData)
  })
}

// Remove liquidity with user's permission
// Note: this tx should contains signature
export async function removeLiquidityWithPermits(
  networkId,
  _tokenAddress,
  _liquidityAmount,
  _amount0Min,
  _amount1Min,
  _toAddress,
  _deadline,
  _approveMax,
  _v,
  _r,
  _s) {
  const contract = getIndexContract(networkId, true)
  const gas = await contract.estimateGas.removeLiquidityWithPermit(
    _tokenAddress,
    _liquidityAmount,
    _amount0Min,
    _amount1Min,
    _toAddress,
    _deadline,
    _approveMax,
    _v,
    _r,
    _s)
  const gasLimits = calculateGasMargin(gas)
  return contract.removeLiquidityWithPermit(
    _tokenAddress,
    _liquidityAmount,
    _amount0Min,
    _amount1Min,
    _toAddress,
    _deadline,
    _approveMax,
    _v,
    _r,
    _s,
    {
      gasLimit: gasLimits
    }
  )
}

// Add liquidity
export async function addLiquidity(
  networkId,
  _token,
  _baseTokenAmountDesired,
  _tokenAmountDesired,
  _baseTokenAmountMin,
  _tokenAmountMin,
  _to,
  _deadline) {
  const contract = getIndexContract(networkId, true)
  const gas = await contract.estimateGas.addLiquidity(_token, _baseTokenAmountDesired, _tokenAmountDesired, _baseTokenAmountMin, _tokenAmountMin, _to, _deadline)
  const gasLimits = calculateGasMargin(gas)
  return contract.addLiquidity(_token, _baseTokenAmountDesired, _tokenAmountDesired, _baseTokenAmountMin, _tokenAmountMin, _to, _deadline, {
    gasLimit: gasLimits
  })
}

export async function addLiquidityWithPermit(
  networkId,
  _token,
  _baseTokenAmountDesired,
  _tokenAmountDesired,
  _baseTokenAmountMin,
  _tokenAmountMin,
  _to,
  _deadline,
  _approveMax,
  _v,
  _r,
  _s) {
  const contract = getIndexContract(networkId, true)
  const gas = await contract.estimateGas.addLiquidityWithPermit(_token, _baseTokenAmountDesired, _tokenAmountDesired, _baseTokenAmountMin, _tokenAmountMin, _to, _deadline, _approveMax, _v, _r, _s)
  const gasLimits = calculateGasMargin(gas)
  return contract.addLiquidityWithPermit(_token, _baseTokenAmountDesired, _tokenAmountDesired, _baseTokenAmountMin, _tokenAmountMin, _to, _deadline, _approveMax, _v, _r, _s, {
    gasLimit: gasLimits
  })
}

// Query pair info
export function getPair(networkId, otherTokenAddress) {
  return getFactoryContract(networkId).getPair(otherTokenAddress)
}

// Get user's balance of the pair
export function getPoolTokenBalance(pairAddress, userAddress) {
  return getPairContract(pairAddress).balanceOf(userAddress)
}

// harvest
export async function harvest(pairAddres, userAddress) {
  const contract = getPairContract(pairAddres, true)
  const gas = await contract.estimateGas.harvest(userAddress)
  const gasLimits = calculateGasMargin(gas)
  return contract.harvest(userAddress, {
    gasLimit: gasLimits
  })
}

// Get totalSupply of the pair
export function getTotalSupply(pairAddress) {
  return getPairContract(pairAddress).totalSupply()
}

export function getCredit(pairAddress, userAddress) {
  return getPairContract(pairAddress).refundAmount(userAddress)
}

export function getTotalRefundToken0(pairAddress) {
  return getPairContract(pairAddress).totalRefundToken0Amount()
}

export function getTotalRefundToken1(pairAddress) {
  return getPairContract(pairAddress).totalRefundToken1Amount()
}

export function getTotalRefundToken1EqualToken0(pairAddress) {
  return getPairContract(pairAddress).totalRefundToken1EqualToken0Amount()
}

export async function withdrawToken0(pairAddress, to, amount) {
  const contract = getPairContract(pairAddress, true)
  const gas = await contract.estimateGas.withdrawToken0(to, amount)
  const gasLimits = calculateGasMargin(gas)
  return contract.withdrawToken0(to, amount, {
    gasLimit: gasLimits
  })
}

export async function withdrawToken1(pairAddress, to, amount) {
  const contract = getPairContract(pairAddress, true)
  const gas = await contract.estimateGas.withdrawToken1(to, amount)
  const gasLimits = calculateGasMargin(gas)
  return contract.withdrawToken1(to, amount, {
    gasLimit: gasLimits
  })
}

// @value: TokenAmount
// @slippage: number
// @return: min and max
export function calculateSlippageAmount(value, slippage) {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000))
  ]
}
