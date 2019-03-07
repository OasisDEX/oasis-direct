// Libraries
import React from "react";
import {withRouter, Route, Switch} from "react-router-dom";

// Components
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
        <Route /*exact path="/"*/ render={() => <Widget section="tax-exporter" />} />
        {/* <Route component={ NotFound } /> */}
      </Switch>
    );
  }
}

export default Routes;
