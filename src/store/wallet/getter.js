const getters = {
  chainID(state) {
    switch (state.chainId.toString()) {
      case '0x1':
        return 'MainNet'
      case '0x3':
        return 'Ropsten'
      // case '0x4':
      //   return 'Rinkeby'
      // case '0x5':
      //   return 'Goerli'
      // case '0x2a':
      //   return 'Kovan'
      case '0x29a':
        return 'dFed Test Net'
      default:
        return 'Unknown'
    }
  },

  chainIdNumber(state) {
    return parseInt(state.chainId.toString())
  }
}

export default getters
