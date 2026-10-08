"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Field } from "@/components/data/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARROCERIAS } from "@/lib/format";
import type { TipoVehiculo, VehiculoForm } from "@/lib/schemas";

type Props = {
  tipo: TipoVehiculo;
  register: UseFormRegister<VehiculoForm>;
  control: Control<VehiculoForm>;
  errors: FieldErrors<VehiculoForm>;
};

/** Campos del vehículo reutilizados en el alta de usuario y en el cambio de vehículo. */
export function VehiculoFields({ tipo, register, control, errors }: Props) {
  return (
    <>
      <Field id="placa" label="Placa" error={errors.placa?.message}>
        <Input
          id="placa"
          autoCapitalize="characters"
          maxLength={7}
          className="uppercase tabular"
          aria-invalid={Boolean(errors.placa)}
          {...register("placa")}
        />
      </Field>
      {tipo === "CARRO" ? (
        <Field id="carroceria" label="Carrocería" error={errors.carroceria?.message}>
          <Controller
            control={control}
            name="carroceria"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="carroceria" className="w-full" aria-invalid={Boolean(errors.carroceria)}>
                  <SelectValue placeholder="Elige la carrocería" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CARROCERIAS).map(([valor, etiqueta]) => (
                    <SelectItem key={valor} value={valor}>
                      {etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="color" label="Color" error={errors.color?.message}>
          <Input id="color" aria-invalid={Boolean(errors.color)} {...register("color")} />
        </Field>
        <Field id="marca" label="Marca (opcional)" error={errors.marca?.message}>
          <Input id="marca" aria-invalid={Boolean(errors.marca)} {...register("marca")} />
        </Field>
      </div>
    </>
  );
}
