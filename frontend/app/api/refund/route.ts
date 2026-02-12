import { NextRequest, NextResponse } from "next/server";
import { getServerWallet } from "@/lib/server-wallet";
import { ethers } from "ethers";
import { BILLBOARD_ADDRESS, BILLBOARD_ABI } from "@/lib/contract";

/**
 * GET /api/refund?address=0x...
 * Check pending refund for an address
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const address = request.nextUrl.searchParams.get("address");

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const wallet = getServerWallet();
    const billboard = new ethers.Contract(BILLBOARD_ADDRESS, BILLBOARD_ABI, wallet);

    const pendingRefund = await billboard.getPendingRefund(address);

    return NextResponse.json({
      address,
      pendingRefund: Number(pendingRefund) / 1e6,
      pendingRefundRaw: pendingRefund.toString(),
    });
  } catch (error) {
    console.error("Get refund error:", error);
    return NextResponse.json({ error: "Failed to get refund info" }, { status: 500 });
  }
}

/**
 * POST /api/refund
 * Note: Users must call claimRefund directly on the contract
 * This endpoint is just for info - actual claim must be on-chain by the user
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({
    error: "Refunds must be claimed directly on-chain by calling claimRefund() on the contract",
    contract: BILLBOARD_ADDRESS,
    method: "claimRefund()",
  }, { status: 400 });
}
