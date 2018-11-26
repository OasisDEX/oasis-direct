const { click, waitForText } = require("puppeteer-better-utils");

const { tid, ACCOUNT_3_PRIV, puppeteerVisitWithWeb3 } = require("../cypress/utils/");

const IS_DEV = process.env.DEV === "1";
console.assert(process.env.ETH_PROVIDER, "Missing ETH_PROVIDER env");

async function main() {
  const { oasisPage, metamaskController, browser } = await puppeteerVisitWithWeb3();

  await metamaskController.loadPrivateKey(ACCOUNT_3_PRIV);
  await metamaskController.changeNetwork("localhost");

  await click(oasisPage, tid("wallets-continue"));

  await metamaskController.allowToConnect();

  await waitForText(oasisPage, tid("set-trade-from", tid("token-amount-value")), /8,999.... ETH/);
  await waitForText(oasisPage, tid("set-trade-to", tid("token-amount-value")), /170 DAI/);

  console.log("Done!");

  // don't close window to early in dev mode
  if (!IS_DEV) {
    await oasisPage.close();
    await browser.close();
  }
}

main().catch(e => {
  console.error(e);
  // don't close window to early in dev mode
  if (!IS_DEV) {
    process.exit(1);
  }
});
