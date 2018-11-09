import { tid } from "../utils";
export default class Summary {

  expectProxyBeingCreated = () => {
    cy.get(tid("proxy-creation-summary")).contains('You have successfully created a Proxy');
  };

  expectProxyNotBeingCreated = () => {
    cy.get(tid("proxy-creation-summary"))
      .should('not.exist');
  };

  expectSold = (amount, token) => {
    cy.get(tid("congratulation-message", (tid("sold-token"), tid("token-amount-value")))).contains(`${amount} ${token}`);
  };

  expectBought = (amount, token) => {
    cy.get(tid("congratulation-message", tid("bought-token", tid("token-amount-value")))).contains(`${amount} ${token}`);
  };

  expectGasCost = (amount) => {
    //TODO: impl
  };

  expectPriceOf = (price) => {
    cy.get(tid("congratulation-message", tid("final-price", tid("token-amount-value")))).contains(price);
  };

}