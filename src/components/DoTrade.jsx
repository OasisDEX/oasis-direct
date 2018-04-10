import React, { Component } from 'react';
import { isMetamask } from '../blockchainHandler';
import { Ether, MKR, DAI, Arrow, Attention, QuestionMark, Finalized, Done, Failed } from './Icons';
import Spinner from './Spinner';
import TokenAmount from './TokenAmount'
import { etherscanUrl, wdiv, toBigNumber, toWei } from '../helpers';

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

  render() {
    const metamask = isMetamask();
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
                           token= {`${tokens[this.props.trade.from].symbol}/${tokens[this.props.trade.to].symbol}`}/>
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
