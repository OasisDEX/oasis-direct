import React, { Component } from "react";
import {observer} from "mobx-react";

import FAQ from "./FAQ";
import Widget from "./Widget";

import * as Blockchain from "../blockchainHandler";
import { Logo } from "./Icons";

window.Blockchain = Blockchain;

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


  renderWidget = () => {
    return <Widget section={this.state.section} />
  }

  render = () => {
    return (
      this.state.section === "trade-widget"
        ?
        this.renderWidget()
        :
        <section className="bg-section">
          <section>
            <header className="Container">
              <div className={`Logo Logo--no-margin`}>
                <a href="/"> <Logo/> </a>
              </div>
              <div className={"NavigationLinks"}>
                {/* <a href="/#" style={{color: "white"}}>Trade</a> */}
                {/* <a href="/#tax-exporter" style={{color: "white"}}>Export Trades</a> */}
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
                  {this.renderWidget()}
                </main>
              </section>
          }
          <section>
            <footer className="Container">
              <div className="LinksWrapper">
                <h1> Resources </h1>
                <ul className="Links">
                  <li className="Link"><a href="https://developer.makerdao.com/" target="_blank"
                                          rel="noopener noreferrer">Documentation</a></li>
                  <li className="Link"><a href="OasisToS.pdf" target="_blank" rel="noopener noreferrer">Legal</a></li>
                  <li className="Link" onClick={() => {
                    window.scrollTo(0, 0);
                  }}><a href="/#faq" style={{color: 'white'}}>FAQ</a></li>
                </ul>
              </div>
              <div className="LinksWrapper">
                <h1> Oasis </h1>
                <ul className="Links">
                  <li className="Link"><a href="https://oasisdex.com" target="_blank" rel="noopener noreferrer">Oasisdex.com</a>
                  </li>
                  {/* <li className="Link"><a href="#a" target="_blank" rel="noopener noreferrer">Oasis.tax</a></li> */}
                </ul>
              </div>
              <div className="LinksWrapper">
                <h1> Maker </h1>
                <ul className="Links">
                  <li className="Link"><a href="https://chat.makerdao.com" target="_blank"
                                          rel="noopener noreferrer">Chat</a></li>
                  <li className="Link"><a href="https://www.reddit.com/r/MakerDAO/" target="_blank"
                                          rel="noopener noreferrer">Reddit</a></li>
                </ul>
              </div>
              <div className="LinksWrapper">
                <h1> Follow us </h1>
                <ul className="Links">
                  <li className="Link"><a href="https://twitter.com/oasisdirect" target="_blank"
                                          rel="noopener noreferrer">Twitter</a></li>
                  <li className="Link"><a href="https://steemit.com/@oasisdirect" target="_blank"
                                          rel="noopener noreferrer">Steem</a></li>
                </ul>
              </div>
            </footer>
          </section>
        </section>
    );
  }
}

export default observer(App);
