// Libraries
import { observable } from "mobx";

// Utils
import * as blockchain from "../utils/blockchain";
import { toBigNumber, toWei, fromWei, BigNumber, calculateTradePrice } from "../utils/helpers";
import * as oasis from "../utils/oasis";
import * as settings from "../settings";

export default class SystemStore {
  @observable balances = {
    dai: null,
    eth: null,
    mkr: null
  };

  @observable trade = {
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

  @observable error = {};

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

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
      blockchain.getEthBalanceOf(this.rootStore.network.defaultAccount).then(r => {
        this.balances.eth = r;
      }, () => {
      });
    } else {
      blockchain.getTokenBalanceOf(token, this.rootStore.network.defaultAccount).then(r => {
        this.balances[token] = r;
      }, () => {
      });
    }
  }

  setUpToken = token => {
    blockchain.loadObject(token === "weth" ? "dsethtoken" : "dstoken", settings.chain[this.rootStore.network.network].tokens[token].address, token);
    setInterval(() => this.saveBalance(token), 5000);
    this.saveBalance(token);
  }

  checkAllowance = (token, dst, value, callbacks) => {
    if (dst === "proxy") dst = this.rootStore.profile.proxy; // It needs to be done as proxy might not be created when setAllowance is added to the queue of functions to be executed
    const valueObj = toBigNumber(toWei(value));
    blockchain.getTokenAllowance(token, this.rootStore.network.defaultAccount, dst).then(r => {
      if (r.gte(valueObj)) {
        this.trade.step = 2;
        this.trade.txs = this.trade.txs ? this.trade.txs : 1;

        this.rootStore.transactions.executeCallbacks(callbacks);
      } else {
        this.trade.step = 2;
        this.trade.txs = this.trade.txs ? this.trade.txs : 2;

        this.rootStore.transactions.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
          this.rootStore.transactions.logRequestTransaction("approval").then(() => {
            const tokenObj = blockchain.objects[token];
            const params = [dst, -1];
            tokenObj.approve(...params.concat([{gasPrice}, (e, tx) => {
              if (!e) {
                this.rootStore.transactions.logPendingTransaction(tx, "approval", callbacks);
              } else {
                if (this.rootStore.transactions.isErrorDevice(e)) {
                  this.rootStore.transactions.logTransactionErrorDevice("approval");
                } else {
                  this.rootStore.transactions.logTransactionRejected("approval");
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
    const data = oasis.getCallDataAndValue(this.rootStore.network.network, this.trade.operation, this.trade.from, this.trade.to, amount, limit);
    this.rootStore.transactions.logRequestTransaction("trade").then(() => {
      this.rootStore.transactions.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
        const proxy = blockchain.objects.proxy;
        const params = [settings.chain[this.rootStore.network.network].proxyContracts.oasisDirect, data.calldata];
        proxy.execute["address,bytes"](...params.concat([{value: data.value, gasPrice}, (e, tx) => {
          if (!e) {
            this.rootStore.transactions.logPendingTransaction(tx, "trade");
          } else {
            console.log(e);
            if (this.rootStore.transactions.isErrorDevice(e)) {
              this.rootStore.transactions.logTransactionErrorDevice("trade");
            } else {
              this.rootStore.transactions.logTransactionRejected("trade");
            }
          }
        }]));
      }, () => {
      });
    }, () => {
    });
  }

  executeProxyCreateAndSellETH = (amount, limit) => {
    const data = oasis.getActionCreateProxyAndSellETH(this.rootStore.network.network, this.trade.operation, this.trade.to, amount, limit);
    this.rootStore.transactions.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
      this.rootStore.transactions.logRequestTransaction("trade").then(() => {
        const proxyCreateAndExecute = blockchain.loadObject("proxycreateandexecute", settings.chain[this.rootStore.network.network].proxyCreationAndExecute);
        proxyCreateAndExecute[data.method](...data.params.concat([{value: data.value, gasPrice}, (e, tx) => {
          if (!e) {
            this.rootStore.transactions.logPendingTransaction(tx, "trade", [["profile/getAndSetProxy"]]);
          } else {
            console.log(e);
            if (this.rootStore.transactions.isErrorDevice(e)) {
              this.rootStore.transactions.logTransactionErrorDevice("trade");
            } else {
              this.rootStore.transactions.logTransactionRejected("trade");
            }
          }
        }]));
      }, () => {
      });
    }, e => console.debug("Couldn't calculate gas price because of:", e));
  }

  doTrade = () => {
    const amount = this.trade[this.trade.operation === "sellAll" ? "amountPay" : "amountBuy"];
    const threshold = settings.chain[this.rootStore.network.network].threshold[[this.trade.from, this.trade.to].sort((a, b) => a > b).join("")] * 0.01;
    const limit = toWei(this.trade.operation === "sellAll" ? this.trade.amountBuy.times(1 - threshold) : this.trade.amountPay.times(1 + threshold)).round(0);
    if (this.trade.from === "eth") {
      this.trade.step = 2;
      this.trade.txs = 1;
      this.trade.hasToCreateProxyInTrade = Boolean(!this.rootStore.profile.proxy);
      this[this.rootStore.profile.proxy ? "executeProxyTx" : "executeProxyCreateAndSellETH"](amount, limit);
    } else {
      this.trade.hasToCreateProxyInTrade = false;
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

      if (this.rootStore.profile.proxy) {
        this.rootStore.transactions.executeCallbacks(callbacks);
      } else {
        this.rootStore.transactions.fasterGasPrice(settings.gasPriceIncreaseInGwei).then(gasPrice => {
          this.rootStore.transactions.logRequestTransaction("proxy").then(() => {
            callbacks = [["profile/getAndSetProxy", callbacks]];
            this.trade.txs = 3;
            this.trade.step = 2;
            blockchain.objects.proxyRegistry.build({gasPrice}, (e, tx) => {
              if (!e) {
                this.rootStore.transactions.logPendingTransaction(tx, "proxy", callbacks);
              } else {
                if (this.rootStore.transactions.isErrorDevice(e)) {
                  this.rootStore.transactions.logTransactionErrorDevice("proxy");
                } else {
                  this.rootStore.transactions.logTransactionRejected("proxy");
                }
              }
            });
          });
        });
      }
    }
  }

  calculateBuyAmount = (from, to, amountToPay) => {
    const rand = Math.random(); //Used to differentiate the requests. If a former request finishes after a latter one , we shouldn't update the values.
    this.trade.rand = rand;
    this.trade.from = from;
    this.trade.to = to;
    this.trade.amountBuy = toBigNumber(0);
    this.trade.amountPay = toBigNumber(amountToPay);
    this.trade.amountBuyInput = "";
    this.trade.amountPayInput = amountToPay;
    this.trade.price = toBigNumber(0);
    this.trade.priceUnit = "";
    this.trade.bestPriceOffer = toBigNumber(0);
    this.trade.operation = "sellAll";
    this.trade.txCost = toBigNumber(0);
    this.trade.error = null;

    const {network, defaultAccount} = this.rootStore.network;

    if (toBigNumber(amountToPay).eq(0)) {
      this.trade.amountBuy = fromWei(toBigNumber(0));
      this.trade.amountBuyInput = "";
      return;
    }

    const evaluateTrade = async (amountPay, amountBuy) => {
      let error = null;
      const amountBuyInput = amountBuy.valueOf();
      const bestPriceOffer = await oasis.getBestPriceOffer(network, this.trade.from, this.trade.to);
      let givenPrice = calculateTradePrice(this.trade.from, amountPay, this.trade.to, amountBuy);
      const balance = await blockchain.getBalanceOf(from, defaultAccount);

      let costs = await this.estimateAllGasCosts("sellAll", from, to, amountPay, rand);

      // The user doesn't have enough balance to place the trade
      if (!error && balance.lt(toWei(amountPay))) {
        error = {
          cause: `You don't have ${amountPay} ${from.toUpperCase()} in your wallet`,
          onTradeSide: `sell`,
        };
      }

      const minValueToSell = settings.chain[network].tokens[from.replace("eth", "weth")].minValue;
      if (!error && amountPay.lt(minValueToSell)) {
        error = {
          cause: `The minimum trade value is ${new BigNumber(minValueToSell).valueOf()} ${from.toUpperCase()}`,
          onTradeSide: `sell`,
        };
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
      const minValueToBuy = settings.chain[network].tokens[to.replace("eth", "weth")].minValue;
      if (!error && amountBuy.lt(minValueToBuy)) {
        error = {
          cause: `The Minimum trade value is ${new BigNumber(minValueToBuy).valueOf()} ${to.toUpperCase()}`,
          onTradeSide: `buy`,
        };
      }

      let ethBalance = balance;

      if (this.trade.from === "eth") {
        costs = costs.add(toWei(amountPay));
      } else {
        ethBalance = await blockchain.getEthBalanceOf(defaultAccount);
      }

      if (!error && costs.gt(ethBalance)) {
        error = {
          cause: "You will not have enough Ether to pay for the transaction!",
        };
      }

      return {
        error,
        amountBuy,
        amountBuyInput,
        ...givenPrice,
        bestPriceOffer
      }
    };


    blockchain.loadObject("matchingmarket", settings.chain[network].otc).getBuyAmount(
      settings.chain[network].tokens[to.replace("eth", "weth")].address,
      settings.chain[network].tokens[from.replace("eth", "weth")].address,
      toWei(amountToPay),
      async (e, amountToBuy) => {
        if (this.trade.rand === rand) {
          if (!e) {
            const evaluation = await evaluateTrade(toBigNumber(amountToPay), fromWei(amountToBuy));
            if (this.trade.rand === rand) {
              this.trade = {...this.trade, ...evaluation};
            }
          } else {
            if (this.trade.rand === rand) {
              this.trade.error = {
                cause: `No orders available to sell ${amountToPay} ${from.toUpperCase()}`,
                onTradeSide: `buy`,
                isCritical: true
              }
            }
          }
        }
      });
  };

  calculatePayAmount = (from, to, amountToBuy) => {
    const rand = Math.random();  //Used to differentiate the requests. If a former request finishes after a latter one , we shouldn't update the values.
    this.trade.rand = rand;
    this.trade.from = from;
    this.trade.to = to;
    this.trade.amountBuy = toBigNumber(amountToBuy);
    this.trade.amountPay = toBigNumber(0);
    this.trade.amountBuyInput = amountToBuy;
    this.trade.amountPayInput = "";
    this.trade.price = toBigNumber(0);
    this.trade.priceUnit = "";
    this.trade.bestPriceOffer = toBigNumber(0);
    this.trade.operation = "buyAll";
    this.trade.txCost = toBigNumber(0);
    this.trade.error = null;

    const {defaultAccount, network} = this.rootStore.network;

    if (toBigNumber(amountToBuy).eq(0)) {
      this.trade.amountPay = fromWei(toBigNumber(0));
      this.trade.amountPayInput = "";
      this.trade.error = null;
      return;
    }

    const evaluateTrade = async (amountPay, amountBuy) => {
      let error = null;
      const amountPayInput = amountPay.valueOf();
      const bestPriceOffer = await oasis.getBestPriceOffer(network, this.trade.from, this.trade.to);
      const givenPrice = calculateTradePrice(this.trade.from, amountPay, this.trade.to, amountBuy);

      const balance = await blockchain.getBalanceOf(from, defaultAccount);

      // The user doesn't have enough balance to place the trade
      if (!error && balance.lt(toWei(amountPay))) {
        error = {
          cause: `You don't have ${from.toUpperCase()} in your wallet`,
          onTradeSide: `sell`,
        }
      }

      const minValueToBuy = settings.chain[network].tokens[to.replace("eth", "weth")].minValue;
      if (!error && amountBuy.lt(minValueToBuy)) {
        error = {
          cause: `The Minimum trade value is ${new BigNumber(minValueToBuy).valueOf()} ${to.toUpperCase()}`,
          onTradeSide: `buy`,
        }
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
      const minValueToSell = settings.chain[network].tokens[from.replace("eth", "weth")].minValue;
      if (!error && amountPay.lt(minValueToSell)) {
        error = {
          cause: ` The minimum trade value is ${new BigNumber(minValueToSell).valueOf()} ${from.toUpperCase()}`,
          onTradeSide: `sell`,
        };
      }

      let expenses = await this.estimateAllGasCosts("buyAll", from, to, amountToBuy, rand);
      let ethBalance = balance;

      if (this.trade.from === "eth") {
        expenses = expenses.add(toWei(amountPay));
      } else {
        ethBalance = await blockchain.getEthBalanceOf(defaultAccount);
      }

      if (!error && expenses.gt(ethBalance)) {
        error = {
          cause: "You will not have enough  Ether to pay for the transaction!",
        };
      }

      return {
        error,
        amountPay,
        amountPayInput,
        ...givenPrice,
        bestPriceOffer
      }
    }

    blockchain.loadObject("matchingmarket", settings.chain[network].otc).getPayAmount(
      settings.chain[network].tokens[from.replace("eth", "weth")].address,
      settings.chain[network].tokens[to.replace("eth", "weth")].address,
      toWei(amountToBuy),
      async (e, amountToPay) => {
        if (this.trade.rand === rand) {
          if (!e) {
            const evaluation = await evaluateTrade(fromWei(amountToPay), toBigNumber(amountToBuy));
            if (this.trade.rand === rand) this.trade = {...this.trade, ...evaluation};
          } else {
            if (this.trade.rand === rand) {
              this.trade.error = {
                cause: `No orders available to buy ${amountToBuy} ${to.toUpperCase()}`,
                onTradeSide: `buy`,
                isCritical: true
              };
            }
          }
        }
      });
  };

  estimateAllGasCosts = async (operation, from, to, amount, rand) => {
    let hasAllowance = true;
    let action = null;
    let data = null;
    let target = null;
    let addrFrom = null;
    const txs = [];

    if (from !== "eth") {
      hasAllowance = this.rootStore.profile.proxy &&
        (await blockchain.getTokenTrusted(from, this.rootStore.network.defaultAccount, this.rootStore.profile.proxy) ||
          (await blockchain.getTokenAllowance(from, this.rootStore.network.defaultAccount, this.rootStore.profile.proxy)).gt(toWei(amount)));

      if (!hasAllowance) {
        if (!this.rootStore.profile.proxy) {
          txs.push({
            to: blockchain.objects.proxyRegistry.address,
            data: blockchain.objects.proxyRegistry.build.getData(),
            value: 0,
            from: this.rootStore.network.defaultAccount
          });
        }
        txs.push({
          to: blockchain.objects[from].address,
          data: blockchain.objects[from].approve.getData(this.rootStore.profile.proxy ? this.rootStore.profile.proxy : "0x0000000000000000000000000000000000000000", -1),
          value: 0,
          from: this.rootStore.network.defaultAccount
        });
      }
    }

    const limit = operation === "sellAll" ? 0 : toWei(9999999);
    if (this.rootStore.profile.proxy || from !== "eth") {
      target = this.rootStore.profile.proxy && hasAllowance ? this.rootStore.profile.proxy : settings.chain[this.rootStore.network.network].proxyEstimation;
      addrFrom = this.rootStore.profile.proxy && hasAllowance ? this.rootStore.network.defaultAccount : settings.chain[this.rootStore.network.network].addrEstimation;
      action = oasis.getCallDataAndValue(this.rootStore.network.network, operation, from, to, amount, limit);
      data = blockchain.loadObject("dsproxy", target).execute["address,bytes"].getData(
        settings.chain[this.rootStore.network.network].proxyContracts.oasisDirect,
        action.calldata
      );
    } else {
      target = settings.chain[this.rootStore.network.network].proxyCreationAndExecute;
      addrFrom = this.rootStore.network.defaultAccount;
      action = oasis.getActionCreateProxyAndSellETH(this.rootStore.network.network, operation, to, amount, limit);
      data = blockchain.loadObject("proxycreateandexecute", target)[action.method].getData(...action.params);
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
      Promise.all([blockchain.estimateGas(to, data, value, from), this.rootStore.transactions.fasterGasPrice(settings.gasPriceIncreaseInGwei)]).then(r => {
        console.log(to, data, value, from);
        console.log(r[0], r[1].valueOf());
        resolve(r[1].times(r[0]));
      }, e => {
        reject(e);
      });
    });
  }
}
