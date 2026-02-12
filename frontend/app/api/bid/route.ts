import { NextRequest, NextResponse } from "next/server";
import { getServerWallet } from "@/lib/server-wallet";
import { ethers } from "ethers";
import {
  BILLBOARD_ADDRESS,
  BILLBOARD_ABI,
  SLOT_MAIN,
  SLOT_SECONDARY,
  MIN_BID_MAIN,
  MIN_BID_SECONDARY,
} from "@/lib/contract";

type BidResponse =
  | { success: true; transactionHash: string }
  | { error: string };

/**
 * POST /api/bid
 * Place a bid on a billboard slot
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
 * Note: In production, this would be x402-protected.
 * For now, it's a direct endpoint for testing.
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

    // Convert bid to USDC units (6 decimals)
    const bidAmountWei = ethers.parseUnits(bidAmount.toString(), 6);

    // Place bid on behalf of advertiser
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
      if (error.message.includes("Bid must be 10% higher")) {
        return NextResponse.json({ error: "Bid must be 10% higher than current" }, { status: 400 });
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
 * Get both billboard slots info
 */
export async function GET(): Promise<NextResponse> {
  try {
    const wallet = getServerWallet();
    const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, wallet);

    const [allSlots, stats, minBidMain, minBidSecondary] = await Promise.all([
      billboard.getAllSlots(),
      billboard.getStats(),
      billboard.getMinimumBid(SLOT_MAIN),
      billboard.getMinimumBid(SLOT_SECONDARY),
    ]);

    const [mainAd, mainActive, mainTimeRemaining, secondaryAd, secondaryActive, secondaryTimeRemaining] = allSlots;

    return NextResponse.json({
      slots: {
        main: {
          slot: SLOT_MAIN,
          advertiser: mainAd.advertiser,
          imageUrl: mainAd.imageUrl,
          linkUrl: mainAd.linkUrl,
          title: mainAd.title,
          bidAmount: Number(mainAd.bidAmount) / 1e6,
          timeRemaining: Number(mainTimeRemaining),
          isActive: mainActive,
          minimumBid: Number(minBidMain) / 1e6,
        },
        secondary: {
          slot: SLOT_SECONDARY,
          advertiser: secondaryAd.advertiser,
          imageUrl: secondaryAd.imageUrl,
          linkUrl: secondaryAd.linkUrl,
          title: secondaryAd.title,
          bidAmount: Number(secondaryAd.bidAmount) / 1e6,
          timeRemaining: Number(secondaryTimeRemaining),
          isActive: secondaryActive,
          minimumBid: Number(minBidSecondary) / 1e6,
        },
      },
      stats: {
        totalRevenue: Number(stats[0]) / 1e6,
        totalBurned: Number(stats[1]),
        totalAds: Number(stats[2]),
      },
    });
  } catch (error) {
    console.error("Get billboard error:", error);
    return NextResponse.json({ error: "Failed to get billboard info" }, { status: 500 });
  }
}
