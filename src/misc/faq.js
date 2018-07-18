import React from "react";

const FAQ = [
  {
    question: "What is Oasis.Direct ?",
    answer: "Oasis.Direct is the most convenient, fully-decentralized way to change tokens. You don’t need to think about wrapping/unwrapping Ether or any other Ethereum token, you don’t need to worry about the current liquidity and you are always guaranteed the best available price on Oasis.DEX. Simply specify the amount that you want to trade and confirm the transaction."
  },
  {
    question: "How do you determine the trade price?",
    answer: "The trade price based on the order volume and current order book depth at OasisDex. For example, assume there are three standing orders on the ETH/DAI order book, each with sell offers of 10 ETH for 5000, 5100 and 5200 DAI respectively. If a user wanted to buy 5 ETH, the estimated trade price will be 500 ETH/DAI (half of the first sell order will be filled). However if the user wanted to buy 20 ETH, the estimated trade price will be 505 ETH/DAI (two sell orders will be filled so ultimately 20 ETH will be bought for 1010 DAI)." 
  },
  {
    question: "What is Price Impact?",
    answer: "Price impact is an indicator how the estimated trade price differs from the current best order on the order book. If user’s order can be entirely filled by the best order, price impact will be 0%."
  },
  {
    question: "What is Slippage Limit?",
    answer: "The slippage limit value is used to create a Limit Order for your transaction. It ensures that the actual trade price does not differ substantially from the estimated trade price that was accepted by the user. If the order book changed significantly between estimating the price and the trade execution the order will not be filled. With Slippage Limit 2% OasisDirect will execute fill-or-kill Limit Order with the price limit set 2% above the accepted estimated trade price."
  },
  {
    question: "What happens if the order fails? Will I still have to pay gas?",
    answer: "Yes, you will still pay for gas. Bear in mind that the likelihood that your order can’t be filled is quite low, and will only occur if the price has moved in excess of the slippage limit in the time between you receiving the quote and your transaction getting mined."
  },
  {
    question: "Why is the Slippage Limit different for some pairs ?",
    answer: "The slippage limits were decided by analyzing the volatility and book depth historically on the Oasis.Dex for the given pairs. The limit might be adjusted accordingly if the market on Oasis.DEX changes. In the future, you will be able to set the slippage limit manually according to your personal preference."
  },
  {
    question: "Can you list the Slippage Limit for all assets/tokens ?",
    answer: "Right now the slippage limit is 1% for MKR/ETH and MKR/DAI pairs, and 2% for ETH/DAI pair."
  },
  {
    question: "Are you going to support more trading pairs in the future ?",
    answer: "Yes, more trading pairs will be supported in the future. In the beginning the following pairs are available: DAI/ETH, MKR/DAI and ETH/MKR."
  },
  {
    question: "Why do I sometimes need to confirm three transactions, sometimes two transactions, and sometimes only one? ",
    answer: "The transaction process is simplified by bundling multiple transactions into a single call through the use of a special smart contract called Proxy Contract. This makes it much easier to do multi-step trading operations on OasisDirect. If user does not have a Proxy, an additional transaction is required to create one. Additionally the Proxy has to be given an approval for trading a specific ERC-20 token. If a user already has a Proxy with appropriate approvals, only one transaction per trade will be needed."
  },
  {
    question: "What is the maximum value I can trade through Oasis.Direct ?",
    answer: "There is no maximum size limit. However, larger orders impact the market more, and so may be quoted poorer prices. They are also more likely to fail by exceeding the slippage limit"
  },
  {
    question: "I want to submit a big Sell/Buy Order. Can I see how likely my order will fail due to exceeding threshold limit ?",
    answer: "This functionality will be included in the future release of Oasis.Direct"
  },
  {
    question: "Why there is a minimum trading limit ?",
    answer: <pre>
      As the gas cost for a transaction is fixed and doesn’t depend on the amount you want to trade, the bigger amount, the less (percentage-wise) you pay for gas. Minimum trade sizes were introduced to make sure that the total transaction cost is minimal with respect to the traded amount. Currently the minimum trade sizes are:
      <br/>
      <br/>

      <ul>
         <li>30 DAI</li>
         <li>0.03 ETH</li>
         <li>0.03 MKR Note that both buy and sell amounts of a transaction need to be above the minimum trade size.</li>
      </ul>
    </pre>
  },
  {
    question: "You said Oasis.Direct is fee-less. Do I still need to cover gas cost ?",
    answer: "Yes, even though there are no fees, you still need to cover the gas cost of the transaction. The gas price is estimated according to the current transaction details. To learn more about gas and why it is needed for Ethereum transactions, check this excellent guide."
  },
  {
    question: "Why does the transaction confirmation takes so long? What can I do to speed it up ?",
    answer: "Oasis.Direct is powered by fully decentralized, on-chain Smart Contracts. The transaction confirmation time depends on the current state of the Ethereum blockchain. You can increase the speed of confirmation by increasing the gas price for your transaction - please refer to this guide that explains all the mechanics of the gas price and its effect on the speed of transactions."
  },
];

export default FAQ;
