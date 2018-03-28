
# Oasis Direct  
Oasis.Direct is a convenient and user friendly fully-decentralized way to change tokens, especially DAI/ETH and DAI/ERC-20 token pairs.   
  
You don’t need to think about wrapping/unwrapping ETH (and other non ERC-20 compliant tokens), you don’t need to worry about the current liquidity on the exchange and you are always guaranteed the best price you can get from Oasis.DEX exchange.

## Sections in Oasis Direct Web App

 1. **Exchange** 
    *  Exchange tokens in matters of seconds. Just provide the amount you want to sell or the amount of the token you want to get. The application will automatically check the liquidity pool for orders that will fulfill yours. You  receive information how much is the rate and the gas cost for the transaction in `ETH`.
    * In order to select token, just click on the square box where the token icon is and a list with the supported tokens will appear. If you select token that is part of the trade pair, tokens will just swap.
    * Another way to swap tokens is to click the arrows icon.
    * To proceed with transaction, please read the _**Terms of Service**_ and accept them by marking the check box.
    * If given account doesn't have insufficient funds to trade an error message will be displayed.
    * If given order can't be fulfilled because there aren't enough corresponding orders, there will be notification.
    * Trading _ETH for ERC20 Token_ wil require only a single transaction. You can follow the status of the transaction on _Etherscan_ by clicking the transaction box.
    * Trading _ERC20 Token for ETH_  or _ERC20 Token for ERC20 Token_ will require 2 transaction initially. Once you go through those 2 transaction every other time you will only a single transaction. See **FAQ section** for more details.
   
 2. **Export Trades**
	* Exports trade history for the given addresses in the form of a `csv` file.
	* As many address as one want can be added. 
	* Only OasisDEX is supported right now but in the future we plan to support many more exchanges


## FAQ

1. **Are you going to support more trading pairs in the future ?**

* Yes, we will support more trading pairs in the future. We aim for Oasis.Direct to be the most convenient and user friendly fully-decentralized way to change tokens, especially DAI/ETH and DAI/ERC-20 token pairs. You don’t need to think about wrapping/unwrapping ETH (and other non ERC-20 compliant tokens), you don’t need to worry about the current liquidity on the exchange and you are always guaranteed the best price you can get from Oasis.DEX exchange. Simply specify the amount that you want to trade and confirm the transaction.


2. **Why sometimes I need to confirm two transactions, and sometimes only one ?**
* Each trading pair requires a one-time transaction per Ether address to be enabled for trading. Once that is done, all subsequent trades will require confirming just one Ethereum transaction.
You don’t need to think about it, it is all handled by us, however you do need to confirm two Ethereum transactions if it is the first time you are trading a particular pair from the new Ethereum address.
What does “Order estimation may vary 1%” mean exactly ? 
The threshold value is used to create a Limit Order for your transaction. If this Limit Order cannot be immediately filled on Oasis.DEX, the transaction will fail. As we can never guarantee the price (Order Book changes dynamically and we can never be 100% sure what orders we will be filling as they may change between showing you the estimated price and submitting the transaction) we feel that Limit Order is safer than Market Order that can result in unexpected too low (or too high) price.
 
 
3. **What happens if the order details exceed 1% ? Will I still pay gas price for the transaction ?** 
* Yes, you will still pay the gas price, however the probability that your transaction will fail is relatively low
 
4. **Why is the “order estimation vary indicator” (threshold) different for some pairs ?** 
 * We have set up the threshold by analyzing historically the spread on the Oasis.Dex for given pairs. We are constantly monitoring this spread on the exchange and we might adjust the threshold accordingly if we feel that the average liquidity on the exchange has changed. In the future you will be able to set the threshold manually according to your personal preference.

  
5. **Can you list order estimation variations (thresholds) for all assets/tokens ?**
* Right now we have a fixed threshold of 1% for ETH/MKR and DAI/MKR pairs and 2% for DAI/ETH pair.


6. **What is the maximum value I can trade through Oasis.Direct ?** 
* There is no maximum value limit, however with big sell/buy orders it is more likely that you may exceed the threshold limit for your order and the transaction will fail


7. **I want to submit a big Sell/Buy Order, can I see how likely my order will fail due to exceeding threshold limit ?**
  * This functionality will be included in the future release of Oasis.Direct

8. **Why there is a minimum trading limit ?**
* As the gas cost for a transaction does not depend on the amount you want to trade, the bigger amount, the less (percentage-wise) you pay for gas. We have introduced minimum trading to make sure that the total transaction cost is minimal with respect to the traded amount. Also we forbid trading very low amounts (so called dust transactions) to make sure there are no rounding errors in Smart Contracts responsible for filling the trades. Currently the minimum values are:

   * 30 DAI
    
  * 0.03 ETH
    
  * 0.03 MKR  
       

9. **You said the exchange is fee-less. Do I still need to cover gas cost ?**
 * Yes, even though we don’t take any fees from you you still need to cover gas cost of the transaction. We estimate the gas price according to the current transaction details. If you are unsure what is the gas cost and why it is needed for Ethereum transactions, check this excellent [guide](https://myetherwallet.github.io/knowledge-base/gas/what-is-gas-ethereum.html).

  
10. **Why the transaction confirmation takes so long ? What can I do to speed it up ?**
* Oasis.Direct is powered by fully decentralized, on-chain Smart Contracts. The transaction confirmation time depends on the current state of the Ethereum blockchain. You can increase the speed of confirmation by increasing the gas price for your transaction - please refer to the [guide](https://myetherwallet.github.io/knowledge-base/gas/what-is-gas-ethereum.html) that explains all the mechanics of the gas price and its effect on the speed of transactions.
  
