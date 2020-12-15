
import { getUSDDContract, getPairContract } from './contract'
import { INDEX_ADDRESS, USDD_ADDRESS, INFURA_ID } from '../constants/index'
import { getProviderOrSigner } from '../utils/index'
import Jazzicon from 'jazzicon'
import WalletConnectProvider from "@walletconnect/web3-provider";
import { WALLET_TYPE } from '../constants/wallet'

export function getIcon(account) {
  return Jazzicon(16, parseInt(account.slice(2, 10), 16))
}

function metaMaskProvider() {
  return window.ethereum;
}

function walletConnectProvider() {
  return new WalletConnectProvider({
    infuraId: INFURA_ID
  });
}

// If error return the error message
export async function connectWallet(walletType) {
  let provider;
  switch (walletType) {
    case WALLET_TYPE.MetaMask:
      provider = metaMaskProvider();
      break;
    case WALLET_TYPE.WalletConnect:
      provider = walletConnectProvider();
      await provider.enable();
      break;
    default:
      provider = metaMaskProvider();
  }
  if (provider) {
    return new Promise((resolve, reject) => {
      provider.request({ method: 'eth_requestAccounts' }).then((response) => {
        resolve(response)
      }).catch((err) => {
        switch (err.code) {
          case 4001: case -32602: case -32603:
            reject(err.message)
            break
          default:
            reject(new Error('Unknown error'))
            break
        }
      })
    })
  } else {
    return new Promise((resolve, reject) => {
      reject(new Error('No wallet found'))
    })
  }
}

export function getChainId() {
  const provider = window.ethereum
  return provider.request({ method: 'eth_chainId' })
}

// Used to sign permit data
export async function signPermitMessage({ tokenName, version, chainId, tokenAddress, owner, value, deadline }) {
  const signer = getProviderOrSigner()
  // Permit message only support USDD token and liquidity token
  let contract
  tokenAddress === USDD_ADDRESS
    ? contract = getUSDDContract(tokenAddress)
    : contract = getPairContract(tokenAddress)
  const nonce = await contract.nonces(owner)

  const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ]
  const domain = {
    name: tokenName,
    version: version,
    chainId: chainId,
    verifyingContract: tokenAddress
  }
  const Permit = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
  const message = {
    owner: owner,
    spender: INDEX_ADDRESS,
    value: value,
    nonce: nonce.toHexString(),
    deadline: deadline
  }
  const data = JSON.stringify({
    types: {
      EIP712Domain,
      Permit
    },
    domain,
    primaryType: 'Permit',
    message
  })
  return signer.send('eth_signTypedData_v4', [owner, data])
}

export function getNetworkId() {
  return Number(window.ethereum.networkVersion)
}


