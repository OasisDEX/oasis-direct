// Libraries
import React from "react";
import {inject, observer} from "mobx-react";

// Components
import Address from "./Address";

// UI Components
import Pagination from "../components-ui/Pagination";
import Spinner from "../components-ui/Spinner";

class AddressList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addresses: this.props.addresses.slice(0, 5),
      selectedAddress: null,
      loadingAddress: false,
    };
  }

  selectAddress = address => {
    this.setState(prevState => {
      const state = {...prevState};
      state.selectedAddress = address;
      return state;
    });
  };

  importAddress = () => {
    if (this.props.network.loadingAddress) return;
    this.props.network.importAddress(this.state.selectedAddress);
  }

  enlist = addresses => {
    this.setState(prevState => {
      const state = {...prevState};
      state.addresses = addresses;
      return state;
    });
  };

  render = () => {
    return (
      <div className="content">
        <ul className="list">
          {
            this.state.addresses.map(address => (
                <li key={address}
                    className={`list-item ${this.state.selectedAddress === address ? "selected" : ""} `}
                    onClick={() => this.selectAddress(address)}>
                  <Address address={address} withBalance={true} />
                </li>
              )
            )
          }
        </ul>
        <Pagination items={this.props.addresses} enlist={this.enlist} />
        <button disabled={!this.state.selectedAddress} onClick={this.importAddress}>
          {
            this.state.loadingAddress
            ?
              <Spinner theme="button" />
            :
              "UNLOCK WALLET"
          }
        </button>
      </div>
    )
  }
}

export default inject("network")(observer(AddressList));
