import { cypressVisitWithWeb3, tid } from '../utils';
import Trade from '../pages/Trade';
import { ERRORS } from "../../src/utils/errors";
import settings from '../../src/settings';


const nextTrade = () => {
  cy.get(tid('new-trade')).click({timeout: Cypress.env('TRADE_TIMEOUT')});
};

describe('Buying', () => {
  beforeEach(() => {
    cypressVisitWithWeb3();
    cy.get(tid('wallets-continue')).contains('Continue').click();
    cy.wait(2000);
  });

  context('ETH for ERC20', () => {
    it('without proxy', () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '0.35714';
      const willReceive = '100';
      const price = '280 ETH/DAI';


      const trade = new Trade().buy(to)(willReceive);

      expect(trade).to.pay(`${willPay}`);

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
      const to = 'DAI';
      const from = 'ETH';
      const willReceive = '100';

      const trade = new Trade().buy(to)(willReceive);

      const firstFinalization = trade
        .acceptTerms()
        .execute();

      firstFinalization.shouldCommitATrade('0.35714', from , willReceive, to);

      nextTrade();

      const willReceiveMore = '500';
      const willPay = '1.80649';
      const price = '276.77929 ETH/DAI';

      const secondTrade = new Trade().buy(to)(willReceiveMore);

      expect(secondTrade).to.pay(willPay);

      const finalization = trade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldCommitATrade(willPay, from, willReceiveMore, to);

      summary.expectProxyNotBeingCreated();
      summary.expectBought(willReceiveMore, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price)
    });
  });

  context('ERC20 for ETH', () => {
    it('without proxy and allowance', () => {
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '37.25778';
      const willReceive = '0.12378';
      const price = '301 ETH/DAI';

      const trade = new Trade().buy(to)(willReceive);

      expect(trade).to.pay(`${willPay}`);

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

    it("with proxy and no allowance", () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';

      const finalization = new Trade()
        .sell(from)(willPay)
        .buy(to)()
        .acceptTerms()
        .execute();

      finalization.shouldCommitATrade(willPay,from, '280', to);

      nextTrade();

      const nextFrom = 'DAI';
      const nextTo = 'ETH';
      const nextWillPay = '37.25778';
      const nextWillReceive = '0.12378';
      const price = '301 ETH/DAI';

      const secondTrade = new Trade()
        .sell(nextFrom)()
        .buy(nextTo)(nextWillReceive);

      expect(secondTrade).to.receive(`${nextWillReceive}`);

      const nextFinalization = secondTrade
        .acceptTerms()
        .execute();

      nextFinalization
        .shouldNotCreateProxy()
        .shouldSetAllowanceFor(nextFrom);

      expect(nextFinalization.currentTx).to.succeed();

      const finalSummary = nextFinalization
        .shouldCommitATrade(nextWillPay, nextFrom, nextWillReceive, nextTo);

      finalSummary.expectProxyNotBeingCreated();
      finalSummary.expectBought(nextWillReceive, nextTo);
      finalSummary.expectSold(nextWillPay, nextFrom);
      finalSummary.expectPriceOf(price);
    });

    it("with proxy and allowance", () => {
      const from = 'DAI';
      const to = 'ETH';
      const willPay = '37.25778';
      const willReceive = '0.12378';
      const price = '301 ETH/DAI';

      const firstFinalization = new Trade()
        .sell(from)()
        .buy(to)(willReceive)
        .acceptTerms()
        .execute();

      firstFinalization.shouldCommitATrade(willPay,from, willReceive,to);

      nextTrade();

      const newTrade = new Trade()
        .sell(from)()
        .buy(to)(willReceive);

      const finalization = newTrade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldNotSetAllowance()
        .shouldCommitATrade(willPay, from, willReceive, to);

      summary.expectBought(willReceive, to);
      summary.expectSold(willPay, from);
      summary.expectPriceOf(price);
    });
  });

  context('ERC20 for ERC20', () => {
    it('without proxy and allowance', () => {
      const from = 'DAI';
      const to = 'MKR';
      const willPay = '103.33333';
      const willReceive = '0.5';
      const price = '206.66666 MKR/DAI';

      const trade = new Trade()
        .sell(from)()
        .buy(to)(willReceive);

      expect(trade).to.pay(`${willPay}`);

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

    it("with proxy and no allowance", () => {
      const from = 'ETH';
      const to = 'DAI';
      const willPay = '1';

      const finalization = new Trade()
        .sell(from)(willPay)
        .buy(to)()
        .acceptTerms()
        .execute();

      finalization.shouldCommitATrade(willPay, from, '280', to);

      nextTrade();

      const nextFrom = 'DAI';
      const nextTo = 'MKR';
      const nextWillPay = '103.33333';
      const nextWillReceive = '0.5';
      const price = '206.66666 MKR/DAI';

      const secondTrade = new Trade()
        .sell(nextFrom)()
        .buy(nextTo)(nextWillReceive);

      expect(secondTrade).to.receive(`${nextWillReceive}`);

      const nextFinalization = secondTrade
        .acceptTerms()
        .execute();

      nextFinalization
        .shouldNotCreateProxy()
        .shouldSetAllowanceFor(nextFrom);

      expect(nextFinalization.currentTx).to.succeed();

      const finalSummary = nextFinalization
        .shouldCommitATrade(nextWillPay, nextFrom, nextWillReceive, nextTo);

      finalSummary.expectProxyNotBeingCreated();
      finalSummary.expectBought(nextWillReceive, nextTo);
      finalSummary.expectSold(nextWillPay, nextFrom);
      finalSummary.expectPriceOf(price);
    });

    it("with proxy and allowance", () => {
      const from = 'DAI';
      const to = 'MKR';
      const willPay = '103.33333';
      const willReceive = '0.5';
      const price = '206.66666 MKR/DAI';

      const firstFinalization = new Trade()
        .sell(from)()
        .buy(to)(willReceive)
        .acceptTerms()
        .execute();

      firstFinalization.shouldCommitATrade(willPay,from, willReceive, to);

      nextTrade();

      const nextWillReceive = '0.1';
      const nextWillPay = '20.66666';

      const newTrade = new Trade()
        .sell(from)()
        .buy(to)(nextWillReceive);

      const finalization = newTrade
        .acceptTerms()
        .execute();

      const summary = finalization
        .shouldNotCreateProxy()
        .shouldNotSetAllowance()
        .shouldCommitATrade(nextWillPay, from, nextWillReceive, to);

      summary.expectBought(nextWillReceive, to);
      summary.expectSold(nextWillPay, from);
      summary.expectPriceOf(price);
    });
  })

  context('ANY for ANY', () => {
    it('without reaching the receive token min value', () => {
      const from = "ETH";
      const to = "DAI";

      const minValue = settings.chain.private.tokens[to.toLowerCase()].minValue;

      const trade = new Trade()
        .sell(from)()
        .buy(to)(0.00014);

      trade.containsError(ERRORS.MINIMAL_VALUE(minValue, to));
    });

    it('without having enough trade volume for receive token', () => {
      const from = "ETH";
      const to = "DAI";

      const trade = new Trade()
        .sell(from)()
        .buy(to)(10000);

      trade.containsError(`No orders available to buy ${10000} ${to}`);
    })
  })
});