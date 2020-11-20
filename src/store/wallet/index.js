import { state } from './state'
import { mutations } from './mutation'
import { actions } from './action'
import getters from './getter'

export const moduleWallet = {
  namespaced : true,
  state,
  mutations,
  actions,
  getters
};
