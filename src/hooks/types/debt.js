import { JSBI } from '@uniswap/sdk'
import TokenAmount from './tokenAmount'
import { isSameAddress } from '../../utils/index'
import { liquidationPoint } from '../utils'

export default class DebtInfo {
  mapData
  arrayData

  constructor(debtsMap) {
    this.mapData = debtsMap
    this.arrayData = []
    for (const d of debtsMap.values()) {
      this.arrayData.push(d)
    }
  }

  allData() {
    return this.arrayData
  }

  isEmpty() {
    return this.arrayData.length === 0
  }

  getUserDebts(userAddress) {
    return this.arrayData.filter(d => isSameAddress(d.owner, userAddress))
  }

  sortByTokenPoint(usddReserve, tokenReserve) {
    const sortedList = this.arrayData.sort((a, b) => {
      const [xbeginA] = liquidationPoint(usddReserve, tokenReserve, a.pledgeAmount.raw, a.repayAmount.raw)
      const [xbeginB] = liquidationPoint(usddReserve, tokenReserve, b.pledgeAmount.raw, b.repayAmount.raw)
      return JSBI.greaterThan(xbeginA, xbeginB) ? 1 : -1
    })
    return this._deepCopy(sortedList)
  }

  sortByUSDDPoint(usddReserve, tokenReserve) {
    const sortedList = this.arrayData.sort((a, b) => {
      const [, ybeginA] = liquidationPoint(usddReserve, tokenReserve, a.pledgeAmount.raw, a.repayAmount.raw)
      const [, ybeginB] = liquidationPoint(usddReserve, tokenReserve, b.pledgeAmount.raw, b.repayAmount.raw)
      return JSBI.greaterThan(ybeginA, ybeginB) ? 1 : -1
    })
    return this._deepCopy(sortedList)
  }

  // TODO:Not a good solution
  _deepCopy(arrayData) {
    const res = []
    for (const d of arrayData) {
      const t = {
        id: d.id,
        pledgeAmount: new TokenAmount(d.pledgeAmount.token, d.pledgeAmount.raw),
        repayAmount: new TokenAmount(d.repayAmount.token, d.repayAmount.raw),
        owner: d.owner,
        pairAddress: d.pairAddress
      }
      res.push(t)
    }
    return res
  }
}
