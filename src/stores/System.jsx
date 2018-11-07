// Libraries
import { computed, observable, reaction } from "mobx";

// Utils
import * as blockchain from "../utils/blockchain";
import {
  toBigNumber,
  toWei,
  fromWei,
  calculateTradePrice,
  fetchETHPriceInUSD,
  threshold as defaultThresholdFor
} from "../utils/helpers";
import * as oasis from "../utils/oasis";
import * as settings from "../settings";
import { ERRORS } from "../utils/errors";

export default class SystemStore {
  @observable ethPriceInUSD = 0;
  @observable customThreshold;
  @observable customSlippagePrice;
  @observable balances = {
    dai: null,
    eth: null,
    mkr: null
  };

  @observable gasPrice = toBigNumber(this.rootStore.quotes.selected.price);

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
    txs: null,
    error: null,
    proxy: null
  };

  constructor(rootStore) {
    this.rootStore = rootStore;

    reaction(
      () => this.rootStore.network.network,
      network => {
        if(network){
          this.customThreshold = defaultThresholdFor(network, this.trade.from, this.trade.to);
        }
      }
    )

    reaction(
      () => this.rootStore.quotes.selected.price,
      price => {
        this.gasPrice = toBigNumber(price);
        this.recalculate();
      }
    )

    reaction(
      () => this.trade.price,
      price => {
        if (price.gt(0)) {
          this.priceTicker = setInterval(() => {
           this.recalculate();
          }, settings.priceTickerInterval);
        } else {
          if (this.priceTicker) {
            this.stopPriceTicker();
          }
        }
      }
    )
  }

  @computed
  get priceImpact() {

    const priceImpact = this.trade.bestPriceOffer
      .minus(this.trade.price)
      .abs()
      .div(this.trade.bestPriceOffer)
      .times(100)
      .round(2)
      .valueOf();

    if (isNaN(priceImpact)) {
      return 0;
    }

    return priceImpact;
  }

  set threshold(value) {
    this.customThreshold = value;
  }

  @computed
  get threshold() {
    this.slippagePrice = this.trade.price * this.customThreshold / 100;
    return this.customThreshold;
  }

  set slippagePrice(value) {
    this.customSlippagePrice = value;
  }

  @computed
  get slippagePrice() {
    return this.customSlippagePrice;
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
      txs: null,
      proxy: null
    };
  }

  stopPriceTicker = () => {
    if (this.priceTicker) {
      clearInterval(this.priceTicker);
      this.priceTicker = null;
    }
  };

  cleanInputs = () => {
    this.trade.amountPay = toBigNumber(0);
    this.trade.amountBuy = toBigNumber(0);
    this.trade.amountPayInput = "";
    this.trade.amountBuyInput = "";
    this.trade.txCost = toBigNumber(0);
    this.trade.error = null;
  }

  recalculate = () => {
    if (this.trade.operation === "sellAll") {
      this.calculateBuyAmount(this.trade.from, this.trade.to, this.trade.amountPay);
    }
    if (this.trade.operation === "buyAll") {
      this.calculatePayAmount(this.trade.from, this.trade.to, this.trade.amountBuy);
    }
  }

  getETHPriceInUSD = () => {
    fetchETHPriceInUSD().then(price => {
      this.ethPriceInUSD = price;
    });
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
        this.rootStore.transactions.logRequestTransaction("approval").then(() => {
          const tokenObj = blockchain.objects[token];
          const params = [dst, -1];
          tokenObj.approve(...params.concat([{gasPrice: this.gasPrice}, (e, tx) => {
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
      }
    }, () => {
    });
  }

  executeProxyTx = (amount, limit) => {
    const {network, defaultAccount} = this.rootStore.network;
    const data = oasis.getCallDataAndValue(network, this.trade.operation, this.trade.from, this.trade.to, amount, limit);
    this.rootStore.transactions.logRequestTransaction("trade").then(async () => {
      const proxy = blockchain.objects.proxy;
      const params = [settings.chain[network].proxyContracts.oasisDirect, data.calldata];
      const proxyExecuteData = proxy.execute["address,bytes"].getData(params[0], params[1]);

      const gas = await blockchain.estimateGas(
        this.rootStore.profile.proxy,
        proxyExecuteData,
        data.value ? data.value : 0,
        defaultAccount
      );

      proxy.execute["address,bytes"](...params.concat([{
        value: data.value,
        gas: gas+1000000, // TODO: Figure out a way to estimate the gas precisely. We are hitting https://github.com/ethereum/go-ethereum/issues/1590
        gasPrice: this.gasPrice
      }, (e, tx) => {
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
  }

  executeProxyCreateAndSellETH = (amount, limit) => {
    const proxyCreateAndExecuteContractAddress = settings.chain[this.rootStore.network.network].proxyCreationAndExecute;
    const {network, defaultAccount} = this.rootStore.network;
    const {isErrorDevice, logRequestTransaction, logPendingTransaction, logTransactionErrorDevice, logTransactionRejected} = this.rootStore.transactions;
    const data = oasis.getActionCreateProxyAndSellETH(network, this.trade.operation, this.trade.to, amount, limit);

    logRequestTransaction("trade").then(async () => {
      const proxyCreateAndExecute = blockchain.loadObject("proxycreateandexecute", proxyCreateAndExecuteContractAddress);
      const proxyCreateAndExecuteData = proxyCreateAndExecute[data.method].getData(...data.params);

      const gas = await blockchain.estimateGas(
        proxyCreateAndExecuteContractAddress,
        proxyCreateAndExecuteData,
        data.value ? data.value : 0,
        defaultAccount
      );

      proxyCreateAndExecute[data.method](...data.params.concat([{
        gas,
        value: data.value,
        gasPrice: this.gasPrice
      }, (e, tx) => {
        if (!e) {
          logPendingTransaction(tx, "trade", [["profile/getAndSetProxy"]]);
        } else {
          console.log(e);
          if (isErrorDevice(e)) {
            logTransactionErrorDevice("trade");
          } else {
            logTransactionRejected("trade");
          }
        }
      }]));
    }, () => {
    });
  }

  doTrade = () => {
    this.stopPriceTicker();
    const amount = this.trade[this.trade.operation === "sellAll" ? "amountPay" : "amountBuy"];
    const limit = toWei(this.trade.operation === "sellAll" ? this.trade.amountBuy.times(1 - this.threshold * 0.01) : this.trade.amountPay.times(1 + this.threshold * 0.01)).round(0);

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
        this.rootStore.transactions.logRequestTransaction("proxy").then(() => {
          callbacks = [["profile/getAndSetProxy", callbacks]];
          this.trade.txs = 3;
          this.trade.step = 2;
          blockchain.objects.proxyRegistry.build({gasPrice: this.gasPrice}, (e, tx) => {
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
      const amountBuyInput = amountBuy.toFixed(5).valueOf();
      const bestPriceOffer = await oasis.getBestPriceOffer(network, this.trade.from, this.trade.to);
      let givenPrice = calculateTradePrice(this.trade.from, amountPay, this.trade.to, amountBuy);
      const balance = await blockchain.getBalanceOf(from, defaultAccount);

      let costs = await this.estimateAllGasCosts("sellAll", from, to, amountPay, rand);

      // The user doesn't have enough balance to place the trade
      if (!error && balance.lt(toWei(amountPay))) {
        error = {
          cause: ERRORS.INSUFFICIENT_FUNDS(amountPay, from),
          onTradeSide: `sell`,
        };
      }

      const minValueToSell = settings.chain[network].tokens[from.replace("eth", "weth")].minValue;
      if (!error && amountPay.lt(minValueToSell)) {
        error = {
          cause: ERRORS.MINIMAL_VALUE(minValueToSell,from),
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
          cause: ERRORS.MINIMAL_VALUE(minValueToBuy, to),
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
          cause: ERRORS.NO_GAS_FUNDS,
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
                cause: ERRORS.NO_ORDERS(`sell`, amountToPay.valueOf(), from),
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
      const amountPayInput = amountPay.toFixed(5).valueOf();
      const bestPriceOffer = await oasis.getBestPriceOffer(network, this.trade.from, this.trade.to);
      const givenPrice = calculateTradePrice(this.trade.from, amountPay, this.trade.to, amountBuy);

      const balance = await blockchain.getBalanceOf(from, defaultAccount);

      // The user doesn't have enough balance to place the trade
      if (!error && balance.lt(toWei(amountPay))) {
        error = {
          cause: ERRORS.INSUFFICIENT_FUNDS(amountBuy, to),
          onTradeSide: `sell`,
        }
      }

      const minValueToBuy = settings.chain[network].tokens[to.replace("eth", "weth")].minValue;
      if (!error && amountBuy.lt(minValueToBuy)) {
        error = {
          cause: ERRORS.MINIMAL_VALUE(minValueToBuy, to),
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
          cause: ERRORS.MINIMAL_VALUE(minValueToSell, from),
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
          cause: ERRORS.NO_GAS_FUNDS,
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
                cause: ERRORS.NO_ORDERS(`buy`, amountToBuy, to),
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
    const promises = [];

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
      if (from !== "eth" && (!this.rootStore.profile.proxy || !hasAllowance)) {
        if (operation === "sellAll") {
          promises.push(this.roughTradeCost("SellAll", from, amount, to));
        } else {
          promises.push(this.roughTradeCost("BuyAll", to, amount, from));
        }
      } else {
        target = this.rootStore.profile.proxy;
        addrFrom = this.rootStore.network.defaultAccount;
        action = oasis.getCallDataAndValue(this.rootStore.network.network, operation, from, to, amount, limit);
        data = blockchain.loadObject("dsproxy", target).execute["address,bytes"].getData(
          settings.chain[this.rootStore.network.network].proxyContracts.oasisDirect,
          action.calldata
        );

        txs.push({
          to: target,
          data,
          value: action.value ? action.value : 0,
          from: addrFrom
        });
      }
    } else {
      target = settings.chain[this.rootStore.network.network].proxyCreationAndExecute;
      addrFrom = this.rootStore.network.defaultAccount;
      action = oasis.getActionCreateProxyAndSellETH(this.rootStore.network.network, operation, to, amount, limit);
      data = blockchain.loadObject("proxycreateandexecute", target)[action.method].getData(...action.params);

      txs.push({
        to: target,
        data,
        value: action.value ? action.value : 0,
        from: addrFrom
      });
    }

    return await this.saveCost(txs, promises, rand);
  }

  saveCost = (txs = [], promises, rand) => {
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
      console.log("Total cost:", fromWei(total).valueOf(), " ETH")
      return total;
    })
  }

  roughTradeCost = (operation, tok1, amountTok1, tok2) => {
    return new Promise((resolve, reject) => {
      Promise.all(
        [
          oasis.roughTradeCost(this.rootStore.network.network, operation, tok1, amountTok1, tok2),
          this.gasPrice
        ]
      ).then(r => {
          // 150K gas as base cost
          // 133K per each complete offer taken
          // 70K if partially order taken
          const gasCost = r[0][0].times(136500).add(r[0][1] ? 70000 : 0).add(141100);
          console.log("Rough trade cost:", gasCost.valueOf(), "gas")
          console.log("Rough trade gas Price:", r[1].valueOf(), "Gwei")
          resolve(r[1].times(gasCost));
        },
        e => reject(e)
      );
    });
  }

  calculateCost = (to, data, value = 0, from) => {
    return new Promise((resolve, reject) => {
      console.log("Calculating cost...");

      blockchain.estimateGas(to, data, value, from).then(gas => {
        console.log(to, data, value, from);
        console.log(gas, this.gasPrice.valueOf());

        if (data === "0x8e1a55fc") {
          console.log("Create proxy cost:", gas.toString(), "gas");
          console.log("Create proxy gas Price:", this.gasPrice.valueOf(), "Gwei");
        } else if (data.substr(0, 10) === "0x095ea7b3") {
          console.log("Approve cost:", gas.toString(), "gas");
          console.log("Approve gas Price:", this.gasPrice.valueOf(), "Gwei");
        } else {
          console.log("Trade cost:", gas.toString(), "gas");
          console.log("Trade gas Price:", this.gasPrice.valueOf(), "Gwei");
        }

        resolve(this.gasPrice.times(gas));
      }, e => {
        reject(e);
      });
    });
  }
}