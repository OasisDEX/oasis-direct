import React, { Component } from 'react'
import TokenAmount from "./TokenAmount";
import Spinner from "./Spinner";

class Congratulation extends Component {
  render = () => (
    <div className="transaction-result">
      <h3 className="heading">
        <span>Congratulations!</span>
        {
          this.props.hasStatus
            ? <span className="status label info">Confirmed</span>
            : <React.Fragment/>
        }

      </h3>
      <div className="content">
        <pre>
                <span className="label">
                  You bought&nbsp;
                  <TokenAmount number={this.props.bought} decimal={5} token={this.props.base.toUpperCase()}/>
                  &nbsp;with&nbsp;
                  <TokenAmount number={this.props.sold} decimal={5} token={this.props.quote.toUpperCase()}/>
                  <br/>
                  by paying&nbsp;
                  <span className="value">
                  {
                    this.props.isCalculatingGas
                      ? <span><Spinner/></span>
                      : <TokenAmount number={this.props.gas} token={'ETH'}/>
                  }
                    &nbsp;
                  </span>
                  gas cost
                </span>
        </pre>
      </div>
    </div>
  )
}

export default Congratulation;
