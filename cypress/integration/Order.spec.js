/// <reference types="Cypress" />

import { visitWithWeb3, tid, revertToSnapshot } from "../utils";

context("Order", () => {
  beforeEach(() => visitWithWeb3())
  afterEach(() => revertToSnapshot());

  it("should buy dai", () => {
    cy.get(tid("wallets-continue"))
      .contains("Continue")
      .click();
  });
});
