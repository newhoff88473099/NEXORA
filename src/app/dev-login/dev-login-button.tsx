"use client";

import { useActionState } from "react";
import type { DevLoginState } from "./actions";
import { autoLogin } from "./actions";

const initialState: DevLoginState = {};

export function DevLoginButton() {
  const [state, action, pending] = useActionState(autoLogin, initialState);

  return (
    <form action={action} className="space-y-3">
      <button
        type="submit"
        disabled={pending}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Entrar como dev@nexora.app"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive text-center">
          {state.error}
        </p>
      )}
    </form>
  );
}
