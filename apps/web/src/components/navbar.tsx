import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-base/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="DealHunter home" className="flex items-center">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
