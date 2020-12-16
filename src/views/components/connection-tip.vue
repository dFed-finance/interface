<template>
  <div class="connection-tip" v-loading="connectLoading">
    <el-dialog
      title="Connect Wallet"
      v-if="dialogVisible && !connectLoading"
      :visible.sync="dialogVisible"
      :show-close="false"
      :modal="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      custom-class="fe-dialog"
    >
      <div class="wallet-list-wrap">
        <ul>
          <li
            class="flex-row-between-center m_b20"
            :class="{active:true}"
            @click="handleConnect('metamask')"
          >
            <span>
              <span class="status" :class="currentAccount ? 'open':'close'" />
              MetaMask
            </span>
            <icon name="metamask" class-name="f_s18" />
          </li>

          <li
            class="flex-row-between-center m_b20"
            :class="{active:true}"
            @click="handleConnect('walletconnect')"
          >
            <span>
              <span class="status" :class="currentAccount ? 'open':'close'" />
              WalletConnect
            </span>
            <img class="wallet-img" src="~assets/img/wallet-connect.png" />
          </li>
        </ul>
        <p class="m_t10 text-center color-666">Note: Please select the right network.</p>
        <p class="m_t10 text-center color-666">
          New to Ethereum?
          <a href="https://ethereum.org/wallets/">Learn more about wallet</a>
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Component, Vue, Prop } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { connectWallet } from "hooks/wallet";
const moduleWallet = namespace("moduleWallet");

@Component({})
export default class ConnectionTip extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;

  @Prop({default:false})
  dialogVisible

  @Prop({default:true})
  connectLoading


  handleConnect(walletType = 'metamask') {
    connectWallet(walletType).catch(err => {
      console.error(err);
    })
  }
}
</script>
<style lang="scss" scoped>
.wallet-list-wrap{
  min-height: 380px;
  ul{
    min-height: 300px;
  }
  li{
    padding: 0 15px;
    height: 46px;
    line-height: 46px;
    background: $white;
    border: solid 1px $borderColor;
    border-radius: 16px;
    font-weight: bold;
    cursor: pointer;
    &:hover{
      background: $lightBgColor;
    }
    &.active{
      background: $lightBorderColor;
    }
    .wallet-img{
      width: 20px;
    }
    .status{
      display: inline-block;
      border-radius: 50%;
      width: 6px;
      height: 6px;
      &.open{
        background: #0f0;
      }
      &.close{
        background: $lightTextColor;
      }
    }
  }
}
</style>
<style lang="scss" scoped>
.connection-tip{
  overflow: hidden;
  margin: 40px;
  min-height: 400px;
  border-radius: 20px;
  /deep/.el-loading-mask{
    background: rgba($white,.4);
  }
}
.connection-tip .el-dialog__wrapper{
  z-index: 900!important;
}
@media screen and (max-width: 500px) {
  .connection-tip{
    margin: 0;
    margin-top: 10px;
  }
}
</style>
