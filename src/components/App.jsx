import React, { Component } from "react";
import {observer, Provider} from "mobx-react";

import FAQ from "./FAQ";
import Widget from "./Widget";

import network from "../stores/Network";
import profile from "../stores/Profile";
import transactions from "../stores/Transactions";
import system from "../stores/System";

import * as Blockchain from "../blockchainHandler";
import { Logo } from "./Icons";

window.Blockchain = Blockchain;
window.network = network;
window.profile = profile;
window.transactions = transactions;
window.system = system;

class App extends Component {
  constructor() {
    super();
    this.state = {
      section: "exchange",
    }
  }

  componentDidMount = () => {
    this.setHashSection();
    setTimeout(this.listenOnHashChange, 500);
  }

  listenOnHashChange = () => {
    window.onhashchange = () => {
      this.setHashSection();
    }
  }

  setHashSection = () => {
    const section = window.location.hash.replace(/^#\/?|\/$/g, "").split("/")[0];
    this.setState({section});
  }
  //

  render = () => {
    return (
      <Provider network={network} profile={profile} transactions={transactions} system={system}>
        {
          this.state.section === "trade-widget"
          ?
            <Widget section={this.state.section} />
          :
            <section className="bg-section">
              <section>
                <header className="Container">
                  <div className="Logo Logo--no-margin">
                    <a href="/"><Logo/></a>
                  </div>
                </header>
              </section>
              {
                this.state.section === "faq"
                ?
                  <FAQ/>
                :
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
                      <Widget section={this.state.section} />
                    </main>
                  </section>
              }
              <section>
                <footer className="Container">
                  <div className="LinksWrapper">
                    <h1>Resources</h1>
                    <ul className="Links">
                      <li className="Link"><a href="https://developer.makerdao.com/" target="_blank" rel="noopener noreferrer">Documentation</a></li>
                      <li className="Link"><a href="OasisToS.pdf" target="_blank" rel="noopener noreferrer">Legal</a></li>
                      <li className="Link" onClick={() => {
                        window.scrollTo(0, 0);
                      }}><a href="/#faq" style={{color: 'white'}}>FAQ</a></li>
                    </ul>
                  </div>
                  <div className="LinksWrapper">
                    <h1>Oasis</h1>
                    <ul className="Links">
                      <li className="Link"><a href="https://oasisdex.com" target="_blank" rel="noopener noreferrer">Oasisdex.com</a>
                      </li>
                    </ul>
                  </div>
                  <div className="LinksWrapper">
                    <h1>Maker</h1>
                    <ul className="Links">
                      <li className="Link"><a href="https://chat.makerdao.com" target="_blank" rel="noopener noreferrer">Chat</a></li>
                      <li className="Link"><a href="https://www.reddit.com/r/MakerDAO/" target="_blank" rel="noopener noreferrer">Reddit</a></li>
                    </ul>
                  </div>
                  <div className="LinksWrapper">
                    <h1>Follow us</h1>
                    <ul className="Links">
                      <li className="Link"><a href="https://twitter.com/oasisdirect" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                      <li className="Link"><a href="https://steemit.com/@oasisdirect" target="_blank" rel="noopener noreferrer">Steem</a></li>
                    </ul>
                  </div>
                </footer>
              </section>
            </section>
        }
      </Provider>
    );
  }
}

export default observer(App);
