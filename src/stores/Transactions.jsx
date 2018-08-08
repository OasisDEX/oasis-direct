// Libraries
import {observable, decorate, computed} from "mobx";

// Utils
import * as blockchain from "../utils/blockchain";
import {toWei, toBigNumber, addressToBytes32} from "../utils/helpers";
import * as settings from "../settings";

export default class TransactionsStore {
  approval = {};
  trade = {};
  proxy = {};

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  reset = () => {
    this.approval = {};
    this.trade = {};
    this.proxy = {};
  }

  getLogsByAddressFromEtherscan = (address, fromBlock, filter = {}) => {
    let filterString = "";
    if (Object.keys(filter).length > 0) {
      Object.keys(filter).map(key => {
        filterString += `&${key}=${filter[key]}`;
        return false;
      });
    }
    return new Promise((resolve, reject) => {
      const url = `https://api${this.rootStore.network.network !== "main" ? `-${this.rootStore.network.network}` : ""}.etherscan.io/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=latest&address=${address}${filterString}&apikey=${settings.etherscanApiKey}`
      console.log(url);
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
          reject(xhr.status);
        }
      }
      xhr.send();
    })
  }

  getTransactionsByAddressFromEtherscan = (address, fromBlock) => {
    return new Promise((resolve, reject) => {
      const url = `https://api${this.rootStore.network.network !== "main" ? `-${this.rootStore.network.network}` : ""}.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${fromBlock}&sort=desc&apikey=${settings.etherscanApiKey}`
      console.log(url);
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
          reject(xhr.status);
        }
      }
      xhr.send();
    })
  }

  // Transactions
  checkPendingTransactions = () => {
    ["approval", "trade", "proxy"].map(type => {
      if (this[type].pending) {
        blockchain.getTransactionReceipt(this[type].tx).then(r => {
          if (r !== null) {
            if (r.logs.length === 0) {
              this.logTransactionFailed(this[type].tx);
            } else if (r.blockNumber) {
              this.logTransactionConfirmed(this[type].tx, r.gasUsed);
            }
          } else {
            // Check if the transaction was replaced by a new one
            // Using logs:
            blockchain.setFilter(
              this[type].checkFromBlock,
              settings.chain[this.rootStore.network.network].tokens[this.rootStore.system.trade.from.replace("eth", "weth")].address
            ).then(r => {
              r.forEach(v => {
                blockchain.getTransaction(v.transactionHash).then(r2 => {
                  if (r2.from === this.rootStore.network.defaultAccount &&
                    r2.nonce === this[type].nonce) {
                    this.saveReplacedTransaction(type, v.transactionHash);
                  }
                })
              });
            }, () => {
            });
            // Using Etherscan API (backup)
            this.getTransactionsByAddressFromEtherscan(this.rootStore.network.defaultAccount, this[type].checkFromBlock).then(r => {
              if (parseInt(r.status, 10) === 1 && r.result.length > 0) {
                r.result.forEach(v => {
                  if (parseInt(v.nonce, 10) === parseInt(this[type].nonce, 10)) {
                    this.saveReplacedTransaction(type, v.hash);
                  }
                });
              }
            }, () => {
            });
          }
        }, () => {
        });
      } else {
        if (typeof this[type] !== "undefined" && typeof this[type].amountSell !== "undefined" && this[type].amountSell.eq(-1)) {
          // Using Logs
          blockchain.setFilter(
            this[type].checkFromBlock,
            settings.chain[this.rootStore.network.network].tokens[this.rootStore.system.trade.from.replace("eth", "weth")].address
          ).then(logs => this.saveTradedValue("sell", logs), () => {
          });
          // Using Etherscan API (backup)
          this.getLogsByAddressFromEtherscan(settings.chain[this.rootStore.network.network].tokens[this.rootStore.system.trade.from.replace("eth", "weth")].address,
            this[type].checkFromBlock).then(logs => {
            if (parseInt(logs.status, 10) === 1) {
              this.saveTradedValue("sell", logs.result);
            }
          }, () => {
          });
        }
        if (typeof this[type] !== "undefined" && typeof this[type].amountBuy !== "undefined" && this[type].amountBuy.eq(-1)) {
          // Using Logs
          blockchain.setFilter(
            this[type].checkFromBlock,
            settings.chain[this.rootStore.network.network].tokens[this.rootStore.system.trade.to.replace("eth", "weth")].address
          ).then(logs => this.saveTradedValue("buy", logs), () => {
          }, () => {
          });
          // Using Etherscan API (backup)
          this.getLogsByAddressFromEtherscan(settings.chain[this.rootStore.network.network].tokens[this.rootStore.system.trade.to.replace("eth", "weth")].address,
            this[type].checkFromBlock).then(logs => {
            if (parseInt(logs.status, 10) === 1) {
              this.saveTradedValue("buy", logs.result);
            }
          }, () => {
          });
        }
      }
      return false;
    });
  }

  saveReplacedTransaction = (type, newTx) => {
    if (this[type].tx !== newTx) {
      console.log(`Transaction ${this[type].tx} was replaced by ${newTx}.`);
    }
    this[type].tx = newTx;
    this.checkPendingTransactions();
  }

  saveTradedValue = (operation, logs) => {
    let value = toBigNumber(0);
    logs.forEach(log => {
      if (log.transactionHash === this.trade.tx) {
        if (this.rootStore.system.trade[operation === "buy" ? "to" : "from"] !== "eth" &&
          log.topics[operation === "buy" ? 2 : 1] === addressToBytes32(this.rootStore.network.defaultAccount) &&
          log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
          // No ETH, src or dst is user's address and Transfer Event
          value = value.add(toBigNumber(log.data));
        } else if (this.rootStore.system.trade[operation === "buy" ? "to" : "from"] === "eth") {
          if (log.topics[0] === "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c") {
            // Deposit (only can come when selling ETH)
            value = value.add(toBigNumber(log.data));
          } else if (log.topics[0] === "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65") {
            // Withdrawal
            if (operation === "buy") {
              // If buying, the withdrawal shows amount the user is receiving
              value = value.add(toBigNumber(log.data));
            } else {
              // If selling, the withdrawal shows part of the amount sent that is refunded
              value = value.minus(toBigNumber(log.data));
            }
          }
        }
      }
    });
    if (value.gt(0)) {
      this.trade[operation === "buy" ? "amountBuy" : "amountSell"] = value;
    }
  }

  logRequestTransaction = type => {
    return new Promise(resolve => {
      this[type] = {requested: true}
      resolve();
    });
  }

  logPendingTransaction = async (tx, type, callbacks = []) => {
    const nonce = await blockchain.getTransactionCount(this.rootStore.network.defaultAccount);
    const checkFromBlock = (await blockchain.getBlock("latest")).number;
    console.log("nonce", nonce);
    console.log("checkFromBlock", checkFromBlock);
    const msgTemp = "Transaction TX was created. Waiting for confirmation...";
    this[type] = {tx, pending: true, error: false, errorDevice: false, nonce, checkFromBlock, callbacks}
    if (type === "trade") {
      this[type].amountSell = toBigNumber(-1);
      this[type].amountBuy = toBigNumber(-1);
    }
    console.log(msgTemp.replace("TX", tx));
  }

  logTransactionConfirmed = (tx, gasUsed) => {
    const msgTemp = "Transaction TX was confirmed.";

    const type = typeof this.proxy !== "undefined" && this.proxy.tx === tx
    ?
      "proxy"
    :
      typeof this.approval !== "undefined" && this.approval.tx === tx
      ?
        "approval"
      :
        typeof this.trade !== "undefined" && this.trade.tx === tx
        ?
          "trade"
        :
          false;
    if (type && this[type].pending) {
      this[type].pending = false;
      this[type].gasUsed = parseInt(gasUsed, 10);

      console.log(msgTemp.replace("TX", tx));
      blockchain.getTransaction(tx).then(r => {
        if (r) {
          this[type].gasPrice = r.gasPrice;
          // The next line is to reduce the chances to have a wrong block height (infura nodes)
          this[type].checkFromBlock = r.blockNumber && r.blockNumber < this[type].checkFromBlock ? r.blockNumber : this[type].checkFromBlock;
        }
      }, () => {});
      if (typeof this[type].callbacks !== "undefined" && this[type].callbacks.length > 0) {
        this.executeCallbacks(this[type].callbacks);
      }
    }
  }

  logTransactionFailed = tx => {
    const type = typeof this.approval !== "undefined" && this.approval.tx === tx
    ?
      "approval"
    :
      typeof this.trade !== "undefined" && this.trade.tx === tx
      ?
        "trade"
      :
        false;
    if (type) {
      this[type].pending = false;
      this[type].error = true;
    }
  }

  logTransactionErrorDevice = type => {
    this[type] = {errorDevice: true}
  }

  logTransactionRejected = type => {
    this[type] = {rejected: true}
  }

  isErrorDevice = e => {
    return e.message === "invalid transport instance" || e.message.indexOf("Ledger device: UNKNOWN_ERROR") !== -1 || e.message === "Error: Window closed";
  }

  getGasPriceFromETHGasStation = () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject("Request timed out!");
      }, 3000);

      fetch("https://ethgasstation.info/json/ethgasAPI.json", {
        mode: "cors",
        headers: {
          "Access-Control-Request-Headers": "Content-Type",
          "Content-Type": "text/plain",
        }
      }).then(stream => {
        stream.json().then(price => {
          clearTimeout(timeout);
          resolve(toWei(price.average / 10, "gwei"));
        })
      }, e => {
        clearTimeout(timeout);
        reject(e);
      });
    })
  }

  getGasPrice = () => {
    return new Promise((resolve, reject) => {
      this.getGasPriceFromETHGasStation()
        .then(estimation => resolve(estimation), () => {
          blockchain.getGasPrice()
            .then(estimation => resolve(estimation), error => reject(error));
        });
    });
  };

  fasterGasPrice = (increaseInGwei) => {
    return this.getGasPrice().then(price => {
      return toBigNumber(price).add(toBigNumber(toWei(increaseInGwei, "gwei")));
    })
  }

  executeCallbacks = callbacks => {
    callbacks.forEach(callback => this.executeCallback(callback));
  }

  executeCallback = args => {
    let method = args.shift();
    // If the callback is to execute a getter function is better to wait as sometimes the new value is not uopdated instantly when the tx is confirmed
    const timeout = ["system/executeProxyTx", "system/executeProxyCreateAndSellETH", "system/checkAllowance"].indexOf(method) !== -1 ? 0 : 5000;
    setTimeout(() => {
      method = method.split("/");
      console.log("executeCallback", `${method[0]}.${method[1]}`, args);
      if (method[0] === "transactions") {
        this[method[1]](...args);
      } else {
        let object = null;
        switch(method[0]){
          case "system":
            object = this.rootStore.system;
            break;
          case "profile":
            object = this.rootStore.profile;
            break;
          default:
            break;
        }
        object && object[method[1]](...args);
      }
    }, timeout);
  }

  get hasApprovalTx() { return this.approval.requested || this.approval.tx || this.approval.rejected };

  get hasTradeTx() { return this.trade.requested || this.trade.tx || this.trade.rejected };

  get hasProxyTx() { return this.proxy.requested || this.proxy.tx || this.proxy.rejected };
}

decorate(TransactionsStore, {
  approval: observable,
  trade: observable,
  proxy: observable,
  hasApprovalTx: computed,
  hasTradeTx: computed,
  hasProxyTx: computed
});
