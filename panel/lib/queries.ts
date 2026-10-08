import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { cuposSchema, usuariosSchema } from "@/lib/schemas";

export function useCupos() {
  return useQuery({ queryKey: ["cupos"], queryFn: () => api("/api/bff/cupos", cuposSchema) });
}

export function useUsuarios(incluirBajas = false) {
  return useQuery({
    queryKey: ["usuarios", { incluirBajas }],
    queryFn: () => api(`/api/bff/usuarios?incluirBajas=${incluirBajas}`, usuariosSchema),
  });
}
