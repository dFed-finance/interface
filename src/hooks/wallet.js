import { getUSDDContract, getPairContract } from './contract'
import { INDEX_ADDRESS, USDD_ADDRESS } from '../constants/index'
import Jazzicon from 'jazzicon'
import UncheckedJsonRpcSigner from "./signer"
// import WalletConnectProvider from "@walletconnect/web3-provider";
import { WALLET_TYPE } from '../constants/wallet'
import { walletconnect, injected } from "../connector/index";
import { providers } from "ethers";

let connector;
let provider = null;

export function getIcon(account) {
  return Jazzicon(16, parseInt(account.slice(2, 10), 16))
}

// If error return the error message
export async function connectWallet(walletType, callAccountsChanged, callChainChanged, callDisconnect) {
  let abstracConnector;
  // instance a wallet
  switch (walletType) {
    case WALLET_TYPE.MetaMask:
      abstracConnector = injected;
      break;
    case WALLET_TYPE.WalletConnect:
      abstracConnector = walletconnect;
      break;
    default:
  }
  connector = abstracConnector;
  // connet to wallet
  await connector.activate()
  provider = await connector.getProvider()
  // get web3Provider
  provider = new providers.Web3Provider(provider);
  return connector;
}

export function getChainId() {
  console.log(connector.getChainId())
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

function getDefaultProvider() {
  if (provider === null) {
    throw new Error('No wallet found')
  }
  return provider
}

export function getProviderOrSigner(singer = false) {
  const library = getDefaultProvider()
  return singer ? new UncheckedJsonRpcSigner(library.getSigner()) : library
}


