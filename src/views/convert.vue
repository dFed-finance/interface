<template>
  <div class="wrap convert-wrap">
    <HcoFunction activeTab="convert">
      <div slot="content" class="convert-content content">
        <div class="desc-tit">Convert USDT from/to USDD</div>
        <div class="change-direction" v-if="convertStatus">
          <span>{{usdtToken.symbol}}</span>
          <i class="el-icon-right c_pointer sk--hover-text" @click="changeConvertStatus"></i>
          <span>{{usddToken.symbol}}</span>
        </div>
        <div class="change-direction" v-else>
          <span>{{usddToken.symbol}}</span>
          <i class="el-icon-right c_pointer sk--hover-text" @click="changeConvertStatus"></i>
          <span>{{usdtToken.symbol}}</span>
        </div>
        <div class="balance-desc">Balance: {{tokenBalance}}</div>
        <div class="form-input-wrap">
          <FeInput
            type="number"
            :is-require="true"
            :min="0"
            :max="convertStatus ? usdtBalance : usddBalance"
            v-model="inputValue"
          />
          <span class="btn-max" @click="handleClickMax">MAX</span>
        </div>
        <div class="btn-group">
          <el-button
            v-if="convertStatus"
            :loading="approveBtnLoading"
            round
            type="primary"
            :disabled="this.inputValue==0 || isUSDTApproved"
            @click="approveBtnCall"
          >{{usddApproveBtnVal}}</el-button>
          <el-button
            :loading="btnLoading"
            round
            type="primary"
            :disabled="convertBtnDisabled"
            @click="handleClickConvert"
          >{{convertBtnVal}}</el-button>
        </div>
      </div>
    </HcoFunction>
  </div>
</template>
<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import HcoFunction from "./components/hco-function";
import FeInput from "components/input.vue";
import {
  getTokenBalance,
  getUSDDTokenStatic,
  getUSDTTokenStatic,
  convertUSDTToUSDD,
  convertUSDDToUSDT,
  getTokenAllowance,
  approveToken
} from "../hooks/token";
import TokenAmount from '../hooks/types/tokenAmount'
import {
  tryParseAmount,
  getEtherscanLink,
  etherscanMessage,
  handleError
} from "../utils/index";
import { APPROVE_STATE, USDD_ADDRESS } from "../constants/index";

const moduleWallet = namespace("moduleWallet");
const moduleBase = namespace("moduleBase");
const CONVERT_TYPE = {
  USDT_TO_USDD: true,
  USDD_TO_USDT: false
};

@Component({
  components: {
    HcoFunction,
    FeInput
  }
})
export default class Convert extends Vue {
  @moduleWallet.State("currentAccount") currentAccount;
  @moduleBase.State("deadline") deadline;

  usdtToken = {
    address: "",
    symbol: "USDT"
  };

  usddToken = {
    address: "",
    symbol: "USDD"
  };

  convertStatus = CONVERT_TYPE.USDT_TO_USDD;
  usdtApproveState = APPROVE_STATE.UNKNOWN;
  inputValue = 0;
  usdtBalance = 0;
  usddBalance = 0;
  approveBtnLoading = false;
  btnLoading = false;
  usdd;
  usdt;

  get tokenBalance() {
    return this.convertStatus === CONVERT_TYPE.USDT_TO_USDD
      ? this.usdtBalance + " " + this.usdtToken.symbol
      : this.usddBalance + " " + this.usddToken.symbol;
  }

  get convertBtnVal() {
    if (Number(this.inputValue) === 0) {
      return "Input Amount";
    }
    if (
      this.convertStatus === CONVERT_TYPE.USDT_TO_USDD &&
      Number(this.inputValue) > this.usdtBalance
    ) {
      return "No Sufficient USDT";
    }
    if (
      this.convertStatus === CONVERT_TYPE.USDD_TO_USDT &&
      Number(this.inputValue) > this.usddBalance
    ) {
      return "No Sufficient USDD";
    }
    if (this.convertStatus === CONVERT_TYPE.USDT_TO_USDD && !this.isUSDTApproved) {
      return "Need Approve"
    }
    return "Convert";
  }

  get usddApproveBtnVal() {
    if (this.usdtApproveState === APPROVE_STATE.UNKNOWN) {
      return "Approve USDT";
    }
    if (this.usdtApproveState === APPROVE_STATE.APPROVING) {
      return "Approving...";
    }
    return "Approved";
  }

  get isUSDTApproved() {
    return this.usdtApproveState === APPROVE_STATE.APPROVED;
  }

  get convertBtnDisabled() {
    return this.convertBtnVal !== "Convert";
  }

  async created() {
    const usdd = getUSDDTokenStatic(this.chainId);
    const usdt = getUSDTTokenStatic(this.chainId);
    // 获得非稳定币的余额
    const usddBalance = await getTokenBalance(
      usdd.address,
      this.currentAccount
    );
    const usdtBalance = await getTokenBalance(
      usdt.address,
      this.currentAccount
    );

    const usddAmount = new TokenAmount(usdd, usddBalance);
    const usdtAmount = new TokenAmount(usdt, usdtBalance);
    this.usddBalance = usddAmount.toSignificant();
    this.usdtBalance = usdtAmount.toSignificant();
    this.usdd = usdd;
    this.usdt = usdt;
  }

  changeConvertStatus() {
    this.convertStatus =
      this.convertStatus === CONVERT_TYPE.USDT_TO_USDD
        ? CONVERT_TYPE.USDD_TO_USDT
        : CONVERT_TYPE.USDT_TO_USDD;
    this.inputValue = 0;
  }

  handleClickMax() {
    if (this.convertStatus === CONVERT_TYPE.USDT_TO_USDD) {
      this.inputValue = this.usdtBalance;
    } else {
      this.inputValue = this.usddBalance;
    }
  }

  handleClickConvert() {
    this.btnLoading = true;
    if (this.convertStatus === CONVERT_TYPE.USDT_TO_USDD) {
      try{
        const inputAmount = tryParseAmount(this.inputValue, this.usdt);
        convertUSDTToUSDD(this.currentAccount, inputAmount.raw.toString())
          .then(res => {
            this.etherscan(res.hash);
          })
          .catch(err => {
            console.error(err);
            this.$message.error(handleError(err))
          })
          .finally(res=>{
            this.btnLoading = false;
          });
      } catch (e) {
        this.$message.error("Invalid input value");
      }
    } else {
      try{
        const inputAmount = tryParseAmount(this.inputValue, this.usdd);
        convertUSDDToUSDT(inputAmount.raw.toString())
          .then(res => {
            this.etherscan(res.hash);
          })
          .catch(err => {
            console.error(err);
            this.$message.error(handleError(err))
          })
          .finally(res=>{
            this.btnLoading = false;
          });
      } catch (err) {
        this.$message.error("Invalid input value");
      }
    }
  }

  isApproving(tokenAddress) {
    return this.usdtApproveState === APPROVE_STATE.APPROVING;
  }

  approveBtnCall() {
    try {
      const inputAmount = tryParseAmount(this.inputValue, this.usdt);
      if(inputAmount){
        this.approve(this.usdt.address, inputAmount)
      }else{
        this.$message.warning("Please input amount")
      }
    } catch (err) {
      this.$message.error("Invalid input value");
    }
  }

  approve(tokenAddress, requireAmount) {
    if (this.isApproving(tokenAddress)) {
      return;
    }
    const token = this.usdt
    // query allowance
    getTokenAllowance(tokenAddress, this.currentAccount, USDD_ADDRESS)
      .then(allowed => {
        const allowedAmount = new TokenAmount(token, allowed);
        // If no sufficient, allowance token
        if (requireAmount.greaterThan(allowedAmount)) {
          // state control
          this.setApproveState(token.address, APPROVE_STATE.APPROVING);
          approveToken(tokenAddress, USDD_ADDRESS, requireAmount.raw.toString())
            .then(res => {
              const allowanceInterval = setInterval(() => {
                getTokenAllowance(
                  tokenAddress,
                  this.currentAccount,
                  USDD_ADDRESS
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

  setApproveState(tokenAddress, state) {
    this.usdtApproveState = state;
    if (state === APPROVE_STATE.APPROVING) {
      this.approveBtnLoading = true;
    }else{
      this.approveBtnLoading = false;
    }
  }

  etherscan(hash) {
    const url = getEtherscanLink(this.chainId, hash);
    etherscanMessage.call(this, url, () => {
      window.location.reload()
    });
  }
}
</script>
<style lang="scss" scoped>
.convert-content {
  min-height: 210px;
  .desc-tit {
    padding-bottom: 40px;
    font-size: 20px;
    text-align: center;
  }
  .change-direction {
    padding-bottom: 40px;
    font-size: 20px;
    text-align: center;
    font-weight: bold;
    i {
      margin: 0 10px;
    }
  }
  .balance-desc {
    margin-bottom: 10px;
    text-align: right;
  }
}
</style>
