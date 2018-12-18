// Libraries
import React from "react";

// UI Components
import Spinner from "../components-ui/Spinner";
import TokenAmount from "../components-ui/TokenAmount";

// Utils
import tokens from "../utils/tokens";

class TokensSelector extends React.Component {
  render() {
    return (
      <div className="frame">
        <div className="selector">
          <button className="close" onClick={this.props.back}/>
          <div className="tokens-container">
            <div className="tokens">
              <div className="token-list">
                {
                  Object.keys(tokens).map((token, index) => {
                    return (
                      <div data-test-id={token} key={index} className="token" onClick={() => this.props.select(token)}>
                        <span className="token-icon">{tokens[token].icon}</span>
                        {
                          this.props.balances[token]
                            ?
                              <TokenAmount className="token-name" number={this.props.balances[token].valueOf()} decimal={3} token={token.toUpperCase()} />
                            :
                              <Spinner />
                        }
                      </div>
                    )
                  })
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TokensSelector;
