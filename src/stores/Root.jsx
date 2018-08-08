// Stores
import NetworkStore from "./Network";
import ProfileStore from "./Profile";
import SystemStore from "./System";
import TransactionsStore from "./Transactions";

// Utils
import * as blockchain from "../utils/blockchain";

// Settings
import * as settings from "../settings";

class RootStore {
  constructor() {
    this.network = new NetworkStore(this);
    this.profile = new ProfileStore(this);
    this.system = new SystemStore(this);
    this.transactions = new TransactionsStore(this);
  }

  setPendingTxInterval = () => {
    this.pendingTxInterval = setInterval(() => {
      this.transactions.checkPendingTransactions();
    }, 10000);
  }

  loadContracts = () => {
    if (this.network.network && !this.network.stopIntervals) {
      blockchain.resetFilters(true);
      if (typeof this.pendingTxInterval !== "undefined") clearInterval(this.pendingTxInterval);
      const addrs = settings.chain[this.network.network];
      blockchain.loadObject("proxyregistry", addrs.proxyRegistry, "proxyRegistry");
      const setUpPromises = [blockchain.getProxy(this.network.defaultAccount)];
      Promise.all(setUpPromises).then(r => {
        this.network.stopLoadingAddress();
        this.profile.setProxy(r[0]);

        this.system.init();
        this.setPendingTxInterval();
      });
    }
  }
}

const store = new RootStore();
export default store;
