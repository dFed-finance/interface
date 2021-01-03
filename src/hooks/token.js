import ethers from 'ethers'
import Pair from './types/pair'
import ERC20_ABI from '../constants/abis/erc20'
import ERC20_BYTES32_ABI from '../constants/abis/erc20_bytes32'
import { USDD_ADDRESS, USDT_ADDRESS, FED_ADDRESS, FEDNAME, FED_DECIMALS, APPROVE_MAX, USDX_DECIMALS } from '../constants/index'
import { isAddress, calculateGasMargin, tryParseAmount } from '../utils/index'
import { getContract, getFactoryContract, getPairContract, getTokenContract, getUSDDContract } from './contract'
import { Token } from '@uniswap/sdk'
import TokenAmount from '../hooks/types/tokenAmount'
import { getProviderOrSigner } from './wallet'
import { MaxUint256 } from '@ethersproject/constants'

// Get USDD token object without network.
export function getUSDDTokenStatic(chainId) {
  return new Token(chainId, USDD_ADDRESS, USDX_DECIMALS, 'USDD', 'USDD')
}

// Get USDT token object without network.
export function getUSDTTokenStatic(chainId) {
  return new Token(chainId, USDT_ADDRESS, USDX_DECIMALS, 'USDT', 'USDT')
}

// Get Fed token object without network.
export function getFedTokenStatic(chainId) {
  return new Token(chainId, FED_ADDRESS, FED_DECIMALS, FEDNAME, FEDNAME)
}

// Get token info from network.
export async function getTokenDetails(chainId = 1, tokenAddress = USDD_ADDRESS) {
  if (!isAddress(tokenAddress)) {
    throw new Error('Invalid token address')
  }
  if (tokenAddress === USDD_ADDRESS) {
    return getUSDDTokenStatic(chainId)
  }

  const name = await getTokenName(tokenAddress).catch(() => null)
  const symbol = await getTokenSymbol(tokenAddress).catch(() => null)
  const decimals = await getTokenDecimals(tokenAddress).catch(() => null)
  return new Token(chainId, tokenAddress, decimals, symbol, name)
}

// Get pair info form network
export async function getPairFromToken(tokenA, tokenB, pairAddress = undefined) {
  if (pairAddress === undefined) {
    const tokenAmountA = tryParseAmount("0", tokenA)
    const tokenAmountB = tryParseAmount("0", tokenB)
    return new Pair(tokenAmountA, tokenAmountB)
  }
  const [reserves0, reserves1] = await getPairContract(pairAddress).getReserves()
  const balances = [reserves0, reserves1]
  return new Pair(new TokenAmount(tokenA, balances[0]), new TokenAmount(tokenB, balances[1]))
}

// get token name
export async function getTokenName(tokenAddress) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI)
    .name()
    .catch(() =>
      getContract(tokenAddress, ERC20_BYTES32_ABI)
        .name()
        .then(bytes32 => ethers.utils.parseBytes32String(bytes32))
    )
    .catch(error => {
      throw error
    })
}

// get token symbol
export async function getTokenSymbol(tokenAddress) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI)
    .symbol()
    .catch(() => {
      const contractBytes32 = getContract(tokenAddress, ERC20_BYTES32_ABI)
      return contractBytes32.symbol().then(bytes32 => ethers.utils.parseBytes32String(bytes32))
    })
    .catch(error => {
      throw error
    })
}

// get token decimals
export async function getTokenDecimals(tokenAddress) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI)
    .decimals()
    .catch(error => {
      throw error
    })
}

// get the ether balance of an address
export async function getEtherBalance() {
  const singer = getProviderOrSigner(true)
  return singer.getBalance()
}

// get the token balance of an address
export async function getTokenBalance(tokenAddress, address) {
  if (!isAddress(tokenAddress) || !isAddress(address)) {
    throw Error(`Invalid 'tokenAddress' or 'address' parameter '${tokenAddress}' or '${address}'.`)
  }
  return getContract(tokenAddress, ERC20_ABI).balanceOf(address)
}

// Query allowance state
export async function getTokenAllowance(tokenAddress, userAddress, spenderAddress) {
  if (!isAddress(userAddress) || !isAddress(tokenAddress) || !isAddress(spenderAddress)) {
    throw Error(
      "Invalid 'address' or 'tokenAddress' or 'spenderAddress' parameter" +
      `'${userAddress}' or '${tokenAddress}' or '${spenderAddress}'.`
    )
  }

  return getTokenContract(tokenAddress, false).allowance(userAddress, spenderAddress)
}

// Approve token
export async function approveToken(tokenAddress, spenderAddress, value) {
  if (!isAddress(tokenAddress) || !isAddress(spenderAddress)) {
    throw Error(
      "Invalid 'address' or 'tokenAddress' or 'spenderAddress' parameter" +
      `'${tokenAddress}' or '${spenderAddress}'.`
    )
  }

  const approveVal = APPROVE_MAX ? MaxUint256 : value
  const gas = await getTokenContract(tokenAddress, true).estimateGas.approve(spenderAddress, approveVal)
  const gasLimit = calculateGasMargin(gas)
  return getTokenContract(tokenAddress, true).approve(spenderAddress, approveVal, {
    gasLimit: gasLimit
  })
}

export async function convertUSDDToUSDT(amount) {
  const contract = getUSDDContract(USDD_ADDRESS, true)
  const gas = await contract.estimateGas.withdraw(amount)
  const gasLimit = calculateGasMargin(gas)
  return contract.withdraw(amount, {
    gasLimit: gasLimit
  })
}

export async function convertUSDTToUSDD(to, amount) {
  const contract = getUSDDContract(USDD_ADDRESS, true)
  const gas = await contract.estimateGas.deposit(to, amount)
  const gasLimit = calculateGasMargin(gas)
  return contract.deposit(to, amount, {
    gasLimit: gasLimit
  })
}

// Get all debts data
export async function getAllToken(networkId) {
  const contract = getFactoryContract(networkId)
  const logs = await contract.queryFilter("PairCreated")
  const allTokens = {}
  for (const l of logs) {
    const data = l.args
    allTokens[data.token] = {
      name: data.symbol,
      symbol: data.symbol,
      decimals: data.decimals
    }
  }
  return allTokens
}
