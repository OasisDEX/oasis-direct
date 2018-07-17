import React from "react";

const themes = {
  default: {
    outerCircleColor:"#F8F7F5",
    innerCircleColor:"#3AB493"
  },
  button: {
    outerCircleColor:"#689DF8",
    innerCircleColor:"#FFFFFF"
  }
};

const Spinner = props => {
  const style = Object.assign({height: "18px", width: "18px"}, props.styles);
  let theme = props.theme ? themes[props.theme] : themes.default; // assigned the default theme if attr value is not provided
  theme = theme ? theme : themes.default; // assign default theme if the provided one doesn't exist

  return (
    <svg style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"
         preserveAspectRatio="xMidYMid" className="spinner">
      <rect x="0" y="0" width="100" height="100" fill="none" className="bk"/>
      <circle cx="50" cy="50" r="40" stroke={theme.outerCircleColor} fill="none" strokeWidth="10" strokeLinecap="round"/>
      <circle cx="50" cy="50" r="40" stroke={theme.innerCircleColor} fill="none" strokeWidth="6" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" dur="2s" repeatCount="indefinite" from="0" to="502"/>
        <animate attributeName="stroke-dasharray" dur="2s" repeatCount="indefinite"
                 values="150.6 100.4;1 250;150.6 100.4"/>
      </circle>
    </svg>
  )
};

export default Spinner;
