// Libraries
import React from "react";

// UI Components
import Spinner from "../components-ui/Spinner";
import { DAI, Done, Ether, MKR } from "../components-ui/Icons";

//TODO: Remove this duplicate  ( TradeWidget ) and extract them in separate config file.
const tokens = {
  mkr: {
    icon: <MKR />,
    symbol: "MKR",
    name: "Maker"
  },
  dai: {
    icon: <DAI />,
    symbol: "DAI",
    name: "DAI",
  },
}

class Allowances extends React.Component {

  tokens = () => {
    return Object.keys(tokens);
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
                    this.tokens().map((token, index) => {
                      return (
                        <div key={index} className="token" onClick={() => this.props.select(token)}>
                          <span className="token-icon">{tokens[token].icon}</span>
                          <span className="token-name"> {tokens[token].name}</span>
                          <span className="done-placeholder">
                            <Done/>
                          </span>
                        </div>
                      )
                    })
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
