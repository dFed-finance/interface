<template>
  <div class="wrap pool-wrap">
    <HcoFunction activeTab="pool">
      <div slot="content" class="pool-content content">
        <div class="btn-operate m_b40">
          <span class="title">Your Liquidity</span>
          <div class="flex-row-between-center">
            <!-- <el-button round plain @click="$router.push('/migrate-liquidity')">Migrate Liquidity</el-button> -->
            <el-button
              round
              class="w_150"
              type="primary"
              @click="$router.push('/add-liquidity')"
            >Add Liquidity</el-button>
          </div>
        </div>
        <LiquidityList
          :loading="ajaxLoading"
          :data="liquidsDataList"
          :action="`add`"
          @callback="liquidityListCallBack"
        />
      </div>
    </HcoFunction>
    <p class="m_t10 color-666">
      Don't see a pool you joined?
      <el-button type="text" @click="$router.push('/import-liquidity')">Import it.</el-button>
    </p>
  </div>
</template>
<script>
import { Component, Vue, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import {
  getPoolTokenBalance,
  getPair,
  getTotalSupply,
  getCredit
} from "hooks/liquid";
import HcoFunction from "./components/hco-function";
import LiquidityList from "./components/liquidity/liquidity-list";
import Loading from "components/loading.vue";
import { getNetworkId } from "../hooks/wallet";
import { getToken } from "../utils/storage";
import { Token, Percent } from "@uniswap/sdk";
import TokenAmount from '../hooks/types/tokenAmount'
import {
  getUSDDTokenStatic,
  getPairFromToken
} from "../hooks/token";
import {
  ZERO_ADDRESS,
  STORE_TRACKED_TOKENS
} from "../constants/index";
import { ZERO } from "../hooks/types/pair";
import { getFed } from "../hooks/mint";

const moduleWallet = namespace("moduleWallet");
const moduleLiquidity = namespace("moduleLiquidity");

@Component({
  components: {
    HcoFunction,
    LiquidityList,
    Loading
  }
})
export default class Pool extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleLiquidity.Mutation("setHarvestParams") setHarvestParams;

  liquidsDataList = [];
  ajaxLoading = false;

  @Watch("currentAccount")
  currentAccountChange(nval, oval) {
    if (nval && !oval) {
      this.getLiquidsData(nval);
    }
  }

  created() {
    if (this.currentAccount) {
      this.getLiquidsData(this.currentAccount);
    }
  }

  async fetchLiquidsData(trackedToken, usddToken) {
    this.ajaxLoading = true;
    const pairAddress = await getPair(getNetworkId(), trackedToken.address);
    if (pairAddress === ZERO_ADDRESS) {
      return;
    }
    const pair = await getPairFromToken(usddToken, trackedToken, pairAddress);
    const totalSupply = await getTotalSupply(pairAddress);
    const credit = await getCredit(pairAddress, this.currentAccount);
    const mintAmount = await getPoolTokenBalance(
      pairAddress,
      this.currentAccount
    );
    // const fed = await getTokenBalance(FED_ADDRESS, this.currentAccount);
    // const fedTokenAmount = new TokenAmount(getFedTokenStatic(), fed);

    // pool token
    const poolTokenAmount = new TokenAmount(pair.liquidityToken, mintAmount);
    // credit
    const creditAmount = new TokenAmount(pair.token0, credit);

    const fedTest = await getFed(
      getNetworkId(),
      pairAddress,
      pair.reserve0.raw,
      totalSupply,
      pair.liquidityToken,
      poolTokenAmount,
      this.currentAccount
    );

    // If user dose not have share or credit, ignore this apir
    if (poolTokenAmount.equalTo(ZERO) && creditAmount.equalTo(ZERO)) {
      this.ajaxLoading = false;
      return;
    }

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

    const data = {
      tokenA: usddToken,
      tokenB: trackedToken,
      tokenAReserve: pair.reserve0.raw.toString(),
      tokenBReserve: pair.reserve1.raw.toString(),

      poolToken: pair.liquidityToken,
      poolTokenAmount: poolTokenAmount.raw.toString(),
      poolTokenTotalAmount: poolTokenTotalAmount.raw.toString(),

      PoolShares: percentage.toFixed(2) + "%",
      PoolTokens: poolTokenAmount.toSignificant(),
      Pooled0: percentage.multiply(pair.reserve0).toSignificant(6),
      Pooled1: percentage.multiply(pair.reserve1).toSignificant(6),
      pairAddress: pairAddress,
      FED: fedTest.toSignificant(),
      Credit: creditAmount.toSignificant(),
      refund: credit
    };
    this.liquidsDataList.push(data);
    this.ajaxLoading = false;
  }

  async getLiquidsData(currentAccount) {
    const networkId = getNetworkId();
    // Tokens from user's local cache
    const allTrackedTokens = getToken(STORE_TRACKED_TOKENS)[networkId];
    if (!allTrackedTokens) {
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
    // Get the stable token obj
    const usddToken = getUSDDTokenStatic(networkId);
    if (parsedTokens.length === 0) {
      this.ajaxLoading = false;
    }
    // Get all tracked token's info
    for (let i = 0; i < parsedTokens.length; i++) {
      this.fetchLiquidsData(parsedTokens[i], usddToken);
    }
  }

  liquidityListCallBack(params) {
    this.setHarvestParams({ ...params.data });
    this.$router.push({
      path: `/${params.route}`,
      query: params.query
    });
  }
}
</script>
<style lang="scss" scoped>
.pool-wrap {
  .pool-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .btn-operate {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
@media screen and (max-width: 500px) {
  .pool-wrap {
    // .btn-group {
    //   width: 100%;
    // }
    // .title {
    //   display: none;
    // }
  }
}
</style>


