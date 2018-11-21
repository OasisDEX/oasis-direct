import * as React from "react";
import { DAI, Ether } from "../components-ui/Icons"

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

const ukn = {
  icon: <Ether/>,
  symbol: "UKN",
  name:"UKN"
};

const tokens = process.env.REACT_APP_ENV === "prod" ? Object.freeze({eth, dai}) : Object.freeze({eth, dai, ukn},);

export const excludes = (symbol = "") => {
  const symbols = Object.keys(tokens);

  if (typeof symbol === "string") {
    return symbols.filter(token => token.toLowerCase() !== symbol.toLowerCase());
  }

  return symbols
};

export default tokens;
