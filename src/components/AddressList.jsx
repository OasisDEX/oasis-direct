import React from 'react';
import Pagination from "../ui-components/Pagination";
import { setDefaultAccount } from "../blockchainHandler";
import Address from "./Address";
import Spinner from "./Spinner";


class AddressList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addresses: this.props.addresses.slice(0, 5),
      selectedAddress: null,
      loadingAddress: false,
    };
  }

  componentWillUnmount = () => {
    console.log("Here")
    // this.props.loadAddresses(this.props.hw.option, settings.hwNetwork, nextPage, this.props.hw.derivationPath);
  }

  unlock = () => {
    if (this.state.loadingAddress) return;

    this.setState((prevState) => {
      const current = {...prevState};
      current.loadingAddress = true;
      return current;
    });

    setDefaultAccount(this.state.selectedAddress); // NOT sure about this. Probably our app should depend only on the internal state.
    this.props.onUnlock(this.state.selectedAddress);
  };

  selectAddress = (address) => {
    this.setState((prevState) => {
      const state = {...prevState};
      state.selectedAddress = address;
      return state;
    });
  };

  enlist = (addresses) => {
    this.setState(prevState => {
      const current = {...prevState};
      current.addresses = addresses;
      return current;
    })
  };

  render = () => {
    return (
      <React.Fragment>
        <ul className="list">
          {
            this.state.addresses.map(address => (
                <li key={address}
                    className={`list-item ${this.state.selectedAddress === address ? 'selected' : ''} `}
                    onClick={() => {
                      this.selectAddress(address);
                    }}>
                  <Address address={address} withBalance={true}/>
                </li>
              )
            )
          }
        </ul>

        <Pagination items={this.props.addresses} enlist={this.enlist}/>

        <button disabled={!this.state.selectedAddress} onClick={this.unlock}>
          {
            this.state.loadingAddress
              ? <Spinner theme="button"/>
              : 'UNLOCK WALLET'
          }
        </button>
      </React.Fragment>
    )
  }
}

export default AddressList;