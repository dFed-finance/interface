<template>
  <p class="flex-row-between-center desc-content" :class="className">
    <span>
      {{title}}
      <icon-tip v-if="hasTip" placement="top">
        <p slot="message">{{tipMessage}}</p>
      </icon-tip>
    </span>
    <i v-if="hasArrow" class="el-icon-right" />
    <span>{{value}}</span>
  </p>
</template>
<script>
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class DescComponent extends Vue{
  @Prop({default:''})
  title

  @Prop({default:''})
  value

  @Prop({default:false})
  hasTip

  @Prop({default:''})
  tipMessage

  @Prop({default:''})
  className

  @Prop({default:false})
  hasArrow
}
</script>

<style lang="scss" scoped>
.desc-content{
  position: relative;
  padding-top: 5px;
  padding-bottom: 5px;
  .el-icon-right{
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
  }
}
</style>
