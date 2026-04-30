import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/provider";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DealHunter",
  description: "Encuentra el deal antes que nadie.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-bg-base text-fg">
        <LocaleProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
