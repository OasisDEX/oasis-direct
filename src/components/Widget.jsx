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

@inject("network")
@inject("ui")
@observer
class Widget extends React.Component {
  render() {
    return (
      <div className={`Widget ${this.props.section}`}>
        {console.log(this.props.ui.hw)}
        {
          this.props.ui.hw
          ?
            <HardWallet />
          :
            !this.props.network.isConnected
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

export default Widget;
