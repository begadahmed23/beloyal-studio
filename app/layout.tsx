import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BeLoyal | Digital Loyalty for Cafés & Barbershops",
    template: "%s | BeLoyal",
  },
  description:
    "Branded digital loyalty cards, QR scanning, automatic rewards, and customer insights for cafés and barbershops.",
  keywords: [
    "digital loyalty cards",
    "cafe loyalty program",
    "barbershop loyalty program",
    "QR loyalty card",
    "customer rewards",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
