import { click, waitForText, delay } from "puppeteer-better-utils";

import { tid, ACCOUNT_3_PRIV } from "../cypress/utils/";
import { puppeteerVisitWithWeb3 } from "./utils";

const IS_DEV = process.env.DEV === "1";
console.assert(process.env.ETH_PROVIDER, "Missing ETH_PROVIDER env");

async function main() {}

main().catch(e => {
  console.error(e);
  // don't close window to early in dev mode
  if (!IS_DEV) {
    process.exit(1);
  }
});

describe("Oasis Direct with metamask", () => {
  let oasisPage;
  let metamaskController;
  let browser;

  beforeEach(async () => {
    const setupRes = await puppeteerVisitWithWeb3();
    oasisPage = setupRes.page;
    metamaskController = setupRes.metamaskController;
    browser = setupRes.browser;
  });

  afterEach(async () => {
    // block the execution in dev mode. Usably only with .only
    if (IS_DEV) {
      await delay(1000000);
    }
    await oasisPage.close();
    await browser.close();
  });

  it("should work after accepting connection", async () => {
    await metamaskController.loadPrivateKey(ACCOUNT_3_PRIV);
    await metamaskController.changeNetwork("localhost");

    await click(oasisPage, tid("wallets-continue"));

    await metamaskController.allowToConnect();
    await oasisPage.bringToFront();

    await waitForText(oasisPage, tid("set-trade-from", tid("token-amount-value")), /8,999.... ETH/);
    await waitForText(oasisPage, tid("set-trade-to", tid("token-amount-value")), /170 DAI/);
  });
});
