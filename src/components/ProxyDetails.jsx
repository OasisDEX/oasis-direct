// Libraries
import React, {Component} from "react";
import {observer, inject} from "mobx-react";

// Components
import Allowances from "./Allowances";
import ProxyDetailsView from "./ProxyDetailsView";

@inject("profile")
@observer
export default class ProxyDetails extends Component {

  constructor() {
    super();
    this.state = {view: null}
  }

  componentWillMount() {
    this.switchToProxyDetails();
  }

  switchToProxyDetails = () => {
    this.setView(
      <ProxyDetailsView onEnableTokenClick={this.switchToAllowances}/>
    );
  };

  switchToAllowances = () => {
    this.setView(
      <Allowances allowances={this.props.profile.allowances}
                  of={this.props.profile.proxy}
                  onAllow={this.props.profile.toggleAllowance}
                  back={this.switchToProxyDetails}/>
    )
  };

  setView = (view) => {
    this.setState({view});
  };

  render() {
    return this.state.view
  };
}