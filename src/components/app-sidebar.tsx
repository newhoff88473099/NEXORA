"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  ListChecks,
  AlertTriangle,
  Wrench,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/auditorias", label: "Auditorias", icon: ClipboardCheck },
  { href: "/templates", label: "Checklists", icon: ListChecks },
  { href: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
  { href: "/acoes", label: "Ações", icon: Wrench },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon size={16} strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-border bg-sidebar md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center justify-center border-b border-border bg-[#1A1D1B] px-3">
        <Image
          src="/nexora-logo.png"
          alt="NEXORA"
          width={152}
          height={44}
          className="object-contain"
          priority
        />
      </div>

      <SidebarNav />

      {/* Faixa hazard no rodapé */}
      <div
        className="h-1.5 w-full"
        style={{ background: "var(--hazard-stripe)" }}
      />
    </aside>
  );
}
