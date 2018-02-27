import React, { Component } from 'react';
import web3 from '../web3';
import config from "../exporter-config.json";
import ReactDOM from 'react-dom';

import matchingmarket from '../abi/matchingmarket.json';

class TaxExporter extends Component {
  constructor(props) {
    super();
    this.props = props;
    this.state = {
      isLoading: false,
      accounts: [this.props.account],
      csvData: []
    }
  }

  removeAccount = accRemov => {
    let accounts = {...this.state.accounts};
    Object.keys(accounts).forEach(key => {
      if (accounts[key] === accRemov) {
        delete accounts[key];
      }
    });

    this.setState({accounts});
  }

  addAccount = event => {
    event.preventDefault();

    // Find the text field via the React ref
    const accountAddress = ReactDOM.findDOMNode(this.textInput).value.trim();
    ReactDOM.findDOMNode(this.textInput).value = '';
    const keys = Object.keys(this.state.accounts);

    if (accountAddress.length > 0 && web3.isAddress(accountAddress)) {
      const accounts = keys.length > 0 ? {...this.state.accounts} : [];
      const matchedAccounts = keys.filter(key => accounts[key] === accountAddress);

      if (matchedAccounts.length === 0) {
        accounts[keys.length] = accountAddress;

        this.setState({accounts});
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

  fetchData = e => {
    e.preventDefault();
    // this.setLoading(true);
    let accounts = {...this.state.accounts};
    let oasisPromises = [];
    this.setState({csvData:[]}, () => {
      Object.keys(accounts).forEach(key => {
        config.oasis.contract[this.props.network].forEach(contract => {
          oasisPromises.push(this.fetchOasisMakeTrades(contract, accounts[key]));
          oasisPromises.push(this.fetchOasisTakeTrades(contract, accounts[key]));
        });
        // oasisPromises.push(this.fetchLegacyTrades(accounts[key]));
      });

      Promise.all(oasisPromises).then(() => {
        console.log('download CSV')
        this.downloadCSV();
        // this.setLoading(false);
      });
    });
  }

  fetchLegacyTrades = address => {
    return new Promise((resolve, reject) => {
      // for (let j = 2; j < 15; j++) {
      //   HTTP.get(Meteor.absoluteUrl("/maker-otc-" + j + ".trades.json"), (err, result) => {
      //     let data = result.data;
      //     for (let i = 0; i < data.length; i++) {
      //       const taker = EthUtils.addHexPrefix(data[i].taker);
      //       const maker = EthUtils.addHexPrefix(data[i].maker);
      //       if (taker === address.name || maker === address.name) {
      //           this.addOasisLegacyTradeFor(address, data[i])
      //       }
      //     }
      //   });
      // }
      resolve();
    });
  }

  addOasisTradeFor = (address, side, log) => {
    return new Promise((resolve, reject) => {
      const sellAmount = web3.fromWei(side === 'maker' ? log.take_amt : log.give_amt).toString(10);
      const buyAmount = web3.fromWei(side === 'maker' ? log.give_amt : log.take_amt).toString(10);
      let sellTokenAddress = side === 'maker' ? log.pay_gem : log.buy_gem;
      let buyTokenAddress = side === 'maker' ? log.buy_gem : log.pay_gem;
      let sellToken = config.tokens[this.props.network][sellTokenAddress];
      let buyToken = config.tokens[this.props.network][buyTokenAddress];

      let timestamp = new Date(log.timestamp * 1000).toLocaleString();

      let trade = {
        'Type': 'Trade',
        'Buy': buyAmount,
        'Buy_Cur': buyToken,
        'Sell': sellAmount,
        'Sell_Cur': sellToken,
        'Fee': '',
        'Fee_Cur': '',
        'Exchange': 'Oasisdex.com',
        'Group': '',
        'Comment': address,
        'Date': timestamp,
      };

      //add trade to CSV
      Promise.resolve(this.addTradeToCSV(trade)).then(() => resolve(true));
      // account.trades.push(trade);
    });
  }

  // addOasisLegacyTradeFor = (address, log) => {
  //   let giveAmount = web3.fromWei(web3.toBigNumber(log.giveAmount, 16).toString(10));
  //   let takeAmount = web3.fromWei(web3.toBigNumber(log.takeAmount, 16).toString(10));
  //   // let haveTokenAddress = EthUtils.addHexPrefix(log.haveToken);
  //   // let wantTokenAddress = EthUtils.addHexPrefix(log.wantToken);
  //   let haveTokenAddress = `0x${log.haveToken}`;
  //   let wantTokenAddress = `0x${log.wantToken}`;
  //   let wantToken = config.tokens[this.props.network][haveTokenAddress];
  //   let haveToken = config.tokens[this.props.network][wantTokenAddress];
  //   let timestamp = new Date(log.timestamp * 1000).toLocaleString();

  //   let trade = {
  //     'Type': 'Trade',
  //     'Buy': takeAmount,
  //     'Buy_Cur': wantToken,
  //     'Sell': giveAmount,
  //     'Sell_Cur': haveToken,
  //     'Fee': '',
  //     'Fee_Cur': '',
  //     'Exchange': 'Oasisdex.com',
  //     'Group': '',
  //     'Comment': address,
  //     'Date': timestamp,
  //   };

  //   //add trade to CSV
  //   this.addTradeToCSV(trade);

  //   account.trades.push(trade);
  // }

  addTradeToCSV = trade => {
    return new Promise((resolve, reject) => {
      const tradeData = typeof trade !== 'object' ? JSON.parse(trade) : trade;
      let row = '';
      for (let i in tradeData) {
        row += '"' + tradeData[i] + '",';
      }
      row += row.slice(0, row.length - 1) + '\r\n';

      //add a line break after each row
      this.setState(prevState => {
        const csvData = {...prevState.csvData};
        csvData[Object.keys(csvData).length] = row;
        return {csvData};
      }, () => resolve(true));
    });
  }

  downloadCSV = () => {
    const fileName = 'TaxReport';
    const csvData = {...this.state.csvData};
    var uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(`Type,Buy,Cur.,Sell,Cur.,Fee,Cur.,Exchange,Comment,Date\r\n${Object.keys(csvData).map(key => csvData[key]).join('')}`);
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
      <div>
        <div className="panel panel-default">
          <div className="panel-heading">
            Source
          </div>
          <ul className="list-group">
            {
              Object.keys(this.state.accounts).map(key => 
                <li className="list-group-item" key={ key }>
                  <div className="row">
                    <div className="col-xs-12 col-md-10 npl">
                      <div className="col-xs-11 col-md-10">
                        <span
                          className="account-item-name"
                          ref={accountAddress => this.accountAddress = accountAddress}
                        >{this.state.accounts[key]}
                        </span>
                      </div>
                      <div className="col-xs-1 col-md-1">
                        <button className="delete" onClick={() => this.removeAccount(this.state.accounts[key])}>&times;</button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            }
          </ul>
          <div className="panel-body">
            <div className="row">
              <form onSubmit={this.addAccount} >
                <div className="input-group input-group-lg">
                  <input
                    type="text"
                    className="form-control input-add"
                    ref={(textInput) => { this.textInput = textInput }}
                    placeholder="Enter address"
                  >
                  </input>
                  <span className="input-group-btn">
                    <button
                      className="btn btn-default add"
                      type="submit"
                    >Add</button>
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
        {
          Object.keys(this.state.accounts).length > 0 &&
          <a href="#generate" onClick={this.fetchData}>Generate</a>
        }
      </div>
    )
  }
}

export default TaxExporter;
