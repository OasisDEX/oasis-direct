import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";

export function visitWithWeb3(path = "") {
  const provider = new PrivateKeyProvider(Cypress.env("ETH_PRIV_KEY").slice(2), Cypress.env("ETH_PROVIDER"));
  const web3 = new Web3(provider);

  cy.then(() => saveBlockchain(web3)()).debug();

  cy.visit(path, {
    onBeforeLoad: win => {
      win.web3 = web3;
    },
  });

  return web3;
}

// helper to generate quickly selector for data-test-ids
export function tid(id, rest = "") {
  return `[data-test-id="${id}"]` + (rest ? ` ${rest}` : "");
}

export const promisify = func => async (...args) =>
  new Promise((accept, reject) => func(...args, (error, result) => (error ? reject(error) : accept(result))));

export const rpcCommand = method => web3 => (...params) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now(),
      },
      (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      },
    );
  });
};

export const mineBlock = rpcCommand("evm_mine");
export const increaseTime = rpcCommand("evm_increaseTime");
export const saveBlockchain = rpcCommand("evm_snapshot");
export const restoreBlockchain = rpcCommand("evm_revert");
