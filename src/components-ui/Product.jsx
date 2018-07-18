// Libraries
import React from 'react';

export default class extends React.Component {
  render = () => {
    const Logo = this.props.logo;

    return (
      <div className={`product-cover ${this.props.className || ''}`} onClick={this.props.disabled ? () => false : this.props.onClick}>
        <span className="logo"><Logo/></span>
        <span className="label">{this.props.label}</span>
      </div>
    )
  }
}
