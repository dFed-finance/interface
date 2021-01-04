import { INFURA_ID, SUPPORT_CHAIN } from "../constants/index"
import { WalletConnectConnector } from "../connector/wallet-connect"
import { InjectedConnector } from "../connector/injected"

// WalletConnector
export const walletconnect = getWalletConnectConnector(SUPPORT_CHAIN, INFURA_ID)

function getWalletConnectConnector(chainId, infuraId) {
  let chainName;
  switch(Number(chainId)){
    case 1:
      chainName = "mainnet";
      break;
    case 3:
      chainName = "ropsten";
      break;
    default:
      chainName = "mainnet";
  }
  const url = `https://${chainName}.infura.io/v3/${infuraId}`
  const networkOption = {
    [Number(SUPPORT_CHAIN)]: url
  }
  return new WalletConnectConnector(INFURA_ID, networkOption, 'https://bridge.walletconnect.org', true, 15000)
}

// MetaMask or other injected wallet
export const injected = new InjectedConnector([1, 3])
