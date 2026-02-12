import { NextRequest, NextResponse } from "next/server";
import { getServerWallet } from "@/lib/server-wallet";
import { ethers } from "ethers";
import {
  BILLBOARD_ADDRESS,
  BILLBOARD_ABI,
  USDC_ADDRESS,
  SLOT_MAIN,
  SLOT_SECONDARY,
  MIN_BID_MAIN,
  MIN_BID_SECONDARY,
} from "@/lib/contract";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

type BidResponse =
  | { success: true; transactionHash: string }
  | { error: string };

/**
 * POST /api/bid
 * Place a bid for the next round
 *
 * Body: {
 *   slot: number,         // 0 = main ($10 min), 1 = secondary ($1 min)
 *   advertiser: string,   // Address to credit
 *   imageUrl: string,     // Billboard image URL
 *   linkUrl: string,      // Click-through URL
 *   title: string,        // Company/ad title
 *   bidAmount: number     // Bid in USDC (e.g., 100 for $100)
 * }
 *
 * Note: Bidding only open 30 minutes before each 12-hour round
 */
export async function POST(request: NextRequest): Promise<NextResponse<BidResponse>> {
  try {
    const { slot = SLOT_MAIN, advertiser, imageUrl, linkUrl, title, bidAmount } = await request.json();

    // Validate slot
    if (slot !== SLOT_MAIN && slot !== SLOT_SECONDARY) {
      return NextResponse.json({ error: "Invalid slot. Use 0 (main) or 1 (secondary)" }, { status: 400 });
    }

    // Validate inputs
    if (!advertiser || !ethers.isAddress(advertiser)) {
      return NextResponse.json({ error: "Invalid advertiser address" }, { status: 400 });
    }

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 });
    }

    if (!title || typeof title !== "string" || title.length > 100) {
      return NextResponse.json({ error: "Title required (max 100 chars)" }, { status: 400 });
    }

    const minBid = slot === SLOT_MAIN ? MIN_BID_MAIN : MIN_BID_SECONDARY;
    if (!bidAmount || typeof bidAmount !== "number" || bidAmount < minBid) {
      return NextResponse.json({ error: `Bid must be at least $${minBid} for this slot` }, { status: 400 });
    }

    // Get server wallet
    const wallet = getServerWallet();

    // Create contract instance
    const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, wallet);

    // Check if bidding is open
    const biddingOpen = await billboard.isBiddingOpen();
    if (!biddingOpen) {
      const timeUntil = await billboard.timeUntilBiddingOpens();
      return NextResponse.json({
        error: `Bidding is closed. Opens in ${Math.floor(Number(timeUntil) / 60)} minutes`
      }, { status: 400 });
    }

    // Check if bid is high enough
    const currentHighest = await billboard.highestBid(slot);
    const bidAmountWei = ethers.parseUnits(bidAmount.toString(), 6);
    if (bidAmountWei <= currentHighest) {
      return NextResponse.json({
        error: `Bid must be higher than current highest: $${Number(currentHighest) / 1e6}`
      }, { status: 400 });
    }

    // Approve USDC transfer to contract (for refund handling)
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const allowance = await usdc.allowance(wallet.address, BILLBOARD_ADDRESS);
    if (allowance < bidAmountWei) {
      const approveTx = await usdc.approve(BILLBOARD_ADDRESS, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Place bid on behalf of advertiser (USDC transferred from server wallet to contract)
    const tx = await billboard.placeBidFor(
      slot,
      advertiser,
      imageUrl,
      linkUrl || "",
      title,
      bidAmountWei
    );

    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
    });
  } catch (error) {
    console.error("Bid error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Bidding is closed")) {
        return NextResponse.json({ error: "Bidding window is closed" }, { status: 400 });
      }
      if (error.message.includes("Bid must be higher")) {
        return NextResponse.json({ error: "Bid must be higher than current highest" }, { status: 400 });
      }
      if (error.message.includes("Bid below minimum")) {
        return NextResponse.json({ error: "Bid below minimum for slot" }, { status: 400 });
      }
      if (error.message.includes("Only owner")) {
        return NextResponse.json({ error: "Server not authorized" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}

/**
 * GET /api/bid
 * Get billboard status, current ads, and bidding info
 */
export async function GET(): Promise<NextResponse> {
  try {
    const wallet = getServerWallet();
    const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, wallet);

    const [allSlots, biddingStatus, stats] = await Promise.all([
      billboard.getAllSlots(),
      billboard.getBiddingStatus(),
      billboard.getStats(),
    ]);

    const [mainAd, mainActive, mainTimeRemaining, secondaryAd, secondaryActive, secondaryTimeRemaining] = allSlots;
    const [
      biddingOpen,
      currentRoundId,
      nextRoundId,
      timeUntilBidding,
      timeUntilNextRound,
      mainHighestBid,
      mainHighestBidder,
      secondaryHighestBid,
      secondaryHighestBidder,
    ] = biddingStatus;

    return NextResponse.json({
      slots: {
        main: {
          slot: SLOT_MAIN,
          advertiser: mainAd.advertiser,
          imageUrl: mainAd.imageUrl,
          linkUrl: mainAd.linkUrl,
          title: mainAd.title,
          bidAmount: Number(mainAd.bidAmount) / 1e6,
          roundId: Number(mainAd.roundId),
          timeRemaining: Number(mainTimeRemaining),
          isActive: mainActive,
        },
        secondary: {
          slot: SLOT_SECONDARY,
          advertiser: secondaryAd.advertiser,
          imageUrl: secondaryAd.imageUrl,
          linkUrl: secondaryAd.linkUrl,
          title: secondaryAd.title,
          bidAmount: Number(secondaryAd.bidAmount) / 1e6,
          roundId: Number(secondaryAd.roundId),
          timeRemaining: Number(secondaryTimeRemaining),
          isActive: secondaryActive,
        },
      },
      bidding: {
        isOpen: biddingOpen,
        currentRoundId: Number(currentRoundId),
        nextRoundId: Number(nextRoundId),
        timeUntilBiddingOpens: Number(timeUntilBidding),
        timeUntilRoundEnds: Number(timeUntilNextRound),
        mainHighestBid: Number(mainHighestBid) / 1e6,
        mainHighestBidder: mainHighestBidder,
        secondaryHighestBid: Number(secondaryHighestBid) / 1e6,
        secondaryHighestBidder: secondaryHighestBidder,
      },
      stats: {
        totalRevenue: Number(stats[0]) / 1e6,
        totalBurned: Number(stats[1]),
        totalRounds: Number(stats[2]),
      },
    });
  } catch (error) {
    console.error("Get billboard error:", error);
    return NextResponse.json({ error: "Failed to get billboard info" }, { status: 500 });
  }
}
