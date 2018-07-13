import { observable, decorate } from "mobx";
import * as Blockchain from "../blockchainHandler";

class ProfileStore {
  proxy = -1;

  getAndSetProxy = (callbacks = null) => {
    return new Promise((resolve, reject) => {
      Blockchain.getProxy(this.transactions.network.defaultAccount).then(proxy => {
        if (proxy) {
          this.setProxy(proxy);
          callbacks && this.transactions.executeCallbacks(callbacks);
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
