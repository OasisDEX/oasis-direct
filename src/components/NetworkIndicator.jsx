import React, { Component } from 'react';

class NetworkIndicator extends Component {

  render = () => (
    <div className={`network-indicator ${this.props.network}`}>
      {this.props.network}
    </div>
  )
}


export default NetworkIndicator;