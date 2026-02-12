// Contract addresses - update after deployment
export const BILLBOARD_ADDRESS = process.env.NEXT_PUBLIC_BILLBOARD_ADDRESS || "0x0000000000000000000000000000000000000000";
export const BB_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_BB_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
export const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

// Slot constants
export const SLOT_MAIN = 0;
export const SLOT_SECONDARY = 1;
export const MIN_BID_MAIN = 10; // $10 USDC
export const MIN_BID_SECONDARY = 1; // $1 USDC

// Timing constants
export const ROUND_DURATION = 12 * 60 * 60; // 12 hours in seconds
export const BIDDING_WINDOW = 30 * 60; // 30 minutes in seconds

// Billboard ABI (timed auction version)
export const BILLBOARD_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "slot", type: "uint256" },
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
      { internalType: "uint256", name: "slot", type: "uint256" },
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
    inputs: [{ internalType: "uint256", name: "slot", type: "uint256" }],
    name: "finalizeRound",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isBiddingOpen",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentRoundId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getNextRoundId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "timeUntilBiddingOpens",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "timeUntilRoundEnds",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "slot", type: "uint256" }],
    name: "getSlotAd",
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
    name: "getAllSlots",
    outputs: [
      {
        components: [
          { internalType: "address", name: "advertiser", type: "address" },
          { internalType: "string", name: "imageUrl", type: "string" },
          { internalType: "string", name: "linkUrl", type: "string" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "uint256", name: "bidAmount", type: "uint256" },
          { internalType: "uint256", name: "roundId", type: "uint256" },
        ],
        internalType: "struct Billboard.Ad",
        name: "mainAd",
        type: "tuple",
      },
      { internalType: "bool", name: "mainActive", type: "bool" },
      { internalType: "uint256", name: "mainTimeRemaining", type: "uint256" },
      {
        components: [
          { internalType: "address", name: "advertiser", type: "address" },
          { internalType: "string", name: "imageUrl", type: "string" },
          { internalType: "string", name: "linkUrl", type: "string" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "uint256", name: "bidAmount", type: "uint256" },
          { internalType: "uint256", name: "roundId", type: "uint256" },
        ],
        internalType: "struct Billboard.Ad",
        name: "secondaryAd",
        type: "tuple",
      },
      { internalType: "bool", name: "secondaryActive", type: "bool" },
      { internalType: "uint256", name: "secondaryTimeRemaining", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBiddingStatus",
    outputs: [
      { internalType: "bool", name: "biddingOpen", type: "bool" },
      { internalType: "uint256", name: "currentRoundId", type: "uint256" },
      { internalType: "uint256", name: "nextRoundId", type: "uint256" },
      { internalType: "uint256", name: "timeUntilBidding", type: "uint256" },
      { internalType: "uint256", name: "timeUntilNextRound", type: "uint256" },
      { internalType: "uint256", name: "mainHighestBid", type: "uint256" },
      { internalType: "address", name: "mainHighestBidder", type: "address" },
      { internalType: "uint256", name: "secondaryHighestBid", type: "uint256" },
      { internalType: "address", name: "secondaryHighestBidder", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "slot", type: "uint256" }],
    name: "getMinimumBid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "slot", type: "uint256" }],
    name: "getMinBidForSlot",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { internalType: "uint256", name: "_totalRevenue", type: "uint256" },
      { internalType: "uint256", name: "_totalBurned", type: "uint256" },
      { internalType: "uint256", name: "_totalRounds", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "slot", type: "uint256" }],
    name: "highestBid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "slot", type: "uint256" }],
    name: "highestBidder",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "slot", type: "uint256" }],
    name: "lastFinalizedRound",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
