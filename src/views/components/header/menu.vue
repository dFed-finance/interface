<template>
  <div class='menu-wrap'>
    <el-dropdown trigger="click" @command="handleCommand">
      <span class="el-dropdown-link m_l10">
        <i class="el-icon-more f_s24 sk--hover-text c_pointer"></i>
      </span>
      <el-dropdown-menu slot="dropdown" class="menu-list">
        <el-dropdown-item command="https://dfed.finance">
          <icon name="about" />About
        </el-dropdown-item>
        <el-dropdown-item command="https://dfed-finance.github.io/Introduction/whitepaper/dFed.finance.pdf">
          <icon name="book" />Whitepaper
        </el-dropdown-item>
        <el-dropdown-item command="https://github.com/dFed-finance">
          <icon name="code" />Github
        </el-dropdown-item>
        <el-dropdown-item command="https://twitter.com/dFed_finance">
          <icon name="twitter" />Twitter
        </el-dropdown-item>
        <el-dropdown-item command="https://discord.gg/ztgFdQm">
          <icon name="discord" />Discord
        </el-dropdown-item>
        <el-dropdown-item command="https://medium.com/@dFed.finance">
          <icon name="medium" />Medium
        </el-dropdown-item>
        <el-dropdown-item command="mailto:team@dfed.finance">
          <icon name="mail" />Email
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class Menu extends Vue{
  handleCommand(url){
    url && window.open(url,'_blank')
  }
}
</script>
<style lang="scss">
.menu-wrap{

}
.menu-list .el-dropdown-menu__item{
  font-size: 16px;
  .icon{
    margin-right: 5px;
    font-size: 18px;
  }
}
</style>

