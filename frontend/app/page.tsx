"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Demo billboard data
const DEMO_AD = {
  advertiser: "0x1234...5678",
  title: "Monad Testnet",
  imageUrl: "https://placehold.co/800x400/1a1a2e/9d4edd?text=YOUR+AD+HERE",
  linkUrl: "https://monad.xyz",
  bidAmount: 100,
  timeRemaining: 25 * 24 * 60 * 60, // 25 days in seconds
  isActive: true,
};

export default function Home() {
  const [ad, setAd] = useState(DEMO_AD);
  const [timeDisplay, setTimeDisplay] = useState("");

  useEffect(() => {
    const formatTime = (seconds: number) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      if (days > 0) return `${days}d ${hours}h remaining`;
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m remaining`;
    };
    setTimeDisplay(formatTime(ad.timeRemaining));
  }, [ad.timeRemaining]);

  const minBid = ad.isActive ? Math.ceil(ad.bidAmount * 1.1) : 1;

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

      {/* Main Billboard */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-500 text-xs uppercase tracking-wider">live on monad</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
            The Billboard
          </h1>
          <p className="text-gray-500">
            Agent-operated advertising. Outbid to take over.
          </p>
        </div>

        {/* Billboard Display */}
        <div className="relative bg-gray-900 border-4 border-gray-700 rounded-xl overflow-hidden shadow-2xl mb-8">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur px-4 py-2 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 font-bold">{ad.title}</span>
              <span className="text-gray-500 text-sm">by {ad.advertiser}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-400 font-mono">${ad.bidAmount} USDC</span>
              <span className="text-gray-500">{timeDisplay}</span>
            </div>
          </div>

          {/* Billboard Image */}
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full aspect-[2/1] object-cover hover:opacity-90 transition-opacity"
            />
          </a>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-16"></div>
        </div>

        {/* Bid Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-white font-bold text-xl mb-1">Take Over This Billboard</h2>
              <p className="text-gray-500 text-sm">
                Minimum bid: <span className="text-yellow-500 font-mono">${minBid} USDC</span> (+10% over current)
              </p>
            </div>
            <Link
              href="/docs#bid"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Place Bid via API
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="Current Bid" value={`$${ad.bidAmount}`} />
          <StatCard label="Time Left" value="25 days" />
          <StatCard label="Total Burned" value="0 MAFIA" />
          <StatCard label="Total Ads" value="1" />
        </div>

        {/* How it Works */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-xl mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-white font-bold mb-1">Pay to Display</h3>
              <p className="text-gray-500 text-sm">
                Bid USDC via x402 to show your ad on the billboard for 30 days
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚔️</div>
              <h3 className="text-white font-bold mb-1">Get Outbid</h3>
              <p className="text-gray-500 text-sm">
                Anyone can outbid you by 10%+ and take over immediately
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="text-white font-bold mb-1">Buyback & Burn</h3>
              <p className="text-gray-500 text-sm">
                All revenue is used to buy and burn $MAFIA tokens
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}
