import React, { Component } from 'react';

const toHtml = (htmlAsString) => {
  return { __html:htmlAsString };
}

class Accordion extends Component {

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
             onClick={() => {
               this.setState({isCollapsed: !this.state.isCollapsed})
             }}>
          <span dangerouslySetInnerHTML={toHtml(this.props.headline)}/>
        </div>
        <div className="Content">
          <span dangerouslySetInnerHTML={toHtml(this.props.content)}/>
        </div>
      </div>
    )
  }
}

export default Accordion;