import React from "react"
import {observer} from "mobx-react";

import Spinner from "./Spinner";
import TokenAmount from "./TokenAmount";

import { calculateTradePrice, fetchETHPriceInUSD, toWei } from "../helpers";

class Congratulation extends React.Component {
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

  render = () => {
    const finalizedPrice = this.props.quotation.isCounter
     ? calculateTradePrice(this.props.quotation.base, this.props.sold, this.props.quotation.quote, this.props.bought)
     : calculateTradePrice(this.props.quotation.base, this.props.bought, this.props.quotation.quote, this.props.sold);
    return (
      <div className="transaction-result congratulation">
        <h3 className="heading">
          <span>Congratulations!</span>
          <span className="status label info">Confirmed</span>
        </h3>
        <div className="content">
          {
            this.props.hasCreatedProxy &&
            <span className="label">
              You have successfully create a <span className="value"> Proxy </span>
              <br/>
              <br/>
            </span>

          }
        <span className="label">
          {
            this.props.hasCreatedProxy
            ?
              <React.Fragment>You have {this.props.quotation.isCounter ? "sold" : "bought"}&nbsp;</React.Fragment>
            :
              <React.Fragment>By using your <span className="value"> Proxy </span> you {this.props.quotation.isCounter ? "sold" : "bought"}&nbsp;</React.Fragment>
          }
          <TokenAmount number={this.props.quotation.isCounter ? this.props.sold : this.props.bought} decimal={5}
                       token={this.props.quotation.base.toUpperCase()}/>&nbsp;
          {this.props.quotation.isCounter ? "for" : "with"}&nbsp;
          <TokenAmount number={this.props.quotation.isCounter ? this.props.bought : this.props.sold} decimal={5}
                       token={this.props.quotation.quote.toUpperCase()}/>
          <br/>
          at&nbsp;
          <TokenAmount number={toWei(finalizedPrice.price)}
                       token={`${finalizedPrice.priceUnit.toUpperCase()}`}/>
          &nbsp;by paying&nbsp;
          <span className="value">
            {
              this.props.isCalculatingGas
              ?
                <span><Spinner/></span>
              :
                <TokenAmount number={this.props.gas * this.state.priceInUSD} token={"USD"}/>
            }&nbsp;
          </span>
          gas cost
        </span>
        </div>
      </div>
    )
  }
}

export default observer(Congratulation);
