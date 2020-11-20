<template>
  <div class="wrap lend-wrap">
    <HcoFunction activeTab="lend">
      <div slot="content" class="lend-content content">
        <div class="flex-row-between-center m_b40">
          <span class="title">Your Debts</span>
          <el-button round class="w_150" type="primary" @click="$router.push('/mint')">Mint USDD</el-button>
        </div>
        <Loading v-if="loading" />
        <LendList
          v-else-if="lendListData.length"
          :data="lendListData"
          @callback="handleClickCallback"
          @approveCallback="handleApproveCallback"
        />
        <div v-else class="text-center p_t20">No debts found. </div>
      </div>
    </HcoFunction>
    <p class="m_t10 color-666">
      Don't see your mortgage?
      <el-button type="text" @click="$router.push('/import-mortgage')">Import it.</el-button>
    </p>
  </div>
</template>
<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import HcoFunction from "./components/hco-function";
import Loading from "components/loading.vue";
import LendList from "./components/lend/lend-list.vue";
import { getToken } from "../utils/storage";
import { STORE_DEBTS } from "../constants/index";
import { getNetworkId, signPermitMessage } from "../hooks/wallet";
import { Token } from "@uniswap/sdk";
import { getUSDDTokenStatic, getPairFromToken } from "../hooks/token";
import { getAllDebt, repay } from "../hooks/debt";
import { timeTo } from "../utils/index";
import { splitSignature } from "@ethersproject/bytes";

const moduleWallet = namespace("moduleWallet");
const moduleBase = namespace("moduleBase");

@Component({
  components: {
    HcoFunction,
    Loading,
    LendList
  }
})
export default class Lend extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleBase.State("deadline") deadline;

  loading = true;
  lendListData = [];
  signature = undefined;
  isApproved = false;
  approveAmount = undefined;

  async created() {
    this.loading = true;
    const networkId = getNetworkId();
    // Tokens from user's local cache
    const allTrackedTokens = getToken(STORE_DEBTS)[networkId];
    if (!allTrackedTokens || allTrackedTokens.length === 0) {
      this.loading = false;
      return;
    }
    // Resolve all token string to Token obj
    const parsedTokens = allTrackedTokens.map(token => {
      return new Token(
        Number(networkId),
        token.address,
        token.decimals,
        token.symbol,
        token.name
      );
    });

    for (const token of parsedTokens) {
      const usdd = getUSDDTokenStatic();
      const pair = await getPairFromToken(usdd,token)
      const pairAddress = pair.liquidityToken.address;
      getAllDebt(pairAddress, token).then(debtInfo => {
        const userDebts = debtInfo.getUserDebts(this.currentAccount)
        for (const d of userDebts) {
          this.lendListData.push({
            name0: token.symbol,
            value0: d.pledgeAmount.toSignificant(),
            name1: "USDD",
            value1: d.repayAmount.toSignificant(),
            id: d.id.toString(),
            tokenAddress: token.address,
            permitValue: d.repayAmount.raw.toString(),
            pairAddress: d.pairAddress,
            btnStatus:0 // 0:not start 1:approve loading 2:approve sucess 3:repay loading 4:repay success
          });
        }
        this.loading = false;
      }).catch(()=>{
        this.loading = false;
      });
    }
  }

  handleClickCallback(data) {
    if(!this.isApproved){
      this.$message.warning("Please approve token first")
      return
    }
    // make sure repay with the right signature
    if(this.approveAmount !== data.permitValue) {
      this.$message.error("Approve failed")
      return
    }
    this.$set(data,'btnStatus',3)
    repay(
      getNetworkId(),
      data.tokenAddress,
      data.id,
      data.permitValue,
      this.signature.deadline,
      this.signature.v,
      this.signature.r,
      this.signature.s
    )
      .then(res => {
        this.$set(data,'btnStatus',4)
        window.location.reload()
      })
      .catch(err => {
        this.$set(data,'btnStatus',2)
        console.error(err);
      });
  }

  handleApproveCallback(data) {
    this.$set(data,'btnStatus',1)
    const usdd = getUSDDTokenStatic();
    const message = {
      tokenName: usdd.name,
      version: "1",
      chainId: getNetworkId().toString(),
      tokenAddress: usdd.address,
      owner: this.currentAccount,
      value: data.permitValue,
      deadline: timeTo(Number(this.deadline * 60))
    };

    signPermitMessage(message)
      .then(splitSignature)
      .then(signature => {
        this.signature = {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: message.deadline
        };
        this.$set(data,'btnStatus',2)
        this.isApproved = true;
        this.approveAmount = message.value
      })
      .catch(err => {
        console.error(err);
        this.$set(data,'btnStatus',0)
        this.$message.error("Failed to sign message");
      });
  }
}
</script>
<style lang="scss" scoped>
.lend-content {
  min-height: 210px;
}
</style>
