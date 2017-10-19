import React, { Component } from 'react';

class SetTrade extends Component {

  tokenPicker = (name) => {
    return(
      <select ref={ (input) => this[name] = input }>
        <option value="eth">Ether</option>
        <option value="mkr">Maker</option>
        <option value="sai">Sai</option>
      </select>
    )
  }

  nextStep = (e) => {
    e.preventDefault();
    this.props.goToDoTradeStep();
    return false;
  }

  calculateBuyAmount = () => {
    this.props.calculateBuyAmount(this.from.value, this.to.value, this.amountPay.value);
  }

  calculatePayAmount = () => {
    this.props.calculatePayAmount(this.from.value, this.to.value, this.amountBuy.value);
  }

  render() {
    return (
      <div>
        <h2>Choose which Assets to trade</h2>
        <form onSubmit={ this.nextStep }>
          <div>
            <div>
              { this.tokenPicker('from') }
              { this.tokenPicker('to') }
            </div>
            <input type="number" ref={ (input) => this.amountPay = input } value={ this.props.trade.amountPay } onChange={ this.calculateBuyAmount } />
            <input type="number" ref={ (input) => this.amountBuy = input } value={ this.props.trade.amountBuy } onChange={ this.calculatePayAmount } />
          </div>
          <div>
            {
              this.props.trade.amountPay.gt(0) && this.props.trade.amountBuy.gt(0)
              ? `Price: ${this.props.trade.amountPay.div(this.props.trade.amountBuy).valueOf()}`
              : ''
            }
          </div>
          <div>
            {
              this.props.trade.txCost.gt(0)
              ? `Tx cost: ${this.props.trade.txCost.valueOf()}`
              : ''
            }
          </div>
          <input type="submit" value="Start transaction" />
        </form>
      </div>
    )
  }
}

export default SetTrade;
