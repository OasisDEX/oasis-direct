import { visitWithWeb3, tid, reset } from "../utils/index";

context('Trading', () => {
  beforeEach(() => {
    visitWithWeb3();
  });

  afterEach(() => {

  });

  it("should sell ETH and receive DAI", () => {
    cy.get(tid("wallets-continue")).contains("Continue").click();

    cy.get(tid("set-trade-from-amount")).within(() => {
      cy.get('input').type(2);
    });

    cy.get(tid("terms-and-conditions")).click();

    cy.get(tid("initiate-trade")).click();
  });
})