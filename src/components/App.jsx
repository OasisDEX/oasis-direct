// Libraries
import React from "react";
import {observer, Provider} from "mobx-react";

// Components
import FAQ from "./FAQ";
import LandingPage from "./LandingPage";
import Main from "./Main";
import Widget from "./Widget";

// Stores
import NetworkStore from "../stores/Network";
import ProfileStore from "../stores/Profile";
import TransactionsStore from "../stores/Transactions";
import SystemStore from "../stores/System";

// Internal Libraries
import * as Blockchain from "../blockchainHandler";

// Convenient console access
window.blockchain = Blockchain;
window.network = NetworkStore;
window.profile = ProfileStore;
window.transactions = TransactionsStore;
window.system = SystemStore;

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      section: "",
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

  render() {
    return (
      <Provider network={NetworkStore} profile={ProfileStore} transactions={TransactionsStore} system={SystemStore}>
        {
          this.state.section === "trade-widget"
          ?
            <Widget section={this.state.section} />
          :
            <LandingPage>
              {
                this.state.section === "faq"
                ?
                  <FAQ />
                :
                  <Main widget={<Widget section={this.state.section} />} />
              }
            </LandingPage>
        }
      </Provider>
    );
  }
}

export default observer(App);
