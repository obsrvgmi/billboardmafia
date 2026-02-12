import { ethers } from "hardhat";

async function main() {
  const USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

  console.log("Deploying BillboardTest (5-min rounds for testing)...");

  const BillboardTest = await ethers.getContractFactory("BillboardTest");
  const billboard = await BillboardTest.deploy(USDC);
  await billboard.waitForDeployment();

  const address = await billboard.getAddress();
  console.log("BillboardTest deployed to:", address);
  console.log("");
  console.log("Test timing:");
  console.log("  Round duration: 5 minutes");
  console.log("  Bidding window: last 2 minutes of each round");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
