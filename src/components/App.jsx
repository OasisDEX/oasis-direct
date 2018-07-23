// Libraries
import React from "react";
import {observer, Provider} from "mobx-react";
import {BrowserRouter} from "react-router-dom";

// Components
import Routes from "./Routes";

// Stores
import NetworkStore from "../stores/Network";
import ProfileStore from "../stores/Profile";
import TransactionsStore from "../stores/Transactions";
import SystemStore from "../stores/System";

// Utils
import * as Blockchain from "../utils/blockchain-handler";

// Convenient console access
window.blockchain = Blockchain;
window.network = NetworkStore;
window.profile = ProfileStore;
window.transactions = TransactionsStore;
window.system = SystemStore;

class App extends React.Component {
  render() {
    return (
      <Provider network={NetworkStore} profile={ProfileStore} transactions={TransactionsStore} system={SystemStore}>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Provider>
    );
  }
}

export default observer(App);
