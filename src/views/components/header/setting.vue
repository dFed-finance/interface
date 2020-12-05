<template>
  <div class='set-wrap m_b5'>
    <el-popover
      placement="bottom"
      title="Transaction Settings"
      width="200"
      trigger="click"
    >
      <i slot="reference" class="el-icon-setting m_l10 f_s20 c_pointer sk--hover-text" />
      <div class="popover-content">
        <div class="tolerance m_b5">
          <p class="m_b5 flex-row">
            Slippage tolerance
            <icon-tip size="small" class="m_l5">
              <div slot="message">Your transaction will revert <br />if the price changes unfavorably <br />by more than this percentage.<br /></div>
            </icon-tip>
          </p>
          <div class="flex-row">
            <FeInput
              size="mini"
              type="number"
              :is-require="true"
              :min="0.1"
              :max="100"
              :default-value="0.5"
              v-model="tolerance"
            />
            <span class="w_80 m_l5">%</span>
          </div>
        </div>
        <div class="transaction">
          <p class="m_b5 flex-row">
            Transaction deadline
            <icon-tip  size="small" class="m_l5">
              <div slot="message">Your transaction will revert <br />if it is pending for more than this long.<br /></div>
            </icon-tip>
          </p>
          <div class="flex-row">
            <FeInput
              size="mini"
              type="number"
              :is-require="true"
              :min="1"
              :max="10080"
              :default-value="20"
              v-model="deadline"
            />
            <span class="w_80 m_l5">minutes</span>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
import { Component, Vue, Watch } from 'vue-property-decorator'
import { namespace } from "vuex-class"
import FeInput from 'components/input.vue'
import { getTolerance, getDeadline, setTolerance, setDeadline} from "../../../utils/storage"

const moduleBase = namespace("moduleBase")

@Component({
  components:{
    FeInput
  }
})
export default class Setting extends Vue{
  @moduleBase.Mutation('setSettingData') setSettingData

  tolerance = 0
  deadline = 0

  @Watch('tolerance')
  toleranceChange(nval,oval){
    setTolerance(this.tolerance)
    this.setSettingData({fieldName:'tolerance',value:nval})
  }

  @Watch('deadline')
  deadlineChange(nval,oval){
    setDeadline(this.deadline)
    this.setSettingData({fieldName:'deadline',value:nval})
  }

  created() {
    this.tolerance = getTolerance()
    this.deadline = getDeadline()
  }
}
</script>
<style lang="scss" scoped>
</style>
