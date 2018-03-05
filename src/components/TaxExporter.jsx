import React, { Component } from 'react';
import Spinner from './Spinner';
import web3 from '../web3';
import config from "../exporter-config.json";

import matchingmarket from '../abi/matchingmarket.json';
import {ZeroExExchangesLogo, EtherDeltaExchangeLogo, OasisExchangeLogo } from "./Icons";

class TaxExporter extends Component {
  constructor(props) {
    super();
    this.props = props;
    this.state = {
      isLoading: false,
      accounts: [
        this.props.account,
      ],
      newAddress: "",
      csvData: []
    }
  }

  removeAccount = id => {
    // making copy of the accounts
    const accounts = [...this.state.accounts];

    // Splice removes the selected element and modifies the array beneath
    // We discard the returned value because we care only in the modified version
    accounts.splice(id, 1);

    // Set the new array with the removed account
    this.setState({accounts});
  }

  addAccount = event => {
    event.preventDefault();
    const address = (this.state.newAddress || "").trim();

    if (web3.isAddress(address)) {
      const accounts = [...this.state.accounts];

      if (!accounts.includes(address)) {
        accounts.push(address);
        this.setState({accounts,newAddress:''});
      } else {
        alert("This address is already in the list");
      }
    } else {
      alert("This is not a valid address");
    }
  }

  getPossibleProxies = address => {
    return new Promise((resolve, reject) => {
      this.props.proxyRegistryObj.proxiesCount(address, async (e, r) => {
        if (!e) {
          const proxies = [];
          if (r.gt(0)) {
            for (let i = r.toNumber() - 1; i >= 0; i--) {
              proxies.push(await this.props.getProxy(i));
            }
          }
          resolve(proxies);
        } else {
          reject(e);
        }
      });
    });
  }

  fetchOasisTradesFromAccount = (contract, filter) => {
    return new Promise((resolve, reject) => {
      web3.eth.contract(matchingmarket.abi).at(contract.address).LogTake(filter, {
        fromBlock: contract.block_start,
        toBlock: contract.block_end
      }).get((error, logs) => {
        if (!error) {
          resolve(logs);
        } else {
          reject(error);
        }
      });
    });
  }

  getOwnerTransaction = tx => {
    return new Promise((resolve, reject) => {
      web3.eth.getTransactionReceipt(tx, (e, r) => {
        if (!e) {
          resolve(r.from);
        } else {
          reject(e);
        }
      })
    });
  }

  fetchOasisMakeTrades = (contract, address) => {
    return new Promise((resolve, reject) => {
      Promise.resolve(this.fetchOasisTradesFromAccount(contract, {maker: address})).then(logs => {
        const promises = [];
        logs.forEach(log => {
          promises.push(this.addOasisTradeFor(address, 'maker', log.args));
        });
        Promise.all(promises).then(() => resolve(true));
      }).catch(() => {
        reject();
      })
    });
  }

  fetchOasisTakeTrades = (contract, address) => {
    return new Promise(async (resolve, reject) => {
      const promises = [];
      const proxiesAddr = await this.getPossibleProxies(address);
      promises.push(this.fetchOasisTradesFromAccount(contract, {taker: address}));
      proxiesAddr.forEach(proxyAddr => {
        promises.push(this.fetchOasisTradesFromAccount(contract, {taker: proxyAddr}));
      });
      config.supportContracts[this.props.network].forEach(supportContract => {
        promises.push(this.fetchOasisTradesFromAccount(contract, {taker: supportContract.address}));
      });
      Promise.all(promises).then(async r => {
        const promises2 = [];
        for (let i = 0; i < r.length; i++) {
          for (let j = 0; j < r[i].length; j++) {
            const owner = await this.getOwnerTransaction(r[i][j].transactionHash);
            if (i === 0 || owner === address) {
              // For the cases of proxy trades we need to verify if they were done by the address requested or the proxy might have been transferred before
              promises2.push(this.addOasisTradeFor(address, 'taker', r[i][j].args));
            }
          }
        }
        Promise.all(promises2).then(() => resolve(true));
      }).catch(() => {
        reject();
      })
    });
  }

  setLoading = value => {
    this.setState(prevState => {
      return {isLoading: value};
    });
  }

  fetchData = e => {
    e.preventDefault();
    this.setLoading(true);
    let accounts = [...this.state.accounts];
    let oasisPromises = [];
    this.setState({csvData: []}, () => {
      accounts.forEach(account => {
        config.oasis.contract[this.props.network].forEach(contract => {
          oasisPromises.push(this.fetchOasisMakeTrades(contract, account));
          oasisPromises.push(this.fetchOasisTakeTrades(contract, account));
        });
        if (this.props.network === 'main') {
          oasisPromises.push(this.fetchLegacyTrades(account));
        }
      });

      Promise.all(oasisPromises).then(() => {
        console.log('download CSV')
        this.downloadCSV();
        this.setLoading(false);
      });
    });
  }

  fetchLegacyFile = (fileIndex, address) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `https://oasisdex.github.io/oasis-dex-script/maker-otc-${fileIndex < 10 ? "0" : ""}${fileIndex}.trades.json`, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const promises = [];
          const data = JSON.parse(xhr.responseText);
          for (let i = 0; i < data.length; i++) {
            const taker = `0x${data[i].taker}`;
            const maker = `0x${data[i].maker}`;
            if (taker === address || maker === address) {
              promises.push(this.addOasisLegacyTradeFor(address, maker === address ? 'maker' : 'taker', data[i]));
            }
          }
          Promise.all(promises).then(() => resolve(true));
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
          reject(xhr.status);
        }
      }
      xhr.send();
    });
  }

  fetchLegacyTrades = address => {
    return new Promise((resolve, reject) => {
      const promises = [];
      for (let i = 2; i <= 19; i++) {
        promises.push(this.fetchLegacyFile(i, address));
      }
      Promise.all(promises).then(() => resolve(true));
    });
  }

  addOasisTradeFor = (address, side, log) => {
    return new Promise((resolve, reject) => {
      const sellAmount = web3.fromWei(side === 'maker' ? log.take_amt : log.give_amt).toString(10);
      const buyAmount = web3.fromWei(side === 'maker' ? log.give_amt : log.take_amt).toString(10);
      const sellTokenAddress = side === 'maker' ? log.pay_gem : log.buy_gem;
      const buyTokenAddress = side === 'maker' ? log.buy_gem : log.pay_gem;
      const sellToken = config.tokens[this.props.network][sellTokenAddress];
      const buyToken = config.tokens[this.props.network][buyTokenAddress];

      const trade = {
        type: 'Trade',
        buyAmount,
        buyToken,
        sellAmount,
        sellToken: sellToken,
        fee: '',
        feeToken: '',
        exchange: 'Oasisdex.com',
        group: '',
        address,
        timestamp: log.timestamp,
      };

      //add trade to CSV
      Promise.resolve(this.addTradeToCSV(trade)).then(() => resolve(true));
    });
  }

  addOasisLegacyTradeFor = (address, side, log) => {
    return new Promise((resolve, reject) => {
      const sellAmount = web3.fromWei(`0x${side === 'maker' ? log.takeAmount : log.giveAmount}`).toString(10);
      const buyAmount = web3.fromWei(`0x${side === 'maker' ? log.giveAmount : log.takeAmount}`).toString(10);
      const sellTokenAddress = `0x${side === 'maker' ? log.haveToken : log.wantToken}`;
      const buyTokenAddress = `0x${side === 'maker' ? log.wantToken : log.haveToken}`;
      const sellToken = config.tokens[this.props.network][sellTokenAddress];
      const buyToken = config.tokens[this.props.network][buyTokenAddress];

      const trade = {
        type: 'Trade',
        buyAmount,
        buyToken,
        sellAmount,
        sellToken: sellToken,
        fee: '',
        feeToken: '',
        exchange: 'Oasisdex.com',
        group: '',
        address,
        timestamp: log.timestamp,
      };

      //add trade to CSV
      Promise.resolve(this.addTradeToCSV(trade)).then(() => resolve(true));
    });
  }

  addTradeToCSV = trade => {
    return new Promise((resolve, reject) => {
      //add a line break after each row
      this.setState(prevState => {
        const csvData = [...prevState.csvData];
        csvData.push(trade);
        return {csvData};
      }, () => resolve(true));
    });
  }

  downloadCSV = () => {
    const fileName = 'TaxReport';
    let csvData = [...this.state.csvData];
    csvData = csvData.sort((a, b) => a.timestamp > b.timestamp);
    csvData.map(trade => {
      trade.date = new Date(trade.timestamp * 1000).toLocaleString().replace(',', '');
      delete trade.timestamp;
      return trade;
    })
    var uri = 'data:text/csv;charset=utf-8,'
              +
              encodeURIComponent(`"Type";"Buy";"Cur.";"Sell";"Cur.";"Fee";"Cur.";"Exchange";"Address";"Date"\r\n${csvData.map(trade => `"${Object.keys(trade).map(key => trade[key]).join('";"')}"\r\n`).join('')}`);
    const link = document.createElement("a");
    link.href = uri;

    link.style = 'visibility:hidden';
    link.download = fileName + ".csv";

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  render() {
    return (
      <section className="frame exporter">
        <div className="heading">
          <h2>Enter Addresses</h2>
        </div>
        <div className="content">
          <div className="panel">
            <ul className="list">
              {
                this.state.accounts.map((account, index) => {
                  return (
                    <li key={index} className="list-item">
                      <span className="address">{ account }</span>
                      <button onClick={() => {
                        this.removeAccount(index);
                      }} className="close"/>
                    </li>
                  )
                })
              }
            </ul>
          </div>
          <div style={{marginBottom:'24px', display: 'inline-flex'}}>
            <input type="text" value={ this.state.newAddress } onChange={ event => this.setState({newAddress:event.target.value}) } placeholder="0x"/>
            <button disabled={ !this.state.newAddress } onClick={ this.addAccount }>ADD</button>
          </div>
          <div className="exchanges">
            <div className="heading">
              <h3>Choose Exchanges</h3>
            </div>
            <div style={{marginBottom:'24px'}}>
              <ul className="list">
                <li className="list-item oasis">
                  <a href="https://oasisdex.com" target="_blank" rel="noopener noreferrer"><OasisExchangeLogo/></a>
                </li>
                <li className="list-item etherDelta disabled">
                  <a href="#" target="_blank" rel="noopener noreferrer"><EtherDeltaExchangeLogo/></a>
                </li>
                <li className="list-item zeroEx disabled">
                  <a href="#" target="_blank" rel="noopener noreferrer"><ZeroExExchangesLogo/></a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <button type="button" value="Create Report" onClick={ this.fetchData } disabled={ !this.state.accounts.length || this.state.isLoading }>
          { this.state.isLoading ? <Spinner /> : 'GENERATE REPORT' }
        </button>
      </section>
    )
  }
}

export default TaxExporter;
