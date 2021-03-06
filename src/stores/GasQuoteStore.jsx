import { action, autorun, observable, reaction, computed } from "mobx";
import { GAS_PRICE_LEVELS } from "../utils/constants";
import { fromWei, getGasPriceFromETHGasStation, toBigNumber, toWei } from "../utils/helpers";
import * as blockchain from "../utils/blockchain";

import settings from "../settings.json"

export default class GasQuoteStore {
  @observable priceList = [];
  @observable customPrice = 0;
  @observable selected = {level: GAS_PRICE_LEVELS.CUSTOM, price: 0};

  @computed get isReady() {
    return this.priceList.length !== 0
  }

  constructor(rootStore) {
    this.rootStore = rootStore;

    reaction(
      () => this.rootStore.network.network,
      network => {
        if (this.gasPriceTicker) {
          clearInterval(this.gasPriceTicker);
        }

        this.fetchQuote().then(() => {
          this.select(GAS_PRICE_LEVELS.HIGH);
        });

        autorun(() => {
          this.gasPriceTicker = setInterval(this.fetchQuote, settings.gasPriceRefreshRateInMilliseconds);
        })
      }
    );
  }

  @action fetchQuote = () => {
    const priceFromGWEI = price => price / 10;

    const estimate = getGasPriceFromETHGasStation().then(
      // Successfully fetches the data from ETH Gas Station.
      (prices) => {
        return {
          average: priceFromGWEI(prices.average)
        };
      },
      // Failed to fetch the date from ETH Gas Station. Revert to client calculation. If that fails, we can't calculate the gas.
      () => {
        return blockchain.getGasPrice()
          .then(
            estimation => {
              return {
                average: toBigNumber(fromWei(estimation, "GWEI")).add(settings.gasPriceIncreaseInGwei).toNumber()
              }
            },
            error => {
              console.debug("Cannot estimate GAS cost: ", error);
              return {average: 0};
            });
      });
    return estimate.then(price => {
      const txInProgress = (this.rootStore.system.trade.txs || []).length > 0
      if (txInProgress) {
        return;
      }
      
      this.priceList = {
        [GAS_PRICE_LEVELS.HIGH]: {
          level: GAS_PRICE_LEVELS.HIGH,
          price: price.average + settings.gasPriceIncreaseInGwei
        },
        [GAS_PRICE_LEVELS.NORMAL]: {
          level: GAS_PRICE_LEVELS.NORMAL,
          price: price.average
        },
        [GAS_PRICE_LEVELS.CUSTOM]: {
          level: GAS_PRICE_LEVELS.CUSTOM,
          price: (this.priceList[GAS_PRICE_LEVELS.CUSTOM] && this.priceList[GAS_PRICE_LEVELS.CUSTOM].price) || price.average,
        }
      };

      return this.priceList;
    });
  };

  @action select = (level) => {
    this.selected.level = level;
    this.selected.price = toBigNumber(toWei(this.priceList[level].price, 'GWEI'));
  };

  @action update = (price) => {
    this.priceList[GAS_PRICE_LEVELS.CUSTOM].price = price;
    this.selected.price = toBigNumber(toWei(price, 'GWEI'));
  };

  priceOf = (level) => this.priceList[level].price;
}

