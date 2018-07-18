import React from 'react';
import Product from '../ui-components/Product';
import {
  LedgerIcon, TrezorIcon, Circle, BackIcon, MetamaskIcon, ParityIcon, ToshiIcon,
  StatusIcon, EthereumIcon, Grayscale, GrayMetamaskIcon
} from "./Icons";
import Spinner from "./Spinner";
import { getCurrentProviderName } from '../web3';
import { connect } from "react-redux";
import { actions } from "../handlers/HardWallet";


const logos = {
  metamask: <MetamaskIcon/>,
  parity: <ParityIcon/>,
  toshi: <ToshiIcon/>,
  status: <StatusIcon/>
}

class Wallets extends React.Component {

  constructor() {
    super();

    this.state = {
      hasProvider: false,
      provider: '',
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
    this.props.showHW('ledger');
  }

  connectTrezor = () => {
    this.props.showHW('trezor');
  }

  getToClientSelection = () => {
    this.setState({shouldDisplayAvailableClients: false});
  }

  logoFor = (provider) => {
    const logo = logos[provider];
    if (logo) return logo;
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
    if (this.props.loadingAddress) {
      return
    }

    this.props.setWeb3WebClient();
  }

  render() {
    return <React.Fragment>
      {
        this.state.shouldDisplayAvailableClients
          ? <section className="frame wallets">
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
                    <a href="https://toshi.org/" target="_blank" rel="noopener noreferrer">
                      <Product label="Toshi" logo={this.grayScale(ToshiIcon)}/>
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </section>
          : <section className="frame wallets">
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
                          ? <React.Fragment>
                            <div className="client-summary">
                              {this.logoFor(getCurrentProviderName())}
                              <div>
                                <span className="label status">Connected</span>
                                <span className="label">{this.state.provider}</span>
                              </div>
                            </div>
                            <button type="button" onClick={this.selectWallet}>{this.props.loadingAddress ?
                              <Spinner theme="button"/> : 'Continue'}</button>
                          </React.Fragment>
                          : <React.Fragment>
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
                      <Product className="hw-wallet" label="Ledger" logo={LedgerIcon} disabled={this.props.loadingAddress}
                               onClick={this.connectLedger}/>
                      <Product className="hw-wallet" label="Trezor" logo={TrezorIcon} disabled={this.props.loadingAddress}
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

const mapStateToProps = state => {
  return { ...state.hw }
};

const mapDispatchToProps = dispatch => ({
  showHW : type => dispatch(actions.showDetails(type))
});

export default connect(mapStateToProps, mapDispatchToProps)(Wallets);
