"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut, Building2, ChevronDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/client";

interface Plant {
  id: string;
  name: string;
}

interface AppTopbarProps {
  userEmail: string;
  orgName: string;
  plants: Plant[];
  currentPlantId?: string;
}

export function AppTopbar({
  userEmail,
  orgName,
  plants,
  currentPlantId,
}: AppTopbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePlantId = searchParams.get("plant") ?? currentPlantId ?? plants[0]?.id ?? "";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:left-56">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="-ml-1 md:hidden"
          aria-label="Abrir menu de navegação"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu size={18} />
        </Button>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="border-b border-border bg-[#1A1D1B] p-3">
              <SheetTitle className="sr-only">Navegação</SheetTitle>
              <Image
                src="/nexora-logo.png"
                alt="NEXORA"
                width={140}
                height={40}
                className="object-contain"
              />
            </SheetHeader>
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <Building2 size={14} className="hidden text-muted-foreground sm:block" />
        <span className="hidden text-sm text-muted-foreground sm:inline">{orgName}</span>

        {plants.length > 0 && (
          <span className="hidden items-center gap-3 sm:flex">
            <span className="text-muted-foreground/40">/</span>
            <Select
              value={activePlantId}
              onValueChange={(value) => {
                if (value) router.push(`/auditorias?plant=${value}`);
              }}
            >
              <SelectTrigger
                className="h-7 w-auto border-none bg-transparent px-2 text-sm shadow-none focus-visible:ring-0"
                title="Filtrar auditorias por planta"
              >
                <SelectValue placeholder="Selecionar planta" />
              </SelectTrigger>
              <SelectContent>
                {plants.map((plant) => (
                  <SelectItem key={plant.id} value={plant.id}>
                    {plant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted transition-colors"
          aria-label="Menu do usuário"
        >
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm sm:inline">{userEmail}</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-2"
            variant="destructive"
          >
            <LogOut size={14} />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
