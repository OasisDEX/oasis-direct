import React from 'react';
import {observer} from "mobx-react";
import TradeWidget from './TradeWidget';
import Wallets from './Wallets';
import LockedAccount from './LockedAccount';
import { isAddress } from '../helpers';
import HardWallet from "./HardWallet";

class Widget extends React.Component {
  render() {
    return (
      <div className={`Widget ${this.props.section}`}>
        {
          this.props.network.hw.showSelector
            ?
              <HardWallet network={this.props.network} />
            :
              !this.props.network.isConnected || this.props.network.loadingFirstAddress
              ?
                <Wallets network={this.props.network} />
              :
                this.props.network.defaultAccount && isAddress(this.props.network.defaultAccount)
                ?
                  <div>
                    <TradeWidget  network={this.props.network}
                                  system={this.props.system}
                                  profile={this.props.profile}
                                  transactions={this.props.transactions} />
                  </div>
                  // Create a decorator Component that returns a component which is wrapped into element with only back function passed as argument
                :
                  <LockedAccount onBack={this.props.showClientChoice} />
        }
      </div>
    )
  }
}

export default observer(Widget);
