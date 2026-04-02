import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "earthmood",
  description: "Track and visualize global mood on an interactive world map",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body className="antialiased font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
