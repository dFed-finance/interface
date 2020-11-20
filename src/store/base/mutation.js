export const mutations = {
  setSettingData(state, data) {
    state[data.fieldName] = data.value
  },
  setAllTokenList(state, payload) {
    const d = Object.keys(payload).map(key=>{
      return {
        address:key,
        ...payload[key]
      }
    })
    state.allTokenList = d
  }
}
