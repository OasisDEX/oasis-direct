// Libraries
import React from "react";

// Utils
import {formatNumber} from "../utils/helpers";

const TokenAmount = props => {
  return <span className={props.className || "value"} title={formatNumber(props.number, 18)}>{formatNumber(props.number, props.decimal || 5)} {props.token || ""}</span>
};

export default TokenAmount;
