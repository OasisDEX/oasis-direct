import React, { Component } from 'react';
import TradeWidget from './TradeWidget';
// import TaxWidget from './TaxWidget';

import Wallets from './Wallets';
import LockedAccount from './LockedAccount';
import { isAddress } from '../helpers';
import HardWallet from "./HardWallet";

class Widget extends Component {
  render() {
    return (
      <div className={`Widget ${this.props.section}`}>
        {
          this.props.hw.showModal
            ? <HardWallet loadingAddress={this.props.loadingAddress}
                          hw={this.props.hw}
                          onBack={this.props.showClientChoice}
                          loadHWAddresses={this.props.loadHWAddresses}
                          selectHWAddress={this.props.selectHWAddress}
                          importAddress={this.props.importAddress}/>
            : !this.props.isConnected || this.props.loadingFirstAddress
            ? <Wallets setWeb3WebClient={this.props.setWeb3WebClient} showHW={this.props.showHW} loadingAddress={this.props.loadingAddress} />
            : this.props.account && isAddress(this.props.account)
              ? <div>
                {
                  // this.props.section === 'tax-exporter'
                  //   ?
                  //   <TaxWidget account={this.props.account}
                  //              network={this.props.network} />
                  //   :
                    <TradeWidget network={this.props.network}
                                 loadingAddress={this.props.loadingAddress}
                                 account={this.props.account}
                                 proxy={this.props.proxy}
                                 trade={this.props.trade}
                                 balances={this.props.balances}
                                 showTxMessage={this.props.showTxMessage}
                                 transactions={this.props.transactions}
                                 setMainState={this.props.setMainState}
                                 fasterGasPrice={this.props.fasterGasPrice}
                                 doTrade={this.props.doTrade}
                                 reset={this.props.reset}
                                 calculateBuyAmount={this.props.calculateBuyAmount}
                                 calculatePayAmount={this.props.calculatePayAmount}
                                 cleanInputs={this.props.cleanInputs}
                                 showHW={this.props.showHW}
                                 onDisconnect = {this.props.showClientChoice}/>

                }
              </div>
              // Create a decorator Component that returns a component which is wrapped into element with only back function passed as argument
              : <LockedAccount onBack={this.props.showClientChoice}/>
        }
      </div>
    )
  }
}

export default Widget;
