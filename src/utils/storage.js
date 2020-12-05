import { INIT_DATA, DEFAULT_TOLERANCE, DEFAULT_DEADLINE } from '../constants/index'

const toleranceKey = "dfed_tolerance"
const deadlineKey = "dfed_deadline"


export function storeToken(key, token, chainId) {
  const storage = localStorage
  const curData = getToken(key)
  let exists = false
  curData[chainId].forEach(t => {
    if (t.address === token.address) {
      exists = true
    }
  })
  if (!exists) {
    curData[chainId].push({
      address: token.address,
      chainId: token.chainId,
      decimals: token.decimals,
      symbol: token.symbol,
      name: token.name
    })
    storage.setItem(key, JSON.stringify(curData))
  }
}

export function getToken(key) {
  const storage = localStorage
  const curData = storage.getItem(key)
  if (curData === null) {
    storage.setItem(key, JSON.stringify(INIT_DATA))
    return INIT_DATA
  } else {
    return JSON.parse(curData)
  }
}

export function getTolerance() {
  const storage = localStorage
  const cur = storage.getItem(toleranceKey)
  if (cur === null) {
    storage.setItem(toleranceKey, DEFAULT_TOLERANCE)
    return DEFAULT_TOLERANCE
  } else {
    return cur
  }
}

export function setTolerance(val) {
  const storage = localStorage
  storage.setItem(toleranceKey, val)
}

export function getDeadline() {
  const storage = localStorage
  const cur = storage.getItem(deadlineKey)
  if (cur === null) {
    storage.setItem(deadlineKey, DEFAULT_DEADLINE)
    return DEFAULT_DEADLINE
  } else {
    return cur
  }
}

export function setDeadline(val) {
  const storage = localStorage
  storage.setItem(deadlineKey, val)
}
