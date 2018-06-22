
import React, { Component } from 'react';
import SetTrade from './SetTrade';
import DoTrade from './DoTrade';

class TradeWidget extends Component {
  render() {
    return (
      <div style={ {position: 'relative'} }>
        {
          this.props.trade.step === 1
            ?
            <SetTrade network={this.props.network}
                      account={this.props.account}
                      loadingAddress={this.props.loadingAddress}
                      proxy={this.props.proxy}
                      setMainState={this.props.setMainState}
                      fasterGasPrice={this.props.fasterGasPrice}
                      doTrade={this.props.doTrade}
                      trade={this.props.trade}
                      balances={this.props.balances}
                      calculateBuyAmount={this.props.calculateBuyAmount}
                      calculatePayAmount={this.props.calculatePayAmount}
                      cleanInputs={this.props.cleanInputs}
                      showHW={this.props.showHW}
                      onDisconnect={this.props.onDisconnect} />
            :
            <DoTrade network={this.props.network}
                      account={this.props.account}
                      proxy={this.props.proxy}
                      trade={this.props.trade}
                      transactions={this.props.transactions}
                      setMainState={this.props.setMainState}
                      fasterGasPrice={this.props.fasterGasPrice}
                      reset={this.props.reset}
                      showTxMessage={this.props.showTxMessage} />
        }
      </div>
    )
  }
}

export default TradeWidget;