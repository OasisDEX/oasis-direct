import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';

import { createStore, combineReducers, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import { Provider, } from 'react-redux';
import { createLogger as log } from 'redux-logger';
import { reducer as hw } from './handlers/HardWallet';
// import { toBigNumber } from "./helpers";

// HELPER FUNCTIONS

// const newTrade = (from, to) => {
//   return {
//     step: 1,
//     operation: '',
//     from,
//     to,
//     amountPay: toBigNumber(0),
//     amountBuy: toBigNumber(0),
//     amountPayInput: '',
//     amountBuyInput: '',
//     price: toBigNumber(0),
//     priceUnit: '',
//     bestPriceOffer: toBigNumber(0),
//     txCost: toBigNumber(0),
//     errorInputSell: null,
//     errorInputBuy: null,
//     errorOrders: null,
//     txs: null,
//     proxy: null
//   }
// };

const store = createStore(
  combineReducers(
    {hw,}
  ),
  {},
  applyMiddleware(
    log(),
    promiseMiddleware()
  )
);

window.addEventListener('load', () => {

  ReactDOM.render(
    <Provider store={store}>
      <App/>
    </Provider>,
    document.getElementById('root')
  );

});

