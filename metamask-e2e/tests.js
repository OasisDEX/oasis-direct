const Puppeteer = require("puppeteer");
const { launchPuppeteerWithMetamask, setupMetamask } = require("metamask-puppeteer");
const { click } = require("puppeteer-utils");

const { tid } = require("../cypress/utils/");

const IS_DEV = process.env.NODE_ENV === "dev";

async function main() {
  // tslint:disable-next-line
  console.log("Starting browser...");
  const browser = await launchPuppeteerWithMetamask(Puppeteer, {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  // tslint:disable-next-line
  console.log("Browser started");
  const metamaskController = await setupMetamask(browser);

  const oasisPage = await browser.newPage();
  await oasisPage.goto("http://localhost:3000");

  await metamaskController.loadPrivateKey("0x1ff8271bf14ac9bef0b641cced40dc2a7ebd2e37d8e16d25b4aa1911364219af");
  await metamaskController.changeNetwork("kovan");

  await click(oasisPage, tid("wallets-continue"));

  await metamaskController.allowToConnect();
  await oasisPage.bringToFront();

  // tslint:disable-next-line
  console.assert((await metamaskController.getStatus()) === "unlocked");

  // tslint:disable-next-line
  console.log("Done!");
  // don't close window to early in dev mode
  if (!IS_DEV) {
    await oasisPage.close();
    await browser.close();
  }
}

main().catch(e => {
  // tslint:disable-next-line
  console.error(e);
  // don't close window to early in dev mode
  if (!IS_DEV) {
    process.exit(1);
  }
});
