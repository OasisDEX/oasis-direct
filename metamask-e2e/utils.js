import Puppeteer from "puppeteer";
import { launchPuppeteerWithMetamask, setupMetamask } from "metamask-puppeteer";
import Web3 from "web3";
import PrivateKeyProvider from "truffle-privatekey-provider";
import { ACCOUNT_3_PRIV, restoreBlockchain, saveBlockchain } from "../cypress/utils/";

let lastSnapshotId = 1;

export async function puppeteerVisitWithWeb3(path = "http://localhost:3000") {
  const provider = new PrivateKeyProvider(ACCOUNT_3_PRIV.replace("0x", ""), process.env.ETH_PROVIDER);
  const web3 = new Web3(provider);

  console.log(`Reverting blockchain to snapshot #${lastSnapshotId}`);
  await restoreBlockchain(web3)(lastSnapshotId);
  console.log(`Saving new snapshot`);
  const rawSnapshotId = await saveBlockchain(web3)();
  lastSnapshotId = parseInt(rawSnapshotId.result, 16);

  console.log("Starting browser...");
  const browser = await launchPuppeteerWithMetamask(Puppeteer, {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  console.log("Browser started");
  const metamaskController = await setupMetamask(browser);
  await metamaskController.changeNetwork("localhost");

  const page = await browser.newPage();
  await page.goto(path);

  return { page, browser, metamaskController };
}
