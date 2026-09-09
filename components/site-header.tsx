import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
          Fragrance Compare
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
