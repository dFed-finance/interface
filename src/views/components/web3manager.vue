<template>
  <div />
</template>

<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
const moduleWallet = namespace("moduleWallet");

@Component({})
export default class Web3Manager extends Vue {
  @moduleWallet.Mutation("metaMask") metaMask;
  @moduleWallet.Mutation("error") error;
  @moduleWallet.Mutation("account") account;
  @moduleWallet.Mutation("connected") connected;
  @moduleWallet.Mutation("chainId") chainId;
  @moduleWallet.State("chainId") networkId;

  created() {
    console.log('Use more wallet in the future')
  }
}
</script>
