import { ethers } from "hardhat";

/**
 * Buyback & Burn Script
 *
 * This script:
 * 1. Withdraws USDC revenue from Billboard contract
 * 2. Swaps USDC for $BB tokens on DEX (nads.fun on mainnet)
 * 3. Burns the $BB tokens
 * 4. Records the burn on Billboard contract
 *
 * Run at random time once per day for unpredictable buybacks
 */

const BILLBOARD_ADDRESS = process.env.BILLBOARD_ADDRESS || "0xD874329ceCB89320a1306d4e0f4d644ab38B757b";
const BB_TOKEN_ADDRESS = process.env.BB_TOKEN_ADDRESS || ""; // Set after deploying on nads.fun
const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

// nads.fun router (mainnet only)
const NADS_ROUTER = process.env.NADS_ROUTER || "";

const BILLBOARD_ABI = [
  "function withdrawRevenue(address to) external",
  "function recordBurn(uint256 amount) external",
  "function getStats() external view returns (uint256 totalRevenue, uint256 totalBurned, uint256 totalRounds)",
];

const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

const BB_TOKEN_ABI = [
  ...ERC20_ABI,
  "function burn(uint256 amount) external",
  "function totalBurned() external view returns (uint256)",
];

// Simple DEX router ABI (adjust for actual nads.fun interface)
const DEX_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)",
];

async function main() {
  const [operator] = await ethers.getSigners();
  console.log("=".repeat(60));
  console.log("Billboard Mafia - Buyback & Burn");
  console.log("=".repeat(60));
  console.log("Operator:", operator.address);
  console.log("Billboard:", BILLBOARD_ADDRESS);
  console.log("");

  const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, operator);
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, operator);

  // Get current stats
  const [totalRevenue, totalBurned, totalRounds] = await billboard.getStats();
  console.log("Current Stats:");
  console.log("  Total Revenue:", ethers.formatUnits(totalRevenue, 6), "USDC");
  console.log("  Total Burned:", ethers.formatUnits(totalBurned, 18), "BB");
  console.log("  Total Rounds:", totalRounds.toString());
  console.log("");

  // Check USDC balance in contract
  const contractUsdcBalance = await usdc.balanceOf(BILLBOARD_ADDRESS);
  console.log("Contract USDC Balance:", ethers.formatUnits(contractUsdcBalance, 6), "USDC");

  if (contractUsdcBalance === 0n) {
    console.log("\nNo revenue to withdraw. Exiting.");
    return;
  }

  // Step 1: Withdraw revenue
  console.log("\n1. Withdrawing revenue to operator...");
  const withdrawTx = await billboard.withdrawRevenue(operator.address);
  await withdrawTx.wait();
  console.log("   Done! TX:", withdrawTx.hash);

  const operatorUsdcBalance = await usdc.balanceOf(operator.address);
  console.log("   Operator USDC Balance:", ethers.formatUnits(operatorUsdcBalance, 6), "USDC");

  // Step 2: Swap USDC for BB tokens
  if (!BB_TOKEN_ADDRESS || !NADS_ROUTER) {
    console.log("\n2. [TESTNET MODE] Skipping swap - BB token not deployed yet");
    console.log("   Set BB_TOKEN_ADDRESS and NADS_ROUTER env vars for mainnet");

    // Simulate burn recording for testing
    const simulatedBurnAmount = operatorUsdcBalance * 1000n; // Pretend 1 USDC = 1000 BB
    console.log("\n3. [TESTNET MODE] Simulating burn record...");
    console.log("   Simulated burn amount:", ethers.formatUnits(simulatedBurnAmount, 18), "BB");

    // Record the simulated burn
    // const recordTx = await billboard.recordBurn(simulatedBurnAmount);
    // await recordTx.wait();
    // console.log("   Done! TX:", recordTx.hash);

    console.log("\n   Note: In production, this would:");
    console.log("   - Swap USDC -> BB on nads.fun");
    console.log("   - Burn the BB tokens");
    console.log("   - Record burn on Billboard contract");
    return;
  }

  console.log("\n2. Swapping USDC for BB tokens...");
  const router = new ethers.Contract(NADS_ROUTER, DEX_ROUTER_ABI, operator);
  const bbToken = new ethers.Contract(BB_TOKEN_ADDRESS, BB_TOKEN_ABI, operator);

  // Approve router to spend USDC
  const approveTx = await usdc.approve(NADS_ROUTER, operatorUsdcBalance);
  await approveTx.wait();
  console.log("   Approved router");

  // Swap USDC -> BB
  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 min deadline
  const path = [USDC_ADDRESS, BB_TOKEN_ADDRESS];

  try {
    const swapTx = await router.swapExactTokensForTokens(
      operatorUsdcBalance,
      0, // Accept any amount (set min in production!)
      path,
      operator.address,
      deadline
    );
    await swapTx.wait();
    console.log("   Swap complete! TX:", swapTx.hash);
  } catch (error) {
    console.log("   Swap failed:", error);
    return;
  }

  // Step 3: Burn BB tokens
  const bbBalance = await bbToken.balanceOf(operator.address);
  console.log("\n3. Burning BB tokens...");
  console.log("   BB Balance:", ethers.formatUnits(bbBalance, 18), "BB");

  const burnTx = await bbToken.burn(bbBalance);
  await burnTx.wait();
  console.log("   Burned! TX:", burnTx.hash);

  // Step 4: Record burn on Billboard
  console.log("\n4. Recording burn on Billboard contract...");
  const recordTx = await billboard.recordBurn(bbBalance);
  await recordTx.wait();
  console.log("   Recorded! TX:", recordTx.hash);

  // Final stats
  const [newTotalRevenue, newTotalBurned, newTotalRounds] = await billboard.getStats();
  console.log("\n" + "=".repeat(60));
  console.log("BUYBACK COMPLETE");
  console.log("=".repeat(60));
  console.log("Total Burned:", ethers.formatUnits(newTotalBurned, 18), "BB");
  console.log("Lifetime Revenue:", ethers.formatUnits(newTotalRevenue, 6), "USDC");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
