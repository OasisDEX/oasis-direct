import React, { Component } from 'react'
import TokenAmount from "./TokenAmount";
import Spinner from "./Spinner";
import { fetchETHPriceInUSD } from '../helpers';

class Congratulation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      priceInUSD: 0
    }
  }

  fetchPriceInUSD = () => {
    fetchETHPriceInUSD().then(price => {
      this.setState({priceInUSD: price});
    })
  }

  componentDidMount() {
    this.priceTickerInterval = (this.fetchPriceInUSD(), setInterval(this.fetchPriceInUSD, 3000000));
  }

  componentWillUnmount() {
    clearInterval(this.priceTickerInterval);
  }

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
        <span className="label">
          You have {this.props.quotation.isCounter ? "sold" : "bought"}&nbsp;
          <TokenAmount number={this.props.quotation.isCounter ? this.props.sold : this.props.bought} decimal={5}
                       token={this.props.quotation.base.toUpperCase()}/>&nbsp;
          {this.props.quotation.isCounter ? "for" : "with"}&nbsp;
          <TokenAmount number={this.props.quotation.isCounter ? this.props.bought : this.props.sold} decimal={5}
                       token={this.props.quotation.quote.toUpperCase()}/>&nbsp;
          <br/>
          by paying&nbsp;
          <span className="value">
            {
              this.props.isCalculatingGas
                ? <span><Spinner/></span>
                : <TokenAmount number={this.props.gas * this.state.priceInUSD} token={'USD'}/>
            }&nbsp;
          </span>
          gas cost
        </span>
      </div>
    </div>
  )
}

export default Congratulation;
