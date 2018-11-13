import { tid } from "../utils";

import Finalization from "./Finalization";

export default class Trade {

  constructor(from, to, willPay, willReceive) {
    this.from = from;
    this.to = to;
    this.willPay = willPay;
    this.willReceive = willReceive
  }

  sell = (amount = this.willPay) => {
    cy.get(tid("set-trade-from-amount"))
      .find('input').type(amount);

    return this;
  };

  buy = (amount = this.willReceive) => {
    cy.get(tid("set-trade-to-amount"))
      .find('input').type(amount);

    return this;
  };


  acceptTerms = () => {
    cy.get(tid("terms-and-conditions")).click({position: "topRight", force: true});
    return this;
  };

  execute = () => {
    cy.get(tid("initiate-trade")).click();
    return new Finalization(this);
  };
}

chai.Assertion.addChainableMethod("receive", function (amount) {
  cy.get(tid("set-trade-to-amount"), {timeout: 2000})
    .find('input').should('have.value', `${amount}`);
});
