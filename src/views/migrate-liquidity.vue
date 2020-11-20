<template>
  <div class="migrate-liquidity">
    <PageTitle page-title="Migrate Liquidity" :has-back="true" page-tip="Migrate your liquidity tokens from other DEX to dFed.finance."/>
    <div class="content flex-colum-center m_b40">
      <p class="m_b20 tip-text">For each pool shown below, click migrate to remove your liquidity from other DEX and deposit it into dFed.finance.</p>
      <FeInput
        v-model="tokenAddress"
        type="text"
        placeholder="Enter a token address to find liquidity"
      />
    </div>
    <LiquidityList
      :loading="ajaxLoading"
      :data="liquidsDataList"
      :action="`migrate`"
      @callback="migrateListCallBack"
    />
  </div>
</template>
<script>
import { Component, Vue, Watch } from 'vue-property-decorator'
import { namespace } from "vuex-class"
import { getOtherLiquids } from 'hooks/liquid'
import FeInput from 'components/input.vue'
import PageTitle from 'components/page-title.vue'
import LiquidityList from './components/liquidity/liquidity-list.vue'

const moduleWallet = namespace("moduleWallet")

@Component({
  components:{
    FeInput,
    PageTitle,
    LiquidityList
  }
})
export default class MigrateLiquidity extends Vue{
  @moduleWallet.State('currentAccount') currentAccount

  ajaxLoading = true
  tokenAddress = ''
  liquidsDataList = []

  @Watch('currentAccount')
  currentAccountChange(nval,oval){
    if(nval && !oval){
      this.getLiquidsData(nval)
    }
  }

  created(){
    if(this.currentAccount){
      this.getLiquidsData(this.currentAccount)
    }
  }

  getLiquidsData(currentAccount){
    this.ajaxLoading = true;
    getOtherLiquids(currentAccount).then(res=>{
      this.liquidsDataList = res || [];
    }).catch(()=>{
      this.$message.err('Failed to fetch data')
    }).finally(()=>{
      this.ajaxLoading = false;
    })
  }

  migrateListCallBack(params){}
}
</script>
<style lang="scss" scoped>
.migrate-liquidity{
  .content{
    padding-top: 15px;
  }
}
</style>
