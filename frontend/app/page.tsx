"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface SlotData {
  slot: number;
  advertiser: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  bidAmount: number;
  timeRemaining: number;
  isActive: boolean;
  minimumBid: number;
}

interface BillboardData {
  slots: {
    main: SlotData;
    secondary: SlotData;
  };
  stats: {
    totalRevenue: number;
    totalBurned: number;
    totalAds: number;
  };
}

// Demo data for initial render
const DEMO_DATA: BillboardData = {
  slots: {
    main: {
      slot: 0,
      advertiser: "0x0000...0000",
      title: "Your Ad Here",
      imageUrl: "https://placehold.co/800x400/1a1a2e/9d4edd?text=MAIN+BILLBOARD",
      linkUrl: "",
      bidAmount: 0,
      timeRemaining: 0,
      isActive: false,
      minimumBid: 10,
    },
    secondary: {
      slot: 1,
      advertiser: "0x0000...0000",
      title: "Your Ad Here",
      imageUrl: "https://placehold.co/400x200/1a1a2e/f59e0b?text=SECONDARY",
      linkUrl: "",
      bidAmount: 0,
      timeRemaining: 0,
      isActive: false,
      minimumBid: 1,
    },
  },
  stats: {
    totalRevenue: 0,
    totalBurned: 0,
    totalAds: 0,
  },
};

function formatTime(seconds: number): string {
  if (seconds <= 0) return "Available";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m left`;
}

function shortenAddress(addr: string): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "Available";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Home() {
  const [data, setData] = useState<BillboardData>(DEMO_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/bid");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch billboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const { main, secondary } = data.slots;
  const { totalRevenue, totalBurned, totalAds } = data.stats;

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            <span className="text-white font-black text-xl">BILLBOARD MAFIA</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/docs" className="text-gray-500 hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/stats" className="text-gray-500 hover:text-white transition-colors">
              Stats
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-500 text-xs uppercase tracking-wider">live on monad</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
            Billboard Mafia
          </h1>
          <p className="text-gray-500">
            Agent-operated advertising. Pay USDC. Outbid to take over.
          </p>
        </div>

        {/* Main Billboard */}
        <BillboardSlot
          slot={main}
          label="MAIN BILLBOARD"
          labelColor="text-purple-400"
          minBidLabel="$10"
          size="large"
          loading={loading}
        />

        {/* Secondary Billboard */}
        <BillboardSlot
          slot={secondary}
          label="SECONDARY"
          labelColor="text-yellow-400"
          minBidLabel="$1"
          size="small"
          loading={loading}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
          <StatCard label="Total Ads" value={totalAds.toString()} />
          <StatCard label="MAFIA Burned" value={totalBurned > 0 ? totalBurned.toLocaleString() : "0"} />
          <StatCard label="Slots" value="2" />
        </div>

        {/* How it Works */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-xl mb-4">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-white font-bold mb-1">Pay USDC</h3>
              <p className="text-gray-500 text-sm">
                Bid via x402 API to display your ad for 30 days
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="text-white font-bold mb-1">2 Slots</h3>
              <p className="text-gray-500 text-sm">
                Main ($10 min) and Secondary ($1 min) billboards
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚔️</div>
              <h3 className="text-white font-bold mb-1">Get Outbid</h3>
              <p className="text-gray-500 text-sm">
                Anyone can outbid by 10%+ and take over immediately
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="text-white font-bold mb-1">Buyback & Burn</h3>
              <p className="text-gray-500 text-sm">
                All revenue buys and burns $MAFIA tokens
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-gray-600">
          <span>billboard mafia • agent operated</span>
          <span>monad testnet</span>
        </div>
      </footer>
    </main>
  );
}

interface BillboardSlotProps {
  slot: SlotData;
  label: string;
  labelColor: string;
  minBidLabel: string;
  size: "large" | "small";
  loading: boolean;
}

function BillboardSlot({ slot, label, labelColor, minBidLabel, size, loading }: BillboardSlotProps) {
  const isLarge = size === "large";

  return (
    <div className={`mb-8 ${isLarge ? "" : "max-w-2xl mx-auto"}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
          {label}
        </span>
        <span className="text-xs text-gray-500">
          Min bid: {minBidLabel} USDC
        </span>
      </div>

      {/* Billboard Display */}
      <div className={`relative bg-gray-900 border-4 ${isLarge ? "border-purple-500/50" : "border-yellow-500/50"} rounded-xl overflow-hidden shadow-2xl`}>
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur px-4 py-2 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${slot.isActive ? "text-white" : "text-gray-500"}`}>
              {slot.isActive ? slot.title : "Available"}
            </span>
            {slot.isActive && (
              <span className="text-gray-500 text-sm">by {shortenAddress(slot.advertiser)}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {slot.isActive ? (
              <>
                <span className="text-green-400 font-mono">${slot.bidAmount} USDC</span>
                <span className="text-gray-500">{formatTime(slot.timeRemaining)}</span>
              </>
            ) : (
              <span className="text-yellow-400">Place first bid!</span>
            )}
          </div>
        </div>

        {/* Billboard Image */}
        <a
          href={slot.linkUrl || "#"}
          target={slot.linkUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={slot.imageUrl || `https://placehold.co/${isLarge ? "800x400" : "600x300"}/1a1a2e/666?text=YOUR+AD+HERE`}
            alt={slot.title || "Billboard"}
            className={`w-full ${isLarge ? "aspect-[2/1]" : "aspect-[2/1]"} object-cover hover:opacity-90 transition-opacity`}
          />
        </a>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-16"></div>
      </div>

      {/* Bid CTA */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          {slot.isActive
            ? `Outbid for $${slot.minimumBid.toFixed(2)}+ USDC`
            : `Start bidding at ${minBidLabel} USDC`}
        </p>
        <Link
          href={`/docs#slot-${slot.slot}`}
          className={`text-sm font-bold px-4 py-1 rounded ${
            isLarge
              ? "bg-purple-500 hover:bg-purple-400 text-white"
              : "bg-yellow-500 hover:bg-yellow-400 text-black"
          } transition-colors`}
        >
          Bid via API
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}
