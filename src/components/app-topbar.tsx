"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const defaultPlant = currentPlantId ?? plants[0]?.id ?? "";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <header className="fixed left-56 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-3">
        <Building2 size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{orgName}</span>

        {plants.length > 0 && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <Select
              defaultValue={defaultPlant}
              onValueChange={(value) => {
                if (value) {
                  // plant selector — pode ser usado para filtrar dados em fases futuras
                }
              }}
            >
              <SelectTrigger className="h-7 w-auto border-none bg-transparent px-2 text-sm shadow-none focus-visible:ring-0">
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
          </>
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
            onClick={() => router.push("/configuracoes/perfil")}
            className="flex items-center gap-2"
          >
            <User size={14} />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
