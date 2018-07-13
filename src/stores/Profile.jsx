import { observable, decorate } from "mobx";

import NetworkStore from "./Network";
import TransactionsStore from "./Transactions";

import * as Blockchain from "../blockchainHandler";

class ProfileStore {
  proxy = -1;

  getAndSetProxy = (callbacks = null) => {
    return new Promise((resolve, reject) => {
      Blockchain.getProxy(NetworkStore.defaultAccount).then(proxy => {
        if (proxy) {
          this.setProxy(proxy);
          callbacks && TransactionsStore.executeCallbacks(callbacks);
        }
        resolve(proxy);
      }, () => reject(false));
    });
  }

  setProxy = proxy => {
    this.proxy = proxy;
    Blockchain.loadObject("dsproxy", this.proxy, "proxy");
    console.log("proxy", this.proxy);
  }
}

decorate(ProfileStore, {
  proxy: observable
});

const store = new ProfileStore();
export default store;
