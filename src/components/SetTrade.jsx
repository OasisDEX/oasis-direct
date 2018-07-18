import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import ActiveConnection from './ActiveConnection';
import TokenList from './TokenList';
import {
  Ether, MKR, DAI, SwapArrows, IdentityIcon, Circle, Attention,
} from '../components-ui/Icons';
import Spinner from '../components-ui/Spinner';
import TokenAmount from './TokenAmount';
import { fetchETHPriceInUSD, toWei } from '../helpers'
import * as Blockchain from "../blockchainHandler";
import Checkbox from "../components-ui/Checkbox";
import AmountInput from "./AmountInput";
import TokenDetails from "./TokenDetails";

const settings = require('../settings');

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

class SetTrade extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ethBalance: 0,
      from: this.props.trade.from,
      to: this.props.trade.to,
      selectedSide: null,
      shouldDisplayTokenSelector: false,
      shouldDisplayActiveConnectionDetails: false,
      hasAcceptedTerms: false,
      priceInUSD: 0
    }
  }

  componentDidMount() {
    this.priceTickerInterval = (this.fetchPriceInUSD(), setInterval(this.fetchPriceInUSD, 3000000));
    Blockchain.getEthBalanceOf(this.props.account).then((balance) => {
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
      if (this.state.selectedSide === 'to' && this.props.trade.amountBuy.gt(0)) {
        this.calculateBuyAmount();
      } else {
        this.props.cleanInputs();
      }
    });

    this.closeTokenPicker();
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

  calculateBuyAmount = (amount) => {
    this.props.calculateBuyAmount(this.state.from, this.state.to, amount);
  }

  calculatePayAmount = (amount) => {
    this.props.calculatePayAmount(this.state.from, this.state.to, amount);
  }

  hasDetails = () => this.props.trade.amountPay.gt(0) && this.props.trade.amountBuy.gt(0);

  hasErrors = () =>  this.props.trade.errorOrders || this.props.trade.errorInputSell || this.props.trade.errorInputBuy;

  acceptTermsAndConditions = () => {
    this.setState({hasAcceptedTerms: !this.state.hasAcceptedTerms});
  }

  priceImpact = () => this.props.trade.bestPriceOffer
    .minus(this.props.trade.price)
    .abs()
    .div(this.props.trade.bestPriceOffer)
    .times(100)
    .round(2)
    .valueOf();


  render() {
    const { balances, network, trade } = this.props;
    return (
      <React.Fragment>
        {
          this.state.shouldDisplayActiveConnectionDetails
            ?
            <ActiveConnection account={this.props.account} ethBalance={this.state.ethBalance}
                              network={network}
                              back={() => this.setState({shouldDisplayActiveConnectionDetails: false})}
                              onDisconnect={this.props.onDisconnect}/>
            :
            this.state.shouldDisplayTokenSelector
              ?
              <TokenList tokens={tokens} balances={balances} onSelect={this.select}
                         onClose={() => this.setState({shouldDisplayTokenSelector: false})}/>
              :
              <section className="frame">
                <div className="heading">
                <span className="identicon-placeholder"
                      onClick={() => {
                        this.setState({shouldDisplayActiveConnectionDetails: true});
                      }}>
                  <Circle hover={true}><IdentityIcon address={this.props.account}/></Circle>
                </span>
                  <h2>Enter Order Details</h2>
                </div>
                <div
                  className={`info-box ${this.hasDetails() || this.hasErrors() ? '' : ' info-box--hidden'} ${this.hasErrors() ? 'has-errors' : ''}`}>
                  <div className="info-box-row wrap">
                    {
                      trade.errorOrders && !trade.errorInputSell &&
                      <span className="label">
                      No orders available to {trade.errorOrders.type}&nbsp;
                        <strong>{trade.errorOrders.amount} {trade.errorOrders.token}</strong>
                    </span>
                    }
                    {
                      trade.errorInputSell &&
                      (
                        trade.errorInputSell === 'funds'
                          ?
                          <span className="label">
                          You don't have enough <strong>{tokens[trade.from].name} </strong> in your Wallet
                        </span>
                          :
                          trade.errorInputSell === 'gasCost'
                            ? <span className="label"> You won't have enough ETH to pay for the gas!</span>
                            : <span className="label">
                              {tokens[trade.from].symbol}&nbsp;
                              Minimum Value: {trade.errorInputSell.replace('minValue:', '')}
                            </span>
                      )
                    }
                    {
                      !trade.errorOrders && !trade.errorInputSell && trade.errorInputBuy &&
                      <span className="label">
                      {tokens[trade.to].symbol}&nbsp;
                        Minimum Value: {trade.errorInputBuy.replace('minValue:', '')}
                    </span>
                    }
                    {
                      !trade.errorOrders && !trade.errorInputSell && !trade.errorInputBuy &&
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
                        <span style={{lineHeight: "14px", fontSize: "12px"}}> ~ <TokenAmount
                          number={toWei(trade.price)} decimal={2}
                          token={`${trade.priceUnit.toUpperCase()}`}/>
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
                        <span
                          className="value">{settings.chain[network].threshold[[this.state.from, this.state.to].sort((a, b) => a > b).join('')]}%</span>
                      </span>
                        <span style={{paddingTop: "4px", lineHeight: "18px"}} className="holder half holder--spread">
                      <span className="label">Gas cost</span>
                          {
                            trade.txCost.gt(0)
                              ? <span style={{lineHeight: "14px", fontSize: "12px"}}> ~ <TokenAmount
                                number={toWei(trade.txCost) * this.state.priceInUSD} decimal={2}
                                token={'USD'}/></span>
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
                      <span style={{color: this.priceImpact() > 5 ? "#E53935" : ""}}
                            className='value'>{this.priceImpact()}%</span>
                      </span>
                      </React.Fragment>
                    }
                  </div>
                </div>
                <div className="content">
                  <form className="trade">
                    <div className="selected-token">
                      <TokenDetails token={{
                        icon: tokens[this.state.from].icon,
                        balance: balances[tokens[this.state.from].symbol.toLowerCase()] ? balances[tokens[this.state.from].symbol.toLowerCase()].valueOf() : "",
                        symbol: tokens[this.state.from].symbol
                      }} select={() => {
                        this.pickToken('from')
                      }}/>
                      <AmountInput
                        className={`${trade.errorInputSell && !trade.errorOrders ? 'has-errors' : ''} `}
                        onChange={this.calculateBuyAmount}
                        value={trade.amountPayInput}
                        placeholder="deposit amount"/>
                    </div>
                    <div className='separator'>
                    <span className="swap-tokens" onClick={this.swapTokens}>
                      <SwapArrows/>
                    </span>
                    </div>
                    <div className="selected-token">
                      <TokenDetails token={{
                        icon: tokens[this.state.to].icon,
                        balance: balances[tokens[this.state.to].symbol.toLowerCase()] ? balances[tokens[this.state.to].symbol.toLowerCase()].valueOf() : "",
                        symbol: tokens[this.state.to].symbol
                      }} select={() => {
                        this.pickToken('to')
                      }}/>
                      <AmountInput
                        className={`${trade.errorInputBuy && !trade.errorOrders ? 'has-errors' : ''} `}
                        value={trade.amountBuyInput}
                        onChange={this.calculatePayAmount}
                        placeholder="receive amount"/>
                    </div>
                  </form>
                </div>
                {
                  this.hasDetails() && !this.hasErrors() &&
                  <Checkbox className="terms-and-conditions" onToggle={this.acceptTermsAndConditions}>
                    I agree to the&nbsp;
                    <a href="OasisToS.pdf" target="_blank" onClick={e => e.stopPropagation()}>
                      Terms of Service
                    </a>
                  </Checkbox>
                }
                <button type="button" value="Start transaction" className="start" onClick={this.nextStep}
                        disabled={this.hasErrors() || !this.hasDetails() || !this.state.hasAcceptedTerms}>
                  START TRANSACTION
                </button>
              </section>
        }
      </React.Fragment>
    )
  }
}

export default SetTrade;
