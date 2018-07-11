
import React from 'react';
import {observer} from "mobx-react";
import SetTrade from './SetTrade';
import DoTrade from './DoTrade';

class TradeWidget extends React.Component {
  render() {
    return (
      <div style={ {position: 'relative'} }>
        {
          this.props.system.trade.step === 1
            ?
            <SetTrade network={this.props.network}
                      system={this.props.system}
                      profile={this.props.profile}
                      transactions={this.props.transactions} />
            :
            <DoTrade  network={this.props.network}
                      system={this.props.system}
                      profile={this.props.profile}
                      transactions={this.props.transactions} />
        }
      </div>
    )
  }
}

export default observer(TradeWidget);
