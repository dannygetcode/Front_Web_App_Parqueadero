"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { problemSchema, loginRequestSchema, type LoginRequest } from "@/lib/schemas";

function Aviso() {
  const params = useSearchParams();
  if (params.get("aviso") !== "sesion") return null;
  return (
    <p
      role="status"
      className="mt-4 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      Tu sesión expiró. Inicia sesión de nuevo.
    </p>
  );
}

export function LoginForm() {
  const [enviando, setEnviando] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({ resolver: zodResolver(loginRequestSchema) });

  async function onSubmit(values: LoginRequest) {
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        // Navegación completa a propósito: reinicia caché y estado del cliente.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/");
        return;
      }
      const parsed = problemSchema.safeParse(await res.json().catch(() => null));
      toast.error(parsed.success && parsed.data.detail ? parsed.data.detail : "No se pudo iniciar sesión.");
    } catch {
      toast.error("No se pudo conectar con el panel. Revisa tu red.");
    }
    setEnviando(false);
  }

  return (
    <>
      <Suspense>
        <Aviso />
      </Suspense>
      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username")}
          />
          {errors.username ? (
            <p id="username-error" className="text-sm text-destructive">
              {errors.username.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password ? (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg" disabled={enviando} className="mt-2">
          {enviando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Ingresar
        </Button>
      </form>
    </>
  );
}
