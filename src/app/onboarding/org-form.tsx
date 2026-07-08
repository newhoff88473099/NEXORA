"use client";

import { useActionState } from "react";
import { createOrganization, type OrgFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initialState: OrgFormState = {};

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function OrgForm() {
  const [state, action, pending] = useActionState(createOrganization, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome da organização</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ex: Indústria Alfa Ltda."
          autoComplete="organization"
          required
        />
        {state.errors?.name && (
          <p role="alert" className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          name="cnpj"
          placeholder="00.000.000/0001-00"
          maxLength={18}
          onChange={(e) => {
            e.currentTarget.value = formatCNPJ(e.currentTarget.value);
          }}
          required
        />
        {state.errors?.cnpj && (
          <p role="alert" className="text-xs text-destructive">{state.errors.cnpj[0]}</p>
        )}
      </div>

      {state.errors?._form && (
        <p role="alert" className="text-sm text-destructive">{state.errors._form[0]}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Criando..." : "Criar organização"}
      </Button>
    </form>
  );
}
