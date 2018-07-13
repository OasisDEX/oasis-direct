import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "mobx-react";

import App from "./components/App";

import stores from "./stores/index";

import "./index.css";

window.addEventListener("load", () => {
  ReactDOM.render((
    <Provider network={stores.network} profile={stores.profile} transactions={stores.transactions} system={stores.system}>
      <App />
    </Provider>
  ), document.getElementById("root"));
});
