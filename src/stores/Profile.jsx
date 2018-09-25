// Libraries
import { computed, observable, action } from "mobx";

// Utils
import * as blockchain from "../utils/blockchain";

export default class ProfileStore {
  @observable proxy = -1;

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

  @computed
  get hasProxy() {
    return this.proxy || false;
  }

  @action createProxy = () => {
    return new Promise((resolve, reject) => {
      blockchain.objects.proxyRegistry.build({}, (e, tx) => {
        if (!e) {
          const pending_proxy_creation = setInterval(async () => {
            const receipt = await blockchain.getTransactionReceipt(tx).catch(() => reject());
            if (receipt) {
              if (receipt.status === "0x1") {
                const pending_proxy_setup = setInterval(() => {
                  this.getAndSetProxy().then((proxy) => {
                    if (proxy) {
                      clearInterval(pending_proxy_setup);
                      resolve();
                    }
                  }, () => clearInterval(pending_proxy_setup));
                }, 500);

                clearInterval(pending_proxy_creation);
              } else {
                reject();
                clearInterval(pending_proxy_creation);
              }
            }
          }, 1000);
        } else {
          reject();
        }
      })
    });
  }

  setProxy = proxy => {
    this.proxy = proxy;
    blockchain.loadObject("dsproxy", this.proxy, "proxy");
    console.log("proxy", this.proxy);
  }
}
