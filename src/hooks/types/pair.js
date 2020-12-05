import { Pair as UPair, Token, JSBI, InsufficientReservesError, InsufficientInputAmountError } from '@uniswap/sdk'
import TokenAmount from './tokenAmount'
import invariant from 'tiny-invariant'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'
import { CREATOR_ADDRESS, INIT_CODE_HASH, USDD_ADDRESS, FEE, FEE_BASE, POOLTOKEN_DECIMALS } from '../../constants/index'
import { isSameAddress } from "../../utils/index"

const PREFIX = 'FEDLP'

export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)
export const _fee = JSBI.BigInt(FEE_BASE - FEE)
export const _feeBase = JSBI.BigInt(FEE_BASE)

export function sqrt(y) {
  let z = ZERO
  let x
  if (JSBI.greaterThan(y, THREE)) {
    z = y
    x = JSBI.add(JSBI.divide(y, TWO), ONE)
    while (JSBI.lessThan(x, z)) {
      z = x
      x = JSBI.divide(JSBI.add(JSBI.divide(y, x), x), TWO)
    }
  } else if (JSBI.notEqual(y, ZERO)) {
    z = ONE
  }
  return z
}

export default class Pair extends UPair {
  static getAddress(tokenA, tokenB) {
    const tokens = [tokenA, tokenB]
    return getCreate2Address(
      CREATOR_ADDRESS,
      keccak256(['bytes'], [pack(['address', 'address'], [tokens[0].address, tokens[1].address])]),
      INIT_CODE_HASH
    )
  }

  // make sure USDD is always the first token
  constructor(tokenAmountA, tokenAmountB) {
    super(tokenAmountA, tokenAmountB)
    // fix to contract, the first token is stable token
    const tokenAmounts = [tokenAmountA, tokenAmountB]
    const liquidTokenSymbol = PREFIX.concat('-', tokenAmountB.token.symbol)
    this.liquidityToken = new Token(
      tokenAmounts[0].token.chainId,
      Pair.getAddress(tokenAmounts[0].token, tokenAmounts[1].token),
      POOLTOKEN_DECIMALS,
      liquidTokenSymbol,
      liquidTokenSymbol
    )
    this.tokenAmounts = tokenAmounts
  }

  getOutputAmount(inputAmount) {
    invariant(this.involvesToken(inputAmount.token), 'TOKEN')
    if (JSBI.equal(this.reserve0.raw, ZERO) || JSBI.equal(this.reserve1.raw, ZERO)) {
      throw new InsufficientReservesError()
    }
    const inputReserve = this.reserveOf(inputAmount.token)
    const outputReserve = this.reserveOf(inputAmount.token.equals(this.token0) ? this.token1 : this.token0)

    let outputAmount
    if (isSameAddress(inputAmount.token.address, USDD_ADDRESS)) {
      const inputAmountWithFee = JSBI.multiply(inputAmount.raw, _fee)
      const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.raw)
      const denominator = JSBI.add(JSBI.multiply(inputReserve.raw, _feeBase), inputAmountWithFee)
      outputAmount = new TokenAmount(
        this.token1,
        JSBI.divide(numerator, denominator)
      )
      if (JSBI.equal(outputAmount.raw, ZERO)) {
        throw new InsufficientInputAmountError()
      }
    } else {
      const numerator = JSBI.multiply(inputAmount.raw, outputReserve.raw)
      const denominator = JSBI.add(inputReserve.raw, inputAmount.raw)
      outputAmount = new TokenAmount(
        this.token0,
        JSBI.divide(
          JSBI.divide(
            JSBI.multiply(
              numerator,
              _fee
            ),
            denominator
          ),
          _feeBase
        )
      )
      if (JSBI.equal(outputAmount.raw, ZERO)) {
        throw new InsufficientInputAmountError()
      }
    }
    return [outputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
  }

  getInputAmount(outputAmount) {
    invariant(this.involvesToken(outputAmount.token), 'TOKEN')
    if (
      JSBI.equal(this.reserve0.raw, ZERO) ||
      JSBI.equal(this.reserve1.raw, ZERO) ||
      JSBI.greaterThanOrEqual(outputAmount.raw, this.reserveOf(outputAmount.token).raw)
    ) {
      throw new InsufficientReservesError()
    }

    const outputReserve = this.reserveOf(outputAmount.token)
    const inputReserve = this.reserveOf(outputAmount.token.equals(this.token0) ? this.token1 : this.token0)

    let inputAmount
    if (isSameAddress(outputAmount.token.address, USDD_ADDRESS)) {
      const outputAmountWithFee = JSBI.divide(JSBI.multiply(outputAmount.raw, _feeBase), _fee)
      const numerator = JSBI.multiply(outputAmountWithFee, inputReserve.raw)
      const denominator = JSBI.subtract(outputReserve.raw, outputAmountWithFee)
      const raw = JSBI.divide(numerator, denominator)
      inputAmount = new TokenAmount(
        this.token1,
        raw
      )
    } else {
      const numerator = JSBI.multiply(outputAmount.raw, inputReserve.raw)
      const denominator = JSBI.subtract(outputReserve.raw, outputAmount.raw)
      const raw = // JSBI.multiply(JSBI.divide(JSBI.divide(numerator, denominator), _fee), _feeBase)
      JSBI.add(
        JSBI.divide(
          JSBI.divide(
            JSBI.multiply(
              numerator,
              _feeBase
            ),
            denominator
          ),
          _fee
        ),
        ONE
      )
      inputAmount = new TokenAmount(
        this.token0,
        raw
      )
    }
    return [inputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
  }

  getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB) {
    invariant(totalSupply.token.equals(this.liquidityToken), 'LIQUIDITY')
    const tokenAmounts = [tokenAmountA, tokenAmountB]
    invariant(tokenAmounts[0].token.equals(this.token0) && tokenAmounts[1].token.equals(this.token1), 'TOKEN')

    let liquidity
    if (JSBI.equal(totalSupply.raw, ZERO)) {
      liquidity = JSBI.subtract(sqrt(JSBI.multiply(tokenAmounts[0].raw, tokenAmounts[1].raw)), MINIMUM_LIQUIDITY)
    } else {
      const amount0 = JSBI.divide(JSBI.multiply(tokenAmounts[0].raw, totalSupply.raw), this.reserve0.raw)
      const amount1 = JSBI.divide(JSBI.multiply(tokenAmounts[1].raw, totalSupply.raw), this.reserve1.raw)
      liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1
    }
    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new Error('Insufficient reserves')
    }
    return new TokenAmount(this.liquidityToken, liquidity)
  }
}
