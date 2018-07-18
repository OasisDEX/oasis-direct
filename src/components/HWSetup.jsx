import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Circle, BackIcon } from "./Icons";
import { actions } from '../handlers/HardWallet';
import AddressList from './AddressList'
import HWConnectivity from "./HWConnectivity";

const settings = require('../settings');

const hwNameStyle = {
  textTransform: "capitalize"
}
class HardWallet extends React.Component {

  connect = () => {
    const device = this.props.hw.option;
    this.waitForDeviceToConnect(device, this.derivationPathOf(device));
  }

  derivationPathOf = (device) => device === 'ledger' ? "m/44'/60'/0'" : "m/44'/60'/0'/0";

  waitForDeviceToConnect = (device, derivationPath) => {
    this.props.loadAddresses(device, settings.hwNetwork, 100, derivationPath);
  };

  render() {
    if (this.props.hw.addresses.length > 0) {
      return (
        <section className='frame hard-wallet-addresses'>
          <div className="heading">
            <h2>Select Address on your <span style={hwNameStyle}>{this.props.hw.option}</span></h2>
          </div>
          <div className="content">
            <button className="close" onClick={this.props.onClose}/>
            <AddressList onUnlock={this.props.selectAddress} addresses={this.props.hw.addresses}/>
          </div>
        </section>
      )
    } else {
      return (
        <section className='frame hard-wallet'>
          <button className="back" onClick={this.props.onClose}>
            <Circle><BackIcon/></Circle>
          </button>
          <div className="heading">
            <h2>Connect your <span style={hwNameStyle}>{this.props.hw.option}</span> Wallet</h2>
          </div>
          <div className="content">
            <HWConnectivity device={this.props.hw.option}
                            connect={this.connect}
                            retry={this.connect}
                            hasError={this.props.hw.hasError}/>
          </div>
        </section>
      )
    }
  }
}

const mapStateToProps = (state) => ({
  hw: state.hw
});

const mapDispatchToProps = (dispatch) => ({...bindActionCreators(actions, dispatch)});

export default connect(mapStateToProps, mapDispatchToProps)(HardWallet);
