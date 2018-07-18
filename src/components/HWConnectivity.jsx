import React from 'react';
import {
  ApplicationSettingsIcon, Circle, LockOpenIcon, PicInPicIcon, RetryIcon, SmartphoneIcon, SmartphoneUpdateIcon,
  USBIcon
} from "./Icons";
import Spinner from "./Spinner";

const circularButtonStyle = {
  width: "32px",
  height: "32px",
  padding: "5px",
  marginLeft: "16px"
};

const spinnerStyle = {
  width: "18px",
  height: "18px"
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
};

class HWConnectivity extends React.Component {

  componentDidMount() {
    this.props.connect();
  }

  retry = () => {
    this.props.retry();
  };

  render = () => (
    <React.Fragment>
      <div className="progress">
        <div className="status">
          {
            this.props.hasError
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
      <div className="guidelines">
        <ul className="list">
          {
            steps[this.props.device].map((step, index) => (
              <li key={index} className="list-item">
                {step.icon}
                <span className="bullet-number">{index + 1}</span>
                <span className="text">{step.text}</span>
              </li>
            ))
          }
        </ul>
      </div>
    </React.Fragment>
  )
}

export default HWConnectivity;