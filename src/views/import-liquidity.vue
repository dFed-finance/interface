<template>
  <div class="import-liquidity">
    <PageTitle
      page-title="Import Liquidity"
      :has-back="true"
      page-tip="Use this tool to find pairs that don't automatically appear in the interface."
    />
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
      <template v-if="otherToken.address&&hasPool&&hasLiquidity">
        <div class="tit">Pool Found</div>
        <div class="c_pointer sk-text text-center" @click="$router.push('/pool')">Manage this pool</div>
      </template>
      <div class="pool-content flex-colum-center m_t20" v-loading="loading">
        <p v-if="!otherToken.address">Select a token to find your liquidity.</p>
        <p class="flex-colum-center" v-else-if="!hasPool">
          <span class="f_s14">No pool found</span>
          <span class="sk-text m_t10 c_pointer" @click="$router.push('/add-liquidity')">Create pool</span>
        </p>
        <p class="flex-colum-center" v-else-if="!hasLiquidity">
          <span class="f_s14">You don't have liquidity in this pool yet</span>
          <span
            class="sk-text m_t10 c_pointer"
            @click="$router.push({path:'/add-liquidity',query:{type1:usddToken.address,type2:otherToken.address}})"
          >Add liquidity</span>
        </p>
        <div v-else class="pool-item flex-colum-center-start flex-1">
          <p class="text-left f_s16">Your position</p>
          <p class="flex-row-start-center">
            <span class="p_l10 p_r10 f_s20">{{usddToken.symbol}}/{{otherToken.symbol}}</span>
            <span class="flex-1 text-right f_s20 ellipsis">{{poolTokenAmount}}</span>
          </p>
          <p class="flex-row-between-center color-999">
            <span>Your pool share:</span>
            <span>{{share}}%</span>
          </p>
          <p class="flex-row-between-center color-999">
            <span>{{usddToken.symbol}}:</span>
            <span>{{usddAmount}}</span>
          </p>
          <p class="flex-row-between-center color-999">
            <span>{{otherToken.symbol}}:</span>
            <span>{{otherAmount}}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import PageTitle from "components/page-title.vue";
import SelectToken from "components/select-token.vue";
import { Token, Percent } from "@uniswap/sdk";
import TokenAmount from '../hooks/types/tokenAmount'
import { getUSDDTokenStatic, getPairFromToken } from "../hooks/token";
import { getPair, getTotalSupply, getPoolTokenBalance, getCredit } from "../hooks/liquid";
import { ZERO_ADDRESS, STORE_TRACKED_TOKENS } from "../constants/index";
import { storeToken } from "../utils/storage";
import { ZERO } from "../hooks/types/pair"

const moduleWallet = namespace("moduleWallet");
const moduleBase = namespace("moduleBase");

@Component({
  components: {
    PageTitle,
    SelectToken
  }
})
export default class ImportLiquidity extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleBase.State("allTokenList") allTokenList;
  @moduleWallet.State("chainId") chainId;

  usddToken = {
    symbol: "USDD",
    address: ""
  };

  otherToken = {
    symbol: "",
    address: ""
  };

  hasPool = false;
  hasLiquidity = false;
  loading = false;
  poolTokenAmount = 0;
  share = 0
  usddAmount = 0;
  otherAmount = 0;

  created() {
    this.tokenA = getUSDDTokenStatic(this.chainId);
  }

  async changeToken(token) {
    this.loading = true;
    const networkId = this.chainId;
    this.otherToken = new Token(
      networkId,
      token.address,
      token.decimals,
      token.symbol,
      token.name
    );
    this.usddToken = getUSDDTokenStatic(this.chainId);
    const pairAddress = await getPair(
      networkId,
      this.otherToken.address
    )
    if (pairAddress === ZERO_ADDRESS) {
      this.hasPool = false;
      this.loading = false;
      return;
    }
    this.hasPool = true;
    const pair = await getPairFromToken(
      this.usddToken,
      this.otherToken,
      pairAddress
    );
    const totalSupply = await getTotalSupply(pairAddress);
    const mintAmount = await getPoolTokenBalance(
      pairAddress,
      this.currentAccount
    );

    const poolTokenAmount = new TokenAmount(pair.liquidityToken, mintAmount);
    const credit = await getCredit(pairAddress, this.currentAccount);
    const creditAmount = new TokenAmount(pair.token0, credit);

    // If user has share or credit
    if(!poolTokenAmount.equalTo(ZERO) || !creditAmount.equalTo(ZERO)) {
      // percentage = your pool token / total pool token
      // so your usdd token in pool is percentage*usdd token reserve
      // the same for another pool token.
      const poolTokenTotalAmount = new TokenAmount(
        pair.liquidityToken,
        totalSupply
      );
      const percentage = new Percent(
        poolTokenAmount.raw,
        poolTokenTotalAmount.raw
      );

      this.usddAmount = percentage.multiply(pair.reserve0).toSignificant(6);
      this.otherAmount = percentage.multiply(pair.reserve1).toSignificant(6);
      this.poolTokenAmount = poolTokenAmount.toSignificant(6);
      this.share = percentage.toFixed(2)
      storeToken(STORE_TRACKED_TOKENS, this.otherToken, networkId)
      this.hasLiquidity = true;
    }else {
      this.hasLiquidity = false;
    }
    this.loading = false;
  }
}
</script>
<style lang="scss" scoped>
.import-liquidity {
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

  .pool-content {
    box-sizing: border-box;
    min-height: 130px;
    border: solid 1px $lightBorderColor;
    border-radius: 16px;
    text-align: center;
    .pool-item {
      box-sizing: border-box;
      padding: 10px;
      width: 100%;
      border-radius: 16px;
      background: $lightBgColor;
    }
    p {
      padding-top: 10px;
      width: 100%;
      &:first-child {
        padding-top: 0;
      }
    }
  }
}
</style>
