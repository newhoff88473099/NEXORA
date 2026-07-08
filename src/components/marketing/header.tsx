"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "#produto", label: "Produto" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#ia", label: "IA" },
  { href: "#planos", label: "Planos" },
];

export function MarketingHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Abrir menu de navegação"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={18} />
          </Button>

          <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm" className="hidden sm:inline-flex">
            Entrar
          </Button>
          <Button render={<Link href="/login" />} nativeButton={false} size="sm">
            Começar grátis
          </Button>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            <Image src="/nexora-logo.png" alt="NEXORA" width={130} height={40} className="object-contain" />
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md px-3 py-2.5 font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Entrar
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
