export const mutations = {
  metaMask(state, payload) {
    state.hasMetaMask = payload
  },

  setChainId(state, payload) {
    state.chainId = payload
  },

  provider(state, payload) {
    state.provider = payload
  },

  setConnected(state, payload) {
    state.hasConnected = payload
  },

  setAccount(state, payload) {
    state.currentAccount = payload
  },

  error(state, payload) {
    state.errorMessage = payload
  },

  setCurrentWallet(state, payload) {
    state.currentWallet = payload
  }
}

