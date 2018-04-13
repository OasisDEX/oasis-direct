import React, {Component} from 'react';
import * as Blockchain from "../blockchainHandler";
import {Ether, MKR, DAI, Arrow, Attention, QuestionMark, Finalized, Done, Failed} from './Icons';
import Spinner from './Spinner';
import TokenAmount from './TokenAmount'
import {etherscanUrl, wdiv, toBigNumber, toWei, addressToBytes32} from '../helpers';

const settings = require('../settings');

const tokens = {
  'eth': {
    icon: <Ether/>,
    symbol: "ETH",
    name: "Ether"
  },
  'mkr': {
    icon: <MKR/>,
    symbol: "MKR",
    name: "Maker"
  },
  'dai': {
    icon: <DAI/>,
    symbol: "DAI",
    name: "DAI",
  },
}

class DoTrade extends Component {

  constructor(props) {
    super(props);
    // This is necessary to finish transactions that failed after signing
    this.setPendingTxInterval();

    this.txInterval = {};
  }

  componentDidMount = () => {
    this.doTrade();
  }

  token = (key) => {
    const tokens = {
      'eth': 'Ether',
      'mkr': 'Maker',
      'dai': 'Dai'
    };
    return tokens[key];
  }

  hasTxCompleted = type => {
    return this.props.transactions[type]
      && this.props.transactions[type].tx
      && !this.props.transactions[type].pending
      && !this.props.transactions[type].error
      && (type !== 'trade' || this.props.transactions.trade.amountBuy.gt(0) || this.props.transactions.trade.amountSell.gt(0));
  }

  showTradeAgainButton = () => {
    return (typeof this.props.transactions.approval !== 'undefined' &&
      (this.props.transactions.approval.error || this.props.transactions.approval.rejected)) ||
      (typeof this.props.transactions.trade !== 'undefined' &&
      !this.props.transactions.trade.requested &&
      (this.hasTxCompleted('trade')
      || this.props.transactions.trade.error
      || this.props.transactions.trade.rejected));
  }

  hasTwoTransactions = () => {
    return this.props.trade.txs === 2;
  }

  setPendingTxInterval = () => {
    this.pendingTxInterval = setInterval(() => {
      this.checkPendingTransactions()
    }, 5000);
  }

  getLogsByAddressFromEtherscan = (address, fromBlock, filter = {}) => {
    let filterString = '';
    if (Object.keys(filter).length > 0) {
      Object.keys(filter).map(key => {
        filterString += `&${key}=${filter[key]}`;
        return false;
      });
    }
    return new Promise((resolve, reject) => {
      const url = `https://api${this.props.network !== 'main' ? `-${this.props.network}` : ''}.etherscan.io/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=latest&address=${address}${filterString}&apikey=${settings.etherscanApiKey}`
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
      const url = `https://api${this.props.network !== 'main' ? `-${this.props.network}` : ''}.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${fromBlock}&sort=desc&apikey=${settings.etherscanApiKey}`
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
    const transactions = {...this.props.transactions};
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
              settings.chain[this.props.network].tokens[this.props.trade.from.replace('eth', 'weth')].address
            ).then(r => {
              r.forEach(v => {
                Blockchain.getTransaction(v.transactionHash).then(r2 => {
                  if (r2.from === this.props.account &&
                    r2.nonce === transactions[type].nonce) {
                    this.saveReplacedTransaction(type, v.transactionHash);
                  }
                }, () => {})
              });
            }, () => {});
            // Using Etherscan API (backup)
            this.getTransactionsByAddressFromEtherscan(this.props.account, transactions[type].checkFromBlock).then(r => {
              if (parseInt(r.status, 10) === 1 && r.result.length > 0) {
                r.result.forEach(v => {
                  if (parseInt(v.nonce, 10) === parseInt(transactions[type].nonce, 10)) {
                    this.saveReplacedTransaction(type, v.hash);
                  }
                });
              }
            });
          }
        }, () => {});
      } else {
        if (typeof transactions[type] !== 'undefined' && typeof transactions[type].amountSell !== 'undefined' && transactions[type].amountSell.eq(-1)) {
          // Using Logs
          Blockchain.setFilter(
            transactions[type].checkFromBlock,
            settings.chain[this.props.network].tokens[this.props.trade.from.replace('eth', 'weth')].address
          ).then(logs => this.saveTradedValue('sell', logs), () => {});
          // Using Etherscan API (backup)
          this.getLogsByAddressFromEtherscan(settings.chain[this.props.network].tokens[this.props.trade.from.replace('eth', 'weth')].address,
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
            settings.chain[this.props.network].tokens[this.props.trade.to.replace('eth', 'weth')].address
          ).then(logs => this.saveTradedValue('buy', logs), () => {});
          // Using Etherscan API (backup)
          this.getLogsByAddressFromEtherscan(settings.chain[this.props.network].tokens[this.props.trade.to.replace('eth', 'weth')].address,
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
    if (this.props.transactions[type].tx !== newTx) {
      console.log(`Transaction ${this.props.transactions[type].tx} was replaced by ${newTx}.`);
    }
    const transactions = {};
    transactions[type].tx = newTx;
    this.props.setMainState({transactions}).then(() => {
      this.checkPendingTransactions();
    });
  }

  saveTradedValue = (operation, logs) => {
    let value = toBigNumber(0);
    logs.forEach(log => {
      if (log.transactionHash === this.props.transactions.trade.tx) {
        if (this.props.trade[operation === 'buy' ? 'to' : 'from'] !== 'eth' &&
          log.topics[operation === 'buy' ? 2 : 1] === addressToBytes32(this.props.account) &&
          log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
          // No ETH, src or dst is user's address and Transfer Event
          value = value.add(toBigNumber(log.data));
        } else if (this.props.trade[operation === 'buy' ? 'to' : 'from'] === 'eth') {
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
      const transactions = {trade:{}};
      transactions.trade[operation === 'buy' ? 'amountBuy' : 'amountSell'] = value;
      this.props.setMainState({transactions});
    }
  }

  logRequestTransaction = type => {
    return new Promise(resolve => {
      const transactions = {};
      transactions[type] = {requested: true}
      this.props.setMainState({transactions}).then(() => resolve());
    });
  }

  logPendingTransaction = async (tx, type, callbacks = []) => {
    this.txInterval[tx] = setTimeout(() => {
      this.props.setMainState({showTxMessage: true});
    }, 60000);
    const nonce = await Blockchain.getTransactionCount(this.props.account);
    const checkFromBlock = (await Blockchain.getBlock('latest')).number;
    console.log('nonce', nonce);
    console.log('checkFromBlock', checkFromBlock);
    const msgTemp = 'Transaction TX was created. Waiting for confirmation...';
    const transactions = {...this.props.transactions};
    transactions[type] = {tx, pending: true, error: false, nonce, checkFromBlock, callbacks, requested: false}
    if (type === 'trade') {
      transactions[type].amountSell = toBigNumber(-1);
      transactions[type].amountBuy = toBigNumber(-1);
    }
    this.props.setMainState({transactions});

    console.log(msgTemp.replace('TX', tx));
  }

  logTransactionConfirmed = (tx, gasUsed) => {
    const msgTemp = 'Transaction TX was confirmed.';
    const transactions = {...this.props.transactions};

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
      transactions[type].gasUsed = parseInt(gasUsed, 10);
      this.props.setMainState({transactions}).then(() => {
        console.log(msgTemp.replace('TX', tx));
        Blockchain.getTransaction(tx).then(r => {
          if (r) {
            const updateTx = {};
            updateTx[type] = {}; 
            updateTx[type].gasPrice = r.gasPrice;
            this.props.setMainState({transactions: updateTx, showTxMessage: false}).then(() => {
              clearInterval(this.txInterval[tx]);
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
    const transactions = {...this.props.transactions};
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
      this.props.setMainState({transactions, showTxMessage: false});
    }
  }

  logTransactionRejected = type => {
    const transactions = {...this.props.transactions};
    transactions[type] = {rejected: true, requested: null}
    console.log(transactions)
    this.props.setMainState({transactions});
  }

  returnToSetTrade = () => {
    const trade = {
      step: 1,
      txs: null
    };
    const transactions = {approval: null, trade: null}; // TODO: CHECK HOW TO DELETE in a BETTER WAY
    this.props.setMainState({trade, transactions});
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

  setProxyAddress = () => {
    Blockchain.getProxyAddress(this.props.account).then(proxy => {
      console.log('proxy', proxy);
      this.props.setMainState({proxy});
    }, () => {});
  }

  checkAllowance = (token, dst, value, callbacks) => {
    if (token === 'eth') {
      const trade = {
        step: 2,
        txs: 1
      };
      this.props.setMainState({trade}).then(() => {
        setTimeout(() => {
          callbacks.forEach(callback => this.executeCallback(callback));
        }, 2000);
      });
    } else {
      const valueObj = toBigNumber(toWei(value));

      Blockchain.getTokenAllowance(token, this.props.account, dst).then(r => {
        if (r.gte(valueObj)) {
          const trade = {
            step: 2,
            txs: 1
          };
          this.props.setMainState({trade}).then(() => {
            setTimeout(() => {
              callbacks.forEach(callback => this.executeCallback(callback));
            }, 2000);
          });
        } else {
          const trade = {
            step: 2,
            txs: 2
          };
          this.props.setMainState({trade}).then(() => {
            setTimeout(() => {
              this.props.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
                this.logRequestTransaction('approval')
                  .then(() => {
                    Blockchain.tokenApprove(token, dst, gasPrice).then(tx => {
                      this.logPendingTransaction(tx, 'approval', callbacks);
                    }, () => this.logTransactionRejected('approval'));
                  }, e => {
                    console.debug("Couldn't calculate gas price because of", e);
                  });
              });
            }, 2000);
          });
        }
      }, () => {});
    }
  }

  executeProxyTx = (amount, limit) => {
    const params = Blockchain.getCallDataAndValue(this.props.network, this.props.trade.operation, this.props.trade.from, this.props.trade.to, amount, limit);
    this.logRequestTransaction('trade').then(() => {
      this.props.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {

        Blockchain.proxyExecute(this.props.proxy, settings.chain[this.props.network].proxyContracts.oasisDirect, params.calldata, gasPrice, params.value).then(tx => {
          this.logPendingTransaction(tx, 'trade');
        }, e => {
          console.log(e);
          this.logTransactionRejected('trade');
        });
      }, () => {});
    }, () => {});
  }

  executeProxyCreateAndExecute = (amount, limit) => {
    const action = Blockchain.getActionCreateAndExecute(this.props.network, this.props.trade.operation, this.props.trade.from, this.props.trade.to, amount, limit);
    this.props.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
      this.logRequestTransaction('trade').then(() => {
        Blockchain.proxyCreateAndExecute(settings.chain[this.props.network].proxyCreationAndExecute, action.method, action.params, action.value, gasPrice).then(tx => {
          this.logPendingTransaction(tx, 'trade', [['setProxyAddress']]);
        }, e => {
          console.log(e);
          this.logTransactionRejected('trade');
        });
      }, () => {});
    }, e => console.debug("Couldn't calculate gas price because of:", e));
  }

  doTrade = () => {
    const amount = this.props.trade[this.props.trade.operation === 'sellAll' ? 'amountPay' : 'amountBuy'];
    const threshold = settings.chain[this.props.network].threshold[[this.props.trade.from, this.props.trade.to].sort((a, b) => a > b).join('')] * 0.01;
    const limit = toWei(this.props.trade.operation === 'sellAll' ? this.props.trade.amountBuy.times(1 - threshold) : this.props.trade.amountPay.times(1 + threshold)).round(0);
    if (this.props.proxy) {
      this.checkAllowance(this.props.trade.from,
        this.props.proxy,
        this.props.trade.operation === 'sellAll' ? this.props.trade.amountPay : this.props.trade.amountPay.times(1.05).round(0),
        [['executeProxyTx', amount, limit]]);
    } else {
      // No Proxy created, we need to use the support contract
      this.checkAllowance(this.props.trade.from,
        settings.chain[this.props.network].proxyCreationAndExecute,
        this.props.trade.operation === 'sellAll' ? this.props.trade.amountPay : this.props.trade.amountPay.times(1.05).round(0),
        [['executeProxyCreateAndExecute', amount, limit]]);
    }
  }

  render() {
    const metamask = Blockchain.isMetamask();
    return (
      <section className={`frame ${this.props.trade.step === 2 ? 'finalize' : ''}`}>
        <div className="heading">
          <h2>Finalize Trade</h2>
        </div>
        <div className="info-box">
          <div className="info-box-row">
            <span className="holder">
              <span className="label">
              Current Estimated Price
              </span>
              <TokenAmount number={toWei(this.props.trade.amountPay.div(this.props.trade.amountBuy))}
                           token={`${tokens[this.props.trade.from].symbol}/${tokens[this.props.trade.to].symbol}`}/>
            </span>
          </div>
        </div>
        <div className="content">
          {
            this.hasTwoTransactions() &&
            <a
              href={typeof this.props.transactions.approval !== 'undefined' && this.props.transactions.approval.tx ? `${etherscanUrl(this.props.network)}/tx/${this.props.transactions.approval.tx}` : '#'}
              onClick={(e) => {
                if (typeof this.props.transactions.approval === 'undefined' || !this.props.transactions.approval.tx) {
                  e.preventDefault();
                  return false;
                }
              }}
              className={typeof this.props.transactions.approval === 'undefined' || !this.props.transactions.approval.tx ? 'no-pointer' : ''}
              target="_blank" rel="noopener noreferrer">
              <div className={`transaction-info-box half ${this.hasTxCompleted('approval') ? 'success' : ''}`}>
              <span className={`done-placeholder ${this.hasTxCompleted('approval') ? 'show' : ''}`}>
                <span className="done">
                  <Done/>
                </span>
              </span>
                <div className="operation">
                  <span className="icon">{tokens[this.props.trade.from].icon}</span>
                  <div className="details">
                    <span className="label"> Enable</span>
                    <span className="value"> Trading of {tokens[this.props.trade.from].symbol}</span>
                  </div>
                </div>
                {
                  typeof this.props.transactions.approval === 'undefined'
                  ?
                    <div className="status"><Spinner/><span className="label">Initiating transaction...</span></div>
                  :
                    this.props.transactions.approval.rejected
                    ?
                      <div className="status"><span className="label error">Rejected</span></div>
                    :
                      this.props.transactions.approval.requested
                      ?
                        <div className="status"><Spinner/><span className="label info">Signing transaction</span></div>
                      :
                        this.props.transactions.approval.pending
                        ?
                          <div className="status"><Spinner/><span className="label info">View on Etherscan</span></div>
                        :
                          this.props.transactions.approval.error
                          ?
                            <div className="status"><span className="label error">Failed</span></div>
                          :
                            <div className="status"><span className="label info">Confirmed</span></div>
                }
              </div>
            </a>
          }
          {
            this.hasTwoTransactions() &&
            <div className="arrow-separator">
             <Arrow/>
            </div>
          }
            <div className={`transaction-info-box ${this.hasTwoTransactions() ? 'half' : ''} ${this.hasTxCompleted('trade') ? 'success' : ''}`}>

              <a
                href={typeof this.props.transactions.trade !== 'undefined' && this.props.transactions.trade.tx ? `${etherscanUrl(this.props.network)}/tx/${this.props.transactions.trade.tx}` : '#'}
                onClick={(e) => {
                  if (typeof this.props.transactions.trade === 'undefined' || !this.props.transactions.trade.tx) {
                    e.preventDefault();
                    return false;
                  }
                }}
                className={typeof this.props.transactions.trade === 'undefined' || !this.props.transactions.trade.tx ? 'no-pointer' : ''}
                target="_blank" rel="noopener noreferrer">

            <span className={`done-placeholder ${this.hasTxCompleted('trade') ? 'show' : ''}`}>
              <span className="done">
                <Done/>
              </span>
            </span>
              <div>
                <div className="operation">
                  <span className="icon">{tokens[this.props.trade.from].icon}</span>
                  <div className="details">
                    <span className="label">Selling</span>
                    <span
                      className="value">{this.props.trade.operation === 'sellAll' ? '' : '~ '}<TokenAmount number={toWei((this.props.trade.amountPay.valueOf()))} token={tokens[this.props.trade.from].symbol}/></span>
                  </div>
                </div>
                <div className="operation">
                  <span className="icon">{tokens[this.props.trade.to].icon}</span>
                  <div className="details">
                    <span className="label">Buying</span>
                    <span className="value">{this.props.trade.operation === 'buyAll' ? '' : '~ '}
                      <TokenAmount number={toWei((this.props.trade.amountBuy.valueOf()))} token={tokens[this.props.trade.to].symbol}/>
                    </span>
                  </div>
                </div>
              </div>
              {
                typeof this.props.transactions.trade === 'undefined'
                ?
                  this.props.trade.txs === 1
                  ?
                    <div className="status"><Spinner/><span className="label">Initiating transaction</span></div>
                  :
                    <div className="status"><Spinner/><span className="label">Waiting for approval</span></div>
                :
                  this.props.transactions.trade.rejected
                  ?
                    <div className="status"><span className="label error">Rejected</span></div>
                  :
                    this.props.transactions.trade.requested
                    ?
                      <div className="status"><Spinner/><span className="label">Signing transaction</span></div>
                    :
                      this.props.transactions.trade.pending
                      ?
                        <div className="status"><Spinner/><span className="label info">View on Etherscan</span></div>
                      :
                        this.props.transactions.trade.error
                        ?
                          <div className="status"><span className="label error">Failed</span></div>
                        :
                          this.props.transactions.trade.amountBuy.eq(-1) || this.props.transactions.trade.amountSell.eq(-1)
                          ?
                            <div className="status"><Spinner/><span className="label info">Confirmed. <br/> Loading data...</span></div>
                          :
                            <div className="status"><span className="label info">Completed</span></div>
              }
              </a>
            </div>
        </div>
        {
          !this.hasTxCompleted('trade')
            ? this.props.transactions.trade && this.props.transactions.trade.error
            ? <div className="transaction-result">
              <h3 className="heading">
                <span className="icon">
                  <Failed/>
                </span>
                <span>Failed to execute trade</span>
              </h3>
              <div className="content">
                <span>
                  <span className="label">Perhaps the market has moved, so your order could not be filled within the</span>
                  <span className="value">
                    { settings.chain[this.props.network].threshold[[this.props.trade.from, this.props.trade.to].sort((a, b) => a > b).join('')] }% impact limit
                  </span>
                </span>
              </div>
            </div>
              :
                <div className={`info-box more-info  ${this.props.trade.txs === 1 ? 'single-tx' : 'double-tx'}`} style={{marginTop: 'auto'}}>
                  <div className="info-box-row info-box-row--no-borders info-box-row--left">
                    <span className="icon">
                      <Attention/>
                    </span>
                    {
                      !this.props.showTxMessage &&
                      <span className="label">
                        Each trading pair requires a one-time transaction per Ethereum address to be enabled for trading.
                      </span>
                    }
                    {
                      this.props.showTxMessage && metamask &&
                      <span className="label">
                        If your transaction doesn't confirm, click on MetaMask and <strong>try the "Retry with a higher gas price here" button</strong>
                      </span>
                    }
                    {
                      this.props.showTxMessage && !metamask &&
                      <span className="label">
                        If your transaction doesn't confirm, please <strong>resubmit it with a higher gas price in your wallet</strong>
                      </span>
                    }
                  </div>
                  {
                    !this.props.showTxMessage &&
                    <div className="info-box-row info-box-row--left">
                      <span className="icon" style={{'height': '18px'}}>
                        <QuestionMark/>
                      </span>
                        <span className="label">
                        Need help? Contact us on <a href="http://chat.makerdao.com" target="_blank" rel="noopener noreferrer">chat.makerdao.com</a>
                      </span>
                    </div>
                  }
                </div>
            :
              <div className="transaction-result">
                <h3 className="heading">
                  <span className="icon">
                    <Finalized/>
                  </span>
                  <span>Congratulations!</span>
                </h3>
                <div className="content">
                  <span className="label">
                    You successfully bought&nbsp;
                    <TokenAmount number={this.props.transactions.trade.amountBuy} decimal={5}
                                 token={this.props.trade.to.toUpperCase()}/> with <TokenAmount number={this.props.transactions.trade.amountSell}
                                 decimal={5}  token={this.props.trade.from.toUpperCase()}/> at <TokenAmount number={wdiv(this.props.transactions.trade.amountSell, this.props.transactions.trade.amountBuy)}
                                 decimal={5}  token= {`${this.props.trade.from.toUpperCase()}/${this.props.trade.to.toUpperCase()}`}/> by paying <span className="value">
                    {
                      (typeof this.props.transactions.approval !== 'undefined' && typeof this.props.transactions.approval.gasPrice === 'undefined') || typeof this.props.transactions.trade.gasPrice === 'undefined'
                        ? <span><Spinner/></span>
                        : <TokenAmount number={(typeof this.props.transactions.approval !== 'undefined'
                        ? this.props.transactions.approval.gasPrice.times(this.props.transactions.approval.gasUsed)
                        : toBigNumber(0)).add(this.props.transactions.trade.gasPrice.times(this.props.transactions.trade.gasUsed))} token={'ETH'}/>
                    }&nbsp;
                  </span>
                    gas cost
                  </span>
              </div>
          </div>
        }
        <button type="submit" value="Trade again"
                onClick={this.props.reset}
                disabled={!this.showTradeAgainButton()}>
          TRADE AGAIN
        </button>
      </section>

    )
  }
}

export default DoTrade;
