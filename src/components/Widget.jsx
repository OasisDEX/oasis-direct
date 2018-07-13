import React from "react";
import {inject, observer} from "mobx-react";

import HardWallet from "./HardWallet";
import LockedAccount from "./LockedAccount";
import TradeWidget from "./TradeWidget";
import Wallets from "./Wallets";

import {isAddress} from "../helpers";

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
                  <div>
                    <TradeWidget />
                  </div>
                  // Create a decorator Component that returns a component which is wrapped into element with only back function passed as argument
                :
                  <LockedAccount />
        }
      </div>
    )
  }
}

export default inject("network")(observer(Widget));
