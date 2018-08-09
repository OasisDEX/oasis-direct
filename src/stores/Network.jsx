// Libraries
import {observable} from "mobx";

// Utils
import * as blockchain from "../utils/blockchain";

export default class NetworkStore {
  @observable stopIntervals = false;
  @observable loadingAddress = false;
  @observable loadingFirstAddress = false;
  @observable accounts = [];
  @observable defaultAccount = null;
  @observable isConnected = false;
  @observable latestBlock = null;
  @observable network = "";
  @observable outOfSync = true;
  @observable isHw = false;
  @observable hw = {active: false, showSelector: false, option: null, derivationPath: null, addresses: [], loading: false, error: null};
  @observable downloadClient = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  setNetwork = async () => {
    try {
      const result = await blockchain.checkNetwork(this.isConnected, this.network);
      Object.keys(result.data).forEach(key => { this[key] = result.data[key]; });
      if (!this.stopIntervals && result.status) {
        this.setAccount();
        if (!this.hw.active) {
          this.setAccountInterval = setInterval(this.setAccount, 1000);
        }
      }
    } catch(e) {
      console.log(e);
    }
  }

  stopNetwork = () => {
    this.stopIntervals = true;
    blockchain.stopProvider();
    clearInterval(this.setAccountInterval);
    clearInterval(this.setNetworkInterval);
    this.network = "";
    this.hw = {active: false, showSelector: false, option: null, derivationPath: null, addresses: [], loading: false, error: null};
    this.accounts = [];
    this.defaultAccount = null;
    this.isConnected = false;
    this.latestBlock = null;
    this.outOfSync = true;
    this.isHw = false;
  }

  setAccount = () => {
    blockchain.getAccounts().then(async accounts => {
      if (this.network && !this.hw.active && accounts && accounts[0] !== blockchain.getDefaultAccount()) {
        const account = await blockchain.getDefaultAccountByIndex(0);
        if (!this.stopIntervals) { // To avoid race condition
          blockchain.setDefaultAccount(account);
        }
      }
      if (!this.stopIntervals) { // To avoid race condition
        const oldDefaultAccount = this.defaultAccount;
        this.defaultAccount = blockchain.getDefaultAccount();
        if (this.defaultAccount && oldDefaultAccount !== this.defaultAccount) {
          this.rootStore.loadContracts();
        }
        if (!this.defaultAccount) {
          this.loadingAddress = false;
        }
      }
    }, () => {});
  }

  // Web3 web client
  setWeb3WebClient = async () => {
    try {
      this.stopIntervals = false;
      this.loadingAddress = true;
      await blockchain.setWebClientProvider();
      this.setNetwork();
      this.setNetworkInterval = setInterval(this.setNetwork, 3000);
    } catch (e) {
      this.loadingAddress = false;
      this.downloadClient = true;
      console.log(e);
    }
  }

  // Hardwallets
  showHW = option => {
    this.hw.option = option;
    this.hw.showSelector = true;
  }

  hideHw = () => {
    this.hw.active = false;
    this.hw.loading = false;
    this.hw.showSelector = false;
    this.hw.option = "";
    this.hw.derivationPath = false;
  }

  loadHWAddresses = async (network, amount, derivationPath = this.hw.derivationPath) => {
    try {
      await blockchain.setHWProvider(this.hw.option, network, `${derivationPath.replace("m/", "")}/0`, 0, amount);
      const accounts = await blockchain.getAccounts();
      this.hw.addresses = accounts;
      this.hw.derivationPath = derivationPath;
      this.hw.isConnected = true;
      return accounts;
    } catch (e) {
      blockchain.stopProvider();
      console.log(`Error connecting ${this.hw.option}`, e.message);
      return [];
    }
  }

  importAddress = account => {
    try {
      this.hw.active = true;
      this.loadingAddress = true;
      this.stopIntervals = false;
      blockchain.setDefaultAccount(account);
      this.setNetwork();
      this.setNetworkInterval = setInterval(this.setNetwork, 10000);
    } catch (e) {
      this.loadingAddress = false;
      this.hw.addresses = [];
    }
  }
  //

  stopLoadingAddress = () => {
    this.loadingAddress = false;
    this.loadingFirstAddress = false;
    this.hw.showSelector = false;
  }
}
