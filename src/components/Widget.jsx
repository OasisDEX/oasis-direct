import React, { Component } from 'react';
import TradeWidget from './TradeWidget';
import TaxWidget from './TaxWidget';
import WidgetContext from '../contexts/WidgetContext';

import NoConnection from './NoConnection';
import NoAccount from './NoAccount';
import {isAddress} from '../helpers';


class Widget extends Component {
  render() {
    return (
      <WidgetContext.Consumer>
        {
          values => (
            <div className="Widget">
              {
                values.isConnected
                ?
                  values.account && isAddress(values.account)
                  ?
                    <div>
                      {
                        values.section === 'tax-exporter'
                        ?
                          <TaxWidget {...values} />
                        :
                          <TradeWidget />
                      }
                    </div>
                  :
                    <NoAccount/>
                :
                  <NoConnection/>
              }
            </div>
          )
        }
      </WidgetContext.Consumer>
    )
  }
}

export default Widget;
