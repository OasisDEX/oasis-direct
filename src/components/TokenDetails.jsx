import React from 'react';
import TokenAmount from "./TokenAmount";
import Spinner from "../components-ui/Spinner";

const TokenDetails = (props) => {
  const {icon, balance, symbol} = props.token;
  return (
    <div className='token' onClick={() => {
      props.select(symbol);
    }}>
      <span className="token-icon">{icon}</span>
      {
        balance
          ? <TokenAmount className="token-name"
                         number={balance}
                         decimal={3}
                         token={symbol}/>
          : <Spinner/>
      }
    </div>
  )
};

export default TokenDetails;