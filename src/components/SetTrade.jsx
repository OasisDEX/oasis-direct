import React, { Component } from 'react';
import web3 from '../web3';
import dstoken from '../abi/dstoken';
import { Ether, MKR, DAI } from './Tokens';
import Spinner from './Spinner';
import { printNumber } from '../helpers';
import settings from '../settings';

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
      balances: [],
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
    this.setState({shouldDisplayTokenSelector: false})
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
    return (this.props.trade.amountPay.gt(0) && this.props.trade.amountBuy.gt(0) && !this.props.trade.errorInputSell && !this.props.trade.errorInputBuy) || this.props.trade.errorOrders;
  }

  loadETHBalance = () => {
    const balance = this.state.balances.eth;

    if(!balance) {
      web3.eth.getBalance(web3.eth.defaultAccount, (_ , balance) => {
        this.setState((prevState) => {
          const balances = {...prevState.balances};
          balances.eth = balance.valueOf();
          prevState.balances = balances;
          return {prevState};
        });
      })
    }
  }

  loadTokenBalance = (token) => {
    const balance = this.state.balances[token];;

    if(!balance){
      console.log(this.props);
      const contract = web3.eth.contract(dstoken.abi).at(settings.chain[this.props.network.network].tokens[token].address);

      contract.balanceOf(web3.eth.defaultAccount, (_ , balance) => {
        this.setState((prevState) => {
          const balances = {...prevState.balances};
          balances[token] = balance.valueOf();
          prevState.balances = balances;
          return {prevState};
        });
      })
    }
  }

  acceptTermsAndConditions = () => {
    const hasAcceptedTerms = this.state.hasAcceptedTerms;
    this.setState({hasAcceptedTerms: !hasAcceptedTerms});
  }


  render() {
    return (
      <section className="frame">
        <div className="heading">
          <h2>Enter Order Details</h2>
        </div>
        <div className={`info-box ${this.hasDetails() ? '' : ' info-box--hidden'}`}>
          <div className="info-box-row ">
            <span className="holder">
              <span className="icon">
                <img width="14px" height="14px" alt="alert icon" src="/assets/od-icons/od_alert.svg"/>
              </span>
              <span className="label">
                Order details are estimations and may vary
              </span>
              <span className="value">
                5%
              </span>
            </span>
          </div>
          <div className="info-box-row">
            {
              this.props.trade.errorOrders &&
              (
                <span className="holder">
                  <span className="icon">
                    <img width="14px" height="14px" alt="alert icon" src="/assets/od-icons/od_alert.svg"/>
                  </span>
                  <span className="label">
                    {this.props.trade.errorOrders}
                  </span>
                </span>
              )
            }
            {
              !this.props.trade.errorOrders &&
              <span className="holder desktop">
                <span className='value'>OasisDex</span>
              </span>
            }
            {
              !this.props.trade.errorOrders &&
              <span className="holder">
                <span className="label">Price </span>
                <span className='value'>
                  <span>~ {printNumber(web3.toWei(this.props.trade.amountPay.div(this.props.trade.amountBuy)))} </span>
                  <span> {tokens[this.props.trade.to].symbol}/{tokens[this.props.trade.from].symbol}</span>
                </span>
              </span>
            }
            {
              !this.props.trade.errorOrders && this.props.trade.txCost.gt(0) &&
              <span className="holder">
                <span className="label">Gas Cost </span>
                <span className='value'>
                  ~ {printNumber(web3.toWei(this.props.trade.txCost))} ETH
                </span>
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
                            this.loadETHBalance()
                          }
                          {
                            this.state.balances.eth ? <span>{ printNumber(this.state.balances.eth,3) } ETH</span> : <Spinner/>
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
                                  this.loadTokenBalance(token)
                                }
                                {
                                  this.state.balances[token] ? <span>{ printNumber(this.state.balances[token],3) } {token.toUpperCase()}</span> : <Spinner/>
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
                <div className={`trade-errors${this.props.trade.errorInputSell ? ' show' : ''}`}>
                  {this.props.trade.errorInputSell}
                </div>
                <input className={`${this.props.trade.errorInputSell ? 'has-errors' : ''}`} type="number"
                       ref={(input) => this.amountPay = input}
                       value={this.props.trade.amountPayInput || ''}
                       onChange={this.calculateBuyAmount} placeholder="deposit amount"/>
              </div>
            </div>
            <div className='separator'>
              <img alt="arrows" src='/assets/od-icons/od_swap_arrow.svg' className="swap-tokens"
                   onClick={this.swapTokens}/>
            </div>
            <div className="selected-token">
              <div className="token" onClick={() => {
                this.pickToken('to');
              }}>
                <span className="token-icon">{tokens[this.state.to].icon}</span>
                <span className="token-name">{tokens[this.state.to].symbol}</span>
              </div>
              <div>
                <div className={`trade-errors${this.props.trade.errorInputBuy ? ' show' : ''}`}>
                  {this.props.trade.errorInputBuy}
                </div>
                <input className={`${this.props.trade.errorInputBuy ? 'has-errors' : ''}`} type="number"
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
              <div className="info-box-row info-box-row--left">
                <span className={`checkbox ${this.state.hasAcceptedTerms ? "checkbox--active" : ""}`}/>
                <span className="label">
                I agree to the Terms and certify that I am the beneficial owner of the deposit asset.
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
