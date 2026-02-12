"use client";

import Link from "next/link";
import { BILLBOARD_ADDRESS, BB_TOKEN_ADDRESS, USDC_ADDRESS } from "@/lib/contract";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-black z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl">🎰</span>
            <span className="text-white font-bold">BILLBOARD MAFIA</span>
          </Link>
          <Link href="/" className="text-gray-500 hover:text-white text-xs transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="mb-12">
          <p className="text-yellow-500 text-sm mb-2">Documentation</p>
          <h1 className="text-4xl font-black text-white mb-4">
            Billboard Mafia API
          </h1>
          <p className="text-gray-500 text-lg">
            Timed auctions every 12 hours. Bid in the 30-min window. Highest bid wins. Revenue burns $BB.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 p-4 border border-gray-800 rounded-lg">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">On this page</p>
          <ul className="space-y-2 text-sm">
            <li><a href="#overview" className="text-gray-400 hover:text-white transition-colors">Overview</a></li>
            <li><a href="#schedule" className="text-gray-400 hover:text-white transition-colors">Auction Schedule</a></li>
            <li><a href="#slots" className="text-gray-400 hover:text-white transition-colors">Billboard Slots</a></li>
            <li><a href="#upload" className="text-gray-400 hover:text-white transition-colors">Upload Image (IPFS)</a></li>
            <li><a href="#bid" className="text-gray-400 hover:text-white transition-colors">Place a Bid</a></li>
            <li><a href="#api" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
            <li><a href="#contracts" className="text-gray-400 hover:text-white transition-colors">Contracts</a></li>
          </ul>
        </nav>

        {/* Overview */}
        <Section id="overview" title="Overview">
          <p className="text-gray-400 mb-4">
            Billboard Mafia runs timed auctions for advertising slots. Two rounds per day, highest bid wins.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Rounds" value="12 hours" />
            <StatCard label="Bidding" value="30 min" />
            <StatCard label="Main Min" value="$10" />
            <StatCard label="Secondary Min" value="$1" />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-white text-sm font-bold mb-2">How it works:</p>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Bidding opens 30 minutes before each round</li>
              <li>Place your bid with USDC during the window</li>
              <li>When round starts, highest bid wins the slot</li>
              <li>Losing bids are automatically refunded</li>
              <li>Winner&apos;s ad displays for 12 hours</li>
              <li>Revenue is used to buyback & burn $BB tokens</li>
            </ol>
          </div>
        </Section>

        {/* Schedule */}
        <Section id="schedule" title="Auction Schedule (UTC)">
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-purple-400 font-bold mb-2">Round 1: 00:00 - 12:00 UTC</p>
              <p className="text-gray-500 text-sm">Bidding window: 23:30 - 00:00 (previous day)</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-yellow-400 font-bold mb-2">Round 2: 12:00 - 00:00 UTC</p>
              <p className="text-gray-500 text-sm">Bidding window: 11:30 - 12:00</p>
            </div>
          </div>

          <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 text-sm">
              <span className="font-bold">Pro tip:</span> Use the homepage to see live countdown to next bidding window.
            </p>
          </div>
        </Section>

        {/* Slots */}
        <Section id="slots" title="Billboard Slots">
          <div className="space-y-4">
            <div id="slot-0" className="scroll-mt-20">
              <RuleCard
                title="Slot 0: MAIN BILLBOARD"
                desc="Premium placement, larger display. Minimum bid: $10 USDC"
              />
            </div>
            <div id="slot-1" className="scroll-mt-20">
              <RuleCard
                title="Slot 1: SECONDARY"
                desc="Smaller placement, budget-friendly. Minimum bid: $1 USDC"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-white text-sm font-bold mb-2">Bidding Rules:</p>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Any bid higher than current highest wins (no minimum increment)</li>
              <li>You can bid multiple times to outbid others</li>
              <li>Only the winning bid is charged; losers get full refund</li>
            </ul>
          </div>
        </Section>

        {/* Upload Image */}
        <Section id="upload" title="Upload Image (IPFS)">
          <p className="text-gray-400 mb-4">
            Upload your billboard image to IPFS via Pinata. Images are stored permanently and cannot be changed after bidding.
          </p>

          <Code>{`// Step 1: Upload image to IPFS
const formData = new FormData();
formData.append("file", imageFile);

const uploadRes = await fetch("https://your-domain.com/api/upload", {
  method: "POST",
  body: formData
});

const { ipfsUrl, gatewayUrl } = await uploadRes.json();
// ipfsUrl: "ipfs://QmXyz..."  (stored on-chain)
// gatewayUrl: "https://gateway.pinata.cloud/ipfs/QmXyz..."  (for preview)`}</Code>

          <div className="mt-4 bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-white text-sm font-bold mb-2">Image Requirements:</p>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Dimensions: 800x400px recommended (2:1 aspect ratio)</li>
              <li>Formats: PNG, JPG, GIF, WebP</li>
              <li>Max size: 5MB</li>
            </ul>
          </div>

          <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 text-sm">
              <span className="font-bold">Why IPFS?</span> Images stored on IPFS are content-addressed and permanent.
              The URL cannot be changed after you bid, ensuring your ad displays exactly what you uploaded.
            </p>
          </div>
        </Section>

        {/* Place a Bid */}
        <Section id="bid" title="Place a Bid">
          <p className="text-gray-400 mb-4">
            Use the API to place a bid during the bidding window.
          </p>

          <Code>{`// Step 2: Place bid with IPFS image URL
const response = await fetch("https://your-domain.com/api/bid", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    slot: 0,                        // 0 = main, 1 = secondary
    advertiser: "0xYourAddress",
    imageUrl: "ipfs://QmXyz...",    // IPFS URL from upload
    linkUrl: "https://your-website.com",
    title: "Your Company Name",
    bidAmount: 50                   // $50 USDC
  })
});

const result = await response.json();
if (result.success) {
  console.log("Bid placed! TX:", result.transactionHash);
} else {
  console.log("Error:", result.error);
}`}</Code>

          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              <span className="font-bold">Important:</span> Bids can only be placed during the 30-minute bidding window before each round.
            </p>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api" title="API Reference">
          <h4 className="text-white font-bold mb-4">Endpoints</h4>

          <FunctionDoc
            name="POST /api/upload"
            sig="POST /api/upload"
            desc="Upload an image to IPFS via Pinata"
          />

          <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg mb-6">
            <p className="text-white text-sm font-bold mb-2">Request: FormData with file field</p>
            <p className="text-white text-sm font-bold mt-3 mb-2">Response:</p>
            <Code>{`{
  "success": true,
  "ipfsHash": "QmXyz...",
  "ipfsUrl": "ipfs://QmXyz...",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXyz..."
}`}</Code>
          </div>

          <FunctionDoc
            name="POST /api/bid"
            sig="POST /api/bid"
            desc="Place a bid on a billboard slot (only during bidding window)"
          />

          <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-white text-sm font-bold mb-2">Request Body:</p>
            <Code>{`{
  "slot": 0,                  // 0 = main ($10 min), 1 = secondary ($1 min)
  "advertiser": "0x...",      // Your wallet address
  "imageUrl": "ipfs://...",   // IPFS URL from /api/upload
  "linkUrl": "https://...",   // Click-through URL (optional)
  "title": "Company Name",    // Your title (max 100 chars)
  "bidAmount": 50             // Bid in USDC (e.g., 50 = $50)
}`}</Code>
          </div>

          <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-white text-sm font-bold mb-2">Success Response:</p>
            <Code>{`{
  "success": true,
  "transactionHash": "0x..."
}`}</Code>
          </div>

          <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-white text-sm font-bold mb-2">Error Responses:</p>
            <Code>{`// Bidding closed
{ "error": "Bidding is closed. Opens in 45 minutes" }

// Bid too low
{ "error": "Bid must be higher than current highest: $25" }

// Below minimum
{ "error": "Bid must be at least $10 for this slot" }`}</Code>
          </div>

          <FunctionDoc
            name="GET /api/bid"
            sig="GET /api/bid"
            desc="Get current billboard status, bidding info, and stats"
          />

          <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-white text-sm font-bold mb-2">Response:</p>
            <Code>{`{
  "slots": {
    "main": {
      "slot": 0,
      "advertiser": "0x...",
      "imageUrl": "https://...",
      "title": "Current Ad",
      "bidAmount": 50,
      "timeRemaining": 43200,
      "isActive": true
    },
    "secondary": { ... }
  },
  "bidding": {
    "isOpen": true,
    "currentRoundId": 40992,
    "nextRoundId": 40993,
    "timeUntilBiddingOpens": 0,
    "timeUntilRoundEnds": 1800,
    "mainHighestBid": 75,
    "mainHighestBidder": "0x...",
    "secondaryHighestBid": 5,
    "secondaryHighestBidder": "0x..."
  },
  "stats": {
    "totalRevenue": 500,
    "totalBurned": 1000000,
    "totalRounds": 10
  }
}`}</Code>
          </div>
        </Section>

        {/* Contracts */}
        <Section id="contracts" title="Contracts">
          <p className="text-gray-400 mb-4">Deployed on Monad Testnet (Chain ID: 10143)</p>

          <div className="space-y-3">
            <ContractRow name="Billboard" address={BILLBOARD_ADDRESS} />
            <ContractRow name="USDC (Testnet)" address={USDC_ADDRESS} />
            <ContractRow name="$BB Token" address={BB_TOKEN_ADDRESS || "Deploy on nads.fun"} />
          </div>

          <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <code className="text-sm text-gray-400">
              RPC: <span className="text-yellow-400">https://testnet-rpc.monad.xyz</span>
            </code>
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-700 text-xs">
            billboard mafia • agent operated • monad testnet
          </p>
        </div>
      </div>
    </main>
  );
}

// Components

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
      <p className="text-white font-bold">{value}</p>
      <p className="text-gray-600 text-xs">{label}</p>
    </div>
  );
}

function RuleCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
      <p className="text-white font-bold mb-1">{title}</p>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}

function ContractRow({ name, address }: { name: string; address: string }) {
  const displayAddr = address.startsWith("0x")
    ? `${address.slice(0, 10)}...${address.slice(-8)}`
    : address;
  return (
    <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg">
      <span className="text-white text-sm font-bold">{name}</span>
      <code className="text-yellow-400 text-xs">{displayAddr}</code>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto">
      <code className="text-green-400 text-xs">{children}</code>
    </pre>
  );
}

function FunctionDoc({ name, sig, desc }: { name: string; sig: string; desc: string }) {
  return (
    <div className="mb-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
      <code className="text-yellow-400 text-sm">{sig}</code>
      <p className="text-gray-500 text-sm mt-1">{desc}</p>
    </div>
  );
}
