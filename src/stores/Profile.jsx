// Libraries
import { computed, observable, action } from "mobx";
import { tokens } from "../utils/tokens"

// Utils
import * as blockchain from "../utils/blockchain";
import { toBigNumber } from "../utils/helpers";

export default class ProfileStore {
  @observable proxy = -1;
  @observable isCreatingProxy = false;
  @observable hasFundsToCreateProxy = true;
  @observable allowances = {};

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  getAndSetProxy = (callbacks = null) => {
    return new Promise((resolve, reject) => {
      blockchain.getProxy(this.rootStore.network.defaultAccount).then(proxy => {
        if (proxy) {
          this.setProxy(proxy);
          this.loadAllowances();
          callbacks && this.rootStore.transactions.executeCallbacks(callbacks);
        }
        resolve(proxy);
      }, () => reject(false));
    });
  };

  @computed
  get allowedTokensCount() {
    return tokens.filter(token => this.allowances[token] > 0).length;
  }

  @computed
  get hasFunds() {
    if(this.rootStore.network.defaultAccount && !this.proxy){
      const account = this.rootStore.network.defaultAccount;

      const txData = {
        to: blockchain.objects.proxyRegistry.address,
        data: blockchain.objects.proxyRegistry.build.getData(),
        value: 0,
        from: account
      };
      console.log(txData);
      ( async () => {
        const gas = await blockchain.estimateGas(txData.to, txData.data, txData.value, txData.from).catch((e) => console.log());
        const price = await this.rootStore.transactions.getGasPrice();
        const balance = await blockchain.getEthBalanceOf(account);
        this.hasFundsToCreateProxy = balance.gt(toBigNumber(gas * price));
      })();
    }
    return this.hasFundsToCreateProxy;
  }

  @action createProxy = () => {
    this.isCreatingProxy = true;
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
                      this.isCreatingProxy = false;
                      clearInterval(pending_proxy_setup);
                      resolve();
                    }
                  }, () => clearInterval(pending_proxy_setup));
                }, 500);

                clearInterval(pending_proxy_creation);
              } else {
                reject();
                this.isCreatingProxy = false;
                clearInterval(pending_proxy_creation);
              }
            }
          }, 1000);
        } else {
          this.isCreatingProxy = false;
          reject();
        }
      })
    });
  };

  toggleAllowance = (token) => {
    const amount  = this.allowances[token] === 0 ? -1 : 0;
    return blockchain.setTokenAllowance(token, this.proxy, amount).then(() => {
      this.allowances[token] = this.allowances[token] === 0 ? 1 : 0;
    });
  };

  @action loadAllowances = () => {
    tokens.forEach(async token => {
      this.allowances[token] = (await blockchain.getTokenAllowance(token, this.rootStore.network.defaultAccount, this.proxy)).toNumber();
    });
  };

  @action setProxy = proxy => {
    this.proxy = proxy;
    blockchain.loadObject("dsproxy", this.proxy, "proxy");
    console.log("proxy", this.proxy);
  }
}
