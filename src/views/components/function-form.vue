<template>
  <div class="function-form">
    <div class="title m_b10">
      <span>{{formData.title}}</span>
      <span>Balance:{{formData.balance || ' -'}}</span>
    </div>
    <div class="form-content">
      <div class="form-input-wrap">
        <FeInput
          v-model="inputValue"
          type="number"
          class-name="flex-1"
          min=""
          :max="Number(formData.balance)"
          :placeholder="inputPlaceholder"
          @inputFocus="inputFocus"
        />
        <span class="btn-max" @click="handleClickMax">MAX</span>
      </div>
      <SelectToken
        :token-list-source="allTokenList"
        :token="formData.address"
        :name="formData.symbol"
        :disabled="selectDisabled"
        :disabled-address="disabledAddress"
        @change="changeToken"
      />
    </div>
  </div>
</template>
<script>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { namespace } from "vuex-class"
import FeInput from 'components/input.vue'
import SelectToken from 'components/select-token.vue'

const moduleBase = namespace("moduleBase")

@Component({
  components: {
    FeInput,
    SelectToken
  }
})
export default class FunctionForm extends Vue{
  @moduleBase.State('allTokenList') allTokenList

  @Prop({default:{}})
  formData

  @Prop({default:false})
  selectDisabled

  @Prop({default:''})
  disabledAddress

  @Prop({default:'0.0'})
  inputPlaceholder

  inputValue = ''

  @Watch('formData.value')
  formDataValueChange(nval, oval){
    if(nval !== oval){
      this.inputValue = nval
    }
  }

  @Watch('inputValue')
  changeValue(nval){
    this.$emit('update:formData',Object.assign(this.formData,{value:nval}))
    this.$emit('inputChange',nval)
  }

  mounted(){
    this.inputValue = this.formData.value
  }

  inputFocus(){
    this.$emit('inputFocus')
  }

  handleClickMax(){
    if(this.formData.balance){
      this.$emit('inputFocus')
      this.inputValue = this.formData.balance;
    }
  }

  changeToken(token){
    this.$emit('update:formData',Object.assign(this.formData,token))
    this.$emit('changeToken',token)
  }
}
</script>
<style lang="scss" scoped>
.function-form{
  box-sizing: border-box;
  padding: 20px 10px;
  border: solid 1px $lightBorderColor;
  border-radius: 8px;
  width:100%;
  &:hover{
    box-shadow: 0 0 6px $lightBorderColor;
  }
  .title{
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .form-content{
    display: flex;
    /deep/.el-input__inner{
      font-size: 20px;
      color: $textColor;
    }
  }
  .form-input-wrap{
    position: relative;
    flex: 1;
    .btn-max{
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: $linkHover;
      color: $link;
      border: solid 1px $linkHover;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 14px;
      cursor: pointer;
      &:hover{
        border-color: $link;;
      }
    }
  }
}
</style>
