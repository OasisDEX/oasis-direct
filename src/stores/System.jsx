import { observable, decorate } from "mobx";

import NetworkStore from "./Network";
import ProfileStore from "./Profile";
import TransactionsStore from "./Transactions";

import * as Blockchain from "../blockchainHandler";
import {toBigNumber, toWei, fromWei, BigNumber, calculateTradePrice} from "../helpers";

const settings = require("../settings");

class SystemStore {

  balances = {
    dai: null,
    eth: null,
    mkr: null
  };

  trade = {
    step: 1,
    operation: "",
    from: "eth",
    to: "dai",
    amountPay: toBigNumber(0),
    amountBuy: toBigNumber(0),
    amountPayInput: "",
    amountBuyInput: "",
    price: toBigNumber(0),
    priceUnit: "",
    bestPriceOffer: toBigNumber(0),
    txCost: toBigNumber(0),
    errorInputSell: null,
    errorInputBuy: null,
    errorOrders: null,
    txs: null,
    proxy: null
  };

  init = () => {
    this.setUpToken("weth");
    this.setUpToken("mkr");
    this.setUpToken("dai");
  }

  reset = () => {
    this.trade = {
      step: 1,
      operation: "",
      from: "eth",
      to: "dai",
      amountPay: toBigNumber(0),
      amountBuy: toBigNumber(0),
      amountPayInput: "",
      amountBuyInput: "",
      price: toBigNumber(0),
      priceUnit: "",
      bestPriceOffer: toBigNumber(0),
      txCost: toBigNumber(0),
      errorInputSell: null,
      errorInputBuy: null,
      errorOrders: null,
      txs: null,
      proxy: null
    };
  }

  cleanInputs = () => {
    this.trade.amountPay = toBigNumber(0);
    this.trade.amountBuy = toBigNumber(0);
    this.trade.amountPayInput = "";
    this.trade.amountBuyInput = "";
    this.trade.txCost = toBigNumber(0);
    this.trade.errorInputSell = null;
    this.trade.errorInputBuy = null;
    this.trade.errorOrders = null;
  }

  saveBalance = token => {
    if (token === "weth") {
      Blockchain.getEthBalanceOf(NetworkStore.defaultAccount).then(r => {
        this.balances.eth = r;
      }, () => {
      });
    } else {
      Blockchain.getTokenBalanceOf(token, NetworkStore.defaultAccount).then(r => {
        this.balances[token] = r;
      }, () => {
      });
    }
  }

  setUpToken = token => {
    Blockchain.loadObject(token === "weth" ? "dsethtoken" : "dstoken", settings.chain[NetworkStore.network].tokens[token].address, token);
    setInterval(() => {
      this.saveBalance(token);
    }, 5000);
    this.saveBalance(token);
  }
  
  checkAllowance = (token, dst, value, callbacks) => {
    if (dst === "proxy") dst = ProfileStore.proxy; // It needs to be done as proxy might not be created when setAllowance is added to the queue of functions to be executed
    const valueObj = toBigNumber(toWei(value));
    Blockchain.getTokenAllowance(token, NetworkStore.defaultAccount, dst).then(r => {
      if (r.gte(valueObj)) {
        this.trade.step = 2;
        this.trade.txs = this.trade.txs ? this.trade.txs : 1;

        TransactionsStore.executeCallbacks(callbacks);
      } else {
        this.trade.step = 2;
        this.trade.txs = this.trade.txs ? this.trade.txs : 2;

        TransactionsStore.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
          TransactionsStore.logRequestTransaction("approval").then(() => {
            const tokenObj = Blockchain.objects[token];
            const params = [dst, -1];
            tokenObj.approve(...params.concat([{gasPrice}, (e, tx) => {
              if (!e) {
                TransactionsStore.logPendingTransaction(tx, "approval", callbacks);
              } else {
                if (TransactionsStore.isErrorDevice(e)) {
                  TransactionsStore.logTransactionErrorDevice("approval");
                } else {
                  TransactionsStore.logTransactionRejected("approval");
                }
              }
            }]));
          }, e => {
            console.debug("Couldn't calculate gas price because of", e);
          });
        });
      }
    }, () => {
    });
  }

  executeProxyTx = (amount, limit) => {
    const data = Blockchain.getCallDataAndValue(NetworkStore.network, this.trade.operation, this.trade.from, this.trade.to, amount, limit);
    TransactionsStore.logRequestTransaction("trade").then(() => {
      TransactionsStore.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
        const proxy = Blockchain.objects.proxy;
        const params = [settings.chain[NetworkStore.network].proxyContracts.oasisDirect, data.calldata];
        proxy.execute["address,bytes"](...params.concat([{value: data.value, gasPrice}, (e, tx) => {
          if (!e) {
            TransactionsStore.logPendingTransaction(tx, "trade");
          } else {
            console.log(e);
            if (TransactionsStore.isErrorDevice(e)) {
              TransactionsStore.logTransactionErrorDevice("trade");
            } else {
              TransactionsStore.logTransactionRejected("trade");
            }
          }
        }]));
      }, () => {
      });
    }, () => {
    });
  }

  executeProxyCreateAndSellETH = (amount, limit) => {
    const data = Blockchain.getActionCreateProxyAndSellETH(NetworkStore.network, this.trade.operation, this.trade.to, amount, limit);
    TransactionsStore.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
      TransactionsStore.logRequestTransaction("trade").then(() => {
        const proxyCreateAndExecute = Blockchain.loadObject("proxycreateandexecute", settings.chain[NetworkStore.network].proxyCreationAndExecute);
        proxyCreateAndExecute[data.method](...data.params.concat([{value: data.value, gasPrice}, (e, tx) => {
          if (!e) {
            TransactionsStore.logPendingTransaction(tx, "trade", [["profile/getAndSetProxy"]]);
          } else {
            console.log(e);
            if (TransactionsStore.isErrorDevice(e)) {
              TransactionsStore.logTransactionErrorDevice("trade");
            } else {
              TransactionsStore.logTransactionRejected("trade");
            }
          }
        }]));
      }, () => {
      });
    }, e => console.debug("Couldn't calculate gas price because of:", e));
  }

  doTrade = () => {
    const amount = this.trade[this.trade.operation === "sellAll" ? "amountPay" : "amountBuy"];
    const threshold = settings.chain[NetworkStore.network].threshold[[this.trade.from, this.trade.to].sort((a, b) => a > b).join("")] * 0.01;
    const limit = toWei(this.trade.operation === "sellAll" ? this.trade.amountBuy.times(1 - threshold) : this.trade.amountPay.times(1 + threshold)).round(0);
    if (this.trade.from === "eth") {
      this.trade.step = 2;
      this.trade.txs = 1;
      this.trade.proxy = ProfileStore.proxy;
      this[ProfileStore.proxy ? "executeProxyTx" : "executeProxyCreateAndSellETH"](amount, limit);
    } else {
      let callbacks = [
        [
          "system/checkAllowance",
          this.trade.from,
          "proxy",
          amount,
          [
            ["system/executeProxyTx", amount, limit]
          ]
        ]
      ];

      if (ProfileStore.proxy) {
        TransactionsStore.executeCallbacks(callbacks);
      } else {
        TransactionsStore.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
          TransactionsStore.logRequestTransaction("proxy").then(() => {
            callbacks = [["profile/getAndSetProxy", callbacks]];
            this.trade.txs = 3;
            this.trade.step = 2;
            Blockchain.objects.proxyRegistry.build({gasPrice}, (e, tx) => {
              if (!e) {
                TransactionsStore.logPendingTransaction(tx, "proxy", callbacks);
              } else {
                if (TransactionsStore.isErrorDevice(e)) {
                  TransactionsStore.logTransactionErrorDevice("proxy");
                } else {
                  TransactionsStore.logTransactionRejected("proxy");
                }
              }
            });
          });
        });
      }
    }
  }

  getBestPriceOffer = (tokenSell, tokenBuy) => {
    const offerTokenSell = settings.chain[NetworkStore.network].tokens[tokenBuy.replace("eth", "weth")].address;
    const offerTokenBuy = settings.chain[NetworkStore.network].tokens[tokenSell.replace("eth", "weth")].address;
    const otc = Blockchain.loadObject("matchingmarket", settings.chain[NetworkStore.network].otc);
    return new Promise((resolve, reject) => {
      otc.getBestOffer(offerTokenSell, offerTokenBuy, (e, r) => {
        if (!e) {
          otc.offers(r, (e2, r2) => {
            if (!e2) {
              resolve((tokenSell === "dai" || (tokenSell === "eth" && tokenBuy !== "dai"))
                ?
                r2[2].div(r2[0])
                :
                r2[0].div(r2[2]));
            } else {
              reject(e2);
            }
          });
        } else {
          reject(e);
        }
      });
    });
  }

  calculateBuyAmount = (from, to, amount) => {
    const rand = Math.random();
    this.trade.rand = rand;
    this.trade.from = from;
    this.trade.to = to;
    this.trade.amountBuy = toBigNumber(0);
    this.trade.amountPay = toBigNumber(amount);
    this.trade.amountBuyInput = "";
    this.trade.amountPayInput = amount;
    this.trade.price = toBigNumber(0);
    this.trade.priceUnit = "";
    this.trade.bestPriceOffer = toBigNumber(0);
    this.trade.operation = "sellAll";
    this.trade.txCost = toBigNumber(0);
    this.trade.errorInputSell = null;
    this.trade.errorInputBuy = null;
    this.trade.errorOrders = null;

    if (toBigNumber(amount).eq(0)) {
      if (this.trade.rand === rand) {
        this.trade.amountBuy = fromWei(toBigNumber(0));
        this.trade.amountBuyInput = "";
      }
      return;
    }
    const minValue = settings.chain[NetworkStore.network].tokens[from.replace("eth", "weth")].minValue;
    if (this.trade.amountPay.lt(minValue)) {
      if (this.trade.rand === rand) {
        this.trade.errorInputSell = `minValue:${new BigNumber(minValue).valueOf()}`;
      }
      return;
    }
    Blockchain.loadObject("matchingmarket", settings.chain[NetworkStore.network].otc).getBuyAmount(
      settings.chain[NetworkStore.network].tokens[to.replace("eth", "weth")].address,
      settings.chain[NetworkStore.network].tokens[from.replace("eth", "weth")].address,
      toWei(amount),
      async (e, r) => {
        if (!e) {
          const calculatedReceiveValue = fromWei(toBigNumber(r));
          const bestPriceOffer = await this.getBestPriceOffer(this.trade.from, this.trade.to);

          if (this.trade.rand === rand) {
            this.trade.amountBuy = calculatedReceiveValue;
            this.trade.amountBuyInput = this.trade.amountBuy.valueOf();
            this.trade = {...this.trade, ...calculateTradePrice(this.trade.from, this.trade.amountPay, this.trade.to, this.trade.amountBuy)}; // TODO: VER
            this.trade.bestPriceOffer = bestPriceOffer;
          }

          const balance = from === "eth" ? await Blockchain.getEthBalanceOf(NetworkStore.defaultAccount) : await Blockchain.getTokenBalanceOf(from, NetworkStore.defaultAccount);
          const errorInputSell = balance.lt(toWei(amount))
            ?
            // `Not enough balance to sell ${amount} ${from.toUpperCase()}`
            "funds"
            :
            "";
          const errorOrders = this.trade.amountBuy.eq(0)
            ?
            {
              type: "sell",
              amount,
              token: from.toUpperCase()
            }
            :
            null;
          if (errorInputSell || errorOrders) {
            if (this.trade.rand === rand) {
              this.trade.errorInputSell = errorInputSell;
              this.trade.errorOrders = errorOrders;
            }
            return;
          }

          /*
          * Even thought the user entered how much he wants to pay
          * we still must calculate if what he will receive is higher than
          * the min value for the receive token.
          *
          * If the amount of the calculated buying value is under the min value
          * an error message is displayed for violating min value.
          *
          * */
          const calculatedReceiveValueMin = settings.chain[NetworkStore.network].tokens[to.replace("eth", "weth")].minValue;

          if (calculatedReceiveValue.lt(calculatedReceiveValueMin)) {
            if (this.trade.rand === rand) {
              this.trade.amountBuyInput = calculatedReceiveValue.valueOf();
              this.trade.errorInputBuy = `minValue:${new BigNumber(calculatedReceiveValueMin).valueOf()}`;
            }
            return;
          }

          let expenses = await this.estimateAllGasCosts("sellAll", from, to, amount, rand);
          let ethBalance = balance;

          if (this.trade.from === "eth") {
            expenses = expenses.add(toWei(this.trade.amountPay));
          } else {
            ethBalance = await Blockchain.getEthBalanceOf(NetworkStore.defaultAccount);
          }

          this.checkIfOneCanPayForGas(ethBalance, expenses, rand);
        } else {
          console.log(e);
        }
      });
  }

  calculatePayAmount = (from, to, amount) => {
    const rand = Math.random();
    this.trade.rand = rand;
    this.trade.from = from;
    this.trade.to = to;
    this.trade.amountBuy = toBigNumber(amount);
    this.trade.amountPay = toBigNumber(0);
    this.trade.amountBuyInput = amount;
    this.trade.amountPayInput = "";
    this.trade.price = toBigNumber(0);
    this.trade.priceUnit = "";
    this.trade.bestPriceOffer = toBigNumber(0);
    this.trade.operation = "buyAll";
    this.trade.txCost = toBigNumber(0);
    this.trade.errorInputSell = null;
    this.trade.errorInputBuy = null;
    this.trade.errorOrders = null;

    if (toBigNumber(amount).eq(0)) {
      if (this.trade.rand === rand) {
        this.trade.amountPay = fromWei(toBigNumber(0));
        this.trade.amountPayInput = "";
      }
      return;
    }
    const minValue = settings.chain[NetworkStore.network].tokens[to.replace("eth", "weth")].minValue;
    if (this.trade.amountBuy.lt(minValue)) {
      if (this.trade.rand === rand) {
        this.trade.errorInputBuy = `minValue:${new BigNumber(minValue).valueOf()}`;
      }
      return;
    }
    Blockchain.loadObject("matchingmarket", settings.chain[NetworkStore.network].otc).getPayAmount(
      settings.chain[NetworkStore.network].tokens[from.replace("eth", "weth")].address,
      settings.chain[NetworkStore.network].tokens[to.replace("eth", "weth")].address,
      toWei(amount),
      async (e, r) => {
        if (!e) {
          const calculatedPayValue = fromWei(toBigNumber(r));
          const bestPriceOffer = await this.getBestPriceOffer(this.trade.from, this.trade.to);
          if (this.trade.rand === rand) {
            this.trade.amountPay = calculatedPayValue;
            this.trade.amountPayInput = this.trade.amountPay.valueOf();
            this.trade = {...this.trade, ...calculateTradePrice(this.trade.from, this.trade.amountPay, this.trade.to, this.trade.amountBuy)}; // TODO: VERRRR
            this.trade.bestPriceOffer = bestPriceOffer;
          }

          const balance = from === "eth" ? await Blockchain.getEthBalanceOf(NetworkStore.defaultAccount) : await Blockchain.getTokenBalanceOf(from, NetworkStore.defaultAccount);
          const errorInputSell = balance.lt(toWei(this.trade.amountPay))
            ?
            // `Not enough balance to sell ${this.trade.amountPay} ${from.toUpperCase()}`
            "funds"
            :
            null;
          const errorOrders = this.trade.amountPay.eq(0)
            ?
            {
              type: "buy",
              amount,
              token: to.toUpperCase()
            }
            :
            null;
          if (errorInputSell || errorOrders) {
            if (this.trade.rand === rand) {
              this.trade.errorInputSell = errorInputSell;
              this.trade.errorOrders = errorOrders;
            }
            return;
          }

          /*
          * Even thought the user entered how much he wants to receive
          * we still must calculate if what he has to pay is higher than
          * the min value for the pay token.
          *
          * If the amount of the calculated selling  value is under the min value
          * an error message is displayed for violating min value.
          *
          * */
          const calculatePayValueMin = settings.chain[NetworkStore.network].tokens[from.replace("eth", "weth")].minValue;

          if (calculatedPayValue.lt(calculatePayValueMin)) {
            if (this.trade.rand === rand) {
              this.trade.amountPayInput = calculatedPayValue.valueOf();
              this.trade.errorInputSell = `minValue:${new BigNumber(calculatePayValueMin).valueOf()}`;
            }
            return;
          }

          let expenses = await this.estimateAllGasCosts("buyAll", from, to, amount, rand);
          let ethBalance = balance;

          if (this.trade.from === "eth") {
            expenses = expenses.add(toWei(this.trade.amountPay));
          } else {
            ethBalance = await Blockchain.getEthBalanceOf(NetworkStore.defaultAccount);
          }

          this.checkIfOneCanPayForGas(ethBalance, expenses, rand);
        } else {
          console.log(e);
        }
      });
  }

  checkIfOneCanPayForGas = (balance, expenses, rand) => {
    if (balance.lte(expenses)) {
      if (this.trade.rand === rand) {
        this.trade.errorInputSell = "gasCost";
      }
    }
  };

  estimateAllGasCosts = async (operation, from, to, amount, rand) => {
    let hasAllowance = true;
    let action = null;
    let data = null;
    let target = null;
    let addrFrom = null;
    const txs = [];

    if (from !== "eth") {
      hasAllowance = ProfileStore.proxy &&
        (await Blockchain.getTokenTrusted(from, NetworkStore.defaultAccount, ProfileStore.proxy) ||
          (await Blockchain.getTokenAllowance(from, NetworkStore.defaultAccount, ProfileStore.proxy)).gt(toWei(amount)));

      if (!hasAllowance) {
        if (!ProfileStore.proxy) {
          txs.push({
            to: Blockchain.objects.proxyRegistry.address,
            data: Blockchain.objects.proxyRegistry.build.getData(),
            value: 0,
            from: NetworkStore.defaultAccount
          });
        }
        txs.push({
          to: Blockchain.objects[from].address,
          data: Blockchain.objects[from].approve.getData(ProfileStore.proxy ? ProfileStore.proxy : "0x0000000000000000000000000000000000000000", -1),
          value: 0,
          from: NetworkStore.defaultAccount
        });
      }
    }

    const limit = operation === "sellAll" ? 0 : toWei(9999999);
    if (ProfileStore.proxy || from !== "eth") {
      target = ProfileStore.proxy && hasAllowance ? ProfileStore.proxy : settings.chain[NetworkStore.network].proxyEstimation;
      addrFrom = ProfileStore.proxy && hasAllowance ? NetworkStore.defaultAccount : settings.chain[NetworkStore.network].addrEstimation;
      action = Blockchain.getCallDataAndValue(NetworkStore.network, operation, from, to, amount, limit);
      data = Blockchain.loadObject("dsproxy", target).execute["address,bytes"].getData(
        settings.chain[NetworkStore.network].proxyContracts.oasisDirect,
        action.calldata
      );
    } else {
      target = settings.chain[NetworkStore.network].proxyCreationAndExecute;
      addrFrom = NetworkStore.defaultAccount;
      action = Blockchain.getActionCreateProxyAndSellETH(NetworkStore.network, operation, to, amount, limit);
      data = Blockchain.loadObject("proxycreateandexecute", target)[action.method].getData(...action.params);
    }

    txs.push({
      to: target,
      data,
      value: action.value ? action.value : 0,
      from: addrFrom
    });

    return await this.saveCost(txs, rand);
  }

  saveCost = (txs = [], rand) => {
    const promises = [];
    let total = toBigNumber(0);
    txs.forEach(tx => {
      promises.push(this.calculateCost(tx.to, tx.data, tx.value, tx.from));
    });
    return Promise.all(promises).then(costs => {
      costs.forEach(cost => {
        total = total.add(cost);
      });
      if (this.trade.rand === rand) {
        this.trade.txCost = fromWei(total);
      }
      return total;
    })
  }

  calculateCost = (to, data, value = 0, from) => {
    return new Promise((resolve, reject) => {
      console.log("Calculating cost...");
      Promise.all([Blockchain.estimateGas(to, data, value, from), TransactionsStore.fasterGasPrice(settings.gasPriceIncreaseInGwei)]).then(r => {
        console.log(to, data, value, from);
        console.log(r[0], r[1].valueOf());
        resolve(r[1].times(r[0]));
      }, e => {
        reject(e);
      });
    });
  }
}

decorate(SystemStore, {
  balances: observable,
  trade: observable
});

const store = new SystemStore();
export default store;
