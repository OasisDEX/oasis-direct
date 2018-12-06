import React from 'react';
import { inject, observer } from "mobx-react";
import {
  Circle, BackIcon, RetryIcon, USBIcon, SmartphoneIcon, ApplicationSettingsIcon,
  SmartphoneUpdateIcon, PicInPicIcon, LockOpenIcon
} from "../components-ui/Icons";
import Spinner from "../components-ui/Spinner";


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
};

const style = {
  width: "32px",
  height: "32px",
  padding: "5px",
  marginLeft: "16px"
};

@inject("network")
@observer
export default class HWalletConnection extends React.Component {

  constructor(props) {
    super(props);
    this.derivationPath =  props.wallet === "ledger" ? "44'/60'/0'" : "44'/60'/0'/0/0";
    this.amount = props.wallet === "ledger" ? 10 : 100;
    this.state = {
      connectivityError: false
    }
  }

  componentWillMount() {
    this.waitForDeviceToConnect();
  }

  waitForDeviceToConnect = async (derivationPath = this.derivationPath) => {
    const addresses = await this.props.network.loadHWAddresses(derivationPath, this.amount);

    if (!addresses.length) {
      this.setState({connectivityError: true});
    }
  };

  retry = () => {
    this.setState({connectivityError: false}, () => {
      this.waitForDeviceToConnect();
    });
  };

  render() {
    const { wallet } = this.props;
    return <section className="frame hard-wallet">
      <button className="back" onClick={this.props.network.stopNetwork}>
        <Circle hover={true}><BackIcon/></Circle>
      </button>
      <div className="heading">
        <h2>Connect your <span style={{textTransform: "capitalize"}}>{wallet}</span> Wallet
        </h2>
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
                  <Spinner styles={{width: "18px", height: "18px"}}/>
                  <span className="label"> Connecting </span>
                </React.Fragment>
            }
          </div>
          <div onClick={this.retry}>
            <Circle hover={true} styles={style}><RetryIcon/></Circle>
          </div>
        </div>
        <div className="guidelines">
          <ul className="list">
            {
              steps[wallet].map((step, index) => {
                const {text, icon} = step;

                return (
                  <li key={index} className="list-item">
                    {icon}
                    <span className="bullet-number">{index + 1}</span>
                    <span className="text">{text}</span>
                  </li>
                )
              })
            }
          </ul>
        </div>
      </div>
    </section>
  }
}