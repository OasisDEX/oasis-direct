import web3 from './web3';
import Promise from 'bluebird';
import { toBytes32, addressToBytes32, toWei, methodSig } from './helpers';

const settings = require('./settings');
const promisify = Promise.promisify;
const schema = {};

schema.dstoken = require('./abi/dstoken');
schema.dsethtoken = require('./abi/dsethtoken');
schema.proxyregistry = require('./abi/proxyregistry');
schema.dsproxy = require('./abi/dsproxy');
schema.matchingmarket = require('./abi/matchingmarket');
schema.proxycreateandexecute = require('./abi/proxycreateandexecute');

export const objects = {}

export const getAccounts = () => {
  return promisify(web3.eth.getAccounts)();
}

export const loadObject = (type, address, label = null) => {
  const object = web3.eth.contract(schema[type].abi).at(address);
  if (label) {
    objects[label] = object;
  }
  return object;
}

export const getDefaultAccount = () => {
  return web3.eth.defaultAccount;
}

export const setDefaultAccountByIndex = index => {
  return new Promise(async (resolve, reject) => {
    try {
      const accounts = await getAccounts();
      console.log(`Address ${accounts[index]} loaded`);
      web3.eth.defaultAccount = accounts[index];
      resolve(true);
    } catch (e) {
      console.log(e);
      resolve(false);
    }
  });
}

export const getNetwork = () => {
  return promisify(web3.version.getNetwork)();
}

export const getGasPrice = () => {
  return promisify(web3.eth.getGasPrice)();
}

export const estimateGas = (to, data, value, from) => {
  return promisify(web3.eth.estimateGas)({to, data, value, from});
}

export const getTransaction = tx => {
  return promisify(web3.eth.getTransaction)(tx);
}

export const getTransactionReceipt = tx => {
  return promisify(web3.eth.getTransactionReceipt)(tx);
}

export const getTransactionCount = address => {
  return promisify(web3.eth.getTransactionCount)(address, 'pending');
}

export const getNode = () => {
  return promisify(web3.version.getNode)();
}

export const getBlock = block => {
  return promisify(web3.eth.getBlock)(block);
}

export const setFilter = (fromBlock, address) => {
  return promisify(web3.eth.filter)({fromBlock, address});
}

export const resetFilters = bool => {
  web3.reset(bool);
}

export const getEthBalanceOf = addr => {
  return promisify(web3.eth.getBalance)(addr);
}

export const getTokenBalanceOf = (token, addr) => {
  return promisify(objects[token].balanceOf)(addr);
}

export const getTokenAllowance = (token, from, to) => {
  return promisify(objects[token].allowance.call)(from, to);
}

export const getTokenTrusted = (token, from, to) => {
  return promisify(objects[token].allowance.call)(from, to)
    .then((result) => result.eq(web3.toBigNumber(2).pow(256).minus(1)));
}

/*
   On the contract side, there is a mapping (address) -> []DsProxy
   A given address can have multiple proxies. Since lists cannot be
   iterated, the way to access a give element is access it by index
 */
export const getProxy = (account, proxyIndex) => {
  return promisify(objects.proxyRegistry.proxies)(account, proxyIndex);
}

export const getProxiesCount = account => {
  return promisify(objects.proxyRegistry.proxiesCount)(account);
}

export const getProxyAddress = account => {
  return getProxiesCount(account).then(async (r) => {
    if (r.gt(0)) {
      for (let i = r.toNumber() - 1; i >= 0; i--) {
        const proxyAddr = await getProxy(account, i);
        if (await getProxyOwner(proxyAddr) === account) {
          return proxyAddr;
        }
      }
    }
    return null;
  });
}

export const getProxyOwner = proxy => {
  return promisify(loadObject('dsproxy', proxy).owner)();
}

export const isMetamask = () => web3.currentProvider.isMetaMask || web3.currentProvider.constructor.name === 'MetamaskInpageProvider';

export const stopProvider = () => {
  web3.stop();
}

export const setHWProvider = (device, network, path, accountsOffset = 0, accountsLength = 1) => {
  return web3.setHWProvider(device, network, path, accountsOffset, accountsLength);
}

export const setWebClientProvider = () => {
  return web3.setWebClientProvider();
}

export function getCurrentProviderName() {
  if (window.web3.currentProvider.isMetaMask)
    return 'metamask';

  if (window.web3.currentProvider.isTrust)
    return 'trust';

  if (typeof window.SOFA !== 'undefined')
    return 'toshi';

  if (typeof window.__CIPHER__ !== 'undefined')
    return 'cipher';

  if (window.web3.currentProvider.constructor.name === 'EthereumProvider')
    return 'mist';

  if (window.web3.currentProvider.constructor.name === 'Web3FrameProvider')
    return 'parity';

  if (window.web3.currentProvider.host && window.web3.currentProvider.host.indexOf('infura') !== -1)
    return 'infura';

  if (window.web3.currentProvider.host && window.web3.currentProvider.host.indexOf('localhost') !== -1)
    return 'localhost';

  return 'unknown';
}

export const getCallDataAndValue = (network, operation, from, to, amount, limit) => {
  const result = {};
  const otcBytes32 = addressToBytes32(settings.chain[network].otc, false);
  const fromAddrBytes32 = addressToBytes32(settings.chain[network].tokens[from.replace('eth', 'weth')].address, false);
  const toAddrBytes32 = addressToBytes32(settings.chain[network].tokens[to.replace('eth', 'weth')].address, false);
  if (operation === 'sellAll') {
    if (from === "eth") {
      result.calldata = `${methodSig('sellAllAmountPayEth(address,address,address,uint256)')}` +
        `${otcBytes32}${fromAddrBytes32}${toAddrBytes32}${toBytes32(limit, false)}`;
      result.value = toWei(amount);
    } else if (to === "eth") {
      result.calldata = `${methodSig('sellAllAmountBuyEth(address,address,uint256,address,uint256)')}` +
        `${otcBytes32}${fromAddrBytes32}${toBytes32(toWei(amount), false)}${toAddrBytes32}${toBytes32(limit, false)}`;
    } else {
      result.calldata = `${methodSig('sellAllAmount(address,address,uint256,address,uint256)')}` +
        `${otcBytes32}${fromAddrBytes32}${toBytes32(toWei(amount), false)}${toAddrBytes32}${toBytes32(limit, false)}`;
    }
  } else {
    if (from === "eth") {
      result.calldata = `${methodSig('buyAllAmountPayEth(address,address,uint256,address)')}` +
        `${otcBytes32}${toAddrBytes32}${toBytes32(toWei(amount), false)}${fromAddrBytes32}`;
      result.value = limit;
    } else if (to === "eth") {
      result.calldata = `${methodSig('buyAllAmountBuyEth(address,address,uint256,address,uint256)')}` +
        `${otcBytes32}${toAddrBytes32}${toBytes32(toWei(amount), false)}${fromAddrBytes32}${toBytes32(limit, false)}`;
    } else {
      result.calldata = `${methodSig('buyAllAmount(address,address,uint256,address,uint256)')}` +
        `${otcBytes32}${toAddrBytes32}${toBytes32(toWei(amount), false)}${fromAddrBytes32}${toBytes32(limit, false)}`;
    }
  }
  return result;
}

export const getActionCreateProxyAndSellETH = (network, operation, to, amount, limit) => {
  const addrTo = settings.chain[network].tokens[to.replace('eth', 'weth')].address;
  const result = {};

  if (operation === 'sellAll') {
    result.method = 'createAndSellAllAmountPayEth';
    result.params = [settings.chain[network].proxyRegistry, settings.chain[network].otc, addrTo, limit];
    result.value = toWei(amount);
  }
  else {
    result.method = 'createAndBuyAllAmountPayEth';
    result.params = [settings.chain[network].proxyRegistry, settings.chain[network].otc, addrTo, toWei(amount)];
    result.value = limit;
  }
  return result;
}
