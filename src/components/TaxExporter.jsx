import React, { Component } from 'react';
import web3 from '../web3';
import config from "../exporter-config.json";
import ReactDOM from 'react-dom';

import matchingmarket from '../abi/matchingmarket.json';

class TaxExporter extends Component {
  constructor(props) {
    super();
    this.props = props;
    this.csv = 'Type,Buy,Cur.,Sell,Cur.,Fee,Cur.,Exchange,Comment,Date\r\n';
    this.state = {
      isLoading: false,
      accounts: [
        {
          address: this.props.account,
          trades: []
        }
      ]
    }
  }

  removeAccount = accRemov => {
    let accounts = {...this.state.accounts};
    Object.keys(accounts).forEach(key => {
      if (accounts[key].address === accRemov.address) {
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
      const matchedAccounts = keys.filter(key => accounts[key].address === accountAddress);

      if (matchedAccounts.length === 0) {
        const account = {
          address: accountAddress,
          trades: [],
        };
        accounts[keys.length] = account;

        this.setState({accounts});
      } else {
        alert("This address is already in the list");
      }
    } else {
      alert("This is not a valid address");
    }
  }

  fetchOasisMakeTrades = (contract, account) => {
    return new Promise((resolve, reject) => {
      web3.eth.contract(matchingmarket.abi).at(contract.address).LogTake({maker: account.address}, {
        fromBlock: contract.block_start,
        toBlock: contract.block_end
      }).get((error, makeLogs) => {
        // console.log(address, makeLogs);
        if (!error) {
          for (let i = 0; i < makeLogs.length; i++) {
            this.addOasisTradeFor(account, makeLogs[i].args);
          }
          resolve();
        } else {
          console.debug('Cannot fetch issued trades');
          reject();
        }
      });
    });
  }

  fetchOasisTakeTrades = (contract, account) => {
    return new Promise((resolve, reject) => {
      web3.eth.contract(matchingmarket.abi).at(contract.address).LogTake({taker: account.address}, {
        fromBlock: contract.block_start,
        toBlock: contract.block_end
      }).get((error, takeLogs) => {
        // console.log(address, takeLogs);
        if (!error) {
          for (let i = 0; i < takeLogs.length; i++) {
            this.addOasisTradeFor(account, takeLogs[i].args);
          }
          resolve();
        } else {
          console.debug('Cannot fetch issued trades');
          reject();
        }
      });
    });
  }

  fetchData = (e) => {
    e.preventDefault();
    // this.setLoading(true);
    let accounts = {...this.state.accounts};
    let oasisPromises = [];
    Object.keys(accounts).forEach(key => {
      config.oasis.contract[this.props.network].forEach(contract => {
        oasisPromises.push(this.fetchOasisMakeTrades(contract, accounts[key]));
        oasisPromises.push(this.fetchOasisTakeTrades(contract, accounts[key]));
      });
      oasisPromises.push(this.fetchLegacyTrades(accounts[key]));
    });

    Promise.all(oasisPromises).then(() => {
      this.downloadCSV();
      // this.setLoading(false);
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

  addOasisTradeFor = (account, log) => {
    const sellAmount = web3.fromWei(log.maker === account.address ? log.take_amt : log.give_amt).toString(10);
    const buyAmount = web3.fromWei(log.maker === account.address ? log.give_amt : log.take_amt).toString(10);
    let sellTokenAddress = log.maker === account.address ? log.pay_gem : log.buy_gem;
    let buyTokenAddress = log.maker === account.address ? log.buy_gem : log.pay_gem;
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
      'Comment': account.address,
      'Date': timestamp,
    };

    //add trade to CSV
    this.addTradeToCSV(trade);

    account.trades.push(trade);
  }

  addOasisLegacyTradeFor = (account, log) => {
    let giveAmount = web3.fromWei(web3.toBigNumber(log.giveAmount, 16).toString(10));
    let takeAmount = web3.fromWei(web3.toBigNumber(log.takeAmount, 16).toString(10));
    // let haveTokenAddress = EthUtils.addHexPrefix(log.haveToken);
    // let wantTokenAddress = EthUtils.addHexPrefix(log.wantToken);
    let haveTokenAddress = `0x${log.haveToken}`;
    let wantTokenAddress = `0x${log.wantToken}`;
    let wantToken = config.tokens[this.props.network][haveTokenAddress];
    let haveToken = config.tokens[this.props.network][wantTokenAddress];
    let timestamp = new Date(log.timestamp * 1000).toLocaleString();

    let trade = {
      'Type': 'Trade',
      'Buy': takeAmount,
      'Buy_Cur': wantToken,
      'Sell': giveAmount,
      'Sell_Cur': haveToken,
      'Fee': '',
      'Fee_Cur': '',
      'Exchange': 'Oasisdex.com',
      'Group': '',
      'Comment': account.address,
      'Date': timestamp,
    };

    //add trade to CSV
    this.addTradeToCSV(trade);

    account.trades.push(trade);
  }

  addTradeToCSV = (trade) => {
    let row = '';
    const tradeData = typeof trade !== 'object' ? JSON.parse(trade) : trade;

    for (let i in tradeData) {
      row += '"' + tradeData[i] + '",';
    }
    row = row.slice(0, row.length - 1);

    //add a line break after each row
    this.csv += row + '\r\n';
  }

  downloadCSV = () => {
    const fileName = 'TaxReport';

    var uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(this.csv);
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
                        >{this.state.accounts[key].address}
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
          this.state.accounts.length > 0 &&
          <a href="#generate" onClick={this.fetchData}>Generate</a>
        }
      </div>
    )
  }
}

export default TaxExporter;
