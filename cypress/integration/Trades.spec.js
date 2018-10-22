import { visitWithWeb3, tid, revertToSnapshot } from "../utils";

context('Trading', () => {
  const ETH_AMOUNT_TO_SELL = '2';
  const DAI_AMOUNT_TO_RECEIVE = '555';


  beforeEach(() => visitWithWeb3());
  afterEach(() => revertToSnapshot());

  it("should create a proxy and sell ETH for DAI", () => {
    cy.get(tid("wallets-continue")).contains("Continue").click();

    cy.get(tid("set-trade-from-amount"))
      .find('input').type(ETH_AMOUNT_TO_SELL);

    cy.get(tid("set-trade-to-amount"),{timeout:2000})
      .find('input').should('have.value', `${DAI_AMOUNT_TO_RECEIVE}.00000`);


    // NOTE: we need to click this exact spot to avoid downloading PDF file instead (link is in the button as well)
    cy.get(tid("terms-and-conditions")).click({ position: "topRight", force: true }); 
    cy.get(tid("initiate-trade")).click();

    cy.get(tid("trade-with-builtin-proxy-creation"))
      .find('.details')
      .find('.label.vertical-align span').should((value) => {
      expect(value.text().trim()).to.eq('Create Proxy');
    });

    cy.get(tid("trade-token-from"))
      .find(tid("token-amount-value"))
      .should((value) => {
        expect(value.text().trim()).to.eq(`${ETH_AMOUNT_TO_SELL} ETH`);
      });

    cy.get(tid("trade-token-to"))
      .find(tid("token-amount-value"))
      .should((value) => {
        expect(value.text().trim()).to.eq(`${DAI_AMOUNT_TO_RECEIVE} DAI`);
      });

    cy.get(tid("proxy-creation-summary"),{timeout: 20000}).should((value) => {
      expect(value.text().trim()).to.eq('You have successfully created a Proxy')
    });
  });
});