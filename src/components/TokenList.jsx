import React from 'react';
import TokenAmount from './TokenAmount';
import Spinner from './Spinner';

class TokenList extends React.Component {
  render() {
    const {tokens , balances , onSelect, onClose } = this.props;

    return (
      <div className="frame">
        <div className="token-selector">
          <button className="close" onClick={onClose}/>
          <div className="tokens-container">
            <div className="tokens">
              <div className="token-list">
                {
                  Object.values(tokens).map((token, index) => (
                      <div key={index} className='token' onClick={() => {
                        onSelect(token.symbol.toLowerCase())
                      }}>
                        <span className="token-icon">{token.icon}</span>
                        {
                          balances[token.symbol.toLowerCase()]
                            ? <TokenAmount className="token-name"
                                           number={balances[token.symbol.toLowerCase()].valueOf()}
                                           decimal={3}
                                           token={token.symbol.toUpperCase()}/>
                            : <Spinner/>
                        }
                      </div>
                    )
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TokenList;
