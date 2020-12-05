export const mutations = {
  metaMask(state, payload) {
    state.hasMetaMask = payload
  },

  chainId(state, payload) {
    state.chainId = payload
  },

  provider(state, payload) {
    state.provider = payload
  },

  connected(state, payload) {
    state.hasConnected = payload
  },

  account(state, payload) {
    state.currentAccount = payload
  },

  error(state, payload) {
    state.errorMessage = payload
  }
}
