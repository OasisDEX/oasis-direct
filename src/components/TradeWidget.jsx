import React, { Component } from 'react';
import SetTrade from './SetTrade';
import DoTrade from './DoTrade';
import WidgetContext from '../contexts/WidgetContext';


class TradeWidget extends Component {
  render() {
    return (
      <WidgetContext.Consumer>
        {
          values => (
            <React.Fragment>
              {
                values.trade.step === 1
                  ?
                  <SetTrade {...values} />
                  :
                  <DoTrade {...values} />
              }
            </ React.Fragment>
          )
        }
      </WidgetContext.Consumer>
    )
  }
}

export default TradeWidget;
