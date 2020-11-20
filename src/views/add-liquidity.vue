<template>
  <div class="add-liquidity" v-loading="loading">
    <PageTitle
      page-title="Add Liquidity"
      :has-back="true"
      page-tip="When you add liquidity, you are given pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time."
    />
    <div class="content flex-colum-center">
      <div v-if="!hasLiquidity" class="tip-text m_b20">
        You are the first liquidity provider.
        <br />The ratio of tokens you add will set the price of this pool.
        <br />Once you are happy with the rate click create to review.
      </div>
      <FunctionForm
        :form-data.sync="formData1"
        :select-disabled="true"
        @inputFocus="handleInputFocus('value1')"
        @inputChange="handleInputChange($event,'value1')"
      />
      <div class="boundary-mark flex-row-center">
        <i class="el-icon-plus" />
      </div>
      <FunctionForm
        :form-data.sync="formData2"
        :disabled-address="formData1.address"
        @inputFocus="handleInputFocus('value2')"
        @inputChange="handleInputChange($event,'value2')"
      />
      <PricesContent v-if="formData1.address && formData2.address" :show-data="exchangeRate" />
      <el-button
        round
        type="primary"
        :disabled="firstComfirmBtnVal !== 'Supply' && firstComfirmBtnVal !== 'Create'"
        class="m_t40 w_220"
        @click="handleSupply"
      >{{firstComfirmBtnVal}}</el-button>
    </div>
    <el-dialog title="You will receive" custom-class="fe-dialog" :visible.sync="dialogVisible">
      <div class="dialog-content receive-content">
        <div class="receive-count m_b10">{{mint}}</div>
        <div class="receive-token m_b20">{{formData1.symbol}}/{{formData2.symbol}} Pool Tokens</div>
        <p
          class="color-666 f_s14 m_t20 m_b20 f_italic"
        >Output is estimated. If the price changes by more than {{tolerance}}% your transaction will revert.</p>
        <div class="dialog-bg-desc-content">
          <p class="flex-row-between-center p_t5 p_b5">
            <span>{{formData1.symbol}} Deposited</span>
            <span>{{formData1.value}}</span>
          </p>
          <p class="flex-row-between-center p_t5 p_b5">
            <span>{{formData2.symbol}} Deposited</span>
            <span>{{formData2.value}}</span>
          </p>
          <p class="flex-row-between-start p_t5 p_b5">
            <span>Rates</span>
            <span class="flex-colum-center-end">
              <span>1 {{exchangeRate.name1}} = {{exchangeRate.value2}} {{exchangeRate.name2}}</span>
              <span>1 {{exchangeRate.name2}} = {{exchangeRate.value1}} {{exchangeRate.name1}}</span>
            </span>
          </p>
          <p class="flex-row-between-center p_t5 p_b5">
            <span>Share of Pool:</span>
            <span>{{share}}%</span>
          </p>
          <div class="flex-colum-center p_t20">
            <el-button
              round
              type="primary"
              class="m_t10 w_200"
              :loading="isApproving(formData1.address)"
              :disabled="isUSDDApproved"
              @click="approveToken(true)"
            >{{usddApproveBtnVal}}</el-button>
            <el-button
              round
              type="primary"
              class="m_t10 m_l0 w_200"
              :loading="isApproving(formData2.address)"
              :disabled="isOtherApproved"
              @click="approveToken(false)"
            >{{otherApproveBtnVal}}</el-button>
            <el-button
              round
              type="primary"
              class="m_t10 m_l0 w_200"
              :disabled="!isOtherApproved || !isUSDDApproved"
              @click="addLiquidity"
            >Confirm Supply</el-button>
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
import FunctionForm from "./components/function-form.vue";
import PricesContent from "./components/liquidity/prices-content.vue";
import { debounceFn } from "utils/common-fn.js";
import {
  tryParseAmount,
  timeTo,
  getEtherscanLink,
  etherscanMessage,
  waitingMessage,
  handleError
} from "utils/index";
import {
  getTokenDetails,
  getPairFromToken,
  getTokenBalance,
  approveToken,
  getTokenAllowance,
  getUSDDTokenStatic
} from "hooks/token";
import {
  USDD_ADDRESS,
  INDEX_ADDRESS,
  ZERO_ADDRESS,
  APPROVE_STATE,
  STORE_TRACKED_TOKENS
} from "../constants/index";
import { Percent } from "@uniswap/sdk";
import TokenAmount from '../hooks/types/tokenAmount'
import {
  getTotalSupply,
  calculateSlippageAmount,
  addLiquidityWithPermit,
  getPair
} from "../hooks/liquid";
import { storeToken } from "../utils/storage";
import { getNetworkId, signPermitMessage } from "../hooks/wallet";
import { splitSignature } from "@ethersproject/bytes";

const moduleWallet = namespace("moduleWallet");
const moduleBase = namespace("moduleBase");

@Component({
  components: {
    PageTitle,
    FunctionForm,
    PricesContent
  }
})
export default class AddLiquidity extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleBase.State("tolerance") tolerance;
  @moduleBase.State("deadline") deadline;

  usddToken;
  otherToken;
  pair;
  totalSupply;
  inputAmount;
  outputAmount;
  share = "";
  mint = "";
  networkId = "";
  signature;
  pairAddress;

  pairCreated = false;
  usddApproveState = APPROVE_STATE.UNKNOWN;
  otherApproveState = APPROVE_STATE.UNKNOWN;
  dialogVisible = false;
  hasLiquidity = true;
  focusField = "";
  handleChangeDataFn = null;
  loading = false;

  formData1 = {
    title: "Input",
    address: "",
    balance: "",
    symbol: "",
    value: ""
  };

  formData2 = {
    title: "Input",
    address: "",
    balance: "",
    symbol: "",
    value: ""
  };

  exchangeRate = {
    has: false,
    name1: "",
    value1: "",
    name2: "",
    value2: "",
    value3: ""
  };

  get getEnoughSuffice() {
    if (
      Number(this.formData1.value) > Number(this.formData1.balance) ||
      Number(this.formData2.value) > Number(this.formData2.balance)
    ) {
      return false;
    }
    return true;
  }

  get isZero() {
    return Number(this.formData1.value) === 0 || Number(this.formData2.value) === 0
  }

  get firstComfirmBtnVal() {
    if (this.share === "" && !this.pairCreated) {
      return "Select Token";
    }
    if (this.pairCreated && this.share === "" && this.hasLiquidity) {
      return "Input Amount";
    }
    if (!this.formData1.value || !this.formData2.value) {
      return "Input Amount";
    }
    if (this.isZero) {
      return "Invalid Amount"
    }
    if (!this.getEnoughSuffice) {
      return "No Sufficient Balance";
    }
    if (!this.hasLiquidity) {
      return "Create";
    }
    return "Supply";
  }

  get usddApproveBtnVal() {
    if (this.usddApproveState === APPROVE_STATE.UNKNOWN) {
      return "Approve " + this.formData1.symbol;
    }
    if (this.usddApproveState === APPROVE_STATE.APPROVING) {
      return "Approving...";
    }
    return "Approved";
  }

  get isUSDDApproved() {
    return this.usddApproveState === APPROVE_STATE.APPROVED;
  }

  get otherApproveBtnVal() {
    if (this.otherApproveState === APPROVE_STATE.UNKNOWN) {
      return "Approve " + this.formData2.symbol;
    }
    if (this.otherApproveState === APPROVE_STATE.APPROVING) {
      return "Approving...";
    }
    return "Approved";
  }

  get isOtherApproved() {
    return this.otherApproveState === APPROVE_STATE.APPROVED;
  }

  @Watch("currentAccount")
  currentAccountChange(nval, oval) {
    if (nval && !oval) {
      this.getTokenDetails(this.currentAccount, USDD_ADDRESS, "formData1");
    }
  }

  @Watch("formData2.address")
  changeFormData2Token() {
    this.focusField = "";
    this.getTokenDetails(
      this.currentAccount,
      this.formData2.address,
      "formData2"
    );
    this.exchangeRate.name1 = this.formData1.symbol;
    this.exchangeRate.name2 = this.formData2.symbol;
  }

  created() {
    const otherTokenAddress = this.$route.query.type2;
    if (otherTokenAddress) {
      this.formData2.address = otherTokenAddress;
    }
    this.getTokenDetails(this.currentAccount, USDD_ADDRESS, "formData1");
    this.handleChangeDataFn = debounceFn(this.handleChangeData, 300);
    this.networkId = getNetworkId();
  }

  createPair() {
    this.hasLiquidity = true;
    if (this.usddToken && this.otherToken) {
      this.clear();
      getPair(this.networkId, this.otherToken.address)
        .then(pairAddress => {
          if (pairAddress.toLowerCase() === ZERO_ADDRESS) {
            this.hasLiquidity = false;
            this.totalSupply = undefined;
          } else {
            this.pairAddress = pairAddress;
          }
          getPairFromToken(
            this.usddToken,
            this.otherToken,
            this.hasLiquidity ? pairAddress : undefined
          ).then(pair => {
            this.pair = pair;
            this.exchangeRate.has = true;
            this.exchangeRate.name1 = this.usddToken.symbol;
            this.exchangeRate.name2 = this.otherToken.symbol;

            this.exchangeRate.value1 = pair
              .priceOf(pair.token1)
              .toSignificant();
            this.exchangeRate.value2 = pair
              .priceOf(pair.token0)
              .toSignificant();

            if (this.hasLiquidity) {
              getTotalSupply(pairAddress).then(totalSupply => {
                this.totalSupply = new TokenAmount(
                  pair.liquidityToken,
                  totalSupply
                );
              });
            } else {
              this.totalSupply = tryParseAmount("0", pair.liquidityToken);
            }

            this.formData1.value = "";
            this.formData2.value = "";
            this.pairCreated = true;
          });
        })
        .catch(err => {
          this.$message.error("Failed to get pair");
          console.error(err);
        });
    }
  }

  getTokenDetails(currentAccount, addres, fieldName) {
    if (addres === undefined) {
      return;
    }
    this.loading = true;
    getTokenDetails(this.networkId, addres)
      .then(res => {
        if (addres === USDD_ADDRESS) {
          this.usddToken = res;
          this.formData1.address = addres;
          this.formData1.symbol = res.symbol;
          this.createPair();
          getTokenBalance(this.usddToken.address, this.currentAccount)
            .then(balance => {
              const balanceAmount = new TokenAmount(this.usddToken, balance);
              this.formData1.balance = balanceAmount.toSignificant();
              this.loading = false;
            })
            .catch(err => {
              console.error(err);
              this.$message.error(handleError(err))
              this.$router.back();
            });
        } else {
          this.otherToken = res;
          this.formData2.address = addres;
          this.formData2.symbol = res.symbol;
          this.createPair();
          getTokenBalance(this.otherToken.address, this.currentAccount).then(
            balance => {
              const balanceAmount = new TokenAmount(this.otherToken, balance);
              this.formData2.balance = balanceAmount.toSignificant();
              this.loading = false;
            }
          );
        }
      })
      .catch(err => {
        this.loading = false;
        this.otherToken = undefined;
        this.clear();
        this.$message.error("No token found");
        console.error("Failed to get token, ", err);
      });
  }

  handleInputFocus(field) {
    this.focusField = field;
  }

  handleInputChange(val, field) {
    this.handleChangeDataFn(field, val);
  }

  getOutFromIn() {
    const inputValue = this.formData1.value;
    if (inputValue === "" || Number(inputValue) > this.formData1.balance) {
      return;
    }
    const inTokenAmount = tryParseAmount(inputValue.toString(), this.usddToken);
    if (this.hasLiquidity) {
      const inputFromOutput = this.pair
        .priceOf(this.usddToken)
        .quote(inTokenAmount);
      this.formData2.value = inputFromOutput.toSignificant();
      this.outputAmount = new TokenAmount(this.otherToken, inputFromOutput.raw);
    } else {
      if (this.outputAmount !== undefined) {
        this.computNewPairRate(inTokenAmount, this.outputAmount);
      }
    }
    this.inputAmount = inTokenAmount;
    this.computeMint();
  }

  getInputFromOut() {
    const outputValue = this.formData2.value;
    if (outputValue === "" || Number(outputValue) > this.formData2.balance) {
      return;
    }
    const outTokenAmount = tryParseAmount(
      outputValue.toString(),
      this.otherToken
    );
    if (this.hasLiquidity) {
      const outputFromInput = this.pair
        .priceOf(this.otherToken)
        .quote(outTokenAmount);
      this.formData1.value = outputFromInput.toSignificant();
      this.inputAmount = new TokenAmount(this.usddToken, outputFromInput.raw);
    } else {
      if (this.inputAmount !== undefined) {
        this.computNewPairRate(this.inputAmount, outTokenAmount);
      }
    }
    this.outputAmount = outTokenAmount;
    this.computeMint();
  }

  computNewPairRate(inTokenAmount, outTokenAmount) {
    const USDDPerOther = inTokenAmount.divide(outTokenAmount);
    const otherPerUSDD = outTokenAmount.divide(inTokenAmount);

    this.exchangeRate.value1 = otherPerUSDD.toSignificant(6);
    this.exchangeRate.value2 = USDDPerOther.toSignificant(6);
    this.inputAmount = inTokenAmount;
    this.outputAmount = outTokenAmount;
    this.computeMint();
  }

  clear() {
    this.exchangeRate.value1 = "";
    this.exchangeRate.value2 = "";
    this.exchangeRate.value3 = "";
    this.formData2.balance = "";
    this.outputAmount = undefined;
  }

  computeMint() {
    if (!this.inputAmount || !this.outputAmount || !this.totalSupply) {
      return;
    }
    const mint = this.pair.getLiquidityMinted(
      this.totalSupply,
      this.inputAmount,
      this.outputAmount
    );
    if (this.hasLiquidity) {
      const percent = new Percent(mint.raw, this.totalSupply.add(mint).raw);
      this.share = percent.toFixed(2);
      this.exchangeRate.value3 = this.share;
      this.mint = mint.toSignificant();
    } else {
      const amount = new TokenAmount(mint.token, 1000);
      const percent = new Percent(mint.raw, mint.add(amount).raw);
      this.share = percent.toFixed(2);
      this.exchangeRate.value3 = this.share;
      this.mint = mint.toSignificant();
    }
  }

  handleChangeData(field, val) {
    if(Number(val) === 0 && this.focusField === field) {
      return
    }
    const changeType = field === "value1" ? "in_to_out" : "ou_to_in";
    if (this.usddToken && this.otherToken) {
      this.setApproveState(this.usddToken.address, APPROVE_STATE.UNKNOWN);
      this.setApproveState(this.otherToken.address, APPROVE_STATE.UNKNOWN);
      if (changeType === "in_to_out" && this.focusField === "value1") {
        this.getOutFromIn();
      }
      if (changeType === "ou_to_in" && this.focusField === "value2") {
        this.getInputFromOut();
      }
    }
  }

  handleSupply() {
    this.dialogVisible = true;
  }

  addLiquidity() {
    const splagge = Number(this.tolerance * 100);
    const [inputSplagge] = calculateSlippageAmount(this.inputAmount, splagge);
    const [outputSplagge] = calculateSlippageAmount(this.outputAmount, splagge);
    storeToken(STORE_TRACKED_TOKENS, this.otherToken, this.networkId);

    waitingMessage.call(this);

    addLiquidityWithPermit(
      this.networkId,
      this.otherToken.address,
      this.inputAmount.raw.toString(),
      this.outputAmount.raw.toString(),
      inputSplagge.toString(),
      outputSplagge.toString(),
      this.currentAccount,
      this.signature.deadline,
      false,
      this.signature.v,
      this.signature.r,
      this.signature.s
    )
      .then(result => {
        this.dialogVisible = false;
        this.$msgbox.close();
        this.formData1.value = "";
        this.formData2.value = "";
        const url = getEtherscanLink(this.networkId, result.hash);
        etherscanMessage.call(this, url, () => {
          window.location.reload()
        });
      })
      .catch(err => {
        console.error(err);
        this.$msgbox.close();
        this.dialogVisible = false;
        this.$message.error(handleError(err))
      });
  }

  approveToken(isUSDD) {
    if (isUSDD) {
      this.permitSign();
    } else {
      this.approve(this.otherToken.address, this.outputAmount);
    }
  }

  approve(tokenAddress, value) {
    if (this.isApproving(tokenAddress)) {
      this.$message.warning("Approving, please waiting...");
      return;
    }
    const token =
      tokenAddress === this.usddToken.address
        ? this.usddToken
        : this.otherToken;
    const requireAmount =
      tokenAddress === this.usddToken.address
        ? this.inputAmount
        : this.outputAmount;
    // query allowance
    getTokenAllowance(
      tokenAddress,
      this.currentAccount,
      INDEX_ADDRESS
    )
      .then(allowed => {
        const allowedAmount = new TokenAmount(token, allowed);
        // If no sufficient, allowance token
        this.setApproveState(tokenAddress, APPROVE_STATE.APPROVING);
        if (requireAmount.greaterThan(allowedAmount)) {
          approveToken(
            tokenAddress,
            INDEX_ADDRESS,
            value.raw.toString()
          )
            .then(res => {
              const allowanceInterval = setInterval(() => {
                getTokenAllowance(
                  tokenAddress,
                  this.currentAccount,
                  INDEX_ADDRESS
                ).then(allowance => {
                  const allowedAmount = new TokenAmount(token, allowance);
                  if (!requireAmount.greaterThan(allowedAmount)) {
                    this.setApproveState(token.address, APPROVE_STATE.APPROVED);
                    clearInterval(allowanceInterval);
                  }
                });
              }, 5000);
            })
            .catch(err => {
              console.error(err);
              this.$message.error(handleError(err))
              this.setApproveState(token.address, APPROVE_STATE.UNKNOWN);
            });
        } else {
          this.setApproveState(token.address, APPROVE_STATE.APPROVED);
          this.$message.success("Approve success");
        }
      })
      .catch(err => {
        this.$message.error(handleError(err))
        console.error(err);
      });
  }

  permitSign() {
    const usdd = getUSDDTokenStatic();
    const message = {
      tokenName: usdd.name,
      version: "1",
      chainId: getNetworkId().toString(),
      tokenAddress: usdd.address,
      owner: this.currentAccount,
      value: this.inputAmount.raw.toString(),
      deadline: timeTo(Number(this.deadline * 60))
    };
    this.setApproveState(usdd.address, APPROVE_STATE.APPROVING);
    signPermitMessage(message)
      .then(splitSignature)
      .then(signature => {
        this.signature = {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: message.deadline
        };
        this.setApproveState(usdd.address, APPROVE_STATE.APPROVED);
      })
      .catch(err => {
        console.error(err);
        this.setApproveState(usdd.address, APPROVE_STATE.UNKNOWN);
        this.$message.error(handleError(err))
      });
  }

  isApproving(tokenAddress) {
    if(!tokenAddress || !this.usddToken){
      return false
    }
    return tokenAddress === this.usddToken.address
      ? this.usddApproveState === APPROVE_STATE.APPROVING
      : this.otherApproveState === APPROVE_STATE.APPROVING;
  }

  setApproveState(tokenAddress, state) {
    tokenAddress === this.usddToken.address
      ? (this.usddApproveState = state)
      : (this.otherApproveState = state);
  }
}
</script>
<style lang="scss" scoped>
.add-liquidity {
  .boundary-mark {
    padding: 20px 0;
  }
  .el-icon-plus {
    color: $lightTextColor;
  }
  .receive-content {
    color: $textColor;
    .receive-count {
      font-weight: bold;
      font-size: 28px;
    }
    .receive-token {
      font-size: 20px;
    }
  }
}
</style>
<style lang="scss">
.add-liquidity {
  .el-dialog__body {
    padding-bottom: 0;
  }
}
</style>
