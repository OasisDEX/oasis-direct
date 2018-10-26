import { visitWithWeb3, tid, revertToSnapshot } from "../utils";

context('Trading', () => {
  const ETH_AMOUNT_TO_SELL = '2';
  const DAI_AMOUNT_TO_RECEIVE = '555';

  beforeEach(() => visitWithWeb3());
  afterEach(() => revertToSnapshot());


  it("should create a proxy and sell ETH for DAI", () => {
    const base = "ETH";
    const quote = "DAI";
    const expectedPrice = `277.5 ${base}/${quote}`;

    cy.get(tid("wallets-continue")).contains("Continue").click();

    cy.get(tid("set-trade-from-amount"))
      .find('input').type(ETH_AMOUNT_TO_SELL);

    cy.get(tid("set-trade-to-amount"), {timeout: 2000})
      .find('input').should('have.value', `${DAI_AMOUNT_TO_RECEIVE}.00000`);

    //  NOTE: we need to click this exact spot to avoid downloading PDF file instead (link is in the button as well)
    cy.get(tid("terms-and-conditions")).click({position: "topRight", force: true});
    cy.get(tid("initiate-trade")).click();

    cy.get(tid("trade-with-builtin-proxy-creation"))
      .find('.details')
      .find('.label.vertical-align span')
      .then((value) => {
        expect(value.text().trim()).to.eq('Create Proxy');
      });

    cy.get(tid("trade-token-from"))
      .find(tid("token-amount-value"))
      .then((value) => {
        expect(value.text().trim()).to.eq(`${ETH_AMOUNT_TO_SELL} ${base}`);
      });

    cy.get(tid("trade-token-to"))
      .find(tid("token-amount-value"))
      .then((value) => {
        expect(value.text().trim()).to.eq(`${DAI_AMOUNT_TO_RECEIVE} ${quote}`);
      });

    const waitForTradeToFinish = 20000;

    cy.get(tid("proxy-creation-summary"), {timeout: waitForTradeToFinish})
      .then((value) => {
        expect(value.text().trim()).to.eq('You have successfully created a Proxy')
      });

    cy.get(tid("congratulation-message", (tid("sold-token"), tid("token-amount-value"))), {
      timeout: waitForTradeToFinish,
    }).contains(`${ETH_AMOUNT_TO_SELL} ${base}`);

    cy.get(tid("congratulation-message", tid("bought-token", tid("token-amount-value"))), {
      timeout: waitForTradeToFinish,
    }).contains(`${DAI_AMOUNT_TO_RECEIVE} ${quote}`);

    cy.get(tid("congratulation-message", tid("final-price", tid("token-amount-value"))), {
      timeout: waitForTradeToFinish,
    }).contains(expectedPrice);
  });
});