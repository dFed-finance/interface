import ethers from 'ethers'

import FACTORY_ABI from '../constants/abis/factory'
import INDEX_ABI from '../constants/abis/index'
import TOKEN_ABI from '../constants/abis/erc20.json'
import USDD_ABI from '../constants/abis/usdd.json'
import PAIR_ABI from '../constants/abis/pair'
import { FACTORY_ADDRESSES, INDEX_ADDRESS } from '../constants'
import { isAddress } from '../utils/index'
import { getProviderOrSigner } from '../hooks/wallet'

export function getContract(address, ABI, singer = false) {
  if (!isAddress(address) || address === ethers.constants.AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new ethers.Contract(address, ABI, getProviderOrSigner(singer))
}

export function getFactoryContract(singer = false) {
  return getContract(FACTORY_ADDRESSES, FACTORY_ABI, singer)
}

export function getIndexContract(signer = false) {
  return getContract(INDEX_ADDRESS, INDEX_ABI, signer)
}

export function getTokenContract(tokenAddress, signer = false) {
  return getContract(tokenAddress, TOKEN_ABI, signer)
}

export function getUSDDContract(tokenAddress, signer = false) {
  return getContract(tokenAddress, USDD_ABI, signer)
}

export function getPairContract(pairAddress, signer = false) {
  return getContract(pairAddress, PAIR_ABI, signer)
}
