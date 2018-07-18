// Libraries
import React from "react";
import {inject, observer} from "mobx-react";

// UI Components
import {IdentityIcon, BackIcon, Circle} from "../components-ui/Icons";
import TokenAmount from "../components-ui/TokenAmount";

// Internal Libraries
import * as Blockchain from "../utils/blockchain-handler";
import {etherscanAddress} from "../utils/helpers";

class ActiveConnection extends React.Component {
  render() {
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
                <IdentityIcon address={this.props.network.defaultAccount}/>
                <span className="label">{Blockchain.getCurrentProviderName()} on {this.props.network.network}</span>
                <TokenAmount number={this.props.ethBalance} decimal={5} token={"ETH"}/>
              </div>
              {etherscanAddress(this.props.network.network, this.props.network.defaultAccount, this.props.network.defaultAccount)}
            </div>
          </div>
        </div>
        <button type="button" value="Disconnect" className="disconnect" onClick={this.props.network.showClientChoice}>
          DISCONNECT
        </button>
      </div>
    );
  }
}

export default inject("network")(observer(ActiveConnection));
