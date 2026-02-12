import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Deploying Billboard Mafia (Timed Auction)");
  console.log("=".repeat(60));
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");
  console.log("");

  // USDC address on Monad Testnet
  const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

  // ============ Deploy Billboard ============
  console.log("Deploying Billboard (timed auction)...");

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
  console.log("Contract Address:");
  console.log("  Billboard:", billboardAddress);
  console.log("  USDC:", USDC_ADDRESS);
  console.log("");
  console.log("Billboard Slots:");
  console.log("  Slot 0 (MAIN): Min bid $10 USDC");
  console.log("  Slot 1 (SECONDARY): Min bid $1 USDC");
  console.log("");
  console.log("Auction Rules:");
  console.log("  - 12-hour rounds (00:00-12:00, 12:00-00:00 UTC)");
  console.log("  - Bidding window: 30 min before each round");
  console.log("  - Highest bid wins, losers refunded");
  console.log("  - $BB token on nads.fun for buybacks");

  // Save deployment info
  const network = await ethers.provider.getNetwork();

  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      billboard: {
        address: billboardAddress,
        slots: {
          main: { id: 0, minBid: "$10" },
          secondary: { id: 1, minBid: "$1" },
        },
        rules: {
          roundDuration: "12 hours",
          biddingWindow: "30 minutes",
          refundLosers: true,
        },
      },
      usdc: {
        address: USDC_ADDRESS,
      },
      bbToken: {
        note: "Deploy on nads.fun",
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
