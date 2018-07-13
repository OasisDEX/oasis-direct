import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "mobx-react";

import App from "./components/App";

import network from "./stores/Network";
import profile from "./stores/Profile";
import transactions from "./stores/Transactions";
import system from "./stores/System";

import "./index.css";

window.network = network;
window.profile = profile;
window.transactions = transactions;
window.system = system;

window.addEventListener("load", () => {
  ReactDOM.render((
    <Provider network={network} profile={profile} transactions={transactions} system={system}>
      <App />
    </Provider>
  ), document.getElementById("root"));
});
