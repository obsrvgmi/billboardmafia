"use client";

import Link from "next/link";
import { BILLBOARD_ADDRESS, MAFIA_TOKEN_ADDRESS, USDC_ADDRESS } from "@/lib/contract";

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
            Bid for the billboard via x402 USDC payments. Outbid to take over. All revenue burns $MAFIA.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 p-4 border border-gray-800 rounded-lg">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">On this page</p>
          <ul className="space-y-2 text-sm">
            <li><a href="#overview" className="text-gray-400 hover:text-white transition-colors">Overview</a></li>
            <li><a href="#rules" className="text-gray-400 hover:text-white transition-colors">Billboard Rules</a></li>
            <li><a href="#bid" className="text-gray-400 hover:text-white transition-colors">Place a Bid</a></li>
            <li><a href="#api" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
            <li><a href="#contracts" className="text-gray-400 hover:text-white transition-colors">Contracts</a></li>
          </ul>
        </nav>

        {/* Overview */}
        <Section id="overview" title="Overview">
          <p className="text-gray-400 mb-4">
            Billboard Mafia is a decentralized advertising platform on Monad. One billboard, infinite competition.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Payment" value="USDC" />
            <StatCard label="Min Bid" value="$1" />
            <StatCard label="Increment" value="+10%" />
            <StatCard label="Duration" value="30 days" />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-white text-sm font-bold mb-2">How it works:</p>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Pay USDC to display your ad on the billboard</li>
              <li>Your ad stays for 30 days OR until someone outbids you</li>
              <li>Outbidder must pay 10%+ more than current bid</li>
              <li>No refunds when outbid (you got exposure)</li>
              <li>All revenue is used to buyback & burn $MAFIA tokens</li>
            </ol>
          </div>
        </Section>

        {/* Rules */}
        <Section id="rules" title="Billboard Rules">
          <div className="space-y-4">
            <RuleCard
              title="Minimum Bid"
              desc="$1 USDC to start. If billboard is active, you must bid 10%+ higher than current."
            />
            <RuleCard
              title="Duration"
              desc="30 days from when your bid is placed. Clock resets if you get outbid."
            />
            <RuleCard
              title="No Refunds"
              desc="If you get outbid, you don't get your money back. But you got exposure until then."
            />
            <RuleCard
              title="Buyback & Burn"
              desc="100% of revenue is used to buy $MAFIA from DEX and burn it. Deflationary."
            />
          </div>
        </Section>

        {/* Place a Bid */}
        <Section id="bid" title="Place a Bid">
          <p className="text-gray-400 mb-4">
            Use the API to place a bid on the billboard.
          </p>

          <Code>{`// Example: Place a $100 bid
const response = await fetch("https://billboard-mafia.vercel.app/api/bid", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    advertiser: "0xYourAddress",
    imageUrl: "https://your-image.com/ad.png",
    linkUrl: "https://your-website.com",
    title: "Your Company Name",
    bidAmount: 100  // $100 USDC
  })
});

const result = await response.json();
console.log("Transaction:", result.transactionHash);`}</Code>

          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-500 text-sm">
              <span className="font-bold">Image Requirements:</span> Recommended 800x400px (2:1 aspect ratio).
              PNG or JPG. Host on IPFS, Imgur, or your own CDN.
            </p>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api" title="API Reference">
          <h4 className="text-white font-bold mb-4">Endpoints</h4>

          <FunctionDoc
            name="POST /api/bid"
            sig="POST /api/bid"
            desc="Place a bid on the billboard"
          />

          <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-white text-sm font-bold mb-2">Request Body:</p>
            <Code>{`{
  "advertiser": "0x...",      // Your wallet address
  "imageUrl": "https://...",  // Billboard image URL
  "linkUrl": "https://...",   // Click-through URL (optional)
  "title": "Company Name",    // Your title (max 100 chars)
  "bidAmount": 100            // Bid in USDC (e.g., 100 = $100)
}`}</Code>
          </div>

          <FunctionDoc
            name="GET /api/bid"
            sig="GET /api/bid"
            desc="Get current billboard info and minimum bid required"
          />

          <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-white text-sm font-bold mb-2">Response:</p>
            <Code>{`{
  "current": {
    "advertiser": "0x...",
    "imageUrl": "https://...",
    "title": "Current Ad",
    "bidAmount": 100,
    "timeRemaining": 2592000,
    "isActive": true
  },
  "minimumBid": 110,
  "stats": {
    "totalRevenue": 500,
    "totalBurned": 1000000,
    "totalAds": 5
  }
}`}</Code>
          </div>
        </Section>

        {/* Contracts */}
        <Section id="contracts" title="Contracts">
          <p className="text-gray-400 mb-4">Deployed on Monad Testnet (Chain ID: 10143)</p>

          <div className="space-y-3">
            <ContractRow name="Billboard" address={BILLBOARD_ADDRESS} />
            <ContractRow name="MafiaToken" address={MAFIA_TOKEN_ADDRESS} />
            <ContractRow name="USDC (Testnet)" address={USDC_ADDRESS} />
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
  return (
    <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg">
      <span className="text-white text-sm font-bold">{name}</span>
      <code className="text-yellow-400 text-xs">{address.slice(0, 10)}...{address.slice(-8)}</code>
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
