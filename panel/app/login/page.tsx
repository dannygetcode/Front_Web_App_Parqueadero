import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-sheet bg-card p-8 ring-1 ring-border">
        <Logo />
        <h1 className="mt-6 font-heading text-2xl font-bold">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ingresa con tu cuenta de administrador.</p>
        <LoginForm />
      </div>
    </main>
  );
}
