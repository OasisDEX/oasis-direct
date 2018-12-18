// Libraries
import React from "react";
import { inject, observer } from "mobx-react";

// Components
import ActiveConnection from "./ActiveConnection";
import DoTrade from "./DoTrade";
import SetTrade from "./SetTrade";

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

  componentWillUnmount() {
    clearInterval(this.priceTickerInterval);
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
      view: <SetTrade showTradeSettings={this.switchToTradeSettings}
                      showConnectionDetails={this.switchToActiveConnection}/>
    })
  };

  switchToTradeFinalization = () => {
    this.setState({
      view: <DoTrade />
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
