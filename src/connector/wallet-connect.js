import { BaseConnector } from './base/base-connector'
import WalletConnectProvider from '@walletconnect/web3-provider'

export const URI_AVAILABLE = 'URI_AVAILABLE'

export class UserRejectedRequestError extends Error {
  constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

export class WalletConnectConnector extends BaseConnector {
  infuraId
  rpc
  bridge
  qrcode
  pollingInterval
  walletConnectProvider

  constructor(infuraId, rpc, bridge, qrcode, pollingInterval) {
    // only support mainnet
    super([1])

    this.infuraId = infuraId
    this.rpc = rpc
    this.bridge = bridge
    this.qrcode = qrcode
    this.pollingInterval = pollingInterval

    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
    this.handleDisconnect = this.handleDisconnect.bind(this)
  }

  handleChainChanged(chainId) {
    super.emitUpdate({ chainId })
  }

  handleAccountsChanged(accounts) {
    super.emitUpdate({ account: accounts[0] })
  }

  handleDisconnect() {
    super.emitDeactivate()
    // we have to do this because of a @walletconnect/web3-provider bug
    if (this.walletConnectProvider) {
      this.walletConnectProvider.stop()
      this.walletConnectProvider.removeListener('chainChanged', this.handleChainChanged)
      this.walletConnectProvider.removeListener('accountsChanged', this.handleAccountsChanged)
      this.walletConnectProvider = undefined
    }

    super.emitDeactivate()
  }

  async activate() {
    if (!this.walletConnectProvider) {
      this.walletConnectProvider = new WalletConnectProvider({
        infuraId: this.infuraId,
        bridge: this.bridge,
        rpc: this.rpc,
        qrcode: this.qrcode,
        pollingInterval: this.pollingInterval
      })
    }

    // ensure that the uri is going to be available, and emit an event if there's a new uri
    // if (!this.walletConnectProvider.wc.connected) {
    //   await this.walletConnectProvider.wc.createSession({ chainId: Number(Object.keys(this.rpc)[0]) })
    //   super.emit(URI_AVAILABLE, this.walletConnectProvider.wc.uri)
    // }

    const account = await this.walletConnectProvider
      .enable()
      .then(accounts => accounts[0])
      .catch(error => {
        // TODO ideally this would be a better check
        if (error.message === 'User closed modal') {
          throw new UserRejectedRequestError()
        }

        throw error
      })

    this.walletConnectProvider.on('disconnect', this.handleDisconnect)
    this.walletConnectProvider.on('chainChanged', this.handleChainChanged)
    this.walletConnectProvider.on('accountsChanged', this.handleAccountsChanged)

    return { provider: this.walletConnectProvider, account }
  }

  async getProvider() {
    console.log(this.walletConnectProvider)
    return this.walletConnectProvider
  }

  async getChainId() {
    return this.walletConnectProvider.send('eth_chainId')
  }

  async getAccount() {
    return this.walletConnectProvider.send('eth_accounts').then(accounts => accounts[0])
  }

  deactivate() {
    if (this.walletConnectProvider) {
      this.walletConnectProvider.stop()
      this.walletConnectProvider.removeListener('disconnect', this.handleDisconnect)
      this.walletConnectProvider.removeListener('chainChanged', this.handleChainChanged)
      this.walletConnectProvider.removeListener('accountsChanged', this.handleAccountsChanged)
      this.walletConnectProvider = undefined
    }
  }

  async close() {
    await this.walletConnectProvider.close()
  }
}
