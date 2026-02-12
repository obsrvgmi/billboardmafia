import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

  const MINT_ABI = [
    "function mint(address to, uint256 amount) external",
  ];

  const usdc = new ethers.Contract(USDC, MINT_ABI, signer);

  console.log("Trying to mint 1000 test USDC...");
  console.log("Signer:", signer.address);

  try {
    const tx = await usdc["mint(address,uint256)"](signer.address, ethers.parseUnits("1000", 6));
    await tx.wait();
    console.log("Minted 1000 USDC!");
  } catch (e: any) {
    console.log("Failed:", e.reason || e.message?.slice(0, 200));
  }
}

main().catch(console.error);
