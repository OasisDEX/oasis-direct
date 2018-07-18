// Libraries
import React from "react";

const Main = props => (
  <section className="Content">
    <main className="Container">
      <div>
        <div className="MainHeading">
          <h1>THE FIRST DECENTRALIZED INSTANT MARKETPLACE</h1>
        </div>
        <div className="SecondaryHeading">
          <h2>No Registration. No Fees.</h2>
        </div>
      </div>
      {props.widget}
    </main>
  </section>
);

export default Main;
