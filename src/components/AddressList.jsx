// Libraries
import React from "react";
import { inject, observer } from "mobx-react";

// UI Components
import Address from "../components-ui/Address";

@inject("network")
@observer
class AddressList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedAddress: null
    };
  }

  selectAddress = address => {
    this.props.onSelect(address);

    this.setState(prevState => {
      const state = {...prevState};
      state.selectedAddress = address;
      return state;
    });
  };

  render() {
    return (
      <ul className="list">
        {
          this.props.addresses.map(address => (
              <li key={address}
                  className={`list-item ${this.state.selectedAddress === address ? "selected" : ""} `}
                  onClick={() => this.selectAddress(address)}>
                <Address address={address} withBalance={true}/>
              </li>
            )
          )
        }
      </ul>
    )
  }
}

export default AddressList;
