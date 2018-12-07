// Libraries
import React from "react";

export default class extends React.Component {
  render = () => {
    const Logo = this.props.logo;

    return (
      <div className={`product-cover ${this.props.className || ""}`} onClick={this.props.disabled ? () => false : this.props.onClick}>
        {
          this.props.logo &&
          <span className="logo"><Logo/></span>
        }
        {
          this.props.label &&
          <span className="label">{this.props.label}</span>
        }
      </div>
    )
  }
}
