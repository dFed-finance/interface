<template>
  <div class="mint-bar m_t20">
    <DescComponent title="Low risk" value="High risk" />
    <div class="slider-line">
      <div
        class="slider-bar"
        :class="hasOtherToken ? 'c_pointer' : 'c_not-allowed'"
        :style="{left:sliderBarLeft+'px',right:sliderBarRight+'px'}"
        @mousedown="handleMousedown"
      >
      </div>
      <div class="slider-item-wrap">
        <div
          v-for="(w,i) in lineItemWidthList"
          :key="'slider-item'+i"
          class="slider-item"
          :style="{width:w+'px',background:lineData[i].disabled ? '#e0e0e0' : '#409eff'}"
        ></div>
      </div>
    </div>
  </div>
</template>
<script>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import DescComponent from 'components/desc-component.vue'
import { addEvent, removeEvent, debounceFn } from "utils/common-fn.js"

@Component({
  components:{
    DescComponent
  }
})
export default class MintItem extends Vue{
  @Prop({default:()=>[]})
  lineData

  @Prop({default:0})
  usddBalance // r0

  @Prop({default:false})
  hasOtherToken

  @Prop({default:0})
  tokenBalance // r1

  @Prop({default:0})
  tokenValue // dx

  maxLineWidth = 580
  lineWidth = this.maxLineWidth
  sliderBarWidth = 2
  sliderBarValue = 0
  sliderBarLeft = 0
  sliderBarRight = this.lineWidth - this.sliderBarWidth

  // 鼠标事件需要参数
  isDrop = false
  start = 0
  lastSliderBarRight = this.sliderBarRight

  get per(){ // 1usdd = npx
    const max = this.usddBalance;
    return this.lineWidth / max;
  }

  get per1(){ // 1px = nusdd
    const max = this.usddBalance;
    return max / this.lineWidth;
  }

  get lineItemWidthList(){
    const t = this;
    return t.lineData.map(item => {
      const {minVal, maxVal} = item;
      const sub = maxVal - minVal;
      return sub * t.per;
    });
  }

  // p:滑动产生的计算值,滑块右端点代表的usdd数量
  get usddValue(){
    const lpx = this.lineWidth - this.sliderBarRight;
    return lpx * this.per1;
  }

  @Watch('tokenBalance')
  tokenBalanceChange(){
    this.sliderBarCalculate()
  }

  @Watch('tokenValue')
  tokenValueChange(){
    this.sliderBarCalculate()
  }

  created(){
    this.resizeFn = debounceFn(this.onresizeChange,200)
  }

  mounted(){
    this.$nextTick(()=>{
      this.init()
    })
    addEvent(document.body,'mousemove',this.handleMousemove)
    addEvent(document.body,'mouseup',this.handleMouseup)
    window.onresize = this.resizeFn
  }

  destroyed(){
    removeEvent(document.body,'mousemove',this.handleMousemove)
    removeEvent(document.body,'mouseup',this.handleMouseup)
    window.onresize = null
  }

  onresizeChange(){
    const lineWidth = this.lineWidth;
    this.getLineWidth()
    const scaling = this.lineWidth / lineWidth;
    this.sliderBarRight = this.sliderBarRight * scaling;
    this.sliderBarCalculate()
  }

  init(){
    this.getLineWidth()
    this.sliderBarRight = this.lineWidth - this.sliderBarWidth;
    this.sliderBarCalculate()
  }

  getLineWidth(){
    const lineDom = document.getElementsByClassName('slider-line')[0];
    this.lineWidth = lineDom.clientWidth;
  }

  // 滑块长度代表的usdd数量dy,r0 * r1 = (p - dy) * (r0*r1/p + dx)
  sliderBarCalculate(){
    if(!this.usddValue){
      return
    }
    const a = this.usddBalance * this.tokenBalance; // r0 * r1
    const b = a / this.usddValue + Number(this.tokenValue);
    const x = a / b;
    const dy = this.usddValue - x;
    const sliderBarWidthTemp = dy * this.per;
    this.sliderBarValue = dy;
    this.sliderBarWidth = sliderBarWidthTemp <= 2 ? 2 : sliderBarWidthTemp;
    this.sliderBarLeft = this.lineWidth - this.sliderBarRight - this.sliderBarWidth;
    this.$emit('calculateChange',{p:this.usddValue,dy:this.sliderBarValue})
  }

  handleMousedown(e){
    if(!this.hasOtherToken) return;
    const event = e || window.event;
    this.isDrop = true;
    this.start = event.clientX;
  }

  handleMousemove(e){
    if(!this.hasOtherToken) return;
    if(!this.isDrop) return
    const event = e || window.event;
    const clientX = event.clientX;
    const subX = clientX - this.start;
    const sliderBarRightTemp = this.lastSliderBarRight - subX;
    if(sliderBarRightTemp <= 0){
      this.sliderBarRight = 0;
    }else if(sliderBarRightTemp >= this.lineWidth - 2){
      this.sliderBarRight = this.lineWidth - 2;
    }else{
      this.sliderBarRight = sliderBarRightTemp;
    }
    this.sliderBarCalculate()
  }

  handleMouseup(){
    if(!this.hasOtherToken) return;
    this.isDrop = false;
    this.lastSliderBarRight = this.sliderBarRight;
  }
}
</script>
<style lang="scss" scoped>
.mint-bar{
  .slider-line{
    position: relative;
    width: 100%;
  }
  .slider-bar{
    position: absolute;
    height: 14px;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 7px;
    border: solid 1px #fd600c;
    background: rgba(#fd600c,.2);
    &:hover{
      box-shadow: 0 0 5px #fd600c;
    }
  }
  .slider-item-wrap{
    display: flex;
    border-radius: 5px;
    overflow: hidden;
    width: 100%;
    height: 10px;
    background: $lightTextColor;
  }
}
</style>
