import Web3 from 'web3';
import * as Web3ProviderEngine from 'web3-provider-engine';
import * as RpcSource from 'web3-provider-engine/subproviders/rpc';
import Transport from "@ledgerhq/hw-transport-u2f";
import LedgerSubProvider from './vendor/ledger-subprovider';
import TrezorSubProvider from './vendor/trezor-subprovider';

const settings = require('./settings');

const web3 = new Web3();
export default web3;

const setEngine = () => {
  web3.setProvider(new Web3ProviderEngine());
}

const setRPCProvider = () => {
  web3.currentProvider.addProvider(new RpcSource({rpcUrl: settings.nodeURL}));
}

export const setHWProvider = (device, networkId, path, accountsOffset = 0, accountsLength = 1) => {
  return new Promise(async (resolve, reject) => {
    try {
      setEngine();
      const hwWalletSubProvider = device === 'ledger'
                                  ? LedgerSubProvider(async () => await Transport.create(), {networkId, path, accountsOffset, accountsLength})
                                  : TrezorSubProvider({networkId, path, accountsOffset, accountsLength});
      web3.currentProvider.addProvider(hwWalletSubProvider);
      setRPCProvider();
      web3.currentProvider.start();
      resolve(true);
    } catch(e) {
      reject(e);
    }
  });
}

export const initWeb3 = () => {
  return new Promise(async (resolve, reject) => {
    try {
      if (window.web3) {
        web3.setProvider(window.web3.currentProvider);
      } else {
        setEngine();
        setRPCProvider();
        web3.currentProvider.start();
      }

      window.web3 = web3;
      web3.BigNumber.config({EXPONENTIAL_AT:[-18,21]});
      resolve(web3);
    } catch(e) {
      reject(e);
    }
  });
}
