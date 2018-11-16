import { visitWithWeb3, tid } from '../utils';
import Trade from '../pages/Trade';

const waitForTradeToFinish = 40000;

const nextTrade = () => {
  cy.get(tid('new-trade')).click({timeout: waitForTradeToFinish});
};

context('Selling', () => {
  beforeEach(() => {
    visitWithWeb3();
    cy.get(tid('wallets-continue')).contains('Continue').click();
  });

  it('ETH for ERC20 without proxy', () => {
    const from = 'ETH';
    const to = 'DAI';
    const willPay = '1';
    const willReceive = '280';
    const price = '280 ETH/DAI';


    let trade = new Trade().sell(from)(willPay);

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

  it('ETH for ERC20 with proxy', () => {
    const from = 'ETH';
    const to = 'DAI';
    const willPay = '1';
    const willReceive = '280';
    const price = '280 ETH/DAI';

    let trade = new Trade().sell(from)(willPay);

    expect(trade).to.receive(`${willReceive}.00000`);

    let finalization = trade
      .acceptTerms()
      .execute();

    let summary = finalization
      .shouldCreateProxy()
      .shouldCommitATrade(willPay, from, willReceive, to);

    summary.expectProxyBeingCreated();
    summary.expectBought(willReceive, to);
    summary.expectSold(willPay, from);
    summary.expectPriceOf(price);

    nextTrade();

    const willReceiveMore = '275';
    const endPrice = '275 ETH/DAI';

    trade = new Trade().sell(from)(willPay);

    expect(trade).to.receive(`${willReceiveMore}.00000`);

    finalization = trade
      .acceptTerms()
      .execute();

    summary = finalization
      .shouldNotCreateProxy()
      .shouldCommitATrade(willPay, from, willReceiveMore, to);

    summary.expectProxyNotBeingCreated();
    summary.expectBought(willReceiveMore, to);
    summary.expectSold(willPay, from);
    summary.expectPriceOf(endPrice);
  });

  it('ERC20 to ETH without proxy and allowance', () => {
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

  it('ERC20 to ETH with proxy and no allowance', () => {
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

  it('ERC20 to ETH with proxy and allowance', () => {
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

  it('ERC20 to ERC20 without proxy and allowance', () => {
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

  it('ERC20 to ERC20 with proxy and no allowance', () => {
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
    const switchFrom ="DAI";
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
  
  it('ERC20 to ERC20 with proxy and allowance', () => {
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

context('Buying', () => {
  beforeEach(() => {
    visitWithWeb3();
    cy.get(tid('wallets-continue')).contains('Continue').click();
  });

  it('ETH for ERC20 without proxy', () => {
    const from = 'ETH';
    const to = 'DAI';
    const willPay = '0.35714';
    const willReceive = '100';
    const price = '280 ETH/DAI';


    let trade = new Trade().buy(to)(willReceive);

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

  it('ETH for ERC20 with proxy', () => {
    const to = 'DAI';
    const from = 'ETH';
    const willReceive = '100';

    const trade = new Trade().buy(to)(willReceive);

    trade
      .acceptTerms()
      .execute();

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