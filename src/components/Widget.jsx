import React, { Component } from 'react';
import { connect } from 'react-redux';
import TradeWidget from './TradeWidget';

import Wallets from './Wallets';
import LockedAccount from './LockedAccount';
import { isAddress } from '../helpers';
import HWSetup from "./HWSetup";
import { actions as hwActions } from "../handlers/HardWallet";
import bindActionCreators from "redux/src/bindActionCreators";

class Widget extends Component {

  showClientChoice = () => {
    this.props.showClientChoice();
    this.props.resetSetup();
  };

  render() {
    return (
      <div className={`Widget ${this.props.section}`}>
        {
          this.props.hw.showModal
            ? <HWSetup onClose={this.showClientChoice}/>
            : !this.props.isConnected || this.props.loadingFirstAddress
            ? <Wallets setWeb3WebClient={this.props.setWeb3WebClient} showHW={this.props.showHW}
                       loadingAddress={this.props.loadingAddress}/>
            : this.props.account && isAddress(this.props.account)
              ? <div>
                {
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
                               onDisconnect={this.props.showClientChoice}/>

                }
              </div>
              // Create a decorator Component that returns a component which is wrapped into element with only back function passed as argument
              : <LockedAccount onBack={this.props.showClientChoice}/>
        }
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {...state};
};

const mapDispatchToProps = dispatch => ({
  ...bindActionCreators(hwActions, dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(Widget);
