import { observable, decorate } from "mobx";
import * as Blockchain from "../blockchainHandler";

// import { toBigNumber, isAddress } from '../helpers';

const settings = require('../settings');

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
    Blockchain.loadObject('dsproxy', this.proxy, 'proxy');
    console.log('proxy', this.proxy);
  }

  // checkProxy = callbacks => {
  //   if (this.proxy) {
  //     this.transactions.executeCallbacks(callbacks);
  //   } else {
  //     const title = 'Create Proxy';
  //     this.transactions.askPriceAndSend(title, Blockchain.objects.proxyRegistry.build, [], {value: 0}, [['profile/getAndSetProxy', callbacks]]);
  //   }
  // }


  checkProxy = callbacks => {
    if (this.proxy) {
      callbacks.forEach(callback => this.transactions.executeCallback(callback));
    } else {
      this.transactions.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
        this.transactions.logRequestTransaction('proxy').then(() => {
          callbacks = [['setProxyAddress', callbacks]];
          this.system.trade.step = 2;
          this.system.trade.txs = 3;
          Blockchain.objects.proxyRegistry.build({gasPrice}, (e, tx) => {
            if (!e) {
              this.transactions.logPendingTransaction(tx, 'proxy', callbacks);
            } else {
              if (this.transactions.isErrorDevice(e)) {
                this.transactions.logTransactionErrorDevice('proxy');
              } else {
                this.transactions.logTransactionRejected('proxy');
              }
            }
          });
        });
      });
    }
  }
}

decorate(ProfileStore, {
  proxy: observable
});

const store = new ProfileStore();
export default store;

// autorun(() => {
//   console.log('changed', store.address);
// });
