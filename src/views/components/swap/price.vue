<template>
  <p class="flex-row-between-center m_b10">
    <span>Price</span>
    <span class="flex-row-end-center">
      <span v-if="priceStatus">{{price1}} {{symbol1}} per {{symbol2}}</span>
      <span v-else>{{price2}} {{symbol2}} per {{symbol1}}</span>
      <icon name="exchange" className="exchange-btn m_l5" @click="priceStatus = !priceStatus" />
    </span>
  </p>
</template>
<script>
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class Price extends Vue{
  priceStatus = true

  @Prop({default:''})
  price1

  @Prop({default:''})
  price2

  @Prop({default:''})
  symbol1

  @Prop({default:''})
  symbol2
}
</script>
<style lang="scss" scoped>
.exchange-btn{
  padding: 4px;
  border-radius: 50%;
  background: $lightBorderColor;
  cursor: pointer;
  &:hover{
    background: $borderColor;
  }
}
</style>
