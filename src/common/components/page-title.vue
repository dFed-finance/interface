<template>
  <div class="page-title">
    <i v-if="hasBack" class="el-icon-back sk--hover-text c_pointer" @click="handleBack" />
    <span class="tit">{{pageTitle}}</span>
    <icon-tip v-if="pageTip">
      <div slot="message">{{pageTip}}<br /></div>
    </icon-tip>
  </div>
</template>
<script>
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class PageTitle extends Vue{
  @Prop({default:''})
  pageTitle

  @Prop({default:''})
  pageTip

  @Prop({default:false})
  hasBack

  handleBack(){
    this.$router.back()
  }
}
</script>
<style lang="scss">
.page-title{
  display: flex;
  height: 30px;
  align-items: flex-start;
  .el-icon-back{
    font-size: 20px;
  }
  .tit{
    text-align: center;
    flex:1;
    font-size: 20px;
  }
}
</style>
