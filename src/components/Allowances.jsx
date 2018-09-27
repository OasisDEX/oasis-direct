// Libraries
import React from "react";

// UI Components
import Spinner from "../components-ui/Spinner";
import { DAI, Done, MKR } from "../components-ui/Icons";  
import { observer } from 'mobx-react';

//TODO: Remove this duplicate  ( TradeWidget ) and extract them in separate config file.
const tokens = {
  mkr: {
    icon: <MKR/>,
    symbol: "MKR",
    name: "Maker"
  },
  dai: {
    icon: <DAI/>,
    symbol: "DAI",
    name: "DAI",
  },
};

@observer
class AllowanceToken extends React.Component {

  constructor() {
    super();

    this.state = {
      isSettingAllowance: false
    }
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  allow(token) {
    this.setState({isSettingAllowance: true});
    this.props.onAllow(token)
      .finally(() => {
        if (this._isMounted) {
          this.setState({isSettingAllowance: false});
        }
      })
  };

  render() {
    const {token, hasAllowance} = this.props;
    return (
      <div className="token" onClick={() => this.allow(token)}>
        <span className="token-icon">{tokens[token].icon}</span>
        <span className="token-name"> {tokens[token].name}</span>
        <span className={`done-placeholder ${hasAllowance ? "active" : ""}`}>
        {
          this.state.isSettingAllowance
            ? <Spinner/>
            : <Done/>
        }
      </span>
      </div>
    )
  }
}

@observer
class Allowances extends React.Component {

  tokens = () => {
    return Object.keys(tokens);
  };

  hasTokenAllowance = (token) => {
    return this.props.allowances[token] > 0;
  };

  render() {
    return (
      <div className="frame allowances">
        <div className="heading">
          <h2> Enable Token for Trading </h2>
        </div>
        <button className="close" onClick={this.props.back}/>
        <div className="content">
          <div className="selector">
            <div className="tokens-container">
              <div className="tokens">
                <div className="token-list">
                  {
                    this.tokens().map(
                      (token, index) =>
                        <AllowanceToken key={index}
                                        onAllow={this.props.onAllow}
                                        hasAllowance={this.hasTokenAllowance(token)}
                                        token={token}/>
                    )
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Allowances;
