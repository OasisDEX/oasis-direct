// Libraries
import React from "react";

class Accordion extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isCollapsed: false
    }
  }

  render() {
    return (
      <div className="Accordion">
        <div className={`Headline ${this.state.isCollapsed ? "Headline--collapsed" : ""}`}
             onClick={() => this.setState({isCollapsed: !this.state.isCollapsed})}>
          <span>{this.props.headline}</span>
        </div>
        <div className="Content">
          <span>{this.props.content}</span>
        </div>
      </div>
    )
  }
}

export default Accordion;
