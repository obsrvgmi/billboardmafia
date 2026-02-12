"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, memo } from "react";

// ===== INTERFACES (preserved) =====
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

// ===== DEMO DATA (preserved) =====
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

// ===== UTILITY FUNCTIONS (preserved) =====
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

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";
const DEMO_IMAGE_MAIN = "ipfs://bafkreifbnrrw2g7kgpwdlchrze6msnvynv33jhiuwf4vx66o65w4yltvqm";
const DEMO_IMAGE_SECONDARY = "ipfs://bafkreibokwwmsjknf3ge5oq5fr6e3pk37pv7tgfhfwprdw33zfadrmmhpm";

function resolveImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    return `${IPFS_GATEWAY}/${url.slice(7)}`;
  }
  return url;
}

// ===== PRE-DEFINED DATA (hydration-safe) =====
const WIND_PARTICLES = [
  { w: 14, h: 2, top: 12, delay: 0, duration: 28, opacity: 0.07 },
  { w: 8, h: 1, top: 28, delay: 4, duration: 35, opacity: 0.05 },
  { w: 18, h: 2, top: 8, delay: 9, duration: 24, opacity: 0.09 },
  { w: 6, h: 1, top: 52, delay: 14, duration: 32, opacity: 0.04 },
  { w: 12, h: 2, top: 70, delay: 6, duration: 38, opacity: 0.06 },
  { w: 20, h: 2, top: 40, delay: 19, duration: 22, opacity: 0.05 },
  { w: 10, h: 1, top: 85, delay: 11, duration: 30, opacity: 0.08 },
  { w: 16, h: 2, top: 20, delay: 16, duration: 26, opacity: 0.04 },
  { w: 7, h: 1, top: 62, delay: 2, duration: 34, opacity: 0.06 },
  { w: 22, h: 2, top: 45, delay: 22, duration: 20, opacity: 0.03 },
  { w: 9, h: 1, top: 33, delay: 8, duration: 29, opacity: 0.05 },
  { w: 15, h: 2, top: 78, delay: 13, duration: 31, opacity: 0.07 },
];

const BUILDING_VARIANTS = [
  { width: 60, height: 140, windows: [[10, 20], [30, 20], [10, 45], [30, 45], [10, 70], [30, 70], [10, 95], [30, 95]], litWindows: [0, 2, 4, 7] },
  { width: 45, height: 100, windows: [[8, 15], [25, 15], [8, 38], [25, 38], [8, 61], [25, 61]], litWindows: [1, 3, 5] },
  { width: 70, height: 170, windows: [[10, 20], [30, 20], [50, 20], [10, 48], [30, 48], [50, 48], [10, 76], [30, 76], [50, 76], [10, 104], [30, 104], [50, 104]], litWindows: [0, 3, 5, 8, 10] },
  { width: 40, height: 80, windows: [[8, 15], [22, 15], [8, 38], [22, 38], [8, 61], [22, 61]], litWindows: [0, 4] },
  { width: 55, height: 120, windows: [[10, 18], [28, 18], [10, 43], [28, 43], [10, 68], [28, 68], [10, 93], [28, 93]], litWindows: [1, 2, 5, 6] },
  { width: 50, height: 155, windows: [[10, 20], [28, 20], [10, 48], [28, 48], [10, 76], [28, 76], [10, 104], [28, 104], [10, 132], [28, 132]], litWindows: [0, 3, 4, 7, 9] },
  { width: 35, height: 65, windows: [[7, 12], [20, 12], [7, 32], [20, 32]], litWindows: [1, 2] },
];

const STARS = [
  // Row 1 (y: 1-5)
  { x: 3, y: 2, s: 1, o: 0.6 }, { x: 9, y: 4, s: 1.5, o: 0.9 }, { x: 16, y: 1, s: 1, o: 0.4 },
  { x: 24, y: 3, s: 2, o: 0.8 }, { x: 33, y: 5, s: 1, o: 0.5 }, { x: 38, y: 1, s: 1, o: 0.9 },
  { x: 47, y: 4, s: 1.5, o: 0.7 }, { x: 55, y: 2, s: 1, o: 0.6 }, { x: 63, y: 5, s: 2, o: 0.8 },
  { x: 71, y: 3, s: 1, o: 0.5 }, { x: 80, y: 1, s: 1.5, o: 0.9 }, { x: 89, y: 4, s: 1, o: 0.7 },
  { x: 96, y: 2, s: 1, o: 0.4 },
  // Row 2 (y: 6-10)
  { x: 5, y: 8, s: 1, o: 0.7 }, { x: 12, y: 6, s: 1.5, o: 0.5 }, { x: 20, y: 9, s: 1, o: 0.8 },
  { x: 29, y: 7, s: 2, o: 0.6 }, { x: 36, y: 10, s: 1, o: 0.9 }, { x: 44, y: 8, s: 1.5, o: 0.4 },
  { x: 52, y: 6, s: 1, o: 0.7 }, { x: 58, y: 9, s: 2, o: 0.8 }, { x: 67, y: 7, s: 1, o: 0.5 },
  { x: 75, y: 10, s: 1.5, o: 0.9 }, { x: 83, y: 8, s: 1, o: 0.6 }, { x: 92, y: 6, s: 1, o: 0.7 },
  // Row 3 (y: 11-16)
  { x: 2, y: 13, s: 1, o: 0.5 }, { x: 10, y: 15, s: 1.5, o: 0.8 }, { x: 18, y: 11, s: 1, o: 0.6 },
  { x: 26, y: 14, s: 2, o: 0.7 }, { x: 34, y: 12, s: 1, o: 0.4 }, { x: 42, y: 16, s: 1.5, o: 0.9 },
  { x: 50, y: 13, s: 1, o: 0.5 }, { x: 57, y: 11, s: 1, o: 0.8 }, { x: 65, y: 15, s: 2, o: 0.6 },
  { x: 73, y: 12, s: 1, o: 0.7 }, { x: 81, y: 14, s: 1.5, o: 0.4 }, { x: 90, y: 16, s: 1, o: 0.9 },
  // Row 4 (y: 17-24)
  { x: 7, y: 19, s: 1, o: 0.6 }, { x: 15, y: 22, s: 1.5, o: 0.7 }, { x: 23, y: 18, s: 1, o: 0.4 },
  { x: 31, y: 21, s: 2, o: 0.8 }, { x: 40, y: 24, s: 1, o: 0.5 }, { x: 48, y: 19, s: 1.5, o: 0.9 },
  { x: 56, y: 23, s: 1, o: 0.6 }, { x: 64, y: 20, s: 1, o: 0.7 }, { x: 72, y: 17, s: 2, o: 0.4 },
  { x: 79, y: 22, s: 1, o: 0.8 }, { x: 87, y: 18, s: 1.5, o: 0.5 }, { x: 95, y: 21, s: 1, o: 0.6 },
  // Extra scattered (y: 25-35)
  { x: 4, y: 28, s: 1, o: 0.3 }, { x: 19, y: 30, s: 1.5, o: 0.4 }, { x: 37, y: 27, s: 1, o: 0.5 },
  { x: 53, y: 32, s: 1, o: 0.3 }, { x: 70, y: 29, s: 1.5, o: 0.4 }, { x: 86, y: 26, s: 1, o: 0.5 },
];

const SHOOTING_STARS = [
  { x: 15, y: 5, delay: 0, duration: 8 },
  { x: 45, y: 3, delay: 12, duration: 10 },
  { x: 72, y: 8, delay: 6, duration: 9 },
  { x: 30, y: 2, delay: 20, duration: 11 },
  { x: 85, y: 6, delay: 16, duration: 7 },
  { x: 55, y: 10, delay: 25, duration: 12 },
];

const BIRDS = [
  { x: -5, y: 18, delay: 0, duration: 16, size: 14, flapSpeed: 0.6 },
  { x: -8, y: 12, delay: 4, duration: 20, size: 11, flapSpeed: 0.5 },
  { x: -3, y: 25, delay: 9, duration: 14, size: 16, flapSpeed: 0.7 },
  { x: -6, y: 8, delay: 15, duration: 22, size: 10, flapSpeed: 0.55 },
  { x: -10, y: 22, delay: 7, duration: 18, size: 13, flapSpeed: 0.65 },
  { x: -4, y: 15, delay: 12, duration: 15, size: 12, flapSpeed: 0.5 },
  { x: -7, y: 30, delay: 20, duration: 17, size: 9, flapSpeed: 0.7 },
];

const CLOUDS = [
  { x: 8, y: 8, w: 120, h: 28, o: 0.5, delay: 0 },
  { x: 35, y: 16, w: 80, h: 20, o: 0.35, delay: 3 },
  { x: 62, y: 5, w: 140, h: 32, o: 0.4, delay: 6 },
  { x: 85, y: 20, w: 90, h: 22, o: 0.3, delay: 9 },
];

// ===== WIND PARTICLES =====
const WindParticles = memo(function WindParticles({ isNight }: { isNight: boolean }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {WIND_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute wind-particle"
          style={{
            width: p.w,
            height: p.h,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: isNight ? p.opacity : p.opacity * 0.3,
            background: isNight ? undefined : "rgba(180, 160, 120, 0.25)",
          }}
        />
      ))}
    </div>
  );
});

// ===== BUILDING SVG =====
function BuildingSVG({ variant, x, isNight }: { variant: number; x: number; isNight: boolean }) {
  const b = BUILDING_VARIANTS[variant % BUILDING_VARIANTS.length];
  const y = 280 - b.height;
  const fill = isNight ? "#0f0f18" : "#303842";
  const stroke = isNight ? "#1e1e2e" : "#445060";
  const roof = isNight ? "#1a1a28" : "#3a4450";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={b.width} height={b.height} fill={fill} stroke={stroke} strokeWidth="0.5" />
      <rect x="-1" y="-2" width={b.width + 2} height="3" fill={roof} />
      {b.windows.map(([wx, wy], i) => {
        const lit = b.litWindows.includes(i);
        if (isNight) {
          return (
            <g key={i}>
              <rect x={wx} y={wy} width={12} height={16} fill={lit ? "#d4a030" : "#111118"} opacity={lit ? 0.5 : 0.4} />
              {lit && <rect x={wx - 2} y={wy - 2} width={16} height={20} fill="#f59e0b" opacity={0.06} />}
            </g>
          );
        }
        return (
          <g key={i}>
            <rect x={wx} y={wy} width={12} height={16} fill={lit ? "#7ab0d4" : "#4a6878"} opacity={0.45} />
            {lit && <rect x={wx} y={wy} width={12} height={16} fill="#fff" opacity={0.05} />}
          </g>
        );
      })}
    </g>
  );
}

// ===== VEHICLES =====
function CrabCarSVG() {
  return (
    <svg width="120" height="60" viewBox="0 0 120 60" className="animate-v-bounce">
      <ellipse cx="60" cy="56" rx="48" ry="4" fill="rgba(0,0,0,0.3)" />
      <rect x="10" y="26" width="100" height="24" fill="#2a2a3d" />
      <rect x="25" y="12" width="60" height="18" fill="#33334a" />
      <rect x="30" y="14" width="22" height="13" fill="#1a1a28" />
      <rect x="30" y="14" width="22" height="13" fill="#f59e0b" opacity="0.1" />
      <rect x="56" y="14" width="22" height="13" fill="#1a1a28" />
      <rect x="56" y="14" width="22" height="13" fill="#f59e0b" opacity="0.1" />
      <rect x="18" y="48" width="22" height="10" fill="#111118" />
      <rect x="73" y="48" width="22" height="10" fill="#111118" />
      <rect x="24" y="50" width="10" height="6" fill="#3d3d50" />
      <rect x="79" y="50" width="10" height="6" fill="#3d3d50" />
      <ellipse cx="55" cy="17" rx="7" ry="5" fill="#c2742e" />
      <line x1="50" y1="13" x2="48" y2="6" stroke="#c2742e" strokeWidth="1.5" />
      <line x1="60" y1="13" x2="62" y2="6" stroke="#c2742e" strokeWidth="1.5" />
      <circle cx="48" cy="5" r="2.5" fill="#e8a850" />
      <circle cx="62" cy="5" r="2.5" fill="#e8a850" />
      <circle cx="48" cy="5" r="1.2" fill="#0b0b10" />
      <circle cx="62" cy="5" r="1.2" fill="#0b0b10" />
      <path d="M44 20 L38 25 L42 22" stroke="#c2742e" strokeWidth="1.5" fill="none" />
      <path d="M66 20 L72 25 L68 22" stroke="#c2742e" strokeWidth="1.5" fill="none" />
      <rect x="106" y="30" width="5" height="6" fill="#f5d78e" opacity="0.9" />
      <rect x="10" y="32" width="4" height="5" fill="#ef4444" opacity="0.7" />
    </svg>
  );
}

function CrabMotorcycleSVG() {
  return (
    <svg width="80" height="50" viewBox="0 0 80 50" className="animate-v-bounce">
      <ellipse cx="40" cy="46" rx="28" ry="3" fill="rgba(0,0,0,0.3)" />
      <rect x="15" y="26" width="50" height="10" fill="#2a2a3d" />
      <polygon points="55,22 65,26 55,26" fill="#33334a" />
      <polygon points="25,22 15,26 25,26" fill="#33334a" />
      <rect x="10" y="36" width="14" height="10" fill="#111118" />
      <rect x="52" y="36" width="14" height="10" fill="#111118" />
      <rect x="14" y="38" width="6" height="6" fill="#3d3d50" />
      <rect x="56" y="38" width="6" height="6" fill="#3d3d50" />
      <line x1="55" y1="24" x2="62" y2="15" stroke="#4a4a5c" strokeWidth="2.5" />
      <line x1="58" y1="15" x2="66" y2="15" stroke="#4a4a5c" strokeWidth="2.5" />
      <ellipse cx="40" cy="19" rx="6" ry="4.5" fill="#c2742e" />
      <line x1="36" y1="15" x2="34" y2="8" stroke="#c2742e" strokeWidth="1.5" />
      <line x1="44" y1="15" x2="46" y2="8" stroke="#c2742e" strokeWidth="1.5" />
      <circle cx="34" cy="7" r="2" fill="#e8a850" />
      <circle cx="46" cy="7" r="2" fill="#e8a850" />
      <circle cx="34" cy="7" r="1" fill="#0b0b10" />
      <circle cx="46" cy="7" r="1" fill="#0b0b10" />
      <path d="M48 19 L56 17 L52 15" stroke="#c2742e" strokeWidth="1.5" fill="none" />
      <path d="M32 19 L26 21 L28 18" stroke="#c2742e" strokeWidth="1.5" fill="none" />
      <rect x="63" y="18" width="4" height="4" fill="#f5d78e" opacity="0.7" />
    </svg>
  );
}

function CrabBicycleSVG() {
  return (
    <svg width="55" height="42" viewBox="0 0 55 42" className="animate-v-bounce">
      <ellipse cx="28" cy="39" rx="20" ry="2" fill="rgba(0,0,0,0.2)" />
      {/* Back wheel */}
      <circle cx="12" cy="32" r="7" fill="none" stroke="#3d3d50" strokeWidth="1.5" />
      <circle cx="12" cy="32" r="1.5" fill="#3d3d50" />
      {/* Front wheel */}
      <circle cx="43" cy="32" r="7" fill="none" stroke="#3d3d50" strokeWidth="1.5" />
      <circle cx="43" cy="32" r="1.5" fill="#3d3d50" />
      {/* Frame */}
      <line x1="12" y1="32" x2="27" y2="20" stroke="#4a4a5c" strokeWidth="1.5" />
      <line x1="27" y1="20" x2="43" y2="32" stroke="#4a4a5c" strokeWidth="1.5" />
      <line x1="27" y1="20" x2="20" y2="32" stroke="#4a4a5c" strokeWidth="1.5" />
      {/* Seat */}
      <rect x="24" y="18" width="7" height="2" fill="#33334a" />
      {/* Handlebars */}
      <line x1="41" y1="28" x2="45" y2="18" stroke="#4a4a5c" strokeWidth="1.5" />
      <line x1="41" y1="18" x2="49" y2="18" stroke="#4a4a5c" strokeWidth="1.5" />
      {/* Crab rider */}
      <ellipse cx="28" cy="14" rx="4.5" ry="3" fill="#c2742e" />
      <line x1="25" y1="11" x2="23" y2="6" stroke="#c2742e" strokeWidth="1" />
      <line x1="31" y1="11" x2="33" y2="6" stroke="#c2742e" strokeWidth="1" />
      <circle cx="23" cy="5.5" r="1.5" fill="#e8a850" />
      <circle cx="33" cy="5.5" r="1.5" fill="#e8a850" />
      <circle cx="23" cy="5.5" r="0.7" fill="#0b0b10" />
      <circle cx="33" cy="5.5" r="0.7" fill="#0b0b10" />
      <path d="M33 14 L41 18 L37 16" stroke="#c2742e" strokeWidth="1" fill="none" />
    </svg>
  );
}

// ===== CELESTIAL BODIES =====
function SunMoon({ isNight }: { isNight: boolean }) {
  if (isNight) {
    return (
      <div className="absolute top-14 sm:top-16 right-[10%] sm:right-[14%] z-[2] transition-all duration-1000">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="rgba(200,220,255,0.04)" />
          <circle cx="24" cy="24" r="16" fill="rgba(200,220,255,0.06)" />
          <circle cx="24" cy="24" r="11" fill="#c8d8f0" />
          <circle cx="29" cy="21" r="9" fill="#050510" />
          <circle cx="19" cy="27" r="1.5" fill="rgba(0,0,0,0.08)" />
          <circle cx="23" cy="30" r="1" fill="rgba(0,0,0,0.06)" />
        </svg>
      </div>
    );
  }
  return (
    <div className="absolute top-10 sm:top-14 right-[14%] sm:right-[18%] z-[2] transition-all duration-1000">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="28" fill="rgba(255,200,50,0.04)" />
        <circle cx="30" cy="30" r="22" fill="rgba(255,200,50,0.08)" />
        <circle cx="30" cy="30" r="16" fill="rgba(255,220,100,0.12)" />
        <circle cx="30" cy="30" r="10" fill="#FFD700" />
        <circle cx="30" cy="30" r="10" fill="rgba(255,255,255,0.25)" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a}
            x1={30 + Math.cos((a * Math.PI) / 180) * 13}
            y1={30 + Math.sin((a * Math.PI) / 180) * 13}
            x2={30 + Math.cos((a * Math.PI) / 180) * 19}
            y2={30 + Math.sin((a * Math.PI) / 180) * 19}
            stroke="#FFD700"
            strokeWidth="1.5"
            opacity="0.5"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
}

const StarField = memo(function StarField() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      {STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.s,
            height: star.s,
            opacity: star.o * 0.5,
            animation: `starTwinkle ${3 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.7) % 4}s`,
          }}
        />
      ))}
    </div>
  );
});

function DayClouds() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute animate-fog-drift"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: c.w,
            height: c.h,
            background: `radial-gradient(ellipse, rgba(255,255,255,${c.o}) 0%, transparent 70%)`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ===== SHOOTING STARS (night only) =====
const ShootingStars = memo(function ShootingStars() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {SHOOTING_STARS.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 0 4px 1px rgba(255,255,255,0.6), -12px 8px 8px 1px rgba(200,220,255,0.15)",
            animation: `shootingStar ${s.duration}s linear infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
});

// ===== FLYING BIRDS (day only) =====
const FlyingBirds = memo(function FlyingBirds() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
      {BIRDS.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            animation: `driveRight ${b.duration}s linear infinite`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <svg
            width={b.size * 2.5}
            height={b.size}
            viewBox="0 0 30 12"
            style={{
              animation: `birdFlap ${b.flapSpeed}s ease-in-out infinite`,
              animationDelay: `${b.delay * 0.3}s`,
            }}
          >
            <path
              d="M15 8 Q10 2 2 4 Q10 5 15 8 Q20 5 28 4 Q20 2 15 8"
              fill="#1a1a28"
              opacity="0.7"
            />
          </svg>
        </div>
      ))}
    </div>
  );
});

// ===== CITY SKYLINE (background behind billboard) =====
const CitySkyline = memo(function CitySkyline({ isNight }: { isNight: boolean }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none z-[2]"
      style={{ height: "clamp(200px, 40vw, 450px)" }}
    >
      <svg
        className="absolute bottom-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1400 280"
      >
        <BuildingSVG variant={0} x={20} isNight={isNight} />
        <BuildingSVG variant={2} x={100} isNight={isNight} />
        <BuildingSVG variant={1} x={190} isNight={isNight} />
        <BuildingSVG variant={4} x={260} isNight={isNight} />
        <BuildingSVG variant={3} x={340} isNight={isNight} />
        <BuildingSVG variant={5} x={400} isNight={isNight} />
        <BuildingSVG variant={6} x={470} isNight={isNight} />
        <BuildingSVG variant={0} x={530} isNight={isNight} />
        <BuildingSVG variant={2} x={610} isNight={isNight} />
        <BuildingSVG variant={4} x={700} isNight={isNight} />
        <BuildingSVG variant={1} x={775} isNight={isNight} />
        <BuildingSVG variant={3} x={840} isNight={isNight} />
        <BuildingSVG variant={5} x={900} isNight={isNight} />
        <BuildingSVG variant={6} x={970} isNight={isNight} />
        <BuildingSVG variant={0} x={1020} isNight={isNight} />
        <BuildingSVG variant={2} x={1100} isNight={isNight} />
        <BuildingSVG variant={4} x={1190} isNight={isNight} />
        <BuildingSVG variant={1} x={1270} isNight={isNight} />
        <BuildingSVG variant={3} x={1340} isNight={isNight} />
      </svg>
      {/* Atmospheric haze at base */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40px] sm:h-[60px]"
        style={{
          background: isNight
            ? "linear-gradient(180deg, transparent 0%, rgba(11,11,16,0.85) 100%)"
            : "linear-gradient(180deg, transparent 0%, rgba(100,140,170,0.5) 100%)",
        }}
      />
    </div>
  );
});

// ===== ROAD =====
const RoadScene = memo(function RoadScene({ isNight }: { isNight: boolean }) {
  return (
    <div className="relative w-full overflow-hidden h-[70px] sm:h-[85px] md:h-[105px]">
      {/* Sidewalk / curb */}
      <div
        className="absolute bottom-[42px] sm:bottom-[53px] md:bottom-[68px] left-0 right-0 h-[5px] sm:h-[7px] md:h-[9px]"
        style={{
          background: isNight
            ? "linear-gradient(180deg, #2a2a3d 0%, #1a1a28 100%)"
            : "linear-gradient(180deg, #8a8890 0%, #706e78 100%)",
        }}
      />

      {/* Road surface */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[42px] sm:h-[53px] md:h-[68px]"
        style={{
          background: isNight
            ? "linear-gradient(180deg, #161620 0%, #111118 40%, #0d0d14 100%)"
            : "linear-gradient(180deg, #4a4a54 0%, #3d3d46 40%, #353540 100%)",
        }}
      >
        {/* Center dashes */}
        <div className="road-dashes absolute top-[19px] sm:top-[24px] md:top-[32px] left-0 right-0" />
        {/* Road texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 0.3px, transparent 0.3px)", backgroundSize: "6px 6px" }}
        />
      </div>

      {/* Vehicles - upper lane (driving right, varied speeds) */}
      <div className="absolute bottom-[28px] sm:bottom-[36px] md:bottom-[46px] left-0 right-0">
        {/* Slow car */}
        <div className="absolute animate-drive-right-slow">
          <div className="scale-[0.45] sm:scale-[0.55] md:scale-[0.65] origin-bottom-left">
            <CrabCarSVG />
          </div>
        </div>
        {/* Fast motorcycle */}
        <div className="absolute animate-drive-right-fast" style={{ animationDelay: "5s" }}>
          <div className="scale-[0.35] sm:scale-[0.45] md:scale-[0.55] origin-bottom-left">
            <CrabMotorcycleSVG />
          </div>
        </div>
        {/* Crawling bicycle */}
        <div className="absolute animate-drive-right-crawl" style={{ animationDelay: "9s" }}>
          <div className="scale-[0.4] sm:scale-[0.5] md:scale-[0.6] origin-bottom-left">
            <CrabBicycleSVG />
          </div>
        </div>
        {/* Medium car */}
        <div className="absolute animate-drive-right-med" style={{ animationDelay: "14s" }}>
          <div className="scale-[0.4] sm:scale-[0.5] md:scale-[0.6] origin-bottom-left">
            <CrabCarSVG />
          </div>
        </div>
      </div>

      {/* Vehicles - lower lane (driving left, varied speeds) */}
      <div className="absolute bottom-[12px] sm:bottom-[16px] md:bottom-[20px] left-0 right-0">
        {/* Rush motorcycle */}
        <div className="absolute animate-drive-left-rush" style={{ animationDelay: "2s" }}>
          <div className="scale-[0.35] sm:scale-[0.45] md:scale-[0.55] origin-bottom-left" style={{ transform: "scaleX(-1)" }}>
            <CrabMotorcycleSVG />
          </div>
        </div>
        {/* Medium car */}
        <div className="absolute animate-drive-left-med" style={{ animationDelay: "6s" }}>
          <div className="scale-[0.45] sm:scale-[0.55] md:scale-[0.65] origin-bottom-left" style={{ transform: "scaleX(-1)" }}>
            <CrabCarSVG />
          </div>
        </div>
        {/* Slow bicycle */}
        <div className="absolute animate-drive-left-slow" style={{ animationDelay: "10s" }}>
          <div className="scale-[0.38] sm:scale-[0.48] md:scale-[0.58] origin-bottom-left" style={{ transform: "scaleX(-1)" }}>
            <CrabBicycleSVG />
          </div>
        </div>
        {/* Fast car */}
        <div className="absolute animate-drive-left-fast" style={{ animationDelay: "15s" }}>
          <div className="scale-[0.42] sm:scale-[0.52] md:scale-[0.62] origin-bottom-left" style={{ transform: "scaleX(-1)" }}>
            <CrabCarSVG />
          </div>
        </div>
      </div>

      {/* Ground fog (night only) */}
      {isNight && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[12px] sm:h-[16px] animate-fog-drift"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(11,11,16,0.5) 100%)" }}
        />
      )}
    </div>
  );
});

// ===== SOUND FUNCTIONS =====

// Traditional "pip pip" car horn - two short beeps
function playCarHorn(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;
    for (let p = 0; p < 2; p++) {
      const t = now + p * 0.18;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.value = 370;
      osc2.frequency.value = 466;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.008);
      gain.gain.setValueAtTime(0.05, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.12);
      osc2.stop(t + 0.12);
    }
  } catch { /* ignore */ }
}

// Car engine pass with noise-based rumble and Doppler
function playCarEngine(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;
    const dur = 2.5;
    const size = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1;
      d[i] = (prev + 0.02 * w) / 1.02;
      prev = d[i];
      d[i] *= 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.5;
    bp.frequency.setValueAtTime(90, now);
    bp.frequency.linearRampToValueAtTime(220, now + dur * 0.4);
    bp.frequency.linearRampToValueAtTime(70, now + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + dur * 0.35);
    gain.gain.linearRampToValueAtTime(0.035, now + dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(bp).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  } catch { /* ignore */ }
}

// Bicycle bell - quick double ding
function playBikeBell(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch { /* ignore */ }
}

// Bird chirp - rapid frequency modulation tweet
function playBirdChirp(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;
    // 2-3 rapid chirps
    const chirps = 2 + Math.floor(Math.random() * 2);
    for (let c = 0; c < chirps; c++) {
      const t = now + c * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      // Rapid pitch sweep up then down
      osc.frequency.setValueAtTime(2400 + Math.random() * 800, t);
      osc.frequency.linearRampToValueAtTime(3400 + Math.random() * 600, t + 0.04);
      osc.frequency.linearRampToValueAtTime(2200 + Math.random() * 400, t + 0.08);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.02, t + 0.01);
      gain.gain.setValueAtTime(0.02, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  } catch { /* ignore */ }
}

// Motorcycle engine pass - higher pitched, grittier
function playBikeEngine(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;
    const dur = 1.8;
    const size = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1;
      d[i] = (prev + 0.04 * w) / 1.04;
      prev = d[i];
      d[i] *= 4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(200, now);
    bp.frequency.linearRampToValueAtTime(500, now + dur * 0.35);
    bp.frequency.linearRampToValueAtTime(150, now + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.03, now + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(bp).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  } catch { /* ignore */ }
}

// ===== MENUBAR =====
function Menubar({
  biddingOpen,
  countdown,
  isNight,
  onToggleMode,
  soundEnabled,
  onToggleSound,
}: {
  biddingOpen: boolean;
  countdown: { bidding: number; round: number };
  isNight: boolean;
  onToggleMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brutal-surface/90 backdrop-blur-md border-b-2 border-brutal-border safe-top">
      <div className="max-w-[1400px] mx-auto h-10 sm:h-11 flex items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-brutal-accent animate-pulse-glow flex-shrink-0" />
          <span className="text-label text-[10px] sm:text-xs md:text-sm font-bold text-brutal-text tracking-widest truncate">
            BILLBOARD MAFIA
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Bidding status */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 border border-brutal-border/50 bg-brutal-bg/50">
            <div className={`w-1.5 h-1.5 flex-shrink-0 ${biddingOpen ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
            <span className={`text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-wider ${biddingOpen ? "text-green-400" : "text-amber-400"}`}>
              {biddingOpen ? "LIVE" : "CLOSED"}
            </span>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] text-brutal-muted font-mono hidden sm:inline">
              {biddingOpen ? formatTime(countdown.round) : formatTime(countdown.bidding)}
            </span>
          </div>
          <div className="w-px h-4 sm:h-5 bg-brutal-border/40" />
          {/* Day/Night toggle */}
          <button
            onClick={onToggleMode}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-brutal-muted hover:text-brutal-text border border-transparent hover:border-brutal-border/40 transition-all"
            title={isNight ? "Switch to Day" : "Switch to Night"}
          >
            {isNight ? (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>
          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-brutal-muted hover:text-brutal-text border border-transparent hover:border-brutal-border/40 transition-all"
            title={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
          <div className="w-px h-4 sm:h-5 bg-brutal-border/40 hidden md:block" />
          <Link href="/docs" className="text-[11px] sm:text-xs font-bold text-brutal-muted hover:text-brutal-glow tracking-wider transition-colors hidden md:inline">
            DOCS
          </Link>
        </div>
      </div>
    </header>
  );
}

// ===== STAT CARD =====
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brutal-card border border-brutal-border sm:border-2 p-3 sm:p-4 md:p-5 text-center hover:border-brutal-accent/40 transition-colors">
      <p className="text-base sm:text-xl md:text-3xl font-black text-brutal-text tracking-tight">{value}</p>
      <p className="text-label text-[8px] sm:text-[10px] md:text-xs text-brutal-muted mt-1 sm:mt-1.5 font-bold">{label}</p>
    </div>
  );
}

// ===== BILLBOARD STAND =====
function BillboardStand() {
  return (
    <div className="flex justify-center relative z-[2]">
      <div className="relative" style={{ width: "55%", maxWidth: 500 }}>
        {/* Connection plate */}
        <div
          className="mx-auto h-[3px] sm:h-[4px]"
          style={{
            width: "70%",
            background: "linear-gradient(90deg, transparent, #48485a 20%, #52526a 50%, #48485a 80%, transparent)",
          }}
        />

        {/* Two heavy steel poles */}
        <div className="flex justify-between px-[25%]">
          <div className="billboard-pole w-[12px] sm:w-[16px] md:w-[20px] h-[80px] sm:h-[110px] md:h-[140px]" />
          <div className="billboard-pole w-[12px] sm:w-[16px] md:w-[20px] h-[80px] sm:h-[110px] md:h-[140px]" />
        </div>

        {/* Horizontal brace */}
        <div
          className="absolute left-[25%] right-[25%] top-[45%]"
          style={{
            height: 3,
            background: "linear-gradient(90deg, #28283a, #44445c 50%, #28283a)",
          }}
        />

        {/* Concrete footing */}
        <div className="billboard-base h-[5px] sm:h-[6px] md:h-[8px] w-[80%] mx-auto" />
      </div>
    </div>
  );
}

// ===== BILLBOARD SLOT =====
interface BillboardSlotProps {
  slot: SlotData;
  isMain: boolean;
  loading: boolean;
}

function BillboardSlot({ slot, isMain, loading }: BillboardSlotProps) {
  const hasCurrentAd = slot.isActive && slot.advertiser !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="relative">
      {/* Realistic metal frame with depth */}
      <div className="billboard-frame p-[4px] sm:p-[6px] md:p-[8px] lg:p-[10px] relative">
        {/* Corner rivets */}
        <div className="absolute top-[5px] left-[5px] billboard-rivet z-20" />
        <div className="absolute top-[5px] right-[5px] billboard-rivet z-20" />
        <div className="absolute bottom-[5px] left-[5px] billboard-rivet z-20" />
        <div className="absolute bottom-[5px] right-[5px] billboard-rivet z-20" />
        {/* Mid rivets on top/bottom edges */}
        <div className="absolute top-[5px] left-1/4 billboard-rivet z-20" />
        <div className="absolute top-[5px] left-3/4 billboard-rivet z-20" />
        <div className="absolute bottom-[5px] left-1/4 billboard-rivet z-20" />
        <div className="absolute bottom-[5px] left-3/4 billboard-rivet z-20" />

        {/* Inner bezel */}
        <div className="billboard-bezel relative">
          {/* LED Screen */}
          <div className="relative led-screen led-glow bg-black overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-brutal-glow/40 border-t-brutal-glow animate-spin" />
              </div>
            )}

            {/* Status bar overlay */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                <span className={`text-[8px] sm:text-[10px] md:text-xs font-bold tracking-wider truncate ${hasCurrentAd ? "text-white/90" : "text-white/30"}`}>
                  {hasCurrentAd ? slot.title : "NO ACTIVE AD"}
                </span>
                {hasCurrentAd && (
                  <span className="text-[8px] sm:text-[10px] md:text-[11px] text-white/30 font-mono hidden md:inline">
                    {shortenAddress(slot.advertiser)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
                {hasCurrentAd ? (
                  <>
                    <span className="text-[8px] sm:text-[10px] md:text-xs font-black text-brutal-warm">${slot.bidAmount}</span>
                    <span className="text-[8px] sm:text-[10px] md:text-[11px] text-white/30 font-mono hidden md:inline">{formatTime(slot.timeRemaining)}</span>
                  </>
                ) : (
                  <span className="text-[8px] sm:text-[10px] md:text-xs text-white/20 font-bold tracking-wider">AWAITING</span>
                )}
              </div>
            </div>

            {/* Ad image (LED display) */}
            <a
              href={slot.linkUrl || "#"}
              target={slot.linkUrl ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={resolveImageUrl(slot.imageUrl) || resolveImageUrl(isMain ? DEMO_IMAGE_MAIN : DEMO_IMAGE_SECONDARY)}
                alt={slot.title || "Billboard"}
                className="w-full aspect-[2.8/1] sm:aspect-[2.5/1] md:aspect-[2.2/1] lg:aspect-[2/1] object-cover brightness-110 saturate-110"
              />
            </a>

            {/* LED warm wash */}
            <div
              className="absolute inset-0 pointer-events-none z-[14]"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.01) 100%)",
              }}
            />

            {/* Edge color fringe + vignette */}
            <div
              className="absolute inset-0 pointer-events-none z-[17]"
              style={{
                boxShadow: "inset 0 0 60px rgba(0,0,0,0.4), inset 0 0 4px rgba(0,130,255,0.08), inset 0 0 4px rgba(255,0,50,0.04)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Physical stand */}
      <BillboardStand />
    </div>
  );
}

// ===== MAIN PAGE =====
export default function Home() {
  const [data, setData] = useState<BillboardData>(DEMO_DATA);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ bidding: 0, round: 0 });
  const [activeSlot, setActiveSlot] = useState<"main" | "secondary">("main");
  const [transitionClass, setTransitionClass] = useState("billboard-enter");
  const [isNight, setIsNight] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundCtxRef = useRef<AudioContext | null>(null);
  const isNightRef = useRef(isNight);

  // Initialize day/night from local time (client-only)
  useEffect(() => {
    const hour = new Date().getHours();
    setIsNight(hour < 6 || hour >= 18);
  }, []);

  // Keep ref in sync
  useEffect(() => {
    isNightRef.current = isNight;
  }, [isNight]);

  // Sound system
  useEffect(() => {
    if (!soundEnabled) {
      if (soundCtxRef.current) {
        soundCtxRef.current.close().catch(() => {});
        soundCtxRef.current = null;
      }
      return;
    }

    const ctx = new AudioContext();
    soundCtxRef.current = ctx;

    // Resume on first user interaction (browser autoplay policy)
    function resumeAudio() {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("touchstart", resumeAudio);
      document.removeEventListener("keydown", resumeAudio);
    }
    if (ctx.state === "suspended") {
      document.addEventListener("click", resumeAudio, { once: true });
      document.addEventListener("touchstart", resumeAudio, { once: true });
      document.addEventListener("keydown", resumeAudio, { once: true });
    }

    // Ambient city rumble (noise-based, not retro oscillator)
    const ambSize = ctx.sampleRate * 2;
    const ambBuf = ctx.createBuffer(1, ambSize, ctx.sampleRate);
    const ambData = ambBuf.getChannelData(0);
    let ambPrev = 0;
    for (let i = 0; i < ambSize; i++) {
      const w = Math.random() * 2 - 1;
      ambData[i] = (ambPrev + 0.02 * w) / 1.02;
      ambPrev = ambData[i];
      ambData[i] *= 3.5;
    }
    const ambSrc = ctx.createBufferSource();
    ambSrc.buffer = ambBuf;
    ambSrc.loop = true;
    const ambFilter = ctx.createBiquadFilter();
    ambFilter.type = "lowpass";
    ambFilter.frequency.value = 120;
    const ambGain = ctx.createGain();
    ambGain.gain.value = 0.018;
    ambSrc.connect(ambFilter).connect(ambGain).connect(ctx.destination);
    ambSrc.start();

    // Random car horns
    let hornTimer: ReturnType<typeof setTimeout>;
    function scheduleHorn() {
      hornTimer = setTimeout(() => {
        if (ctx.state === "running") playCarHorn(ctx);
        scheduleHorn();
      }, 10000 + Math.random() * 15000);
    }
    scheduleHorn();

    // Random car engine passes
    let carTimer: ReturnType<typeof setTimeout>;
    function scheduleCar() {
      carTimer = setTimeout(() => {
        if (ctx.state === "running") playCarEngine(ctx);
        scheduleCar();
      }, 6000 + Math.random() * 10000);
    }
    scheduleCar();

    // Random motorcycle engine passes
    let bikeTimer: ReturnType<typeof setTimeout>;
    function scheduleBike() {
      bikeTimer = setTimeout(() => {
        if (ctx.state === "running") playBikeEngine(ctx);
        scheduleBike();
      }, 8000 + Math.random() * 12000);
    }
    scheduleBike();

    // Random bicycle bells
    let bellTimer: ReturnType<typeof setTimeout>;
    function scheduleBell() {
      bellTimer = setTimeout(() => {
        if (ctx.state === "running") playBikeBell(ctx);
        scheduleBell();
      }, 15000 + Math.random() * 20000);
    }
    scheduleBell();

    // Bird chirps (day mode only)
    let chirpTimer: ReturnType<typeof setTimeout>;
    function scheduleChirp() {
      chirpTimer = setTimeout(() => {
        if (ctx.state === "running" && !isNightRef.current) {
          playBirdChirp(ctx);
        }
        scheduleChirp();
      }, 4000 + Math.random() * 8000);
    }
    scheduleChirp();

    return () => {
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("touchstart", resumeAudio);
      document.removeEventListener("keydown", resumeAudio);
      clearTimeout(hornTimer);
      clearTimeout(carTimer);
      clearTimeout(bikeTimer);
      clearTimeout(bellTimer);
      clearTimeout(chirpTimer);
      ambSrc.stop();
      ctx.close().catch(() => {});
    };
  }, [soundEnabled]);

  // Data fetching (preserved)
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer (preserved)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => ({
        bidding: Math.max(0, prev.bidding - 1),
        round: Math.max(0, prev.round - 1),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Billboard switch with sound
  const switchBillboard = useCallback((direction: "next" | "prev") => {
    if (soundCtxRef.current && soundCtxRef.current.state === "running") {
      playCarHorn(soundCtxRef.current);
    }
    setTransitionClass("billboard-exit");
    setTimeout(() => {
      setActiveSlot((prev) => (prev === "main" ? "secondary" : "main"));
      setTransitionClass("billboard-enter");
    }, 300);
  }, []);

  const { main, secondary } = data.slots;
  const { bidding, stats } = data;
  const currentSlot = activeSlot === "main" ? main : secondary;

  const skyGradient = isNight
    ? "linear-gradient(180deg, #050510 0%, #0a0a18 25%, #0f0f22 55%, #141428 100%)"
    : "linear-gradient(180deg, #1a5276 0%, #2980b9 25%, #5dade2 50%, #85c1e9 75%, #aed6f1 100%)";

  return (
    <main className="min-h-screen bg-brutal-bg overflow-x-hidden">
      {/* Wind */}
      <WindParticles isNight={isNight} />

      {/* Menubar */}
      <Menubar
        biddingOpen={bidding.isOpen}
        countdown={countdown}
        isNight={isNight}
        onToggleMode={() => setIsNight((p) => !p)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((p) => !p)}
      />

      {/* Unified Hero Scene: Sky + Billboard + Road */}
      <section
        className="relative overflow-hidden transition-colors duration-1000"
        style={{ background: skyGradient }}
      >
        {/* Celestial body */}
        <SunMoon isNight={isNight} />

        {/* Stars + shooting stars (night) / Clouds + birds (day) */}
        {isNight ? (
          <>
            <StarField />
            <ShootingStars />
          </>
        ) : (
          <>
            <DayClouds />
            <FlyingBirds />
          </>
        )}

        {/* City skyline in background */}
        <CitySkyline isNight={isNight} />

        {/* Billboard area - massive, dominant */}
        <div className="relative z-10 pt-14 sm:pt-16 md:pt-20">
          <div className="w-[96%] sm:w-[92%] md:w-[85%] lg:w-[80%] max-w-[1300px] mx-auto">
            <div className="relative">
              {/* Left arrow */}
              <button
                onClick={() => switchBillboard("prev")}
                className="absolute left-1 sm:-left-2 md:-left-14 lg:-left-16 top-[30%] sm:top-[35%] -translate-y-1/2 z-30 bg-brutal-card/90 backdrop-blur-sm border border-brutal-border/60 sm:border-2 sm:border-brutal-border hover:border-brutal-accent w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center text-brutal-muted hover:text-brutal-glow transition-all duration-200 hover:bg-brutal-card"
                aria-label="Previous billboard"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" viewBox="0 0 20 20">
                  <path d="M13 3l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="square" />
                </svg>
              </button>

              {/* Right arrow */}
              <button
                onClick={() => switchBillboard("next")}
                className="absolute right-1 sm:-right-2 md:-right-14 lg:-right-16 top-[30%] sm:top-[35%] -translate-y-1/2 z-30 bg-brutal-card/90 backdrop-blur-sm border border-brutal-border/60 sm:border-2 sm:border-brutal-border hover:border-brutal-accent w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center text-brutal-muted hover:text-brutal-glow transition-all duration-200 hover:bg-brutal-card"
                aria-label="Next billboard"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" viewBox="0 0 20 20">
                  <path d="M7 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="square" />
                </svg>
              </button>

              {/* Slot label */}
              <div className="absolute -top-5 sm:-top-6 left-1 sm:left-0 z-20 flex items-center gap-1.5 sm:gap-2">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${activeSlot === "main" ? "bg-brutal-accent" : "bg-brutal-neon"}`} />
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white/50 tracking-widest">
                  {activeSlot === "main" ? "MAIN SLOT" : "SECONDARY SLOT"}
                </span>
              </div>

              {/* Billboard - transition only on content */}
              <div className={transitionClass}>
                <BillboardSlot
                  slot={currentSlot}
                  isMain={activeSlot === "main"}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Road - flush against billboard stand */}
        <div className="relative z-[8] -mt-6 sm:-mt-7 md:-mt-8">
          <RoadScene isNight={isNight} />
        </div>
      </section>

      {/* Bidding Info */}
      <section className="max-w-[1300px] mx-auto px-3 sm:px-4 md:px-6 pt-5 sm:pt-8 md:pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
          {/* Main Slot */}
          <div className="bg-brutal-card border border-brutal-border sm:border-2 hover:border-brutal-accent/40 transition-colors p-3 sm:p-3.5 md:p-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 flex-shrink-0 ${bidding.isOpen ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
                  <span className="text-label text-[9px] sm:text-[10px] md:text-xs font-black text-brutal-glow tracking-widest">MAIN SLOT</span>
                </div>
                {bidding.isOpen ? (
                  bidding.mainHighestBid > 0 ? (
                    <p className="text-brutal-muted text-[9px] sm:text-[10px] md:text-xs truncate">
                      Leading: <span className="text-brutal-text font-bold">${bidding.mainHighestBid}</span> by {shortenAddress(bidding.mainHighestBidder)}
                    </p>
                  ) : (
                    <p className="text-brutal-muted text-[9px] sm:text-[10px] md:text-xs">No bids yet &mdash; $10 min</p>
                  )
                ) : (
                  <p className="text-brutal-muted text-[9px] sm:text-[10px] md:text-xs truncate">
                    {bidding.mainHighestBid > 0 ? `Winner: ${shortenAddress(bidding.mainHighestBidder)} \u2014 $${bidding.mainHighestBid}` : "No bids for next round"}
                  </p>
                )}
              </div>
              <Link
                href="/docs#slot-0"
                className={`text-[9px] sm:text-[10px] md:text-xs font-black px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 border sm:border-2 tracking-wider transition-all flex-shrink-0 whitespace-nowrap ${
                  bidding.isOpen
                    ? "bg-brutal-accent border-brutal-accent text-white hover:bg-brutal-glow hover:border-brutal-glow"
                    : "bg-brutal-surface border-brutal-border text-brutal-muted cursor-not-allowed"
                }`}
              >
                {bidding.isOpen ? "BID" : "CLOSED"}
              </Link>
            </div>
          </div>

          {/* Secondary Slot */}
          <div className="bg-brutal-card border border-brutal-border sm:border-2 hover:border-brutal-neon/40 transition-colors p-3 sm:p-3.5 md:p-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 flex-shrink-0 ${bidding.isOpen ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
                  <span className="text-label text-[9px] sm:text-[10px] md:text-xs font-black text-brutal-neon tracking-widest">SECONDARY</span>
                </div>
                {bidding.isOpen ? (
                  bidding.secondaryHighestBid > 0 ? (
                    <p className="text-brutal-muted text-[9px] sm:text-[10px] md:text-xs truncate">
                      Leading: <span className="text-brutal-text font-bold">${bidding.secondaryHighestBid}</span> by {shortenAddress(bidding.secondaryHighestBidder)}
                    </p>
                  ) : (
                    <p className="text-brutal-muted text-[9px] sm:text-[10px] md:text-xs">No bids yet &mdash; $1 min</p>
                  )
                ) : (
                  <p className="text-brutal-muted text-[9px] sm:text-[10px] md:text-xs truncate">
                    {bidding.secondaryHighestBid > 0 ? `Winner: ${shortenAddress(bidding.secondaryHighestBidder)} \u2014 $${bidding.secondaryHighestBid}` : "No bids for next round"}
                  </p>
                )}
              </div>
              <Link
                href="/docs#slot-1"
                className={`text-[9px] sm:text-[10px] md:text-xs font-black px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 border sm:border-2 tracking-wider transition-all flex-shrink-0 whitespace-nowrap ${
                  bidding.isOpen
                    ? "bg-brutal-accent border-brutal-accent text-white hover:bg-brutal-glow hover:border-brutal-glow"
                    : "bg-brutal-surface border-brutal-border text-brutal-muted cursor-not-allowed"
                }`}
              >
                {bidding.isOpen ? "BID" : "CLOSED"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-[1300px] mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 md:mb-12">
          <StatCard label="TOTAL REVENUE" value={`$${stats.totalRevenue.toFixed(2)}`} />
          <StatCard label="ROUNDS" value={stats.totalRounds.toString()} />
          <StatCard label="$BB BURNED" value={stats.totalBurned > 0 ? stats.totalBurned.toLocaleString() : "0"} />
          <StatCard label="CURRENT ROUND" value={`#${bidding.currentRoundId}`} />
        </div>

        {/* How it Works */}
        <div className="bg-brutal-card border border-brutal-border sm:border-2 p-4 sm:p-6 md:p-8">
          <h2 className="text-xs sm:text-sm md:text-base font-black text-brutal-text mb-4 sm:mb-5 md:mb-7 tracking-widest">HOW IT WORKS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { num: "01", title: "12-HR ROUNDS", desc: "Ads display 00:00\u201312:00 and 12:00\u201300:00 UTC" },
              { num: "02", title: "30-MIN BID", desc: "Bid window opens 30 min before each round" },
              { num: "03", title: "TOP WINS", desc: "Top bid wins the slot. Losers get full refund." },
              { num: "04", title: "BURN", desc: "Revenue buys and burns $BB tokens daily" },
            ].map((item) => (
              <div key={item.title}>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-brutal-accent/30 mb-1 sm:mb-2">{item.num}</div>
                <h3 className="text-[10px] sm:text-[11px] md:text-xs font-black text-brutal-text mb-1 sm:mb-1.5 tracking-wider">{item.title}</h3>
                <p className="text-brutal-muted text-[9px] sm:text-[10px] md:text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brutal-border sm:border-t-2 py-4 sm:py-5 md:py-6">
        <div className="max-w-[1300px] mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-brutal-muted/50 font-bold tracking-wider">
          <span>BILLBOARD MAFIA</span>
          <span>MONAD TESTNET</span>
        </div>
      </footer>
    </main>
  );
}
