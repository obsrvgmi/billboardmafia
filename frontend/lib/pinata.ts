import { PinataSDK } from "pinata";

let pinataInstance: PinataSDK | null = null;

export function getPinata(): PinataSDK {
  if (!pinataInstance) {
    if (!process.env.PINATA_JWT) {
      throw new Error("PINATA_JWT not configured");
    }
    pinataInstance = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
    });
  }
  return pinataInstance;
}

export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";
