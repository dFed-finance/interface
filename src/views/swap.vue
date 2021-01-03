<template>
  <div class="wrap swap-wrap" v-loading="loading">
    <HcoFunction activeTab="swap">
      <div slot="content" class="content wrap-content">
        <FunctionForm
          :form-data.sync="formData1"
          :select-disabled="formData1.address==USDD_ADDRESS"
          @inputFocus="handleInputFocus('value1')"
          @inputChange="handleInputChange($event,'value1')"
          @changeToken="handleChangeToken($event,'formData1')"
        />
        <div class="p_t20 p_b20 flex-row-center">
          <i class="el-icon-bottom c_pointer" @click="handleToExchange" />
        </div>
        <FunctionForm
          :form-data.sync="formData2"
          :select-disabled="formData2.address==USDD_ADDRESS"
          @inputFocus="handleInputFocus('value2')"
          @inputChange="handleInputChange($event,'value2')"
          @changeToken="handleChangeToken($event,'formData2')"
        />

        <div v-if="price1 && price2" class="desc-content m_t20 color-666">
          <PricesContent
            :data="{
              price1,
              price2,
              symbol1:formData1.symbol,
              symbol2:formData2.symbol,
              minReceived,
              priceImpact,
              providerFee,
              caused:liquidationCaused,
              total:totalLiquidation
            }"
          />
        </div>
        <div class="flex-row-center">
          <el-button
            round
            type="primary"
            :disabled="firstComfirmBtnVal !== 'Swap'"
            class="m_t40 w_220"
            @click="handleSwap"
          >{{firstComfirmBtnVal}}</el-button>
        </div>
        <!-- 二次确认弹窗 -->
        <el-dialog title="Confirm Swap" custom-class="fe-dialog" :visible.sync="dialogVisible">
          <div class="dialog-content">
            <div>
              <DescComponent :title="formData1.value" :value="formData1.symbol" class-name="f_s20" />
              <p class="flex-row-center">
                <i class="el-icon-bottom color-666" />
              </p>
              <DescComponent :title="formData2.value" :value="formData2.symbol" class-name="f_s20" />
            </div>
            <p
              class="color-666 f_s14 m_t20 m_b20 f_italic"
            >Output is estimated. If the price changes by more than {{formData2.value}} {{formData2.symbol}} your transaction will revert.</p>
            <div class="dialog-bg-desc-content">
              <PricesContent
                :data="{
                  price1,
                  price2,
                  symbol1:formData1.symbol,
                  symbol2:formData2.symbol,
                  minReceived,
                  priceImpact,
                  providerFee,
                  caused:liquidationCaused,
                  total:totalLiquidation
                }"
              />

              <div class="flex-colum-center p_t20">
                <el-button
                  round
                  type="primary"
                  class="m_t10 w_200"
                  :disabled="isUSDDApproved"
                  v-show="isBuy"
                  :loading="usddApproveState === 1"
                  @click="approveToken(true)"
                >{{usddApproveBtnVal}}</el-button>
                <el-button
                  round
                  type="primary"
                  class="m_t10 m_l0 w_200"
                  :disabled="isOtherApproved"
                  v-show="!isBuy"
                  :loading="otherApproveState === 1"
                  @click="approveToken(false)"
                >{{otherApproveBtnVal}}</el-button>
                <el-button
                  :loading="btnLoading"
                  round
                  type="primary"
                  class="m_t10 m_l0 w_200"
                  :disabled="confirmBtnDisabled"
                  @click="handleConfirmSwap"
                >Confirm Swap</el-button>
              </div>
            </div>
          </div>
        </el-dialog>
      </div>
    </HcoFunction>
  </div>
</template>
<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { debounceFn } from "utils/common-fn.js";
import {
  etherscanMessage,
  waitingMessage,
  tryParseAmount,
  getEtherscanLink,
  timeTo,
  handleError
} from "utils/index.js";
import { Percent, JSBI, Price as UPrice } from "@uniswap/sdk";
import TokenAmount from '../hooks/types/tokenAmount'
import HcoFunction from "./components/hco-function";
import FunctionForm from "./components/function-form.vue";
import DescComponent from "components/desc-component.vue";
import Price from "./components/swap/price.vue";
import PricesContent from "./components/swap/prices-content.vue";
import {
  USDD_ADDRESS,
  ZERO_ADDRESS,
  INDEX_ADDRESS,
  APPROVE_STATE
} from "../constants/index";
import {
  getTokenDetails,
  getTokenBalance,
  getPairFromToken,
  getTokenAllowance,
  approveToken
} from "../hooks/token";
import { signPermitMessage } from "../hooks/wallet";
import {
  getPair,
  calculateSlippageAmount
} from "../hooks/liquid";
import { sellToken, buyTokenWithPermit, removeFee } from "../hooks/swap";
import { splitSignature } from "@ethersproject/bytes";
import {
  getAllDebt,
  getTokenConsiderLiquidation,
  getUSDDConsiderLiquidation
} from "../hooks/debt";

const moduleWallet = namespace("moduleWallet");
const moduleBase = namespace("moduleBase");

@Component({
  components: {
    HcoFunction,
    FunctionForm,
    DescComponent,
    Price,
    PricesContent
  }
})
export default class Swap extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleBase.State("tolerance") slippageTolerance;
  @moduleBase.State("deadline") deadline;
  @moduleWallet.State("chainId") chainId;

  dialogVisible = false;
  btnLoading = false;
  focusField = "";
  handleChangeDataFn = null;
  USDD_ADDRESS = USDD_ADDRESS;
  price1 = 0;
  price2 = 0;
  minReceived = 0;
  priceImpact = 0;
  providerFee = 0;
  liquidationCaused = 0;
  totalLiquidation = "";
  loading = false;
  pairCreated = false;
  usddApproveState = APPROVE_STATE.UNKNOWN;
  otherApproveState = APPROVE_STATE.UNKNOWN;
  pairExsit = true;

  pair = undefined;
  pairAddress = "";
  usddToken = undefined;
  otherToken = undefined;
  inTokenAmount = undefined;
  outTokenAmount = undefined;
  outTokenAmountWithoutLiquidation = undefined;
  usddBalanceAmount;
  tokenBalanceAmount;
  minOutAmount = "";
  networkId = "";
  signature = undefined;
  debts = undefined;
  removeCount = 0;
  invalidInput = false;

  formData1 = {
    title: "From",
    address: USDD_ADDRESS,
    balance: "",
    symbol: "",
    value: ""
  };

  formData2 = {
    title: "To",
    address: "",
    balance: "",
    symbol: "",
    value: ""
  };

  created() {
    this.handleChangeDataFn = debounceFn(this.handleChangeData, 300);
    this.handleTokenDetails(this.currentAccount, USDD_ADDRESS);
  }

  get isBuy() {
    return this.formData1.address === USDD_ADDRESS;
  }

  get getEnoughSuffice() {
    if (this.isBuy && Number(this.usddBalanceAmount.toSignificant()) < Number(this.formData1.value)) {
      return false;
    }
    if (!this.isBuy && Number(this.tokenBalanceAmount.toSignificant()) < Number(this.formData1.value)) {
      return false;
    }
    return true;
  }

  get isZero() {
    return Number(this.formData1.value) === 0 || Number(this.formData2.value) === 0
  }

  get firstComfirmBtnVal() {
    if (!this.pairExsit) {
      return "No Pair";
    }
    if (!this.pairCreated) {
      return "Select Token";
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
    if (this.invalidInput) {
      return "Invalid Input";
    }
    return "Swap";
  }

  get confirmBtnDisabled() {
    return this.isBuy ? !this.isUSDDApproved : !this.isOtherApproved
  }

  get usddApproveBtnVal() {
    if (this.usddApproveState === APPROVE_STATE.UNKNOWN) {
      return "Approve USDD";
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
      return "Approve " + this.tokenSymbol;
    }
    if (this.otherApproveState === APPROVE_STATE.APPROVING) {
      return "Approving...";
    }
    return "Approved";
  }

  get isOtherApproved() {
    return this.otherApproveState === APPROVE_STATE.APPROVED;
  }

  get tokenSymbol() {
    return this.formData1.symbol === "USDD"
      ? this.formData2.symbol
      : this.formData1.symbol;
  }

  // TODO: can't do like this
  handleToExchange() {
    [this.formData1, this.formData2] = [this.formData2, this.formData1];
    [this.formData1.title, this.formData2.title] = [this.formData2.title, this.formData1.title];

    // swap price and amount
    [this.price1, this.price2] = [this.price2, this.price1];
    this.focusField = "value1"
    this.handleChangeData("value1", this.formData2.value)
  }

  handleInputFocus(field) {
    this.focusField = field;
  }

  handleInputChange(val, field) {
    this.handleChangeDataFn(field, val);
  }

  handleChangeToken(token, formName) {
    this.handleTokenDetails(
      this.currentAccount,
      token.address,
      formName === "formData1"
    );
  }

  handleChangeData(field, val) {
    if (!this.usddToken || !this.otherToken) {
      return;
    }
    if(Number(val) === 0) {
      return;
    }
    const changeType = field === "value1" ? "in_to_out" : "out_to_in";

    // User may has clicked approve btn before change value
    this.setApproveState(this.usddToken.address, APPROVE_STATE.UNKNOWN);
    this.setApproveState(this.otherToken.address, APPROVE_STATE.UNKNOWN);

    let inputValue;
    this.focusField === "value1"
      ? (inputValue = this.formData1.value)
      : (inputValue = this.formData2.value);

    // validate input value
    if (!this.validateInput(inputValue, this.focusField)) {
      return;
    }

    // dispatch action
    if (changeType === "in_to_out" && this.focusField === "value1") {
      this.getOutFromIn(inputValue);
    }
    if (changeType === "out_to_in" && this.focusField === "value2") {
      this.getInputFromOut(inputValue);
    }
  }

  validateInput(inputValue, fieldName) {
    this.invalidInput = true;
    const tokenName =
      fieldName === "value1" ? this.formData1.symbol : this.formData2.symbol;
    if (tokenName === this.usddToken.symbol) {
      try {
        const converAmount = tryParseAmount(inputValue, this.usddToken);
        if (fieldName === "value2" && (converAmount.greaterThan(this.pair.reserve0) || converAmount.equalTo(this.pair.reserve0))) {
          this.$message.error("No enough USDD in pool to get");
          return false;
        }
      } catch (e) {
        this.$message.error("Invalid decimals of " + this.usddToken.symbol)
        return false;
      }
    } else {
      try {
        const converAmount = tryParseAmount(inputValue, this.otherToken);
        if (fieldName === "value2" && (converAmount.greaterThan(this.pair.reserve1) || converAmount.equalTo(this.pair.reserve1))) {
          this.$message.error("No enough " + tokenName + " in pool to get");
          return false;
        }
      } catch (e) {
        this.$message.error("Invalid decimals of " + this.otherToken.symbol)
        return false;
      }
    }
    this.invalidInput = false;
    return true;
  }

  getOutFromIn(inputValue) {
    if (!inputValue || !this.pairCreated) {
      return;
    }
    this.isBuy
      ? (this.inTokenAmount = tryParseAmount(inputValue, this.usddToken))
      : (this.inTokenAmount = tryParseAmount(inputValue, this.otherToken));

    if (!this.isBuy) {
      const [getUSDD, removeList] = getUSDDConsiderLiquidation(
        this.pair,
        this.inTokenAmount,
        this.debts
      );
      const tmp = new TokenAmount(this.usddToken, getUSDD);
      const getUSDDWithFee = removeFee(tmp);
      // show data in page
      this.setOutput(getUSDDWithFee);
      this.removeCount = removeList.length;
      this.calculateCausedUSDD(removeList);
    } else {
      const [out] = this.pair.getOutputAmount(this.inTokenAmount);
      this.setOutput(out);
      this.clearCausedUSDD()
    }
    this.calculateFeeAndslippage();
    this.calculateImpact();
  }

  setOutput(amount) {
    this.formData2.value = amount.toSignificant();
    this.outTokenAmount = amount;
  }

  getInputFromOut(outputValue) {
    if (!outputValue || !this.pairCreated) {
      return;
    }
    this.isBuy
      ? (this.outTokenAmount = tryParseAmount(outputValue, this.otherToken))
      : (this.outTokenAmount = tryParseAmount(outputValue, this.usddToken));

    if (!this.isBuy) {
      // Deduct the fee before calculating
      const usddWithoutFee = removeFee(this.outTokenAmount);
      const [getTokenWithFee, removeList] = getTokenConsiderLiquidation(
        this.pair,
        usddWithoutFee,
        this.debts
      );

      const getTokenWithFeeAmount = new TokenAmount(
        this.otherToken,
        getTokenWithFee
      );
      // show data in page
      this.setIutput(getTokenWithFeeAmount);
      this.removeCount = removeList.length;

      this.calculateCausedUSDD(removeList);
    } else {
      const [out] = this.pair.getInputAmount(this.outTokenAmount);
      this.setIutput(out);
      this.clearCausedUSDD()
    }

    this.calculateFeeAndslippage();
    this.calculateImpact();
  }

  setIutput(amount) {
    this.formData1.value = amount.toSignificant();
    this.inTokenAmount = amount;
  }

  calculateImpact() {
    const inToken = this.inTokenAmount.token;
    const outToken = this.outTokenAmount.token;
    const beforeSwapTokenAmountRaw = this.pair.priceOf(inToken).raw.multiply(this.inTokenAmount.raw).quotient
    const amountBeforeSwap = new TokenAmount(outToken, beforeSwapTokenAmountRaw)
    const amountAfterSwap = this.outTokenAmount

    if (amountAfterSwap.greaterThan(amountBeforeSwap)) {
      this.priceImpact = 0;
    } else {
      const percentage = new Percent(
        amountBeforeSwap.subtract(amountAfterSwap).raw,
        amountBeforeSwap.raw
      );
      this.priceImpact = percentage.toSignificant() + "%";
    }
  }

  calculateCausedUSDD(liquidationList) {
    if (liquidationList === undefined) {
      this.totalLiquidation = 0 + " " + this.usddToken.symbol;
      this.liquidationCaused = 0
    }
    let causedUSDD = JSBI.BigInt(0);
    for (const item of liquidationList) {
      causedUSDD = JSBI.add(causedUSDD, item.repayAmount.raw);
    }
    const causedUSDDAmount = new TokenAmount(this.usddToken, causedUSDD);
    this.totalLiquidation = causedUSDDAmount.toSignificant() + " " + this.usddToken.symbol;
    this.liquidationCaused = liquidationList.length
  }

  clearCausedUSDD() {
    this.totalLiquidation = 0 + " " + this.usddToken.symbol;
    this.liquidationCaused = 0
  }

  handleSwap() {
    this.dialogVisible = true;
  }

  calculateFeeAndslippage() {
    // Calculate fee
    const usddAmount = this.isBuy ? this.inTokenAmount : this.outTokenAmount;
    const usddWithoutFee = removeFee(usddAmount);
    const fee = usddAmount.subtract(usddWithoutFee);
    this.providerFee = fee.toSignificant() + " USDD";

    // Calculate min output
    const splagge = Number(this.slippageTolerance * 100);
    const [outputSplagge] = calculateSlippageAmount(
      this.outTokenAmount,
      splagge
    );
    const outputMin = new TokenAmount(this.outTokenAmount.token, outputSplagge);
    this.minReceived =
      outputMin.toSignificant() + " " + this.outTokenAmount.token.symbol;
    this.minOutAmount = outputSplagge.toString();

    // calculate price
    if (this.isBuy) {
      const usddBasePrice = new UPrice(this.usddToken, this.otherToken, this.inTokenAmount.raw, this.outTokenAmount.raw)
      const tokenBasePrice = new UPrice(this.otherToken, this.usddToken, this.outTokenAmount.raw, this.inTokenAmount.raw)
      this.price2 = usddBasePrice.toSignificant()
      this.price1 = tokenBasePrice.toSignificant()
    }else{
      const usddBasePrice = new UPrice(this.usddToken, this.otherToken, this.outTokenAmount.raw, this.inTokenAmount.raw)
      const tokenBasePrice = new UPrice(this.otherToken, this.usddToken, this.inTokenAmount.raw, this.outTokenAmount.raw)
      this.price2 = usddBasePrice.toSignificant()
      this.price1 = tokenBasePrice.toSignificant()
    }
  }

  handleConfirmSwap() {
    const deadline = timeTo(Number(this.deadline * 60));
    this.isBuy
      ? this.handleBuy(
        this.otherToken.address,
        this.inTokenAmount.raw.toString(),
        this.minOutAmount,
        this.currentAccount,
        this.signature.deadline,
        false,
        this.signature.v,
        this.signature.r,
        this.signature.s
      )
      : this.handleSell(
        this.otherToken.address,
        this.inTokenAmount.raw.toString(),
        this.minOutAmount,
        this.currentAccount,
        deadline
      );
  }

  handleSell(tokenAddress, inAmount, minOutAmount, to, deadline) {
    waitingMessage.call(this);
    sellToken(
      this.chainId,
      tokenAddress,
      inAmount,
      minOutAmount,
      to,
      deadline
    )
      .then(res => {
        this.handleSwapResult(res);
      })
      .catch(err => {
        console.error(err);
        this.handleSwapError(err);
      })
      .finally(() => {
        this.dialogVisible = false;
        this.$msgbox.close()
      })
  }

  handleBuy(
    tokenAddress,
    inAmount,
    minOutAmount,
    to,
    deadline,
    approveMax,
    v,
    r,
    s
  ) {
    waitingMessage.call(this);
    buyTokenWithPermit(
      this.chainId,
      tokenAddress,
      inAmount,
      minOutAmount,
      to,
      deadline,
      approveMax,
      v,
      r,
      s
    )
      .then(res => {
        this.handleSwapResult(res);
      })
      .catch(err => {
        console.error(err);
        this.handleSwapError(err);
      })
      .finally(() => {
        this.dialogVisible = false;
        this.$msgbox.close()
      });
  }

  handleSwapResult(res) {
    this.$msgbox.close();
    setTimeout(()=>{
      this.clear();
      const url = getEtherscanLink(this.chainId, res.hash);
      etherscanMessage.call(this, url, () => {
        window.location.reload()
      });
    },0)
  }

  handleSwapError(err) {
    this.$message.error(handleError(err))
  }

  handleTokenDetails(currentAccount, addres, isFormData1) {
    if (addres === undefined) {
      return;
    }
    this.loading = true;
    getTokenDetails(this.chainId, addres)
      .then(res => {
        if (addres === USDD_ADDRESS) {
          this.usddToken = res;
          this.formData1.address = addres;
          this.formData1.symbol = res.symbol;
          this.createPair(isFormData1);
          getTokenBalance(this.usddToken.address, this.currentAccount)
            .then(balance => {
              const balanceAmount = new TokenAmount(this.usddToken, balance);
              this.formData1.balance = balanceAmount.toSignificant();
              this.usddBalanceAmount = balanceAmount;
              this.loading = false;
            })
            .catch(err => {
              console.error(err);
              this.$message.error(handleError(err));
              this.$router.back();
            });
        } else {
          this.otherToken = res;
          this.createPair(isFormData1);
          getTokenBalance(this.otherToken.address, this.currentAccount).then(
            balance => {
              const balanceAmount = new TokenAmount(this.otherToken, balance);
              this.tokenBalanceAmount = balanceAmount;
              if (isFormData1) {
                this.formData1.address = addres;
                this.formData1.symbol = res.symbol;
                this.formData1.balance = balanceAmount.toSignificant();
              } else {
                this.formData2.address = addres;
                this.formData2.symbol = res.symbol;
                this.formData2.balance = balanceAmount.toSignificant();
              }
              this.loading = false;
            }
          );
        }
      })
      .catch(err => {
        this.loading = false;
        this.otherToken = undefined;
        this.formData2.balance = "";
        this.clear();
        this.$message.error("No token found");
        console.error("Failed to get token, ", err);
      });
  }

  createPair(isFormData1) {
    if (this.usddToken && this.otherToken) {
      this.pairCreated = false;
      this.clear();
      getPair(this.chainId, this.otherToken.address)
        .then(pairAddress => {
          if (pairAddress.toLowerCase() === ZERO_ADDRESS) {
            this.$message.error("Pair not found");
            this.pairExsit = false;
            return;
          }
          this.pairAddress = pairAddress;
          console.log(this.usddToken)
          console.log(this.otherToken)
          getPairFromToken(this.usddToken, this.otherToken, pairAddress).then(
            pair => {
              this.pair = pair;
              this.price1 = isFormData1
                ? pair.priceOf(pair.token0).toSignificant()
                : pair.priceOf(pair.token1).toSignificant();
              this.price2 = isFormData1
                ? pair.priceOf(pair.token1).toSignificant()
                : pair.priceOf(pair.token0).toSignificant();

              // get all debts used for calculating USDD amount
              this.getDebts();

              this.clear();
              this.pairCreated = true;
              this.pairExsit = true;
            }
          );
        })
        .catch(err => {
          this.$message.error("Failed to get pair");
          console.error(err);
        });
    }
  }

  async getDebts() {
    const debtInfo = await getAllDebt(this.chainId, this.pairAddress, this.otherToken);
    this.debts = debtInfo;
  }

  approveToken(isUSDD) {
    isUSDD
      ? this.permitSign(
        this.usddToken,
        this.isBuy
          ? this.inTokenAmount.raw.toString()
          : this.outTokenAmount.raw.toString()
      )
      : this.approve(
        this.otherToken.address,
        this.isBuy ? this.outTokenAmount : this.inTokenAmount
      );
  }

  approve(tokenAddress, requireAmount) {
    if (this.isApproving(tokenAddress)) {
      return;
    }
    const token =
      tokenAddress === this.usddToken.address
        ? this.usddToken
        : this.otherToken;
    // query allowance
    getTokenAllowance(
      tokenAddress,
      this.currentAccount,
      INDEX_ADDRESS
    )
      .then(allowed => {
        const allowedAmount = new TokenAmount(token, allowed);
        // If no sufficient, allowance token
        this.setApproveState(token.address, APPROVE_STATE.APPROVING);
        if (requireAmount.greaterThan(allowedAmount)) {
          // state control
          approveToken(
            tokenAddress,
            INDEX_ADDRESS,
            requireAmount.raw.toString()
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

  permitSign(usdd, value) {
    const message = {
      tokenName: usdd.name,
      version: "1",
      chainId: this.chainId.toString(),
      tokenAddress: usdd.address,
      owner: this.currentAccount,
      value: value,
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
    if(!tokenAddress){
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

  clear() {
    this.formData1.value = "";
    this.formData2.value = "";
    this.initValue()
  }

  initValue() {
    this.minReceived = 0
    this.providerFee = 0
    this.liquidationCaused = 0
    this.totalLiquidation = 0 + " USDD"
    this.priceImpact = "0%"
  }
}
</script>
<style lang="scss" scoped>
.swap-wrap {
}
</style>
