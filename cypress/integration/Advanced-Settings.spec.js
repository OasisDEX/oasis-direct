import { cypressVisitApp, tid } from '../utils';
import Trade from "../pages/Trade";
import Session from "../pages/Session";

describe("Advanced Settings - ", () => {
  beforeEach(() => {
    cypressVisitApp();
  });

  it("should be disabled on missing trade data", () => {
    cy.get(tid('check-trade-details')).should("have.class","disabled");
  });

  context("Slippage limit", () => {


    it("should be calculated for SELLING orders", () => {
      new Trade().sell("ETH")(1);

      // TODO: We cant think of doing something like cypress where if it's a property call or function call, different things happen.
      // For Example if it's a property call, then we can have a chain of expectation whether if it's a function call then we just call a function.
      Session.advancedSettings();

      cy.get(tid('slippage-warning')).contains("The transaction will fail (and gas will be spent), if the price of 1 ETH is lower than ~274.39 DAI")
    });

    it("should be calculated for BUYING orders", () => {
      new Trade().buy("DAI")(100);

      Session.advancedSettings();

      cy.get(tid('slippage-warning')).contains("The transaction will fail (and gas will be spent), if the price of 1 ETH is higher than ~285.6 DAI")
    });
  })
});