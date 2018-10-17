// Libraries
import React from "react";
import jazzicon from "jazzicon";

// Utils
import web3 from "./web3";

// Settings
import settings from "../settings.json";

export const WAD = web3.toBigNumber(web3.toWei(1));

var padLeft = function (string, chars, sign) {
  return new Array(chars - string.length + 1).join(sign ? sign : "0") + string;
};

export const toBytes32 = (x, prefix = true) => {
  let y = web3.toHex(x);
  y = y.replace("0x", "");
  y = padLeft(y, 64);
  if (prefix) y = "0x" + y;
  return y;
}

export const toBytes12 = (x, prefix = true) => {
  let y = web3.toHex(x);
  y = y.replace("0x", "");
  y = padLeft(y, 24);
  if (prefix) y = "0x" + y;
  return y;
}

export const addressToBytes32 = (x, prefix = true) => {
  let y = x.replace("0x", "");
  y = padLeft(y, 64);
  if (prefix) y = "0x" + y;
  return y;
}

export const formatNumber = (number, decimals = false, isWei = true) => {
  web3.BigNumber.config({ ROUNDING_MODE: 4 });

  let object = web3.toBigNumber(number);

  if (isWei) object = web3.fromWei(object.round(0));

  if (decimals) {
    const d = web3.toBigNumber(10).pow(decimals);
    object = object.mul(d).trunc().div(d).toFixed(decimals);
  } else {
    object = object.valueOf();
  }

  const parts = object.toString().split(".");
  const decimalsWithoutTrailingZeros = parts[1] ? parts[1].replace(/[0]+$/,"") : "";
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (decimalsWithoutTrailingZeros ? `.${decimalsWithoutTrailingZeros}` : "");
}

export const formatDate = timestamp => {
  const date = new Date(timestamp * 1000);
  return `${date.toDateString()} ${addZero(date.getHours())}:${addZero(date.getMinutes())}:${addZero(date.getSeconds())}`;
}

export const addZero = value => {
  return value > 9 ? value: `0${value}`;
}

export const fromRaytoWad = (x) => {
  return web3.toBigNumber(x).div(web3.toBigNumber(10).pow(9));
}

export const copyToClipboard = e => {
  const value = e.target.title.replace(",", "");
  var aux = document.createElement("input");
  aux.setAttribute("value", value);
  document.body.appendChild(aux);
  aux.select();
  document.execCommand("copy");
  document.body.removeChild(aux);
  alert(`Value: "${value}" copied to clipboard`);
}

// Multiply WAD values
export const wmul = (a, b) => {
  return a.times(b).div(WAD);
}

//Divide WAD values
export const wdiv = (a, b) => {
  return a.times(WAD).div(b);
}

export const etherscanUrl = network => {
  return `https://${ network !== "main" ? `${network}.` : "" }etherscan.io`;
}

export const etherscanAddress = (network, text, address) => {
  return <a className="address" href={ `${etherscanUrl(network)}/address/${address}` } target="_blank" rel="noopener noreferrer">{ text }</a>
}

export const etherscanTx = (network, text, tx) => {
  return <a href={ `${etherscanUrl(network)}/tx/${tx}` } target="_blank" rel="noopener noreferrer">{ text }</a>
}

export const etherscanToken = (network, text, token, holder = false) => {
  return <a href={ `${etherscanUrl(network)}/token/${token}${holder ? `?a=${holder}` : ""}` } target="_blank" rel="noopener noreferrer">{ text }</a>
}

export const methodSig = method => {
  return web3.sha3(method).substring(0, 10)
}

export const generateIcon = (address) => {
  return jazzicon(28, address.substr(0,10));
}

export const fetchETHPriceInUSD = () => {
  return fetch("https://api.coinmarketcap.com/v2/ticker/1027/")
    .then(data => {
      return data.json();
    })
    .then((json) => {
      return json.data.quotes.USD.price;
    });
}

export const getGasPriceFromETHGasStation = () => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject("Request timed out!");
    }, 3000);

    fetch("https://ethgasstation.info/json/ethgasAPI.json").then(stream => {
      stream.json().then(price => {
        clearTimeout(timeout);
        resolve(price);
      })
    }, e => {
      clearTimeout(timeout);
      reject(e);
    });
  })
};

//TODO: eventually find a better solution
export const quotation = (from, to) => {
  if (to === "dai" || from === "dai") {
    const quote = "dai";
    const base = to === "dai" ? from : to;
    const isCounter = from !== "dai";

    return {base, quote, isCounter};
  }

  if (to === "eth" || from === "eth") {
    const quote = "eth";
    const base = to === "eth" ? from : to;
    const isCounter = from !== "eth";

    return {base, quote, isCounter};
  }
};

export const calculateTradePrice = (tokenSell, amountSell, tokenBuy, amountBuy) => {
  return (tokenSell === "dai" || (tokenSell === "eth" && tokenBuy !== "dai"))
    ?
    {price: amountSell.div(amountBuy), priceUnit: `${tokenBuy}/${tokenSell}`}
    :
    {price: amountBuy.div(amountSell), priceUnit: `${tokenSell}/${tokenBuy}`};
}

export const calculateSlippage = ( slippageInPercentage, price) => (price * slippageInPercentage) / 100;

export const threshold = (network, from , to) => settings.chain[network].threshold[[from, to].sort((a, b) => a > b).join("")];

export const {toBigNumber , toWei, fromWei, isAddress, BigNumber} = web3;
