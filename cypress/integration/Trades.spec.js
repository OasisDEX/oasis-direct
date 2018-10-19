import { visitWithWeb3, tid, revertToSnapshot } from "../utils";

context('Trading', () => {
  const ETH_AMOUNT_TO_SELL = '2';
  const DAI_AMOUNT_TO_RECEIVE = '555';


  beforeEach(() => visitWithWeb3());
  afterEach(() => revertToSnapshot());

  it("should create a proxy and sell ETH for DAI", () => {
    cy.get(tid("wallets-continue")).contains("Continue").click();

    cy.get(tid("set-trade-from-amount")).within(() => {
      cy.get('input').type(ETH_AMOUNT_TO_SELL);
    });

    cy.wait(1000);

    cy.get(tid("set-trade-to-amount")).within(() => {
      cy.get('input').should('have.value', `${DAI_AMOUNT_TO_RECEIVE}.00000`);
    });

    cy.get(tid("terms-and-conditions")).click();
    cy.get(tid("initiate-trade")).click();

    cy.get(tid("trade-with-builtin-proxy-creation")).within(() => {
      cy.get('.details').find('.label.vertical-align span').should((value) => {
        expect(value.text().trim()).to.eq('Create Proxy');
      });
    })

    cy.get(tid("trade-token-from")).within(() => {
      cy.get(tid("token-amount-value")).should((value) => {
        expect(value.text().trim()).to.eq(`${ETH_AMOUNT_TO_SELL} ETH`);
      });
    });

    cy.get(tid("trade-token-to")).within(() => {
      cy.get(tid("token-amount-value")).should((value) => {
        expect(value.text().trim()).to.eq(`${DAI_AMOUNT_TO_RECEIVE} DAI`);
      });
    })

    cy.wait(20000);

    cy.get(tid("proxy-creation-summary")).should((value) => {
      expect(value.text().trim()).to.eq('You have successfully created a Proxy')
    });
  });

});