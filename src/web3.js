import Web3 from 'web3';
import * as Web3ProviderEngine from 'web3-provider-engine/dist/es5';
import * as RpcSource from 'web3-provider-engine/dist/es5/subproviders/rpc';
import Transport from "@ledgerhq/hw-transport-u2f";
import LedgerSubProvider from './vendor/ledger-subprovider';
import TrezorSubProvider from './vendor/trezor-subprovider';

const settings = require('./settings');

const web3 = new Web3();
web3.BigNumber.config({EXPONENTIAL_AT:[-18,21]});
export default web3;

window.web3Provider = web3;

export const setHWProvider = (device, network, path, accountsOffset = 0, accountsLength = 1) => {
  return new Promise(async (resolve, reject) => {
    try {
      const networkId = network === 'main' ? 1 : (network === 'kovan' ? 42 : '');
      web3.setProvider(new Web3ProviderEngine());
      const hwWalletSubProvider = device === 'ledger'
                                  ? LedgerSubProvider(async () => await Transport.create(), {networkId, path, accountsOffset, accountsLength})
                                  : TrezorSubProvider({networkId, path, accountsOffset, accountsLength});
      web3.currentProvider.addProvider(hwWalletSubProvider);
      web3.currentProvider.addProvider(new RpcSource({rpcUrl: settings.chain[network].nodeURL}));
      web3.currentProvider.start();
      resolve(true);
    } catch(e) {
      reject(e);
    }
  });
}

export const setWebClientProvider = () => {
  return new Promise(async (resolve, reject) => {
    try {
      if (window.web3) {
        web3.setProvider(window.web3.currentProvider);
      } else {
        alert('error');
      }

      resolve(web3);
    } catch(e) {
      reject(e);
    }
  });
}
