
import Vue from 'vue'
import Vuex from 'vuex';
import { moduleWallet} from './wallet'
import { moduleBase } from './base'
import { moduleLiquidity } from './liquidity'

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== "production";

const Store = new Vuex.Store({
  strict: debug,
  state: {},
  modules: {
    moduleBase,
    moduleWallet,
    moduleLiquidity
  }
});
export default Store
