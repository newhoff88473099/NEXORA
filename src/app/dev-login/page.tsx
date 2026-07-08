import { redirect } from "next/navigation";
import { DevLoginButton } from "./dev-login-button";

export default function DevLoginPage() {
  if (process.env.NODE_ENV === "production") redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <DevLoginButton />
    </div>
  );
}
