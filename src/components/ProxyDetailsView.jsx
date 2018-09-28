import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import { AccountIcon, Attention } from "../components-ui/Icons";
import { inject, observer } from "mobx-react";
import Spinner from "../components-ui/Spinner";

@inject("profile")
@observer
class ProxyDetailsView extends Component {
  componentDidMount() {
    this.allowanceInterval = setInterval(() => {
      if (this.props.profile.proxy) {
        this.props.profile.loadAllowances();
      }
    }, 500);
  }

  componentWillUnmount() {
    clearInterval(this.allowanceInterval);
  }

  render() {
    return <section className="proxy-details">
      <div className={`proxy-status ${this.props.profile.proxy ? "activated" : ""}`}>
        <AccountIcon/>
        <span className="label">Account Proxy</span>
        <Attention data-tip data-for="proxy-tooltip" className="attention-icon" />
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
                  {this.props.profile.allowedTokensCount} Tokens enabled for Trading
                </span>
                <button type="button" className="gray" onClick={this.props.onEnableTokenClick}>
                  ENABLE TOKEN
                </button>
              </React.Fragment>
            )
            : (
              <React.Fragment>
                <Attention className="attention-icon"/>
                <p className="warning-text">You do not need to create an universal account manually. It will be
                                            automatically created for you.</p>
              </React.Fragment>
            )
        }
      </div>
    </section>
  }
}

export default ProxyDetailsView;