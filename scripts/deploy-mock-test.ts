import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy MockUSDC
  console.log("\n1. Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();
  const mockUsdcAddress = await mockUsdc.getAddress();
  console.log("   MockUSDC:", mockUsdcAddress);

  // Check balance
  const balance = await mockUsdc.balanceOf(deployer.address);
  console.log("   Deployer balance:", ethers.formatUnits(balance, 6), "USDC");

  // Deploy BillboardTest with MockUSDC
  console.log("\n2. Deploying BillboardTest...");
  const BillboardTest = await ethers.getContractFactory("BillboardTest");
  const billboard = await BillboardTest.deploy(mockUsdcAddress);
  await billboard.waitForDeployment();
  const billboardAddress = await billboard.getAddress();
  console.log("   BillboardTest:", billboardAddress);

  // Approve Billboard to spend USDC
  console.log("\n3. Approving Billboard to spend USDC...");
  const approveTx = await mockUsdc.approve(billboardAddress, ethers.MaxUint256);
  await approveTx.wait();
  console.log("   Approved!");

  console.log("\n=== READY FOR TESTING ===");
  console.log("MockUSDC:", mockUsdcAddress);
  console.log("BillboardTest:", billboardAddress);
  console.log("\nUpdate .env.local with:");
  console.log(`NEXT_PUBLIC_BILLBOARD_ADDRESS=${billboardAddress}`);
  console.log(`# MockUSDC for testing: ${mockUsdcAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
