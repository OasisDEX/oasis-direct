import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import { AccountIcon, Attention } from "../components-ui/Icons";
import { inject, observer } from "mobx-react";
import Spinner from "../components-ui/Spinner";
import * as blockchain from "../utils/blockchain";
import { toBigNumber } from "../utils/helpers";
import { autorun } from "mobx";

@inject("profile")
@observer
class ProxyDetailsView extends Component {

  constructor() {
    super();
    this.state = {
      hasFunds: true
    }
  }

  componentDidMount() {
    if (this.props.profile.proxy) {
      this.allowanceInterval = setInterval(() => {
        this.props.profile.loadAllowances();
      }, 1000);
    } else {
      this.checkIfUserHasEnoughFunds().then((hasFunds) => {
        this.setState({hasFunds});
      });
    }

    autorun(() => {
      if (!this.props.profile.proxy) {
        this.checkIfUserHasEnoughFunds().then((hasFunds) => {
          this.setState({hasFunds});
        });
      }
    })
  }

  componentWillUnmount() {
    clearInterval(this.allowanceInterval);
  }

  checkIfUserHasEnoughFunds = async () => {
    const account = this.props.profile.rootStore.network.defaultAccount;

    const txData = {
      to: blockchain.objects.proxyRegistry.address,
      data: blockchain.objects.proxyRegistry.build.getData(),
      value: 0,
      from: account
    };

    const gas = await blockchain.estimateGas(txData.to, txData.data, txData.value, txData.from);
    const price = await this.props.profile.rootStore.transactions.getGasPrice();
    const balance = await blockchain.getEthBalanceOf(account);
    return balance.gt(toBigNumber(gas * price));
  };

  render() {

    return <section className="proxy-details">
      <div className={`proxy-status ${this.props.profile.proxy ? "activated" : ""}`}>
        <AccountIcon/>
        <span className="label">
          {
            this.props.profile.proxy ? "Proxy already created" : "Proxy not created"
          }
        </span>
        <Attention data-tip data-for="proxy-tooltip" className="attention-icon"/>
        <ReactTooltip className="od-tooltip" effect="solid" id="proxy-tooltip">
          <p>
            Proxy is a supporting contract owned by you that groups different actions as one Ethereum transaction.
          </p>
        </ReactTooltip>
        {
          !this.props.profile.proxy
            ? !this.props.profile.isCreatingProxy
            ? (
              <button type="button" className="gray" onClick={this.props.profile.createProxy}>
                CREATE
              </button>
            )
            : <Spinner/>
            : <React.Fragment/>
        }
      </div>
      <div className="allowances-status">
        {
          this.props.profile.proxy
            ? (
              <React.Fragment>
                <span className="label">
                  {this.props.profile.allowedTokensCount} Token{this.props.profile.allowedTokensCount !== 1 ? "s" : ""}
                                                          enabled for Trading
                </span>
                <button type="button" className="gray" onClick={this.props.onEnableTokenClick}>
                  ENABLE TOKEN
                </button>
              </React.Fragment>
            )
            : (
              <div>
                {
                  !this.state.hasFunds &&
                  <div className="attention">
                    <Attention className="attention-icon"/>
                    <p className="attention-text">You don't have enough Ether to pay for the transaction</p>
                  </div>
                }
                <div className="attention">
                  <Attention className="attention-icon"/>
                  <p className="attention-text">
                    You do not need to create a proxy manually. It will be automatically created for you.</p>
                </div>
              </div>
            )
        }
      </div>
    </section>
  }
}

export default ProxyDetailsView;