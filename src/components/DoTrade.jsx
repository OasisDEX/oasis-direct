import React, { Component } from 'react';
import { Ether, MKR, DAI, Done, AccountIcon } from './Icons';
import Spinner from './Spinner';
import TokenAmount from './TokenAmount';
import Congratulation from './Congratulation';
import { etherscanUrl, toBigNumber, toWei } from '../helpers';

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
    return (typeof this.props.transactions.proxy !== 'undefined' &&
      (this.props.transactions.proxy.error || this.props.transactions.proxy.rejected)) ||
      (typeof this.props.transactions.approval !== 'undefined' &&
        (this.props.transactions.approval.error || this.props.transactions.approval.rejected)) ||
      (typeof this.props.transactions.trade !== 'undefined' &&
        !this.props.transactions.trade.requested &&
        (this.hasTxCompleted('trade')
          || this.props.transactions.trade.error
          || this.props.transactions.trade.rejected));
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
              Current Estimated Price
              </span>
              <TokenAmount number={toWei(this.props.trade.price)}
                             token={`${this.props.trade.priceUnit.toUpperCase()}`}/>
            </span>
          </div>
        </div>
        <div className="content">
          {
            this.props.trade.txs === 3 &&
            <a
              href={typeof this.props.transactions.proxy !== 'undefined' && this.props.transactions.proxy.tx ? `${etherscanUrl(this.props.network)}/tx/${this.props.transactions.proxy.tx}` : '#'}
              onClick={(e) => {
                if (typeof this.props.transactions.proxy === 'undefined' || !this.props.transactions.proxy.tx) {
                  e.preventDefault();
                  return false;
                }
              }}
              className={typeof this.props.transactions.proxy === 'undefined' || !this.props.transactions.proxy.tx ? 'no-pointer' : ''}
              target="_blank" rel="noopener noreferrer">
              <div className="transaction-info-box">
                <div className="operation">
                  <span className={`icon ${this.hasTxCompleted('proxy') ? 'success' : ''}`}>
                    <AccountIcon/>
                  </span>
                  <span className="label">Create Account</span>
                  {
                    typeof this.props.transactions.proxy === 'undefined'
                      ?
                      <React.Fragment>
                        <span className="status label">Initiating transaction...</span><Spinner/>
                      </React.Fragment>
                      :
                      this.props.transactions.proxy.rejected
                        ?
                        <span className="status label error">Rejected</span>
                        :
                        this.props.transactions.proxy.requested
                          ?
                          <React.Fragment>
                            <span className="status label info">Sign transaction</span><Spinner/>
                          </React.Fragment>
                          :
                          this.props.transactions.proxy.pending
                            ?
                            <React.Fragment>
                              <span className="status label info">View on Etherscan</span><Spinner/>
                            </React.Fragment>
                            :
                            this.props.transactions.proxy.error
                              ?
                              <span className="status label error">Failed</span>
                              :
                              <span className="status label info">Confirmed</span>
                  }
                </div>
              </div>
            </a>
          }
          {
            this.props.trade.txs >= 2 &&
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
              <div className="transaction-info-box">
                <div className="operation">
                  <span className={`icon done ${this.hasTxCompleted('approval') ? 'success' : ''}`}>
                    <Done/>
                  </span>
                  <span className="label"> Enable {tokens[this.props.trade.from].symbol} Trading</span>
                  {
                    typeof this.props.transactions.approval === 'undefined'
                      ?
                      this.props.trade.txs <= 2 || (/*typeof this.props.transactions.proxy.pending !== 'undefined' && */this.props.transactions.proxy.pending === false && this.props.transactions.proxy.error === false)
                        ?
                        <React.Fragment>
                          <span className="status label">Initiating transaction</span>
                          <Spinner/>
                        </React.Fragment>
                        :
                        <React.Fragment>
                          <span className="status label">Waiting</span>
                        </React.Fragment>
                      :
                      this.props.transactions.approval.rejected
                        ?
                        <span className="status label error">Rejected</span>
                        :
                        this.props.transactions.approval.requested
                          ?
                          <React.Fragment>
                            <span className="status label info">Signing transaction</span><Spinner/>
                          </React.Fragment>
                          :
                          this.props.transactions.approval.pending
                            ?
                            <React.Fragment>
                              <span className="status label info">View on Etherscan</span><Spinner/>
                            </React.Fragment>
                            :
                            this.props.transactions.approval.error
                              ?
                              <span className="status label error">Failed</span>
                              :
                              <span className="status label info">Confirmed</span>
                  }
                </div>
              </div>
            </a>
          }
          {
            this.props.trade.from === 'eth' && !this.props.trade.proxy &&
            <div className="transaction-info-box collapse">
              <div className="operation">
                <div className="details">
                      <span className={`icon ${this.hasTxCompleted('trade') ? 'success' : ''}`}>
                        <AccountIcon/>
                      </span>
                  <span className="label">Create Account</span>
                  <React.Fragment>
                    {
                      typeof this.props.transactions.trade === 'undefined'
                        ?
                        this.props.trade.txs === 1
                          ?
                          <React.Fragment>
                            <span className="status label">Initiating transaction</span><Spinner/>
                          </React.Fragment>
                          :
                          <React.Fragment>
                            <span className="status label">Waiting</span>
                          </React.Fragment>
                        :
                        this.props.transactions.trade.rejected
                          ?
                          <React.Fragment>
                            <span className="status label error">Rejected</span>
                          </React.Fragment>
                          :
                          this.props.transactions.trade.requested
                            ?
                            <React.Fragment>
                              <span className="status label">Signing transaction</span><Spinner/>
                            </React.Fragment>
                            :
                            this.props.transactions.trade.pending
                              ?
                              <React.Fragment>
                                <span className="status label info">View on Etherscan</span><Spinner/>
                              </React.Fragment>
                              :
                              this.props.transactions.trade.error
                                ?
                                <span className="status label error">Failed</span>
                                :
                                this.props.transactions.trade.amountBuy.eq(-1) || this.props.transactions.trade.amountSell.eq(-1)
                                  ?
                                  <React.Fragment>
                                      <span className="status label info">Loading data...</span><Spinner/>
                                  </React.Fragment>
                                  :
                                  <span className="status label info">Confirmed</span>
                    }
                  </React.Fragment>
                </div>
              </div>
            </div>
          }
          {
            !this.hasTxCompleted('trade') &&
            <div className="transaction-info-box">
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
                <div className="operation">
                  <div className="details">
                    <span className="icon">{tokens[this.props.trade.from].icon}</span>
                    <span className="label">Sell</span>
                    <span className="value">{this.props.trade.operation === 'sellAll' ? '' : '~ '}
                      <TokenAmount number={toWei((this.props.trade.amountPay.valueOf()))}
                                   token={tokens[this.props.trade.from].symbol}/>
                    </span>
                    {
                      ((this.props.trade.proxy && this.props.trade.txs === 1) || this.props.trade.txs > 1) &&
                      <React.Fragment>
                        {
                          typeof this.props.transactions.trade === 'undefined'
                            ?
                            this.props.trade.txs === 1
                              ?
                              <React.Fragment>
                                <span className="status label">Initiating transaction</span><Spinner/>
                              </React.Fragment>
                              :
                              <React.Fragment>
                                <span className="status label">Waiting</span>
                              </React.Fragment>
                            :
                            this.props.transactions.trade.rejected
                              ?
                              <React.Fragment>
                                <span className="status label error">Rejected</span>
                              </React.Fragment>
                              :
                              this.props.transactions.trade.requested
                                ?
                                <React.Fragment>
                                  <span className="status label">Signing transaction</span><Spinner/>
                                </React.Fragment>
                                :
                                this.props.transactions.trade.pending
                                  ?
                                  <React.Fragment>
                                    <span className="status label info">View on Etherscan</span><Spinner/>
                                  </React.Fragment>
                                  :
                                  this.props.transactions.trade.error
                                    ?
                                    <span className="status label error">Failed</span>
                                    :
                                    this.props.transactions.trade.amountBuy.eq(-1) || this.props.transactions.trade.amountSell.eq(-1)
                                      ?
                                      <React.Fragment>
                                      <span
                                        className="status label info">Loading data...</span><Spinner/>
                                      </React.Fragment>
                                      :
                                      <React.Fragment/>
                        }
                      </React.Fragment>
                    }
                  </div>
                  <div className="details">
                    <span className="icon">{tokens[this.props.trade.to].icon}</span>
                    <span className="label">Buy</span>
                    <span className="value">{this.props.trade.operation === 'buyAll' ? '' : '~ '}
                      <TokenAmount number={toWei((this.props.trade.amountBuy.valueOf()))}
                                   token={tokens[this.props.trade.to].symbol}/>
                    </span>
                  </div>
                </div>
              </a>
            </div>
          }
          {
            !this.hasTxCompleted('trade')
              ? this.props.transactions.trade && this.props.transactions.trade.error
              ? <div className="transaction-result">
                <h3 className="heading">
                  <span>Failed to execute trade</span>
                </h3>
                <div className="content">
                <span>
                  <span
                    className="label">Perhaps the market has moved, so your order could not be filled within the</span>
                  <span className="value">
                    {settings.chain[this.props.network].threshold[[this.props.trade.from, this.props.trade.to].sort((a, b) => a > b).join('')]}% impact limit
                  </span>
                </span>
                </div>
              </div>
              : <React.Fragment/>
              : <Congratulation hasStatus={((this.props.trade.proxy && this.props.trade.txs === 1) || this.props.trade.txs > 1)}
                                isCalculatingGas={
                                  (typeof this.props.transactions.approval !== 'undefined' && typeof this.props.transactions.approval.gasPrice === 'undefined')
                                  || typeof this.props.transactions.trade.gasPrice === 'undefined'
                                }
                                bought={this.props.transactions.trade.amountBuy}
                                sold={this.props.transactions.trade.amountSell}
                                base={this.props.trade.to}
                                quote={this.props.trade.from}
                                gas={
                                  (
                                    typeof this.props.transactions.approval !== 'undefined'
                                      ? this.props.transactions.approval.gasPrice.times(this.props.transactions.approval.gasUsed)
                                      : toBigNumber(0)
                                  )
                                    .add(
                                      this.props.transactions.trade.gasPrice.times(this.props.transactions.trade.gasUsed)
                                    )
                                }
              />
          }
        </div>

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
