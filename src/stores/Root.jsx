// Stores
import NetworkStore from "./Network";
import ProfileStore from "./Profile";
import SystemStore from "./System";
import TransactionsStore from "./Transactions";

class RootStore {
  constructor() {
    this.network = new NetworkStore(this);
    this.profile = new ProfileStore(this);
    this.system = new SystemStore(this);
    this.transactions = new TransactionsStore(this);
  }
}

const store = new RootStore();
export default store;
