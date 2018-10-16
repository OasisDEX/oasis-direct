// Libraries
import React from "react";
import { inject, observer } from "mobx-react";

// Components
import ActiveConnection from "./ActiveConnection";
import DoTrade from "./DoTrade";
import SetTrade from "./SetTrade";

// UI Components
import { Ether, MKR, DAI } from "../components-ui/Icons";

// Utils
import TradeSettings from "./TradeSettings";
import { reaction } from "mobx";

@inject("network")
@inject("system")
@observer
class TradeWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: null,
    };
  }

  tokens = {
    eth: {
      icon: <Ether/>,
      symbol: "ETH",
      name: "Ether"
    },
    mkr: {
      icon: <MKR/>,
      symbol: "MKR",
      name: "Maker"
    },
    dai: {
      icon: <DAI/>,
      symbol: "DAI",
      name: "DAI",
    },
  }

  componentDidMount() {
    this.priceTickerInterval = (this.props.system.getETHPriceInUSD(), setInterval(this.props.system.getETHPriceInUSD, 3000000));
    this.switchToNewTrade();

    reaction(
      () => this.props.system.trade.step,
      step => {
        switch (step) {
          case 1:
            this.switchToNewTrade();
            break;
          case 2:
            this.switchToTradeFinalization();
            break;
          default:
            this.switchToNewTrade();
        }
      });
  }

  switchToTradeSettings = () => {
    this.setState({
      view: <TradeSettings onDismiss={this.switchToNewTrade}/>
    })
  };

  switchToActiveConnection = () => {
    this.setState({
      view: <ActiveConnection ethBalance={this.props.system.balances.eth} back={this.switchToNewTrade}/>
    })
  };

  switchToNewTrade = () => {
    this.setState({
      view: <SetTrade tokens={this.tokens}
                      showTradeSettings={this.switchToTradeSettings}
                      showConnectionDetails={this.switchToActiveConnection}/>
    })
  };

  switchToTradeFinalization = () => {
    this.setState({
      view: <DoTrade tokens={this.tokens}/>
    })
  };


  render() {
    return (
      <div style={{position: "relative"}}>
        {this.state.view}
      </div>
    )
  }
}

export default TradeWidget;
