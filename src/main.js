import Vue from 'vue'
import router from './router'
import store from './store'
import elementUi from 'element-ui'
import IconTip from 'components/icon-tip.vue'
import Icon from 'components/icon.vue'
import 'babel-polyfill'
import 'element-ui/lib/theme-chalk/index.css'
import 'assets/scss/reset.scss'
import 'assets/scss/base.scss'

import Index from './views/index.vue'

Vue.use(elementUi)
Vue.component('icon-tip', IconTip)
Vue.component('icon', Icon)

Vue.config.productionTip = false

router.beforeEach(async (to, from, next) => {
  next()
})

new Vue({
  router,
  store,
  render:h=>h(Index)
}).$mount('#app')
