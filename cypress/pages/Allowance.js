import { tid } from '../utils';

export default class Allowance {

  static ENABLED = 'enabled';
  static DISABLED = 'disabled';

  constructor(tokenSymbol) {
    this.symbol = tokenSymbol;
    this.isEnabled = false;
  }

  enable = () => {
    cy.get(tid(`${this.symbol}-token`), {timeout: 2000}).click();
    this.isEnabled = true;
  };

  disable = () => {
    if (this.isEnabled) {
      cy.get(tid(`${this.symbol}-token`), {timeout: 2000}).click();
      this.isEnabled = false;
    }
  };

  shouldBe = (status) => {
    if (status === Allowance.ENABLED) {
      cy.get(tid(`${this.symbol}-token`, tid('allowance-status')) ).should('have.class', 'active');
    }

    if (status === Allowance.DISABLED) {
      cy.get(tid(`${this.symbol}-token`, tid('allowance-status'))).should('not.have.class', 'active');
    }
  }

  static open = () => {
    cy.get(tid('set-allowance')).click();
  };

  static close = () => {
    cy.get(tid('close-allowances-panel')).click();
  };


}