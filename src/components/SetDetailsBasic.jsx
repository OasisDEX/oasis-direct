import React, { Component } from 'react';
import web3 from  '../web3';

class SetDetailsBasic extends Component {

  token = (key) => {
    const tokens = {
      'eth': 'Ether',
      'weth': 'WEther',
      'mkr': 'Maker',
      'sai': 'Sai'
    };
    return tokens[key];
  }

  calculateBuyAmount = () => {
    this.props.calculateBuyAmount(this.props.from, this.props.to, this.amount.value);
  }

  render() {
    return (
      <div>
        <h2>Enter Order Details</h2>
        <form onSubmit={ this.nextStep }>
          <div>
            { this.token(this.props.from) }
            <input type="number" ref={ (input) => this.amount = input } onBlur={ this.calculateBuyAmount } />
            { this.token(this.props.to) }
            <input type="number" disabled="true" value={ this.props.amountBuy } />
          </div>
          <input type="submit" value="Continue" />
        </form>
      </div>
    )
  }
}

export default SetDetailsBasic;
