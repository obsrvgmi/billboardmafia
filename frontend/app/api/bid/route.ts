import { NextRequest, NextResponse } from "next/server";
import { getServerWallet } from "@/lib/server-wallet";
import { ethers } from "ethers";
import { BILLBOARD_ADDRESS, BILLBOARD_ABI } from "@/lib/contract";

type BidResponse =
  | { success: true; transactionHash: string }
  | { error: string };

/**
 * POST /api/bid
 * Place a bid on the billboard
 *
 * Body: {
 *   advertiser: string,  // Address to credit
 *   imageUrl: string,    // Billboard image URL
 *   linkUrl: string,     // Click-through URL
 *   title: string,       // Company/ad title
 *   bidAmount: number    // Bid in USDC (e.g., 100 for $100)
 * }
 *
 * Note: In production, this would be x402-protected.
 * For now, it's a direct endpoint for testing.
 */
export async function POST(request: NextRequest): Promise<NextResponse<BidResponse>> {
  try {
    const { advertiser, imageUrl, linkUrl, title, bidAmount } = await request.json();

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

    if (!bidAmount || typeof bidAmount !== "number" || bidAmount < 1) {
      return NextResponse.json({ error: "Bid must be at least $1" }, { status: 400 });
    }

    // Get server wallet
    const wallet = getServerWallet();

    // Create contract instance
    const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, wallet);

    // Convert bid to USDC units (6 decimals)
    const bidAmountWei = ethers.parseUnits(bidAmount.toString(), 6);

    // Place bid on behalf of advertiser
    const tx = await billboard.placeBidFor(
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
      if (error.message.includes("Only owner")) {
        return NextResponse.json({ error: "Server not authorized" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}

/**
 * GET /api/bid
 * Get current billboard info and minimum bid
 */
export async function GET(): Promise<NextResponse> {
  try {
    const wallet = getServerWallet();
    const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, wallet);

    const [currentAd, minBid, stats] = await Promise.all([
      billboard.getCurrentAd(),
      billboard.getMinimumBid(),
      billboard.getStats(),
    ]);

    return NextResponse.json({
      current: {
        advertiser: currentAd[0],
        imageUrl: currentAd[1],
        linkUrl: currentAd[2],
        title: currentAd[3],
        bidAmount: Number(currentAd[4]) / 1e6,
        timeRemaining: Number(currentAd[5]),
        isActive: currentAd[6],
      },
      minimumBid: Number(minBid) / 1e6,
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
