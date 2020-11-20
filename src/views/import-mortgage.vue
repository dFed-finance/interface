<template>
  <div class="import-mortgage">
    <PageTitle page-title="Import Mortgage" :has-back="true" page-tip="Use this tool to find debts that don't automatically appear in the interface." />
    <div class="content p_t20">
      <SelectToken
        :token-list-source="allTokenList"
        :token="usddToken.address"
        :name="usddToken.symbol"
        :disabled="true"
      />
      <p class="flex-row-center m_t20 m_b20">
        <i class="el-icon-plus color-666" />
      </p>
      <SelectToken
        :token-list-source="allTokenList"
        :token="otherToken.address"
        :name="otherToken.symbol"
        placeholder="Select A Token"
        @change="changeToken"
      />

      <div class="result-content flex-colum-center m_t20"  v-loading="loading">
        <p v-if="!otherToken.address">Select a token to find your mortgage.</p>
        <template v-else>
          {{mortgageCount}} Mortgage Found
          <p class="c_pointer sk-text m_t10" @click="handleClickToLink">{{mortgageCount>0 ? 'Goto my debts' : 'Mint USDD'}}</p>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import PageTitle from "components/page-title.vue";
import SelectToken from "components/select-token.vue";
import { Token } from "@uniswap/sdk";
import { getUSDDTokenStatic, getPairFromToken } from "../hooks/token";
import { getNetworkId } from "../hooks/wallet";
import { getAllDebt } from "../hooks/debt";
import { storeToken } from "../utils/storage";
import { STORE_DEBTS } from "../constants/index";

const moduleWallet = namespace("moduleWallet");
const moduleBase = namespace("moduleBase");

@Component({
  components: {
    PageTitle,
    SelectToken
  }
})
export default class ImportMortgage extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleBase.State("allTokenList") allTokenList;

  loading = false;
  mortgageCount = 0;

  usddToken = {
    symbol: "USDD",
    address: ""
  };

  otherToken = {
    symbol: "",
    address: ""
  };

  created() {
    this.usddToken = getUSDDTokenStatic();
  }

  handleClickToLink(){
    if(this.mortgageCount > 0){
      this.$router.push('/lend')
    }else{
      this.$router.push({
        path:'/mint',
        query:{address:this.otherToken.address}
      })
    }
  }

  async changeToken(token) {
    const networkId = getNetworkId();
    this.otherToken = new Token(
      networkId,
      token.address,
      token.decimals,
      token.symbol,
      token.name
    );
    this.loading = true
    const pair = await getPairFromToken(this.usddToken, this.otherToken);
    const pairAddress = pair.liquidityToken.address;
    getAllDebt(pairAddress, token).then(debtInfo => {
      const userDebts = debtInfo.getUserDebts(this.currentAccount)
      this.mortgageCount = userDebts.length;
      if (this.mortgageCount > 0) {
        storeToken(STORE_DEBTS, this.otherToken, networkId);
      }
      this.loading = false;
    }).catch(err => {
      console.error(err)
      this.loading = false;
    })
  }
}
</script>
<style lang="scss" scoped>
.import-mortgage {
  /deep/.select-token .referance-btn {
    margin: 0;
    width: 100%;
    height: 48px;
    padding: 0 20px;
    span{
      text-align: left;
    }
  }
  .tit {
    padding-top: 20px;
    padding-bottom: 10px;
    text-align: center;
    font-weight: bold;
    font-size: 18px;
  }
  .result-content {
    box-sizing: border-box;
    min-height: 130px;
    border: solid 1px $lightBorderColor;
    border-radius: 16px;
    text-align: center;
  }
}
</style>
