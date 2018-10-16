import React from 'react';

export const ERRORS = Object.freeze({
  NO_ORDERS: (tradeSide, amount, token) =>
    (
      <React.Fragment>
        No orders available to {tradeSide} <strong>{amount} {token.toUpperCase()}</strong>
      </React.Fragment>
    ),
  NO_GAS_FUNDS: `You will not have enough  Ether to pay for the transaction`,
  MINIMAL_VALUE: (threshold, token) => `The Minimum trade value is ${threshold} ${token.toUpperCase()}`,
  INSUFFICIENT_FUNDS: (amount, token) => `You don't have ${amount} ${token.toUpperCase()} in your wallet`
});