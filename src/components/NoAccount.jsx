import React from 'react';
import { isMetamask } from '../blockchainHandler';
import '../styles/NoConnection.css'


const NoAccount = props => {
  const metamask = isMetamask();
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
          <a href="#action" onClick={ e => { e.preventDefault(); props.showHW('ledger') } }>Connect to Ledger</a>
        </section>
    </div>
  )
}

export default NoAccount;
