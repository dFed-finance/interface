import { shortenAddress } from "../../utils/index";
const getters = {
  chainName(state) {
    switch (Number(state.chainId)) {
      case 1:
        return 'MainNet'
      case 3:
        return 'Ropsten'
      // case '0x4':
      //   return 'Rinkeby'
      // case '0x5':
      //   return 'Goerli'
      // case '0x2a':
      //   return 'Kovan'
      case 666:
        return 'dFed Test Net'
      default:
        return 'Unknown'
    }
  },

  chainIdNumber(state) {
    return parseInt(state.chainId.toString())
  },

  shortAddress(state) {
    if(state.hasConnected) {
      return shortenAddress(state.currentAccount)
    }
    return "";
  }
}

export default getters
