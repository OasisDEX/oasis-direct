// Libraries
import React from "react";
import {inject, observer} from "mobx-react";

// Components
import AddressList from "./AddressList";

// UI Components
import {
  Circle, BackIcon, RetryIcon, USBIcon, SmartphoneIcon, ApplicationSettingsIcon,
  SmartphoneUpdateIcon, PicInPicIcon, LockOpenIcon
} from "../components-ui/Icons";
import Spinner from "../components-ui/Spinner";

// Settings
import * as settings from "../settings";

const steps = {
  "ledger": [
    {
      "icon": <USBIcon />,
      "text": "Connect your Ledger to begin"
    },
    {
      "icon": <SmartphoneIcon />,
      "text": "Open the Ethereum app on the Ledger"
    },
    {
      "icon": <ApplicationSettingsIcon />,
      "text": "Ensure the Browser Support is enabled in Settings"
    },
    {
      "icon": <SmartphoneUpdateIcon />,
      "text": "You may need to update the firmware if Browser Support is not available"
    },
  ],
  "trezor": [
    {
      "icon": <USBIcon />,
      "text": "Connect your TREZOR Wallet to begin"
    },
    {
      "icon": <PicInPicIcon />,
      "text": "When to popop asks if you want to export the public key, select export"
    },
    {
      "icon": <LockOpenIcon />,
      "text": "If required, enter your pin or password to unlock the TREZOR"
    },
  ],
}

@inject("network")
@observer
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
    this.derivationPath = this.props.network.hw.option === "ledger" ? "m/44'/60'/0'" : "m/44'/60'/0'/0";
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

  render() {
    return (
      this.props.network.hw.addresses.length > 0
      ?
        <section className="frame hard-wallet-addresses">
          <div className="heading">
            <h2>Select Address on your <span style={{textTransform: "capitalize"}}>{this.props.network.hw.option}</span></h2>
          </div>
          <button className="close" onClick={this.props.network.stopNetwork} />
          <AddressList addresses={this.props.network.hw.addresses} />
        </section>
      :
        <section className="frame hard-wallet">
          <button className="back" onClick={this.props.network.stopNetwork}>
            <Circle><BackIcon/></Circle>
          </button>
          <div className="heading">
            <h2>Connect your <span style={{textTransform: "capitalize"}}>{this.props.network.hw.option}</span> Wallet</h2>
          </div>
          <div className="content">
            <div className="progress">
              <div className="status">
                {
                  this.state.connectivityError
                    ?
                      <span className="label"> Couldn't connect</span>
                    :
                      <React.Fragment>
                        <Spinner styles={{width: "18px", height: "18px"}} />
                        <span className="label"> Connecting </span>
                      </React.Fragment>
                }
              </div>
              <div></div>
              <div onClick={this.retry}>
                <Circle styles={{width: "32px", height: "32px", padding: "5px", marginLeft: "16px"}}><RetryIcon /></Circle>
              </div>
            </div>
            <div className="guidelines">
              <ul className="list">
                {
                  steps[this.props.network.hw.option].map((step, index) => (
                    <li key={index} className="list-item">
                      {step.icon}
                      <span className="bullet-number">{index + 1}</span>
                      <span className="text">{step.text}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </section>
    )
  }
}

export default HardWallet;
