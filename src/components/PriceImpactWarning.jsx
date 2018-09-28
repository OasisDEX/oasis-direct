import React, { Component } from 'react';
import PriceImpactGraph from "../components-ui/PriceImpactGraph";

export class PriceImpactWarning extends Component {

  render() {
    return (
      <section className="frame price-impact-warning">
        <section className="heading">
          <h2> Order Warning! </h2>
          <button className="close" onClick={this.props.onDismiss}/>
        </section>
        <section className="content">
          <div className="container">
            <PriceImpactGraph/>
            <p className="impact-text">
              Order has a significant <span className="danger">price impact of {this.props.priceImpact}%</span>
            </p>
            <p className="continue-text">Do you still want to proceed?</p>
          </div>
        </section>
        <button type="button" value="Start transaction" className="start" onClick={this.props.onAcknowledge}>
          PROCEED WITH ORDER
        </button>
      </section>
    )
  }
}