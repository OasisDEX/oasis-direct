import { observable, decorate } from "mobx";
import * as Blockchain from "../blockchainHandler";

const settings = require('../settings');

class NetworkStore {
  stopIntervals = false;
  loadingAddress = false;
  loadingFirstAddress = false;
  accounts = [];
  defaultAccount = null;
  isConnected = false;
  latestBlock = null;
  network = "";
  outOfSync = true;
  isHw = false;
  hw = {active: false, showSelector: false, option: null, derivationPath: null, addresses: [], addressIndex: null, loading: false, error: null};
  downloadClient = false;

  checkNetwork = () => {
    let isConnected = null;
    Blockchain.getNode().then(r => {
      isConnected = true;
      Blockchain.getBlock('latest').then(res => {
        if (typeof(res) === 'undefined') {
          console.debug('YIKES! getBlock returned undefined!');
        }
        if (res.number >= this.latestBlock) {
          this.latestBlock = res.number;
          this.outOfSync = ((new Date().getTime() / 1000) - res.timestamp) > 600;
        } else {
          // XXX MetaMask frequently returns old blocks
          // https://github.com/MetaMask/metamask-plugin/issues/504
          console.debug('Skipping old block');
        }
      });
      // because you have another then after this.
      // The best way to handle is to return isConnect;
      return null;
    }, () => {
      isConnected = false;
    }).then(() => {
      if (this.isConnected !== isConnected) {
        if (isConnected === true) {
          let network = false;
          Blockchain.getBlock(0).then(res => {
            switch (res.hash) {
              case '0xa3c565fc15c7478862d50ccd6561e3c06b24cc509bf388941c25ea985ce32cb9':
                network = 'kovan';
                break;
              case '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3':
                network = 'main';
                break;
              default:
                console.log('setting network to private');
                console.log('res.hash:', res.hash);
                network = 'private';
            }
            if (!this.stopIntervals // To avoid race condition
                && this.network !== network) {
              this.network = network;
              this.isConnected = true;
              this.latestBlock = 0;
              this.initNetwork(network);
            }
          }, () => {
            if (this.network !== network) {
              this.network = network;
              this.isConnected = true;
              this.latestBlock = 0;
              this.initNetwork(network);
            }
          });
        } else {
          this.isConnected = isConnected;
          this.network = false;
          this.latestBlock = 0;
        }
      }
    }, e => console.log(e));
  }

  initNetwork = newNetwork => {
    this.network = newNetwork;
    this.isConnected = true;
    this.latestBlock = 0;
    this.checkAccounts();
  }

  checkAccounts = () => {
    Blockchain.getAccounts().then(async accounts => {
      if (this.network && !this.hw.active && accounts && accounts[0] !== Blockchain.getDefaultAccount()) {
        const account = await Blockchain.getDefaultAccountByIndex(0);
        if (!this.stopIntervals) { // To avoid race condition
          Blockchain.setDefaultAccount(account);
        }
      }
      if (!this.stopIntervals) { // To avoid race condition
        const oldDefaultAccount = this.defaultAccount;
        this.defaultAccount = Blockchain.getDefaultAccount();
        if (this.defaultAccount && oldDefaultAccount !== this.defaultAccount) {
          this.loadContracts();
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
      await Blockchain.setWebClientProvider();
      this.checkNetwork();
      this.checkAccountsInterval = setInterval(this.checkAccounts, 1000);
      this.checkNetworkInterval = setInterval(this.checkNetwork, 3000);
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
    this.hw.loading = false;
    this.hw.showSelector = false;
    this.hw.option = '';
    this.hw.derivationPath = false;
  }

  importAddress = async () => {
    try {
      this.hw.active = true;
      this.loadingAddress = true;
      this.stopIntervals = false;
      const account = await Blockchain.getDefaultAccountByIndex(this.hw.addressIndex);
      Blockchain.setDefaultAccount(account);
      this.checkNetwork();
      this.checkAccountsInterval = setInterval(this.checkAccounts, 1000);
      this.checkNetworkInterval = setInterval(this.checkNetwork, 3000);
    } catch (e) {
      this.loadingAddress = false;
      this.hw.addresses = [];
    }
  }
  //

  setPendingTxInterval = () => {
    this.pendingTxInterval = setInterval(() => {
      this.transactions.checkPendingTransactions();
    }, 10000);
  }

  loadContracts = () => {
    if (this.network && !this.stopIntervals) {
      Blockchain.resetFilters(true);
      if (typeof this.pendingTxInterval !== 'undefined') clearInterval(this.pendingTxInterval);
      const addrs = settings.chain[this.network];
      Blockchain.loadObject('proxyregistry', addrs.proxyRegistry, 'proxyRegistry');
      const setUpPromises = [Blockchain.getProxy(this.defaultAccount)];
      Promise.all(setUpPromises).then(r => {
        this.loadingAddress = false;
        this.loadingFirstAddress = false;
        this.hw.showSelector = false;
        this.profile.setProxy(r[0]);

        this.system.init();
        this.setPendingTxInterval();
      });
    }
  }

  showClientChoice = () => {
    Blockchain.stopProvider();
    clearInterval(this.checkAccountsInterval);
    clearInterval(this.checkNetworkInterval);

    this.stopIntervals = false;
    this.loadingAddress = false;
    this.loadingFirstAddress = false;
    this.accounts = [];
    this.defaultAccount = null;
    this.isConnected = false;
    this.latestBlock = null;
    this.network = "";
    this.outOfSync = true;
    this.isHw = false;
    this.hw = {show: false, active: false, showSelector: false, option: null, derivationPath: null, addresses: [], addressIndex: null, loading: false, error: null};
    this.downloadClient = false;
  }

  loadHWAddresses = async (network, amount, derivationPath = this.hw.derivationPath) => {
    try {
      await Blockchain.setHWProvider(this.hw.option, network, `${derivationPath.replace('m/', '')}/0`, 0, amount);
      const accounts = await Blockchain.getAccounts();
      this.hw.addresses = accounts;
      this.hw.derivationPath = derivationPath;
      this.hw.isConnected = true;
      return accounts;
    } catch (e) {
      Blockchain.stopProvider();
      console.log(`Error connecting ${this.hw.option}`, e.message);
      return [];
    }
  }

  selectHWAddress = address => {
    this.hw.addressIndex = this.hw.addresses.indexOf(address);
  }
}

decorate(NetworkStore, {
  stopIntervals: observable,
  loadingAddress: observable,
  loadingFirstAddress: observable,
  accounts: observable,
  defaultAccount: observable,
  isConnected: observable,
  latestBlock: observable,
  network: observable,
  outOfSync: observable,
  hw: observable,
  isHw: observable,
  downloadClient: observable
});

const store = new NetworkStore();
export default store;
