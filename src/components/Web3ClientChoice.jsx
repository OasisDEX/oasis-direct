import React from 'react';

class Web3ClientChoice extends React.Component {
  render() {
    return (
      <div className="frame no-account">
        <div className="heading">
          <h2>Select your client</h2>
        </div>
        <section className="content">
          <a href="#action" onClick={ e => { e.preventDefault(); this.props.showHW('ledger') } }>Connect to Ledger</a>
          <a href="#action" onClick={ e => { e.preventDefault(); this.props.showHW('trezor') } }>Connect to Trezor</a>
          <a href="#action" onClick={ e => { e.preventDefault(); this.props.setWeb3WebClient() } }>Connect to WebClient (Metamask/Parity/Mist)</a>
        </section>
      </div>
    )
  }
}

export default Web3ClientChoice;
