<template>
  <div class="page-wrap">
    <NavTab
      :value="activeTab"
      :tab-list="tabList"
      @changeTab="handleChangeTab"
    />
    <div class="page-content">
      <slot name="content" />
    </div>
  </div>
</template>
<script>
import { Component, Vue, Prop } from 'vue-property-decorator'
import NavTab from 'components/nav-tab'

@Component({
  components:{
    NavTab
  }
})
export default class HcoFunction extends Vue{
  @Prop({default:'pool'})
  activeTab

  tabList = [{label:'Convert', value:'convert'},{label:'Swap', value:'swap'}, {label:'Pool', value:'pool'}, {label:'Lend', value:'lend'}]

  handleChangeTab (tab){
    if(tab !== this.activeTab){
      this.$router.push(tab)
    }
  }
}
</script>
