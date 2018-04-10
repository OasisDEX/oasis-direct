import web3 from './web3';

const schema = {};

schema.dstoken = require('./abi/dstoken');
schema.dsethtoken = require('./abi/dsethtoken');
schema.proxyregistry = require('./abi/proxyregistry');
schema.dsproxy = require('./abi/dsproxy');
schema.matchingmarket = require('./abi/matchingmarket');
schema.proxycreateandexecute = require('./abi/proxycreateandexecute');

export const getAccounts = () => {
  return new Promise((resolve, reject) => {
    web3.eth.getAccounts((e, accounts) => {
      if (!e) {
        resolve(accounts);
      } else {
        reject(e);
      }
    });
  });
} 

export const loadObject = (type, address, label = null) => {
  const object = web3.eth.contract(schema[type].abi).at(address);
  if (label) {
    this[`${label}Obj`] = object;
  }
  return object;
}

export const setDefaultAccount = account => {
  web3.eth.defaultAccount = account;
}

export const getGasPrice = () => {
  return new Promise((resolve, reject) => {
    web3.eth.getGasPrice(
      (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      }
    );
  });
}

export const estimateGas = (to, data, value, from) => {
  return new Promise((resolve, reject) => {
    web3.eth.estimateGas(
      {to, data, value, from},
      (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      }
    );
  });
}

export const getTransaction = tx => {
  return new Promise((resolve, reject) => {
    web3.eth.getTransaction(tx, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const getTransactionReceipt = tx => {
  return new Promise((resolve, reject) => {
    web3.eth.getTransactionReceipt(tx, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const getTransactionCount = address => {
  return new Promise((resolve, reject) => {
    web3.eth.getTransactionCount(address, 'pending', (e, r) => {
      if (!e) {
        resolve(r - 1);
      } else {
        reject(e);
      }
    });
  });
}

export const getNode = () => {
  return new Promise((resolve, reject) => {
    web3.version.getNode((e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const getBlock = block => {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock(block, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const setFilter = (fromBlock, address) => {
  return new Promise((resolve, reject) => {
    web3.eth.filter({fromBlock, address}).get((e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    })
  });
}

export const resetFilters = bool => {
  web3.reset(bool);
}

export const getEthBalanceOf = addr => {
  return new Promise((resolve, reject) => {
    web3.eth.getBalance(addr, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const getTokenBalanceOf = (token, addr) => {
  return new Promise((resolve, reject) => {
    this[`${token}Obj`].balanceOf(addr, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const getTokenAllowance = (token, from, to) => {
  return new Promise((resolve, reject) => {
    this[`${token}Obj`].allowance.call(from, to, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        resolve(e);
      }
    })
  });
}

export const getTokenTrusted = (token, from, to) => {
  return new Promise((resolve, reject) => {
    this[`${token}Obj`].allowance.call(from, to, (e, r) => {
      if (!e) {
        resolve(r.eq(web3.toBigNumber(2).pow(256).minus(1))); // uint(-1)
      } else {
        resolve(e);
      }
    })
  });
}

export const tokenApprove = (token, dst, gasPrice) => {
  return new Promise((resolve, reject) => {
    this[`${token}Obj`].approve(dst, -1, {gasPrice}, (e, tx) => {
      if (!e) {
        resolve(tx);
      } else {
        reject(e);
      }
    });
  });
}


export const getProxy = (account, i) => {
  return new Promise((resolve, reject) => {
    this.proxyRegistryObj.proxies(account, i, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const getProxiesCount = account => {
  return new Promise((resolve, reject) => {
    this.proxyRegistryObj.proxiesCount(account, async (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const getProxyAddress = account => {
  return new Promise((resolve, reject) => {
    this.getProxiesCount(account).then(async (r) => {
      if (r.gt(0)) {
        for (let i = r.toNumber() - 1; i >= 0; i--) {
          const proxyAddr = await this.getProxy(account, i);
          if (await this.getProxyOwner(proxyAddr) === account) {
            resolve(proxyAddr);
            break;
          }
        }
        resolve(null);
      } else {
        resolve(null);
      }
    }).catch(e => reject (e));
  });
}

export const getProxyOwner = proxy => {
  return new Promise((resolve, reject) => {
    this.loadObject('dsproxy', proxy).owner((e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e);
      }
    });
  });
}

export const proxyExecute = (proxyAddr, targetAddr, calldata, gasPrice, value = 0) => {
  return new Promise((resolve, reject) => {
    this.loadObject('dsproxy', proxyAddr).execute['address,bytes'](targetAddr,
      calldata,
      {value, gasPrice},
      (e, r) => {
        if (!e) {
          resolve(r);
        } else {
          reject(e);
        }
      }
    );
  });
}

export const proxyCreateAndExecute = (contractAddr, method, params, value, gasPrice) => {
  return new Promise((resolve, reject) => {
    this.loadObject('proxycreateandexecute', contractAddr)[method](...params, {
      value,
      gasPrice
    }, (e, tx) => {
      if (!e) {
        resolve(tx);
      } else {
        reject(e);
      }
    });
  })
}

export const isMetamask = () => web3.currentProvider.isMetaMask || web3.currentProvider.constructor.name === 'MetamaskInpageProvider';
