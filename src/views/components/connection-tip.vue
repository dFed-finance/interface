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
            @click="handleConnect(walletType.MetaMask)"
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
            @click="handleConnect(walletType.WalletConnect)"
          >
            <span>
              <span class="status" :class="currentAccount ? 'open':'close'" />
              WalletConnect
            </span>
            <icon name="walletconnect" class-name="f_s18" />
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
import { WALLET_TYPE } from "constants/wallet"
import { ConnectorEvents } from '../../connector/base/types'
import { getWallet, setWallet } from '../../utils/storage'
// import { ChainId } from "@uniswap/sdk";
const moduleWallet = namespace("moduleWallet");

@Component({})
export default class ConnectionTip extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleWallet.Mutation("setAccount") setAccount;
  @moduleWallet.Mutation("setChainId") setChainId;
  @moduleWallet.Mutation("setCurrentWallet") setCurrentWallet;
  @moduleWallet.State("currentWallet") currentWallet;
  @moduleWallet.Mutation("setConnected") setConnected;
  @moduleWallet.State("hasConnected") hasConnected;

  @Prop({default:false})
  dialogVisible

  @Prop({default:true})
  connectLoading

  walletType = WALLET_TYPE

  created() {
    const cacheWallet = getWallet();
    if(cacheWallet !== WALLET_TYPE.Unknown) {
      this.handleConnect(cacheWallet)
    }
  }

  async handleConnect(walletType = this.walletType.MetaMask) {
    const connector = await connectWallet(walletType);
    this.setCurrentWallet(walletType)
    setWallet(walletType)

    // add wallet event listener
    connector.on(ConnectorEvents.Update, this.update);
    connector.on(ConnectorEvents.Deactivate, this.deactivate);
    connector.on(ConnectorEvents.Error, this.error);

    const account = await connector.getAccount()
    const chainId = await connector.getChainId()

    this.setAccount(account)
    this.setChainId(Number(chainId))
    this.setConnected(true)
  }

  update(e) {
    if(e.chainId){
      this.setChainId(Number(e.chainId))
    } else {
      this.setAccount(e.account)
    }
  }

  deactivate(e) {
    console.log("Disconnet from wallet: ", e)
    this.setConnected(false);
    this.setAccount("")
    this.setChainId("")
    setWallet(WALLET_TYPE.Unknown)
  }

  error(e) {
    console.log("Error", e)
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
