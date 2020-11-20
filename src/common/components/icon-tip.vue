<template>
  <span class="icon-tip-wrap">
    <el-tooltip
      effect="light"
      :popper-class="popperClass"
      :placement="placement"
    >
      <div slot="content">
        <slot name="message"></slot>
      </div>
      <icon name="wenhao" :class="'sk--hover-text c_pointer '+sizeClass+' '+className" />
    </el-tooltip>
  </span>
</template>
<script>
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class IconTip extends Vue{
  @Prop({default:''})
  message

  @Prop({default:'right'})
  placement

  @Prop({default:'icon-tip-msg'})
  popperClass

  @Prop({default:'medium'})
  size

  @Prop({default:''})
  className


  get sizeClass(){
    const sizeMap = {
      medium:'f_s20',
      small:'f_s16',
      mini:'f_s14'
    }
    return sizeMap[this.size]
  }
}
</script>
<style lang="scss">
.icon-tip-wrap{
  .icon{
    color:$lightTextColor
  }
}
div.el-tooltip__popper.is-light{
  border: none;
  box-shadow:0px 1px 4px 0px rgba(0,0,0,0.15);
  line-height: 18px;
  max-width: 450px;
  font-size: 14px;
  color: $lightTextColor;
  &[x-placement^=right] .popper__arrow{
    border-right-color:rgba(0,0,0,0.15);
  }
  &[x-placement^=top] .popper__arrow{
    border-top-color:rgba(0,0,0,0.15);
  }
  &[x-placement^=bottom] .popper__arrow{
    border-bottom-color:rgba(0,0,0,0.15);
  }
  &[x-placement^=left] .popper__arrow{
    border-left-color:rgba(0,0,0,0.15);
  }
}
</style>

