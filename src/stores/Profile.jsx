// Libraries
import {observable, decorate} from "mobx";

// Utils
import * as blockchain from "../utils/blockchain";

export default class ProfileStore {
  proxy = -1;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  getAndSetProxy = (callbacks = null) => {
    return new Promise((resolve, reject) => {
      blockchain.getProxy(this.rootStore.network.defaultAccount).then(proxy => {
        if (proxy) {
          this.setProxy(proxy);
          callbacks && this.rootStore.transactions.executeCallbacks(callbacks);
        }
        resolve(proxy);
      }, () => reject(false));
    });
  }

  setProxy = proxy => {
    this.proxy = proxy;
    blockchain.loadObject("dsproxy", this.proxy, "proxy");
    console.log("proxy", this.proxy);
  }
}

decorate(ProfileStore, {
  proxy: observable
});
