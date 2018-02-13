import React from 'react';
import web3 from  '../web3';
import '../styles/NoConnection.css'


const NoConnection = () => {
  const metamask = web3.currentProvider.constructor.name === 'MetamaskInpageProvider';
  return (
    <div className="frame no-account">
        <div className="heading">
          <h2>
            { metamask ? 'Metamask Account Locked' : 'No Account found' }</h2>
        </div>
        <section className="content">
          {
            metamask &&
            <div className="heading">
             <div className="icon metamask--big"/>
              <h3>Unlock your Account on the Extension.</h3>
            </div>
          }
        </section>
    </div>
  )
}

export default NoConnection;
