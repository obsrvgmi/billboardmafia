import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
