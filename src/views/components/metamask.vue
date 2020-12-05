<template>
  <div />
</template>

<script>
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
const moduleWallet = namespace("moduleWallet");

@Component({})
export default class MetaMask extends Vue {
  @moduleWallet.Mutation("metaMask") metaMask;
  @moduleWallet.Mutation("error") error;
  @moduleWallet.Mutation("account") account;
  @moduleWallet.Mutation("connected") connected;
  @moduleWallet.Mutation("chainId") chainId;
  @moduleWallet.State("chainId") networkId;

  created() {
    const eth = window.ethereum;
    // check if install the wallet
    if (eth && eth.isMetaMask) {
      this.metaMask(true);
    } else {
      this.error("Please install MetaMask");
      this.metaMask(false);
      return;
    }
    eth.autoRefreshOnNetworkChange = false;

    eth.request({ method: "eth_accounts" }).then(accounts => {
      if (accounts.length > 0) {
        this.connected(true);
        this.account(accounts[0]);
      }else{
        this.account(null);
      }
      this.chainId(eth.chainId);
    });

    // add listeners
    eth.on("accountsChanged", accounts => {
      if (accounts !== undefined && accounts.length > 0) {
        this.account(accounts[0]);
        this.connected(true);
      } else {
        this.account(undefined);
        this.connected(false);
        this.error("Disconnect from wallet");
      }
    });
    eth.on("chainChanged", chainId => {
      if (this.networkId !== '') {
        window.location.reload();
      }
      this.chainId(chainId);
    });
    eth.on("message", message => {
      this.error(message);
    });
  }
}
</script>
