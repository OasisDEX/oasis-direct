import React from 'react';
import {observer} from "mobx-react";
import {
  Circle, BackIcon, RetryIcon, USBIcon, SmartphoneIcon, ApplicationSettingsIcon,
  SmartphoneUpdateIcon, PicInPicIcon, LockOpenIcon, ArrowLeft, ArrowRight
} from "./Icons";
import Spinner from "./Spinner";
import { getEthBalanceOf } from "../blockchainHandler";
import TokenAmount from "./TokenAmount";

const settings = require('../settings');

const hwNameStyle = {
  textTransform: "capitalize"
}

const spinnerStyle = {
  width: "18px",
  height: "18px"
}

const circularButtonStyle = {
  width: "32px",
  height: "32px",
  padding: "5px",
  marginLeft: "16px"
};

const steps = {
  "ledger": [
    {
      "icon": <USBIcon/>,
      "text": "Connect your Ledger to begin"
    },
    {
      "icon": <SmartphoneIcon/>,
      "text": "Open the Ethereum app on the Ledger"
    },
    {
      "icon": <ApplicationSettingsIcon/>,
      "text": "Ensure the Browser Support is enabled in Settings"
    },
    {
      "icon": <SmartphoneUpdateIcon/>,
      "text": "You may need to update the firmware if Browser Support is not available"
    },
  ],
  "trezor": [
    {
      "icon": <USBIcon/>,
      "text": "Connect your TREZOR Wallet to begin"
    },
    {
      "icon": <PicInPicIcon/>,
      "text": "When to popop asks if you want to export the public key, select export"
    },
    {
      "icon": <LockOpenIcon/>,
      "text": "If required, enter your pin or password to unlock the TREZOR"
    },
  ],
}

class Guidelines extends React.Component {
  render = () => (
    <div className="guidelines">
      <ul className="list">
        {
          this.props.steps.map((step, index) => (
            <li key={index} className="list-item">
              {step.icon}
              <span className="bullet-number">{index + 1}</span>
              <span className="text">{step.text}</span>
            </li>
          ))
        }
      </ul>
    </div>
  )
}


class Address extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      address: props.address,
    }
  }

  componentDidMount() {
    getEthBalanceOf(this.state.address).then((balance) => {
      this.setState({balance: balance.valueOf()});
    })
  }

  render() {
    return (
      <React.Fragment>
        <span className="address">{this.state.address}</span>
        <span className="balance">
          <TokenAmount number={this.state.balance} decimal={5} token={"ETH"}/>
        </span>
      </React.Fragment>
    )
  }
}


// TODO: Extract each hw device as separate component and they will be composed in HardWallet component
class HardWallet extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      selectedAddress: null,
      addresses: [],
      connectivityError: false
    }
  }

  componentWillMount() {
    this.derivationPath = this.props.network.hw.option === 'ledger' ? "m/44'/60'/0'" : "m/44'/60'/0'/0";

    this.waitForDeviceToConnect(this.derivationPath);
  }

  waitForDeviceToConnect = async (derivationPath) => {
    const addresses = await this.props.network.loadHWAddresses(settings.hwNetwork, 100, derivationPath);

    this.setState({connectivityError: true});

    this.page = {
      start: 0,
      end: 5
    };

    this.setState({addresses: addresses.slice(0,5)});
  }

  retry = () => {
    this.setState({connectivityError: false}, () => {
      this.waitForDeviceToConnect(this.derivationPath);
    });
  }

  //TODO; create pagination component
  next = async (pageSize) => {
    const addresses = this.props.network.hw.addresses;
    const page = {
      start: this.page.end,
      end: this.page.end + pageSize
    };

    if (this.page.end === addresses.length) {
      const {error} = await this.props.network.loadHWAddresses(settings.hwNetwork, this.page.end + 5, this.derivationPath);
      if (error) {
        console.log("Error connecting with the device");
        return;
      } //TODO: handle it somehow - probably some notification box? This happen with TREZOR.

      page.end = this.props.network.hw.addresses.length;
    }

    this.page = page;
    this.setState({addresses: this.props.network.hw.addresses.slice(this.page.start, this.page.end)});
  };

  previous = (pageSize) => {
    if (this.page.start - pageSize < 0) return;

    this.page = {
      start: this.page.start - pageSize,
      end: this.page.start
    };

    this.setState({addresses: this.props.network.hw.addresses.slice(this.page.start, this.page.end)});
  };

  importAddress = () => {
    if (this.props.network.loadingAddress) return;

    this.props.network.importAddress(this.state.selectedAddress);
  }


  render() {
    return (
      <React.Fragment>
        {
          this.props.network.hw.addresses.length > 0
            ? (
              <section className='frame hard-wallet-addresses'>
                <div className="heading">
                  <h2>Select Address on your <span style={hwNameStyle}>{this.props.network.hw.option}</span></h2>
                </div>
                <button className="close" onClick={this.props.network.showClientChoice}/>

                <div className="content">

                  <ul className="list">
                    {
                      this.state.addresses.map(address =>
                        <li key={address} className={`list-item ${this.state.selectedAddress === address ? 'selected' : ''} `}
                            onClick={() => this.setState({selectedAddress: address})}>
                          <Address address={address}/>
                        </li>
                      )
                    }
                  </ul>

                  <div className="pagination">
                    <span onClick={() => this.previous(5)} disabled={this.props.network.loadingAddress}>
                      <Circle styles={circularButtonStyle}><ArrowLeft/></Circle>
                    </span>
                    <span onClick={() => this.next(5)} disabled={this.props.network.loadingAddress}>
                      <Circle styles={circularButtonStyle}><ArrowRight/></Circle>
                    </span>
                  </div>
                  <button disabled={!this.state.selectedAddress} onClick={this.importAddress}> {this.props.network.loadingAddress ? <Spinner theme="button"/> : 'UNLOCK WALLET'}</button>
                </div>
              </section>
            )
            : (
              <section className='frame hard-wallet'>
                <button className="back" onClick={this.props.network.showClientChoice}>
                  <Circle><BackIcon/></Circle>
                </button>
                <div className="heading">
                  <h2>Connect your <span style={hwNameStyle}>{this.props.network.hw.option}</span> Wallet</h2>
                </div>
                <div className="content">
                  <div className="progress">
                    <div className="status">
                      {
                        this.state.connectivityError
                          ? <span className="label"> Couldn't connect</span>
                          : <React.Fragment>
                            <Spinner styles={spinnerStyle}/>
                            <span className="label"> Connecting </span>
                          </React.Fragment>
                      }
                    </div>
                    <div>
                    </div>
                    <div onClick={this.retry}>
                      <Circle styles={circularButtonStyle}><RetryIcon/></Circle>
                    </div>
                  </div>
                  <Guidelines steps={steps[this.props.network.hw.option]}/>
                </div>
              </section>
            )
        }
      </React.Fragment>
    )
  }
}

export default observer(HardWallet);
