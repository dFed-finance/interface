<template>
  <div class="remove-liquidity" v-loading="loading">
    <PageTitle page-title="Remove Liquidity" :has-back="true" />
    <div class="remove-content">
      <div class="amount-percent">
        <p class="tit">Amount</p>
        <div class="value m_b10 m_t20">{{percentValue}} %</div>
        <el-slider v-model="percentValue" :show-tooltip="false"></el-slider>
        <div class="percent-list m_t20">
          <el-tag
            v-for="item in percentList"
            :key="item.value"
            @click="handleClick(item.value)"
          >{{item.label}}</el-tag>
        </div>
      </div>
      <div class="m_t20 m_b20 flex-row-center">
        <i class="el-icon-bottom" />
      </div>
      <div class="token-count-wrap">
        <DescComponent :title="tokenA.symbol+':'" :value="tokenAValue || '-'" />
        <DescComponent :title="tokenB.symbol+':'" :value="tokenBValue || '-'" />
        <DescComponent :title="'Credit('+tokenA.symbol+'):'" :value="creditValue || '0'" />
        <DescComponent title="Liquidation Caused:" :value="causedValue || '-'" />
        <DescComponent title="Total Liquidation:" :value="totalValue || '-'" />
      </div>
      <p class="price-desc m_t20 m_b20">
        <span>Price:</span>
        <span>
          <span>1 {{tokenA.symbol}} = {{exchangeValue1}} {{tokenB.symbol}}</span>
          <span>1 {{tokenB.symbol}} = {{exchangeValue2}} {{tokenA.symbol}}</span>
        </span>
      </p>
      <div class="btn-group">
        <el-button
          round
          type="primary"
          :loading="approveBtnLoading"
          :disabled="percentValue==0 || isApprove"
          @click="signMessage"
        >Approve</el-button>
        <el-button round type="primary" :disabled="!isApprove" @click="handleRemove">Remove</el-button>
      </div>
    </div>
    <!-- 二次确认弹窗 -->
    <el-dialog title="You will receive" custom-class="fe-dialog" :visible.sync="dialogVisible">
      <div class="dialog-content receive-content">
        <div>
          <p class="flex-row-between-center p_t5 p_b5 f_s24">
            <span>{{tokenAValue}}</span>
            <span>{{tokenA.symbol}}</span>
          </p>
          <p class="flex-row-center">
            <i class="el-icon-plus color-666" />
          </p>
          <p class="flex-row-between-center p_t5 p_b5 f_s24">
            <span>{{tokenBValue}}</span>
            <span>{{tokenB.symbol}}</span>
          </p>
        </div>
        <p
          class="color-666 f_s14 m_t20 m_b20 f_italic"
        >Output is estimated. If the price changes by more than {{tolerance}}% your transaction will revert.</p>
        <div class="dialog-bg-desc-content">
          <p class="flex-row-between-center p_t5 p_b5">
            <span class="color-666">{{FEDNAME}}LP {{tokenA.symbol}}/{{tokenB.symbol}} Burned</span>
            <span>{{burnedValue}}</span>
          </p>
          <p class="flex-row-between-start p_t5 p_b5">
            <span class="color-666">Price</span>
            <span class="flex-colum-center-end">
              <span>1 {{tokenA.symbol}} = {{exchangeValue1}} {{tokenB.symbol}}</span>
              <span>1 {{tokenB.symbol}} = {{exchangeValue2}} {{tokenA.symbol}}</span>
            </span>
          </p>
          <div class="flex-row-center p_t20 p_b20">
            <el-button
              :loading="btnLoading"
              round
              type="primary"
              class="w_200"
              @click="handleConfirmRemove"
            >Confirm</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { Component, Vue, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import PageTitle from "components/page-title.vue";
import DescComponent from "components/desc-component.vue";
import { Percent } from "@uniswap/sdk";
import TokenAmount from "../hooks/types/tokenAmount";
import Pair from "../hooks/types/pair";
import { splitSignature } from "@ethersproject/bytes";
import { signPermitMessage } from "../hooks/wallet";
import {
  timeTo,
  getEtherscanLink,
  etherscanMessage,
  tryParseAmount,
  handleError
} from "../utils/index";
import {
  removeLiquidityWithPermits,
  calculateSlippageAmount
} from "../hooks/liquid";
import {
  getAllDebt,
  getInfoAfterRemoveLpConsiderLiquidation
} from "../hooks/debt";
import { FEDNAME } from "constants/index";

const moduleBase = namespace("moduleBase");
const moduleLiquidity = namespace("moduleLiquidity");
const moduleWallet = namespace("moduleWallet");

@Component({
  components: {
    PageTitle,
    DescComponent
  }
})
export default class RemoveLiquidity extends Vue {
  @moduleBase.State("tolerance") tolerance;
  @moduleLiquidity.State("harvestParams") params;
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleBase.State("tolerance") tolerance;
  @moduleBase.State("deadline") deadline;
  @moduleWallet.State("chainId") chainId;

  loading = true;
  FEDNAME = FEDNAME;
  approveBtnLoading = false;
  btnLoading = false;
  dialogVisible = false;
  isApprove = false;
  percentValue = 0;
  tokenAValue = 0;
  tokenBValue = 0;
  creditValue = 0;
  causedValue = 0;
  totalValue = 0;
  exchangeValue1 = 0; // 1A=nB
  exchangeValue2 = 0; // 1B=nA
  burnedValue = 0;

  usddToken = undefined;
  otherToken = undefined;
  usddTokenAmount = undefined;
  otherTokenAmount = undefined;
  pair = undefined;
  poolTokenAmount = undefined;
  poolTokenTotalAmount = undefined;
  rawLiquid = undefined;
  signature = undefined;

  tokenA = {
    symbol: ""
  };

  tokenB = {
    symbol: ""
  };

  percentList = [
    { value: 25, label: "25%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "MAX" }
  ];

  created() {
    const { pairAddres } = this.$route.query;
    if (!pairAddres || !this.params.tokenA || !this.params.tokenB) {
      this.$router.push("/pool");
      return;
    }
    this.usddToken = this.params.tokenA;
    this.otherToken = this.params.tokenB;
    this.creditValue = Number(this.params.Credit);

    // Token Amount
    const usddTokenAmount = new TokenAmount(
      this.usddToken,
      this.params.tokenAReserve
    );
    const otherTokenAmount = new TokenAmount(
      this.otherToken,
      this.params.tokenBReserve
    );

    // Pair
    this.pair = new Pair(usddTokenAmount, otherTokenAmount);

    // Pool Token
    this.poolTokenAmount = new TokenAmount(
      this.pair.liquidityToken,
      this.params.poolTokenAmount
    );
    this.poolTokenTotalAmount = new TokenAmount(
      this.pair.liquidityToken,
      this.params.poolTokenTotalAmount
    );

    this.setInitData();
  }

  setInitData() {
    this.tokenA.symbol = this.usddToken.symbol;
    this.tokenB.symbol = this.otherToken.symbol;
    this.exchangeValue1 = this.pair.priceOf(this.usddToken).toSignificant();
    this.exchangeValue2 = this.pair.priceOf(this.otherToken).toSignificant();

    getAllDebt(this.chainId, this.pair.liquidityToken.address, this.otherToken).then(
      result => {
        this.debtInfo = result;
        this.loading = false;
      }
    );
  }

  @Watch("percentValue")
  percentValueChange() {
    const per = this.percentValue.toString();
    // numerator
    const n = tryParseAmount(per, this.pair.liquidityToken);
    // denominator
    const d = tryParseAmount("100", this.pair.liquidityToken);
    const userInputPercent = new Percent(n.raw, d.raw);

    this.rawLiquid = userInputPercent.multiply(
      this.poolTokenAmount.raw
    ).quotient;
    this.burnedValue = new TokenAmount(
      this.pair.liquidityToken,
      this.rawLiquid
    ).toSignificant();
    // overlapping
    if (!this.debtInfo.isEmpty()) {
      const debtInfo = this.debtInfo;
      const sortedDebts = [].concat(
        debtInfo.sortByTokenPoint(
          this.pair.reserve0.raw,
          this.pair.reserve1.raw
        )
      );
      const res = getInfoAfterRemoveLpConsiderLiquidation(
        this.pair,
        this.poolTokenTotalAmount.raw,
        this.rawLiquid,
        sortedDebts
      );
      const [getUSDD, getToken, , impact, causedUSDD] = res;
      this.usddTokenAmount = new TokenAmount(this.usddToken, getUSDD);
      this.otherTokenAmount = new TokenAmount(this.otherToken, getToken);
      this.tokenAValue = this.usddTokenAmount.toSignificant();
      this.tokenBValue = this.otherTokenAmount.toSignificant();
      this.causedValue = impact;
      this.totalValue = new TokenAmount(
        this.usddToken,
        causedUSDD
      ).toSignificant();
    } else {
      // percentage used to calculate token amount
      const percentage = new Percent(
        this.poolTokenAmount.raw,
        this.poolTokenTotalAmount.raw
      );
      const rawA = percentage
        .multiply(this.pair.reserve0.raw)
        .multiply(userInputPercent).quotient;
      const rawB = percentage
        .multiply(this.pair.reserve1.raw)
        .multiply(userInputPercent).quotient;
      this.usddTokenAmount = new TokenAmount(this.usddToken, rawA);
      this.otherTokenAmount = new TokenAmount(this.otherToken, rawB);
      this.tokenAValue = this.usddTokenAmount.toSignificant();
      this.tokenBValue = this.otherTokenAmount.toSignificant();
      this.causedValue = 0;
    }
  }

  signMessage() {
    const message = {
      tokenName: this.pair.liquidityToken.symbol,
      version: "1",
      chainId: this.chainId.toString(),
      tokenAddress: this.pair.liquidityToken.address,
      owner: this.currentAccount,
      value: this.rawLiquid.toString(),
      deadline: timeTo(Number(this.deadline * 60))
    };
    this.approveBtnLoading = true;
    signPermitMessage(message)
      .then(splitSignature)
      .then(signature => {
        this.signature = {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: message.deadline
        };
        this.isApprove = true;
      })
      .catch(err => {
        console.error(err);
        this.$message.error("Failed to sign message");
      })
      .finally(e => {
        this.approveBtnLoading = false;
      });
  }

  handleClick(val) {
    this.percentValue = val;
  }

  handleRemove() {
    this.dialogVisible = true;
  }

  handleConfirmRemove() {
    // calculate slippage
    const slippage = Number(this.tolerance * 100);
    const [amount0Min] = calculateSlippageAmount(
      this.usddTokenAmount,
      slippage
    );
    const [amount1Min] = calculateSlippageAmount(
      this.otherTokenAmount,
      slippage
    );

    // remove
    const network = this.chainId;
    this.btnLoading = true;
    removeLiquidityWithPermits(
      network,
      this.otherToken.address,
      this.rawLiquid.toString(),
      amount0Min.toString(),
      amount1Min.toString(),
      this.currentAccount,
      this.signature.deadline,
      false,
      this.signature.v,
      this.signature.r,
      this.signature.s
    )
      .then(res => {
        const url = getEtherscanLink(network, res.hash);
        etherscanMessage.call(this, url, () => {
          this.$router.back();
        });
      })
      .catch(err => {
        this.$message.error(handleError(err));
        console.error(err);
      })
      .finally(e => {
        this.btnLoading = false;
      });
  }
}
</script>
<style lang="scss" scoped>
.remove-liquidity {
  .remove-content {
    padding-top: 15px;
  }
  .amount-percent,
  .amount-count {
    box-sizing: border-box;
    padding: 15px 15px;
    border: solid 1px $lightBorderColor;
    border-radius: 8px;
    width: 100%;
    min-height: 80px;
    .value {
      font-size: 60px;
    }
  }
  .el-slider {
    padding: 0 10px;
  }
  .percent-list {
    display: flex;
    justify-content: space-around;
    span {
      cursor: pointer;
      min-width: 50px;
      text-align: center;
      &:hover {
        border-color: $link;
        font-weight: bold;
      }
    }
  }
  .price-desc {
    display: flex;
    justify-content: space-between;
    & > span {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
  }
  .token-count-wrap {
    box-sizing: border-box;
    padding: 15px 10px;
    border: solid 1px $lightBorderColor;
    border-radius: 8px;
  }
}
</style>
