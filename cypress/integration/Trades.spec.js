import { visitWithWeb3, tid, revertToSnapshot } from "../utils";

context('Selling', () => {
  const waitForTradeToFinish = 20000;

  beforeEach(() => visitWithWeb3());
  afterEach(() => revertToSnapshot());

  it  ("ETH for ERC20 without PROXY", () => {
    const base = "ETH";
    const quote = "DAI";
    const ETH_AMOUNT_TO_SELL = '1';
    const DAI_AMOUNT_TO_RECEIVE = '280';
    const expectedPrice = `280 ${base}/${quote}`;

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

  it("ETH for ERC20 with proxy", () => {
    const base = "ETH";
    const quote = "DAI";
    const ETH_AMOUNT_TO_SELL = '1';
    const DAI_AMOUNT_TO_RECEIVE = '275';
    const expectedPrice = `275 ${base}/${quote}`;

    cy.get(tid("wallets-continue")).contains("Continue").click();

    cy.get(tid("set-trade-from-amount"))
      .find('input').type(ETH_AMOUNT_TO_SELL);

    cy.get(tid("set-trade-to-amount"), {timeout: 2000})
      .find('input').should('have.value', `${DAI_AMOUNT_TO_RECEIVE}.00000`);

    cy.get(tid("terms-and-conditions")).click({position: "topRight", force: true});
    cy.get(tid("initiate-trade")).click();

    cy.get(tid("new-trade")).click({timeout: waitForTradeToFinish});

    cy.get(tid("set-trade-from-amount"))
      .find('input').type(ETH_AMOUNT_TO_SELL);

    //  NOTE: we need to click this exact spot to avoid downloading PDF file instead (link is in the button as well)
    cy.get(tid("terms-and-conditions")).click({position: "topRight", force: true});
    cy.get(tid("initiate-trade")).click();

    cy.get(tid("trade-with-builtin-proxy-creation"))
      .should('not.exist');

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

    cy.get(tid("proxy-creation-summary"), {timeout: waitForTradeToFinish})
      .should('not.exist');

    cy.get(tid("congratulation-message"), {timeout: waitForTradeToFinish})
      .find(tid("sold-token"), tid("token-amount-value"))
      .then(value =>
        expect(value.text().trim()).to.eq(`${ETH_AMOUNT_TO_SELL} ${base}`)
      );

    cy.get(tid("congratulation-message"), {timeout: waitForTradeToFinish})
      .find(tid("bought-token"), tid("token-amount-value"))
      .then(value =>
        expect(value.text().trim()).to.eq(`${DAI_AMOUNT_TO_RECEIVE} ${quote}`)
      );

    cy.get(tid("congratulation-message"), {timeout: waitForTradeToFinish})
      .find(tid("final-price"),tid("token-amount-value"))
      .then(value =>
        expect(value.text().trim()).to.eq(expectedPrice)
      );
  });

  it("ETH for ERC20 with proxy", () => {
    cy.get(tid("wallets-continue")).contains("Continue").click();

    cy.get(tid("set-trade-from-amount"))
      .find('input').type(ETH_AMOUNT_TO_SELL);

    cy.get(tid("terms-and-conditions")).click({position: "topRight", force: true});
    cy.get(tid("initiate-trade")).click();

    cy.get(tid("new-trade")).click({timeout: waitForTradeToFinish});

    cy.get(tid("set-trade-from-amount"))
      .find('input').type(ETH_AMOUNT_TO_SELL);

    //  NOTE: we need to click this exact spot to avoid downloading PDF file instead (link is in the button as well)
    cy.get(tid("terms-and-conditions")).click({position: "topRight", force: true});
    cy.get(tid("initiate-trade")).click();

    getTradeParameters();

    cy.get(tid("trade-with-builtin-proxy-creation"))
      .should('not.exist');

    cy.get(tid("trade-token-from"))
      .find(tid("token-amount-value"))
      .then((value) => {
        expect(value.text().trim()).to.eq(`${ETH_AMOUNT_TO_SELL} ETH`);
      });

    cy.get(tid("trade-token-to"))
      .find(tid("token-amount-value"))
      .then((value) => {
        expect(value.text().trim()).to.eq(`${DAI_AMOUNT_TO_RECEIVE} DAI`);
      });

    cy.get(tid("proxy-creation-summary"), {timeout: waitForTradeToFinish})
      .should('not.exist');

    cy.get(tid("congratulation-message"), {timeout: waitForTradeToFinish})
      .find(tid("token-amount-value"))
      .first()
      .then(value =>
        expect(value.text().trim()).to.eq(`${ETH_AMOUNT_TO_SELL} ${base}`)
      );

    cy.get(tid("congratulation-message"), {timeout: waitForTradeToFinish})
      .find(tid("token-amount-value"))
      .eq(1)
      .then(value =>
        expect(value.text().trim()).to.eq(`${DAI_AMOUNT_TO_RECEIVE} ${quote}`)
      );

    cy.get(tid("congratulation-message"), {timeout: waitForTradeToFinish})
      .find(tid("token-amount-value"))
      .eq(2)
      .then(value =>
        expect(value.text().trim()).to.eq(expectedPrice)
      );
  })
});