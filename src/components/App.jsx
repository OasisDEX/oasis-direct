import React, { Component } from 'react';
import web3, { initWeb3 } from '../web3';
import NoConnection from './NoConnection';
import NoAccount from './NoAccount';
import { toBytes32, addressToBytes32, methodSig } from '../helpers';
import SetTrade from './SetTrade';
import DoTrade from './DoTrade';

const settings = require('../settings');

const dstoken = require('../abi/dstoken');
const dsethtoken = require('../abi/dsethtoken');
const proxyregistry = require('../abi/proxyregistry');
// const dsproxyfactory = require('../abi/dsproxyfactory');
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
      params: '',
      account:'',
      ui: {
        isDropdownCollapsed: false
      }
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
      trade: {
        step: 1,
        operation: '',
        from: 'eth',
        to: 'dai',
        amountPay: web3.toBigNumber(0),
        amountBuy: web3.toBigNumber(0),
        amountPayInput: '',
        amountBuyInput: '',
        txCost: web3.toBigNumber(0),
        errorFunds: null,
        errorOrders: null,
        txs: null,
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
            const networkState = {...this.state.network};
            networkState.latestBlock = res.number;
            networkState.outOfSync = e != null || ((new Date().getTime() / 1000) - res.timestamp) > 600;
            this.setState({network: networkState});
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
          const networkState = {...this.state.network};
          networkState.isConnected = isConnected;
          networkState.network = false;
          networkState.latestBlock = 0;
          this.setState({network: networkState});
        }
      }
    });
  }

  initNetwork = newNetwork => {
    const networkState = {...this.state.network};
    networkState.network = newNetwork;
    networkState.isConnected = true;
    networkState.latestBlock = 0;
    this.setState({network: networkState}, () => {
      this.checkAccounts();
    });
  }

  checkAccounts = () => {
    web3.eth.getAccounts((error, accounts) => {
      if (!error) {
        const networkState = {...this.state.network};
        networkState.accounts = accounts;
        const oldDefaultAccount = networkState.defaultAccount;
        networkState.defaultAccount = accounts[0];
        web3.eth.defaultAccount = networkState.defaultAccount;
        this.setState({network: networkState}, () => {
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

  getFromDirectoryService = (conditions = {}, sort = {}) => {
    const p = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let conditionsString = '';
      let sortString = '';
      Object.keys(conditions).map(key => {
        conditionsString += `${key}:${conditions[key]}`;
        conditionsString += Object.keys(conditions).pop() !== key ? '&' : '';
        return false;
      });
      conditionsString = conditionsString !== '' ? `/conditions=${conditionsString}` : '';
      Object.keys(sort).map(key => {
        sortString += `${key}:${sort[key]}`;
        sortString += Object.keys(sort).pop() !== key ? '&' : '';
        return false;
      });
      sortString = sortString !== '' ? `/sort=${sortString}` : '';
      let serviceURL = settings.chain[this.state.network.network].proxyDirectoryService;
      serviceURL = serviceURL.slice(-1) === '/' ? serviceURL.substring(0, serviceURL.length - 1) : serviceURL;
      const url = `${serviceURL}${conditionsString}${sortString}`;
      xhr.open('GET', url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
          reject(xhr.status);
        }
      }
      xhr.send();
    });
    return p;
  }

  init = () => {
    initWeb3(web3);
    this.checkNetwork();
    this.checkAccountsInterval = setInterval(this.checkAccounts, 10000);
    this.checkNetworkInterval = setInterval(this.checkNetwork, 3000);
  }

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
      // window.proxyFactoryObj = this.proxyFactoryObj = this.loadObject(dsproxyfactory.abi, addrs.proxyFactory);
      window.proxyRegistryObj = this.proxyRegistryObj = this.loadObject(proxyregistry.abi, addrs.proxyRegistry);

      const setUpPromises = [this.getProxyAddress()];
      Promise.all(setUpPromises).then(r => {
        this.setState((prevState, props) => {
          return {proxy: r[0]};
        }, () => {
          this.setUpAddress('otc');
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
    }, 5000);
  }

  getAccountBalance = () => {
    if (web3.isAddress(this.state.profile.activeProfile)) {
      web3.eth.getBalance(this.state.profile.activeProfile, (e, r) => {
        const profile = {...this.state.profile};
        profile.accountBalance = r;
        this.setState({profile});
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

  getProxy = (i) => {
    return new Promise((resolve, reject) => {
      this.proxyRegistryObj.proxies(this.state.network.defaultAccount, i, (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      });
    });
  }

  getProxyAddressFromChain = (blockNumber = 0, proxies = []) => {
    const network = this.state.network;
    const me = this;
    return new Promise((resolve, reject) => {
      // me.proxyFactoryObj.Created({sender: network.defaultAccount}, {fromBlock: blockNumber}).get(async (e, r) => {
      //   if (!e) {
      //     const allProxies = proxies.concat(r.map(val => val.args));
      //     if (allProxies.length > 0) {
      //       for (let i = allProxies.length - 1; i >= 0; i--) {
      //         if (await me.getProxyOwner(allProxies[i].proxy) === network.defaultAccount) {
      //           resolve(allProxies[i].proxy);
      //           break;
      //         }
      //       }
      //       resolve(null);
      //     } else {
      //       resolve(null);
      //     }
      //   } else {
      //     reject(e);
      //   }
      // });
      me.proxyRegistryObj.proxiesCount(network.defaultAccount, async (e, r) => {
        if (!e) {
          if (r.gt(0)) {
            for (let i = r.toNumber() - 1; i >= 0; i--) {
              const proxyAddr = await this.getProxy(i);
              if (await me.getProxyOwner(proxyAddr) === network.defaultAccount) {
                resolve(proxyAddr);
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

  getProxyAddress = () => {
    const network = this.state.network;
    const addrs = settings.chain[network.network];
    const me = this;
    return new Promise((resolve, reject) => {
      if (settings.chain[network.network].proxyDirectoryService) {
        Promise.resolve(me.getFromDirectoryService({owner: network.defaultAccount}, {blockNumber: 'asc'})).then(r => {
          Promise.resolve(me.getProxyAddressFromChain(r.lastBlockNumber + 1, r.results)).then(r2 => {
            resolve(r2);
          }).catch(e2 => {
            reject(e2);
          });
        }).catch(e => {
          Promise.resolve(me.getProxyAddressFromChain(addrs.fromBlock)).then(r2 => {
            resolve(r2);
          }).catch(e2 => {
            reject(e2);
          });
          ;
        });
      } else {
        Promise.resolve(me.getProxyAddressFromChain(addrs.fromBlock)).then(r2 => {
          console.log('getProxyAddressFromChain', r2);
          resolve(r2);
        }).catch(e2 => {
          reject(e2);
        });
      }
    });
  }

  setProxyAddress = () => {
    Promise.resolve(this.getProxyAddress()).then(proxy => {
      this.setState((prevState, props) => {
        return {proxy};
      });
    });
  }

  setUpAddress = contract => {
    const addr = settings.chain[this.state.network.network][contract];
    this.setState((prevState, props) => {
      const returnObj = {};
      returnObj[contract] = {address: addr};
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
      return {tokens};
    }, () => {
      window[`${token}Obj`] = this[`${token}Obj`] = this.loadObject(token === 'weth' ? dsethtoken.abi : dstoken.abi, this.state.tokens[token].address);
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
          }
        });
      }
    }
  }

  getTotalSupply = name => {
    this[`${name}Obj`].totalSupply.call((e, r) => {
      if (!e) {
        this.setState((prevState, props) => {
          const tokens = {...prevState.tokens};
          const tok = {...tokens[name]};
          tok.totalSupply = r;
          tokens[name] = tok;
          return {tokens};
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
          return {tokens};
        });
      }
    })
  }
  //

  getTransactionsByAddressFromEtherscan = (address, fromBlock) => {
    return new Promise((resolve, reject) => {
      const url = `https://${this.state.network.network.replace('main', 'api')}.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${fromBlock}&sort=desc`
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
          reject(xhr.status);
        }
      }
      xhr.send();
    })
  }

  // Transactions
  checkPendingTransactions = () => {
    const transactions = {...this.state.transactions};
    Object.keys(transactions).map(type => {
      if (transactions[type].pending) {
        web3.eth.getTransactionReceipt(transactions[type].tx, (e, r) => {
          if (!e && r !== null) {
            if (r.logs.length === 0) {
              this.logTransactionFailed(transactions[type].tx);
            } else if (r.blockNumber) {
              this.logTransactionConfirmed(transactions[type].tx);
            }
          } else {
            Promise.resolve(this.getTransactionsByAddressFromEtherscan(this.state.network.defaultAccount, transactions[type].checkFromBlock)).then(r => {
              if (parseInt(r.status, 10) === 1 && r.result.length > 0) {
                r.result.forEach(v => {
                  if (parseInt(v.nonce, 10) === parseInt(transactions[type].nonce, 10)) {
                    if (transactions[type].tx !== v.hash) {
                      console.log(`Transaction ${transactions[type].tx} was replaced by ${v.hash}.`);
                    }
                    this.setState((prevState, props) => {
                      const transactions = {...prevState.transactions};
                      transactions[type].tx = v.hash;
                      return { transactions };
                    }, () => {
                      this.checkPendingTransactions();
                    });
                  }
                });
              }
            });
            // Solution using logs:
            // web3.eth.filter({ fromBlock: transactions[type].checkFromBlock, address: this.state.tokens[this.state.trade.from.replace('eth', 'weth')].address }).get((e, r) => {
            //   r.forEach(v => {
            //     web3.eth.getTransaction(v.transactionHash, (e2, r2) => {
            //       if (!e &&
            //           r2.from === this.state.network.defaultAccount &&
            //           r2.nonce === transactions[type].nonce) {
            //         if (transactions[type].tx !== v.transactionHash) {
            //           console.log(`Transaction ${transactions[type].tx} was replaced by ${v.transactionHash}.`);
            //         }
            //         this.setState((prevState, props) => {
            //           const transactions = {...prevState.transactions};
            //           transactions[type].tx = v.transactionHash;
            //           return { transactions };
            //         }, () => {
            //           this.checkPendingTransactions();
            //         });
            //       }
            //     });
            //   });
            // });
          }
        });
      }
      return false;
    });
  }

  logRequestTransaction = type => {
    return new Promise(resolve => {
      const transactions = {...this.state.transactions};
      transactions[type] = {requested: true}
      this.setState({transactions}, () => {
        resolve();
      });
    });
  }

  getTransactionCount = (address) => {
    return new Promise((resolve, reject) => {
      web3.eth.getTransactionCount(address, (e,r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      });
    });
  }

  getBlock = (block) => {
    return new Promise((resolve, reject) => {
      web3.eth.getBlock(block, (e,r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      });
    });
  }

  logPendingTransaction = async (tx, type, callbacks = []) => {
    const nonce = await this.getTransactionCount(this.state.network.defaultAccount);
    const checkFromBlock = (await this.getBlock('latest')).number;
    const msgTemp = 'Transaction TX was created. Waiting for confirmation...';
    const transactions = {...this.state.transactions};
    transactions[type] = { tx, pending: true, error: false, nonce, checkFromBlock, callbacks }
    this.setState({transactions});
    console.log(msgTemp.replace('TX', tx));
  }

  logTransactionConfirmed = tx => {
    const msgTemp = 'Transaction TX was confirmed.';
    const transactions = {...this.state.transactions};

    const type = typeof transactions.approval !== 'undefined' && transactions.approval.tx === tx
                 ?
                   'approval'
                 :
                   typeof transactions.trade !== 'undefined' && transactions.trade.tx === tx
                     ?
                       'trade'
                     :
                       false;
    if (type && transactions[type].pending) {
      transactions[type].pending = false;
      this.setState({ transactions }, () => {
        console.log(msgTemp.replace('TX', tx));
        if (typeof transactions[type].callbacks !== 'undefined' && transactions[type].callbacks.length > 0) {
          transactions[type].callbacks.forEach(callback => this.executeCallback(callback));
        }
      });
    }
  }

  logTransactionFailed = tx => {
    const transactions = {...this.state.transactions};
    const type = typeof transactions.approval !== 'undefined' && transactions.approval.tx === tx
                 ?
                   'approval'
                 :
                   typeof transactions.trade !== 'undefined' && transactions.trade.tx === tx
                     ?
                       'trade'
                     :
                       false;
    if (type) {
      transactions[type].pending = false;
      transactions[type].error = true;
      this.setState({transactions}, () => setTimeout(setTimeout(() => this.returnToSetTrade(), 3000)));
    }
  }

  logTransactionRejected = type => {
    const transactions = {...this.state.transactions};
    transactions[type] = {rejected: true}
    this.setState({transactions}, () => setTimeout(setTimeout(() => this.returnToSetTrade(), 3000)));
  }

  returnToSetTrade = () => {
    this.setState((prevState, props) => {
      const trade = {...prevState.trade};
      const transactions = {};
      trade.step = 1;
      trade.txs = null;
      return {trade, transactions};
    });
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
  checkAllowance = (token, dst, value, callbacks) => {
    if (token === 'eth') {
      this.setState((prevState, props) => {
        const trade = {...prevState.trade};
        trade.step = 2;
        trade.txs = 1;
        return {trade};
      }, () => {
        setTimeout(() => {
          callbacks.forEach(callback => this.executeCallback(callback));
        }, 2000);
      });
    } else {
      const valueObj = web3.toBigNumber(web3.toWei(value));

      Promise.resolve(this.getTokenAllowance(token, this.state.network.defaultAccount, dst)).then(r => {
        if (r.gte(valueObj)) {
          this.setState((prevState, props) => {
            const trade = {...prevState.trade};
            trade.step = 2;
            trade.txs = 1;
            return {trade};
          }, () => {
            setTimeout(() => {
              callbacks.forEach(callback => this.executeCallback(callback));
            }, 2000);
          });
        } else {
          this.setState((prevState, props) => {
            const trade = {...prevState.trade};
            trade.step = 2;
            trade.txs = 2;
            return {trade};
          }, () => {
            setTimeout(() => {
              Promise.resolve(this.logRequestTransaction('approval')).then(() => {
                this[`${token}Obj`].approve(dst, -1, {}, (e, tx) => {
                  if (!e) {
                    this.logPendingTransaction(tx, 'approval', callbacks);
                  } else {
                    console.log(e);
                    this.logTransactionRejected('approval');
                  }
                });
              });
            }, 2000);
          });
        }
      });
    }
  }

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

  executeProxyTx = (amount, limit) => {
    const params = this.getCallDataAndValue(this.state.trade.operation, this.state.trade.from, this.state.trade.to, amount, limit);
    Promise.resolve(this.logRequestTransaction('trade')).then(() => {
      Promise.resolve(this.callProxyTx(this.state.proxy, 'sendTransaction', params.calldata, params.value)).then(tx => {
        this.logPendingTransaction(tx, 'trade');
      }, e => {
        console.log(e);
        this.logTransactionRejected('trade');
      });
    });
  }

  getActionCreateAndExecute = (operation, from, to, amount, limit) => {
    const addrFrom = this.state.tokens[this.state.trade.from.replace('eth', 'weth')].address;
    const addrTo = this.state.tokens[this.state.trade.to.replace('eth', 'weth')].address;
    const result = {};
    if (operation === 'sellAll') {
      if (from === "eth") {
        result.method = 'createAndSellAllAmountPayEth';
        result.params = [this.proxyRegistryObj.address, settings.chain[this.state.network.network].otc, addrFrom, addrTo, limit];
        result.value = web3.toWei(amount);
      } else if (to === "eth") {
        result.method = 'createAndSellAllAmountBuyEth';
        result.params = [this.proxyRegistryObj.address, settings.chain[this.state.network.network].otc, addrFrom, web3.toWei(amount), addrTo, limit];
      } else {
        result.method = 'createAndSellAllAmount';
        result.params = [this.proxyRegistryObj.address, settings.chain[this.state.network.network].otc, addrFrom, web3.toWei(amount), addrTo, limit];
      }
    } else {
      if (from === "eth") {
        result.method = 'createAndBuyAllAmountPayEth';
        result.params = [this.proxyRegistryObj.address, settings.chain[this.state.network.network].otc, addrTo, web3.toWei(amount), addrFrom];
        result.value = limit;
      } else if (to === "eth") {
        result.method = 'createAndBuyAllAmountBuyEth';
        result.params = [this.proxyRegistryObj.address, settings.chain[this.state.network.network].otc, addrTo, web3.toWei(amount), addrFrom, limit];
      } else {
        result.method = 'createAndBuyAllAmount';
        result.params = [this.proxyRegistryObj.address, settings.chain[this.state.network.network].otc, addrTo, web3.toWei(amount), addrFrom, limit];
      }
    }
    return result;
  }

  executeProxyCreateAndExecute = (amount, limit) => {
    const action = this.getActionCreateAndExecute(this.state.trade.operation, this.state.trade.from, this.state.trade.to, amount, limit);

    Promise.resolve(this.logRequestTransaction('trade')).then(() => {
      this.loadObject(proxycreateandexecute.abi,
        settings.chain[this.state.network.network].proxyCreationAndExecute)[action.method](...action.params, {value: action.value}, (e, tx) => {
        if (!e) {
          this.logPendingTransaction(tx, 'trade', [['setProxyAddress']]);
        } else {
          console.log(e);
          this.logTransactionRejected('trade');
        }
      });
    });
  }

  doTrade = () => {
    const amount = this.state.trade[this.state.trade.operation === 'sellAll' ? 'amountPay' : 'amountBuy'];
    const limit = web3.toWei(this.state.trade.operation === 'sellAll' ? this.state.trade.amountBuy.times(0.95) : this.state.trade.amountPay.times(1.05)).round(0);
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
      const trade = {...prevState.trade};
      trade.amountBuy = web3.toBigNumber(0);
      trade.amountPay = web3.toBigNumber(0);
      trade.amountBuyInput = '';
      trade.amountPayInput = '';
      trade.txCost = web3.toBigNumber(0);
      trade.errorFunds = null;
      trade.errorOrders = null;
      return {trade};
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
      const trade = {...prevState.trade};
      trade.from = from;
      trade.to = to;
      trade.amountBuy = web3.toBigNumber(0);
      trade.amountPay = web3.toBigNumber(amount);
      trade.amountBuyInput = '';
      trade.amountPayInput = amount;
      trade.operation = 'sellAll';
      trade.txCost = web3.toBigNumber(0);
      trade.errorFunds = null;
      trade.errorOrders = null;
      return {trade};
    }, () => {
      if (web3.toBigNumber(amount).eq(0)) {
        this.setState((prevState, props) => {
          const trade = {...prevState.trade};
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
              const trade = {...prevState.trade};
              trade.amountBuy = web3.fromWei(web3.toBigNumber(r));
              trade.amountBuyInput = trade.amountBuy.valueOf();
              return {trade};
            }, async () => {
              const balance = from === 'eth' ? await this.ethBalanceOf(this.state.network.defaultAccount) : await this.tokenBalanceOf(from, this.state.network.defaultAccount);
              const errorFunds = balance.lt(web3.toWei(amount))
                ?
                // `Not enough balance to sell ${amount} ${from.toUpperCase()}`
                'Insufficient funds'
                :
                '';
              const errorOrders = this.state.trade.amountBuy.eq(0)
                ?
                `No ${to.toUpperCase()} orders available to sell ${amount} ${from.toUpperCase()}`
                :
                null;
              if (errorFunds || errorOrders) {
                this.setState((prevState, props) => {
                  const trade = {...prevState.trade};
                  trade.errorFunds = errorFunds;
                  trade.errorOrders = errorOrders;
                  return {trade};
                });
                return;
              }

              let action = null;
              let data = null;
              let target = null;
              let addrFrom = null;
              if (this.state.proxy) {
                // Calculate cost of proxy execute
                const hasAllowance = (from === 'eth' ||
                                    await this.getTokenTrusted(from, this.state.network.defaultAccount, this.state.proxy) ||
                                    (await this.getTokenAllowance(from, this.state.network.defaultAccount, this.state.proxy)).gt(web3.toWei(amount)));
                addrFrom = hasAllowance ? this.state.network.defaultAccount : settings.chain[this.state.network.network].addrEstimation;
                target = hasAllowance ? this.state.proxy : settings.chain[this.state.network.network].proxyEstimation;
                action = this.getCallDataAndValue('sellAll', from, to, amount, 0);
                data = this.loadObject(dsproxy.abi, target).execute['address,bytes'].getData(
                  settings.chain[this.state.network.network].proxyContracts.oasisDirect,
                  action.calldata
                );
              } else {
                // Calculate cost of proxy creation and execution
                target = settings.chain[this.state.network.network].proxyCreationAndExecute;
                const hasAllowance = (from === 'eth' ||
                                    await this.getTokenTrusted(from, this.state.network.defaultAccount, target) ||
                                    (await this.getTokenAllowance(from, this.state.network.defaultAccount, target)).gt(web3.toWei(amount)));
                addrFrom = hasAllowance ? this.state.network.defaultAccount : settings.chain[this.state.network.network].addrEstimation;
                action = this.getActionCreateAndExecute('sellAll', from, to, amount, 0);
                data = this.loadObject(proxycreateandexecute.abi, target)[action.method].getData(...action.params);
              }
              this.calculateCost(target, data, action.value, addrFrom);
            });
          } else {
            console.log(e);
          }
        });
    });
  }

  calculatePayAmount = (from, to, amount) => {
    this.setState((prevState, props) => {
      const trade = {...prevState.trade};
      trade.from = from;
      trade.to = to;
      trade.amountBuy = web3.toBigNumber(amount);
      trade.amountPay = web3.toBigNumber(0);
      trade.amountBuyInput = amount;
      trade.amountPayInput = '';
      trade.operation = 'buyAll';
      trade.txCost = web3.toBigNumber(0);
      trade.errorFunds = null;
      trade.errorOrders = null;
      return {trade};
    }, () => {
      if (web3.toBigNumber(amount).eq(0)) {
        this.setState((prevState, props) => {
          const trade = {...prevState.trade};
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
              const trade = {...prevState.trade};
              trade.amountPay = web3.fromWei(web3.toBigNumber(r));
              trade.amountPayInput = trade.amountPay.valueOf();
              return {trade};
            }, async () => {
              const balance = from === 'eth' ? await this.ethBalanceOf(this.state.network.defaultAccount) : await this.tokenBalanceOf(from, this.state.network.defaultAccount);
              const errorFunds = balance.lt(web3.toWei(this.state.trade.amountPay))
                ?
                // `Not enough balance to sell ${this.state.trade.amountPay} ${from.toUpperCase()}`
                'Insufficient funds'
                :
                null;
              const errorOrders = this.state.trade.amountPay.eq(0)
                ?
                `No orders available to buy ${amount} ${to.toUpperCase()}`
                :
                null;
              if (errorFunds || errorOrders) {
                this.setState((prevState, props) => {
                  const trade = {...prevState.trade};
                  trade.errorFunds = errorFunds;
                  trade.errorOrders = errorOrders;
                  return {trade};
                });
                return;
              }

              let action = null;
              let data = null;
              let target = null;
              let addrFrom = null;
              if (this.state.proxy) {
                // Calculate cost of proxy execute
                const hasAllowance = (from === 'eth' ||
                                    await this.getTokenTrusted(from, this.state.network.defaultAccount, this.state.proxy) ||
                                    (await this.getTokenAllowance(from, this.state.network.defaultAccount, this.state.proxy)).gt(web3.toWei(this.state.trade.amountPay)));
                addrFrom = hasAllowance ? this.state.network.defaultAccount : settings.chain[this.state.network.network].addrEstimation;
                target = hasAllowance ? this.state.proxy : settings.chain[this.state.network.network].proxyEstimation;
                action = this.getCallDataAndValue('buyAll', from, to, amount, web3.toWei(this.state.trade.amountPay));
                data = this.loadObject(dsproxy.abi, target).execute['address,bytes'].getData(
                  settings.chain[this.state.network.network].proxyContracts.oasisDirect,
                  action.calldata
                );
              } else {
                // Calculate cost of proxy creation and execution
                target = settings.chain[this.state.network.network].proxyCreationAndExecute;
                const hasAllowance = (from === 'eth' ||
                                    await this.getTokenTrusted(from, this.state.network.defaultAccount, target) ||
                                    (await this.getTokenAllowance(from, this.state.network.defaultAccount, target)).gt(web3.toWei(this.state.trade.amountPay)));
                addrFrom = hasAllowance ? this.state.network.defaultAccount : settings.chain[this.state.network.network].addrEstimation;
                action = this.getActionCreateAndExecute('buyAll', from, to, amount, web3.toWei(this.state.trade.amountPay));
                data = this.loadObject(proxycreateandexecute.abi, target)[action.method].getData(...action.params);
              }
              this.calculateCost(target, data, action.value, addrFrom);
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
        {value, from},
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

  calculateCost = (to, data, value = 0, from) => {
    console.log(to, data, value, from);
    Promise.all([this.estimateGas(to, data, value, from), this.getGasPrice()]).then(r => {
      console.log(r[0], r[1].valueOf())
      this.setState((prevState, props) => {
        const trade = {...prevState.trade};
        trade.txCost = web3.fromWei(r[1].times(r[0]));
        return {trade};
      });
    });
  }

  estimateGas = (to, data, value, from) => {
    return new Promise((resolve, reject) => {
      web3.eth.estimateGas(
        {to, data, value, from},
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

  toggle = () => {
    const isDropdownCollapsed = this.state.ui.isDropdownCollapsed;
    this.setState({ui: {isDropdownCollapsed: !isDropdownCollapsed}})
  }

  contractDropdownList = () => {
    this.setState({ui: {isDropdownCollapsed: false}})
  }

  switchAccount = (newAccount) => {
    this.setState((prevState) => {
      const network = {...prevState.network};
      network.defaultAccount = newAccount;

      const ui = {...prevState.ui};
      ui.isDropdownCollapsed = false;

      return { ui, network };
    });
  }

  renderMain = () => {
    return (
      <div>
        {
          this.state.trade.step === 1
            ?
            <SetTrade cleanInputs={this.cleanInputs} calculateBuyAmount={this.calculateBuyAmount}
                      calculatePayAmount={this.calculatePayAmount} doTrade={this.doTrade}
                      trade={this.state.trade}/>
            :
            <DoTrade trade={this.state.trade} transactions={this.state.transactions} network={this.state.network.network}/>
        }
      </div>
    )
  }

  render = () => {
    return (
      <main>
        <section>
          <header>
            <div className="Logo">
              <a href="/"> <img width="216px" height="38px" alt="oasis direct logo" src="/assets/oasis-logo.svg"/> </a>
            </div>
            {
              this.state.network.defaultAccount && <div onBlur={this.contractDropdownList} className="Dropdown" tabIndex={-1} title="Select an account">
                <div className="DropdownToggle" onClick={this.toggle}>
                <span data-selected className="DropdownSelected">
                  {
                    this.state.network.defaultAccount
                  }
                </span>
                  <span className="DropdownArrow"><i className="fa fa-caret-down" aria-hidden="true"/>
                </span>
                </div>
                <div className={`DropdownList ${this.state.ui.isDropdownCollapsed ? 'DropdownList--visible' : ''}`}>
                  <div className="DropdownListWrapper">
                    <ul>
                      {
                        this.state.network.accounts && this.state.network.accounts.map((account, index) => <li
                          onClick={(event) => this.switchAccount(event.target.innerText)}
                          key={index}>{account}</li>)
                      }
                    </ul>
                  </div>
                </div>
              </div>
            }
          </header>
        </section>
        <section className="Content">
          <div>
            <div style={{maxWidth: 424}}>
              <h1>THE FIRST DECENTRALIZED INSTANT EXCHANGE</h1>
            </div>
            <div>
              <h2>No Registration. No Fees.</h2>
            </div>
          </div>
          <div className="Widget">
            {
              this.state.network.isConnected
                ?
                this.state.network.defaultAccount && web3.isAddress(this.state.network.defaultAccount)
                  ?
                  this.renderMain()
                  :
                  <NoAccount/>
                :
                <NoConnection/>
            }
          </div>
        </section>
        <section>
          <footer/>
        </section>
      </main>
    );
  }
}

export default App;
