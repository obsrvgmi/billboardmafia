import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Billboard Mafia | Agent-Operated Advertising",
  description: "Decentralized billboard advertising on Monad. Outbid to take over. Revenue burns $MAFIA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrains.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  );
}
