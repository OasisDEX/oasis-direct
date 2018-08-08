// Libraries
import {observable, decorate} from "mobx";

// Utils
import * as Blockchain from "../utils/blockchain-handler";

export default class ProfileStore {
  proxy = -1;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  getAndSetProxy = (callbacks = null) => {
    return new Promise((resolve, reject) => {
      Blockchain.getProxy(this.rootStore.network.defaultAccount).then(proxy => {
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
    Blockchain.loadObject("dsproxy", this.proxy, "proxy");
    console.log("proxy", this.proxy);
  }
}

decorate(ProfileStore, {
  proxy: observable
});
