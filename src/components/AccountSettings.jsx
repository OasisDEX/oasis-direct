import React from 'react';
import {
  IdentityIcon, BackIcon, Circle,
} from './Icons';
import TokenAmount from './TokenAmount';
import * as Blockchain from "../blockchainHandler";
import { etherscanAddress } from '../helpers';

class AccountSettings extends React.Component {
  render() {
    return (
      <div className="frame">
        <div className="wallet-settings">
          <button className="back" onClick={this.props.back}>
            <Circle><BackIcon/></Circle>
          </button>
          <div className="heading">
            <h2>Wallet Settings</h2>
          </div>
          <div className="content">
            <div className="wallet-details">
              <div>
                <IdentityIcon address={this.props.account}/>
                <span className="label">{Blockchain.getCurrentProviderName()} on {this.props.network}</span>
                <TokenAmount number={this.props.ethBalance} decimal={5} token={"ETH"}/>
              </div>
              <div className="address">
                {etherscanAddress(this.props.network, this.props.account, this.props.account)}
              </div>
            </div>
          </div>
        </div>
        <button type="button" value="Disconnect" className="disconnect" onClick={this.props.onDisconnect}>
          DISCONNECT
        </button>
      </div>
    );
  }
}

export default AccountSettings;
