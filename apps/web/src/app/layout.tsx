import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venture Sandbox",
  description: "Research, simulate, and build your venture idea.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
