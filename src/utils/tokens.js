import * as React from "react";
import { DAI, Ether, MKR } from "../components-ui/Icons"

const eth = {
  icon: <Ether/>,
  symbol: "ETH",
  name: "Ether"
};

const dai = {
  icon: <DAI/>,
  symbol: "DAI",
  name: "DAI",
};

const mkr = {
  icon: <MKR/>,
  symbol: "MKR",
  name: "Maker"
};

const enabledTokens = { }

const envEnabledTokens = process.env.OASIS_ALLOWED_TOKENS.split(",")
if (envEnabledTokens.indexOf("dai")) {
  enabledTokens.dai = dai;
}
if (envEnabledTokens.indexOf("eth")) {
  enabledTokens.eth = eth;
}
if (envEnabledTokens.indexOf("mkr")) {
  enabledTokens.mkr = mkr;
}

const tokens = Object.freeze(enabledTokens);

export const excludes = (symbol = "") => {
  const symbols = Object.keys(tokens);

  if(typeof symbol === "string") {
    return symbols.filter(token => token.toLowerCase() !== symbol.toLowerCase());
  }

  return symbols;
};

export default tokens;