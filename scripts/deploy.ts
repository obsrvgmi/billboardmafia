import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Deploying Billboard Mafia");
  console.log("=".repeat(60));
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");
  console.log("");

  // USDC address on Monad Testnet
  const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

  // ============ 1. Deploy MafiaToken ============
  console.log("1. Deploying MafiaToken ($MAFIA)...");
  console.log("   Total Supply: 1,000,000,000 MAFIA");

  const MafiaToken = await ethers.getContractFactory("MafiaToken");
  const mafiaToken = await MafiaToken.deploy();
  await mafiaToken.waitForDeployment();
  const tokenAddress = await mafiaToken.getAddress();
  console.log("   MafiaToken deployed to:", tokenAddress);

  // ============ 2. Deploy Billboard ============
  console.log("\n2. Deploying Billboard...");

  const Billboard = await ethers.getContractFactory("Billboard");
  const billboard = await Billboard.deploy(USDC_ADDRESS);
  await billboard.waitForDeployment();
  const billboardAddress = await billboard.getAddress();
  console.log("   Billboard deployed to:", billboardAddress);

  // ============ Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE - BILLBOARD MAFIA");
  console.log("=".repeat(60));
  console.log("");
  console.log("Contract Addresses:");
  console.log("  MafiaToken:", tokenAddress);
  console.log("  Billboard:", billboardAddress);
  console.log("  USDC:", USDC_ADDRESS);
  console.log("");
  console.log("Billboard Rules:");
  console.log("  - Minimum bid: $1 USDC");
  console.log("  - Outbid requires: 10%+ higher");
  console.log("  - Ad duration: 30 days");
  console.log("  - No refunds when outbid");

  // Save deployment info
  const network = await ethers.provider.getNetwork();

  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      mafiaToken: {
        address: tokenAddress,
        name: "Mafia Token",
        symbol: "MAFIA",
        totalSupply: "1000000000",
      },
      billboard: {
        address: billboardAddress,
        minBid: "1",
        minIncrement: "10%",
        adDuration: "30 days",
      },
      usdc: {
        address: USDC_ADDRESS,
      },
    },
  };

  fs.writeFileSync("./deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
