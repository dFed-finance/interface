import { getProviderOrSigner } from '../utils/index'
import { getFactoryContract, getPairContract } from './contract'
import { getFedTokenStatic, getUSDDTokenStatic } from './token'
import { JSBI } from '@uniswap/sdk'
import TokenAmount from '../hooks/types/tokenAmount'
import { START_REWARD_BLOCK } from '../constants/index'

const _0 = JSBI.BigInt(0)
const _10 = JSBI.BigInt(10)
const _100 = JSBI.BigInt(100)

const fed = getFedTokenStatic()
const usdd = getUSDDTokenStatic()

const fedDecimals = JSBI.exponentiate(_10, JSBI.BigInt(fed.decimals))
const usddDecimals = JSBI.exponentiate(_10, JSBI.BigInt(usdd.decimals))

export async function getBlock() {
  return getProviderOrSigner().getBlockNumber()
}

export async function getlastRewardedBlockGlobal(networkId) {
  return getFactoryContract(networkId).lastRewardedBlockGlobal()
}

export async function getaccRewardPerUSDDGlobal(networkId) {
  return getFactoryContract(networkId).accRewardPerUSDDGlobal()
}

export async function gettotalUSDDinLiquidityPoolGlobal(networkId) {
  return getFactoryContract(networkId).totalUSDDinLiquidityPoolGlobal()
}

export async function getlastReceivedRewardPerUSDDofPair(pairAddress) {
  return getPairContract(pairAddress).lastReceivedRewardPerUSDDOfPair()
}

export async function getaccRewardPerFEDlpofPair(pairAddress) {
  return getPairContract(pairAddress).accRewardPerFEDlpOfPair()
}

export async function getuserRewardDebtPerFEDlp(pairAddress, userAddress) {
  return getPairContract(pairAddress).userRewardDebtPerFEDlp(userAddress)
}

function accumulatedNewReward(lastBlock, currentBlock) {
  return JSBI.multiply(JSBI.subtract(currentBlock, lastBlock), JSBI.multiply(_100, fedDecimals))
}

export async function getFed(networkId, pairAddress, reserve0, totalSupply, poolToken, poolTokenAmount, userAddress) {
  const decimalsFEDlpToken = JSBI.exponentiate(_10, JSBI.BigInt(poolToken.decimals))
  let currentETHBlockHeight = await getBlock()
  currentETHBlockHeight = JSBI.BigInt(currentETHBlockHeight)
  let lastRewardedBlockGlobal = await getlastRewardedBlockGlobal(networkId)
  lastRewardedBlockGlobal = JSBI.BigInt(lastRewardedBlockGlobal)
  let accRewardPerUSDDGlobal = await getaccRewardPerUSDDGlobal(networkId)
  accRewardPerUSDDGlobal = JSBI.BigInt(accRewardPerUSDDGlobal)
  let totalUSDDinLiquidityPoolGlobal = await gettotalUSDDinLiquidityPoolGlobal(networkId)
  totalUSDDinLiquidityPoolGlobal = JSBI.BigInt(totalUSDDinLiquidityPoolGlobal)
  let lastReceivedRewardPerUSDDofPair = await getlastReceivedRewardPerUSDDofPair(pairAddress)
  lastReceivedRewardPerUSDDofPair = JSBI.BigInt(lastReceivedRewardPerUSDDofPair)
  let accRewardPerFEDlpofPair = await getaccRewardPerFEDlpofPair(pairAddress)
  accRewardPerFEDlpofPair = JSBI.BigInt(accRewardPerFEDlpofPair)
  let userRewardDebtPerFEDlp = await getuserRewardDebtPerFEDlp(pairAddress, userAddress)
  userRewardDebtPerFEDlp = JSBI.BigInt(userRewardDebtPerFEDlp)
  totalSupply = JSBI.BigInt(totalSupply)

  if (JSBI.lessThan(currentETHBlockHeight, START_REWARD_BLOCK)) {
    return new TokenAmount(fed, _0)
  }

  if (JSBI.greaterThan(currentETHBlockHeight, lastRewardedBlockGlobal) && JSBI.greaterThan(totalUSDDinLiquidityPoolGlobal, _0)) {
    // accRewardPerUSDDGlobal = JSBI.add(
    //   accRewardPerUSDDGlobal,
    //   JSBI.multiply(
    //     accumulatedNewReward(lastRewardedBlockGlobal, currentETHBlockHeight),
    //     JSBI.divide(
    //       usddDecimals,
    //       totalUSDDinLiquidityPoolGlobal
    //     )
    //   )
    // )

    accRewardPerUSDDGlobal = JSBI.add(
      accRewardPerUSDDGlobal,
      JSBI.divide(
        JSBI.multiply(
          accumulatedNewReward(lastRewardedBlockGlobal, currentETHBlockHeight),
          usddDecimals
        ),
        totalUSDDinLiquidityPoolGlobal
      )
    )

    lastRewardedBlockGlobal = currentETHBlockHeight
  }

  if (JSBI.lessThan(lastReceivedRewardPerUSDDofPair, accRewardPerUSDDGlobal) && JSBI.greaterThan(totalSupply, _0)) {
    // accRewardPerFEDlpofPair = JSBI.add(
    //   accRewardPerFEDlpofPair,
    //   JSBI.multiply(
    //     JSBI.multiply(
    //       JSBI.subtract(
    //         accRewardPerUSDDGlobal,
    //         lastReceivedRewardPerUSDDofPair
    //       ),
    //       reserve0
    //     ),
    //     JSBI.divide(
    //       JSBI.divide(
    //         decimalsFEDlpToken,
    //         usddDecimals
    //       ),
    //       totalSupply
    //     )
    //   )
    // )

    accRewardPerFEDlpofPair = JSBI.add(
      accRewardPerFEDlpofPair,
      JSBI.divide(
        JSBI.divide(
          JSBI.multiply(
            JSBI.multiply(
              reserve0,
              decimalsFEDlpToken
            ),
            JSBI.subtract(
              accRewardPerUSDDGlobal,
              lastReceivedRewardPerUSDDofPair
            )
          ),
          usddDecimals
        ),
        totalSupply
      )
    )
  }

  const res = JSBI.divide(
    JSBI.multiply(
      poolTokenAmount.raw,
      JSBI.subtract(
        accRewardPerFEDlpofPair,
        userRewardDebtPerFEDlp
      )
    ),
    decimalsFEDlpToken
  )
  return new TokenAmount(fed, res)
}
