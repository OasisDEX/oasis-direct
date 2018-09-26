// Libraries
import { computed, observable, action, autorun } from "mobx";

// Utils
import * as blockchain from "../utils/blockchain";

export default class ProfileStore {
  @observable proxy = -1;
  //TODO: build this object from supported tokens.
  @observable allowances = {
    "mkr": 0,
    "dai": 0
  };


  constructor(rootStore) {
    this.rootStore = rootStore;
    autorun(() => console.log(this.allowedTokens))
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
  };

  @computed
  get hasProxy() {
    return this.proxy || false;
  }

  @computed
  get allowedTokens() {
    return Object.keys(this.allowances).filter(token => this.allowances[token] > 0).length;
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
  };

  allow = (token) => {
    return blockchain.setTokenAllowance(token, this.proxy);
  };

  loadAllowances = () => {
    Object.keys(this.allowances).forEach(async token => {
      this.allowances[token] = await blockchain.getTokenAllowance(token, this.rootStore.network.defaultAccount, this.proxy);
    });
  };

  setProxy = proxy => {
    this.proxy = proxy;
    blockchain.loadObject("dsproxy", this.proxy, "proxy");
    console.log("proxy", this.proxy);
  }
}
