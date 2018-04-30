import Web3 from 'web3';
const web3 = new Web3();
export default web3;

const initWeb3 = () => {
  if (window.web3) {
    web3.setProvider(window.web3.currentProvider);
  } else {
    web3.setProvider('');
  }
  window.web3 = web3;

  web3.BigNumber.config({EXPONENTIAL_AT:[-18,21]});
}

export { initWeb3 };
