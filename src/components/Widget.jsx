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
import {setWebClientProvider}  from '../utils/blockchain';
@inject("network")
@observer
class Widget extends React.Component {
  componentDidMount() {
    setWebClientProvider();
    this.props.network.setNetwork();
  }
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

export default Widget;
