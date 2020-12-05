import { TokenAmount as UTokenAmount, Rounding, JSBI } from '@uniswap/sdk'

const _base = JSBI.BigInt(1000000)
const _10000000 = JSBI.BigInt(10000000)
const _100000000 = JSBI.BigInt(100000000)
const _1000000000 = JSBI.BigInt(1000000000)
const _10000000000 = JSBI.BigInt(10000000000)
const _100000000000 = JSBI.BigInt(100000000000)
const _1000000000000 = JSBI.BigInt(1000000000000)
const _10000000000000 = JSBI.BigInt(10000000000000)
const _100000000000000 = JSBI.BigInt(100000000000000)


function significantPlace(val) {
  if (JSBI.lessThan(val, _base)) {
    return 6
  }
  if (JSBI.greaterThanOrEqual(val, _base) && JSBI.lessThan(val, _10000000)) {
    return 7
  }
  if (JSBI.greaterThanOrEqual(val, _10000000) && JSBI.lessThan(val, _100000000)) {
    return 8
  }
  if (JSBI.greaterThanOrEqual(val, _100000000) && JSBI.lessThan(val, _1000000000)) {
    return 9
  }
  if (JSBI.greaterThanOrEqual(val, _1000000000) && JSBI.lessThan(val, _10000000000)) {
    return 10
  }
  if (JSBI.greaterThanOrEqual(val, _10000000000) && JSBI.lessThan(val, _100000000000)) {
    return 11
  }
  if (JSBI.greaterThanOrEqual(val, _100000000000) && JSBI.lessThan(val, _1000000000000)) {
    return 12
  }
  if (JSBI.greaterThanOrEqual(val, _1000000000000) && JSBI.lessThan(val, _10000000000000)) {
    return 13
  }
  if (JSBI.greaterThanOrEqual(val, _10000000000000) && JSBI.lessThan(val, _100000000000000)) {
    return 14
  }
}

export default class TokenAmount extends UTokenAmount {
  toSignificant(
    significantDigits = 6,
    format,
    rounding = Rounding.ROUND_DOWN
  ) {
    const val = JSBI.divide(this.numerator, this.denominator)
    return super.toSignificant(significantPlace(val), format, rounding)
  }
}

