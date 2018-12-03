import { tid } from '../utils';
import Summary from './Summary';

export default class Finalization {

  shouldCreateProxy = () => {
    this.currentTx = 'proxyTx';

    cy.get(tid('create-proxy'))
      .as(this.currentTx)
      .find('.label.vertical-align span')
      .contains('Create Proxy');

    return this;
  };

  shouldNotCreateProxy = () => {
    cy.get(tid('create-proxy'))
      .should('not.exist');
    return this;
  };

  shouldSetAllowanceFor = (token) => {
    this.currentTx = 'allowanceTx';

    cy.get(tid('set-token-allowance'))
      .as(this.currentTx)
      .contains(`Enable ${token.toUpperCase()} Trading`);

    return this;
  };
  
  shouldNotSetAllowance = () => {
    cy.get(tid('set-token-allowance'))
      .should('not.exist');

    return this;
  }

  shouldCommitATrade = (pay, from, receive, to) => {

    cy.get(tid('trade-token-from'))
      .find(tid('token-amount-value'))
      .contains(`${pay} ${from.toUpperCase()}`);

    cy.get(tid('trade-token-to'))
      .find(tid('token-amount-value'))
      .contains(`${receive} ${to.toUpperCase()}`);

    cy.get(tid('summary'), {timeout: Cypress.env('TRADE_TIMEOUT')});

    return new Summary();
  }
}

chai.Assertion.addChainableMethod('succeed', function () {
  const tx = this._obj;
  cy.get(`@${tx}`).find('.icon.success', {timeout: 20000});
  cy.get(`@${tx}`).find('.status.label').contains('Confirmed');
});

