import Web3 from "web3";

const ACCOUNT_3_PUB = "0x79d7176ae8f93a04bc73b9bc710d4b44f9e362ce";

export let web3;
export let lastSnapshotId;

export function visitWithWeb3(path = "") {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  web3.eth.defaultAccount = ACCOUNT_3_PUB;

  return cy.then(() => saveBlockchain(web3)()).then(r => {
    lastSnapshotId = parseInt(r.result, 16);

    return cy.visit(path, {
      onBeforeLoad: win => {
        win.web3 = web3;
      },
    });
  });
}

export function revertToSnapshot() {
  cy.log(`Reverting blockchain to snapshot #${lastSnapshotId}`)
  cy.then(() => restoreBlockchain(web3)(lastSnapshotId));
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
