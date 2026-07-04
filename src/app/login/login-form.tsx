"use client";

import { useState, useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  signInWithPassword,
  signUp,
  sendMagicLink,
  resetPassword,
  type AuthFormState,
} from "./actions";

type Mode = "login" | "signup" | "magic" | "reset";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");

  const [loginState, loginAction, loginPending] = useActionState(signInWithPassword, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);
  const [magicState, magicAction, magicPending] = useActionState(sendMagicLink, initialState);
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, initialState);

  return (
    <div className="space-y-4">
      {/* Abas Login / Criar conta */}
      {(mode === "login" || mode === "signup") && (
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-1.5 text-sm transition-colors ${
              mode === "login"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-1.5 text-sm transition-colors border-l border-border ${
              mode === "signup"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Criar conta
          </button>
        </div>
      )}

      {/* ── Login com senha ── */}
      {mode === "login" && (
        <form action={loginAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-login">E-mail</Label>
            <Input id="email-login" name="email" type="email"
              placeholder="voce@empresa.com.br" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password-login">Senha</Label>
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueci a senha
              </button>
            </div>
            <Input id="password-login" name="password" type="password"
              autoComplete="current-password" required />
          </div>
          {loginState.error && (
            <p className="text-sm text-destructive">{loginState.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loginPending}>
            {loginPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      )}

      {/* ── Criar conta ── */}
      {mode === "signup" && (
        <>
          {signUpState.success ? (
            <div className="rounded-md bg-muted px-4 py-3 text-sm text-foreground">
              Conta criada. Você já pode entrar com seu e-mail e senha.
            </div>
          ) : (
            <form action={signUpAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email-signup">E-mail</Label>
                <Input id="email-signup" name="email" type="email"
                  placeholder="voce@empresa.com.br" autoComplete="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password-signup">Senha</Label>
                <Input id="password-signup" name="password" type="password"
                  autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
              </div>
              {signUpState.error && (
                <p className="text-sm text-destructive">{signUpState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={signUpPending}>
                {signUpPending ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          )}
        </>
      )}

      {/* ── Redefinir senha ── */}
      {mode === "reset" && (
        <>
          {resetState.success ? (
            <div className="space-y-3">
              <div className="rounded-md bg-muted px-4 py-3 text-sm text-foreground">
                Link de redefinição enviado para {resetState.email}.
              </div>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar para o login
              </button>
            </div>
          ) : (
            <form action={resetAction} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Informe seu e-mail e enviaremos um link para redefinir a senha.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">E-mail</Label>
                <Input id="reset-email" name="email" type="email"
                  placeholder="voce@empresa.com.br" autoComplete="email" required />
              </div>
              {resetState.error && (
                <p className="text-sm text-destructive">{resetState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={resetPending}>
                {resetPending ? "Enviando..." : "Enviar link de redefinição"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar
              </button>
            </form>
          )}
        </>
      )}

      {/* ── Magic link ── */}
      {mode === "magic" && (
        <>
          {magicState.success ? (
            <div className="space-y-3">
              <div className="rounded-md bg-muted px-4 py-3 text-sm text-foreground">
                Link enviado para {magicState.email}.
              </div>
              <button type="button" onClick={() => setMode("login")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Voltar para o login
              </button>
            </div>
          ) : (
            <form action={magicAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="magic-email">E-mail</Label>
                <Input id="magic-email" name="email" type="email"
                  placeholder="voce@empresa.com.br" autoComplete="email" required />
              </div>
              {magicState.error && (
                <p className="text-sm text-destructive">{magicState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={magicPending}>
                {magicPending ? "Enviando..." : "Enviar link de acesso"}
              </Button>
            </form>
          )}
        </>
      )}

      {(mode === "login" || mode === "signup") && (
        <>
          <Separator />
          <button
            type="button"
            onClick={() => setMode("magic")}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Prefiro receber um link por e-mail
          </button>
        </>
      )}
    </div>
  );
}
