// Libraries
import React from "react";
import {inject, observer} from "mobx-react";

// Components
import HardWallet from "./HardWallet";
import LockedAccount from "./LockedAccount";
import TradeWidget from "./TradeWidget";
import Wallets from "./Wallets";

// Utils
import {isAddress} from "../utils/helpers";

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
                <TradeWidget />
              :
                <LockedAccount />
        }
      </div>
    )
  }
}

export default inject("network")(observer(Widget));
