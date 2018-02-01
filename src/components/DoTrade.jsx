import React, { Component } from 'react';
import web3 from '../web3';
import { Ether, MKR, DAI } from './Tokens';
import { printNumber, etherscanUrl, wdiv } from '../helpers';

const spinner = (
  <span className="spinner">
     <svg width='10px' height='10px' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid" className="uil-ring-alt">
       <rect x="0" y="0" width="100" height="100" fill="none" className="bk"/>
       <circle cx="50" cy="50" r="40" stroke="#F8F7F5" fill="none" strokeWidth="10" strokeLinecap="round"/>
       <circle cx="50" cy="50" r="40" stroke="#3AB493" fill="none" strokeWidth="6" strokeLinecap="round">
         <animate attributeName="stroke-dashoffset" dur="2s" repeatCount="indefinite" from="0" to="502"/>
         <animate attributeName="stroke-dasharray" dur="2s" repeatCount="indefinite"
                  values="150.6 100.4;1 250;150.6 100.4"/>
       </circle>
     </svg>
  </span>
)

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
      (!this.props.transactions.trade.pending
      || this.props.transactions.trade.error
      || this.props.transactions.trade.rejected));
  }

  hasTwoTransactions = () => {
    return this.props.trade.txs === 2;
  }

  render() {
    return (
      <section className="frame">
        <div className="heading">
          <h3>Finalize Trade</h3>
        </div>
        <div className="info-box">
          <div className="info-box-row">
            <span className="holder">
              <span className="label">
              Current Estimated Price
            </span>
            <span className="value">
              <span>{printNumber(web3.toWei(this.props.trade.amountPay.div(this.props.trade.amountBuy)))} </span>
              <span>{tokens[this.props.trade.from].symbol}/{tokens[this.props.trade.to].symbol}</span>
            </span>
            </span>
          </div>
        </div>
        <div className="transaction-details">
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
                  <img width="10px" height="10px" alt="done" src="/assets/od-icons/od_done.svg" type="svg"/>
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
                    <div className="status">{spinner}<span className="label">Initiating transaction...</span></div>
                  :
                    this.props.transactions.approval.rejected
                    ?
                      <div className="status"><span className="label error">Rejected</span></div>
                    :
                      this.props.transactions.approval.requested
                      ?
                        <div className="status">{spinner}<span className="label info">Signing transaction</span></div>
                      :
                        this.props.transactions.approval.pending
                        ?
                          <div className="status">{spinner}<span className="label info">Pending...</span></div>
                        :
                          this.props.transactions.approval.error
                          ?
                            <div className="status"><span className="label error">Error occurred</span></div>
                          :
                            <div className="status"><span className="label info">Confirmed</span></div>
                }
              </div>
            </a>
          }
          {
            this.hasTwoTransactions() &&
            <div className="arrow-separator">
              <img alt="arrow" src="/assets/od-icons/od_arrow.svg"/>
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
                <img width="10px" height="10px" alt="done" src="/assets/od-icons/od_done.svg" type="svg"/>
              </span>
            </span>
              <div>
                <div className="operation">
                  <span className="icon">{tokens[this.props.trade.from].icon}</span>
                  <div className="details">
                    <span className="label">Selling</span>
                    <span
                      className="value">{this.props.trade.operation === 'sellAll' ? '' : '~ '}{printNumber(web3.toWei((this.props.trade.amountPay.valueOf())))} {tokens[this.props.trade.from].symbol}</span>
                  </div>
                </div>
                <div className="operation">
                  <span className="icon">{tokens[this.props.trade.to].icon}</span>
                  <div className="details">
                    <span className="label">Buying</span>
                    <span
                      className="value">{this.props.trade.operation === 'buyAll' ? '' : '~ '}{printNumber(web3.toWei((this.props.trade.amountBuy.valueOf())))} {tokens[this.props.trade.to].symbol}</span>
                  </div>
                </div>
              </div>
              {
                typeof this.props.transactions.trade === 'undefined'
                ?
                  this.props.trade.txs === 1
                  ?
                    <div className="status">{spinner}<span className="label">initiating transaction</span></div>
                  :
                    <div className="status">{spinner}<span className="label">Waiting for approval</span></div>
                :
                  this.props.transactions.trade.rejected
                  ?
                    <div className="status"><span className="label error">Rejected</span></div>
                  :
                    this.props.transactions.trade.requested
                    ?
                      <div className="status">{spinner}<span className="label">Signing transaction</span></div>
                    :
                      this.props.transactions.trade.pending
                      ?
                        <div className="status">{spinner}<span className="label info">Pending...</span></div>
                      :
                        this.props.transactions.trade.error
                        ?
                          <div className="status"><span className="label error">Error occurred</span></div>
                        :
                          this.props.transactions.trade.amountBuy.eq(-1) || this.props.transactions.trade.amountSell.eq(-1)
                          ?
                            <div className="status"><span className="label info">{spinner}Confirmed, loading trade data...</span></div>
                          :
                            <div className="status"><span className="label info">Completed</span></div>
              }
              </a>
            </div>
        </div>
        {
          !this.hasTxCompleted('trade')
            ?
              <div className="info-box info-box--no-borders" style={{marginTop: 'auto'}}>
                <div className="info-box-row info-box-row--left">
                <span className="icon" style={{'height': '18px'}}>
                  <img width="18px" height="18px" alt="alert icon" src="/assets/od-icons/od_alert.svg"/>
                </span>
                  <span className="label">
                  Each trading pair requires a one-time transaction per Ether address to be enabled for trading.
                </span>
                </div>
                <div className="info-box-row info-box-row--left">
                <span className="icon" style={{'height': '18px'}}>
                  <img width="18px" height="18px" alt="alert icon" src="/assets/od-icons/od_alert.svg"/>
                </span>
                  <span className="label">
                  Need help? Contact us on <a href="http://chat.makerdao.com">chat.makerdao.com</a>
                </span>
                </div>
              </div>
            :
              <div className="info-box info-box--no-borders congratulations" style={{marginTop: 'auto'}}>
                <div className="info-box-row info-box-row--left">
                  <h3 className="heading">
                    Congratulations!
                  </h3>
                </div>
                <div className="info-box-row info-box-row--left">
                <span className="icon" style={{'height': '18px'}}>
                  <img width="18px" height="18px" alt="alert icon" src="/assets/od-icons/od_finalized.svg"/>
                </span>
                <span>
                  <span className="label">You successfully bought</span>
                  <span className="value">
                    <span>{printNumber(this.props.transactions.trade.amountBuy)} {this.props.trade.to.toUpperCase()}</span>
                  </span>
                  <span className="label">&nbsp;with</span>
                  <span className="value">
                    <span>{printNumber(this.props.transactions.trade.amountSell)} {this.props.trade.from.toUpperCase()}</span>
                  </span>
                  <span className="label">&nbsp;at</span>
                  <span className="value">
                    <span>
                      {printNumber(wdiv(this.props.transactions.trade.amountSell, this.props.transactions.trade.amountBuy))}&nbsp;
                      {this.props.trade.from.toUpperCase()}/{this.props.trade.to.toUpperCase()}
                    </span>
                  </span>
                  <span className="label">&nbsp;by paying</span>
                  <span className="value">
                  {
                    (typeof this.props.transactions.approval !== 'undefined' && typeof this.props.transactions.approval.gasPrice === 'undefined') || typeof this.props.transactions.trade.gasPrice === 'undefined'
                      ? <span>{spinner}</span>
                      : printNumber((typeof this.props.transactions.approval !== 'undefined'
                        ? this.props.transactions.approval.gasPrice.times(this.props.transactions.approval.gasUsed)
                        : web3.toBigNumber(0)).add(this.props.transactions.trade.gasPrice.times(this.props.transactions.trade.gasUsed)))
                  } ETH&nbsp;
                  </span>
                  <span className="label">
                    gas cost
                  </span>
                </span>
              </div>
          </div>
        }
        <div>
          <button type="submit" value="Trade again" className="start"
                  onClick={this.props.reset}
                  disabled={!this.showTradeAgainButton()}>
            TRADE AGAIN
          </button>
        </div>
      </section>

    )
  }
}

export default DoTrade;
