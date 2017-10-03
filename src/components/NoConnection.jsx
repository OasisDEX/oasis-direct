import React from 'react';

const NoConnection = () => {
  return (
    <div className="row">
      <div className="col-md-12">
        <div className="callout callout-warning">
          <h4>No connection to Ethereum</h4>
          <p>Please use Parity, Metamask or a local node at <strong>http://localhost:8545</strong></p>
        </div>
      </div>
    </div>
  )
}

export default NoConnection;
