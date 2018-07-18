// Libraries
import React from "react";
import {inject, observer} from "mobx-react";

// Components
import ActiveConnection from "./ActiveConnection";
import DoTrade from "./DoTrade";
import SetTrade from "./SetTrade";

// UI Components
import {Ether, MKR, DAI} from "../components-ui/Icons";

// Internal Libraries
import * as Blockchain from "../utils/blockchain-handler";
import {fetchETHPriceInUSD} from "../utils/helpers";

class TradeWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ethBalance: 0,
      showActiveConnection: false
    }
  }

  tokens = {
    eth: {
      icon: <Ether />,
      symbol: "ETH",
      name: "Ether"
    },
    mkr: {
      icon: <MKR />,
      symbol: "MKR",
      name: "Maker"
    },
    dai: {
      icon: <DAI />,
      symbol: "DAI",
      name: "DAI",
    },
  }

  componentDidMount() {
    this.priceTickerInterval = (this.fetchPriceInUSD(), setInterval(this.fetchPriceInUSD, 3000000));
    Blockchain.getEthBalanceOf(this.props.network.defaultAccount).then((balance) => {
      this.setState({ethBalance: balance.valueOf()});
    });
  }

  fetchPriceInUSD = () => {
    fetchETHPriceInUSD().then(price => {
      this.setState({priceInUSD: price});
    })
  }

  showConnectionDetails = () => {
    this.setState({showActiveConnection: true});
  }

  hideConnectionDetails = () => {
    this.setState({showActiveConnection: false});
  }

  render() {
    return (
      <div style={ {position: "relative"} }>
        {
          this.props.system.trade.step === 1
          ?
            this.state.showActiveConnection
            ?
              <ActiveConnection ethBalance={this.state.ethBalance} back={this.hideConnectionDetails} />
            :
              <SetTrade tokens={this.tokens} showConnectionDetails={this.showConnectionDetails} priceInUSD={this.state.priceInUSD} />
          :
            <DoTrade tokens={this.tokens} />
        }
      </div>
    )
  }
}

export default inject("network")(inject("system")(observer(TradeWidget)));
