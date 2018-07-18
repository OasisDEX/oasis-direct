import React from 'react';

class Checkbox extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      isChecked: false
    };
  }

  toggle = () => {
    if(typeof this.props.onToggle === 'function') {
      this.props.onToggle();
    }

    this.setState({isChecked: !this.state.isChecked});
  };

  render = () => (
    <div className={this.props.className} onClick={this.toggle}>
      <span className={`checkbox ${this.state.isChecked ? "checked" : ""}`}/>
      <span className="label">
        {this.props.children}
      </span>
    </div>
  )
}

export default Checkbox;