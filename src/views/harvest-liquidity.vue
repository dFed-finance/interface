<template>
  <div class="harvest-liquidity">
    <PageTitle
      page-title="Mining Harvest"
      :has-back="true"
      page-tip="The numbers in page are calculated by simulation, they may change from time to time, please refer to the status on the blockchain and in the wallet to get the real situation."
    />
    <div class="harvest-content">
      <p class="m_b40 m_t60 f_s20 text-center">Your {{FEDNAME}}: <span class="f_s20">{{harvestParams.FED}}</span></p>
      <!-- <p class="m_b20">How many do you want to harvest？</p> -->
      <div class="flex-colum-between-center h_min210">
        <!-- <FeInput
          type="number"
          :is-require="true"
          :min="0"
          :max="harvestParams.FED || 100000000"
          :default-value="harvestParams.FED"
          v-model="harvestValue"
        /> -->
        <el-button
          round
          type="primary"
          class="m_t40 w_200"
          :loading="ajaxLoading"
          :disabled="Number(harvestValue) == 0"
          @click="handleClickHarvest"
        >Harvest</el-button>
      </div>
    </div>
  </div>
</template>
<script>
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from "vuex-class"
import PageTitle from 'components/page-title.vue'
import FeInput from 'components/input.vue'
import { getNetworkId } from "../hooks/wallet";
import { harvest } from 'hooks/liquid.js'
import { etherscanMessage, getEtherscanLink, handleError } from 'utils/index.js'
import {FEDNAME} from "constants/index"

const moduleWallet = namespace("moduleWallet")
const moduleLiquidity = namespace("moduleLiquidity")

@Component({
  components: {
    PageTitle,
    FeInput
  }
})
export default class Harvest extends Vue{
  @moduleWallet.State('currentAccount') currentAccount
  @moduleLiquidity.State('harvestParams') harvestParams

  FEDNAME = FEDNAME
  ajaxLoading = false
  harvestValue = ''

  created(){
    const { pairAddres } = this.$route.query;
    if(!pairAddres || !this.harvestParams.tokenA || !this.harvestParams.tokenB){
      this.$router.push('/pool');
      return
    }
    this.harvestValue = this.harvestParams.FED;
  }

  handleClickHarvest(){
    this.ajaxLoading = true;
    harvest(this.harvestParams.pairAddress, this.currentAccount).then(res=>{
      const url = getEtherscanLink(getNetworkId(), res.hash);
      etherscanMessage.call(this,url,()=>{
        this.harvestValue = '';
      })
    }).catch(err=>{
      this.$message.error(handleError(err))
      console.error(err)
    }).finally(()=>{
      this.ajaxLoading = false;
    })
  }
}
</script>
<style lang="scss" scoped>

</style>
