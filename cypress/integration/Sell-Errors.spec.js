import { cypressVisitApp, tid } from '../utils';
import Trade from '../pages/Trade';
import { ERRORS } from "../../src/utils/errors";
import settings from '../../src/settings';
import {formatNumber} from "../../src/utils/helpers";

describe("Errors selling", ()=> {
  beforeEach(cypressVisitApp);

  context('ETH for ERC20', () => {
    it('without reaching the deposit min value', () => {
      const from = "ETH";
      const to = "DAI";
      const minValue = settings.chain.private.tokens["weth"].minValue;

      const trade = new Trade()
        .sell(from)("0.0004")
        .buy(to)();

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, from));
    });

    it('without reaching the receive token min value', () => {
      const from = "ETH";
      const to = "DAI";

      const minValue = settings.chain.private.tokens[to.toLowerCase()].minValue;

      const trade = new Trade()
        .sell(from)("0.0005")
        .buy(to)();

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, to));
    });

    it('without having enough trade volume for receive token', () => {
      const from = "ETH";
      const to = "DAI";
      const willPay = 100;

      const trade = new Trade()
        .sell(from)(willPay)
        .buy(to)();

      trade.containsError(`No orders available to sell ${formatNumber(willPay,5,false)} ${from}`);
    })
  });

  context('ERC20 for ETH', () => {
    it('without reaching the deposit min value', () => {
      const from = "DAI";
      const to = "ETH";
      const minValue = settings.chain.private.tokens["dai"].minValue;

      const trade = new Trade()
        .sell(from)("0.0004")
        .buy(to)();

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, from));
    });

    it('without reaching the receive token min value', () => {
      const from = "DAI";
      const to = "ETH";

      const minValue = settings.chain.private.tokens["weth"].minValue;

      const trade = new Trade()
        .sell(from)("0.15")
        .buy(to)();

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, to));
    });

    it('without having enough balance for the deposit token', () => {
      const from = "DAI";
      const to = "ETH";
      const willPay = "1000";

      const trade = new Trade()
        .sell(from)(willPay)
        .buy(to)();

      trade.containsError(ERRORS.INSUFFICIENT_FUNDS(willPay, from));
    });

    it('on account with proxy and allowance set and having not enough balance for the deposit token',()=>{
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '70';

      new Trade()
        .sell(from)(willPay)
        .buy(to)()
        .acceptTerms()
        .execute();

      cy.get(tid('new-trade')).click({timeout: Cypress.env('TRADE_TIMEOUT')});

      const payMore = 1000;

      const trade = new Trade()
        .sell(from)(payMore)
        .buy(to)();

      trade.containsError(ERRORS.INSUFFICIENT_FUNDS(payMore, from));
    });

    it('without having enough trade volume for receive token', () => {
      const from = "DAI";
      const to = "ETH";
      const willPay = "3000";

      const trade = new Trade()
        .sell(from)(willPay)
        .buy(to)();

      trade.containsError(`No orders available to sell ${formatNumber(willPay,5,false)} ${from}`);
    })
  });
});
