import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api-client";

/** Muestra un error del backend; en validaciones lista los campos con problema. */
export function notificarError(e: unknown) {
  if (e instanceof ApiError && e.problem.errores?.length) {
    toast.error(e.message, {
      description: e.problem.errores.map((x) => `${x.campo}: ${x.mensaje}`).join(". "),
    });
    return;
  }
  toast.error(errorMessage(e));
}
