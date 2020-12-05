<template>
  <div class="wrap mint-wrap" v-loading="loading">
    <PageTitle
      page-title="Mint USDD"
      :has-back="true"
      page-tip="You can mint USDD by other tokens, all your debts have a risk of liquidation, please note the price and pool size,your tokens may be liquidated automatically. "
    />
    <div class="content mint-content">
      <div
        class="flex-1 m_b20 f_s14 color-666"
      >There may be serval liquidating intervals due to different parameters, you can choose your favorite one or more.</div>
      <FunctionForm :form-data.sync="formData" :disabled-address="formData.address" />
      <MintBar
        :line-data="lineData"
        :usdd-balance="USDDReserve"
        :token-address="formData.address"
        :token-balance="formData.reserve"
        :token-value="formData.value"
        @calculateChange="calculateChange"
      />
      <DescComponent
        :has-arrow="true"
        :title="`${tokenShowValue} ${formData.symbol}`"
        :value="`${usddShowValue} USDD`"
        class="m_t20 f_s20"
      />
      <div class="color-err f_weight m_t15">Liquidation Warning:</div>
      <div>
        Liquidation will happen when the price drops by
        <span
          class="color-err f_weight"
        >{{dropsValue}}%</span>
        or the pool reduces by
        <span class="color-err f_weight">{{reducesValue}}%</span>.
        <br />Liquidation will change when the price and pool change.
      </div>
      <div class="btn-group">
        <el-button
          round
          type="primary"
          :loading="isApproving"
          :disabled="approveDisabled || isApproved"
          @click="handleClickApprove"
        >{{approveBtnVal}}</el-button>
        <el-button
          round
          type="primary"
          :loading="btnLoading"
          :disabled="!isApproved"
          @click="handleConfirm"
        >Confirm</el-button>
      </div>
    </div>
  </div>
</template>
<script>
import { Component, Vue, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { throttleFn } from "utils/common-fn.js";
import PageTitle from "components/page-title.vue";
import FunctionForm from "./components/function-form.vue";
import MintBar from "./components/lend/mint-bar.vue";
import DescComponent from "components/desc-component.vue";
import { mortgage, getAllDebt, getUSDDYMapping } from "../hooks/debt";
import { getNetworkId } from "../hooks/wallet";
import TokenAmount from "../hooks/types/tokenAmount";
import {
  timeTo,
  tryParseAmount,
  getEtherscanLink,
  etherscanMessage,
  handleError
} from "../utils/index";
import { storeToken } from "../utils/storage";
import {
  getTokenAllowance,
  approveToken,
  getTokenDetails,
  getTokenBalance,
  getUSDDTokenStatic,
  getPairFromToken
} from "../hooks/token";
import { getPair } from "../hooks/liquid";
import {
  INDEX_ADDRESS,
  ZERO_ADDRESS,
  APPROVE_STATE,
  STORE_DEBTS,
  MINT_USDD_OFFSET
} from "../constants/index";

const moduleBase = namespace("moduleBase");
const moduleWallet = namespace("moduleWallet");

@Component({
  components: {
    PageTitle,
    FunctionForm,
    MintBar,
    DescComponent
  }
})
export default class Lend extends Vue {
  @moduleBase.State("allTokenList") allTokenList;
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleBase.State("deadline") deadline;

  loading = false;
  USDDReserve = 0;
  dropsValue = 0;
  reducesValue = 0;
  dy = 0;
  p = 0;
  k = 0; // r0*r1
  usddToken = undefined;
  otherToken = undefined;
  pair = undefined;
  pairAddress = "";
  tokenShowValue = 0;
  usddShowValue = 0;
  pladgeAmountRaw = "";
  targetAmountRaw = "";
  approveState = APPROVE_STATE.UNKNOWN;
  isApproving = false;
  btnLoading = false;

  formData = {
    title: "Input",
    address: "",
    balance: 0,
    symbol: "",
    value: "",
    reserve: 0
  };

  lineData = [];

  @Watch("formData.address")
  async changeFormDataToken() {
    this.loading = true;
    this.clear();
    const tokenAddress = this.formData.address;
    const token = await getTokenDetails(getNetworkId(), tokenAddress);
    this.getBalance(token);
    this.otherToken = token;
    this.formData.symbol = token.symbol;
    this.usddToken = getUSDDTokenStatic();
    this.createPair(() => {
      this.loading = false;
      this.dropsValue = 0;
      this.reducesValue = 0;
    });
  }

  get approveDisabled() {
    return !this.formData.address || Number(this.formData.value) === 0;
  }

  get approveBtnVal() {
    if (this.approveState === APPROVE_STATE.UNKNOWN) {
      return "Approve " + this.formData.symbol;
    }
    if (this.approveState === APPROVE_STATE.APPROVING) {
      return "Approving...";
    }
    return "Approved";
  }

  get isApproved() {
    return this.approveState === APPROVE_STATE.APPROVED;
  }

  created() {
    const tokenAddress = this.$route.query.address;
    if (tokenAddress) {
      this.formData.address = tokenAddress;
    }
    this.calculateChangeFn = throttleFn(this.calculateResult, 300);
  }

  createPair(cb) {
    getPair(getNetworkId(), this.otherToken.address)
      .then(pairAddress => {
        if (pairAddress.toLowerCase() === ZERO_ADDRESS) {
          this.$message.error("Pair not found");
          return;
        }
        this.pairAddress = pairAddress;
        getPairFromToken(this.usddToken, this.otherToken, pairAddress).then(
          pair => {
            this.pair = pair;
            this.USDDReserve = Number(pair.reserve0.toSignificant(8));
            this.formData.reserve = Number(pair.reserve1.toSignificant(8));
            this.k = Number(this.USDDReserve) * Number(this.formData.reserve);
            getAllDebt(pairAddress, this.otherToken).then(debtInfo => {
              const list = getUSDDYMapping(
                this.pair.reserve0,
                this.pair.reserve1,
                debtInfo
              );

              const parsedList = list.map(item => {
                const minTokenAmount = new TokenAmount(
                  this.usddToken,
                  item.minVal
                );
                const maxTokenAmount = new TokenAmount(
                  this.usddToken,
                  item.maxVal
                );
                cb && cb();
                return {
                  minVal: Number(minTokenAmount.toSignificant()),
                  maxVal: Number(maxTokenAmount.toSignificant()),
                  disabled: item.disabled
                };
              });
              // this.USDDReserve = parsedList[parsedList.length - 1].maxVal
              this.$set(this, "lineData", parsedList);
            });
          }
        );
      })
      .catch(err => {
        this.$message.error("Failed to get pair");
        console.error(err);
      });
  }

  getBalance(token) {
    getTokenBalance(token.address, this.currentAccount)
      .then(balance => {
        const balanceAmount = new TokenAmount(token, balance);
        this.formData.balance = balanceAmount.toSignificant();
      })
      .catch(err => {
        this.$message.error("Failed to get token balance");
        console.error(err);
      });
  }

  calculateChange(res) {
    this.dy = res.dy;
    this.p = res.p;
    this.calculateChangeFn();
  }

  calculateResult() {
    const start = this.p - this.dy;
    const end = this.p;
    let x = start;
    let y = end;
    const ci = this.lineData.filter(data => data.disabled === true);

    let maxInterval = 0;
    for (let i = 0; i < ci.length; i++) {
      if (start < ci[i].maxVal && end > ci[i].minVal) {
        if (start > ci[i].minVal && end < ci[i].maxVal) {
          x = y = 0;
          break;
        }
        // tmpStart: The maximum value between the previous interval and the starting point of the slider. If there is no previous interval, the left end point of the slider is taken
        // tmpEnd: The minimum value between the next interval and the end point of the slider. If there is no next interval, take the right end point of the slider
        const tmpStart =
          i > 0 ? (ci[i - 1].maxVal > start ? ci[i - 1].maxVal : start) : start;
        const tmpEnd =
          i < ci.length - 1
            ? ci[i + 1].minVal < end
              ? ci[i + 1].minVal
              : end
            : end;

        let curMax;
        let tmpX;
        let tmpY;
        if (ci[i].minVal - tmpStart > tmpEnd - ci[i].maxVal) {
          tmpX = tmpStart;
          tmpY = ci[i].minVal;
          curMax = ci[i].minVal - tmpStart;
        } else {
          tmpX = ci[i].maxVal;
          tmpY = tmpEnd;
          curMax = tmpEnd - ci[i].maxVal;
        }

        if (curMax > maxInterval) {
          maxInterval = curMax;
          x = tmpX;
          y = tmpY;

          // Note: fix Numerical error
          if ((i > 0 && x === ci[i - 1].maxVal) || x === ci[i].maxVal) {
            x = x + MINT_USDD_OFFSET;
          }

          if ((i < ci.length - 1 && y === ci[i + 1].minVal) || y === ci[i].minVal) {
            y = y - MINT_USDD_OFFSET;
          }
        }
      }
    }

    let tokenAmount = 0;
    let usddAmount = 0;
    if (x !== 0 && y !== 0) {
      tokenAmount = this.k / x - this.k / y;
      usddAmount = y - x;
    }

    if (y > this.USDDReserve) {
      y = this.USDDReserve;
    }

    tokenAmount =
      tokenAmount > 0 ? tokenAmount.toFixed(this.otherToken.decimals) : 0;
    usddAmount =
      usddAmount > 0 ? usddAmount.toFixed(this.usddToken.decimals) : 0;

    const pladgeAmount = tryParseAmount(
      tokenAmount.toString(),
      this.otherToken
    );
    const targetAmount = tryParseAmount(usddAmount.toString(), this.usddToken);

    this.pladgeAmountRaw = pladgeAmount.raw.toString();
    this.targetAmountRaw = targetAmount.raw.toString();

    this.tokenShowValue = pladgeAmount.toSignificant(6, {}, 2);
    this.usddShowValue = targetAmount.toSignificant();

    // drops value
    this.dropsValue = ((1 - y / this.USDDReserve) * 100).toFixed(4);
    const a =
      (tokenAmount * usddAmount) /
      (tokenAmount * this.USDDReserve - usddAmount * this.formData.reserve);
    // reduces value
    isNaN(a)
      ? (this.reducesValue = 0)
      : (1 - a) * 100 > 0
        ? (this.reducesValue = ((1 - a) * 100).toFixed(4))
        : (this.reducesValue = ((a - 1) * 100).toFixed(4));
  }

  handleClickApprove() {
    if (!this.pair) {
      this.$message.warning("Please select a token");
      return;
    }
    if (Number(this.formData.value) <= 0) {
      this.$message.warning("Please input token amount");
      return;
    }
    if (this.isApproving) {
      this.$message.warning("Approving, please waiting...");
      return;
    }

    const pladgeAmount = new TokenAmount(this.otherToken, this.pladgeAmountRaw);
    getTokenAllowance(
      this.otherToken.address,
      this.currentAccount,
      INDEX_ADDRESS
    )
      .then(allowed => {
        const allowedAmount = new TokenAmount(this.otherToken, allowed);
        // If no sufficient, allowance token
        if (pladgeAmount.greaterThan(allowedAmount)) {
          this.setApproveState(
            this.otherToken.address,
            APPROVE_STATE.APPROVING
          );
          approveToken(
            this.otherToken.address,
            INDEX_ADDRESS,
            pladgeAmount.raw.toString()
          )
            .then(res => {
              const allowanceInterval = setInterval(() => {
                getTokenAllowance(
                  this.otherToken.address,
                  this.currentAccount,
                  INDEX_ADDRESS
                ).then(allowance => {
                  const allowedAmount = new TokenAmount(
                    this.otherToken,
                    allowance
                  );
                  if (!pladgeAmount.greaterThan(allowedAmount)) {
                    this.setApproveState(
                      this.otherToken.address,
                      APPROVE_STATE.APPROVED
                    );
                    clearInterval(allowanceInterval);
                  }
                });
              }, 5000);
            })
            .catch(err => {
              console.error(err);
              this.setApproveState(
                this.otherToken.address,
                APPROVE_STATE.UNKNOWN
              );
            });
        } else {
          this.setApproveState(this.otherToken.address, APPROVE_STATE.APPROVED);
          this.$message.success("Approve success");
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  handleConfirm() {
    const pladgeAmount = new TokenAmount(this.otherToken, this.pladgeAmountRaw);
    const targetAmount = new TokenAmount(this.otherToken, this.targetAmountRaw);
    if (pladgeAmount.equalTo(0) || targetAmount.equalTo(0)) {
      this.$message.error("Invalid value");
      return;
    }
    const deadline = timeTo(Number(this.deadline * 60));
    this.btnLoading = true;
    mortgage(
      getNetworkId(),
      this.otherToken.address,
      pladgeAmount.raw.toString(),
      targetAmount.raw.toString(),
      this.currentAccount,
      deadline
    )
      .then(result => {
        storeToken(STORE_DEBTS, this.otherToken, getNetworkId());
        const url = getEtherscanLink(getNetworkId(), result.hash);
        etherscanMessage.call(this, url, () => {
          this.$router.back();
        });
      })
      .catch(err => {
        this.$message.error(handleError(err));
      })
      .finally(e => {
        this.btnLoading = false;
      });
  }

  setApproveState(tokenAddress, state) {
    this.approveState = state;
    state === APPROVE_STATE.APPROVING
      ? (this.isApproving = true)
      : (this.isApproving = false);
  }

  clear() {
    this.formData.value = "";
    this.dy = 0;
    this.p = 0;
    this.k = 0;
    this.tokenAmount = 0;
    this.usddAmount = 0;
    this.approveState = APPROVE_STATE.UNKNOWN;
    this.isApproving = false;
  }
}
</script>
<style lang="scss" scoped>
.mint-wrap {
}
</style>
