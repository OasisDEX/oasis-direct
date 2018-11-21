// Libraries
import React from "react";
import { inject, observer } from "mobx-react";

// UI Components
import { IdentityIcon, BackIcon, Circle} from "../components-ui/Icons";
import TokenAmount from "../components-ui/TokenAmount";

// Utils
import * as blockchain from "../utils/blockchain";
import { etherscanAddress } from "../utils/helpers";
import NetworkIndicator from "./NetworkIndicator";
import ProxyDetails from "./ProxyDetails";

@inject("network")
@inject("system")
@observer
class ActiveConnection extends React.Component {

  disconnect = () => {
    this.props.system.reset();
    this.props.system.stopPriceTicker();
    this.props.network.stopNetwork();
  }

  render() {
    return (
      <div className="frame">
        <div className="wallet-settings">
          <button data-test-id="go-back" className="back" onClick={this.props.back}>
            <Circle hover><BackIcon/></Circle>
          </button>
          <div className="heading">
            <h2>Active Client</h2>
          </div>
          <div className="network-indicator-placeholder">
            <NetworkIndicator network={this.props.network.network}/>
          </div>
          <div className="content">
            <section className="wallet-details">
              <div>
                <IdentityIcon address={this.props.network.defaultAccount}/>
                <span className="label">{blockchain.getCurrentProviderName()}</span>
                <TokenAmount number={this.props.ethBalance} decimal={5} token={"ETH"}/>
              </div>
              {etherscanAddress(this.props.network.network, this.props.network.defaultAccount, this.props.network.defaultAccount)}
            </section>
            <ProxyDetails/>
          </div>
        </div>
        <button type="button" value="Disconnect" className="disconnect" onClick={this.disconnect}>
          DISCONNECT
        </button>
      </div>
    );
  }
}

export default ActiveConnection;
