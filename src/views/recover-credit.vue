<template>
  <div class="recover-credit">
    <PageTitle page-title="Recover My Credit" :has-back="true" />
    <icon-tip>
      <p slot="message">
        More details about credit please refer to the appendix 3 of whitepaper:
        <a
          href="https://dfed-finance.github.io/Introduction/whitepaper/dFed.finance.pdf"
          target="_blank"
        >dFed.finance.pdf</a>
      </p>
    </icon-tip>
    <div class="recover-content">
      <div class="text-desc">
        <DescComponent :title="`You Credit(${usddToken.symbol})：`" :value="params.Credit" />
        <DescComponent :title="`Available ${usddToken.symbol}：`" :value="usddAvailable" />
        <div class="m_t20 p_b5">Get {{otherToken.symbol}} as Credit:</div>
        <DescComponent
          title="Ratio："
          :value="`1 ${usddToken.symbol} = ${ratioValue} ${otherToken.symbol}`"
        />
        <DescComponent
          :title="`Available ${otherToken.symbol}：`"
          :value="`${otherAvailable} (= ${toUsddValue} ${usddToken.symbol})`"
        />
      </div>
      <div class="recover-form m_t40">
        <p
          class="m_b20"
        >You can get {{usddToken.symbol}} or {{otherToken.symbol}} to recover your credit</p>
        <div class="flex-row-between-center m_b20">
          <div class="form-input-wrap">
            <FeInput
              type="number"
              :is-require="true"
              :min="0"
              :max="usddAvailable"
              v-model="usddValue"
            />
            <span class="btn-max" @click="handleClickMax('usddValue', usddAvailable)">MAX</span>
          </div>
          <el-button
            :disabled="usddValue==0"
            :loading="usddBtnLoading"
            class="w_140"
            @click="handleClick(usddToken)"
          >Get {{usddToken.symbol}}</el-button>
        </div>
        <div class="flex-row-between-center m_b20">
          <div class="form-input-wrap">
            <FeInput
              type="number"
              :is-require="true"
              :min="0"
              :max="otherAvailable"
              v-model="otherValue"
            />
            <span class="btn-max" @click="handleClickMax('otherValue', otherAvailable)">MAX</span>
          </div>
          <el-button
            :disabled="otherValue==0"
            :loading="otherBtnLoading"
            class="w_140"
            @click="handleClick(otherToken)"
          >Get {{otherToken.symbol}}</el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import PageTitle from "components/page-title.vue";
import FeInput from "components/input.vue";
import DescComponent from "components/desc-component.vue";
import { JSBI } from "@uniswap/sdk";
import TokenAmount from "../hooks/types/tokenAmount";
import { USDD_ADDRESS } from "../constants/index";
import {
  getTotalRefundToken0,
  getTotalRefundToken1,
  getTotalRefundToken1EqualToken0,
  withdrawToken0,
  withdrawToken1
} from "../hooks/liquid";
import {
  tryParseAmount,
  getEtherscanLink,
  etherscanMessage,
  handleError,
  isSameAddress
} from "../utils/index";
import { getNetworkId } from "../hooks/wallet";

const moduleWallet = namespace("moduleWallet");
const moduleLiquidity = namespace("moduleLiquidity");

@Component({
  components: {
    PageTitle,
    FeInput,
    DescComponent
  }
})
export default class RecoverCredit extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleLiquidity.State("harvestParams") params;

  usddToken = {};
  otherToken = {};
  pair = undefined;

  usddAvailable = "0";
  otherAvailable = "0";
  ratioValue = 0; // Token
  ratioAmount;
  toUsddValue = 0; // USDD

  usddValue = 0;
  otherValue = 0;
  usddBtnLoading = false;
  otherBtnLoading = false;

  pairAddress;

  async created() {
    const { pairAddres } = this.$route.query;
    this.pairAddress = pairAddres;
    if (!pairAddres || !this.params.tokenA || !this.params.tokenB) {
      this.$router.push("/pool");
      return;
    }

    this.usddToken = this.params.tokenA;
    this.otherToken = this.params.tokenB;

    const totalRefundToken0 = await getTotalRefundToken0(
      this.params.pairAddress
    );

    const totalRefundToken1 = await getTotalRefundToken1(
      this.params.pairAddress
    );

    const totalRefundToken1EqualToken0 = await getTotalRefundToken1EqualToken0(
      this.params.pairAddress
    );

    if (
      JSBI.equal(
        JSBI.BigInt(totalRefundToken1EqualToken0.toString()),
        JSBI.BigInt(0)
      )
    ) {
      this.ratioValue = 0;
    } else {
      const ratioRaw = JSBI.divide(
        JSBI.multiply(
          JSBI.BigInt(totalRefundToken1.toString()),
          JSBI.exponentiate(
            JSBI.BigInt(10),
            JSBI.BigInt(this.usddToken.decimals)
          )
        ),
        JSBI.BigInt(totalRefundToken1EqualToken0.toString())
      );
      const ratioAmount = new TokenAmount(this.otherToken, ratioRaw);
      this.ratioAmount = ratioAmount;
      this.ratioValue = ratioAmount.toSignificant(6);
      this.toUsddValue = new TokenAmount(
        this.usddToken,
        totalRefundToken1EqualToken0
      ).toSignificant();
    }

    // min(refundAmount, totalRefundToken0)
    const usddAvailableRaw = JSBI.greaterThan(
      JSBI.BigInt(this.params.refund),
      JSBI.BigInt(totalRefundToken0)
    )
      ? totalRefundToken0
      : this.params.refund;
    this.usddAvailable = new TokenAmount(
      this.usddToken,
      usddAvailableRaw
    ).toSignificant();

    // min(ratio * refundAmount, totalRefundToken1)
    if (JSBI.equal(JSBI.BigInt(totalRefundToken1EqualToken0), JSBI.BigInt(0))) {
      this.otherAvailable = new TokenAmount(
        this.otherToken,
        totalRefundToken1
      ).toSignificant();
    } else {
      const x = JSBI.divide(
        JSBI.multiply(
          JSBI.BigInt(totalRefundToken1),
          JSBI.BigInt(this.params.refund)
        ),
        JSBI.BigInt(totalRefundToken1EqualToken0)
      );
      const otherAvailableRaw = JSBI.greaterThan(
        x,
        JSBI.BigInt(totalRefundToken1)
      )
        ? totalRefundToken1
        : x;
      this.otherAvailable = new TokenAmount(
        this.otherToken,
        otherAvailableRaw
      ).toSignificant();
    }
  }

  handleClickMax(filed, maxValue) {
    this[filed] = maxValue;
  }

  handleClick(token) {
    if (isSameAddress(token.address, USDD_ADDRESS)) {
      const usddAmount = tryParseAmount(this.usddValue, this.usddToken);
      if (!usddAmount) {
        this.$message.error("Please input a valid amount");
        return;
      }
      this.usddBtnLoading = true;
      withdrawToken0(
        this.pairAddress,
        this.currentAccount,
        usddAmount.raw.toString()
      )
        .then(res => {
          this.etherscan(res.hash);
          const url = getEtherscanLink(getNetworkId(), res.hash);
          etherscanMessage.call(this, url, () => {
            this.$router.back();
          });
        })
        .catch(err => {
          console.error(err);
          this.$message.error(handleError(err));
        })
        .finally(e => {
          this.usddBtnLoading = false;
        });
    } else {
      const otherAmount = tryParseAmount(this.otherValue, this.otherToken);
      if (!otherAmount) {
        this.$message.error("Please input a valid amount");
        return;
      }
      this.otherBtnLoading = true;

      const usddAmount = new TokenAmount(
        this.usddToken,
        JSBI.divide(
          JSBI.multiply(
            otherAmount.raw,
            JSBI.exponentiate(
              JSBI.BigInt(10),
              JSBI.BigInt(this.usddToken.decimals)
            )
          ),
          this.ratioAmount.raw
        )
      );
      withdrawToken1(
        this.pairAddress,
        this.currentAccount,
        usddAmount.raw.toString()
      )
        .then(res => {
          this.etherscan(res.hash);
          const url = getEtherscanLink(getNetworkId(), res.hash);
          etherscanMessage.call(this, url, () => {
            this.$router.back();
          });
        })
        .catch(err => {
          console.error(err);
          this.$message.error(handleError(err));
        })
        .finally(e => {
          this.otherBtnLoading = false;
        });
    }
  }

  etherscan(hash) {
    const url = getEtherscanLink(getNetworkId(), hash);
    etherscanMessage.call(this, url, () => {
      this.$router.back();
    });
  }
}
</script>
<style lang="scss" scoped>
.recover-credit {
  position: relative;
  /deep/.icon-tip-wrap {
    position: absolute;
    right: 0;
    top: 4px;
  }
  .recover-content {
    padding-top: 15px;
    .text-desc {
      box-sizing: border-box;
      padding: 15px 10px;
      border: solid 1px $lightBorderColor;
      border-radius: 8px;
    }
    /deep/.el-button {
      border-radius: 8px;
      margin-left: 12px;
    }
  }
}
</style>
