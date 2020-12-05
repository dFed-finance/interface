<template>
  <div class="lend-list">
    <p v-if="title" class="title">{{title}}</p>
    <el-collapse v-else-if="data.length" accordion>
      <el-collapse-item v-for="(item,index) in data" :key="'lend-item-'+index">
        <template slot="title">
          {{item.name0}}/{{item.name1}}
        </template>
        <DescComponent :title="item.name0" :value="item.value0" />
        <DescComponent :title="item.name1" :value="item.value1" />
        <div class="flex-row-center m_t10">
          <el-button
            :loading="item.btnStatus == 1"
            :disabled="item.btnStatus >= 2"
            round
            type="primary"
            size="medium"
            class="m_r20"
            plain
            @click="handleApproveBtn(item,index)"
          >
            Approve
          </el-button>
          <el-button
            round
            type="primary"
            size="medium"
            plain
            :loading="item.btnStatus == 3"
            :disabled="item.btnStatus < 2 || item.btnStatus == 4"
            @click="handleClickBtn(item,index)"
          >
            Repay
          </el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script>
import { Component, Vue, Prop } from 'vue-property-decorator'
import Loading from 'components/loading.vue'
import DescComponent from 'components/desc-component.vue'

@Component({
  components:{
    Loading,
    DescComponent
  }
})
export default class LiquidityList extends Vue{
  @Prop({default:''})
  title

  @Prop({default:()=>[]})
  data

  handleClickBtn(data,index){
    this.$emit('callback',data,index)
  }

  handleApproveBtn(data,index){
    this.$emit('approveCallback',data,index)
  }
}
</script>
<style lang="scss" scoped>
.lend-list{
  max-height: 400px;
  overflow-y: auto;
}
</style>
