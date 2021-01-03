import { NETWORK_URL, INFURA_ID } from "../constants/index"
import { WalletConnectConnector } from "../connector/wallet-connect"
import { InjectedConnector } from "../connector/injected"

// WalletConnector
export const walletconnect = new WalletConnectConnector(INFURA_ID, { 1: NETWORK_URL }, 'https://bridge.walletconnect.org', true, 15000)

// MetaMask or other injected wallet
export const injected = new InjectedConnector([1, 3])
