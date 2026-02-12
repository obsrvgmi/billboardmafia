import { ethers } from "ethers";

/**
 * Get a server-side wallet for signing transactions.
 * This wallet must be the owner of the Billboard contract.
 */
export function getServerWallet() {
  if (!process.env.SERVER_WALLET_PRIVATE_KEY) {
    throw new Error("SERVER_WALLET_PRIVATE_KEY not configured");
  }
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  return new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);
}
