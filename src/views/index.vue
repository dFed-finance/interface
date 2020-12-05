<template>
  <div class="app-content clearfix relative">
    <MetaMask />
    <Web3Manager />
    <HeaderComponent />
    <ConnectionTip
      v-if="!connectedReady"
      :dialog-visible="!connectedReady"
      :connect-loading="connectLoading"
    />
    <div v-else class="main">
      <router-view :key="$route.path" />
    </div>
    <p class="footer">dFed.finance is a fully decentralized protocol, please use at your own risk.</p>
  </div>
</template>
<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import HeaderComponent from "./components/header/index.vue";
import MetaMask from "./components/metamask";
import Web3Manager from "./components/web3manager"
import ConnectionTip from "./components/connection-tip";
import { SUPPORT_CHAIN } from "constants/index";

const moduleWallet = namespace("moduleWallet");

@Component({
  components: {
    HeaderComponent,
    MetaMask,
    ConnectionTip,
    Web3Manager
  }
})
export default class Index extends Vue {
  @moduleWallet.State("chainId") chainId;
  @moduleWallet.State("currentAccount") currentAccount;

  get connectedReady() {
    return Number(SUPPORT_CHAIN) === Number(this.chainId) && this.currentAccount;
  }

  get connectLoading(){
    return this.chainId === '' || this.currentAccount === '';
  }
}
</script>
<style lang="scss" scoped>
.app-content {
  padding: 0 20px;
  min-height: 100vh;
  .main {
    box-sizing: border-box;
    margin: 40px auto 80px;
    padding: 30px;
    width: 100%;
    max-width: 640px;
    min-height: 400px;
    background: $white;
    box-shadow: 0 0 15px $borderColor;
    border-radius: 20px;
    .content {
      padding-top: 30px;
    }
  }
  .footer {
    box-sizing: border-box;
    position: absolute;
    bottom: 0;
    right: 0;
    left: 0;
    padding: 0 15px 30px;
    text-align: center;
    font-size: 16px;
    color: #666;
  }
}
@media screen and (max-width: 500px) {
  .app-content {
    .main {
      padding: 15px;
      margin-top: 10px;
    }
  }
}
</style>
<style lang="scss">
.app-content .main .content {
  padding-top: 30px;
}
</style>>
