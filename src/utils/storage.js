import { INIT_DATA } from '../constants/index'

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

