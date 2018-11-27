import {  tid } from "../utils";

export default class Proxy {

  static create = () => {
    cy.get(tid('create-proxy')).click();

    return new Proxy();
  }

   static get status() {
    cy.get(tid('proxy-status')).as('status');
  };

}

chai.Assertion.addChainableMethod('active', function () {
  cy.get('@status').contains('Proxy already created');
  cy.get('@status').should('have.class','activated');
});

chai.Assertion.addChainableMethod('inactive', function () {
  cy.get('@status').contains('Proxy not created');
  cy.get('@status').should('not.have.class','activated');
});
