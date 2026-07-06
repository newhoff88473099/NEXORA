import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#produto", label: "Produto" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#ia", label: "IA" },
  { href: "#planos", label: "Planos" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="NEXORA — página inicial">
          <Image
            src="/nexora-logo.png"
            alt="NEXORA"
            width={140}
            height={44}
            className="object-contain"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
            Entrar
          </Button>
          <Button render={<Link href="/login" />} nativeButton={false} size="sm">
            Começar grátis
          </Button>
        </div>
      </div>
    </header>
  );
}
