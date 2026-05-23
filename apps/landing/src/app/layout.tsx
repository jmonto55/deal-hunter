import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deal Hunter",
  description: "Find the best property deals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
