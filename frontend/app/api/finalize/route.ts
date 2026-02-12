import { NextRequest, NextResponse } from "next/server";
import { getServerWallet } from "@/lib/server-wallet";
import { ethers } from "ethers";
import { BILLBOARD_ADDRESS, BILLBOARD_ABI, SLOT_MAIN, SLOT_SECONDARY } from "@/lib/contract";

/**
 * POST /api/finalize
 * Finalize a round - set winner and refund losers
 *
 * Body: { slot?: number } // 0 = main, 1 = secondary, omit for both
 *
 * Can be called by anyone after a round starts.
 * Typically called automatically or by a cron job.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const { slot } = body;

    const wallet = getServerWallet();
    const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, wallet);

    const results: { slot: number; success: boolean; hash?: string; error?: string }[] = [];

    // Determine which slots to finalize
    const slotsToFinalize = slot !== undefined ? [slot] : [SLOT_MAIN, SLOT_SECONDARY];

    for (const s of slotsToFinalize) {
      try {
        const tx = await billboard.finalizeRound(s);
        const receipt = await tx.wait();
        results.push({ slot: s, success: true, hash: receipt.hash });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Check if already finalized
        if (errorMessage.includes("Round already finalized")) {
          results.push({ slot: s, success: true, error: "Already finalized" });
        } else {
          results.push({ slot: s, success: false, error: errorMessage });
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Finalize error:", error);
    return NextResponse.json({ error: "Failed to finalize round" }, { status: 500 });
  }
}

/**
 * GET /api/finalize
 * Check if rounds need to be finalized
 */
export async function GET(): Promise<NextResponse> {
  try {
    const wallet = getServerWallet();
    const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, wallet);

    const biddingStatus = await billboard.getBiddingStatus();
    const currentRoundId = Number(biddingStatus[1]);

    // Check each slot
    const mainLastFinalized = await billboard.lastFinalizedRound(SLOT_MAIN);
    const secondaryLastFinalized = await billboard.lastFinalizedRound(SLOT_SECONDARY);

    return NextResponse.json({
      currentRoundId,
      slots: {
        main: {
          lastFinalized: Number(mainLastFinalized),
          needsFinalization: currentRoundId > Number(mainLastFinalized),
        },
        secondary: {
          lastFinalized: Number(secondaryLastFinalized),
          needsFinalization: currentRoundId > Number(secondaryLastFinalized),
        },
      },
    });
  } catch (error) {
    console.error("Check finalize error:", error);
    return NextResponse.json({ error: "Failed to check finalization status" }, { status: 500 });
  }
}
