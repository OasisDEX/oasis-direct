import { tid } from "../utils";
import Summary from "./Summary";

export default class Finalization {

  constructor(trade) {
    this.trade = trade;
  }

  willCreateProxy = () => {
    cy.get(tid("trade-with-builtin-proxy-creation"))
      .find('.details')
      .find('.label.vertical-align span')
      .contains("Create Proxy");
    return this;
  };

  willNotCreateProxy = () => {
    cy.get(tid("trade-with-builtin-proxy-creation"))
      .should('not.exist');
    return this;
  }

  // willSetAllowanceOn(token)

  willCommitATrade = () => {
    const {willPay, from, willReceive, to} = this.trade;

    cy.get(tid("trade-token-from"))
      .find(tid("token-amount-value"))
      .contains(`${willPay} ${from.toUpperCase()}`);

    cy.get(tid("trade-token-to"))
      .find(tid("token-amount-value"))
      .contains(`${willReceive} ${to.toUpperCase()}`);

    cy.get(tid("summary"), {timeout: 20000});

    return new Summary();
  }
}