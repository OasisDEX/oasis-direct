// Libraries
import React from "react";
import {withRouter, Route, Switch} from "react-router-dom";

// Components
import FAQ from "./FAQ";
import Main from "./Main";
import Widget from "./Widget";

@withRouter
class Routes extends React.Component {
  componentDidUpdate = prevProps => {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    return (
      <Switch>
        <Route exact path="/trade-widget" render={() => <Widget section="trade-widget" />} />
        <Route exact path="/faq" render={() => <FAQ />} />
        <Route /*exact path="/"*/ render={() => <Main widget={<Widget section="" />} />} />
        {/* <Route component={ NotFound } /> */}
      </Switch>
    );
  }
}

export default Routes;
