import { JSBI } from '@uniswap/sdk'
import { sqrt } from '../hooks/types/pair'

export function liquidationPoint(rx, ry, dx, dy) {
  const a = dy
  const b = JSBI.multiply(dx, dy)
  const c = JSBI.multiply(JSBI.multiply(rx, ry), dx)
  const delta = JSBI.add(JSBI.multiply(b, b), JSBI.multiply(JSBI.multiply(a, c), JSBI.BigInt(4)))
  const x = JSBI.divide(JSBI.subtract(sqrt(delta), b), JSBI.multiply(a, JSBI.BigInt(2)))
  // TODO: how to handle this case?
  if (JSBI.equal(x, JSBI.BigInt(0))) {
    return [JSBI.BigInt(0), JSBI.BigInt(0), JSBI.BigInt(0), JSBI.BigInt(0)]
  }
  const y = JSBI.divide(JSBI.multiply(rx, ry), x)

  return [x, y, JSBI.add(x, dx), JSBI.subtract(y, dy)]
}
