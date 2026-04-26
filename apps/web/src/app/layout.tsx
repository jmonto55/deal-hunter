import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deal Hunter",
  description: "Find the best deals on the web",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
