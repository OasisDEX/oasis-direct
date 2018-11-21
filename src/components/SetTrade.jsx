// Libraries
import React from "react";
import { inject, observer } from "mobx-react";
import ReactTooltip from "react-tooltip";

// UI Components
import { SwapArrows, IdentityIcon, Circle, Attention, CogWheel } from "../components-ui/Icons";
import Spinner from "../components-ui/Spinner";
import TokenAmount from "../components-ui/TokenAmount";
import TokensSelector from "../components-ui/TokensSelector";

// Utils
import { toWei } from "../utils/helpers";
import tokens from "../utils/tokens";

// Settings
import NetworkIndicator from "./NetworkIndicator";
import { PriceImpactWarning } from "./PriceImpactWarning";

@inject("network")
@inject("system")
@observer
class SetTrade extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      from: this.props.system.trade.from,
      to: this.props.system.trade.to,
      selectedSide: null,
      showTokenSelector: false,
      showPriceImpactWarning: false,
      hasAcceptedTerms: false,
    }
  }

  //Whether it's "from" or "to". Probably better name should be chosen
  pickToken = tokenType => {
    this.setState({showTokenSelector: true, selectedSide: tokenType});
  }

  closeTokenPicker = () => {
    this.setState({showTokenSelector: false, hasAcceptedTerms: false});
  }

  select = selectedToken => {
    const oppositeSide = this.state.selectedSide === "from" ? "to" : "from";
    const tokenOnTheOppositeSide = this.state[oppositeSide];

    // We we have selected ETH as DEPOSIT token and we open again DEPOSIT token-picker and select ETH again
    // nothing should happen except closing the token selector.
    if (this.state[this.state.selectedSide] === selectedToken) {
      this.closeTokenPicker();
      return;
    }

    this.props.system.trade.error = null;
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
      if (this.state.selectedSide === "to" && this.props.system.trade.amountBuy.gt(0)) {
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
    if (this.props.system.priceImpact > 5) {
      this.setState({
        showPriceImpactWarning: true
      });
    } else {
      this.props.system.doTrade();
    }
    return false;
  };

  acceptPriceImpact = () => {
    this.props.system.doTrade();
  };

  rejectPriceImpact = () => {
    this.setState({
      showPriceImpactWarning: false
    });
  };

  calculateBuyAmount = () => {
    const amountToPay = this.amountPay.value;
    const whole = amountToPay.split(".")[0];
    const decimals = amountToPay.split(".")[1];
    if (whole.length <= 15 && (!decimals || (decimals && decimals.length <= 5))) { // 18 should be replaced with any token's decimals according to some sort of configuration
      this.props.system.calculateBuyAmount(this.state.from, this.state.to, amountToPay);
    }
  }

  calculatePayAmount = () => {
    const amountToBuy = this.amountBuy.value;
    const whole = amountToBuy.split(".")[0];
    const decimals = amountToBuy.split(".")[1];
    if (whole.length <= 15 && (!decimals || (decimals && decimals.length <= 5))) { // 18 should be replaced with any token's decimals according to some sort of configuration
      this.props.system.calculatePayAmount(this.state.from, this.state.to, amountToBuy);
    }
  }

  hasDetails = () => this.props.system.trade.amountPay.gt(0) && this.props.system.trade.amountBuy.gt(0);

  hasErrors = () => Boolean(this.props.system.trade.error);

  hasCriticalErrors = () => this.props.system.trade.error && this.props.system.trade.error.isCritical;

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
    const {priceImpact, balances} = this.props.system;
    return <React.Fragment>
      {
        this.state.showTokenSelector &&
        <TokensSelector balances={balances} select={this.select}
                        back={() => this.setState({showTokenSelector: false})}/>
      }
      {
        this.state.showPriceImpactWarning &&
        <PriceImpactWarning priceImpact={this.props.system.priceImpact} onDismiss={this.rejectPriceImpact}
                            onAcknowledge={this.acceptPriceImpact}/>
      }
      {
        !this.state.showTokenSelector && !this.state.showPriceImpactWarning &&
        <section className="frame">
          <div className="heading">
            <span data-test-id="check-session-details" className={`identicon-placeholder ${this.props.network.loadingAddress ? "disabled" : ""}`}
                  onClick={this.props.showConnectionDetails}>
              {
                this.props.network.loadingAddress
                  ? <Spinner styles={{width: "26px", height: "26px"}}/>
                  : <Circle hover={true}><IdentityIcon address={this.props.network.defaultAccount}/></Circle>
              }
            </span>
            <span className={`advanced-settings-placeholder ${!this.hasDetails() ? "disabled" : ""}`}
                  onClick={this.props.showTradeSettings}>
              <Circle hover={true}>
                <CogWheel/>
              </Circle>
            </span>
            <h2>Enter Order Details</h2>
            <span className="network-indicator-placeholder">
              <NetworkIndicator network={this.props.network.network}/>
            </span>
          </div>
          <div className={`info-box
              ${this.hasDetails() || this.hasCriticalErrors() ? "" : " info-box--hidden"}
              ${this.hasCriticalErrors() && "critical-error"}
            `}>
            <div className="info-box-row wrap">
              {
                this.hasCriticalErrors() &&
                <span className="label"> {this.props.system.trade.error.cause} </span>
              }
              {
                !this.hasCriticalErrors() &&
                <React.Fragment>
                  <span data-test-id="trade-parameter-price" style={{paddingBottom: "4px"}} className="holder half holder--spread">
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
                                 number={toWei(this.props.system.trade.price)} decimal={2}
                                 token={`${this.props.system.trade.priceUnit.toUpperCase()}`}/>
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
                    <span data-test-id='trade-parameter-threshold'
                      className="value">{this.props.system.threshold}%</span>
                  </span>
                  <span data-test-id="trade-parameter-gas" style={{paddingTop: "4px"}} className="holder half holder--spread">
                  <span className="label">Gas cost</span>
                    {
                      this.props.system.trade.txCost.gt(0)
                        ?
                        <TokenAmount
                          isApproximation={true}
                          number={toWei(this.props.system.trade.txCost) * this.props.system.ethPriceInUSD} decimal={2}
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
                  <span data-test-id="trade-parameter-impact" style={{color: priceImpact > 5 ? "#E53935" : ""}}
                        className="value">{priceImpact}%</span>
                  </span>
                </React.Fragment>
              }
            </div>
          </div>
          <div className="content">
            <form className="trade">
              <div className="selected-token">
                <div className="token" onClick={() => this.pickToken("from")} data-test-id="set-trade-from">
                  <span className="token-icon">{tokens[this.state.from].icon}</span>
                  {
                    !balances[tokens[this.state.from].symbol.toLowerCase()]
                      ?
                      <Spinner/>
                      :
                      <TokenAmount className="token-name"
                                   number={balances[tokens[this.state.from].symbol.toLowerCase()].valueOf()}
                                   decimal={3}
                                   token={tokens[this.state.from].symbol}/>
                  }
                </div>
                <div data-test-id="set-trade-from-amount"
                  className={
                    `amount-input-placeholder
                    ${
                      (this.props.system.trade.error && this.props.system.trade.error.onTradeSide === "sell")
                        ? "has-errors"
                        : ""
                      }                 `
                  }>
                  {
                    (this.hasDetails() && this.props.system.trade.operation === "buyAll")
                    && <span className="tilde">~</span>
                  }
                  <input type="number"
                         ref={(input) => this.amountPay = input}
                         value={this.props.system.trade.amountPayInput || ""}
                         onChange={this.calculateBuyAmount} placeholder="deposit amount"/>
                </div>
              </div>
              <div className="separator">
                <span className="swap-tokens" onClick={this.swapTokens}>
                  <SwapArrows/>
                </span>
              </div>
              <div className="selected-token">
                <div className="token" onClick={() => this.pickToken("to")} data-test-id="set-trade-to">
                  <span className="token-icon">{tokens[this.state.to].icon}</span>
                  {
                    !balances[tokens[this.state.to].symbol.toLowerCase()]
                      ?
                      <Spinner/>
                      :
                      <TokenAmount className="token-name"
                                   number={balances[tokens[this.state.to].symbol.toLowerCase()].valueOf()}
                                   decimal={3}
                                   token={tokens[this.state.to].symbol}/>
                  }
                </div>
                <div data-test-id="set-trade-to-amount"
                  className={
                    `amount-input-placeholder
                    ${
                      (this.props.system.trade.error && this.props.system.trade.error.onTradeSide === "buy")
                        ? "has-errors"
                        : ""
                      }                 `
                  }>
                  {
                    (this.hasDetails() && this.props.system.trade.operation === "sellAll")
                    && <span className="tilde">~</span>
                  }
                  <input type="number"
                         ref={(input) => this.amountBuy = input}
                         value={this.props.system.trade.amountBuyInput || ""}
                         onChange={this.calculatePayAmount} placeholder="receive amount"/>
                </div>
              </div>
            </form>
          </div>
          {
            this.hasErrors() && !this.hasCriticalErrors() &&
            <div className={`info-box terms-and-conditions has-errors`}>
              <span className="label">{this.props.system.trade.error.cause}</span>
            </div>
          }
          {
            !this.hasErrors() && this.hasDetails() &&
            <div data-test-id="terms-and-conditions" className={`info-box terms-and-conditions ${this.state.hasAcceptedTerms ? "accepted" : ""}`}
                 onClick={this.acceptTermsAndConditions}>
              <div className="info-box-row">
                  <span>
                    <span className={`checkbox ${this.state.hasAcceptedTerms ? "checkbox--active" : ""}`}/>
                    <span className="label">
                      I agree to the <a href="OasisToS.pdf" target="_blank" onClick={e => e.stopPropagation()}>Terms of Service</a>
                    </span>
                  </span>
              </div>
            </div>
          }
          <button data-test-id="initiate-trade"
                  type="button" value="Start transaction" className="start" onClick={this.nextStep}
                  disabled={this.props.system.trade.errorInputSell || this.props.system.trade.errorInputBuy || this.props.system.trade.errorOrders || this.props.system.trade.amountBuy.eq(0) || this.props.system.trade.amountPay.eq(0) || !this.state.hasAcceptedTerms}>
            START TRANSACTION
          </button>
        </section>
      }
    </React.Fragment>
  }
}

export default SetTrade;
