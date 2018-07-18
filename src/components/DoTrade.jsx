// Libraries
import React from "react";
import {inject, observer} from "mobx-react";
import ReactTooltip from "react-tooltip";

// Components
import Congratulation from "./Congratulation";

// UI Components
import {Done, AccountIcon, Attention} from "../components-ui/Icons";
import Spinner from "../components-ui/Spinner";
import TokenAmount from "../components-ui/TokenAmount";

// Internal Libraries
import {etherscanUrl, quotation, toBigNumber, toWei} from "../utils/helpers";

// Settings
import * as settings from "../settings";

class DoTrade extends React.Component {
  hasTxCompleted = type => {
    return this.props.transactions[type]
      && this.props.transactions[type].tx
      && !this.props.transactions[type].pending
      && !this.props.transactions[type].error
      && (type !== "trade" || this.props.transactions.trade.amountBuy.gt(0) || this.props.transactions.trade.amountSell.gt(0));
  }

  showTradeAgainButton = () => {
    return (this.props.transactions.hasProxyTx &&
      (this.props.transactions.proxy.error || this.props.transactions.proxy.rejected || this.props.transactions.proxy.errorDevice)) ||
      (this.props.transactions.hasApprovalTx &&
        (this.props.transactions.approval.error || this.props.transactions.approval.rejected || this.props.transactions.approval.errorDevice)) ||
      (this.props.transactions.hasTradeTx &&
        !this.props.transactions.trade.requested &&
        (this.hasTxCompleted("trade")
          || this.props.transactions.trade.error
          || this.props.transactions.trade.rejected
          || this.props.transactions.trade.errorDevice));
  }

  renderInitialStatus = initiating => {
    return  initiating
            ?
              <React.Fragment>
                <span className="status label">Initiating transaction</span>
                <Spinner />
              </React.Fragment>
            :
              <span className="status label">Waiting</span>
  }

  renderStatus = type => {
    return  this.props.transactions[type].errorDevice
            ?
              <span className="status label error">Error connecting device</span>
            :
              this.props.transactions[type].rejected
              ?
                <span className="status label error">Rejected</span>
              :
                this.props.transactions[type].requested
                ?
                  <React.Fragment>
                    <span className="status label">Signing transaction</span><Spinner />
                  </React.Fragment>
                :
                  this.props.transactions[type].pending
                  ?
                    <React.Fragment>
                      <span className="status label info">View on Etherscan</span><Spinner />
                    </React.Fragment>
                  :
                    this.props.transactions[type].error
                    ?
                      <span className="status label error">Failed</span>
                    :
                      type === "trade" && (this.props.transactions.trade.amountBuy.eq(-1) || this.props.transactions.trade.amountSell.eq(-1))
                      ?
                        <React.Fragment>
                          <span className="status label info">Confirmed. Loading...</span><Spinner />
                        </React.Fragment>
                      :
                        <span className="status label info">Confirmed</span>
  }

  render() {
    return (
      <section className="frame finalize">
        <div className="heading">
          <h2>Finalize Trade</h2>
        </div>
        <div className="info-box">
          <div className="info-box-row">
            <span className="holder">
              <span className="label">
                Currently Estimated Price
              </span>
              <TokenAmount number={toWei(this.props.system.trade.price)} token={`${this.props.system.trade.priceUnit.toUpperCase()}`} />
            </span>
          </div>
        </div>
        <div className="content">
          {
            this.props.system.trade.txs === 3 &&
            <a
              href={this.props.transactions.hasProxyTx && this.props.transactions.proxy.tx ? `${etherscanUrl(this.props.network.network)}/tx/${this.props.transactions.proxy.tx}` : "#"}
              className={`tx ${(this.props.transactions.hasProxyTx && this.props.transactions.proxy.tx) ? "clickable" : "non-clickable"}`}
              onClick={e => {
                if (!(this.props.transactions.hasProxyTx && this.props.transactions.proxy.tx)) {
                  e.preventDefault();
                  return false;
                }
              }}
              target="_blank" rel="noopener noreferrer">
              <div className="transaction-info-box">
                <div className="operation">
                  <span className={`icon ${this.hasTxCompleted("proxy") ? "success" : ""}`}>
                    <AccountIcon />
                  </span>
                  <span className="label vertical-align">
                    Create Proxy
                    <Attention data-tip data-for="proxy-tooltip" className="attention-icon" />
                    <ReactTooltip className="od-tooltip" effect="solid" id="proxy-tooltip">
                      <p>
                        Proxy is a supporting contract owned by you that groups different actions as one Ethereum transaction.
                      </p>
                    </ReactTooltip>
                  </span>
                  {
                    !this.props.transactions.hasProxyTx
                    ?
                      this.renderInitialStatus(true)
                    :
                      this.renderStatus("proxy")
                  }
                </div>
              </div>
            </a>
          }
          {
            this.props.system.trade.txs >= 2 &&
            <a
              href={this.props.transactions.hasApprovalTx && this.props.transactions.approval.tx ? `${etherscanUrl(this.props.network.network)}/tx/${this.props.transactions.approval.tx}` : "#"}
              className={`tx ${(this.props.transactions.hasApprovalTx && this.props.transactions.approval.tx) ? "clickable" : "non-clickable"}`}
              onClick={(e) => {
                if (!(this.props.transactions.hasApprovalTx && this.props.transactions.approval.tx)) {
                  e.preventDefault();
                  return false;
                }
              }}
              target="_blank" rel="noopener noreferrer">
              <div className="transaction-info-box">
                <div className="operation">
                  <span className={`icon done ${this.hasTxCompleted("approval") ? "success" : ""}`}>
                    <Done/>
                  </span>
                  <span className="label vertical-align">
                    Enable {this.props.tokens[this.props.system.trade.from].symbol} Trading
                    <Attention data-tip data-for="allowance-tooltip" className="attention-icon" />
                    <ReactTooltip className="od-tooltip" effect="solid" id="allowance-tooltip">
                      <p>
                        Enabling token trading allows your Proxy to take tokens from you and trade them on the exchange.
                      </p>
                    </ReactTooltip>
                  </span>
                  {
                    !this.props.transactions.hasApprovalTx
                    ?
                      this.renderInitialStatus(this.props.system.trade.txs <= 2 || (this.props.transactions.proxy.pending === false && this.props.transactions.proxy.error === false))
                    :
                      this.renderStatus("approval")
                  }
                </div>
              </div>
            </a>
          }
          {
            !this.hasTxCompleted("trade")
            ?
              this.props.transactions.hasTradeTx && this.props.transactions.trade.error
              ?
                <div className="transaction-result">
                  <h3 className="heading">
                    <span>Failed to execute trade</span>
                  </h3>
                  <div className="content">
                  <span>
                    <span
                      className="label">Perhaps the market has moved, so your order could not be filled within the</span>
                    <span className="value">
                      {settings.chain[this.props.network.network].threshold[[this.props.system.trade.from, this.props.system.trade.to].sort((a, b) => a > b).join("")]}% slippage limit
                    </span>
                  </span>
                  </div>
                </div>
              :
                <a
                  href={this.props.transactions.hasTradeTx && this.props.transactions.trade.tx ? `${etherscanUrl(this.props.network.network)}/tx/${this.props.transactions.trade.tx}` : "#"}
                  className={`tx ${(this.props.transactions.hasTradeTx && this.props.transactions.trade.tx) ? "clickable" : "non-clickable"}`}
                  onClick={(e) => {
                    if (!(this.props.transactions.hasTradeTx && this.props.transactions.trade.tx)) {
                      e.preventDefault();
                      return false;
                    }
                  }}
                  target="_blank" rel="noopener noreferrer">
                  <div className="transaction-info-box">
                    {
                      this.props.system.trade.from === "eth" && !this.props.system.trade.proxy &&
                      <div className="operation new-proxy">
                        <div className="details">
                        <span className={`icon ${this.hasTxCompleted("trade") ? "success" : ""}`}>
                          <AccountIcon />
                        </span>
                          <span className="label vertical-align">
                          Create Proxy
                          <Attention data-tip data-for="proxy-tooltip" className="attention-icon" />
                          <ReactTooltip className="od-tooltip" effect="solid" id="proxy-tooltip">
                            <p>
                              Proxy is a supporting contract owned by you that groups different actions as one Ethereum transaction.
                            </p>
                          </ReactTooltip>
                        </span>
                          <React.Fragment>
                            {
                              !this.props.transactions.hasTradeTx
                              ?
                                this.renderInitialStatus(this.props.system.trade.txs === 1)
                              :
                                this.renderStatus("trade")
                            }
                          </React.Fragment>
                        </div>
                      </div>
                    }
                    <div className="operation">
                      <div className="details">
                        <span className="icon">{this.props.tokens[this.props.system.trade.from].icon}</span>
                        <span className="label">Sell</span>
                        <span className="value">{this.props.system.trade.operation === "sellAll" ? "" : "~ "}
                          <TokenAmount number={toWei((this.props.system.trade.amountPay.valueOf()))} token={this.props.tokens[this.props.system.trade.from].symbol}/>
                      </span>
                        {
                          (this.props.system.trade.proxy || this.props.system.trade.from !== "eth") &&
                          <React.Fragment>
                            {
                              !this.props.transactions.hasTradeTx
                              ?
                                this.renderInitialStatus(this.props.system.trade.txs === 1)
                              :
                                this.renderStatus("trade")
                            }
                          </React.Fragment>
                        }
                      </div>
                      <div className="details">
                        <span className="icon">{this.props.tokens[this.props.system.trade.to].icon}</span>
                        <span className="label">Buy</span>
                        <span className="value">{this.props.system.trade.operation === "buyAll" ? "" : "~ "}
                          <TokenAmount number={toWei((this.props.system.trade.amountBuy.valueOf()))} token={this.props.tokens[this.props.system.trade.to].symbol} />
                      </span>
                      </div>
                    </div>
                  </div>
                </a>
              :
                <a href={this.props.transactions.hasTradeTx && this.props.transactions.trade.tx ? `${etherscanUrl(this.props.network.network)}/tx/${this.props.transactions.trade.tx}` : "#action"}
                   target="_blank" rel="noopener noreferrer"
                   className="clickable"
                   style={{textDecoration: "none"}} >
                  <Congratulation
                    hasCreatedProxy={!this.props.system.trade.proxy && this.props.system.trade.from === "eth"} //THIS IS A FRICKIN HACK!
                    isCalculatingGas={
                      (typeof this.props.transactions.approval.tx !== "undefined" && typeof this.props.transactions.approval.gasPrice === "undefined")
                      || typeof this.props.transactions.trade.gasPrice === "undefined"
                    }
                    bought={this.props.transactions.trade.amountBuy}
                    sold={this.props.transactions.trade.amountSell}
                    quotation={quotation(this.props.system.trade.from, this.props.system.trade.to)}
                    gas={
                      (
                        typeof this.props.transactions.approval.gasPrice !== "undefined"
                          ? this.props.transactions.approval.gasPrice.times(this.props.transactions.approval.gasUsed)
                          : toBigNumber(0)
                      )
                        .add(
                          this.props.transactions.trade.gasPrice.times(this.props.transactions.trade.gasUsed)
                        )
                    }
                  />
                </a>
          }
        </div>

        <button type="submit" value="Trade again"
                onClick={() => { this.props.system.reset(); this.props.transactions.reset(); } }
                disabled={!this.showTradeAgainButton()}>
          TRADE AGAIN
        </button>
      </section>
    )
  }
}

export default inject("network")(inject("transactions")(inject("system")(observer(DoTrade))));
