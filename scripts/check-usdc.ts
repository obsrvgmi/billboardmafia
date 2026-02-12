import { ethers } from "hardhat";

async function main() {
  const USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
  const WALLET = "0xCD4F5444dAba8b3f26681cF559BBe1E024Ab553B";
  const BILLBOARD_TEST = "0xf3EC66FfBeb9A93F7aFfCC446e9d42FF7a3B412d";

  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
  ];

  const usdc = new ethers.Contract(USDC, ERC20_ABI, ethers.provider);
  const balance = await usdc.balanceOf(WALLET);
  const allowance = await usdc.allowance(WALLET, BILLBOARD_TEST);

  console.log("Server Wallet:", WALLET);
  console.log("USDC Balance:", ethers.formatUnits(balance, 6), "USDC");
  console.log("Allowance to Billboard:", ethers.formatUnits(allowance, 6), "USDC");
}

main().catch(console.error);
