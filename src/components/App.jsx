import React, {Component} from 'react';
import {initWeb3} from '../web3';
import * as Blockchain from "../blockchainHandler";
import {addressToBytes32, toBigNumber, toWei, fromWei, BigNumber} from '../helpers';
import Widget from './Widget';
import { Logo } from "./Icons";
import FAQ from "./FAQ";

const settings = require('../settings');

window.Blockchain = Blockchain;

class App extends Component {
  constructor() {
    super();
    const initialState = this.getInitialState();
    this.state = {
      ...initialState,
      network: {},
      hw: {show: false, option: null, derivationPath: null, addresses: [], addressIndex: null},
      section: 'exchange',
    }
    this.txInterval = {};
  }

  getInitialState = () => {
    return {
      showTxMessage: false,
      balances: {},
      trade: {
        step: 1,
        operation: '',
        from: 'eth',
        to: 'dai',
        amountPay: toBigNumber(0),
        amountBuy: toBigNumber(0),
        amountPayInput: '',
        amountBuyInput: '',
        txCost: toBigNumber(0),
        errorInputSell: null,
        errorInputBuy: null,
        errorOrders: null,
        txs: null,
        proxy: null
      },
      transactions: {},
    };
  }

  checkNetwork = () => {
    let isConnected = null;
    Blockchain.getNode().then(r => {
      isConnected = true;
      Blockchain.getBlock('latest').then(res => {
        if (typeof(res) === 'undefined') {
          console.debug('YIKES! getBlock returned undefined!');
        }
        if (res.number >= this.state.network.latestBlock) {
          const networkState = {...this.state.network};
          networkState.latestBlock = res.number;
          networkState.outOfSync = ((new Date().getTime() / 1000) - res.timestamp) > 600;
          this.setState({network: networkState});
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
      if (this.state.network.isConnected !== isConnected) {
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
            if (this.state.network.network !== network) {
              this.initNetwork(network);
            }
          }, () => {
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
    Blockchain.getAccounts().then(accounts => {
      const networkState = {...this.state.network};
      networkState.accounts = accounts;
      const oldDefaultAccount = networkState.defaultAccount;
      if (!this.state.network.isHw) {
        networkState.defaultAccount = accounts[0];
      }
      Blockchain.setDefaultAccount(networkState.defaultAccount);
      this.setState({network: networkState}, () => {
        if (oldDefaultAccount !== networkState.defaultAccount) {
          this.initContracts();
        }
      });
    }, () => {});
  }

  componentDidMount = () => {
    setTimeout(this.init, 500);
  }

  componentWillUnmount = () => {
    clearInterval(this.checkAccountsInterval);
    clearInterval(this.checkNetworkInterval);
  }

  init = () => {
    this.setHashSection();
    window.onhashchange = () => {
      this.setHashSection();
    }

    initWeb3();
    this.checkNetwork();
    this.checkAccountsInterval = setInterval(this.checkAccounts, 1000);
    this.checkNetworkInterval = setInterval(this.checkNetwork, 3000);
  }

  setHashSection = () => {
    const section = window.location.hash.replace(/^#\/?|\/$/g, '').split('/')[0];
    this.setState({section});
  }

  initContracts = () => {
    Blockchain.resetFilters(true);
    if (typeof this.pendingTxInterval !== 'undefined') clearInterval(this.pendingTxInterval);
    const initialState = this.getInitialState();
    this.setState({
      ...initialState
    }, () => {
      const addrs = settings.chain[this.state.network.network];
      Blockchain.loadObject('proxyregistry', addrs.proxyRegistry, 'proxyRegistry');
      const setUpPromises = [Blockchain.getProxyAddress(this.state.network.defaultAccount)];
      Promise.all(setUpPromises).then(r => {
        console.log('proxy', r[0]);
        this.setState((prevState, props) => {
          return {proxy: r[0]};
        }, () => {
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

  setProxyAddress = (callbacks = []) => {
    Blockchain.getProxyAddress(this.state.network.defaultAccount).then(proxy => {
      console.log('proxy', proxy);
      this.setState(() => {
        return {proxy};
      }, () => {
        callbacks.forEach(callback => this.executeCallback(callback));
      });
    }, () => {});
  }

  saveBalance = token => {
    if (token === 'weth') {
      Blockchain.getEthBalanceOf(this.state.network.defaultAccount).then(r => {
        this.setState((prevState) => {
          const balances = {...prevState.balances};
          balances.eth = r;
          return {balances};
        });
      }, () => {});
    } else {
      Blockchain.getTokenBalanceOf(token, this.state.network.defaultAccount).then(r => {
        this.setState((prevState) => {
          const balances = {...prevState.balances};
          balances[token] = r;
          return {balances};
        });
      }, () => {});
    }
  }

  setUpToken = token => {
    Blockchain.loadObject(token === 'weth' ? 'dsethtoken' : 'dstoken', settings.chain[this.state.network.network].tokens[token].address, token);
    setInterval(() => {
      this.saveBalance(token);
    }, 5000);
    this.saveBalance(token);
  }
  //

  getLogsByAddressFromEtherscan = (address, fromBlock, filter = {}) => {
    let filterString = '';
    if (Object.keys(filter).length > 0) {
      Object.keys(filter).map(key => {
        filterString += `&${key}=${filter[key]}`;
        return false;
      });
    }
    return new Promise((resolve, reject) => {
      const url = `https://api${this.state.network.network !== 'main' ? `-${this.state.network.network}` : ''}.etherscan.io/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=latest&address=${address}${filterString}&apikey=${settings.etherscanApiKey}`
      console.log(url);
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

  getTransactionsByAddressFromEtherscan = (address, fromBlock) => {
    return new Promise((resolve, reject) => {
      const url = `https://api${this.state.network.network !== 'main' ? `-${this.state.network.network}` : ''}.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${fromBlock}&sort=desc&apikey=${settings.etherscanApiKey}`
      console.log(url);
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
        Blockchain.getTransactionReceipt(transactions[type].tx).then(r => {
          if (r !== null) {
            if (r.logs.length === 0) {
              this.logTransactionFailed(transactions[type].tx);
            } else if (r.blockNumber) {
              this.logTransactionConfirmed(transactions[type].tx, r.gasUsed);
            }
          } else {
            // Check if the transaction was replaced by a new one
            // Using logs:
            Blockchain.setFilter(
              transactions[type].checkFromBlock,
              settings.chain[this.state.network.network].tokens[this.state.trade.from.replace('eth', 'weth')].address
            ).then(r => {
              r.forEach(v => {
                Blockchain.getTransaction(v.transactionHash).then(r2 => {
                  if (r2.from === this.state.network.defaultAccount &&
                    r2.nonce === transactions[type].nonce) {
                    this.saveReplacedTransaction(type, v.transactionHash);
                  }
                })
              });
            }, () => {});
            // Using Etherscan API (backup)
            this.getTransactionsByAddressFromEtherscan(this.state.network.defaultAccount, transactions[type].checkFromBlock).then(r => {
              if (parseInt(r.status, 10) === 1 && r.result.length > 0) {
                r.result.forEach(v => {
                  if (parseInt(v.nonce, 10) === parseInt(transactions[type].nonce, 10)) {
                    this.saveReplacedTransaction(type, v.hash);
                  }
                });
              }
            }, () => {});
          }
        }, () => {});
      } else {
        if (typeof transactions[type] !== 'undefined' && typeof transactions[type].amountSell !== 'undefined' && transactions[type].amountSell.eq(-1)) {
          // Using Logs
          Blockchain.setFilter(
            transactions[type].checkFromBlock,
            settings.chain[this.state.network.network].tokens[this.state.trade.from.replace('eth', 'weth')].address
          ).then(logs => this.saveTradedValue('sell', logs), () => {});
          // Using Etherscan API (backup)
          this.getLogsByAddressFromEtherscan(settings.chain[this.state.network.network].tokens[this.state.trade.from.replace('eth', 'weth')].address,
          transactions[type].checkFromBlock).then(logs => {
            if (parseInt(logs.status, 10) === 1) {
              this.saveTradedValue('sell', logs.result);
            }
          }, () => {});
        }
        if (typeof transactions[type] !== 'undefined' && typeof transactions[type].amountBuy !== 'undefined' && transactions[type].amountBuy.eq(-1)) {
          // Using Logs
          Blockchain.setFilter(
            transactions[type].checkFromBlock,
            settings.chain[this.state.network.network].tokens[this.state.trade.to.replace('eth', 'weth')].address
          ).then(logs => this.saveTradedValue('buy', logs), () => {}, () => {});
          // Using Etherscan API (backup)
          this.getLogsByAddressFromEtherscan(settings.chain[this.state.network.network].tokens[this.state.trade.to.replace('eth', 'weth')].address,
          transactions[type].checkFromBlock).then(logs => {
            if (parseInt(logs.status, 10) === 1) {
              this.saveTradedValue('buy', logs.result);
            }
          }, () => {});
        }
      }
      return false;
    });
  }

  saveReplacedTransaction = (type, newTx) => {
    if (this.state.transactions[type].tx !== newTx) {
      console.log(`Transaction ${this.state.transactions[type].tx} was replaced by ${newTx}.`);
    }
    this.setState((prevState, props) => {
      const transactions = {...prevState.transactions};
      transactions[type].tx = newTx;
      return {transactions};
    }, () => {
      this.checkPendingTransactions();
    });
  }

  saveTradedValue = (operation, logs) => {
    let value = toBigNumber(0);
    logs.forEach(log => {
      if (log.transactionHash === this.state.transactions.trade.tx) {
        if (this.state.trade[operation === 'buy' ? 'to' : 'from'] !== 'eth' &&
          log.topics[operation === 'buy' ? 2 : 1] === addressToBytes32(this.state.network.defaultAccount) &&
          log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
          // No ETH, src or dst is user's address and Transfer Event
          value = value.add(toBigNumber(log.data));
        } else if (this.state.trade[operation === 'buy' ? 'to' : 'from'] === 'eth') {
          if (log.topics[0] === '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c') {
            // Deposit (only can come when selling ETH)
            value = value.add(toBigNumber(log.data));
          } else if (log.topics[0] === '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65') {
            // Withdrawal
            if (operation === 'buy') {
              // If buying, the withdrawal shows amount the user is receiving
              value = value.add(toBigNumber(log.data));
            } else {
              // If selling, the withdrawal shows part of the amount sent that is refunded
              value = value.minus(toBigNumber(log.data));
            }
          }
        }
      }
    });
    if (value.gt(0)) {
      this.setState((prevState, props) => {
        const transactions = {...prevState.transactions};
        transactions.trade[operation === 'buy' ? 'amountBuy' : 'amountSell'] = value;
        return {transactions};
      });
    }
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

  logPendingTransaction = async (tx, type, callbacks = []) => {
    this.txInterval[tx] = setTimeout(() => {
      this.setState(prevState => {
        return {showTxMessage: true}
      })
    }, 60000);
    const nonce = await Blockchain.getTransactionCount(this.state.network.defaultAccount);
    const checkFromBlock = (await Blockchain.getBlock('latest')).number;
    console.log('nonce', nonce);
    console.log('checkFromBlock', checkFromBlock);
    const msgTemp = 'Transaction TX was created. Waiting for confirmation...';
    const transactions = {...this.state.transactions};
    transactions[type] = {tx, pending: true, error: false, nonce, checkFromBlock, callbacks}
    if (type === 'trade') {
      transactions[type].amountSell = toBigNumber(-1);
      transactions[type].amountBuy = toBigNumber(-1);
    }
    this.setState({transactions});
    console.log(msgTemp.replace('TX', tx));
  }

  logTransactionConfirmed = (tx, gasUsed) => {
    const msgTemp = 'Transaction TX was confirmed.';
    const transactions = {...this.state.transactions};

    const type = typeof transactions.proxy !== 'undefined' && transactions.proxy.tx === tx
                  ?
                    'proxy'
                  :
                    typeof transactions.approval !== 'undefined' && transactions.approval.tx === tx
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
      transactions[type].gasUsed = parseInt(gasUsed, 10);
      this.setState({transactions}, () => {
        console.log(msgTemp.replace('TX', tx));
        Blockchain.getTransaction(tx).then(r => {
          if (r) {
            this.setState((prevState, props) => {
              const transactions = {...prevState.transactions};
              transactions[type].gasPrice = r.gasPrice;
              clearInterval(this.txInterval[tx]);
              return {transactions, showTxMessage: false};
            });
          }
        }, () => {});
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
      clearInterval(this.txInterval[tx]);
      this.setState({transactions, showTxMessage: false});
    }
  }

  logTransactionRejected = type => {
    const transactions = {...this.state.transactions};
    transactions[type] = {rejected: true}
    this.setState({transactions});
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

  reset = () => {
    this.setState({...this.getInitialState()});
  }
  //

  // Actions
  executeCallback = args => {
    const method = args.shift();
    // If the callback is to execute a getter function is better to wait as sometimes the new value is not updated instantly when the tx is confirmed
    const timeout = ['executeProxyTx', 'executeProxyCreateAndSellETH', 'checkAllowance'].indexOf(method) !== -1 ? 0 : 4000;
    // console.log(method, args, timeout);
    setTimeout(() => {
      this[method](...args);
    }, timeout);
  }

  checkProxy = callbacks => {
    if (this.state.proxy) {
      callbacks.forEach(callback => this.executeCallback(callback));
    } else {
      this.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
        this.logRequestTransaction('proxy').then(() => {
          const proxyRegistry = Blockchain.objects.proxyRegistry;
          callbacks = [['setProxyAddress', callbacks]];
          const log = (e, tx) => {
            if (!e) {
              this.logPendingTransaction(tx, 'proxy', callbacks);
            } else {
              this.logTransactionRejected('proxy');
            }
          }

          this.setState((prevState, props) => {
            const trade = {...prevState.trade};
            trade.step = 2;
            trade.txs = 3;
            return {trade};
          }, () => {
            if (this.state.network.isHw && this.state.hw.option === 'ledger') {
              Blockchain.signTransactionLedger(`${this.state.hw.derivationPath}/${this.state.hw.addressIndex}`, this.state.network.defaultAccount, proxyRegistry.address, proxyRegistry.build.getData(), 0, gasPrice).then(tx => {
                log(null, tx);
              }, e => {
                log(e, null);
              });
            } else {
              proxyRegistry.build({gasPrice}, log);
            }
          });
        });
      });
    }
  }

  checkAllowance = (token, dst, value, callbacks) => {
    if (dst === 'proxy') dst = this.state.proxy; // It needs to be done as proxy might not be created when setAllowance is added to the queue of functions to be executed
    const valueObj = toBigNumber(toWei(value));
    Blockchain.getTokenAllowance(token, this.state.network.defaultAccount, dst).then(r => {
      if (r.gte(valueObj)) {
        this.setState((prevState, props) => {
          const trade = {...prevState.trade};
          trade.step = 2;
          trade.txs = trade.txs ? trade.txs : 1;
          return {trade};
        }, () => {
          callbacks.forEach(callback => this.executeCallback(callback));
        });
      } else {
        this.setState((prevState, props) => {
          const trade = {...prevState.trade};
          trade.step = 2;
          trade.txs = trade.txs ? trade.txs : 2;
          return {trade};
        }, () => {
          this.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
            this.logRequestTransaction('approval').then(() => {
              const tokenObj = Blockchain.objects[token];
              const params = [dst, -1];
              const log = (e, tx) => {
                if (!e) {
                  this.logPendingTransaction(tx, 'approval', callbacks);
                } else {
                  this.logTransactionRejected('approval');
                }
              }
              if (this.state.network.isHw && this.state.hw.option === 'ledger') {
                Blockchain.signTransactionLedger(`${this.state.hw.derivationPath}/${this.state.hw.addressIndex}`, this.state.network.defaultAccount, tokenObj.address, tokenObj.approve.getData(...params), 0, gasPrice).then(tx => {
                  log(null, tx);
                }, e => {
                  log(e, null);
                });
              } else {
                tokenObj.approve(...params.concat([{gasPrice}, log]));
              }
            }, e => {
              console.debug("Couldn't calculate gas price because of", e);
            });
          });
        });
      }
    }, () => {});
  }

  executeProxyTx = (amount, limit) => {
    const data = Blockchain.getCallDataAndValue(this.state.network.network, this.state.trade.operation, this.state.trade.from, this.state.trade.to, amount, limit);
    this.logRequestTransaction('trade').then(() => {
      this.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
        const proxy = Blockchain.loadObject('dsproxy', this.state.proxy);
        const params = [settings.chain[this.state.network.network].proxyContracts.oasisDirect, data.calldata];
        const log = (e, tx) => {
          if (!e) {
            this.logPendingTransaction(tx, 'trade');
          } else {
            console.log(e);
            this.logTransactionRejected('trade');
          }
        }
        if (this.state.network.isHw && this.state.hw.option === 'ledger') {
          Blockchain.signTransactionLedger(`${this.state.hw.derivationPath}/${this.state.hw.addressIndex}`, this.state.network.defaultAccount, proxy.address, proxy.execute['address,bytes'].getData(...params), data.value, gasPrice).then(tx => {
            log(null, tx);
          }, e => {
            log(e, null);
          });
        } else {
          proxy.execute['address,bytes'](...params.concat([{value: data.value, gasPrice}, log]));
        }
      }, () => {});
    }, () => {});
  }

  executeProxyCreateAndSellETH = (amount, limit) => {
    const data = Blockchain.getActionCreateProxyAndSellETH(this.state.network.network, this.state.trade.operation, this.state.trade.to, amount, limit);
    this.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
      this.logRequestTransaction('trade').then(() => {
        const proxyCreateAndExecute = Blockchain.loadObject('proxycreateandexecute', settings.chain[this.state.network.network].proxyCreationAndExecute);
        const log = (e, tx) => {
          if (!e) {
            this.logPendingTransaction(tx, 'trade', [['setProxyAddress']]);
          } else {
            console.log(e);
            this.logTransactionRejected('trade');
          }
        }

        if (this.state.network.isHw && this.state.hw.option === 'ledger') {
          Blockchain.signTransactionLedger(`${this.state.hw.derivationPath}/${this.state.hw.addressIndex}`, this.state.network.defaultAccount, proxyCreateAndExecute.address, proxyCreateAndExecute[data.method].getData(...data.params), data.value, gasPrice).then(tx => {
            log(null, tx);
          }, e => {
            log(e, null);
          });
        } else {
          proxyCreateAndExecute[data.method](...data.params.concat([{value: data.value, gasPrice}, log]));
        }
      }, () => {});
    }, e => console.debug("Couldn't calculate gas price because of:", e));
  }

  doTrade = () => {
    const amount = this.state.trade[this.state.trade.operation === 'sellAll' ? 'amountPay' : 'amountBuy'];
    const threshold = settings.chain[this.state.network.network].threshold[[this.state.trade.from, this.state.trade.to].sort((a, b) => a > b).join('')] * 0.01;
    const limit = toWei(this.state.trade.operation === 'sellAll' ? this.state.trade.amountBuy.times(1 - threshold) : this.state.trade.amountPay.times(1 + threshold)).round(0);
    if (this.state.trade.from === 'eth') {
      this.setState((prevState, props) => {
        const trade = {...prevState.trade};
        trade.step = 2;
        trade.txs = 1;
        trade.proxy = this.state.proxy;
        return {trade};
      }, () => {
        // It will use the support contract just for the case of selling ETH
        this[this.state.proxy ? 'executeProxyTx' : 'executeProxyCreateAndSellETH'](amount, limit);
      });
    } else {
      const callbacks = [
                          [
                            'checkAllowance',
                            this.state.trade.from,
                            'proxy',
                            amount,
                            [
                              ['executeProxyTx', amount, limit]
                            ]
                          ]
                        ];
      this.checkProxy(callbacks);
    }
  }

  cleanInputs = () => {
    this.setState((prevState) => {
      const trade = {...prevState.trade};
      trade.amountBuy = toBigNumber(0);
      trade.amountPay = toBigNumber(0);
      trade.amountBuyInput = '';
      trade.amountPayInput = '';
      trade.txCost = toBigNumber(0);
      trade.errorInputSell = null;
      trade.errorInputBuy = null;
      trade.errorOrders = null;
      return {trade};
    });
  }

  calculateBuyAmount = (from, to, amount) => {
    this.setState((prevState) => {
      const trade = {...prevState.trade};
      trade.from = from;
      trade.to = to;
      trade.amountBuy = toBigNumber(0);
      trade.amountPay = toBigNumber(amount);
      trade.amountBuyInput = '';
      trade.amountPayInput = amount;
      trade.operation = 'sellAll';
      trade.txCost = toBigNumber(0);
      trade.errorInputSell = null;
      trade.errorInputBuy = null;
      trade.errorOrders = null;
      return {trade};
    }, () => {
      if (toBigNumber(amount).eq(0)) {
        this.setState((prevState, props) => {
          const trade = {...prevState.trade};
          trade.amountBuy = fromWei(toBigNumber(0));
          trade.amountBuyInput = '';
        });
        return;
      }
      const minValue = settings.chain[this.state.network.network].tokens[from.replace('eth', 'weth')].minValue;
      if (this.state.trade.amountPay.lt(minValue)) {
        this.setState((prevState, props) => {
          const trade = {...prevState.trade};
          trade.errorInputSell = `minValue:${new BigNumber(minValue).valueOf()}`;
          return {trade};
        });
        return;
      }
      Blockchain.loadObject('matchingmarket', settings.chain[this.state.network.network].otc).getBuyAmount(
        settings.chain[this.state.network.network].tokens[to.replace('eth', 'weth')].address,
        settings.chain[this.state.network.network].tokens[from.replace('eth', 'weth')].address,
        toWei(amount),
        (e, r) => {
          if (!e) {
            const calculatedReceiveValue = fromWei(toBigNumber(r));

            this.setState((prevState) => {
              const trade = {...prevState.trade};
              trade.amountBuy = calculatedReceiveValue;
              trade.amountBuyInput = trade.amountBuy.valueOf();
              return {trade};
            }, async () => {
              const balance = from === 'eth' ? await Blockchain.getEthBalanceOf(this.state.network.defaultAccount) : await Blockchain.getTokenBalanceOf(from, this.state.network.defaultAccount);
              const errorInputSell = balance.lt(toWei(amount))
                ?
                // `Not enough balance to sell ${amount} ${from.toUpperCase()}`
                'funds'
                :
                '';
              const errorOrders = this.state.trade.amountBuy.eq(0)
                ?
                {
                  type: "sell",
                  amount,
                  token: from.toUpperCase()
                }
                :
                null;
              if (errorInputSell || errorOrders) {
                this.setState((prevState, props) => {
                  const trade = {...prevState.trade};
                  trade.errorInputSell = errorInputSell;
                  trade.errorOrders = errorOrders;
                  return {trade};
                });
                return;
              }

              /*
              * Even thought the user entered how much he wants to pay
              * we still must calculate if what he will receive is higher than
              * the min value for the receive token.
              *
              * If the amount of the calculated buying value is under the min value
              * an error message is displayed for violating min value.
              *
              * */
              const calculatedReceiveValueMin = settings.chain[this.state.network.network].tokens[to.replace('eth', 'weth')].minValue;

              if(calculatedReceiveValue.lt(calculatedReceiveValueMin)) {
                this.setState((prevState) => {
                  const trade = {...prevState.trade};
                  trade.amountBuyInput = calculatedReceiveValue.valueOf();
                  trade.errorInputBuy = `minValue:${new BigNumber(calculatedReceiveValueMin).valueOf()}`;
                  return {trade};
                });
                return;
              }

              this.estimateAllGasCosts('sellAll', from, to, amount);
            });
          } else {
            console.log(e);
          }
        });
    });
  }

  calculatePayAmount = (from, to, amount) => {
    this.setState((prevState) => {
      const trade = {...prevState.trade};
      trade.from = from;
      trade.to = to;
      trade.amountBuy = toBigNumber(amount);
      trade.amountPay = toBigNumber(0);
      trade.amountBuyInput = amount;
      trade.amountPayInput = '';
      trade.operation = 'buyAll';
      trade.txCost = toBigNumber(0);
      trade.errorInputSell = null;
      trade.errorInputBuy = null;
      trade.errorOrders = null;
      return {trade};
    }, () => {
      if (toBigNumber(amount).eq(0)) {
        this.setState((prevState, props) => {
          const trade = {...prevState.trade};
          trade.amountPay = fromWei(toBigNumber(0));
          trade.amountPayInput = '';
        });
        return;
      }
      const minValue = settings.chain[this.state.network.network].tokens[to.replace('eth', 'weth')].minValue;
      if (this.state.trade.amountBuy.lt(minValue)) {
        this.setState((prevState) => {
          const trade = {...prevState.trade};
          trade.errorInputBuy = `minValue:${new BigNumber(minValue).valueOf()}`;
          return {trade};
        });
        return;
      }
      Blockchain.loadObject('matchingmarket', settings.chain[this.state.network.network].otc).getPayAmount(
        settings.chain[this.state.network.network].tokens[from.replace('eth', 'weth')].address,
        settings.chain[this.state.network.network].tokens[to.replace('eth', 'weth')].address,
        toWei(amount),
        (e, r) => {
          if (!e) {
            const calculatedPayValue = fromWei(toBigNumber(r));

            this.setState((prevState) => {
              const trade = {...prevState.trade};
              trade.amountPay = calculatedPayValue;
              trade.amountPayInput = trade.amountPay.valueOf();
              return {trade};
            }, async () => {
              const balance = from === 'eth' ? await Blockchain.getEthBalanceOf(this.state.network.defaultAccount) : await Blockchain.getTokenBalanceOf(from, this.state.network.defaultAccount);
              const errorInputSell = balance.lt(toWei(this.state.trade.amountPay))
                ?
                // `Not enough balance to sell ${this.state.trade.amountPay} ${from.toUpperCase()}`
                'funds'
                :
                null;
              const errorOrders = this.state.trade.amountPay.eq(0)
                ?
                {
                  type: "buy",
                  amount,
                  token: to.toUpperCase()
                }
                :
                null;
              if (errorInputSell || errorOrders) {
                this.setState((prevState, props) => {
                  const trade = {...prevState.trade};
                  trade.errorInputSell = errorInputSell;
                  trade.errorOrders = errorOrders;
                  return {trade};
                });
                return;
              }


              /*
              * Even thought the user entered how much he wants to receive
              * we still must calculate if what he has to pay is higher than
              * the min value for the pay token.
              *
              * If the amount of the calculated selling  value is under the min value
              * an error message is displayed for violating min value.
              *
              * */
              const calculatePayValueMin = settings.chain[this.state.network.network].tokens[from.replace('eth', 'weth')].minValue;

              if(calculatedPayValue.lt(calculatePayValueMin)) {
                this.setState((prevState) => {
                  const trade = {...prevState.trade};
                  trade.amountPayInput = calculatedPayValue.valueOf();
                  trade.errorInputSell = `minValue:${new BigNumber(calculatePayValueMin).valueOf()}`;
                  return {trade};
                });
                return;
              }

              this.estimateAllGasCosts('buyAll', from, to, amount);
            });
          } else {
            console.log(e);
          }
        });
    });
  }

  estimateAllGasCosts = async (operation, from, to, amount) => {
    let hasAllowance = true;
    let action = null;
    let data = null;
    let target = null;
    let addrFrom = null;
    const txs = [];

    if (from !== 'eth') {
      hasAllowance = this.state.proxy &&
                      (await Blockchain.getTokenTrusted(from, this.state.network.defaultAccount, this.state.proxy) ||
                      (await Blockchain.getTokenAllowance(from, this.state.network.defaultAccount, this.state.proxy)).gt(toWei(amount)));

      if (!hasAllowance) {
        if (!this.state.proxy) {
          txs.push({
            to: Blockchain.objects.proxyRegistry.address,
            data: Blockchain.objects.proxyRegistry.build.getData(),
            value: 0,
            from: this.state.network.defaultAccount
          });
        }
        txs.push({
          to: Blockchain.objects[from].address,
          data: Blockchain.objects[from].approve.getData(this.state.proxy ? this.state.proxy : '0x0000000000000000000000000000000000000000', -1),
          value: 0,
          from: this.state.network.defaultAccount
        });
      }
    }

    const limit = operation === 'sellAll' ? 0 : toWei(9999999);
    if (this.state.proxy || from !== 'eth') {
      target = this.state.proxy && hasAllowance ? this.state.proxy : settings.chain[this.state.network.network].proxyEstimation;
      addrFrom = this.state.proxy && hasAllowance ? this.state.network.defaultAccount : settings.chain[this.state.network.network].addrEstimation;
      action = Blockchain.getCallDataAndValue(this.state.network.network, operation, from, to, amount, limit);
      data = Blockchain.loadObject('dsproxy', target).execute['address,bytes'].getData(
        settings.chain[this.state.network.network].proxyContracts.oasisDirect,
        action.calldata
      );
    } else {
      target = settings.chain[this.state.network.network].proxyCreationAndExecute;
      addrFrom = this.state.network.defaultAccount;
      action = Blockchain.getActionCreateProxyAndSellETH(this.state.network.network, operation, to, amount, limit);
      data = Blockchain.loadObject('proxycreateandexecute', target)[action.method].getData(...action.params);
    }

    txs.push({
      to: target,
      data,
      value: action.value ? action.value : 0,
      from: addrFrom
    });
    console.log(txs);
    this.saveCost(txs);
  }

  saveCost = (txs = []) => {
    const promises = [];
    let total = toBigNumber(0);
    txs.forEach(tx => {
      promises.push(this.calculateCost(tx.to, tx.data, tx.value, tx.from));
    });
    Promise.all(promises).then(costs => {
      costs.forEach(cost => {
        total = total.add(cost);
      });
      this.setState((prevState, props) => {
        const trade = {...prevState.trade};
        trade.txCost = fromWei(total);
        return {trade};
      });
    })
  }

  calculateCost = (to, data, value = 0, from) => {
    return new Promise((resolve, reject) => {
      console.log("Calculating cost...");
      Promise.all([Blockchain.estimateGas(to, data, value, from), this.fasterGasPrice(settings.gasPriceIncreaseInGwei)]).then(r => {
        console.log(to, data, value, from);
        console.log(r[0], r[1].valueOf());
        resolve(r[1].times(r[0]));
      }, e => {
        reject(e);
      });
    });
  }

  getGasPriceFromETHGasStation = () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject("Request timed out!");
      }, 3000);

      fetch("https://ethgasstation.info/json/ethgasAPI.json").then(stream => {
        stream.json().then(price => {
          clearTimeout(timeout);
          resolve(toWei(price.average / 10, "gwei"));
        })
      }, e => {
        clearTimeout(timeout);
        reject(e);
      });
    })
  }

  getGasPrice = () => {
    return new Promise((resolve, reject) => {
      this.getGasPriceFromETHGasStation()
        .then(estimation => resolve(estimation), () => {
          Blockchain.getGasPrice()
            .then(estimation => resolve(estimation), error => reject(error));
        });
    });
  };

  fasterGasPrice(increaseInGwei) {
    return this.getGasPrice().then(price => {
      return toBigNumber(price).add(toBigNumber(toWei(increaseInGwei, "gwei")));
    })
  }

  // Hardwallets
  showHW = option => {
    this.setState(prevState => {
      const hw = {...prevState.hw};
      hw.option = option;
      hw.show = true;
      return {hw};
    });
  }

  loadHWAddresses = derivationPath => {
    this.setState(prevState => {
      const hw = {...prevState.hw};
      hw.derivationPath = derivationPath;
      return {hw};
    }, () => {
      if (this.state.hw.option === 'ledger') {
        console.log('Connecting to Ledger', 'Getting addresses...');
        Blockchain.loadLedgerAddresses(derivationPath, 0).then(addresses => {
          this.setState(prevState => {
            const hw = {...prevState.hw};
            hw.addresses = addresses;
            return {hw};
          }, () => {
            console.log('Ledger connected', 'Addresses were loaded')
          });
        }, e => console.log('Error connecting Ledger', e.message));
      }
    });
  }

  loadMoreHwAddresses = () => {
    if (this.state.hw.option === 'ledger') {
      console.log('Connecting to Ledger', 'Getting more addresses...');
      Blockchain.loadLedgerAddresses(this.state.hw.derivationPath, this.state.hw.addresses.length).then(addresses => {
        this.setState(prevState => {
          const hw = {...prevState.hw};
          hw.addresses = hw.concat(addresses);
          return {hw};
        }, () => {
          console.log('Ledger connected', 'Addresses were loaded')
        });
      }, e => console.log('Error connecting Ledger', e.message));
    }
  }

  selectHWAddress = address => {
    this.setState(prevState => {
      const hw = {...prevState.hw};
      hw.addressIndex = hw.addresses.indexOf(address);;
      return {hw};
    });
  }

  importAddress = () => {
    this.setState(prevState => {
      const hw = {...prevState.hw};
      const network = {...prevState.network};
      network.defaultAccount = hw.addresses[hw.addressIndex].toLowerCase();
      network.isHw = true;
      hw.show = false;
      return {hw, network};
    }, () => {
      this.initContracts();
    });
  }

  stopHw = async () => {
    this.setState(prevState => {
      const network = {...prevState.network};
      network.defaultAccount = network.accounts[0];
      network.isHw = false;
      return {network};
    });
  }
  //

  render = () => {
    return (
      <section>
        <section>
          <header className="Container">
            <div className={`Logo Logo--no-margin`}>
              <a href="/"> <Logo/> </a>
            </div>
            <div className={'NavigationLinks'}>
              <a href="/#" style={{color: 'white'}}>Trade</a>
              <a href="/#tax-exporter" style={{color: 'white'}}>Export Trades</a>
            </div>
          </header>
        </section>
        {
          this.state.section === 'faq'
            ? <FAQ/>
            : <section className="Content">
              <main className="Container">
                <div>
                  <div className="MainHeading">
                    <h1>THE FIRST DECENTRALIZED INSTANT MARKETPLACE</h1>
                  </div>
                  <div className="SecondaryHeading">
                    <h2>No Registration. No Fees.</h2>
                  </div>
                </div>
                <Widget isConnected={this.state.network.isConnected}
                        section={this.state.section}
                        network={this.state.network.network}
                        account={this.state.network.defaultAccount}
                        proxy={this.state.proxy}
                        trade={this.state.trade}
                        balances={this.state.balances}
                        showTxMessage={this.state.showTxMessage}
                        transactions={this.state.transactions}
                        setMainState={this.setMainState}
                        fasterGasPrice={this.fasterGasPrice}
                        doTrade={this.doTrade}
                        reset={this.reset}
                        getProxy={this.getProxy}
                        calculateBuyAmount={this.calculateBuyAmount}
                        calculatePayAmount={this.calculatePayAmount}
                        cleanInputs={this.cleanInputs}
                        hw={ this.state.hw }
                        showHW={ this.showHW }
                        loadHWAddresses={ this.loadHWAddresses }
                        selectHWAddress={ this.selectHWAddress }
                        importAddress={ this.importAddress } />
              </main>
            </section>
        }
        <section>
          <footer className="Container">
            <div className="LinksWrapper">
              <h1> Resources </h1>
              <ul className="Links">
                <li className="Link"><a href="https://developer.makerdao.com/" target="_blank"
                                        rel="noopener noreferrer">Documentation</a></li>
                <li className="Link"><a href="OasisToS.pdf" target="_blank" rel="noopener noreferrer">Legal</a></li>
                <li className="Link" onClick={ () => {
                  window.scrollTo(0,0);
                }}><a href="/#faq" style={{color: 'white'}}>FAQ</a></li>
              </ul>
            </div>
            <div className="LinksWrapper">
              <h1> Oasis </h1>
              <ul className="Links">
                <li className="Link"><a href="https://oasisdex.com" target="_blank" rel="noopener noreferrer">Oasisdex.com</a>
                </li>
                {/* <li className="Link"><a href="#a" target="_blank" rel="noopener noreferrer">Oasis.tax</a></li> */}
              </ul>
            </div>
            <div className="LinksWrapper">
              <h1> Maker </h1>
              <ul className="Links">
                <li className="Link"><a href="https://chat.makerdao.com" target="_blank"
                                        rel="noopener noreferrer">Chat</a></li>
                <li className="Link"><a href="https://www.reddit.com/r/MakerDAO/" target="_blank"
                                        rel="noopener noreferrer">Reddit</a></li>
              </ul>
            </div>
            <div className="LinksWrapper">
              <h1> Follow us </h1>
              <ul className="Links">
                <li className="Link"><a href="https://twitter.com/oasisdirect" target="_blank"
                                        rel="noopener noreferrer">Twitter</a></li>
                <li className="Link"><a href="https://steemit.com/@oasisdirect" target="_blank"
                                        rel="noopener noreferrer">Steem</a></li>
              </ul>
            </div>
          </footer>
        </section>
      </section>
    );
  }
}

export default App;
