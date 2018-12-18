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

  context("Slippage Price", () => {


    it("should be calculated for SELLING orders for ETH to ERC20", () => {
      new Trade().sell("ETH")(1);

      // TODO: We cant think of doing something like cypress where if it's a property call or function call, different things happen.
      // For Example if it's a property call, then we can have a chain of expectation whether if it's a function call then we just call a function.
      Session.advancedSettings();

      cy.get(tid('slippage-warning')).contains("The transaction will fail (and gas will be spent), if the price of 1 ETH is lower than ~274.40 DAI")
    });

    it("should be calculated for BUYING orders for ETH to ERC20", () => {
      new Trade().buy("DAI")(100);

      // TODO: We cant think of doing something like cypress where if it's a property call or function call, different things happen.
      // For Example if it's a property call, then we can have a chain of expectation whether if it's a function call then we just call a function.
      Session.advancedSettings();

      cy.get(tid('slippage-warning')).contains("The transaction will fail (and gas will be spent), if the price of 1 ETH is lower than ~274.40 DAI")
    });


    it("should be calculated for SELLING orders ERC20 to ETH", () => {
      new Trade().sell("DAI")(100);

      Session.advancedSettings();

      cy.get(tid('slippage-warning')).contains("The transaction will fail (and gas will be spent), if the price of 1 ETH is higher than ~307.02 DAI")
    });

    it("should be calculated for BUYING orders ERC20 to ETH", () => {
      new Trade().buy("ETH")(1);

      Session.advancedSettings();

      cy.get(tid('slippage-warning')).contains("The transaction will fail (and gas will be spent), if the price of 1 ETH is higher than ~307.02 DAI")
    });
  })
});