import React from 'react';

export const ERRORS = Object.freeze({
  NO_ORDERS: (tradeSide, amount, token) =>
    (
      <React.Fragment key="error">
        No orders available to {tradeSide} <span className="error-msg value" key="error-amount">{formatNumber(amount,5)} {token.toUpperCase()}</span>
      </React.Fragment>
    ),
  NO_GAS_FUNDS: `You will not have enough  Ether to pay for the transaction`,
  MINIMAL_VALUE: (threshold, token) => `The Minimum trade value is ${threshold} ${token.toUpperCase()}`,
  INSUFFICIENT_FUNDS: (amount, token) => `You don't have ${formatNumber(amount,5)} ${token.toUpperCase()} in your wallet`
});

/* This is a TEMPORARY function.
 * formatNumber#helpers.js must be use.
 *
 * The reason why we are not using it is that the latter function
 * depends on web3 module which depends on ledger-subprovider.js
 * The syntax includes  the one for Flow typings.
 *
 * Out tests fails so this is a way to not block further development.
* */
export const formatNumber = (amount, decimals) => {
  const parts = amount.toString().split(".");
  const whole = parts[0];
  const decimal_digits = parts[1];

  if(decimal_digits){
     return whole + "." + decimal_digits.slice(0,decimals);
  } else {
    return amount;
  }
};