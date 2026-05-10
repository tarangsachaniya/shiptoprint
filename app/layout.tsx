import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipToPrint",
  description: "Design and print custom stickers — fast shipping, professional quality.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
