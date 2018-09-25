import React, { Component } from "react";
import { AccountIcon, Attention } from "../components-ui/Icons";
import { inject, observer } from "mobx-react";
import Allowances from "./Allowances";
import Spinner from "../components-ui/Spinner";

@inject("profile")
@observer
class ProxyToggle extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showAllowancesView: false,
      isAssigningProxy: false,
    }
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
      .then(() => {
        console.log(this.props.profile.hasProxy);
      })
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
        this.state.showAllowancesView && <Allowances back={this.hideAllowances}/>
      }
      <div className="status">
        {
          this.props.profile.hasProxy
            ? <div className="active">
              {
                this.accountProxyLabel()
              }
              <div style={{paddingTop: "16px"}}>
                <span className="label" style={{margin: 0}}>0 Tokens enabled for Trading</span>
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