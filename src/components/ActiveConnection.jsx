// Libraries
import React from "react";
import { inject, observer } from "mobx-react";

// UI Components
import { IdentityIcon, BackIcon, Circle } from "../components-ui/Icons";
import TokenAmount from "../components-ui/TokenAmount";

// Utils
import * as blockchain from "../utils/blockchain";
import { etherscanAddress } from "../utils/helpers";

@inject("network")
@observer
class ActiveConnection extends React.Component {
  render() {
    const {defaultAccount, network, stopNetwork} = this.props.network;
    const ethBalance = this.props.ethBalance;

    return (
      <div className="frame">
        <div className="wallet-settings">
          <button className="back" onClick={this.props.back}>
            <Circle><BackIcon/></Circle>
          </button>
          <div className="heading">
            <h2>Active Wallet Connection</h2>
          </div>
          <div className="content">
            <div className="wallet-details">
              <div>
                <IdentityIcon address={defaultAccount}/>
                <span className="label">{blockchain.getCurrentProviderName()} on {network}</span>
                <TokenAmount number={ethBalance} decimal={5} token={"ETH"}/>
              </div>
              {etherscanAddress(network, defaultAccount, defaultAccount)}
            </div>
          </div>
        </div>
        <button type="button" value="Disconnect" className="disconnect" onClick={stopNetwork}>
          DISCONNECT
        </button>
      </div>
    );
  }
}

export default ActiveConnection;
