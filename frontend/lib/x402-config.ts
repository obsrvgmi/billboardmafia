import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

// Monad Testnet configuration
export const MONAD_NETWORK = "eip155:10143";
export const MONAD_USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
export const FACILITATOR_URL = "https://x402-facilitator.molandak.org";

// Dynamic pricing based on bid amount
export function getBidPrice(bidAmountUSDC: number): string {
  return `$${bidAmountUSDC}`;
}

// Initialize x402 server
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
export const x402Server = new x402ResourceServer(facilitatorClient);
x402Server.register(MONAD_NETWORK, new ExactEvmScheme());
