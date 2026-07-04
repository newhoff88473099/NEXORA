import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/nexora-logo.png"
            alt="NEXORA"
            width={260}
            height={80}
            className="object-contain"
            priority
          />
          <p className="text-sm text-muted-foreground">
            Auditorias &amp; Conformidade Industrial
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
