import React, { Component } from 'react';
import TradeWidget from './TradeWidget';
import TaxWidget from './TaxWidget';

import NoConnection from './NoConnection';
import NoAccount from './NoAccount';
import {isAddress} from '../helpers';


class Widget extends Component {
  render() {
    return (
      <div className="Widget">
        {
          this.props.isConnected
          ?
            this.props.account && isAddress(this.props.account)
            ?
              <div>
                {
                  this.props.section === 'tax-exporter'
                  ?
                    <TaxWidget account={this.props.account}
                               network={this.props.network}
                               getProxy={this.props.getProxy} />
                  :
                    <TradeWidget network={this.props.network}
                                 account={this.props.account}
                                 proxy={this.props.proxy}
                                 trade={this.props.trade}
                                 balances={this.props.balances}
                                 showTxMessage={this.props.showTxMessage}
                                 transactions={this.props.transactions}
                                 setMainState={this.props.setMainState}
                                 fasterGasPrice={this.props.fasterGasPrice}
                                 doTrade={this.props.doTrade}
                                 reset={this.props.reset} />
                }
              </div>
            :
              <NoAccount/>
          :
            <NoConnection/>
        }
      </div>
    )
  }
}

export default Widget;
