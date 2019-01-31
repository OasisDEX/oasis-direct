// Libraries
import React from "react";

// Components
import LandingPage from "./LandingPage";

const Main = props => (
  <LandingPage>
    <section className="Content">
      <main className="Container">
        <div>
          <div className="MainHeading">
            <h1>Oasis.Direct is shutting down.</h1>
          </div>
          <div className="SecondaryHeading">
            <h2>
              For more information, check out:
              <a style={{
                textDecoration:'none',
                color:'white'
              }}
                 href="https://medium.com/makerdao/a-new-oasis-5b9539a64adf">
                &nbsp;A New Oasis
              </a>
            </h2>
          </div>
        </div>
      </main>
    </section>
  </LandingPage>
);

export default Main;
