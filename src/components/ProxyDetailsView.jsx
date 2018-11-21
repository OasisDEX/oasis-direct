import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import { AccountIcon, Attention } from "../components-ui/Icons";
import { inject, observer } from "mobx-react";
import Spinner from "../components-ui/Spinner";

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
    }
  }

  componentWillUnmount() {
    clearInterval(this.allowanceInterval);
  }

  render() {

    return <section className="proxy-details">
      <div data-test-id="proxy-status" className={`proxy-status ${this.props.profile.proxy ? "activated" : ""}`}>
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
              <button data-test-id="create-proxy" type="button" className="gray"
                      disabled={!this.props.profile.proxy && !this.props.profile.hasFunds} onClick={this.props.profile.createProxy}>
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
                  {this.props.profile.allowedTokensCount} Token{this.props.profile.allowedTokensCount !== 1 ? "s" : ""} enabled for Trading
                </span>
                <button type="button" className="gray" onClick={this.props.onEnableTokenClick}>
                  ENABLE TOKEN
                </button>
              </React.Fragment>
            )
            : (
              <div>
                {
                  !this.props.profile.hasFunds &&
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