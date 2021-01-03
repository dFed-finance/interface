<template>
  <div class="header-wrap">
    <div class="company c_pointer" @click="$router.push('/')">
      <img class="logo-img m_r10" src="~assets/img/dFed-Logo.png" />
      <span class="logo-text">dFed.finance</span>
    </div>
    <div class="account-and-setting">

      <el-tag v-if="currentAccount" type="warning" class="balance-fed m_b5 m_r10">{{balanceFed}} {{FEDNAME}}</el-tag>

      <el-tag type="success" class="m_b5" v-if="networkName">{{networkName}}</el-tag>

      <el-button
        round
        v-if="!hasConnected"
        size="medium"
        class="m_l10 m_b5"
        @click="handleConnect"
      >Connect to a wallet</el-button>
      <span class="c_pointer account m_b5">
        <el-tag class="ellipsis m_l10 w_max150" v-if="hasConnected">
          <div id="clipboard-btn"  :data-clipboard-text="currentAccount">
            {{address}}
            <span ref="icon" class="account-icon"></span>
          </div>
          <span class="tip">{{copyTipMsg}}</span>
        </el-tag>
      </span>

      <setting />

      <Menu />
    </div>
  </div>
</template>

<script>
import { Component, Vue, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import Clipboard from 'clipboard';
import { getIcon } from "hooks/wallet";
import Setting from "./setting.vue";
import Menu from "./menu.vue";
import { FED_ADDRESS, FEDNAME} from "constants/index";
import { getTokenBalance, getFedTokenStatic } from "../../../hooks/token"
import TokenAmount from '../../../hooks/types/tokenAmount'

const moduleWallet = namespace("moduleWallet");

@Component({
  components: {
    Setting,
    Menu
  }
})
export default class Header extends Vue {
  @moduleWallet.Getter("chainName") networkName;
  @moduleWallet.State("chainId") chainId;
  @moduleWallet.State("errorMessage") errorMessage;
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleWallet.Getter("shortAddress") shortAddress;
  @moduleWallet.Mutation("chainId") setChainId;

  FEDNAME = FEDNAME
  visiblePopoverSet = false;
  copyTipMsg = "Copy to clipboard"
  balanceFed = 0

  get hasConnected() {
    return this.currentAccount !== "";
  }

  get address() {
    return this.hasConnected ? this.shortAddress : "";
  }

  @Watch("errorMessage")
  errorMessageChange(nval) {
    this.$message.error({
      type: "error",
      message: nval
    });
  }

  @Watch("currentAccount")
  changeIcon(nval,oval) {
    this.$nextTick(() => {
      const iconHtml = this.$refs.icon;
      if (iconHtml) {
        iconHtml.innerHTML = "";
        iconHtml.appendChild(getIcon(this.currentAccount));
      }
      const clipboard = new Clipboard('#clipboard-btn');
      clipboard.on('success', (e) => {
        e.clearSelection();
      }).on('error', (e) => {
        this.$message.error('Copy failed')
      })
    });
    if(nval && !oval){
      this.copyAccount()
    }
  }

  @Watch("currentAccount")
  async getFed() {
    if(this.currentAccount){
      const fed = await getTokenBalance(FED_ADDRESS, this.currentAccount);
      const fedTokenAmount = new TokenAmount(getFedTokenStatic(this.chainId), fed);
      this.balanceFed = fedTokenAmount.toSignificant()
    }
  }

  created() {
  }

  mounted(){
    this.copyAccount()
  }

  copyAccount(){
    this.$nextTick(() => {
      const clipboard = new Clipboard('#clipboard-btn');
      clipboard.on('success', (e) => {
        this.copyTipMsg = "Copied"
        e.clearSelection();
        setTimeout(()=>{
          this.copyTipMsg = "Copy to clipboard"
        },2000)
      }).on('error', (e) => {
        this.$message.error('Copy failed')
      })
    });
  }

  handleConnect(walletType) {
    // This func should show the wallet tip page
  }
}
</script>
<style lang="scss" scoped>
.header-wrap {
  position: relative;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin: 0 auto;
  padding: 20px 0;
  .company {
    display: flex;
    align-items: center;
    .logo-img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 600;
    }
  }
  .account-and-setting {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
  }
  .balance-fed{
    line-height: 30px;
    min-width: 48px;
    text-align: center;
  }
  .account{
    position: relative;
    display: inherit;
    &:hover .tip{
      display: block;
    }
    .tip{
      display: none;
      position: absolute;
      left: 50%;
      top: 40px;
      background: $black;
      padding: 0 8px;
      border-radius: 4px;
      font-size: 12px;
      color: $white;
      transform: translateX(-50%);

      &::before{
        content: '';
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border: 6px solid;
        border-color: transparent transparent $black;
      }
    }
    .account-icon {
      display: inline-block;
      vertical-align: middle;
    }
  }
}
@media screen and (max-width: 500px) {
  .header-wrap {
    .company {
      .logo-text {
        display: none;
      }
    }
  }
}
</style>
