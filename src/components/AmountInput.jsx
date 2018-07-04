import React from 'react';

class AmountInput extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value || ""
    }
  }

  onChange = (event) => {
    const value = event.target.value;

    const whole = value.split(".")[0];
    const decimals = value.split(".")[1];

    if (whole.length <= 15 && (!decimals || (decimals && decimals.length <= 18))) { // 18 should be replaced with any token's decimals according to some sort of configuration
      this.props.onChange(value);
      this.setState({value});
    }
  }

  render = () => {
    const {onChange, ...others} = this.props;

    return (
      <input type="number"
             value={this.state.value}
             onChange={this.onChange}
             {...others}
      />
    )
  }
}

export default AmountInput