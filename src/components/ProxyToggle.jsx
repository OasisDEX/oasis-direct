import React, { Component } from "react";
import { AccountIcon, Attention } from "../components-ui/Icons";
import { inject, observer } from "mobx-react";
import Allowances from "./Allowances";
import Spinner from "../components-ui/Spinner";
import { autorun } from "mobx";

@inject("profile")
@observer
class ProxyToggle extends Component {

  constructor(props) {
    super(props);
    //TODO: All of those should be extracted in the store not here I think.
    this.state = {
      showAllowancesView: false,
      isAssigningProxy: false,
      allowedTokens : 0
    }
  }

  componentDidMount() {
    if (this.props.profile.hasProxy) {
      this.props.profile.loadAllowances();
    }

    this.allowanceInterval = setInterval(() => {
      if (this.props.profile.hasProxy) {
        this.props.profile.loadAllowances();
      }
    },500);

    autorun(() => {
      this.setState({allowedTokens: this.props.profile.allowedTokens})
    })
  }

  componentWillUnmount(){
    clearInterval(this.allowanceInterval);
  }

  //TODO: Probably this logic shouldn't be here. Why would this control how Allowances view is displayed..??!??

  showAllowances = () => {
    this.setState({showAllowancesView: true})
  };

  hideAllowances = () => {
    this.setState({showAllowancesView: false})
  };

  assignProxy = () => {
    this.setState({isAssigningProxy: true});

    this.props.profile
      .createProxy()
      .finally(() => {
        this.setState({isAssigningProxy: false});
      })
  }

  accountProxyLabel = (withButton) => {
    return (
      <div style={{borderBottom: "1px solid #F7F7F8", paddingBottom: "16px"}}>
        <div>
          <AccountIcon/>
          <span className="label">Account Proxy</span>
          <Attention style={{height: "16px", width: "16px"}}/>
        </div>
        {
          withButton
            ? this.state.isAssigningProxy
            ? <Spinner/>
            : (
              <button type="button" className="create" onClick={this.assignProxy}>
                CREATE
              </button>
            )
            : null
        }
      </div>
    )
  }

  render = () => (
    <section className="proxy-details">
      {
        this.state.showAllowancesView && <Allowances allowances={this.props.profile.allowances} of={this.props.profile.proxy} allow={this.props.profile.allow} back={this.hideAllowances}/>
      }
      <div className="status">
        {
          this.props.profile.hasProxy
            ? <div className="active">`
              {
                this.accountProxyLabel()
              }
              <div style={{paddingTop: "16px"}}>
                <span className="label" style={{margin: 0}}>
                  {this.state.allowedTokens } Tokens enabled for Trading
                </span>
                <button type="button" className="create" onClick={this.showAllowances}>
                  ENABLE TOKEN
                </button>
              </div>
            </div>
            : <div>
              {
                this.accountProxyLabel(true)
              }
              <div style={{paddingTop: "16px"}}>
                <Attention style={{height: "24px", width: "24px", marginRight: "16px"}}/>
                <p style={{
                  width: "fit-content",
                  margin: "0px",
                  fontFamily: "Montserrat,sans-serif",
                  fontWeight: 500,
                  fontSize: "13px",
                  textAlign: "left",
                  color: "#969697",
                  letterSpacing: "0.1px"
                }}>
                  You do not need to create an universal account manually. It will be automatically created for you.
                </p>
              </div>
            </div>
        }
      </div>

    </section>
  )
}

export default ProxyToggle;