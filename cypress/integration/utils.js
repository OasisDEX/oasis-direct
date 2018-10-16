import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

export function visitWithWeb3(path = "") {
  const provider = new PrivateKeyProvider(Cypress.env("ETH_PRIV_KEY").slice(2), Cypress.env("ETH_PROVIDER"));
  const web3 = new Web3(provider);

  cy.visit(path, {
    onBeforeLoad: (win) => {

      win.web3 = web3;
    }
  });

  return web3;
}

// helper to generate quickly selector for data-test-ids
export function tid(id, rest = "") {
  return `[data-test-id="${id}"]` + (rest ? ` ${rest}` : "");
}