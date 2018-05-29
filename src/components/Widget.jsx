import React, { Component } from 'react';
import TradeWidget from './TradeWidget';
import TaxWidget from './TaxWidget';

import Web3ClientChoice from './Wallets';
import LockedAccount from './LockedAccount';
import { isAddress } from '../helpers';
import HardWallet from "./HardWallet";
import { isAccountLocked } from "../blockchainHandler";

class Widget extends Component {
  render() {
    return (
      <div className="Widget">
        {
          isAccountLocked()

            ? <LockedAccount/>
            : this.props.hw.showModal

              ? <HardWallet hw={this.props.hw}
                            onBack={this.props.showClientChoice}
                            loadHWAddresses={this.props.loadHWAddresses}
                            selectHWAddress={this.props.selectHWAddress}
                            importAddress={this.props.importAddress}/>
              : !this.props.isConnected

                ? <Web3ClientChoice setWeb3WebClient={this.props.setWeb3WebClient} showHW={this.props.showHW}/>
                : this.props.account && isAddress(this.props.account)

                  ? <div>
                  {
                    this.props.section === 'tax-exporter'
                      ?
                      <TaxWidget account={this.props.account}
                                 network={this.props.network}
                                 getProxy={this.props.getProxy}/>
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
                                   reset={this.props.reset}
                                   calculateBuyAmount={this.props.calculateBuyAmount}
                                   calculatePayAmount={this.props.calculatePayAmount}
                                   cleanInputs={this.props.cleanInputs}/>
                  }
                </div>
                  : <LockedAccount/>
        }
      </div>
    )
  }
}

export default Widget;