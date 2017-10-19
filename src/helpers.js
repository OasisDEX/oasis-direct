import React from 'react';
import web3 from './web3';


export const WAD = web3.toBigNumber(web3.toWei(1));

var padLeft = function (string, chars, sign) {
  return new Array(chars - string.length + 1).join(sign ? sign : "0") + string;
};

export function toBytes32(x, prefix = true) {
  let y = web3.toHex(x);
  y = y.replace('0x', '');
  y = padLeft(y, 64);
  if (prefix) y = '0x' + y;
  return y;
}

export function toBytes12(x, prefix = true) {
  let y = web3.toHex(x);
  y = y.replace('0x', '');
  y = padLeft(y, 24);
  if (prefix) y = '0x' + y;
  return y;
}

export function addressToBytes32(x, prefix = true) {
  let y = x.replace('0x', '');
  y = padLeft(y, 64);
  if (prefix) y = '0x' + y;
  return y;
}

export function formatNumber(number, decimals = false, isWei = true) {
  web3.BigNumber.config({ ROUNDING_MODE: 4 });

  let object = web3.toBigNumber(number);

  if (isWei) object = web3.fromWei(object.round(0));

  if (decimals) {
    const d = web3.toBigNumber(10).pow(decimals);
    object = object.mul(d).trunc().div(d).toFixed(decimals);
  } else {
    object = object.valueOf();
  }

  const parts = object.toString().split('.');
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? `.${parts[1]}` : '');
}

export function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return `${date.toDateString()} ${addZero(date.getHours())}:${addZero(date.getMinutes())}:${addZero(date.getSeconds())}`;
}

function addZero(value) {
  return value > 9 ? value: `0${value}`;
}

export function fromRaytoWad(x) {
  const y = web3.toBigNumber(x).div(web3.toBigNumber(10).pow(9))
  return y;
}

export function copyToClipboard(e) {
  const value = e.target.title.replace(',', '');
  var aux = document.createElement("input");
  aux.setAttribute('value', value);
  document.body.appendChild(aux);
  aux.select();
  document.execCommand("copy");
  document.body.removeChild(aux);
  alert(`Value: "${value}" copied to clipboard`);
}

export function printNumber(number) {
  return <span className="printedNumber" onClick={ copyToClipboard } title={ formatNumber(number, 18) }>{ formatNumber(number, 3) }</span>
}

// Multiply WAD values
export function wmul(a, b) {
  return a.times(b).div(WAD);
}

//Divide WAD values
export function wdiv(a, b) {
  return a.times(WAD).div(b);
}

function etherscanUrl(network) {
  return `https://${ network !== 'main' ? `${network}.` : '' }etherscan.io`;
}

export function etherscanAddress(network, text, address) {
  return <a href={ `${etherscanUrl(network)}/address/${address}` } target="_blank" rel="noopener noreferrer">{ text }</a>
}

export function etherscanTx(network, text, tx) {
  return <a href={ `${etherscanUrl(network)}/tx/${tx}` } target="_blank" rel="noopener noreferrer">{ text }</a>
}

export function etherscanToken(network, text, token, holder = false) {
  return <a href={ `${etherscanUrl(network)}/token/${token}${holder ? `?a=${holder}` : ''}` } target="_blank" rel="noopener noreferrer">{ text }</a>
}

export function methodSig(method) {
  return web3.sha3(method).substring(0, 10)
}
