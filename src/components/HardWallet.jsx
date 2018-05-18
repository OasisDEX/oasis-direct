import React from 'react';
import {
  Circle, BackIcon, RetryIcon, USBIcon, SmartphoneIcon, ApplicationSettingsIcon,
  SmartphoneUpdateIcon
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

// TODO: Extract each hw device as separate component and they will be composed in HardWallet component
class HardWallet extends React.Component {
  render() {
    const defaultDerivationPath = this.props.hw.option === 'ledger' ? "m/44'/60'/0'" : "m/44'/60'/0'/0";

    const waitForDeviceToConnect = async () => {
      const {error} = await this.props.loadHWAddresses("main", defaultDerivationPath);
      if (error) {
        setTimeout(waitForDeviceToConnect, 1000);
      }
    }

    if(!this.props.hw.isConnected) {
      waitForDeviceToConnect();
    }

    return (
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
                this.props.hw.isConnected
                  ? (
                    <React.Fragment>
                      <span className="label"> Connected! </span>
                    </React.Fragment>
                  )
                  : (
                    <React.Fragment>
                      <Spinner styles={spinnerStyle}/>
                      <span className="label"> Connecting </span>
                    </React.Fragment>
                  )
              }

            </div>
            <div>
            </div>
            <Circle styles={retryButtonStyle}><RetryIcon/></Circle>
          </div>
          <div className="guidelines">
            <ul className="list">
              <li className="list-item">
                <USBIcon/>
                <span className="bullet-number">1</span>
                <span className="text">Connect your Ledger to begin</span>
              </li>
              <li className="list-item">
                <SmartphoneIcon/>
                <span className="bullet-number">2</span>
                <span className="text">Open the Ethereum app on the Ledger</span>
              </li>
              <li className="list-item">
                <ApplicationSettingsIcon/>
                <span className="bullet-number">3</span>
                <span className="text">Ensure the Browser Support is enabled in Settings</span>
              </li>
              <li className="list-item">
                <SmartphoneUpdateIcon/>
                <span className="bullet-number">4</span>
                <span className="text">You may need to update the firmware if Browser Support is not available</span>
              </li>
            </ul>
          </div>
        </div>

        {/*TODO: remove all of that code , once everything is implemented*/}

        {/*<div className="frame no-account" style={ {fontSize: '14px'} }>*/}
        {/**/}
        {/*Select Network:*/}
        {/*<select ref={input => this.network = input}>*/}
        {/*<option value="kovan">Kovan</option>*/}
        {/*<option value="main">Mainnet</option>*/}
        {/*</select>*/}
        {/*Select Derivation Path:*/}
        {/*<ul style={ {padding:'0px', margin: '0px', listStyle: 'none'} }>*/}
        {/*<li style={ {padding:'0px', margin: '0px'} }>*/}
        {/*{ defaultDerivationPath } (default)&nbsp;*/}
        {/*<a href="#action" onClick={ e => {  e.preventDefault(); this.props.loadHWAddresses(this.network.value, defaultDerivationPath) } }>Load</a>*/}
        {/*</li>*/}
        {/*<li style={ {padding:'0px', margin: '0px'} }>*/}
        {/*<input type="text" style={ {width: '120px'} } ref={input => this.derivationPath = input} />&nbsp;*/}
        {/*<a href="#action" onClick={ e => {  e.preventDefault(); this.props.loadHWAddresses(this.network.value, this.derivationPath.value) } }>Load</a>*/}
        {/*</li>*/}
        {/*</ul>*/}
        {/*{*/}
        {/*this.props.hw.addresses.length > 0 &&*/}
        {/*<React.Fragment>*/}
        {/*Choose Address:*/}
        {/*<div><button onClick={ () => this.props.loadHWAddresses(this.network.value) }>Load more addresses</button></div>*/}
        {/*<ul style={ {padding:'0px', margin: '0px', listStyle: 'none', height: '200px', overflowY: 'scroll'} }>*/}
        {/*{*/}
        {/*this.props.hw.addresses.map(key => */}
        {/*<li key={ key } style={ {padding:'0px', margin: '0px'} }>*/}
        {/*<label>*/}
        {/*<input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ key === this.props.hw.addresses[this.props.hw.addressIndex] } value={ key } onChange={ e => this.props.selectHWAddress(e.target.value) } />{ key }*/}
        {/*</label>*/}
        {/*</li>*/}
        {/*)*/}
        {/*}*/}
        {/*</ul>*/}
        {/*{*/}
        {/*this.props.hw.addressIndex !== null &&*/}
        {/*<div>*/}
        {/*<button onClick={ this.props.importAddress }>Import Address</button>*/}
        {/*</div>*/}
        {/*}*/}
        {/*</React.Fragment>*/}
        {/*}*/}
        {/*</div>*/}
      </section>
    )
  }
}

export default HardWallet;
