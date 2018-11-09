import { visitWithWeb3, tid, revertToSnapshot } from "../utils";
import Trade from "../pages/Trade";

const waitForTradeToFinish = 20000;

const newTrade = () => {
  cy.get(tid("new-trade")).click({timeout: waitForTradeToFinish});
};

context('Selling', () => {
  beforeEach(() => {
    visitWithWeb3();
    cy.get(tid("wallets-continue")).contains("Continue").click();
  });
  afterEach(() => revertToSnapshot());

  it("ETH for ERC20 without PROXY", () => {
    const from = 'ETH',
      to = 'DAI',
      willPay = '1',
      willReceive = '280',
      price = '280 ETH/DAI';


    let trade = new Trade(from, to, willPay, willReceive).sell();

    expect(trade).to.receive(`${willReceive}.00000`);

    const finalization = trade
      .acceptTerms()
      .execute();

    const summary = finalization
      .willCreateProxy()
      .willCommitATrade();

    summary.expectProxyBeingCreated();
    summary.expectBought(willReceive, to);
    summary.expectSold(willPay, from);
    summary.expectPriceOf(price)
  });

  it("ETH for ERC20 with proxy", () => {
    let from = 'ETH',
      to = 'DAI',
      willPay = '1',
      willReceive = '280',
      price = '280 ETH/DAI';

    let trade = new Trade(from, to, willPay, willReceive).sell();

    expect(trade).to.receive(`${willReceive}.00000`);

    let finalization = trade
      .acceptTerms()
      .execute();

    let summary = finalization
      .willCreateProxy()
      .willCommitATrade();

    summary.expectProxyBeingCreated();
    summary.expectBought(willReceive, to);
    summary.expectSold(willPay, from);
    summary.expectPriceOf(price);

    newTrade();

    willPay = '1';
    willReceive = '275';
    price = '275 ETH/DAI';

    trade = new Trade(from, to, willPay, willReceive).sell();

    expect(trade).to.receive(`${willReceive}.00000`);

    finalization = trade
      .acceptTerms()
      .execute();

    summary = finalization
      .willNotCreateProxy()
      .willCommitATrade();

    summary.expectProxyNotBeingCreated();
    summary.expectBought(willReceive, to);
    summary.expectSold(willPay, from);
    summary.expectPriceOf(price);
  })
});