import { NextRequest, NextResponse } from "next/server";
import { getPinata, IPFS_GATEWAY } from "@/lib/pinata";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

type UploadResponse =
  | { success: true; ipfsHash: string; ipfsUrl: string; gatewayUrl: string }
  | { error: string };

/**
 * POST /api/upload
 * Upload an image to IPFS via Pinata
 *
 * Body: FormData with 'file' field
 *
 * Returns:
 * - ipfsHash: The IPFS CID (e.g., "QmXyz...")
 * - ipfsUrl: The ipfs:// URL (e.g., "ipfs://QmXyz...")
 * - gatewayUrl: HTTP gateway URL for display (e.g., "https://gateway.pinata.cloud/ipfs/QmXyz...")
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Upload to Pinata (public IPFS)
    const pinata = getPinata();
    const result = await pinata.upload.public.file(file);

    const ipfsHash = result.cid;
    const ipfsUrl = `ipfs://${ipfsHash}`;
    const gatewayUrl = `${IPFS_GATEWAY}/${ipfsHash}`;

    return NextResponse.json({
      success: true,
      ipfsHash,
      ipfsUrl,
      gatewayUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof Error) {
      if (error.message.includes("PINATA_JWT")) {
        return NextResponse.json({ error: "IPFS upload not configured" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
