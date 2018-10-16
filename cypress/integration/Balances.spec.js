/// <reference types="Cypress" />

import { visitWithWeb3, tid } from "../utils";

context('Balances', () => {
  beforeEach(() => {
    visitWithWeb3();
  })

  it('should match ether balance', () => {
    cy.contains(tid("wallets-connection-status"), "Connected")
    cy.contains(tid("wallets-name"), "other");

    cy.get(tid("wallets-continue")).contains("Continue").click();

    cy.get(tid("set-trade-from", tid("token-amount-value"))).contains("8,999.715 ETH")
    cy.get(tid("set-trade-to", tid("token-amount-value"))).contains("1,000 DAI")
  })
})
