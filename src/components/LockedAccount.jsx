import React from "react";

import {isMetamask} from "../blockchainHandler";
import {BackIcon, Circle} from "./Icons";

const LockedAccount = props => {
  const metamask = isMetamask();
  return (
    <div className="frame no-account">
        <div className="heading">
          <button className="back" onClick={props.onBack}>
            <Circle><BackIcon /></Circle>
          </button>
          <h2>
            { metamask ? "Metamask Account Locked" : "No Account found" }
          </h2>
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

export default LockedAccount;
