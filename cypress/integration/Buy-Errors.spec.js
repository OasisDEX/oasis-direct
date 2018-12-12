import { cypressVisitApp, tid } from '../utils';
import Trade from '../pages/Trade';
import { ERRORS } from "../../src/utils/errors";
import settings from '../../src/settings';

describe("Errors buying", ()=> {
  beforeEach(cypressVisitApp);

  context('ETH for ERC20', () => {
    it('without reaching the receive token min value', () => {
      const from = "ETH";
      const to = "DAI";

      const minValue = settings.chain.private.tokens[to.toLowerCase()].minValue;

      const trade = new Trade()
        .sell(from)()
        .buy(to)("0.0014");

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, to));
    });

    it('without having enough trade volume for receive token', () => {
      const from = "ETH";
      const to = "DAI";
      const willBuy = "10000";

      const trade = new Trade()
        .sell(from)()
        .buy(to)(willBuy);

      trade.containsError(`No orders available to buy ${willBuy} ${to}`);
    })
  });

  context('ERC20 for ETH', () => {
    it('without reaching the receive token min value', () => {
      const from = "DAI";
      const to = "ETH";

      const minValue = settings.chain.private.tokens["weth"].minValue;

      const trade = new Trade()
        .sell(from)()
        .buy(to)("0.0004");

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, to));
    });

    it('without having enough balance for the receive token', () => {
      const from = "DAI";
      const to = "ETH";


      const trade = new Trade()
        .sell(from)()
        .buy(to)("0.7");

      trade.containsError(ERRORS.INSUFFICIENT_FUNDS("210.7", from));
    });

    it('without having enough trade volume for receive token', () => {
      const from = "DAI";
      const to = "ETH";
      const willBuy = "10000";

      const trade = new Trade()
        .sell(from)()
        .buy(to)(willBuy);

      trade.containsError(`No orders available to buy ${willBuy} ${to}`);
    });

    it('on account with proxy and allowance set and having not enough balance for the deposit token',()=>{
      const from = 'DAI';
      const to = 'ETH';

      new Trade()
        .sell(from)()
        .buy(to)(0.2)
        .acceptTerms()
        .execute();

      cy.get(tid('new-trade')).click({timeout: Cypress.env('TRADE_TIMEOUT')});

      const trade = new Trade()
        .sell(from)()
        .buy(to)("5");

      trade.containsError(ERRORS.INSUFFICIENT_FUNDS("1527.8", from));
    });
  });
});