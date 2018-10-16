// Libraries
import React from "react";
import {inject, observer} from "mobx-react";

// UI Components
import {
  LedgerIcon, TrezorIcon, Circle, BackIcon, MetamaskIcon, ParityIcon, CoinbaseIcon,
  StatusIcon, EthereumIcon, Grayscale, GrayMetamaskIcon
} from "../components-ui/Icons";
import Product from "../components-ui/Product";
import Spinner from "../components-ui/Spinner";

// Utils
import {getCurrentProviderName} from "../utils/web3";

const logos = {
  metamask: {icon: <MetamaskIcon/>, name: "Metamask"},
  parity: {icon: <ParityIcon/>, name: "Parity"},
  coinbase: {icon: <CoinbaseIcon/>, name: "Coinbase Wallet"},
  status: {icon: <StatusIcon/>, name: "Status"}
}

@inject("network")
@observer
class Wallets extends React.Component {

  constructor() {
    super();

    this.state = {
      hasProvider: false,
      provider: "",
      shouldDisplayAvailableClients: false
    }
  }

  componentWillMount = () => {
    if (window.web3) {
      this.setState({hasProvider: true, provider: getCurrentProviderName()});
    }
  }

  switchToAvailableClientsView = () => {
    this.setState({shouldDisplayAvailableClients: true});
  }

  connectLedger = () => {
    this.props.network.showHW("ledger");
  }

  connectTrezor = () => {
    this.props.network.showHW("trezor");
  }

  getToClientSelection = () => {
    this.setState({shouldDisplayAvailableClients: false});
  }

  logoFor = (provider) => {
    const logo = logos[provider];

    if (logo) {
      return logos[provider].icon
    }

    return <EthereumIcon/>;
  };

  grayScale = (Logo) => {
    return class extends React.Component {
      render = () => (
        <Grayscale><Logo/></Grayscale>
      )
    }
  }

  selectWallet = () => {
    if (this.props.network.loadingAddress) {
      return
    }

    this.props.network.setWeb3WebClient();
  }

  render() {
    return <React.Fragment>
      {
        this.state.shouldDisplayAvailableClients
        ?
          <section className="frame wallets">
            <div style={{position: "absolute", zIndex: 2, top: "18px"}} onClick={this.getToClientSelection}>
              <Circle><BackIcon/></Circle>
            </div>
            <div className="decorator">
              <ul className="list">
                <li className="list-item column-flex clients">
                  <div className="heading">
                    <h2>Desktop Clients</h2>
                  </div>
                  <div className="row-flex">
                    <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">
                      <Product label="Metamask" logo={GrayMetamaskIcon}/>
                    </a>
                    <a href="https://www.parity.io/" target="_blank" rel="noopener noreferrer">
                      <Product label="Parity" logo={this.grayScale(ParityIcon)}/>
                    </a>
                  </div>
                </li>
                <li className="list-item column-flex clients">
                  <div className="heading">
                    <h2>Mobile Clients</h2>
                  </div>
                  <div className="row-flex">
                    <a href="https://status.im/" target="_blank" rel="noopener noreferrer">
                      <Product label="Status" logo={this.grayScale(StatusIcon)}/>
                    </a>
                    <a href="https://wallet.coinbase.com" target="_blank" rel="noopener noreferrer">
                      <Product label="Coinbase Wallet" logo={this.grayScale(CoinbaseIcon)}/>
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        :
          <section className="frame wallets">
            <div className="heading">
              <h2>Select Wallet Client</h2>
            </div>
            <div className="decorator">
              <div className="content">
                <ul className="list">
                  <li className="list-item">
                    <div className="browser-wallet">
                      {
                        this.state.hasProvider
                        ?
                          <React.Fragment>
                            <div className="client-summary">
                              {this.logoFor(getCurrentProviderName())}
                              <div>
                                <span className="label status" data-test-id="wallets-connection-status">Connected</span>
                                <span className="label" data-test-id="wallets-name" >{logos[this.state.provider] ? logos[this.state.provider].name : this.state.provider}</span>
                              </div>
                            </div>
                            <button type="button" data-test-id="wallets-continue" onClick={this.selectWallet}>
                              {
                                this.props.network.loadingAddress
                                ?
                                  <Spinner theme="button"/>
                                :
                                  "Continue"
                              }
                            </button>
                          </React.Fragment>
                        :
                          <React.Fragment>
                            <div className="client-summary">
                              <span className="label">No Client in use</span>
                            </div>
                            <button type="button" onClick={() => this.switchToAvailableClientsView()}> Show Clients</button>
                          </React.Fragment>
                      }
                    </div>
                  </li>
                  <li className="list-item">
                    <div className="row-flex">
                      <Product className="hw-wallet" label="Ledger" logo={LedgerIcon} disabled={this.props.network.loadingAddress}
                               onClick={this.connectLedger}/>
                      <Product className="hw-wallet" label="Trezor" logo={TrezorIcon} disabled={this.props.network.loadingAddress}
                               onClick={this.connectTrezor}/>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>
      }
    </React.Fragment>

  }
}

export default Wallets;
