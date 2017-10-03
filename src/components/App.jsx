import React, { Component } from 'react';
import NoConnection from './NoConnection';
import web3, { initWeb3 } from  '../web3';
import ReactNotify from '../notify';
import { WAD, toBytes32, addressToBytes32, fromRaytoWad, wmul, wdiv, etherscanTx } from '../helpers';
// import logo from '../makerdao.svg';
import './App.css';
import SetAssets from './SetAssets';
import SetDetailsBasic from './SetDetailsBasic';
import TradeBasic from './TradeBasic';

const settings = require('../settings');

const dstoken = require('../abi/dstoken');
const dsethtoken = require('../abi/dsethtoken');
const dsvalue = require('../abi/dsvalue');
const dsproxyfactory = require('../abi/dsproxyfactory');
const dsproxy = require('../abi/dsproxy');

const proxyActions = require('../proxyActions');

class App extends Component {
  constructor() {
    super();
    const initialState = this.getInitialState();
    this.state = {
      ...initialState,
      network: {},
      transactions: {},
      params: ''
    }
  }

  getInitialState = () => {
    return {
      tokens: {
        weth: '',
        mkr: '',
        sai: ''
      },
      otc: '',
      tub: '',
      system: {
        step: 1,
        type: 'basic',
        from: null,
        to: null,
        amountSell: null,
        amountBuy: 0,
      }
    };
  }

  checkNetwork = () => {
    web3.version.getNode((error) => {
      const isConnected = !error;

      // Check if we are synced
      if (isConnected) {
        web3.eth.getBlock('latest', (e, res) => {
          if (typeof(res) === 'undefined') {
            console.debug('YIKES! getBlock returned undefined!');
          }
          if (res.number >= this.state.network.latestBlock) {
            const networkState = { ...this.state.network };
            networkState.latestBlock = res.number;
            networkState.outOfSync = e != null || ((new Date().getTime() / 1000) - res.timestamp) > 600;
            this.setState({ network: networkState });
          } else {
            // XXX MetaMask frequently returns old blocks
            // https://github.com/MetaMask/metamask-plugin/issues/504
            console.debug('Skipping old block');
          }
        });
      }

      // Check which network are we connected to
      // https://github.com/ethereum/meteor-dapp-wallet/blob/90ad8148d042ef7c28610115e97acfa6449442e3/app/client/lib/ethereum/walletInterface.js#L32-L46
      if (this.state.network.isConnected !== isConnected) {
        if (isConnected === true) {
          web3.eth.getBlock(0, (e, res) => {
            let network = false;
            if (!e) {
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
            }
            if (this.state.network.network !== network) {
              this.initNetwork(network);
            }
          });
        } else {
          const networkState = { ...this.state.network };
          networkState.isConnected = isConnected;
          networkState.network = false;
          networkState.latestBlock = 0;
          this.setState({ network: networkState });
        }
      }
    });
  }

  initNetwork = (newNetwork) => {
    const networkState = { ...this.state.network };
    networkState.network = newNetwork;
    networkState.isConnected = true;
    networkState.latestBlock = 0;
    this.setState({ network: networkState }, () => {
      this.checkAccounts();
    });
  }

  checkAccounts = () => {
    web3.eth.getAccounts((error, accounts) => {
      if (!error) {
        const networkState = { ...this.state.network };
        networkState.accounts = accounts;
        const oldDefaultAccount = networkState.defaultAccount;
        networkState.defaultAccount = accounts[0];
        web3.eth.defaultAccount = networkState.defaultAccount;
        this.setState({ network: networkState }, () => {
          if (oldDefaultAccount !== networkState.defaultAccount) {
            this.initContracts();
          }
        });
      }
    });
  }

  componentDidMount = () => {
    setTimeout(this.init, 500);
  }

  init = () => {
    initWeb3(web3);

    this.checkNetwork();

    // this.setHashParams();
    // window.onhashchange = () => {
    //   this.setHashParams();
    //   this.initContracts();
    // }

    this.checkAccountsInterval = setInterval(this.checkAccounts, 10000);
    this.checkNetworkInterval = setInterval(this.checkNetwork, 3000);
  }

  // setHashParams = () => {
  //   const params = window.location.hash.replace(/^#\/?|\/$/g, '').split('/');
  //   this.setState({ params });
  // }

  loadObject = (abi, address) => {
    return web3.eth.contract(abi).at(address);
  }

  initContracts = () => {
    web3.reset(true);
    if (typeof this.pendingTxInterval !== 'undefined') clearInterval(this.pendingTxInterval);
    const initialState = this.getInitialState();
    this.setState({
      ...initialState
    }, () => {
      const addrs = settings.chain[this.state.network.network];
      window.proxyFactoryObj = this.proxyFactoryObj = this.loadObject(dsproxyfactory.abi, addrs.proxyFactory);

      const setUpPromises = [this.getProxyAddress()];
      Promise.all(setUpPromises).then((r) => {
        if (r[0].length > 0) {
          const proxy = r[0][r[0].length - 1].args.proxy;
          window.proxyObj = this.proxyObj = this.loadObject(dsproxy.abi, proxy);
        } else {
          
        }
        this.setUpAddress('otc');
        this.setUpAddress('tub');
        this.setUpToken('weth');
        this.setUpToken('mkr');
        this.setUpToken('sai');
        // This is necessary to finish transactions that failed after signing
        this.setPendingTxInterval();
      });
    });
  }

  setPendingTxInterval = () => {
    this.pendingTxInterval = setInterval(() => {
      this.checkPendingTransactions()
    }, 10000);
  }

  getAccountBalance = () => {
    if (web3.isAddress(this.state.profile.activeProfile)) {
      web3.eth.getBalance(this.state.profile.activeProfile, (e, r) => {
        const profile = { ...this.state.profile };
        profile.accountBalance = r;
        this.setState({ profile });
      });
    }
  }

  getProxyAddress = () => {
    const p = new Promise((resolve, reject) => {
      const addrs = settings.chain[this.state.network.network];
      this.proxyFactoryObj.Created({ sender: this.state.network.defaultAccount }, { fromBlock: addrs.fromBlock }).get((e, r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      });
    });
    return p;
  }

  setUpAddress = (contract) => {
    const addr = settings.chain[this.state.network.network][contract];
    this.setState((prevState, props) => {
      const returnObj = {};
      returnObj[contract] = { address: addr };
      return returnObj;
    });
  }

  setUpToken = (token) => {
    const addrs = settings.chain[this.state.network.network];
    this.setState((prevState, props) => {
      const tokens = {...prevState.tokens};
      const tok = {...tokens[token]};
      tok.address = addrs[token];
      tokens[token] = tok;
      return { tokens };
    }, () => {
      window[`${token}Obj`] = this[`${token}Obj`] = this.loadObject(token === 'weth' ? dsethtoken.abi : dstoken.abi, this.state.tokens[token].address);
      this.getDataFromToken(token);
      this.setFilterToken(token);
    });
  }

  setFilterToken = (token) => {
    const filters = ['Transfer'];

    if (token === 'gem') {
      filters.push('Deposit');
      filters.push('Withdrawal');
    } else {
      filters.push('Mint');
      filters.push('Burn');
      filters.push('Trust');
    }

    for (let i = 0; i < filters.length; i++) {
      const conditions = {};
      if (this[`${token}Obj`][filters[i]]) {
        this[`${token}Obj`][filters[i]](conditions, {}, (e, r) => {
          if (!e) {
            this.logTransactionConfirmed(r.transactionHash);
            this.getDataFromToken(token);
          }
        });
      }
    }
  }

  getDataFromToken = (token) => {
    // this.getTotalSupply(token);
    // this.getBalanceOf(token, this.state.profile.activeProfile, 'myBalance');
  }

  getTotalSupply = (name) => {
    this[`${name}Obj`].totalSupply.call((e, r) => {
      if (!e) {
        this.setState((prevState, props) => {
          const tokens = {...prevState.tokens};
          const tok = {...tokens[name]};
          tok.totalSupply = r;
          tokens[name] = tok;
          return { tokens };
        }, () => {
          if (name === 'sin') {
            this.calculateSafetyAndDeficit();
          }
        });
      }
    })
  }

  getBalanceOf = (name, address, field) => {
    this[`${name}Obj`].balanceOf.call(address, (e, r) => {
      if (!e) {
        this.setState((prevState, props) => {
          const tokens = {...prevState.tokens};
          const tok = {...tokens[name]};
          tok[field] = r;
          tokens[name] = tok;
          return { tokens };
        });
      }
    })
  }

  methodSig = (method) => {
    return web3.sha3(method).substring(0, 10)
  }
  //

  // Transactions
  checkPendingTransactions = () => {
    const transactions = { ...this.state.transactions };
    Object.keys(transactions).map(tx => {
      if (transactions[tx].pending) {
        web3.eth.getTransactionReceipt(tx, (e, r) => {
          if (!e && r !== null) {
            if (r.logs.length === 0) {
              this.logTransactionFailed(tx);
            } else if (r.blockNumber)  {
              this.logTransactionConfirmed(tx);
            }
          }
        });
      }
      return false;
    });
  }

  logPendingTransaction = (tx, title, callback = {}) => {
    const msgTemp = 'Transaction TX was created. Waiting for confirmation...';
    const transactions = { ...this.state.transactions };
    transactions[tx] = { pending: true, title, callback }
    this.setState({ transactions });
    console.log(msgTemp.replace('TX', tx))
    this.refs.notificator.info(tx, title, etherscanTx(this.state.network.network, msgTemp.replace('TX', `${tx.substring(0,10)}...`), tx), false);
  }

  logTransactionConfirmed = (tx) => {
    const msgTemp = 'Transaction TX was confirmed.';
    const transactions = { ...this.state.transactions };
    if (transactions[tx]) {
      transactions[tx].pending = false;
      this.setState({ transactions });

      this.refs.notificator.success(tx, transactions[tx].title, etherscanTx(this.state.network.network, msgTemp.replace('TX', `${tx.substring(0,10)}...`), tx), 4000);
      const c = transactions[tx].callback;
      if (c.method) {
      }
    }
  }

  logTransactionFailed = (tx) => {
    const msgTemp = 'Transaction TX failed.';
    const transactions = { ...this.state.transactions };
    if (transactions[tx]) {
      transactions[tx].pending = false;
      this.setState({ transactions });
      this.refs.notificator.error(tx, transactions[tx].title, msgTemp.replace('TX', `${tx.substring(0,10)}...`), 4000);
    }
  }
  //

  // Actions
  changeType = (type) => {
    this.setState((prevState, props) => {
      const system = { ...prevState.system };
      system.type = type;
      return { system };
    });
  }

  goToDetailsBasicStep = (from, to) => {
    this.setState((prevState, props) => {
      const system = { ...prevState.system };
      system.step = 2;
      system.from = from;
      system.to = to;
      return { system };
    });
  }

  goToDetailsMarginStep = (leverage) => {
    this.setState((prevState, props) => {
      const system = { ...prevState.system };
      system.step = 2;
      system.leverage = leverage;
      return { system };
    });
  }

  calculateBuyAmount = (from, to, amount) => {
    this.proxyObj.execute.call(proxyActions.trade,
                               `${this.methodSig('sellAll(address,address,address,uint256)')}${addressToBytes32(this.state.otc.address, false)}${addressToBytes32(this.state.tokens[to].address, false)}${addressToBytes32(this.state.tokens[from].address, false)}${toBytes32(web3.toWei(amount), false)}`,
                               (e, r) => {
                                 if (!e) {
                                  this.setState((prevState, props) => {
                                    const system = { ...prevState.system };
                                    system.amountBuy = web3.fromWei(web3.toBigNumber(r));
                                    return { system };
                                  });
                                 }
                               });
  }
  //

  renderMain = () => {
    return (
      this.state.system.step === 1
      ? 
        <SetAssets type={ this.state.system.type } changeType={ this.changeType } goToDetailsBasicStep={ this.goToDetailsBasicStep } />
      :
        this.state.system.step === 2
        ?
          this.state.system.type === 'basic'
          ?
            <SetDetailsBasic from={ this.state.system.from } to={ this.state.system.to } calculateBuyAmount={ this.calculateBuyAmount } amountBuy = { this.state.system.amountBuy } />
          :
            ''    
        :
          this.state.system.step === 3
          ?
            this.state.system.type === 'basic'
            ?
              <TradeBasic />
            :
              ''
          :
            ''
    );
  }

  render() {
    return (
      this.state.network.isConnected ? this.renderMain() : <NoConnection />
    );
  }
}

export default App;
