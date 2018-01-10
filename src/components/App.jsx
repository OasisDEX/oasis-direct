import React, { Component } from 'react';
import NoConnection from './NoConnection';
import web3, { initWeb3 } from  '../web3';
import ReactNotify from '../notify';
import { toBytes32, addressToBytes32, etherscanTx, methodSig } from '../helpers';
import SetTrade from './SetTrade';
import DoTrade from './DoTrade';

const settings = require('../settings');

const dstoken = require('../abi/dstoken');
const dsethtoken = require('../abi/dsethtoken');
const dsproxyfactory = require('../abi/dsproxyfactory');
const dsproxy = require('../abi/dsproxy');
const matchingmarket = require('../abi/matchingmarket');
const proxycreateandexecute = require('../abi/proxycreateandexecute');

window.dsproxy = dsproxy;

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
        dai: ''
      },
      otc: '',
      tub: '',
      trade: {
        step: 1,
        operation: '',
        from: localStorage.getItem('from') ? localStorage.getItem('from') : 'eth',
        to: localStorage.getItem('to') ? localStorage.getItem('to') : 'dai',
        amountPay: web3.toBigNumber(0),
        amountBuy: web3.toBigNumber(0),
        amountPayInput: '',
        amountBuyInput: '',
        txCost: web3.toBigNumber(0),
        errorSell: null,
        errorBuy: null,
      }
    };
  }

  checkNetwork = () => {
    web3.version.getNode(error => {
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

  initNetwork = newNetwork => {
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
      Promise.all(setUpPromises).then(r => {
        this.setState((prevState, props) => {
          return { proxy: r[0] };
        }, () => {
          this.setUpAddress('otc');
          this.setUpAddress('tub');
          this.setUpToken('weth');
          this.setUpToken('mkr');
          this.setUpToken('dai');
          // This is necessary to finish transactions that failed after signing
          this.setPendingTxInterval();
        });
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

  getProxyOwner = (proxy) => {
    return new Promise((resolve, reject) => {
      this.loadObject(dsproxy.abi, proxy).owner((e, r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      });
    });
  }

  getProxyAddress = () => {
    const network = this.state.network;
    return new Promise((resolve, reject) => {
      const addrs = settings.chain[network.network];
      this.proxyFactoryObj.Created({ sender: network.defaultAccount }, { fromBlock: addrs.fromBlock }).get(async (e, r) => {
        if (!e) {
          if (r.length > 0) {
            for (let i = r.length - 1; i >= 0; i--) {
              if (await this.getProxyOwner(r[i].args.proxy) === network.defaultAccount) {
                resolve(r[i].args.proxy);
                break;
              }
            }
            resolve(null);
          } else {
            resolve(null);
          }
        } else {
          reject(e);
        }
      });
    });
  }

  setProxyAddress = () => {
    console.log('setProxy');
    Promise.resolve(this.getProxyAddress()).then(proxy => {
      console.log(proxy);
      this.setState((prevState, props) => {
        return { proxy };
      });
    });
  }

  setUpAddress = contract => {
    const addr = settings.chain[this.state.network.network][contract];
    this.setState((prevState, props) => {
      const returnObj = {};
      returnObj[contract] = { address: addr };
      return returnObj;
    });
  }

  setUpToken = token => {
    const addrs = settings.chain[this.state.network.network];
    this.setState((prevState, props) => {
      const tokens = {...prevState.tokens};
      const tok = {...tokens[token]};
      tok.address = addrs.tokens[token];
      tokens[token] = tok;
      return { tokens };
    }, () => {
      window[`${token}Obj`] = this[`${token}Obj`] = this.loadObject(token === 'weth' ? dsethtoken.abi : dstoken.abi, this.state.tokens[token].address);
      this.getDataFromToken(token);
      this.setFilterToken(token);
    });
  }

  setFilterToken = token => {
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

  getDataFromToken = token => {
    // this.getTotalSupply(token);
    // this.getBalanceOf(token, this.state.profile.activeProfile, 'myBalance');
  }

  getTotalSupply = name => {
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

  logRequestTransaction = (id, title) => {
    const msgTemp = 'Waiting for transaction signature...';
    this.refs.notificator.info(id, title, msgTemp, false);
  }

  logPendingTransaction = (id, tx, title, callbacks = []) => {
    const msgTemp = 'Transaction TX was created. Waiting for confirmation...';
    const transactions = { ...this.state.transactions };
    transactions[tx] = { pending: true, title, callbacks }
    this.setState({ transactions });
    console.log(msgTemp.replace('TX', tx));
    this.refs.notificator.hideNotification(id);
    this.refs.notificator.info(tx, title, etherscanTx(this.state.network.network, msgTemp.replace('TX', `${tx.substring(0,10)}...`), tx), false);
  }

  logTransactionConfirmed = tx => {
    const msgTemp = 'Transaction TX was confirmed.';
    const transactions = { ...this.state.transactions };
    if (transactions[tx] && transactions[tx].pending) {
      transactions[tx].pending = false;
      this.setState({ transactions }, () => {
        console.log(msgTemp.replace('TX', tx));
        this.refs.notificator.hideNotification(tx);
        this.refs.notificator.success(tx, transactions[tx].title, etherscanTx(this.state.network.network, msgTemp.replace('TX', `${tx.substring(0,10)}...`), tx), 4000);
        if (typeof transactions[tx].callbacks !== 'undefined' && transactions[tx].callbacks.length > 0) {
          transactions[tx].callbacks.forEach(callback => this.executeCallback(callback));
        }
      });
    }
  }

  logTransactionFailed = tx => {
    const msgTemp = 'Transaction TX failed.';
    const transactions = { ...this.state.transactions };
    if (transactions[tx]) {
      transactions[tx].pending = false;
      this.setState({ transactions });
      this.refs.notificator.error(tx, transactions[tx].title, msgTemp.replace('TX', `${tx.substring(0,10)}...`), 4000);
    }
  }

  logTransactionRejected = (tx, title) => {
    const msgTemp = 'User denied transaction signature.';
    this.refs.notificator.error(tx, title, msgTemp, 4000);
  }

  executeCallback = args => {
    const method = args.shift();
    // If the callback is to execute a getter function is better to wait as sometimes the new value is not updated instantly when the tx is confirmed
    const timeout = ['executeProxyTx', 'executeProxyCreateAndExecute', 'checkAllowance'].indexOf(method) !== -1 ? 0 : 3000;
    // console.log(method, args, timeout);
    setTimeout(() => {
      this[method](...args);
    }, timeout);
  }
  //

  // Actions
  getCallDataAndValue = (operation, from, to, amount, limit) => {
    const result = {};
    const otcBytes32 = addressToBytes32(settings.chain[this.state.network.network].otc, false);
    const fromAddrBytes32 = addressToBytes32(settings.chain[this.state.network.network].tokens[from.replace('eth', 'weth')], false);
    const toAddrBytes32 = addressToBytes32(settings.chain[this.state.network.network].tokens[to.replace('eth', 'weth')], false);
    if (operation === 'sellAll') {
      if (from === "eth") {
        result.calldata = `${methodSig('sellAllAmountPayEth(address,address,address,uint256)')}` +
                          `${otcBytes32}${fromAddrBytes32}${toAddrBytes32}${toBytes32(limit, false)}`;
        result.value = web3.toWei(amount);
      } else if (to === "eth") {
        result.calldata = `${methodSig('sellAllAmountBuyEth(address,address,uint256,address,uint256)')}` +
                          `${otcBytes32}${fromAddrBytes32}${toBytes32(web3.toWei(amount), false)}${toAddrBytes32}${toBytes32(limit, false)}`;
      } else {
        result.calldata = `${methodSig('sellAllAmount(address,address,uint256,address,uint256)')}` +
                          `${otcBytes32}${fromAddrBytes32}${toBytes32(web3.toWei(amount), false)}${toAddrBytes32}${toBytes32(limit, false)}`;
      }
    } else {
      if (from === "eth") {
        result.calldata = `${methodSig('buyAllAmountPayEth(address,address,uint256,address)')}` +
                          `${otcBytes32}${toAddrBytes32}${toBytes32(web3.toWei(amount), false)}${fromAddrBytes32}`;
        result.value = limit;
      } else if (to === "eth") {
        result.calldata = `${methodSig('buyAllAmountBuyEth(address,address,uint256,address,uint256)')}` +
                          `${otcBytes32}${toAddrBytes32}${toBytes32(web3.toWei(amount), false)}${fromAddrBytes32}${toBytes32(limit, false)}`;
      } else {
        result.calldata = `${methodSig('buyAllAmount(address,address,uint256,address,uint256)')}` +
                          `${otcBytes32}${toAddrBytes32}${toBytes32(web3.toWei(amount), false)}${fromAddrBytes32}${toBytes32(limit, false)}`;
      }
    }
    return result;
  }

  goToDoTradeStep = (from, to) => {
    this.setState((prevState, props) => {
      const trade = { ...prevState.trade };
      trade.step = 2;
      return { trade };
    }, () => {
      setTimeout(this.doTrade, 1500);
    });
  }

  checkAllowance = (token, dst, value, callbacks) => {
    if (token === 'eth') {
      callbacks.forEach(callback => this.executeCallback(callback));
    } else {
      let promise;
      let valueObj;
      if (token !== '') {
        valueObj = web3.toBigNumber(web3.toWei(value));
        promise = this.getTokenAllowance(token, this.state.network.defaultAccount, dst);
      } else {
        promise = this.getTokenTrust(token, this.state.network.defaultAccount, dst);
      }

      Promise.resolve(promise).then(r => {
        // if ((token === 'gem' && r.gte(valueObj)) || (token !== 'gem' && r)) {
        if (r.gte(valueObj)) {
          callbacks.forEach(callback => this.executeCallback(callback));
        } else {
          const tokenName = token.toUpperCase();
          // const operation = token === '' ? 'approve' : 'trust';
          const operation = 'approve';
          const id = Math.random();
          const title = `${tokenName}: trust system`;
          this.logRequestTransaction(id, title);
          const log = (e, tx) => {
            if (!e) {
              this.logPendingTransaction(id, tx, title, callbacks);
            } else {
              console.log(e);
              this.logTransactionRejected(id, title);
            }
          }
          this[`${token}Obj`][operation](dst, token !== '' ? -1 : true, {}, log);
        }
      });
    }
  }

  executeProxyTx = (amount, limit) => {
    const params = this.getCallDataAndValue(this.state.trade.operation, this.state.trade.from, this.state.trade.to, amount, limit);
    const id = Math.random();
    const title = `${this.state.trade.operation}: ${amount} ${this.state.trade.operation === 'sellAll' ? this.state.trade.from : this.state.trade.to }`;
    this.logRequestTransaction(id, title);
    Promise.resolve(this.callProxyTx(this.state.proxy, 'sendTransaction', params.calldata, params.value)).then(tx => {
      this.logPendingTransaction(id, tx, title);
    }, e =>  {
      console.log(e);
      this.logTransactionRejected(id, title);
    });
  }

  executeProxyCreateAndExecute = (amount, limit) => {
    let method = "";
    let params = [];
    let value = 0;
    const addrFrom = this.state.tokens[this.state.trade.from.replace('eth', 'weth')].address;
    const addrTo = this.state.tokens[this.state.trade.to.replace('eth', 'weth')].address;
    if (this.state.trade.operation === 'sellAll') {
      if (this.state.trade.from === "eth") {
        method = 'createAndSellAllAmountPayEth';
        params = [this.proxyFactoryObj.address, settings.chain[this.state.network.network].otc, addrFrom, addrTo, limit];
        value = web3.toWei(amount);
      } else if (this.state.trade.to === "eth") {
        method = 'createAndSellAllAmountBuyEth';
        params = [this.proxyFactoryObj.address, settings.chain[this.state.network.network].otc, addrFrom, web3.toWei(amount), addrTo, limit];
      } else {
        method = 'createAndSellAllAmount';
        params = [this.proxyFactoryObj.address, settings.chain[this.state.network.network].otc, addrFrom, web3.toWei(amount), addrTo, limit];
      }
    } else {
      if (this.state.trade.from === "eth") {
        method = 'createAndBuyAllAmountPayEth';
        params = [this.proxyFactoryObj.address, settings.chain[this.state.network.network].otc, addrTo, web3.toWei(amount), addrFrom];
        value = limit;
      } else if (this.state.trade.to === "eth") {
        method = 'createAndBuyAllAmountBuyEth';
        params = [this.proxyFactoryObj.address, settings.chain[this.state.network.network].otc, addrTo, web3.toWei(amount), addrFrom, limit];
      } else {
        method = 'createAndBuyAllAmount';
        params = [this.proxyFactoryObj.address, settings.chain[this.state.network.network].otc, addrTo, web3.toWei(amount), addrFrom, limit];
      }
    }

    const id = Math.random();
    const title = `${this.state.trade.operation}: ${amount} ${this.state.trade.operation === 'sellAll' ? this.state.trade.from : this.state.trade.to }`;
    this.logRequestTransaction(id, title);
    this.loadObject(proxycreateandexecute.abi,
      settings.chain[this.state.network.network].proxyCreationAndExecute)[method](...params, { value }, (e, tx) => {
      if (!e) {
        this.logPendingTransaction(id, tx, title, [['setProxyAddress']]);
      } else {
        console.log(e);
        this.logTransactionRejected(id, title);
      }
    })
  }

  doTrade = () => {
    const amount = this.state.trade[this.state.trade.operation === 'sellAll' ? 'amountPay' : 'amountBuy'];
    const limit = web3.toWei(this.state.trade.operation === 'sellAll' ? this.state.trade.amountBuy.times(0.95): this.state.trade.amountPay.times(1.05)).round(0);
    if (this.state.proxy) {
      this.checkAllowance(this.state.trade.from,
                          this.state.proxy,
                          this.state.trade.operation === 'sellAll' ? this.state.trade.amountPay : this.state.trade.amountPay.times(1.05).round(0),
                          [['executeProxyTx', amount, limit]]);
    } else {
      // No Proxy created, we need to use the support contract
      this.checkAllowance(this.state.trade.from,
                          settings.chain[this.state.network.network].proxyCreationAndExecute,
                          this.state.trade.operation === 'sellAll' ? this.state.trade.amountPay : this.state.trade.amountPay.times(1.05).round(0),
                          [['executeProxyCreateAndExecute', amount, limit]]);
    }
  }

  getBalance = address => {
    return new Promise((resolve, reject) => {
      web3.eth.getBalance(address, (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          resolve(e);
        }
      })
    });
  }

  getTokenBalance = (token, address) => {
    return new Promise((resolve, reject) => {
      this[`${token}Obj`].balanceOf.call(address, (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          resolve(e);
        }
      })
    });
  }

  getTokenTrusted = (token, from, to) => {
    return new Promise((resolve, reject) => {
      this[`${token}Obj`].allowance.call(from, to, (e, r) => {
        if (!e) {
          resolve(r.eq(web3.toBigNumber(2).pow(256).minus(1))); // uint(-1)
        } else {
          resolve(e);
        }
      })
    });
  }

  getTokenAllowance = (token, from, to) => {
    return new Promise((resolve, reject) => {
      this[`${token}Obj`].allowance.call(from, to, (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          resolve(e);
        }
      })
    });
  }

  cleanInputs = () => {
    this.setState((prevState, props) => {
      const trade = { ...prevState.trade };
      trade.amountBuy = web3.toBigNumber(0);
      trade.amountPay = web3.toBigNumber(0);
      trade.amountBuyInput = '';
      trade.amountPayInput = '';
      trade.txCost = web3.toBigNumber(0);
      return { trade };
    });
  }

  ethBalanceOf = addr => {
    return new Promise((resolve, reject) => {
      web3.eth.getBalance(addr, (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      });
    });
  }

  tokenBalanceOf = (token, addr) => {
    return new Promise((resolve, reject) => {
      this[`${token}Obj`].balanceOf(addr, (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      });
    });
  }

  calculateBuyAmount = (from, to, amount) => {
    this.setState((prevState, props) => {
      const trade = { ...prevState.trade };
      trade.from = from;
      trade.to = to;
      trade.amountBuy = web3.toBigNumber(0);
      trade.amountPay = web3.toBigNumber(amount);
      trade.amountBuyInput = '';
      trade.amountPayInput = amount;
      trade.operation = 'sellAll';
      trade.txCost = web3.toBigNumber(0);
      trade.errorSell = null;
      trade.errorBuy = null;
      return { trade };
    }, () => {
      if (web3.toBigNumber(amount).eq(0)) {
        this.setState((prevState, props) => {
          const trade = { ...prevState.trade };
          trade.amountBuy = web3.fromWei(web3.toBigNumber(0));
          trade.amountBuyInput = '';
        });
        return;
      }
      this.loadObject(matchingmarket.abi, settings.chain[this.state.network.network].otc).getBuyAmount(
                                                                                            this.state.tokens[to.replace('eth', 'weth')].address,
                                                                                            this.state.tokens[from.replace('eth', 'weth')].address,
                                                                                            web3.toWei(amount),
      (e, r) => {
        if (!e) {
          this.setState((prevState, props) => {
            const trade = { ...prevState.trade };
            trade.amountBuy = web3.fromWei(web3.toBigNumber(r));
            trade.amountBuyInput = trade.amountBuy.valueOf();
            return { trade };
          }, async () => {
            const balance = from === 'eth' ? await this.ethBalanceOf(this.state.network.defaultAccount) : await this.tokenBalanceOf(from, this.state.network.defaultAccount);
            const error = balance.lt(web3.toWei(amount))
                          ?
                            `Not enough balance to sell ${amount} ${from.toUpperCase()}`
                          :
                            this.state.trade.amountBuy.eq(0)
                            ?
                              `Not enough orders to sell ${amount} ${from.toUpperCase()}`
                            :
                              null;
            if (error) {
              this.setState((prevState, props) => {
                const trade = { ...prevState.trade };
                trade.errorSell = error;
                return { trade };
              });
              return;
            }
            // if user has proxy and allowance, use this address as from, otherwise a known and funded account
            const canUseAddress = this.state.proxy
                                  ?
                                    from === 'eth' ||
                                    await this.getTokenTrusted(from, this.state.network.defaultAccount, this.state.proxy) ||
                                    (await this.getTokenAllowance(from, this.state.network.defaultAccount, this.state.proxy)).gt(web3.toWei(amount))
                                  :
                                    false;
            const addrFrom = canUseAddress ? this.state.network.defaultAccount : settings.chain[this.state.network.network].addrEstimation;
            const proxyAddr = canUseAddress ? this.state.proxy : settings.chain[this.state.network.network].proxyEstimation;
            const params = this.getCallDataAndValue('sellAll', from, to, amount, 0);
            this.calculateCost(proxyAddr, params.calldata, params.value, addrFrom);
          });
        } else {
          console.log(e);
        }
      });
    });
  }

  calculatePayAmount = (from, to, amount) => {
    this.setState((prevState, props) => {
      const trade = { ...prevState.trade };
      trade.from = from;
      trade.to = to;
      trade.amountBuy = web3.toBigNumber(amount);
      trade.amountPay = web3.toBigNumber(0);
      trade.amountBuyInput = amount;
      trade.amountPayInput = '';
      trade.operation = 'buyAll';
      trade.txCost = web3.toBigNumber(0);
      trade.errorSell = null;
      trade.errorBuy = null;
      return { trade };
    }, () => {
      if (web3.toBigNumber(amount).eq(0)) {
        this.setState((prevState, props) => {
          const trade = { ...prevState.trade };
          trade.amountPay = web3.fromWei(web3.toBigNumber(0));
          trade.amountPayInput = '';
        });
        return;
      }
      this.loadObject(matchingmarket.abi, settings.chain[this.state.network.network].otc).getPayAmount(
        this.state.tokens[from.replace('eth', 'weth')].address,
        this.state.tokens[to.replace('eth', 'weth')].address,
        web3.toWei(amount),
      (e, r) => {
        if (!e) {
          this.setState((prevState, props) => {
            const trade = { ...prevState.trade };
            trade.amountPay = web3.fromWei(web3.toBigNumber(r));
            trade.amountPayInput = trade.amountPay.valueOf();
            return { trade };
          }, async () => {
            const balance = from === 'eth' ? await this.ethBalanceOf(this.state.network.defaultAccount) : await this.tokenBalanceOf(from, this.state.network.defaultAccount);
            const error = this.state.trade.amountPay.eq(0)
                          ?
                            `Not enough orders to buy ${amount} ${to.toUpperCase()}`
                          :
                            balance.lt(web3.toWei(this.state.trade.amountPay))
                            ?
                              `Not enough balance to sell ${this.state.trade.amountPay} ${from.toUpperCase()}`
                            :
                              null;
            if (error) {
              this.setState((prevState, props) => {
                const trade = { ...prevState.trade };
                trade.errorBuy = error;
                return { trade };
              });
              return;
            }
            // if user has proxy and allowance, use this address as from, otherwise a known and funded account
            const canUseAddress = this.state.proxy
            ?
              from === 'eth' ||
              await this.getTokenTrusted(from, this.state.network.defaultAccount, this.state.proxy)
              ||
              (await this.getTokenAllowance(from, this.state.network.defaultAccount, this.state.proxy)).gt(web3.toWei(this.state.trade.amountPay))
            :
              false;
            const addrFrom = canUseAddress ? this.state.network.defaultAccount : settings.chain[this.state.network.network].addrEstimation;
            const proxyAddr = canUseAddress ? this.state.proxy : settings.chain[this.state.network.network].proxyEstimation;
            const params = this.getCallDataAndValue('buyAll', from, to, amount, web3.toWei(this.state.trade.amountPay));
            this.calculateCost(proxyAddr, params.calldata, params.value, addrFrom);
          });
        } else {
          console.log(e);
        }
      });
    });
  }

  callProxyTx = (proxyAddr, type, calldata, value = 0, from) => {
    return new Promise((resolve, reject) => {
      this.loadObject(dsproxy.abi, proxyAddr).execute['address,bytes']['sendTransaction'](settings.chain[this.state.network.network].proxyContracts.oasisDirect,
        calldata,
        { value, from },
        (e, r) => {
          if (!e) {
            resolve(r);
          } else {
            reject(e);
          }
        }
      );
    });
  }

  calculateCost = (proxyAddr, calldata, value = 0, from) => {
    Promise.all([this.estimateGas(proxyAddr, calldata, value, from), this.getGasPrice()]).then(r => {
      this.setState((prevState, props) => {
        const trade = { ...prevState.trade };
        trade.txCost = web3.fromWei(r[1].times(r[0]));
        return { trade };
      });
    });
  }

  estimateGas = (proxyAddr, calldata, value, from) => {
    return new Promise((resolve, reject) => {
      const data = this.loadObject(dsproxy.abi, proxyAddr).execute['address,bytes'].getData(
        settings.chain[this.state.network.network].proxyContracts.oasisDirect,
        calldata
      );
      web3.eth.estimateGas(
          { to: proxyAddr, data, value, from },
          (e, r) => {
            if (!e) {
              resolve(r);
            } else {
              reject(e);
            }
          }
      );
    });
  }

  getGasPrice = () => {
    return new Promise((resolve, reject) => {
      web3.eth.getGasPrice(
          (e, r) => {
            if (!e) {
              resolve(r);
            } else {
              reject(e);
            }
          }
      );
    });
  }
  //

  renderMain = () => {
    return (
      <div>
        {
          this.state.trade.step === 1
          ? 
            <SetTrade cleanInputs={ this.cleanInputs } calculateBuyAmount={ this.calculateBuyAmount } calculatePayAmount={ this.calculatePayAmount } goToDoTradeStep={ this.goToDoTradeStep } trade={ this.state.trade } />
          :
            <DoTrade trade={ this.state.trade } />
        }
        <ReactNotify ref='notificator'/>
      </div>
    );
  }

  render() {
    return (
      this.state.network.isConnected ? this.renderMain() : <NoConnection />
    );
  }
}

export default App;
