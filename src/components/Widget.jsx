// Libraries
import React from "react";
import {inject, observer} from "mobx-react";

// Components
import HardWallet from "./HardWallet";
import LockedAccount from "./LockedAccount";
import TaxWidget from './TaxWidget';
import Wallets from "./Wallets";

// Utils
import {isAddress} from "../utils/helpers";

@inject("network")
@observer
class Widget extends React.Component {
  render() {

    return (
      <div className={`Widget ${this.props.section}`}>
        {
          this.props.network.hw.showSelector
          ?
            <HardWallet />
          :
            !this.props.network.isConnected || this.props.network.loadingFirstAddress
            ?
              <Wallets />
            :
              this.props.network.defaultAccount && isAddress(this.props.network.defaultAccount)
              ?
                <TaxWidget
                    account={this.props.network.defaultAccount}
                    network={this.props.network.network}
                />
              :
                <LockedAccount />
        }
      </div>
    )
  }
}

export default Widget;
