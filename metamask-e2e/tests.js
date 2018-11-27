import { click, waitForText, delay, type } from "puppeteer-better-utils";
import { expect } from "chai";

import { tid, ACCOUNT_3_PRIV } from "../cypress/utils/";
import { puppeteerVisitWithWeb3 } from "./utils";

const IS_DEV = process.env.DEV === "1";
console.assert(process.env.ETH_PROVIDER, "Missing ETH_PROVIDER env");

const TX_MINING_DELAY = 60 * 1000;

describe("Oasis Direct with metamask", () => {
  let oasisPage;
  let metamaskController;
  let browser;

  beforeEach(async () => {
    ({ page: oasisPage, metamaskController, browser } = await puppeteerVisitWithWeb3());
  });

  afterEach(async () => {
    // block the execution in dev mode. Usably only with .only
    if (!IS_DEV) {
      await oasisPage.close();
      await browser.close();
    }
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

  it("should work after rejecting connection", async () => {
    await metamaskController.changeNetwork("localhost");

    await click(oasisPage, tid("wallets-continue"));

    await metamaskController.disallowToConnect();
    await oasisPage.bringToFront();

    // there should not be a next request to connect to page
    expect((await browser.pages()).length).to.be.eq(2); // 1 is blank page, 2 is oasis page
  });

  it("should accept tx", async () => {
    await metamaskController.loadPrivateKey(ACCOUNT_3_PRIV);

    await click(oasisPage, tid("wallets-continue"));

    await metamaskController.allowToConnect();
    await oasisPage.bringToFront();

    await type(oasisPage, tid("set-trade-from-amount", "> input"), "1");
    await click(oasisPage, tid("terms-and-conditions"));
    await click(oasisPage, tid("initiate-trade"));

    await metamaskController.acceptTx();

    await waitForText(oasisPage, tid("proxy-creation-summary"), /You have successfully created a Proxy/, {
      timeout: TX_MINING_DELAY,
    });
    await waitForText(oasisPage, tid("bought-token", tid("token-amount-value")), /280 DAI/);
  });

  it("should reject tx", async () => {
    await metamaskController.loadPrivateKey(ACCOUNT_3_PRIV);

    await click(oasisPage, tid("wallets-continue"));

    await metamaskController.allowToConnect();
    await oasisPage.bringToFront();

    await type(oasisPage, tid("set-trade-from-amount", "> input"), "1");
    await click(oasisPage, tid("terms-and-conditions"));
    await click(oasisPage, tid("initiate-trade"));

    await metamaskController.rejectTx();

    await waitForText(oasisPage, tid("create-proxy", ".status"), /Rejected/);
  });
});
