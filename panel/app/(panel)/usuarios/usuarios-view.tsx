"use client";

import { useMemo, useState } from "react";
import { Car, KeyRound, MoreHorizontal, Pencil, Plus, ShieldBan, ShieldCheck, UserMinus } from "lucide-react";
import { PlateChip } from "@/components/brand/plate-chip";
import { SectionHeader } from "@/components/brand/section-header";
import { UsuarioEstado } from "@/components/brand/usuario-estado";
import { DataTable, type Column } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/api-client";
import { formatearFecha } from "@/lib/format";
import { useUsuarios } from "@/lib/queries";
import type { Usuario } from "@/lib/schemas";
import {
  BajaDialog,
  CodigoDialog,
  EstadoDialog,
  NuevoCodigoDialog,
  type CodigoMostrado,
} from "@/app/(panel)/usuarios/usuario-dialogs";
import { AltaSheet, EditarSheet, VehiculoSheet } from "@/app/(panel)/usuarios/usuario-sheets";

export function UsuariosView() {
  const [incluirBajas, setIncluirBajas] = useState(false);
  const [filtro, setFiltro] = useState("");
  const usuarios = useUsuarios(incluirBajas);

  const [alta, setAlta] = useState(false);
  const [editar, setEditar] = useState<Usuario | null>(null);
  const [vehiculo, setVehiculo] = useState<Usuario | null>(null);
  const [estado, setEstado] = useState<Usuario | null>(null);
  const [baja, setBaja] = useState<Usuario | null>(null);
  const [nuevoCodigo, setNuevoCodigo] = useState<Usuario | null>(null);
  const [codigo, setCodigo] = useState<CodigoMostrado | null>(null);

  const filas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    const lista = usuarios.data ?? [];
    if (!q) return lista;
    return lista.filter((u) =>
      [u.nombre, u.apellido, u.telefono, u.vehiculo?.placa, u.cupo?.codigo]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(q)),
    );
  }, [usuarios.data, filtro]);

  const columnas: Column<Usuario>[] = [
    {
      id: "nombre",
      header: "Usuario",
      cell: (u) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {u.nombre} {u.apellido}
          </span>
          <span className="tabular text-xs text-muted-foreground">{u.telefono}</span>
        </div>
      ),
    },
    { id: "placa", header: "Placa", cell: (u) => (u.vehiculo ? <PlateChip placa={u.vehiculo.placa} size="sm" /> : "-") },
    { id: "cupo", header: "Cupo", cell: (u) => <span className="tabular font-medium">{u.cupo?.codigo ?? "-"}</span> },
    { id: "estado", header: "Estado", cell: (u) => <UsuarioEstado usuario={u} /> },
    { id: "vigencia", header: "Vigente hasta", cell: (u) => <span className="tabular">{formatearFecha(u.vigenteHasta)}</span> },
    {
      id: "acciones",
      header: "Acciones",
      className: "w-12",
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Acciones para ${u.nombre} ${u.apellido}`}>
              <MoreHorizontal className="size-5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditar(u)} disabled={Boolean(u.dadoDeBajaEn)}>
              <Pencil className="size-4" aria-hidden /> Editar datos y cupo
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setVehiculo(u)} disabled={Boolean(u.dadoDeBajaEn)}>
              <Car className="size-4" aria-hidden /> Cambiar vehículo
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setNuevoCodigo(u)} disabled={Boolean(u.dadoDeBajaEn)}>
              <KeyRound className="size-4" aria-hidden /> Generar código nuevo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setEstado(u)} disabled={Boolean(u.dadoDeBajaEn)}>
              {u.estado === "SUSPENDIDO" ? (
                <>
                  <ShieldCheck className="size-4" aria-hidden /> Reactivar
                </>
              ) : (
                <>
                  <ShieldBan className="size-4" aria-hidden /> Suspender
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setBaja(u)} disabled={Boolean(u.dadoDeBajaEn)}>
              <UserMinus className="size-4" aria-hidden /> Dar de baja
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SectionHeader
        titulo="Usuarios"
        descripcion="Altas, vehículos, estado y vigencia."
        acciones={
          <Button onClick={() => setAlta(true)}>
            <Plus className="size-4" aria-hidden /> Nuevo usuario
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-4">
        <Input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por nombre, celular, placa o cupo"
          aria-label="Filtrar usuarios"
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={incluirBajas}
            onChange={(e) => setIncluirBajas(e.target.checked)}
            className="size-4 accent-primary"
          />
          Incluir dados de baja
        </label>
      </div>

      <DataTable
        caption="Usuarios del parqueadero"
        columns={columnas}
        rows={filas}
        rowKey={(u) => u.id}
        loading={usuarios.isLoading}
        error={usuarios.isError ? errorMessage(usuarios.error) : null}
        onRetry={() => usuarios.refetch()}
        emptyTitle={filtro ? "Sin coincidencias" : "Aún no hay usuarios"}
        emptyDescription={filtro ? "Prueba con otro texto." : "Crea el primero con el botón Nuevo usuario."}
      />

      <AltaSheet
        open={alta}
        onOpenChange={setAlta}
        onCreado={(c, e, n) => setCodigo({ codigo: c, expiraEn: e, nombre: n })}
      />
      <EditarSheet usuario={editar} onClose={() => setEditar(null)} />
      <VehiculoSheet usuario={vehiculo} onClose={() => setVehiculo(null)} />
      <EstadoDialog usuario={estado} onClose={() => setEstado(null)} />
      <BajaDialog usuario={baja} onClose={() => setBaja(null)} />
      <NuevoCodigoDialog usuario={nuevoCodigo} onClose={() => setNuevoCodigo(null)} onCodigo={setCodigo} />
      <CodigoDialog datos={codigo} onClose={() => setCodigo(null)} />
    </>
  );
}

