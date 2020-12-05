<template>
  <div class='nav-tab'>
    <div
      class="nav-item c_pointer"
      :class="{'sk-text':value==tabItem.value}"
      v-for="tabItem in tabList"
      :key="tabItem.value"
      @click="handleClick(tabItem.value)"
    >
      {{tabItem.label}}
    </div>
  </div>
</template>

<script>
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class NavTab extends Vue{
  @Prop({default:''})
  value

  @Prop({default:()=>[]})
  tabList

  handleClick(tab){
    this.$emit('input',tab);
    this.$emit('changeTab',tab);
  }
}
</script>
<style lang="scss" scoped>
.nav-tab{
  display: flex;
  width: 100%;
  .nav-item{
    flex: 1;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    line-height: 50px;
  }
}
</style>
