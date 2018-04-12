import React, {Component} from 'react';
import * as Blockchain from "../blockchainHandler";
import {Ether, MKR, DAI, SwapArrows, Attention} from './Icons';
import Spinner from './Spinner';
import TokenAmount from './TokenAmount';
import {toWei, fromWei, toBigNumber} from '../helpers'

const settings = require('../settings');

//TODO: make this bound to the token selector.
const tokens = {
  eth: {
    icon: <Ether/>,
    symbol: "ETH",
    name: "Ether",
  },
  mkr: {
    icon: <MKR/>,
    symbol: "MKR",
    name: "Maker"
  },
  dai : {
    icon: <DAI/>,
    symbol: "DAI",
    name: "DAI",
  },
}

class SetTrade extends Component {
  constructor(props) {
    super(props);
    this.state = {
      from: this.props.trade.from,
      to: this.props.trade.to,
      selectedToken: null,
      shouldDisplayTokenSelector: false,
      hasAcceptedTerms: false,
    }
  }

  calculateCost = (to, data, value = 0, from) => {
    return new Promise((resolve, reject) => {
      console.log("Calculating cost...");
      Promise.all([Blockchain.estimateGas(to, data, value, from), this.props.fasterGasPrice(settings.gasPriceIncreaseInGwei)]).then(r => {
        console.log(to, data, value, from);
        console.log(r[0], r[1].valueOf());
        resolve(r[1].times(r[0]));
      }, e => {
        reject(e);
      });
    });
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
      const trade = {
        txCost: fromWei(total)
      };
      this.props.setMainState({trade});
    })
  }

  calculateBuyAmount = () => {
    const from = this.state.from;
    const to = this.state.to;
    const amount = this.amountPay.value;

    let trade = {
      from,
      to,
      amountBuy: toBigNumber(0),
      amountPay: toBigNumber(amount),
      amountBuyInput: '',
      amountPayInput: amount,
      operation: 'sellAll',
      txCost: toBigNumber(0),
      errorInputSell: null,
      errorInputBuy: null,
      errorOrders: null
    };

    this.props.setMainState({trade}).then(() => {
      if (toBigNumber(amount).eq(0)) {
        trade = {
          amountBuy: fromWei(toBigNumber(0)),
          amountBuyInput: ''
        };
        this.props.setMainState({trade});
        return;
      }
      const minValue = settings.chain[this.props.network].tokens[from.replace('eth', 'weth')].minValue;
      if (this.props.trade.amountPay.lt(minValue)) {
        trade = {
          errorInputSell: `minValue:${minValue}`
        };
        this.props.setMainState({trade});
        return;
      }
      Blockchain.loadObject('matchingmarket', settings.chain[this.props.network].otc).getBuyAmount(
        settings.chain[this.props.network].tokens[to.replace('eth', 'weth')].address,
        settings.chain[this.props.network].tokens[from.replace('eth', 'weth')].address,
        toWei(amount),
        (e, r) => {
          if (!e) {
            /*
            * Even thought the user entered how much he wants to pay
            * we still must calculate if what he will receive is higher than
            * the min value for the receive token.
            *
            * If the amount of the calculated buying value is under the min value
            * an error message is displayed for violating min value.
            *
            * */
            const calculatedReceiveValue = fromWei(toBigNumber(r));
            const calculatedReceiveValueMin = settings.chain[this.props.network].tokens[to.replace('eth', 'weth')].minValue;
  
            if(calculatedReceiveValue.lt(calculatedReceiveValueMin) && calculatedReceiveValue.gt(0)) {
              trade = {
                amountBuyInput: calculatedReceiveValue.valueOf(),
                errorInputBuy: `minValue:${calculatedReceiveValueMin.valueOf()}`
              };
              this.props.setMainState({trade});
              return;
            }

            trade = {
              amountBuy: calculatedReceiveValue,
              amountBuyInput: calculatedReceiveValue.valueOf()
            };
            this.props.setMainState({trade}).then(async () => {
              const balance = from === 'eth' ? await Blockchain.getEthBalanceOf(this.props.account) : await Blockchain.getTokenBalanceOf(from, this.props.account);
              const errorInputSell = balance.lt(toWei(amount))
                ?
                // `Not enough balance to sell ${amount} ${from.toUpperCase()}`
                'funds'
                :
                '';
              const errorOrders = this.props.trade.amountBuy.eq(0)
                ?
                {
                  type: "sell",
                  amount,
                  token: from.toUpperCase()
                }
                :
                null;
              if (errorInputSell || errorOrders) {
                trade = {
                  errorInputSell,
                  errorOrders
                };
                this.props.setMainState({trade});
                return;
              }
  
              let hasAllowance = false;
              let action = null;
              let data = null;
              let target = null;
              let addrFrom = null;
              const txs = [];
              if (this.props.proxy) {
                // Calculate cost of proxy execute
                hasAllowance = (from === 'eth' ||
                  await Blockchain.getTokenTrusted(from, this.props.account, this.props.proxy) ||
                  (await Blockchain.getTokenAllowance(from, this.props.account, this.props.proxy)).gt(toWei(amount)));
                addrFrom = hasAllowance ? this.props.account : settings.chain[this.props.network].addrEstimation;
                target = hasAllowance ? this.props.proxy : settings.chain[this.props.network].proxyEstimation;
                action = Blockchain.getCallDataAndValue(this.props.network, 'sellAll', from, to, amount, 0);
                data = Blockchain.loadObject('dsproxy', target).execute['address,bytes'].getData(
                  settings.chain[this.props.network].proxyContracts.oasisDirect,
                  action.calldata
                );
              } else {
                // Calculate cost of proxy creation and execution
                target = settings.chain[this.props.network].proxyCreationAndExecute;
                hasAllowance = (from === 'eth' ||
                  await Blockchain.getTokenTrusted(from, this.props.account, target) ||
                  (await Blockchain.getTokenAllowance(from, this.props.account, target)).gt(toWei(amount)));
                addrFrom = hasAllowance ? this.props.account : settings.chain[this.props.network].addrEstimation;
                action = Blockchain.getActionCreateAndExecute(this.props.network, 'sellAll', from, to, amount, 0);
                data = Blockchain.loadObject('proxycreateandexecute', target)[action.method].getData(...action.params);
              }
              if (!hasAllowance) {
                const dataAllowance = Blockchain[`${this.props.trade.from.replace('eth', 'weth')}Obj`].approve.getData(
                  this.props.proxy ? this.props.proxy : settings.chain[this.props.network].proxyCreationAndExecute,
                  -1
                );
                txs.push({
                  to: Blockchain[`${this.props.trade.from.replace('eth', 'weth')}Obj`].address,
                  data: dataAllowance,
                  value: 0,
                  from: this.props.account
                });
              }
              txs.push({to: target, data, value: action.value, from: addrFrom});
              this.saveCost(txs);
            });
          } else {
            console.log(e);
          }
        });
    });
  }
  
  calculatePayAmount = () => {
    const from = this.state.from;
    const to = this.state.to;
    const amount = this.amountBuy.value;

    let trade = {
      from: from,
      to: to,
      amountBuy: toBigNumber(amount),
      amountPay: toBigNumber(0),
      amountBuyInput: amount,
      amountPayInput: '',
      operation: 'buyAll',
      txCost: toBigNumber(0),
      errorInputSell: null,
      errorInputBuy: null,
      errorOrders: null
    };
    this.props.setMainState({trade}).then(() => {
      if (toBigNumber(amount).eq(0)) {
        trade = {
          amountPay: fromWei(toBigNumber(0)),
          amountPayInput: ''
        };
        this.props.setMainState({trade});
        return;
      }
      const minValue = settings.chain[this.props.network].tokens[to.replace('eth', 'weth')].minValue;
      if (this.props.trade.amountBuy.lt(minValue)) {
        trade = {
          errorInputBuy: `minValue:${minValue}`
        };
        this.props.setMainState({trade});
        return;
      }
      Blockchain.loadObject('matchingmarket', settings.chain[this.props.network].otc).getPayAmount(
        settings.chain[this.props.network].tokens[from.replace('eth', 'weth')].address,
        settings.chain[this.props.network].tokens[to.replace('eth', 'weth')].address,
        toWei(amount),
        (e, r) => {
          if (!e) {
            /*
            * Even thought the user entered how much he wants to receive
            * we still must calculate if what he has to pay is higher than
            * the min value for the pay token.
            *
            * If the amount of the calculated selling  value is under the min value
            * an error message is displayed for violating min value.
            *
            * */
            const calculatedPayValue = fromWei(toBigNumber(r));
            const calculatePayValueMin = settings.chain[this.props.network].tokens[from.replace('eth', 'weth')].minValue;
  
            if(calculatedPayValue.lt(calculatePayValueMin) && calculatedPayValue.gt(0)) {
              trade = {
                amountPayInput: calculatedPayValue.valueOf(),
                errorInputSell: `minValue:${calculatePayValueMin}`
              };
              this.props.setMainState({trade});
              return;
            }
  
            trade = {
              amountPay: calculatedPayValue,
              amountPayInput: calculatedPayValue.valueOf()
            };
            this.props.setMainState({trade}).then(async () => {
              const balance = from === 'eth' ? await Blockchain.getEthBalanceOf(this.props.account) : await Blockchain.getTokenBalanceOf(from, this.props.account);
              const errorInputSell = balance.lt(toWei(this.props.trade.amountPay))
                ?
                // `Not enough balance to sell ${this.props.trade.amountPay} ${from.toUpperCase()}`
                'funds'
                :
                null;
              const errorOrders = this.props.trade.amountPay.eq(0)
                ?
                {
                  type: "buy",
                  amount,
                  token: to.toUpperCase()
                }
                :
                null;
              if (errorInputSell || errorOrders) {
                trade = {
                  errorInputSell: errorInputSell,
                  errorOrders: errorOrders
                };
                this.props.setMainState({trade});
                return;
              }
  
              let hasAllowance = false;
              let action = null;
              let data = null;
              let target = null;
              let addrFrom = null;
              const txs = [];
              if (this.props.proxy) {
                // Calculate cost of proxy execute
                hasAllowance = (from === 'eth' ||
                  await Blockchain.getTokenTrusted(from, this.props.account, this.props.proxy) ||
                  (await Blockchain.getTokenAllowance(from, this.props.account, this.props.proxy)).gt(toWei(this.props.trade.amountPay)));
                addrFrom = hasAllowance ? this.props.account : settings.chain[this.props.network].addrEstimation;
                target = hasAllowance ? this.props.proxy : settings.chain[this.props.network].proxyEstimation;
                action = Blockchain.getCallDataAndValue(this.props.network, 'buyAll', from, to, amount, toWei(this.props.trade.amountPay));
                data = Blockchain.loadObject('dsproxy', target).execute['address,bytes'].getData(
                  settings.chain[this.props.network].proxyContracts.oasisDirect,
                  action.calldata
                );
              } else {
                // Calculate cost of proxy creation and execution
                target = settings.chain[this.props.network].proxyCreationAndExecute;
                hasAllowance = (from === 'eth' ||
                  await Blockchain.getTokenTrusted(from, this.props.account, target) ||
                  (await Blockchain.getTokenAllowance(from, this.props.account, target)).gt(toWei(this.props.trade.amountPay)));
                addrFrom = hasAllowance ? this.props.account : settings.chain[this.props.network].addrEstimation;
                action = Blockchain.getActionCreateAndExecute(this.props.network, 'buyAll', from, to, amount, toWei(this.props.trade.amountPay));
                data = Blockchain.loadObject('proxycreateandexecute', target)[action.method].getData(...action.params);
              }
              if (!hasAllowance) {
                const dataAllowance = this[`${this.props.trade.from.replace('eth', 'weth')}Obj`].approve.getData(
                  this.props.proxy ? this.props.proxy : settings.chain[this.props.network].proxyCreationAndExecute,
                  -1
                );
                txs.push({
                  to: this[`${this.props.trade.from.replace('eth', 'weth')}Obj`].address,
                  data: dataAllowance,
                  value: 0,
                  from: this.props.account
                });
              }
              txs.push({to: target, data, value: action.value, from: addrFrom});
              this.saveCost(txs);
            });
          } else {
            console.log(e);
          }
        });
    });
  }

  cleanInputs = () => {
    const trade = {
      amountBuy: toBigNumber(0),
      amountPay: toBigNumber(0),
      amountBuyInput: '',
      amountPayInput: '',
      txCost: toBigNumber(0),
      errorInputSell: null,
      errorInputBuy: null,
      errorOrders: null
    };
    this.props.setMainState({trade});
  }

  //Whether it's 'from' or 'to'. Probably better name should be chosen
  pickToken = (tokenType) => {
    this.setState({shouldDisplayTokenSelector: true, selectedToken: tokenType});
    this.cleanInputs();
  }

  select = (token) => {
    const side = this.state.selectedToken === 'from' ? 'to' : 'from';
    if (token === this.state[side]) {
      this.swapTokens()
    } else {
      this.setState({[this.state.selectedToken]: token});
    }
    this.setState({shouldDisplayTokenSelector: false, hasAcceptedTerms: false})
  }

  swapTokens = () => {
    this.setState({from: this.state.to, to: this.state.from, hasAcceptedTerms: false}, () => {
      this.cleanInputs();
    });
  }

  nextStep = e => {
    e.preventDefault();
    const trade = {
      step: 2
    };
    this.props.setMainState({trade});
    return false;
  }

  hasDetails = () => {
    // return true;
    return (this.props.trade.amountPay.gt(0) && this.props.trade.amountBuy.gt(0) && !this.props.trade.errorInputSell && !this.props.trade.errorInputBuy) || this.props.trade.errorOrders || this.props.trade.errorInputSell || this.props.trade.errorInputBuy;
  }

  acceptTermsAndConditions = () => {
    this.setState({hasAcceptedTerms: !this.state.hasAcceptedTerms});
  }

  render() {
    return (
      <section className="frame">
        <div className="heading">
          <h2>Enter Order Details</h2>
        </div>
        <div className={'info-box info-box--no-borders disclaimer'}>
          <div className="info-box-row">
            <span className="holder">
              <span className="icon">
                <Attention/>
              </span>
              <span className="label">
                Order details are estimations and may vary { settings.chain[this.props.network].threshold[[this.state.from, this.state.to].sort((a, b) => a > b).join('')] }%
              </span>
            </span>
          </div>
        </div>
        <div className={`info-box ${this.hasDetails() ? '' : ' info-box--hidden'} ${this.props.trade.errorOrders || this.props.trade.errorInputSell || this.props.trade.errorInputBuy ? 'has-errors' : ''}`}>
          <div className="info-box-row">
            {
              this.props.trade.errorOrders &&
              <span className="label">
                No orders available to {this.props.trade.errorOrders.type}  <strong>{ this.props.trade.errorOrders.amount} { this.props.trade.errorOrders.token }</strong>
              </span>
            }
            {
              !this.props.trade.errorOrders && this.props.trade.errorInputSell &&
              (
                this.props.trade.errorInputSell === 'funds'
                ?
                  <span className="label"> You don't have enough <strong>{ tokens[this.props.trade.from].name } </strong> in your Wallet</span>
                :
                  <span className="label"> { tokens[this.props.trade.from].symbol } Minimum Value: { this.props.trade.errorInputSell.replace('minValue:', '') }</span>
              )
            }
            {
              !this.props.trade.errorOrders && !this.props.trade.errorInputSell && this.props.trade.errorInputBuy &&
              <span className="label">{ tokens[this.props.trade.to].symbol } Minimum Value: { this.props.trade.errorInputBuy.replace('minValue:', '') }</span>
            }
            {
              !this.props.trade.errorOrders && !this.props.trade.errorInputSell && !this.props.trade.errorInputBuy &&
              <span className="holder desktop">
                <span className='value'>OasisDex</span>
              </span>
            }
            {
              !this.props.trade.errorOrders && !this.props.trade.errorInputSell && !this.props.trade.errorInputBuy &&
              <span className="holder">
                <span className="label">Price </span>
                <TokenAmount number={toWei(this.props.trade.amountPay.div(this.props.trade.amountBuy))}
                               token={`${tokens[this.props.trade.to].symbol}/${tokens[this.props.trade.from].symbol}`}/>
              </span>
            }
            {
              !this.props.trade.errorOrders && !this.props.trade.errorInputSell && !this.props.trade.errorInputBuy &&
              <span className="holder">
                <span className="label">Gas Cost </span>
                {
                  this.props.trade.txCost.gt(0)
                    ? <TokenAmount number={toWei(this.props.trade.txCost)} token={'ETH'}/>
                    : <Spinner/>
                }
              </span>
            }
          </div>
        </div>
        {
          this.state.shouldDisplayTokenSelector
            ? (<div className="token-selector">
              <div className="frame">
                <button className="close" onClick={() => this.setState({shouldDisplayTokenSelector: false})}/>
                <div className="tokens-container">
                  <div className="tokens">
                    <div className="token-list">
                      <div className='token' onClick={() => {
                        this.select('eth')
                      }}>
                        <span className="token-icon">{tokens.eth.icon}</span>
                        <span className="token-name">{tokens.eth.name}</span>
                        <span className="token-balance">
                          {
                            this.props.balances.eth
                              ? <TokenAmount number={this.props.balances.eth.valueOf()} decimal={3} token={"ETH"}/>
                              : <Spinner/>
                          }
                        </span>
                      </div>
                      {
                        ['mkr', 'dai'].map((token, index) => {
                          return (
                            <div key={index} className='token' onClick={() => {
                              this.select(token)
                            }}>
                              <span className="token-icon">{tokens[token].icon}</span>
                              <span className="token-name">{tokens[token].name}</span>
                              <span className="token-balance">
                                {
                                  this.props.balances[token]
                                    ? <TokenAmount number={this.props.balances[token].valueOf()} decimal={3} token={token.toUpperCase()}/>
                                    : <Spinner/>
                                }
                                </span>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>)
            : null
        }
        <div className="content">
          <form className="trade">
            <div className="selected-token">
              <div className="token" onClick={() => {
                this.pickToken('from')
              }}>
                <span className="token-icon">{tokens[this.state.from].icon}</span>
                <span className="token-name">{tokens[this.state.from].symbol}</span>
              </div>
              <div>
                <input type="number"
                       className={`${this.props.trade.errorInputSell && !this.props.trade.errorOrders ? 'has-errors' : ''} `}
                       ref={(input) => this.amountPay = input}
                       value={this.props.trade.amountPayInput || ''}
                       onChange={this.calculateBuyAmount} placeholder="deposit amount"/>
              </div>
            </div>
            <div className='separator'>
              <span className="swap-tokens" onClick={this.swapTokens}>
                <SwapArrows/>
              </span>
            </div>
            <div className="selected-token">
              <div className="token" onClick={() => {
                this.pickToken('to');
              }}>
                <span className="token-icon">{tokens[this.state.to].icon}</span>
                <span className="token-name">{tokens[this.state.to].symbol}</span>
              </div>
              <div>
                <input type="number"
                       className={`${this.props.trade.errorInputBuy && !this.props.trade.errorOrders ? 'has-errors' : ''} `}
                       ref={(input) => this.amountBuy = input}
                       value={this.props.trade.amountBuyInput || ''}
                       onChange={this.calculatePayAmount} placeholder="receive amount"/>
              </div>
            </div>
           </form>
          </div>
          {
            this.hasDetails() && !this.props.trade.errorInputSell && !this.props.trade.errorInputBuy && !this.props.trade.errorOrders &&
            <div className={`info-box terms-and-conditions ${this.state.hasAcceptedTerms ? 'accepted' : ''}`}
                 onClick={this.acceptTermsAndConditions}>
              <div className="info-box-row">
                <span>
                  <span className={`checkbox ${this.state.hasAcceptedTerms ? "checkbox--active" : ""}`}/>
                  <span className="label">
                    I agree to the <a href="OasisToS.pdf" target="_blank" onClick={(e) => {e.stopPropagation()}}>Terms of Service</a>
                  </span>
                </span>
              </div>
            </div>
          }
          <button type="button" value="Start transaction" className="start" onClick={this.nextStep}
                  disabled={this.props.trade.errorInputSell || this.props.trade.errorInputBuy || this.props.trade.errorOrders || this.props.trade.amountBuy.eq(0) || this.props.trade.amountPay.eq(0) || !this.state.hasAcceptedTerms}>
            START TRANSACTION
          </button>
      </section>
    )
  }
}

export default SetTrade;
