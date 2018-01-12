import React from 'react';
import web3 from  '../web3';
import '../styles/NoConnection.css'


const NoConnection = () => {
  const metamask = web3.currentProvider.constructor.name === 'MetamaskInpageProvider';
  return (
    <div className="frame">
      <div className="connectionless">
        <div className="heading">
          <h2>
            { metamask ? 'Metamask Account Locked' : 'Not Account found' }</h2>
        </div>
        <section className="content">
          {
            metamask &&
            <div className="heading">
              <img type="svg" width="100" height="100" src="/assets/od_metamask_big.svg" alt="Metamask" />
              <h3>You are trying to access Oasis.direct without an unlocked account.<br />Unlock your account on the Metamask Extension.</h3>
            </div>
          }
        </section>
      </div>
    </div>
  )
}

export default NoConnection;
