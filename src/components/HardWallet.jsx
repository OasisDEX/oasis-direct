import React from 'react';
import {
  Circle, BackIcon, RetryIcon, USBIcon, SmartphoneIcon, ApplicationSettingsIcon,
  SmartphoneUpdateIcon, PicInPicIcon, LockOpenIcon
} from "./Icons";
import Spinner from "./Spinner";

const backButtonStyle = {
  position: "absolute",
  zIndex: 2, top: "18px"
}

const hwNameStyle = {
  textTransform: "capitalize"
}

const spinnerStyle = {
  width: "18px",
  height: "18px"
}

const retryButtonStyle = {
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

  constructor(props) {
    super(props);
  }

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

// TODO: Extract each hw device as separate component and they will be composed in HardWallet component
class HardWallet extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      connectivityError: false
    }
  }

  componentWillMount() {
    this.derivationPath = this.props.hw.option === 'ledger' ? "m/44'/60'/0'" : "m/44'/60'/0'/0";

    if (!this.props.hw.isConnected) {
      this.waitForDeviceToConnect(this.derivationPath);
    }
  }

  waitForDeviceToConnect = async (derivationPath) => {
    const {error} = await this.props.loadHWAddresses("main", derivationPath);
    if (error) {
      this.setState({connectivityError: true})
    }
  }

  retry = () => {
    this.setState({connectivityError: false}, () => {
      this.waitForDeviceToConnect(this.derivationPath);
    });
  }

  render() {
    return (
      <React.Fragment>
        {
          this.props.hw.addresses.length > 0
            ? (
              <section className='frame hard-wallet'>
                <div style={backButtonStyle} onClick={this.props.onBack}>
                  <Circle><BackIcon/></Circle>
                </div>
                <div className="heading">
                  <h2>Connect your <span style={hwNameStyle}>{this.props.hw.option}</span> Wallet</h2>
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
                      <Circle styles={retryButtonStyle}><RetryIcon/></Circle>
                    </div>
                  </div>
                  <Guidelines steps={steps[this.props.hw.option]}/>
                </div>
              </section>
            )
            : (
              <section>
                Choose Address:
                <div>
                  <button onClick={() => this.props.loadHWAddresses(this.network.value)}>Load more addresses</button>
                </div>
                <ul style={{padding: '0px', margin: '0px', listStyle: 'none', height: '200px', overflowY: 'scroll'}}>
                  {
                    this.props.hw.addresses.map(key =>
                      <li key={key} style={{padding: '0px', margin: '0px'}}>
                        <label>
                          <input type="radio" style={{padding: '0px', margin: '0px', width: '25px'}}
                                 checked={key === this.props.hw.addresses[this.props.hw.addressIndex]} value={key}
                                 onChange={e => this.props.selectHWAddress(e.target.value)}/>{key}
                        </label>
                      </li>
                    )
                  }
                </ul>
                {
                  this.props.hw.addressIndex !== null &&
                  <div>
                    <button onClick={this.props.importAddress}>Import Address</button>
                  </div>
                }
              </section>
            )
        }
      </React.Fragment>
    )
  }
}

export default HardWallet;
