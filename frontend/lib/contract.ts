// Contract addresses - update after deployment
export const BILLBOARD_ADDRESS = process.env.NEXT_PUBLIC_BILLBOARD_ADDRESS || "0x0000000000000000000000000000000000000000";
export const MAFIA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_MAFIA_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
export const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

// Billboard ABI
export const BILLBOARD_ABI = [
  {
    inputs: [
      { internalType: "string", name: "imageUrl", type: "string" },
      { internalType: "string", name: "linkUrl", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "uint256", name: "bidAmount", type: "uint256" },
    ],
    name: "placeBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "advertiser", type: "address" },
      { internalType: "string", name: "imageUrl", type: "string" },
      { internalType: "string", name: "linkUrl", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "uint256", name: "bidAmount", type: "uint256" },
    ],
    name: "placeBidFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentAd",
    outputs: [
      { internalType: "address", name: "advertiser", type: "address" },
      { internalType: "string", name: "imageUrl", type: "string" },
      { internalType: "string", name: "linkUrl", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "uint256", name: "bidAmount", type: "uint256" },
      { internalType: "uint256", name: "timeRemaining", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMinimumBid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { internalType: "uint256", name: "_totalRevenue", type: "uint256" },
      { internalType: "uint256", name: "_totalBurned", type: "uint256" },
      { internalType: "uint256", name: "_totalAds", type: "uint256" },
      { internalType: "uint256", name: "_currentBid", type: "uint256" },
      { internalType: "bool", name: "_isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// MafiaToken ABI
export const MAFIA_TOKEN_ABI = [
  {
    inputs: [],
    name: "totalBurned",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "circulatingSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
