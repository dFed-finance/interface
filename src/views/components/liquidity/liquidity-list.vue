<template>
  <div class="liquidity-list">
    <p v-if="title" class="title">{{title || 'Your Liquidity'}}</p>
    <Loading v-if="loading" />
    <el-collapse v-else-if="data.length" accordion>
      <el-collapse-item v-for="(item,index) in data" :key="'liquidity-item-'+index">
        <template slot="title">
          {{item.tokenA.symbol}}/{{item.tokenB.symbol}}
        </template>
        <p class="list-item">
          <span>Pooled {{item.tokenA.symbol}}:</span>
          <span>{{item.Pooled0}}</span>
        </p>
        <p class="list-item">
          <span>Pooled {{item.tokenB.symbol}}:</span>
          <span>{{item.Pooled1}}</span>
        </p>
        <p class="list-item">
          <span v-if="action === `add`">Your {{FEDNAME}}LP:</span>
          <span v-if="action === `migrate`">Your pool tokens:</span>
          <span>{{item.PoolTokens}}</span>
        </p>
        <p class="list-item">
          <span v-if="action === `add`">Your share:</span>
          <span v-if="action === `migrate`">Your pool share:</span>
          <span>{{item.PoolShares}}</span>
        </p>
        <p v-if="action === `add`" class="list-item">
          <span >Your Credit(USDD):</span>
          <span>{{item.Credit}}</span>
        </p>
        <p class="list-item">
          <template v-if="action === `add`">
            <span >Your {{FEDNAME}}:</span>
            <span>{{item.FED}}</span>
          </template>
          <template v-if="action === `migrate`">
            <span>Your pool location:</span>
            <span>{{item.location}}</span>
          </template>
        </p>
        <div class="flex-row-around-center" v-if="action === `add`">
          <el-button round size="medium" type="primary" plain @click="handleClickBtn('harvest-liquidity',{'pairAddres':item.pairAddress},item)" class="m_t10">Harvest</el-button>
          <el-button round size="medium" type="primary" plain @click="handleClickBtn('remove-liquidity',{'pairAddres':item.pairAddress},item)" class="m_l0 m_t10">Remove</el-button>
          <el-button round size="medium" type="primary" plain @click="handleClickBtn('recover-credit',{'pairAddres':item.pairAddress},item)" class="m_l0 m_t10">Recover My Credit</el-button>
        </div>
        <div class="flex-row-center m_t10" v-if="action === `migrate`">
          <el-button round size="medium" :type="item.isApproved ? 'success' :'primary'" plain :disabled="item.isApproved" class="m_r20">Approve</el-button>
          <el-button round size="medium" type="primary" plain :disabled="!item.isApproved">Migrate</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
    <div v-else class="text-center p_t20">No liquidity found.</div>
  </div>
</template>
<script>
import { Component, Vue, Prop } from 'vue-property-decorator'
import Loading from 'components/loading.vue'
import {FEDNAME} from "constants/index"

@Component({
  components:{
    Loading
  }
})
export default class LiquidityList extends Vue{
  @Prop({default:true})
  loading

  @Prop({default:''})
  title

  @Prop({default:()=>[]})
  data

  @Prop({default:()=>[]})
  action

  FEDNAME = FEDNAME

  handleClickBtn(route,query,data){
    this.$emit('callback',{route,query,data})
  }
}
</script>
<style lang="scss" scoped>
.liquidity-list{
  width: 100%;
  min-height: 126px;
  max-height: 400px;
  overflow-y: auto;
  .title{
    padding-bottom: 15px;
    font-size: 16px;
    font-weight: bold;
  }
  .list-item{
    display: flex;
    justify-content: space-between;
  }
}
</style>
