// Libraries
import React from "react";
import {observer} from "mobx-react";

// UI Components
import Spinner from "../components-ui/Spinner";
import { Done } from "../components-ui/Icons";

// Utils
import tokens, { excludes } from '../utils/tokens';

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
      .catch(e => console.log(e))
      .finally(() => {
        if (this._isMounted) {
          this.setState({isSettingAllowance: false});
        }
      })
  };

  setAllowance = () => {
    if(!this.state.isSettingAllowance) {
      this.allow(this.props.token);
    }
  };

  render() {
    const {token, hasAllowance} = this.props;
    return (
      <button className='token' disabled={this.state.isSettingAllowance} onClick={this.setAllowance}>
        <span className="token-icon">{tokens[token].icon}</span>
        <span className="token-name"> {tokens[token].name}</span>
        <span className={`done-placeholder ${hasAllowance ? "active" : ""}`}>
        {
          this.state.isSettingAllowance
            ? <Spinner/>
            : <Done/>
        }
      </span>
      </button>
    )
  }
}

@observer
class Allowances extends React.Component {
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
                    excludes("eth").map(
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
