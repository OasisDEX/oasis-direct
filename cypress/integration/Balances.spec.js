/// <reference types="Cypress" />

import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

context('Balances', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000', {
      onBeforeLoad: (win) => {
        const provider = new PrivateKeyProvider(Cypress.env("ETH_PRIV_KEY").slice(2), Cypress.env("ETH_PROVIDER"));
        const web3 = new Web3(provider);

        win.web3 = web3;
      }
    });
  })

  it('should match ether balance', () => {
    // assert balances
    cy.log("done")
  })
})
