import React, { Component } from 'react'
import TokenAmount from "./TokenAmount";
import Spinner from "./Spinner";
import {fetchETHPriceInUSD} from '../helpers';

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
        <pre>
                <span className="label">
                  You have sold&nbsp;
                  <TokenAmount number={this.props.sold} decimal={5} token={this.props.quote.toUpperCase()}/>
                  &nbsp;by paying&nbsp;
                  <span className="value">
                  {
                    this.props.isCalculatingGas
                      ? <span><Spinner/></span>
                      : <TokenAmount number={this.props.gas * this.state.priceInUSD} token={'USD'}/>
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
