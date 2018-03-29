import React, { Component } from 'react';
import web3 from '../web3';
import { Ether, MKR, DAI, SwapArrows, Attention } from './Icons';
import Spinner from './Spinner';
import TokenAmount from "./TokenAmount";

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

  //Whether it's 'from' or 'to'. Probably better name should be chosen
  pickToken = (tokenType) => {
    this.setState({shouldDisplayTokenSelector: true, selectedToken: tokenType});
    this.props.cleanInputs();
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
      this.props.cleanInputs();
    });
  }

  nextStep = e => {
    e.preventDefault();
    this.props.doTrade();
    return false;
  }

  calculateBuyAmount = () => {
    this.props.calculateBuyAmount(this.state.from, this.state.to, this.amountPay.value);
  }

  calculatePayAmount = () => {
    this.props.calculatePayAmount(this.state.from, this.state.to, this.amountBuy.value);
  }

  hasDetails = () => {
    // return true;
    return (this.props.trade.amountPay.gt(0) && this.props.trade.amountBuy.gt(0) && !this.props.trade.errorInputSell && !this.props.trade.errorInputBuy) || this.props.trade.errorOrders || this.props.trade.errorInputSell || this.props.trade.errorInputBuy;
  }

  acceptTermsAndConditions = () => {
    this.setState({hasAcceptedTerms: !this.state.hasAcceptedTerms});
  }

  debug = (value) => {
    console.log(value);
    return value;
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
                  <span className="label">Minimum Value: { this.props.trade.errorInputSell.replace('minValue:', '') }</span>
              )
            }
            {
              !this.props.trade.errorOrders && !this.props.trade.errorInputSell && this.props.trade.errorInputBuy &&
              <span className="label">Minimum Value: { this.props.trade.errorInputBuy.replace('minValue:', '') }</span>
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
                <TokenAmount number={web3.toWei(this.props.trade.amountPay.div(this.props.trade.amountBuy))}
                               token={`${tokens[this.props.trade.to].symbol}/${tokens[this.props.trade.from].symbol}`}/>
              </span>
            }
            {
              !this.props.trade.errorOrders && !this.props.trade.errorInputSell && !this.props.trade.errorInputBuy &&
              <span className="holder">
                <span className="label">Gas Cost </span>
                {
                  this.props.trade.txCost.gt(0)
                    ? <TokenAmount number={web3.toWei(this.props.trade.txCost)} token={'ETH'}/>
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
