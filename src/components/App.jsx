import React, {Component} from 'react';
import {initWeb3} from '../web3';
import * as Blockchain from "../blockchainHandler";
import NoConnection from './NoConnection';
import NoAccount from './NoAccount';
import {toBytes32, addressToBytes32, methodSig, toBigNumber, toWei, fromWei, isAddress} from '../helpers';
import SetTrade from './SetTrade';
import DoTrade from './DoTrade';
import TaxExporter from './TaxExporter';
import { Logo } from "./Icons";
import FAQ from "./FAQ";

const settings = require('../settings');

class App extends Component {
  constructor() {
    super();
    const initialState = this.getInitialState();
    this.state = {
      ...initialState,
      network: {},
      section: 'exchange',
      ui: {
        isDropdownCollapsed: false
      }
    }
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
    }).catch(e => {
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
          }).catch(() => {
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
      networkState.defaultAccount = accounts[0];
      Blockchain.setDefaultAccount(networkState.defaultAccount);
      this.setState({network: networkState}, () => {
        if (oldDefaultAccount !== networkState.defaultAccount) {
          this.initContracts();
        }
      });
    }).catch(() => {});
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
      window.proxyRegistryObj = Blockchain.loadObject('proxyregistry', addrs.proxyRegistry, 'proxyRegistry');

      const setUpPromises = [Blockchain.getProxyAddress(this.state.network.defaultAccount)];
      Promise.all(setUpPromises).then(r => {
        console.log('proxy', r[0]);
        this.setState((prevState, props) => {
          return {proxy: r[0]};
        }, () => {
          this.setUpToken('weth');
          this.setUpToken('mkr');
          this.setUpToken('dai');
        });
      });
    });
  }

  setProxyAddress = () => {
    Blockchain.getProxyAddress(this.state.network.defaultAccount).then(proxy => {
      console.log('proxy', proxy);
      this.setState((prevState, props) => {
        return {proxy};
      });
    }).catch(() => {});
  }

  saveBalance = token => {
    if (token === 'weth') {
      Blockchain.getEthBalanceOf(this.state.network.defaultAccount).then(r => {
        this.setState((prevState) => {
          const balances = {...prevState.balances};
          balances.eth = r;
          return {balances};
        });
      }).catch(() => {});
    } else {
      Blockchain.getTokenBalanceOf(token, this.state.network.defaultAccount).then(r => {
        this.setState((prevState) => {
          const balances = {...prevState.balances};
          balances[token] = r;
          return {balances};
        });
      }).catch(() => {});
    }
  }

  setUpToken = token => {
    window[`${token}Obj`] = Blockchain.loadObject(token === 'weth' ? 'dsethtoken' : 'dstoken', settings.chain[this.state.network.network].tokens[token].address, token);
    setInterval(() => {
      this.saveBalance(token);
    }, 5000);
    this.saveBalance(token);
    this.setFilterToken(token);
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
      if (Blockchain[`${token}Obj`][filters[i]]) {
        Blockchain[`${token}Obj`][filters[i]](conditions, {}, (e, r) => {
          if (!e) {
            //this.logTransactionConfirmed(r.transactionHash);
          }
        });
      }
    }
  }
  //

  reset = () => {
    this.setState({...this.getInitialState()});
  }
  
  getCallDataAndValue = (operation, from, to, amount, limit) => {
    const result = {};
    const otcBytes32 = addressToBytes32(settings.chain[this.state.network.network].otc, false);
    const fromAddrBytes32 = addressToBytes32(settings.chain[this.state.network.network].tokens[from.replace('eth', 'weth')].address, false);
    const toAddrBytes32 = addressToBytes32(settings.chain[this.state.network.network].tokens[to.replace('eth', 'weth')].address, false);
    if (operation === 'sellAll') {
      if (from === "eth") {
        result.calldata = `${methodSig('sellAllAmountPayEth(address,address,address,uint256)')}` +
          `${otcBytes32}${fromAddrBytes32}${toAddrBytes32}${toBytes32(limit, false)}`;
        result.value = toWei(amount);
      } else if (to === "eth") {
        result.calldata = `${methodSig('sellAllAmountBuyEth(address,address,uint256,address,uint256)')}` +
          `${otcBytes32}${fromAddrBytes32}${toBytes32(toWei(amount), false)}${toAddrBytes32}${toBytes32(limit, false)}`;
      } else {
        result.calldata = `${methodSig('sellAllAmount(address,address,uint256,address,uint256)')}` +
          `${otcBytes32}${fromAddrBytes32}${toBytes32(toWei(amount), false)}${toAddrBytes32}${toBytes32(limit, false)}`;
      }
    } else {
      if (from === "eth") {
        result.calldata = `${methodSig('buyAllAmountPayEth(address,address,uint256,address)')}` +
          `${otcBytes32}${toAddrBytes32}${toBytes32(toWei(amount), false)}${fromAddrBytes32}`;
        result.value = limit;
      } else if (to === "eth") {
        result.calldata = `${methodSig('buyAllAmountBuyEth(address,address,uint256,address,uint256)')}` +
          `${otcBytes32}${toAddrBytes32}${toBytes32(toWei(amount), false)}${fromAddrBytes32}${toBytes32(limit, false)}`;
      } else {
        result.calldata = `${methodSig('buyAllAmount(address,address,uint256,address,uint256)')}` +
          `${otcBytes32}${toAddrBytes32}${toBytes32(toWei(amount), false)}${fromAddrBytes32}${toBytes32(limit, false)}`;
      }
    }
    return result;
  }

  getActionCreateAndExecute = (operation, from, to, amount, limit) => {
    const addrFrom = settings.chain[this.state.network.network].tokens[this.state.trade.from.replace('eth', 'weth')].address;
    const addrTo = settings.chain[this.state.network.network].tokens[this.state.trade.to.replace('eth', 'weth')].address;
    const result = {};
    if (operation === 'sellAll') {
      if (from === "eth") {
        result.method = 'createAndSellAllAmountPayEth';
        result.params = [settings.chain[this.state.network.network].proxyRegistry, settings.chain[this.state.network.network].otc, addrTo, limit];
        result.value = toWei(amount);
      } else if (to === "eth") {
        result.method = 'createAndSellAllAmountBuyEth';
        result.params = [settings.chain[this.state.network.network].proxyRegistry, settings.chain[this.state.network.network].otc, addrFrom, toWei(amount), limit];
      } else {
        result.method = 'createAndSellAllAmount';
        result.params = [settings.chain[this.state.network.network].proxyRegistry, settings.chain[this.state.network.network].otc, addrFrom, toWei(amount), addrTo, limit];
      }
    } else {
      if (from === "eth") {
        result.method = 'createAndBuyAllAmountPayEth';
        result.params = [settings.chain[this.state.network.network].proxyRegistry, settings.chain[this.state.network.network].otc, addrTo, toWei(amount)];
        result.value = limit;
      } else if (to === "eth") {
        result.method = 'createAndBuyAllAmountBuyEth';
        result.params = [settings.chain[this.state.network.network].proxyRegistry, settings.chain[this.state.network.network].otc, toWei(amount), addrFrom, limit];
      } else {
        result.method = 'createAndBuyAllAmount';
        result.params = [settings.chain[this.state.network.network].proxyRegistry, settings.chain[this.state.network.network].otc, addrTo, toWei(amount), addrFrom, limit];
      }
    }
    return result;
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
      }).catch(e => {
        clearTimeout(timeout);
        reject(e);
      });
    })
  }

  getGasPrice = () => {
    return new Promise((resolve, reject) => {
      this.getGasPriceFromETHGasStation()
        .then(estimation => resolve(estimation))
        .catch(_ => {
          Blockchain.getGasPrice()
            .then(estimation => resolve(estimation))
            .catch(error => reject(error));
        });
    });
  };

  fasterGasPrice = increaseInGwei => {
    return this.getGasPrice().then(price => {
      return toBigNumber(price).add(toBigNumber(toWei(increaseInGwei, "gwei")));
    })
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

      return {ui, network};
    });
  }

  copyObject = (data, newData) => {
    if (newData !== null) {
      if (typeof data === 'object' && typeof newData === 'object') {
        Object.keys(newData).forEach(key => {
          data[key] = this.copyObject(data[key], newData[key]);
        });
      } else {
        data = newData;
      }
    }
    return data;
  }

  setMainState = newData => {
    return new Promise(resolve => {
      this.setState(prevState => {
        const copiedState = {};
        Object.keys(newData).forEach(key => {
          copiedState[key] = {...prevState[key]};
          if (copiedState[key] === null) {
            copiedState[key] = newData[key];
          } else {
            copiedState[key] = this.copyObject(copiedState[key], newData[key]);
          }
        });
        return copiedState;
      }, () => {
        resolve(true);
      });
    });
  }

  renderMain = () => {
    return (
      <div>
        {
          this.state.trade.step === 1
            ?
            <SetTrade network={this.state.network.network}
                      defaultAccount={this.state.network.defaultAccount}
                      proxy={this.state.proxy}
                      setMainState={this.setMainState}
                      saveCost={this.saveCost}
                      getCallDataAndValue={this.getCallDataAndValue}
                      getActionCreateAndExecute={this.getActionCreateAndExecute}
                      calculateBuyAmount={this.calculateBuyAmount}
                      calculatePayAmount={this.calculatePayAmount}
                      doTrade={this.doTrade}
                      trade={this.state.trade}
                      balances={this.state.balances}/>
            :
            <DoTrade network={this.state.network.network}
                     defaultAccount={this.state.network.defaultAccount}
                     proxy={this.state.proxy}
                     trade={this.state.trade}
                     transactions={this.state.transactions}
                     setMainState={this.setMainState}
                     getCallDataAndValue={this.getCallDataAndValue}
                     getActionCreateAndExecute={this.getActionCreateAndExecute}
                     fasterGasPrice={this.fasterGasPrice}
                     reset={this.reset}
                     showTxMessage={this.state.showTxMessage}/>
        }
      </div>
    )
  }

  render = () => {
    return (
      <section>
        <section>
          <header className="Container">
            <div className={`Logo Logo--no-margin`}>
              <a href="/"> <Logo/> </a>
            </div>
            <div className={'NavigationLinks'}>
              <a href="/#" style={{color: 'white'}}>Exchange</a>
              <a href="/#tax-exporter" style={{color: 'white'}}>Export Trades</a>
            </div>
            {
              false &&
              <div onBlur={this.contractDropdownList} className="Dropdown" tabIndex={-1} title="Select an account">
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
        {
          this.state.section === 'faq'
            ? <FAQ/>
            : <section className="Content">
              <main className="Container">
                <div>
                  <div className="MainHeading">
                    <h1>THE FIRST DECENTRALIZED INSTANT EXCHANGE</h1>
                  </div>
                  <div className="SecondaryHeading">
                    <h2>No Registration. No Fees.</h2>
                  </div>
                </div>
                <div className="Widget">
                  {
                    this.state.network.isConnected
                      ?
                      this.state.network.defaultAccount && isAddress(this.state.network.defaultAccount)
                        ?
                        <div>
                          {
                            this.state.section === 'tax-exporter'
                              ?
                              <TaxExporter account={this.state.network.defaultAccount} network={this.state.network.network} getProxy={this.getProxy}/>
                              :
                              this.renderMain()
                          }
                        </div>
                        :
                        <NoAccount/>
                      :
                      <NoConnection/>
                  }
                </div>
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
