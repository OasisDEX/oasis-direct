import React from 'react';

class HardWallet extends React.Component {
  selectAccount = e => {
    e.preventDefault();
    this.props.selectHWAddress(e.target.value);
  }

  render() {
    const defaultDerivationPath = this.props.hw.option === 'ledger' ? "m/44'/60'/0'" : "m/44'/60'/0'/0";
    return (
      <div className="frame no-account" style={ {fontSize: '14px'} }>
        Select Derivation Path:
        <ul style={ {padding:'0px', margin: '0px', listStyle: 'none'} }>
          <li style={ {padding:'0px', margin: '0px'} }>
            { defaultDerivationPath } (default)&nbsp;
            <a href="#action" onClick={ e => {  e.preventDefault(); this.props.loadHWAddresses(defaultDerivationPath) } }>Load</a>
          </li>
          <li style={ {padding:'0px', margin: '0px'} }>
            <input type="text" style={ {width: '120px'} } ref={input => this.derivationPath = input}/>&nbsp;
            <a href="#action" onClick={ e => {  e.preventDefault(); this.props.loadHWAddresses(this.derivationPath.value) } }>Load</a>
          </li>
        </ul>
        {
          this.props.hw.addresses.length > 0 &&
          <React.Fragment>
            Choose Address:
            <button onClick={ this.props.loadMoreHwAddresses }>Load more addresses</button>
            <ul style={ {padding:'0px', margin: '0px', listStyle: 'none', height: '200px', overflowY: 'scroll'} }>
              {
                this.props.hw.addresses.map(key => 
                  <li key={ key } style={ {padding:'0px', margin: '0px'} }>
                    <label>
                      <input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ key === this.props.hw.addresses[this.props.hw.addressIndex] } value={ key } onChange={ this.selectAccount } />{ key }
                    </label>
                  </li>
                )
              }
            </ul>
            {
              this.props.hw.addressIndex !== null &&
              <button onClick={ this.props.importAddress }>Import Address</button>
            }
          </React.Fragment>
        }
      </div>
    )
  }
}

export default HardWallet;
