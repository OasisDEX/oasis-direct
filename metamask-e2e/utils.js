import Puppeteer from "puppeteer";
import { launchPuppeteerWithMetamask, setupMetamask } from "metamask-puppeteer";
import { ACCOUNT_3_PRIV, restoreBlockchain, saveBlockchain, createWeb3Provider } from "../cypress/utils/";

let lastSnapshotId = 1;

export async function puppeteerVisitWithWeb3(path = "http://localhost:3000") {
  const web3 = await createWeb3Provider(ACCOUNT_3_PRIV, process.env.ETH_PROVIDER);

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
