<template>
  <div class="select-token" :class="{disabled:disabled}">
    <div class="referance-btn c_pointer" @click="disabled ? '' : dialogVisible = true">
      <el-tooltip
        effect="light"
        placement="top"
        :content="name"
        :disabled="name.length <= 5"
      >
        <span class="f_s20" :class="token?'':'color-999'">{{(name.length > 5 ? name.substr(0,5)+'...' : name) || placeholder}}</span>
      </el-tooltip>
      <i class="el-icon-arrow-down m_l5" />
    </div>
    <el-dialog
      title="Select A Token"
      :visible.sync="dialogVisible"
      custom-class="fe-dialog"
      @close="handleClose"
    >
      <div class="token-list-wrap">
        <div class="m_b20">
          <el-input
            v-model="keyword"
            :clearable="true"
            placeholder="Search name or paste address"
          />
        </div>
        <ul class="token-list">
          <li
            v-for="token in tokenList"
            :key="token.address"
            :class="{disabled:token.address===disabledAddress}"
            @click="handleClickToken(token)"
          >
            <p class="name f_s16">{{token.symbol}}</p>
            <p class="desc ellipsis" >{{token.address}}</p>
          </li>
        </ul>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { namespace } from "vuex-class";
import { getTokenDetails, getAllToken } from '../../hooks/token'
import { getNetworkId } from '../../hooks/wallet'
import { storeToken } from '../../utils/storage'
import { STORE_TRACKED_TOKENS } from '../../constants/index'

const moduleBase = namespace("moduleBase");

@Component({
  components: {}
})
export default class SelectToken extends Vue{
  @moduleBase.Mutation("setAllTokenList") setAllTokenList;

  @Prop({default:false})
  disabled

  @Prop({default:''})
  disabledAddress

  @Prop({default:()=>[]})
  tokenListSource

  @Prop({default:''})
  token

  @Prop({default:''})
  name

  @Prop({default:'Select'})
  placeholder

  dialogVisible = false
  keyword = ''
  tokenList = []

  async created(){
    const contractTokens = await getAllToken(Number(this.chainId))
    this.setAllTokenList({
      ...contractTokens
    });
    this.tokenList = JSON.parse(JSON.stringify(this.tokenListSource))
  }

  @Watch('tokenListSource',{deep:true})
  changeTokenListSource(val){
    this.tokenList = JSON.parse(JSON.stringify(val))
  }

  @Watch('keyword')
  changeKeword(val){
    const networkId = getNetworkId()
    if(/^(0x)[0-9a-fA-F]{40}$/.test(val)){
      getTokenDetails(networkId, val).then(result => {
        storeToken(STORE_TRACKED_TOKENS, result, networkId)
        this.tokenList = [{
          address: result.address,
          symbol: result.symbol,
          decimals: result.decimals,
          name: result.name,
          chainId: result.chainId
        }]
      }).catch(err => {
        console.error(err)
      })
    }else{
      if(val === ''){
        this.tokenList = JSON.parse(JSON.stringify(this.tokenListSource))
      }else{
        this.tokenList = this.tokenListSource.filter(item=>item.symbol.indexOf(val) !== -1)
      }
    }
  }

  handleClickToken(token){
    if(token.address === this.disabledAddress){
      return
    }
    this.$emit('change',token);
    this.dialogVisible = false;
  }

  handleClose(){
    this.keyword = '';
  }

  handleBack(){
    this.$router.back()
  }
}
</script>
<style lang="scss">
.select-token{
  &.disabled{
    .referance-btn,.referance-btn:hover{
      border:solid 1px $borderColor;
      background: $lightBgColor;
      color:$lightTextColor;
      cursor: not-allowed;
    }
    .el-icon-arrow-down{
      color: $lightTextColor;
    }
  }
  .referance-btn{
    box-sizing: border-box;
    display: flex;
    align-items: center;
    margin-left: 12px;
    padding-right:8px;
    padding-left:8px;
    border:solid 1px $borderColor;
    width:112px;
    height: 100%;
    border-radius: 8px;
    span{
      flex: 1;
      text-align: right;
    }
  }
  .referance-btn:hover{
    border:solid 1px $link;
    color: $link;
  }
  .token-list-wrap{
    padding-bottom: 30px;
    min-height: 300px;
    ul{
      overflow-y: auto;
      margin: 0 -20px;
      height: 280px;
      li{
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        padding: 8px 20px;
        height: 50px;
        cursor: pointer;
        &.disabled{
          color:$baseTextColor;
          cursor:not-allowed;
          &:hover{
            background: none;
            .name{
              color:$baseTextColor;
            }
          }
          .desc{
            color:$lightTextColor;
          }
        }
        &:hover{
          background: $linkHover;
          .name{
            color: $link;
          }
        }
        &:last-child{
          border-bottom:none;
        }
      }
      .desc{
        font-size: 14px;
        color:$lightTextColor;
      }
    }
  }
}
@media screen and (max-width: 500px) {
  .select-token{
    .token-list-wrap ul li .desc{
      font-size: 12px;
    }
  }
}
</style>

