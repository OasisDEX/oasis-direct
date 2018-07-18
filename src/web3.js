import Web3 from "web3";
import * as Web3ProviderEngine from "web3-provider-engine/dist/es5";
import * as RpcSource from "web3-provider-engine/dist/es5/subproviders/rpc";
import Transport from "@ledgerhq/hw-transport-u2f";
import LedgerSubProvider from "./vendor/ledger-subprovider";
import TrezorSubProvider from "./vendor/trezor-subprovider";

import * as settings from "./settings";

export const getCurrentProviderName = () => {
  if (!window.web3 || typeof window.web3.currentProvider === "undefined")
    return "";

  if (window.web3.currentProvider.isMetaMask)
    return "metamask";

  if (window.web3.currentProvider.isTrust)
    return "trust";

  if (typeof window.SOFA !== 'undefined')
    return 'coinbase';

  if (typeof window.__CIPHER__ !== "undefined")
    return "cipher";

  if (window.web3.currentProvider.constructor.name === "EthereumProvider")
    return "mist";

  if (window.web3.currentProvider.constructor.name === "Web3FrameProvider")
    return "parity";

  if (window.web3.currentProvider.host && window.web3.currentProvider.host.indexOf("infura") !== -1)
    return "infura";

  if (window.web3.currentProvider.host && window.web3.currentProvider.host.indexOf("localhost") !== -1)
    return "localhost";

  return "other";
};

class Web3Extended extends Web3 {
  stop = () => {
    this.reset();
    if (this.currentProvider && typeof this.currentProvider.stop === "function") {
      this.currentProvider.stop();
    }
  };

  setHWProvider = (device, network, path, accountsOffset = 0, accountsLength = 1) => {
    this.stop();
    return new Promise(async (resolve, reject) => {
      try {
        const networkId = network === "main" ? 1 : (network === "kovan" ? 42 : "");
        this.setProvider(new Web3ProviderEngine());
        const hwWalletSubProvider = device === "ledger"
                                    ? LedgerSubProvider(async () => await Transport.create(), {networkId, path, accountsOffset, accountsLength})
                                    : TrezorSubProvider({networkId, path, accountsOffset, accountsLength});
        this.currentProvider.name = device;
        this.currentProvider.addProvider(hwWalletSubProvider);
        this.currentProvider.addProvider(new RpcSource({rpcUrl: settings.chain[network].nodeURL}));
        this.currentProvider.start();
        this.useLogs = false;
        resolve(true);
      } catch(e) {
        reject(e);
      }
    });
  }

  setWebClientProvider = () => {
    this.stop();
    return new Promise(async (resolve, reject) => {
      try {
        if (window.web3) {
          this.setProvider(window.web3.currentProvider);
        } else {
          alert("error");
        }
        this.useLogs = true;
        this.currentProvider.name = getCurrentProviderName();
        resolve(true);
      } catch(e) {
        reject(e);
      }
    });
  }
}

const web3 = new Web3Extended();
web3.BigNumber.config({EXPONENTIAL_AT:[-18,21]});
window.web3Provider = web3;

export default web3;
