import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DealHunter — Encuentra el deal antes que nadie",
  description:
    "Acceso anticipado a cesiones verificadas. Datos reales, sin ruido.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="antialiased min-h-screen bg-bg-base text-fg">
        {children}
      </body>
    </html>
  );
}
