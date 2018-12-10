import { cypressVisitApp, tid } from '../utils';
import Trade from '../pages/Trade';
import { ERRORS } from "../../src/utils/errors";
import settings from '../../src/settings';

const nextTrade = () => {
  cy.get(tid('new-trade')).click({timeout: Cypress.env('TRADE_TIMEOUT')});
};

describe('Selling', () => {
  beforeEach(cypressVisitApp);

  context('ETH for ERC20 ', () => {
    it('without proxy', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';
      const willReceive = '280';
      const price = '280 ETH/DAI';


      const trade = new Trade().sell(from)(willPay);

      expect(trade).to.receive(`${willReceive}.00000`);

      const finalization = trade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price)
    });

    it('with proxy', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';
      const willReceive = '280';
      const price = '280 ETH/DAI';

      const trade = new Trade().sell(from)(willPay);

      expect(trade).to.receive(`${willReceive}.00000`);

      const finalization = trade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);

      nextTrade();

      const willReceiveMore = '275';
      const endPrice = '275 ETH/DAI';

      const secondTrade = new Trade().sell(from)(willPay);

      expect(secondTrade).to.receive(`${willReceiveMore}.00000`);

      const anotherFinalizationco = secondTrade
        .acceptTerms()
        .execute();

      const anotherSummary = anotherFinalizationco
        .shouldNotCreateProxy()
        .shouldCommitATrade(willPay, from, willReceiveMore, to);

      anotherSummary.expectProxyNotBeingCreated();
      anotherSummary.expectBought(willReceiveMore, to);
      anotherSummary.expectSold(willPay, from);
      anotherSummary.expectPriceOf(endPrice);
    });
  });

  context('ERC20 for ETH', () => {
    it('without proxy and allowance', () => {
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '100';
      const willReceive = '0.33222';
      const price = '301 ETH/DAI';

      const trade = new Trade().sell(from)(willPay);

      expect(trade).to.receive(`${willReceive}`);

      const finalization = trade
        .acceptTerms()
        .execute();

      finalization.shouldCreateProxy();
      expect(finalization.currentTx).to.succeed();

      finalization.shouldSetAllowanceFor(from);
      expect(finalization.currentTx).to.succeed();

      const summary = finalization.shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });

    it('with proxy and no allowance', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';
      const willReceive = '280';
      const price = '280 ETH/DAI';

      const trade = new Trade().sell(from)(willPay);

      expect(trade).to.receive(`${willReceive}.00000`);

      const finalization = trade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);

      nextTrade();

      const willPayMore = '200';
      const willReceiveMore = '0.66445';
      const newPrice = '301 ETH/DAI';

      const secondTrade = new Trade()
        .sell(to)(willPayMore)
        .buy(from)();

      expect(trade).to.receive(`${willReceiveMore}`);

      const nextFinalization = secondTrade
        .acceptTerms()
        .execute();

      nextFinalization
        .shouldNotCreateProxy()
        .shouldSetAllowanceFor(to);

      expect(nextFinalization.currentTx).to.succeed();

      const finalSummary = nextFinalization
        .shouldCommitATrade(willPayMore, to, willReceiveMore, from);

      finalSummary.expectProxyNotBeingCreated();
      finalSummary.expectBought(willReceiveMore, from);
      finalSummary.expectSold(willPayMore, to);
      finalSummary.expectPriceOf(newPrice);
    });

    it('with proxy and allowance', () => {
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '100';
      const price = '301 ETH/DAI';

      new Trade()
        .sell(from)(willPay)
        .acceptTerms()
        .execute();

      nextTrade();

      const willPayMore = '70';
      const willReceiveMore = '0.23255';

      const trade = new Trade().sell(from)(willPayMore);

      expect(trade).to.receive(willReceiveMore);

      const finalization = trade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldNotSetAllowance()
        .shouldCommitATrade(willPayMore, from, willReceiveMore, to);

      summary.expectProxyNotBeingCreated();
      summary.expectBought(willReceiveMore, to);
      summary.expectSold(willPayMore, from);
      summary.expectPriceOf(price);
    });
  });

  context('ERC20 for ERC20', () => {
    it('without proxy and allowance', () => {
      const from = 'DAI';
      const to = 'MKR';
      const willPay = '5';
      const willReceive = '0.02419';
      const price = '206.66666 MKR/DAI';

      const trade = new Trade()
        .buy(to)()
        .sell(from)(willPay);

      expect(trade).to.receive(`${willReceive}`);

      const finalization = trade
        .acceptTerms()
        .execute();

      finalization.shouldCreateProxy();
      expect(finalization.currentTx).to.succeed();

      finalization.shouldSetAllowanceFor(from);
      expect(finalization.currentTx).to.succeed();

      const summary = finalization.shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });

    it('with proxy and no allowance', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';
      const willReceive = '280';
      const price = '280 ETH/DAI';

      const trade = new Trade().sell(from)(willPay);

      expect(trade).to.receive(`${willReceive}.00000`);

      const finalization = trade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldCreateProxy()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);

      nextTrade();

      const switchTo = "MKR";
      const switchFrom = "DAI";
      const willPayMore = '5';
      const willReceiveMore = '0.02419';
      const newPrice = '206.66666 MKR/DAI';

      const secondTrade = new Trade()
        .buy(switchTo)()
        .sell(switchFrom)(willPayMore);

      expect(trade).to.receive(`${willReceiveMore}`);

      const nextFinalization = secondTrade
        .acceptTerms()
        .execute();

      nextFinalization
        .shouldNotCreateProxy()
        .shouldSetAllowanceFor(switchFrom);

      expect(nextFinalization.currentTx).to.succeed();

      const finalSummary = nextFinalization
        .shouldCommitATrade(willPayMore, switchFrom, willReceiveMore, switchTo);

      finalSummary.expectProxyNotBeingCreated();
      finalSummary.expectBought(willReceiveMore, switchTo);
      finalSummary.expectSold(willPayMore, switchFrom);
      finalSummary.expectPriceOf(newPrice);
    });

    it('with proxy and allowance', () => {
      const from = 'DAI';
      const to = 'MKR';
      const willPay = '5';
      const willReceive = '0.02419';
      const price = '206.66666 MKR/DAI';

      new Trade()
        .buy(to)()
        .sell(from)(willPay)
        .acceptTerms()
        .execute();

      nextTrade();

      const trade = new Trade()
        .buy(to)()
        .sell(from)(willPay);

      expect(trade).to.receive(willReceive);

      const finalization = trade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldNotSetAllowance()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectProxyNotBeingCreated();
      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });
  });

  context('ANY for ANY', () => {
    it('without reaching the deposit min value', () => {
      const from = "ETH";
      const to = "DAI";
      const minValue = settings.chain.private.tokens["weth"].minValue;

      const trade = new Trade()
        .sell(from)(0.0004)
        .buy(to)();

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, from));
    });

    it('without reaching the receive token min value', () => {
      const from = "ETH";
      const to = "DAI";

      const minValue = settings.chain.private.tokens[to.toLowerCase()].minValue;

      const trade = new Trade()
        .sell(from)(0.0005)
        .buy(to)();

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, to));
    });

    it('without having enough trade volume for receive token', () => {
      const from = "ETH";
      const to = "DAI";

      const trade = new Trade()
        .sell(from)(100)
        .buy(to)();

      trade.containsError(`No orders available to sell ${100} ${from}`);
    })
  })
});