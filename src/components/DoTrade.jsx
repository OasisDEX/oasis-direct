import React, { Component } from 'react';

class DoTrade extends Component {

  token = (key) => {
    const tokens = {
      'eth': 'Ether',
      'mkr': 'Maker',
      'sai': 'Sai'
    };
    return tokens[key];
  }

  render() {
    return (
      <div>
        <h2>Executing transactions...</h2>
        <div>
          Depositing&nbsp;
          { this.props.trade.operation === 'sellAll' ? '=' : '=~' }&nbsp;
          { this.props.trade.amountPay.valueOf() } { this.token(this.props.trade.from) } -&nbsp;
          Buying&nbsp;
          { this.props.trade.operation === 'buyAll' ? '=' : '=~' }&nbsp;
          { this.props.trade.amountBuy.valueOf() } { this.token(this.props.trade.to) }
        </div>
      </div>
    )
  }
}

export default DoTrade;
