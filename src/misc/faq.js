import React from 'react';

const FAQ = [
  {
    question: "What is Oasis.Direct?",
    answer: "Oasis.Direct is the most convenient, fully-decentralized way to change tokens. You don’t need to think about wrapping/unwrapping Ether or any other Ethereum token, you don’t need to worry about the current liquidity and you are always guaranteed the best available price on Oasis.DEX. Simply specify the amount that you want to trade and confirm the transaction."
  },
  {
    question: "Are you going to support more trading pairs in the future ?",
    answer: "Yes, more trading pairs will be supported in the future. In the beginning the following pairs are available: DAI/ETH, MKR/DAI and ETH/MKR."
  },
  {
    question: "Why do I sometimes need to confirm two transactions, and sometimes only one ?",
    answer: "Each trading pair requires a one-time transaction per Ether address to be enabled for trading. Once that is done, all subsequent trades will require confirming just one Ethereum transaction. You just need to confirm two Ethereum transactions if it is the first time you are trading a particular pair from the new Ethereum address."
  },
  {
    question: "What does “Order estimation may vary” mean ?",
    answer: "The slippage limit value is used to create a Limit Order for your transaction. If this Limit Order cannot be immediately completely filled on Oasis.DEX, the transaction will fail. It’s impossible to guarantee that your order will succeed, since it is being matched with other orders on Oasis.DEX in real time. The fact that Oasis.Direct uses Limit Orders, rather than Market Orders, ensures that a user won’t experience unexpected slippage."
  },
  {
    question: "What happens if the transaction price exceeds the given threshold ? Will I still pay gas price for the transaction ?",
    answer: "Yes, you will still pay for gas. Bear in mind that the likelihood that your order can’t be filled is quite low, and will only occur if the price has moved in excess of the slippage limit in the time between you receiving the quote and your transaction getting mined."
  },
  {
    question: "Why is the “order estimation vary indicator” (threshold) different for some pairs ?",
    answer: "The slippage limits were decided by analyzing the volatility and book depth historically on the Oasis.Dex for the given pairs. The limit might be adjusted accordingly if the market on Oasis.DEX changes. In the future, you will be able to set the slippage limit manually according to your personal preference."
  },
  {
    question: "Can you list order estimation variations (thresholds) for all assets/tokens ?",
    answer: "Right now there is a fixed threshold of 1% for ETH/MKR and DAI/MKR pairs, and 2% for DAI/ETH pair."
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
