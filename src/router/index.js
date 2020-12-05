import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path:'/convert',
    component: resolve => require(['../views/convert.vue'], resolve)
  },
  {
    path: '/',
    redirect: '/pool'
  },
  {
    path: '/swap',
    component: resolve => require(['../views/swap.vue'], resolve)
  },
  {
    path: '/pool',
    component: resolve => require(['../views/pool.vue'], resolve)
  },
  {
    path: '/lend',
    component: resolve => require(['../views/lend.vue'], resolve)
  },
  {
    path: '/add-liquidity',
    component: resolve => require(['../views/add-liquidity.vue'], resolve)
  },
  {
    path: '/harvest-liquidity',
    component: resolve => require(['../views/harvest-liquidity.vue'], resolve)
  },
  {
    path: '/remove-liquidity',
    component: resolve => require(['../views/remove-liquidity.vue'], resolve)
  },
  {
    path: '/recover-credit',
    component: resolve => require(['../views/recover-credit.vue'], resolve)
  },
  {
    path: '/migrate-liquidity',
    component: resolve => require(['../views/migrate-liquidity.vue'], resolve)
  },
  {
    path: '/import-liquidity',
    component: resolve => require(['../views/import-liquidity.vue'], resolve)
  },
  {
    path: '/mint',
    component: resolve => require(['../views/mint.vue'], resolve)
  },
  {
    path: '/import-mortgage',
    component: resolve => require(['../views/import-mortgage.vue'], resolve)
  },
  {
    path: '/not-fond',
    component: resolve => require(['../views/notFound'], resolve)
  },
  {
    path: '*',
    redirect: '/not-fond'
  }
]
const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
