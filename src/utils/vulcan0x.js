import config from '../exporter-config';

export const vulcan0x = async (accounts, type) => {

  const res = await fetch(config.volcan0x.url,
    {
      headers: {"Content-Type": "application/json; charset=utf-8"},
      method: 'POST',
      body: JSON.stringify({
        query: `query tradesForAddresses($filter: OasisTradeFilter) {
                  allOasisTrades(filter: $filter) {
                    nodes {
                      offerId
                      act
                      maker
                      taker
                      bidAmt
                      bidTkn
                      bidGem
                      lotAmt
                      lotTkn
                      lotGem
                      price
                      time
                      tx
                    }
                  }
                }`,
        variables: {
          "devMode": "2232759874",
          "filter": {
            [type]: {
              "in": accounts
            },
            // "time": {
            //   "lessThan": "2018-08-05T19:15:19.062Z",
            //   "greaterThan": "2018-06-05T19:15:19.062Z"
            // },
          }
        }
      })
    }
  );

  return res.json();
};
