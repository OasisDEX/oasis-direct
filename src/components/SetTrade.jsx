import React from 'react';
import {observer} from "mobx-react";
import ReactTooltip from 'react-tooltip';
import ActiveConnection from './ActiveConnection';
import TokensSelector from './TokensSelector';
import {
  Ether, MKR, DAI, SwapArrows, IdentityIcon, Circle, Attention,
} from './Icons';
import Spinner from './Spinner';
import TokenAmount from './TokenAmount';
import { fetchETHPriceInUSD, toWei } from '../helpers'
import * as Blockchain from "../blockchainHandler";

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
  dai: {
    icon: <DAI/>,
    symbol: "DAI",
    name: "DAI",
  },
}

class SetTrade extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ethBalance: 0,
      from: this.props.system.trade.from,
      to: this.props.system.trade.to,
      selectedSide: null,
      shouldDisplayTokenSelector: false,
      shouldDisplayActiveConnectionDetails: false,
      hasAcceptedTerms: false,
      priceInUSD: 0
    }
  }

  componentDidMount() {
    this.priceTickerInterval = (this.fetchPriceInUSD(), setInterval(this.fetchPriceInUSD, 3000000));
    Blockchain.getEthBalanceOf(this.props.network.defaultAccount).then((balance) => {
      this.setState({ethBalance: balance.valueOf()});
    });
  }

  componentWillUnmount() {
    clearInterval(this.priceTickerInterval);
  }

  fetchPriceInUSD = () => {
    fetchETHPriceInUSD().then(price => {
      this.setState({priceInUSD: price});
    })
  }

  //Whether it's 'from' or 'to'. Probably better name should be chosen
  pickToken = (tokenType) => {
    this.setState({shouldDisplayTokenSelector: true, selectedSide: tokenType});
  }

  closeTokenPicker = () => {
    this.setState({shouldDisplayTokenSelector: false, hasAcceptedTerms: false});
  };

  select = (selectedToken) => {
    const oppositeSide = this.state.selectedSide === 'from' ? 'to' : 'from';
    const tokenOnTheOppositeSide = this.state[oppositeSide];

    // We we have selected ETH as DEPOSIT token and we open again DEPOSIT token-picker and select ETH again
    // nothing should happen except closing the token selector.
    if (this.state[this.state.selectedSide] === selectedToken) {
      this.closeTokenPicker();
      return;
    }


    // If we have ETH / DAI for DEPOSIT / RECEIVE respectively  and we click on
    // DEPOSIT token and select DAI -> we swap the pair so it has DAI / ETH for
    // DEPOSIT / RECEIVE respectively. Close the token-picker.
    if (selectedToken === tokenOnTheOppositeSide) {
      this.swapTokens();
      this.closeTokenPicker();
      return;
    }

    // If we change the RECEIVE token and we have some amount  for the DEPOSIT token
    // then we just recalculate what the user will receive with the new RECEIVE token.
    this.setState({[this.state.selectedSide]: selectedToken}, () => {
      if (this.state.selectedSide === 'to' && this.props.system.trade.amountBuy.gt(0)) {
        this.props.system.calculateBuyAmount();
      } else {
        this.props.system.cleanInputs();
      }
    });

    this.closeTokenPicker();
  }

  swapTokens = () => {
    this.setState({from: this.state.to, to: this.state.from, hasAcceptedTerms: false}, () => {
      this.props.system.cleanInputs();
    });
  }

  nextStep = e => {
    e.preventDefault();
    this.props.system.doTrade();
    return false;
  }

  calculateBuyAmount = () => {
    const amountToPay = this.amountPay.value;
    const whole = amountToPay.split(".")[0];
    const decimals = amountToPay.split(".")[1];
    if (whole.length <= 15 && (!decimals || (decimals && decimals.length <= 18))) { // 18 should be replaced with any token's decimals according to some sort of configuration
      this.props.system.calculateBuyAmount(this.state.from, this.state.to, amountToPay);
    }
  }

  calculatePayAmount = () => {
    const amountToBuy = this.amountBuy.value;
    const whole = amountToBuy.split(".")[0];
    const decimals = amountToBuy.split(".")[1];
    if (whole.length <=15 && (!decimals || (decimals && decimals.length <= 18))) { // 18 should be replaced with any token's decimals according to some sort of configuration
      this.props.system.calculatePayAmount(this.state.from, this.state.to, amountToBuy);
    }
  }

  hasDetails = () => {
    // return true;
    return (this.props.system.trade.amountPay.gt(0) && this.props.system.trade.amountBuy.gt(0) && !this.props.system.trade.errorInputSell && !this.props.system.trade.errorInputBuy) || this.props.system.trade.errorOrders || this.props.system.trade.errorInputSell || this.props.system.trade.errorInputBuy;
  }

  acceptTermsAndConditions = () => {
    this.setState({hasAcceptedTerms: !this.state.hasAcceptedTerms});
  }

  priceImpact = () => this.props.system.trade.bestPriceOffer
    .minus(this.props.system.trade.price)
    .abs()
    .div(this.props.system.trade.bestPriceOffer)
    .times(100)
    .round(2)
    .valueOf();

  render() {
    return (
      <React.Fragment>
        {
          this.state.shouldDisplayActiveConnectionDetails
          ?
            <ActiveConnection ethBalance={this.state.ethBalance} network={this.props.network} back={() => this.setState({shouldDisplayActiveConnectionDetails: false})} />
          :
            this.state.shouldDisplayTokenSelector
            ?
              <TokensSelector tokens={tokens} balances={this.props.system.balances} select={this.select} back={() => this.setState({shouldDisplayTokenSelector: false})} />
            :
              <section className="frame">
                <div className="heading">
                  <span className="identicon-placeholder"
                        onClick={() => {
                          this.setState({shouldDisplayActiveConnectionDetails: true});
                        }}>
                    <Circle hover={true}><IdentityIcon address={this.props.network.defaultAccount}/></Circle>
                  </span>
                  <h2>Enter Order Details</h2>
                </div>
                <div
                  className={`info-box ${this.hasDetails() ? '' : ' info-box--hidden'} ${this.props.system.trade.errorOrders || this.props.system.trade.errorInputSell || this.props.system.trade.errorInputBuy ? 'has-errors' : ''}`}>
                  <div className="info-box-row wrap">
                    {
                      this.props.system.trade.errorOrders && !this.props.system.trade.errorInputSell &&
                      <span className="label">
                        No orders available to {this.props.system.trade.errorOrders.type}&nbsp;
                        <strong>{this.props.system.trade.errorOrders.amount} {this.props.system.trade.errorOrders.token}</strong>
                      </span>
                    }
                    {
                      this.props.system.trade.errorInputSell &&
                      (
                        this.props.system.trade.errorInputSell === 'funds'
                        ?
                          <span className="label"> You don't have enough <strong>{tokens[this.props.system.trade.from].name} </strong> in your Wallet</span>
                        :
                        this.props.system.trade.errorInputSell === 'gasCost'
                        ?
                          <span className="label"> You won't have enough ETH to pay for the gas!</span>
                        :
                          <span className="label">
                            {tokens[this.props.system.trade.from].symbol}&nbsp;
                            Minimum Value: {this.props.system.trade.errorInputSell.replace('minValue:', '')}
                          </span>
                      )
                    }
                    {
                      !this.props.system.trade.errorOrders && !this.props.system.trade.errorInputSell && this.props.system.trade.errorInputBuy &&
                      <span className="label">
                        {tokens[this.props.system.trade.to].symbol}&nbsp;
                        Minimum Value: {this.props.system.trade.errorInputBuy.replace('minValue:', '')}
                      </span>
                    }
                    {
                      !this.props.system.trade.errorOrders && !this.props.system.trade.errorInputSell && !this.props.system.trade.errorInputBuy &&
                      <React.Fragment>
                        <span style={{paddingBottom: "4px", lineHeight: "18px"}} className="holder half holder--spread">
                          <span className="label vertical-align">
                            Price
                            <Attention data-tip data-for="price-tooltip" className="attention-icon"/>
                            <ReactTooltip className="od-tooltip" effect="solid" id="price-tooltip">
                              <p>
                                The estimated price of your order is calculated based on the current depth of the OasisDEX order book and the size of your order.
                              </p>
                            </ReactTooltip>
                          </span>
                          <span style={{lineHeight: "14px",  fontSize:"12px"}}>
                            &nbsp;~&nbsp;<TokenAmount number={toWei(this.props.system.trade.price)} decimal={2} token={`${this.props.system.trade.priceUnit.toUpperCase()}`}/>
                          </span>
                        </span>
                        <span style={{paddingBottom: "4px", lineHeight: "18px"}} className="holder half holder--spread">
                          <span className="label vertical-align">
                            Slippage Limit
                            <Attention data-tip data-for="slippage-tooltip" className="attention-icon"/>
                            <ReactTooltip className="od-tooltip" effect="solid" id="slippage-tooltip">
                              <p>
                                The maximum allowed difference between the estimated price of the order and the actual price. The two may differ if the order book changes before your trade executes.
                              </p>
                            </ReactTooltip>
                          </span>
                          <span className="value">{settings.chain[this.props.network.network].threshold[[this.state.from, this.state.to].sort((a, b) => a > b).join('')]}%</span>
                        </span>
                        <span style={{paddingTop: "4px", lineHeight: "18px"}} className="holder half holder--spread">
                        <span className="label">Gas cost</span>
                          {
                            this.props.system.trade.txCost.gt(0)
                              ? <span style={{lineHeight: "14px", fontSize:"12px"}}> ~ <TokenAmount number={toWei(this.props.system.trade.txCost) * this.state.priceInUSD} decimal={2} token={'USD'}/></span>
                              : <Spinner/>
                          }
                        </span>
                        <span style={{paddingTop: "4px"}} className="holder half holder--spread">
                        <span className="label vertical-align">
                          Price Impact
                          <Attention data-tip data-for="price-impact-tooltip" className="attention-icon"/>
                          <ReactTooltip className="od-tooltip" effect="solid" id="price-impact-tooltip">
                            <p>
                              The difference between the best current price on the OasisDEX order book and the estimated price of your order.
                            </p>
                          </ReactTooltip>
                        </span>
                        <span style={{color:this.priceImpact() > 5 ? "#E53935" : ""}}
                          className='value'>{this.priceImpact()}%</span>
                        </span>
                      </React.Fragment>
                    }
                  </div>
                </div>
                <div className="content">
                  <form className="trade">
                    <div className="selected-token">
                      <div className="token" onClick={() => {
                        this.pickToken('from')
                      }}>
                        <span className="token-icon">{tokens[this.state.from].icon}</span>
                        {
                          !this.props.system.balances[tokens[this.state.from].symbol.toLowerCase()]
                          ?
                            <Spinner/>
                          :
                            <TokenAmount className="token-name" number={this.props.system.balances[tokens[this.state.from].symbol.toLowerCase()].valueOf()}
                                        decimal={3}
                                        token={tokens[this.state.from].symbol}/>
                        }
                      </div>
                      <div>
                        <input type="number"
                              className={`${this.props.system.trade.errorInputSell && !this.props.system.trade.errorOrders ? 'has-errors' : ''} `}
                              ref={(input) => this.amountPay = input}
                              value={this.props.system.trade.amountPayInput || ''}
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
                        {
                          !this.props.system.balances[tokens[this.state.to].symbol.toLowerCase()]
                          ?
                            <Spinner/>
                          :
                            <TokenAmount className="token-name"
                                          number={this.props.system.balances[tokens[this.state.to].symbol.toLowerCase()].valueOf()}
                                          decimal={3}
                                          token={tokens[this.state.to].symbol}/>
                        }
                      </div>
                      <div>
                        <input type="number"
                              className={`${this.props.system.trade.errorInputBuy && !this.props.system.trade.errorOrders ? 'has-errors' : ''} `}
                              ref={(input) => this.amountBuy = input}
                              value={this.props.system.trade.amountBuyInput || ''}
                              onChange={this.calculatePayAmount} placeholder="receive amount"/>
                      </div>
                    </div>
                  </form>
                </div>
                {
                  this.hasDetails() && !this.props.system.trade.errorInputSell && !this.props.system.trade.errorInputBuy && !this.props.system.trade.errorOrders &&
                  <div className={`info-box terms-and-conditions ${this.state.hasAcceptedTerms ? 'accepted' : ''}`}
                      onClick={this.acceptTermsAndConditions}>
                    <div className="info-box-row">
                        <span>
                          <span className={`checkbox ${this.state.hasAcceptedTerms ? "checkbox--active" : ""}`}/>
                          <span className="label">
                            I agree to the <a href="OasisToS.pdf" target="_blank" onClick={(e) => {
                            e.stopPropagation()
                          }}>Terms of Service</a>
                          </span>
                        </span>
                    </div>
                  </div>
                }
                <button type="button" value="Start transaction" className="start" onClick={this.nextStep}
                        disabled={this.props.system.trade.errorInputSell || this.props.system.trade.errorInputBuy || this.props.system.trade.errorOrders || this.props.system.trade.amountBuy.eq(0) || this.props.system.trade.amountPay.eq(0) || !this.state.hasAcceptedTerms}>
                  START TRANSACTION
                </button>
              </section>
        }
      </React.Fragment>
    )
  }
}

export default observer(SetTrade);
