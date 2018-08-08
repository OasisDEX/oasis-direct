// Libraries
import React from "react";
import {observer, Provider} from "mobx-react";
import {BrowserRouter} from "react-router-dom";

// Components
import Routes from "./Routes";

// Stores
import rootStore from "../stores/Root";

// Utils
import * as Blockchain from "../utils/blockchain-handler";

// Convenient console access
window.blockchain = Blockchain;
window.network = rootStore.network;
window.profile = rootStore.profile;
window.transactions = rootStore.transactions;
window.system = rootStore.system;

class App extends React.Component {
  render() {
    return (
      <Provider network={rootStore.network} profile={rootStore.profile} transactions={rootStore.transactions} system={rootStore.system}>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Provider>
    );
  }
}

export default observer(App);
