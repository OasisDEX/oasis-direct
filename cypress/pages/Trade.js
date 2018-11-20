import { tid } from '../utils';

import Finalization from './Finalization';

export default class Trade {

  sell = token => {
    cy.get(tid('set-trade-from'))
      .click();

    cy.get(tid(token.toLowerCase()))
      .click();

    return amount => {
      if(amount) {
        cy.get(tid('set-trade-from-amount'))
          .find('input').type(amount);
      }

      return this;
    };
  };

  buy = (token) => {
    cy.get(tid('set-trade-to'))
      .click();

    cy.get(tid(token.toLowerCase()))
      .click();


    return amount => {
      if(amount) {
        cy.get(tid('set-trade-to-amount'))
          .find('input').type(amount);
      }

      return this;
    };
  };


  acceptTerms = () => {
    cy.get(tid('terms-and-conditions')).click({position: 'topRight', force: true});
    return this;
  };

  execute = () => {
    cy.get(tid('initiate-trade')).click();
    return new Finalization();
  };
}

chai.Assertion.addChainableMethod('receive', function (amount) {
  cy.get(tid('set-trade-to-amount'), {timeout: 2000})
    .find('input').should('have.value', `${amount}`);
});

chai.Assertion.addChainableMethod('pay', function (amount) {
  cy.get(tid('set-trade-from-amount'), {timeout: 2000})
    .find('input').should('have.value', `${amount}`);
});
