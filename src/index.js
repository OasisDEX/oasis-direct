// Libraries
import React from "react";
import ReactDOM from "react-dom";

// Components
import App from "./components/App";

import "./index.css";

window.addEventListener("load", () => {
  ReactDOM.render((
      <App />
  ), document.getElementById("root"));
});
