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
  roundId: number;
  timeRemaining: number;
  isActive: boolean;
}

interface BiddingData {
  isOpen: boolean;
  currentRoundId: number;
  nextRoundId: number;
  timeUntilBiddingOpens: number;
  timeUntilRoundEnds: number;
  mainHighestBid: number;
  mainHighestBidder: string;
  secondaryHighestBid: number;
  secondaryHighestBidder: string;
}

interface BillboardData {
  slots: {
    main: SlotData;
    secondary: SlotData;
  };
  bidding: BiddingData;
  stats: {
    totalRevenue: number;
    totalBurned: number;
    totalRounds: number;
  };
}

// Demo data for initial render
const DEMO_DATA: BillboardData = {
  slots: {
    main: {
      slot: 0,
      advertiser: "0x0000000000000000000000000000000000000000",
      title: "No Ad Yet",
      imageUrl: "",
      linkUrl: "",
      bidAmount: 0,
      roundId: 0,
      timeRemaining: 0,
      isActive: false,
    },
    secondary: {
      slot: 1,
      advertiser: "0x0000000000000000000000000000000000000000",
      title: "No Ad Yet",
      imageUrl: "",
      linkUrl: "",
      bidAmount: 0,
      roundId: 0,
      timeRemaining: 0,
      isActive: false,
    },
  },
  bidding: {
    isOpen: false,
    currentRoundId: 0,
    nextRoundId: 1,
    timeUntilBiddingOpens: 0,
    timeUntilRoundEnds: 0,
    mainHighestBid: 0,
    mainHighestBidder: "0x0000000000000000000000000000000000000000",
    secondaryHighestBid: 0,
    secondaryHighestBidder: "0x0000000000000000000000000000000000000000",
  },
  stats: {
    totalRevenue: 0,
    totalBurned: 0,
    totalRounds: 0,
  },
};

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function shortenAddress(addr: string): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "None";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Home() {
  const [data, setData] = useState<BillboardData>(DEMO_DATA);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ bidding: 0, round: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/bid");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setCountdown({
            bidding: json.bidding.timeUntilBiddingOpens,
            round: json.bidding.timeUntilRoundEnds,
          });
        }
      } catch (error) {
        console.error("Failed to fetch billboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => ({
        bidding: Math.max(0, prev.bidding - 1),
        round: Math.max(0, prev.round - 1),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { main, secondary } = data.slots;
  const { bidding, stats } = data;

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

      {/* Bidding Status Banner */}
      <div className={`py-3 px-4 text-center ${bidding.isOpen ? "bg-green-900/50" : "bg-gray-900"}`}>
        {bidding.isOpen ? (
          <div className="flex items-center justify-center gap-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-bold">BIDDING OPEN</span>
            <span className="text-gray-400">|</span>
            <span className="text-white">Round {bidding.nextRoundId} starts in {formatTime(countdown.round)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-yellow-400 font-bold">BIDDING CLOSED</span>
            <span className="text-gray-400">|</span>
            <span className="text-white">Opens in {formatTime(countdown.bidding)}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400">Round ends in {formatTime(countdown.round)}</span>
          </div>
        )}
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
            12-Hour Billboard Auctions
          </h1>
          <p className="text-gray-500">
            Bid in the 30-min window. Highest bid wins. Losers get refunded.
          </p>
        </div>

        {/* Main Billboard */}
        <BillboardSlot
          slot={main}
          highestBid={bidding.mainHighestBid}
          highestBidder={bidding.mainHighestBidder}
          biddingOpen={bidding.isOpen}
          label="MAIN BILLBOARD"
          labelColor="text-purple-400"
          minBidLabel="$10"
          size="large"
          loading={loading}
        />

        {/* Secondary Billboard */}
        <BillboardSlot
          slot={secondary}
          highestBid={bidding.secondaryHighestBid}
          highestBidder={bidding.secondaryHighestBidder}
          biddingOpen={bidding.isOpen}
          label="SECONDARY"
          labelColor="text-yellow-400"
          minBidLabel="$1"
          size="small"
          loading={loading}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
          <StatCard label="Rounds Completed" value={stats.totalRounds.toString()} />
          <StatCard label="$BB Burned" value={stats.totalBurned > 0 ? stats.totalBurned.toLocaleString() : "0"} />
          <StatCard label="Current Round" value={`#${bidding.currentRoundId}`} />
        </div>

        {/* How it Works */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-xl mb-4">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="text-white font-bold mb-1">12-Hour Rounds</h3>
              <p className="text-gray-500 text-sm">
                Ads display 00:00-12:00 and 12:00-00:00 UTC
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="text-white font-bold mb-1">30-Min Bidding</h3>
              <p className="text-gray-500 text-sm">
                Bid window opens 30 min before each round
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="text-white font-bold mb-1">Highest Wins</h3>
              <p className="text-gray-500 text-sm">
                Top bid wins. Losers get full refund.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="text-white font-bold mb-1">Buyback & Burn</h3>
              <p className="text-gray-500 text-sm">
                Revenue buys & burns $BB tokens daily
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
  highestBid: number;
  highestBidder: string;
  biddingOpen: boolean;
  label: string;
  labelColor: string;
  minBidLabel: string;
  size: "large" | "small";
  loading: boolean;
}

function BillboardSlot({ slot, highestBid, highestBidder, biddingOpen, label, labelColor, minBidLabel, size, loading }: BillboardSlotProps) {
  const isLarge = size === "large";
  const hasCurrentAd = slot.isActive && slot.advertiser !== "0x0000000000000000000000000000000000000000";
  const hasBids = highestBid > 0;

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
            <span className={`font-bold ${hasCurrentAd ? "text-white" : "text-gray-500"}`}>
              {hasCurrentAd ? slot.title : "No Active Ad"}
            </span>
            {hasCurrentAd && (
              <span className="text-gray-500 text-sm">by {shortenAddress(slot.advertiser)}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {hasCurrentAd ? (
              <>
                <span className="text-green-400 font-mono">${slot.bidAmount} USDC</span>
                <span className="text-gray-500">{formatTime(slot.timeRemaining)} left</span>
              </>
            ) : (
              <span className="text-gray-500">Waiting for winner</span>
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

      {/* Bidding Info */}
      <div className="mt-3 bg-gray-900/50 border border-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            {biddingOpen ? (
              <div>
                <span className="text-green-400 text-sm font-bold">BIDDING OPEN</span>
                {hasBids ? (
                  <p className="text-gray-400 text-sm">
                    Highest: <span className="text-white font-mono">${highestBid}</span> by {shortenAddress(highestBidder)}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm">No bids yet. Start at {minBidLabel}</p>
                )}
              </div>
            ) : (
              <div>
                <span className="text-yellow-400 text-sm font-bold">BIDDING CLOSED</span>
                <p className="text-gray-400 text-sm">
                  {hasBids ? `Winner: ${shortenAddress(highestBidder)} with $${highestBid}` : "No bids for next round"}
                </p>
              </div>
            )}
          </div>
          <Link
            href={`/docs#slot-${slot.slot}`}
            className={`text-sm font-bold px-4 py-2 rounded ${
              biddingOpen
                ? isLarge
                  ? "bg-purple-500 hover:bg-purple-400 text-white"
                  : "bg-yellow-500 hover:bg-yellow-400 text-black"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            } transition-colors`}
          >
            {biddingOpen ? "Place Bid" : "Closed"}
          </Link>
        </div>
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
