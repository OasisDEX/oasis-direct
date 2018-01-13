import React, { Component } from 'react';
import web3 from '../web3';
import { Ether, MKR, DAI } from './Tokens';
import { printNumber } from '../helpers';

const spinner = (
  <svg width='10px' height='10px' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" className="uil-ring-alt">
    <rect x="0" y="0" width="100" height="100" fill="none" className="bk"/>
    <circle cx="50" cy="50" r="40" stroke="#F8F7F5" fill="none" strokeWidth="10" strokeLinecap="round"/>
    <circle cx="50" cy="50" r="40" stroke="#3AB493" fill="none" strokeWidth="6" strokeLinecap="round">
      <animate attributeName="stroke-dashoffset" dur="2s" repeatCount="indefinite" from="0" to="502"/>
      <animate attributeName="stroke-dasharray" dur="2s" repeatCount="indefinite" values="150.6 100.4;1 250;150.6 100.4"/>
    </circle>
  </svg>
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

  render() {
    return (
      <section className="frame">
        <div className="heading">
          <h3>Finalize Trade</h3>
        </div>
        <div className="info-box">
          <span className="label">
            Current estimated price
          </span>
          <span className="value">
            <span>{printNumber(web3.toWei(this.props.trade.amountPay.div(this.props.trade.amountBuy)))} </span>
            <span>{tokens[this.props.trade.from].symbol}/{tokens[this.props.trade.to].symbol}</span>
          </span>
        </div>
        <div className="transaction-info-box">
          <div className="operation">
            {tokens[this.props.trade.from].icon}
            <div className="details">
              <span className="label"> Approving</span>
              <span
                className="value"> {printNumber(web3.toWei((this.props.trade.amountPay.valueOf())))} {tokens[this.props.trade.from].symbol}</span>
            </div>
          </div>
          <div className="status">
            {spinner}
            <span className="label">sign transaction</span>
          </div>
        </div>
        <div className="arrow-separator">
          <img alt="arrow" src="/assets/od-icons/od_arrow.svg"/>
        </div>
        {/*Depositing&nbsp;w*/}
        {/*{this.props.trade.operation === 'sellAll' ? '=' : '=~'}&nbsp;*/}
        {/*{this.props.trade.amountPay.valueOf()} {tokens[this.props.trade.from].symbol} -&nbsp;*/}
        {/*Buying&nbsp;*/}
        {/*{this.props.trade.operation === 'buyAll' ? '=' : '=~'}&nbsp;*/}
        {/*{this.props.trade.amountBuy.valueOf()} {tokens[this.props.trade.to].symbol}*/}
        <div className="transaction-info-box">
          <div className="operation">
            {tokens[this.props.trade.to].icon}
            <div className="details">
              <span className="label"> Buying</span>
              <span
                className="value"> {printNumber(web3.toWei((this.props.trade.amountBuy.valueOf())))} {tokens[this.props.trade.to].symbol}</span>
            </div>
          </div>
          <div className="status">
            {spinner}
            <span className="label">sign transaction</span>
          </div>
        </div>
        <div className="footer contact">
          Need help? Contact us on <a href="http://chat.makerdao.com">chat.makerdao.com</a>
        </div>
      </section>

    )
  }
}

export default DoTrade;
