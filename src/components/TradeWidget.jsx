
import React from "react";
import {inject, observer} from "mobx-react";

import DoTrade from "./DoTrade";
import SetTrade from "./SetTrade";

class TradeWidget extends React.Component {
  render() {
    return (
      <div style={ {position: "relative"} }>
        {
          this.props.system.trade.step === 1
            ?
              <SetTrade />
            :
              <DoTrade />
        }
      </div>
    )
  }
}

export default inject("system")(observer(TradeWidget));
