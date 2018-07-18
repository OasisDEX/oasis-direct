import React from "react";
import { getEthBalanceOf } from "../blockchainHandler";
import TokenAmount from "./TokenAmount";
import Spinner from "../components-ui/Spinner";

class Address extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      address: props.address,
      balance: null
    }
  }

  componentWillMount = () => {
    if (this.props.withBalance) {
      getEthBalanceOf(this.state.address).then((balance) => {
        this.setState({balance: balance.valueOf()});
      })
    }
  };

  hasBalance = () => this.state.balance !== null && this.state.balance !== undefined;

  render() {
    return (
      <React.Fragment>
        <span className="address">{this.props.address}</span>
        {
          this.props.withBalance &&
          <span className="balance">
          {
            this.hasBalance()
              ? <TokenAmount number={this.state.balance} decimal={5} token={"ETH"}/>
              : <Spinner/>
          }
          </span>
        }
      </React.Fragment>
    )
  }
}

export default Address;
