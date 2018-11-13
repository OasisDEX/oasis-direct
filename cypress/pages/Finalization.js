import { tid } from "../utils";
import Summary from "./Summary";

export default class Finalization {

  shouldCreateProxy = () => {
    cy.get(tid("trade-with-builtin-proxy-creation"))
      .find('.details')
      .find('.label.vertical-align span')
      .contains("Create Proxy");
    return this;
  };

  shouldNotCreateProxy = () => {
    cy.get(tid("trade-with-builtin-proxy-creation"))
      .should('not.exist');
    return this;
  };

  shouldSetAllowanceFor = (token) => {
    cy.get(tid("set-token-allowance"))
      .contains(`Enabling ${token.toUpperCase()} Trading`);

    return this;
  };

  shouldCommitATrade = (pay, from, receive, to) => {

    cy.get(tid("trade-token-from"))
      .find(tid("token-amount-value"))
      .contains(`${pay} ${from.toUpperCase()}`);

    cy.get(tid("trade-token-to"))
      .find(tid("token-amount-value"))
      .contains(`${receive} ${to.toUpperCase()}`);

    cy.get(tid("summary"), {timeout: 20000});

    return new Summary();
  }
}