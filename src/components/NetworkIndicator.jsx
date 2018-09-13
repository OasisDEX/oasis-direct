// Libraries
import React from "react";

class NetworkIndicator extends React.Component {

  render = () => (
    <div className={`network-indicator ${this.props.network}`}>
      {this.props.network}
    </div>
  )
}

export default NetworkIndicator;
