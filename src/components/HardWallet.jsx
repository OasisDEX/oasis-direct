// Libraries
import React from "react";
import { inject, observer } from "mobx-react";

// Components
import HWalletConnection from "./HWalletConnection";
import HWalletAddresses from "./HWalletAddresses";

@inject("network")
@observer
class HardWallet extends React.Component {
  render() {
    const {isConnected, wallet} = this.props.network.hw;
    return (
      isConnected
        ?
        <HWalletAddresses  wallet={wallet}/>
        :
        <HWalletConnection wallet={wallet}/>
    )
  }
}

export default HardWallet;
