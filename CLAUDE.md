# Panel web de administración "Cupo" — Parqueadero

Este repo tiene dos paneles:
- `panel/` — el panel nuevo (Next.js). Es el que se desarrolla.
- HTML/JS plano en la raíz (`index.html`, `dashboard/`, `js/`, `css/`) — **legado roto**: apunta al contrato anterior del backend y no funciona. No lo arregles; se retira al final, cuando `panel/` lo reemplace.

## panel/ — stack
Next.js (App Router) + TypeScript estricto, Tailwind v4, shadcn/ui (Radix), lucide-react, next-themes, sonner, TanStack Query, react-hook-form + zod. Gestor: npm. Next 16: la convención `middleware` se llama `proxy` (`panel/proxy.ts`); antes de usar APIs de Next, consulta `panel/node_modules/next/dist/docs/`.

## Cómo correrlo
```
cd panel
cp .env.example .env.local   # ajusta BACKEND_URL
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run lint && npx tsc --noEmit
```
Variables (solo del servidor, sin prefijo `NEXT_PUBLIC_`): `BACKEND_URL` (backend de Spring Boot, por defecto `http://127.0.0.1:8080`). `.env.local` está ignorado por git; no escribas credenciales en ningún archivo.

## Estructura de panel/
- `app/login`, `app/(panel)/` — login y pantallas autenticadas (Resumen, Usuarios, Pagos, Puerta)
- `app/api/` — BFF: `auth/login`, `auth/logout`, `cupos`, `ocupacion`
- `lib/server/` — solo servidor: `backend.ts` (fetch con Bearer, validación zod, manejo de 401), `origin.ts` (validación de Origin)
- `lib/api-client.ts` (cliente del navegador hacia el BFF), `lib/schemas.ts` (zod), `lib/session.ts` (cookie)
- `components/brand/` (PlateChip, StatusBadge, KpiCard, SectionHeader, EmptyState, ErrorState, Logo), `components/data/` (tabla base), `components/shell/` (layout), `components/ui/` (shadcn)
- `app/globals.css` — tokens de diseño como variables CSS

## Autenticación (BFF)
- El route handler `POST /api/auth/login` llama a `POST {BACKEND_URL}/api/admin/login` y guarda el JWT en la cookie `cupo_session`: httpOnly, Secure en producción, SameSite=Strict, path `/`, caducidad igual a la del token (4 h).
- El token nunca llega a JavaScript del navegador ni va en `localStorage`. El navegador solo habla con Next.js; las llamadas al backend salen del servidor con `Authorization: Bearer`.
- `proxy.ts` protege todo salvo `/login` y `/api/auth/login`. Ante 401 del backend se borra la cookie y el cliente va a `/login?aviso=sesion`.
- Los route handlers que modifican estado llaman a `rejectForeignOrigin`. Sin `dangerouslySetInnerHTML`.
- Los errores del backend son ProblemDetail (RFC 9457) en español; se muestran con sonner o `ErrorState`.

## Reglas
- **Nada de emojis** en UI, código, textos, commits ni docs. Iconos solo con lucide.
- Textos de la interfaz en español.
- Colores, radios y tipografías salen de los tokens de `globals.css`, no de valores sueltos. El amarillo de placa (`plate`) solo como fondo con texto oscuro, nunca como color de texto.
- Los estados llevan icono y texto (`StatusBadge`), nunca solo color.
- Cifras, montos y placas con `tabular`. Títulos y KPIs en Space Grotesk, cuerpo en Inter.
- Si cambia un endpoint del backend, actualiza el schema zod y el route handler correspondientes. Contrato: `../backend/docs/arquitectura/fase-1-modelo.md` §5 y `../backend/docs/cambios-de-contrato-fase-1.md`.
- Dependencias nuevas solo con justificación.

## Pendiente
- Pantallas de Usuarios, Pagos y Puerta (hoy "en construcción"), Cámaras y Configuración no existen todavía en `panel/`.
- Retirar el frontend legado de la raíz al final.
- CSP con `unsafe-inline` en scripts (Next lo exige sin nonce); evaluar CSP con nonce.
