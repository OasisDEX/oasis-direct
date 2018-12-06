import React from 'react';
import { inject, observer } from "mobx-react";
import { reaction } from "mobx";


import Spinner from "../components-ui/Spinner";
import Pagination from "../components-ui/Pagination";

import AddressList from "./AddressList";

const style = {
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: 'auto'
};

@inject("network")
@observer
export default class HWalletAddresses extends React.Component {

  constructor() {
    super();

    this.state = {
      isLegacy: false,
      address: "",
      addresses: []
    }
  }

  componentWillMount() {
    this.firstPage(this.props.network.hw.addresses);
    reaction(
      () => this.props.network.hw.addresses,
      addresses => this.firstPage(addresses)
    )
  }

  firstPage = addresses => {
    this.setState({
      addresses: addresses.slice(0, 5)
    });
  };

  onSelectedAddress = address => {
    this.setState({address});
  };

  importAddress = () => {
    if (this.props.network.loadingAddress) return;
    this.props.network.importAddress(this.state.address);
  };

  enlist = addresses => {
    this.setState(prevState => {
      const state = {...prevState};
      state.addresses = addresses;
      return state;
    });
  };

  loadLegacy = async () => {
    const accounts = await this.props.network.loadHWAddresses("m/44'/60'/0'");

    if (accounts.length) {
      this.setState({
        isLegacy: true
      })
    }
  }

  loadLive = async () => {
    const accounts = await this.props.network.loadHWAddresses("m/44'/60'/0'/0");

    if (accounts.length) {
      this.setState({
        isLegacy: false
      })
    }
  };

  render() {
    return <section className="frame hard-wallet-addresses">
      <div className="heading">
        <h2>Select <span style={{textTransform: "capitalize"}}>{this.props.device}</span> Wallet</h2>
      </div>

      <button className="close" onClick={this.props.network.stopNetwork}/>

      <div className="content">
        <AddressList onSelect={this.onSelectedAddress} addresses={this.state.addresses}/>

        <div className="row-flex" style={style}>
          {
            this.props.wallet === "ledger"
              ? <React.Fragment>
                {
                  this.state.isLegacy
                    ? <button className="light" onClick={this.loadLive}> View Live Addresses </button>
                    : <button className="light" onClick={this.loadLegacy}> View Legacy Addresses </button>
                }
              </React.Fragment>
              : <React.Fragment/>
          }

          <Pagination items={this.props.network.hw.addresses} onPage={this.enlist}/>
        </div>

        <button disabled={!this.state.address} onClick={this.importAddress}>
          {
            this.props.network.loadingAddress
              ?
              <Spinner theme="button"/>
              :
              "UNLOCK WALLET"
          }
        </button>
      </div>
    </section>
  }
}