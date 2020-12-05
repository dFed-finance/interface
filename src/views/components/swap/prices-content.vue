<template>
  <div>
    <Price
      :price1="data.price1"
      :symbol1="data.symbol1"
      :price2="data.price2"
      :symbol2="data.symbol2"
    />
    <DescComponent
      title="Minimum received"
      :value="data.minReceived"
      :has-tip="true"
      tip-message="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed."
    />
    <DescComponent
      title="Price Impact"
      :value="data.priceImpact"
      :has-tip="true"
      tip-message="The difference between the market price and your price due to trade size."
    />
    <DescComponent
      title="Liquidity Provider Fee"
      :value="data.providerFee"
      :has-tip="true"
      tip-message="A portion of each trade goes to liquidity providers as a protocol incentive. Usually it is 0.30%, but it is 0% now."
    />
    <DescComponent
      title="Liquidation Caused"
      :value="data.caused"
    />
    <DescComponent
      title="Total liquidation"
      :value="data.total"
    />
  </div>
</template>
<script>
import { Component, Vue, Prop } from 'vue-property-decorator'
import Price from "./price.vue"
import DescComponent from "components/desc-component.vue"

@Component({
  components: {
    Price,
    DescComponent
  }
})
export default class PricesContent extends Vue{
  @Prop({default:{}})
  data
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
