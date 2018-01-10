import React, { Component } from 'react';
import { numberFormat } from "../utils/functions";
import { Ether, MKR, DAI } from "./Tokens";

//TODO: make this bound to the token selector.
const tokens = {
  'eth': {
    icon: <Ether/>,
    name: "Ether"
  },
  'mkr': {
    icon: <MKR/>,
    name: "Maker"
  },
  'dai': {
    icon: <DAI/>,
    name: "DAI"
  },
}


class SetTrade extends Component {
  constructor(props) {
    super(props);
    this.state = {
      from: this.props.trade.from,
      to: this.props.trade.to,
      selectedToken: null,
      shouldDisplayTokenSelector: false
    }
  }

  //Whether it's 'from' or 'to'. Probably better name should be chosen
  pickToken = (tokenType) => {
    this.setState({shouldDisplayTokenSelector: true, selectedToken: tokenType});
    this.props.cleanInputs();
  }

  select = (token) => {
    this.setState({ [this.state.selectedToken]: token, shouldDisplayTokenSelector: false });
    localStorage.setItem(this.state.selectedToken, token);
  }

  swapTokens = () => {
    this.setState({ from: this.state.to, to: this.state.from }, () => {
      localStorage.setItem('from', this.state.from);
      localStorage.setItem('to', this.state.to);
      this.props.cleanInputs();
    });
  }

  nextStep = e => {
    e.preventDefault();
    this.props.goToDoTradeStep();
    return false;
  }

  calculateBuyAmount = () => {
    // console.log(this.state.from, this.state.to);
    this.props.calculateBuyAmount(this.state.from, this.state.to, this.amountPay.value);
  }

  calculatePayAmount = () => {
    this.props.calculatePayAmount(this.state.from, this.state.to, this.amountBuy.value);
  }

  hasDetails = () => {
    return this.props.trade.amountPay.gt(0) && this.props.trade.amountBuy.gt(0) && this.props.trade.txCost.gt(0)
  }

  render() {
    return (
      <section className="frame">
        <div className="heading">
          <h3>Choose which Assets to trade</h3>
        </div>
        <div className="info-box">
          <img width="14px" height="14px" alt="alert icon" src="/assets/od-icons/od_alert.svg"/>
          <span className="label">
            Order details are estimations and may vary
          </span>
          <span className="value">
            5%
          </span>
        </div>
        {
          this.state.shouldDisplayTokenSelector
            ? (<div className="token-selector">
              <div className="frame">
                <button className="close" onClick={() => this.setState({shouldDisplayTokenSelector: false})}/>
                <div className="tokens">
                  {
                    ['eth', 'mkr', 'dai'].map((token, index) => {
                      return (
                        <div key={index} className="token" onClick={() => {
                          this.select(token)
                        }}>
                          <span>{tokens[token].icon}</span>
                          <span className="token-name">{tokens[token].name}</span>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>)
            : null
        }

        <form onSubmit={this.nextStep}>
          <div>
            <div className='selected-token '>
              <div className="token" onClick={() => {
                this.pickToken('from')
              }}>
                {tokens[this.state.from].icon}
              </div>
              <div>
                {/*TODO: Find a way to delegate / handle errors*/}
                <div className="trade-errors">
                  Insufficient funds
                </div>
                <input type="number" ref={(input) => this.amountPay = input}
                       value={this.props.trade.amountPayInput || ''}
                       onChange={this.calculateBuyAmount} placeholder="deposit amount"/>
              </div>
            </div>
            <div className='separator'>
              <img alt="arrows" src='/assets/od-icons/od_swap_arrow.svg' className="swap-tokens" onClick={ this.swapTokens } />
            </div>
            <div className='selected-token '>
              <div className="token" onClick={() => {
                this.pickToken('to');
              }}>
                {tokens[this.state.to].icon}
              </div>
              <div>
                <div className="trade-errors">
                  Insufficient funds
                </div>
                <input type="number" ref={(input) => this.amountBuy = input}
                       value={this.props.trade.amountBuyInput || ''}
                       onChange={this.calculatePayAmount} placeholder="receive amount"/>
              </div>
            </div>
          </div>
          <div className={`trade-details ${this.hasDetails() ? '' : 'trade-details--hidden'}`}>
            <span>
              <span className='value'>OasisDex</span>
            </span>
            <span>
              <span className="label">Price </span>
              <span className='value'>
                ~ {numberFormat(this.props.trade.amountPay.div(this.props.trade.amountBuy).valueOf())} ETH
              </span>
            </span>
            <span>
              <span className="label">Fee </span>
              <span className='value'>
                ~ {numberFormat(this.props.trade.txCost.valueOf())} ETH
              </span>
            </span>
          </div>
          <button type="submit" value="Start transaction">START TRANSACTION</button>
        </form>
      </section>
    )
  }
}

export default SetTrade;
