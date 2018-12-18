// Libraries
import React from "react";
import { GAS_PRICE_LEVELS } from "../utils/constants";

class GasPriceDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isExpanded: false,
      selected: this.props.default || "Choose"
    }
  }

  toggle = () => {
    this.setState(prevState => {
      return {isExpanded: !prevState.isExpanded}
    });
  };

  render() {
    return (
      <div className={`Dropdown ${this.props.className || ''} ${this.state.isExpanded ? 'toggled' : ''}`}
           onClick={this.toggle}>
        <div className={`Selected capitalize`}>
          {this.state.selected.level}
        </div>
        <div className={`Options ${this.state.isExpanded ? "shown" : "hidden"}`}>
          {
            Object.values(this.props.quotes).map((quote, index) => {
              return (
                <span key={index} className={`Option capitalize`}
                      onClick={() => {
                        this.props.onSelect(quote);
                        this.setState({selected: quote})
                      }}>
                  <span> {quote.level} </span>
                  {
                    quote.level !== GAS_PRICE_LEVELS.CUSTOM
                    && <span className={`Details`}>{quote.price} GWEI</span>
                  }
                </span>
              )
            })
          }
        </div>
      </div>
    )
  }
}

export default GasPriceDropdown;