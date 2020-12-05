<template>
  <div class="prices-content-desc">
    <p class="title">Prices and pool share</p>
    <div class="desc-content">
      <div class="desc-item">
        <span>{{showData.value1}}</span>
        <span>{{showData.name2}} per {{showData.name1}}</span>
      </div>
      <div class="desc-item">
        <span>{{showData.value2}}</span>
        <span>{{showData.name1}} per {{showData.name2}}</span>
      </div>
      <div class="desc-item">
        <span>{{showData.value3 || '-'}}%</span>
        <span>Share of Pool</span>
      </div>
    </div>
  </div>
</template>
<script>
import { Component, Vue, Prop} from 'vue-property-decorator'

@Component({})
export default class PricesContent extends Vue{
  @Prop({default:{}})
  showData
}
</script>
<style lang="scss" scoped>
.prices-content-desc{
  margin-top: 20px;
  width: 100%;
  background: $lightBgColor;
  box-sizing: border-box;
  border-radius: 8px;
  border: solid 1px $lightBorderColor;
  .title{
    padding: 10px 15px 10px;
  }
  .desc-content{
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    border-radius: 8px;
    background: $white;
    padding: 10px 8px;
    .desc-item{
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 5px;
      &:nth-last-child(2){
        padding-left: 8px;
        padding-right: 8px;
      }
      span{
        display: inline-block;
        height: 22px;
      }
      span:nth-of-type(1){
        font-size: 16px;
      }
      span:nth-of-type(2){
        color: $baseTextColor;
      }
    }
  }
}
@media screen and (max-width: 500px) {
  .prices-content-desc{
    .desc-content{
      .desc-item{
        font-size: 14px;
      }
    }
  }
}
</style>
