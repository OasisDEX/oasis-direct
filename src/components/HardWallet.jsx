import React from 'react';

class HardWallet extends React.Component {

  selectDerivationPath = e => {
    this.props.loadHWAddresses(e.target.value);
  }

  selectAccount = e => {
    this.props.selectHWAddress(e.target.value);
  }

  render() {
    return (
      <div className="frame no-account" style={ {fontSize: '11px'} }>
        Select Derivation Path:
        <ul style={ {padding:'0px', margin: '0px', listStyle: 'none'} }>
          <li style={ {padding:'0px', margin: '0px'} }><label><input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ this.props.hw.derivationPath === "m/44'/60'/0'/0" } onChange={ this.selectDerivationPath } value="m/44'/60'/0'/0"/>m/44'/60'/0'/0 - Jaxx, Metamask, Exodus, imToken, TREZOR (ETH) &amp; Digital Bitbox</label></li>
          <li style={ {padding:'0px', margin: '0px'} }><label><input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ this.props.hw.derivationPath === "m/44'/60'/0'" } onChange={ this.selectDerivationPath } value="m/44'/60'/0'"/>m/44'/60'/0' - Ledger (ETH)</label></li>
          <li style={ {padding:'0px', margin: '0px'} }><label><input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ this.props.hw.derivationPath === "m/44'/61'/0'/0" } onChange={ this.selectDerivationPath } value="m/44'/61'/0'/0"/>m/44'/61'/0'/0 - TREZOR (ETC)</label></li>
          <li style={ {padding:'0px', margin: '0px'} }><label><input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ this.props.hw.derivationPath === "m/44'/60'/160720'/0'" } onChange={ this.selectDerivationPath } value="m/44'/60'/160720'/0'"/>m/44'/60'/160720'/0' - Ledger (ETC)</label></li>
          <li style={ {padding:'0px', margin: '0px'} }><label><input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ this.props.hw.derivationPath === "m/0'/0'/0'" } onChange={ this.selectDerivationPath } value="m/0'/0'/0'"/>m/0'/0'/0' - SingularDTV</label></li>
          <li style={ {padding:'0px', margin: '0px'} }><label><input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ this.props.hw.derivationPath === "m/44'/1'/0'/0" } onChange={ this.selectDerivationPath } value="m/44'/1'/0'/0"/>m/44'/1'/0'/0 - Network: Testnets</label></li>
          <li style={ {padding:'0px', margin: '0px'} }><label><input type="radio" style={ {padding:'0px', margin: '0px', width: '25px'} } checked={ this.props.hw.derivationPath === "m/44'/40'/0'/0" } onChange={ this.selectDerivationPath } value="m/44'/40'/0'/0"/>m/44'/40'/0'/0 - Network: Expanse</label></li>
        </ul>
        {
          this.props.hw.addresses.length > 0 &&
          <React.Fragment>
            Choose Address:
            <button onClick={ this.props.loadMoreHwAddresses }>Load more addresses</button>
            <ul style={ {padding:'0px', margin: '0px', listStyle: 'none', height: '150px', overflowY: 'scroll'} }>
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
