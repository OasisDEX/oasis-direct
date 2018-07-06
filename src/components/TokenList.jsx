import React from 'react';
import TokenDetails from "./TokenDetails";

const TokenList = (props) => {
  const {tokens, balances, onSelect, onClose} = props;

  return (
    <div className="frame">
      <div className="token-selector">
        <button className="close" onClick={onClose}/>

        <div className="tokens-container">
          <div className="tokens">
            <div className="token-list">
              {
                Object.values(tokens).map((token, index) => {
                    token.balance = balances[token.symbol.toLowerCase()].valueOf();
                    token.symbol = token.symbol.toUpperCase();
                    return <TokenDetails key={index} token={token} select={onSelect}/>;
                  }
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenList;
