import React, { Component } from 'react';
import ReactTooltip from "react-tooltip";
import { observer, inject } from "mobx-react";

import Spinner from "../components-ui/Spinner";
import TokenAmount from "../components-ui/TokenAmount";
import { Attention, BackIcon, Circle } from "../components-ui/Icons";

import { calculateTradePrice, fromWei, quotation, toBigNumber, toWei } from "../utils/helpers";

import GasPriceDropdown from "./GasPriceDropdown";
import { GAS_PRICE_LEVELS } from "../utils/constants";
import NetworkIndicator from "./NetworkIndicator";

@inject("network")
@inject("quotes")
@inject("system")
@observer
export default class TradeSettings extends Component {

  constructor(props) {
    super();
    this.state = {
      threshold: '',
      gasPrice: fromWei(props.quotes.selected.price, "GWEI")
    }
  }

  updateCustom = (event) => {
    const gasPrice = event.target.value;
    this.setState({gasPrice});
    if (gasPrice) {
      this.props.quotes.select(GAS_PRICE_LEVELS.CUSTOM);
      this.props.quotes.update(gasPrice);
    }
  };

  updateThresholdPercentage = (event) => {
    let threshold = event.target.value;
    if (threshold) {
      this.props.system.threshold = event.target.value;
    }
    this.setState({threshold});
  };

  changeGasPriceLevel = (quote) => {
    this.props.quotes.select(quote.level);
    this.setState({gasPrice: fromWei(this.props.quotes.selected.price, "GWEI")});
  };

  hasEmptyValues = () => !this.props.quotes.selected.price || !this.props.system.threshold;

  calculateSlippage = () => {
    const {threshold, trade} = this.props.system;
    const quote = quotation(trade.from, trade.to);
    return  quote.isCounter
      ? toBigNumber(trade.price).minus(toBigNumber(threshold * trade.price * 0.01)).round(2).toNumber()
      : toBigNumber(trade.price).add(toBigNumber(threshold * trade.price * 0.01)).round(2).toNumber();
  };

  currencyPair = () => {
    const {from, amountPay, to, amountBuy} = this.props.system.trade;
    const result = calculateTradePrice(from, amountPay, to, amountBuy).priceUnit.split("/");
    return {base: result[0], quote: result[1]}
  };

  render() {
    const {trade, priceImpact, ethPriceInUSD, threshold} = this.props.system;
    const {network} = this.props.network;
    const {priceList, selected} = this.props.quotes;

    return (
      <div className="frame trade-settings">
        <div className="heading">
          <button className={`back ${this.hasEmptyValues() ? 'disabled' : ''}`} onClick={this.props.onDismiss}>
            <Circle hover={true}><BackIcon/></Circle>
          </button>
          <h2>Advanced Settings</h2>
          <div className="network-indicator-placeholder">
            <NetworkIndicator network={network}/>
          </div>
        </div>
        <div className="content">
          <div className={`info-box`}>
            <div className={`info-box-row wrap`}>
              <span style={{paddingBottom: "4px"}} className="holder half holder--spread">
                    <span className="label vertical-align">
                      Price
                      <Attention data-tip data-for="price-tooltip" className="attention-icon"/>
                      <ReactTooltip className="od-tooltip" effect="solid" id="price-tooltip">
                        <p>
                          The estimated price of your order is calculated based on the current depth of the OasisDEX order book and the size of your order.
                        </p>
                      </ReactTooltip>
                    </span>
                    <TokenAmount isApproximation={true}
                                 number={toWei(trade.price)} decimal={2}
                                 token={`${trade.priceUnit.toUpperCase()}`}/>
                  </span>
              <span style={{paddingBottom: "4px"}} className="holder half holder--spread">
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
                      className="value">{this.props.system.threshold}%</span>
                  </span>
              <span style={{paddingTop: "4px"}} className="holder half holder--spread">
                  <span className="label">Gas cost</span>
                {
                  trade.txCost.gt(0)
                    ?
                    <TokenAmount isApproximation={true}
                                 number={toWei(trade.txCost) * ethPriceInUSD} decimal={2}
                                 token={"USD"}/>
                    :
                    <Spinner/>
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
                  <span style={{color: priceImpact > 5 ? "#E53935" : ""}}
                        className="value">{priceImpact}%</span>
                  </span>
            </div>
          </div>
          <div className={`settings-panel column`}>
            <div className={`row`} style={{alignItems: `flex-end`}}>
              <div className={`parameter column`}>
                <label className={`parameter-name`}>Transaction Fee</label>
                <GasPriceDropdown quotes={priceList}
                                  default={selected}
                                  onSelect={quote => this.changeGasPriceLevel(quote)}/>
              </div>

              <div className={`parameter column`}>
                <div className={`parameter-value`}>
                  <input type="number"
                         placeholder={priceList[selected.level] ? priceList[selected.level].price : ""}
                         onChange={this.updateCustom}
                         value={this.state.gasPrice}/>
                  <span className={`parameter-unit`}>GWEI</span>
                </div>
              </div>
            </div>

            <div className={`row`} style={{paddingBottom: `12px`}}>
              <div style={{width: "50%"}}>
                <div className={`parameter column`}>
                  <label className={`parameter-name`}>Slippage Limit</label>
                  <div className={`parameter-value`}>
                    <input type="number"
                           value={this.state.threshold}
                           placeholder={threshold}
                           onChange={this.updateThresholdPercentage}
                    />
                    <span className={`parameter-unit`}>%</span>
                  </div>
                </div>
              </div>
            </div>

            <div  className={`attention info-box`}>
              <Attention className="attention-icon"/>
              <p data-test-id="slippage-warning" className="attention-text">
                The transaction will fail (and gas will be spent), if the price of 1
                <strong> {this.currencyPair().base.toUpperCase()}</strong> is
                {
                 quotation(trade.from, trade.to).isCounter ? " lower" : " higher"
                } than ~{this.calculateSlippage()}
                <strong> {this.currencyPair().quote.toUpperCase()}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}