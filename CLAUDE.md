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
- `app/login`, `app/(panel)/` — login y pantallas autenticadas (Resumen, Usuarios, Pagos, Puerta, Analítica); cada pantalla tiene su `*-view.tsx` cliente
- `app/api/` — BFF: `auth/login`, `auth/logout` y `bff/[...path]` (proxy genérico con lista blanca)
- `lib/server/` — solo servidor: `backend.ts` (`forward`: lista blanca de método y ruta, Bearer, manejo de 401, límite de cuerpo), `origin.ts` (validación de Origin)
- `lib/api-client.ts` (cliente del navegador hacia el BFF: `api`, `apiSend`, `apiBlobUrl`), `lib/schemas.ts` (zod de DTO y formularios), `lib/queries.ts`, `lib/mutations.ts`, `lib/format.ts`, `lib/session.ts`, `lib/analitica.ts` y `lib/analitica-schemas.ts` (hooks, fechas de Bogotá, formato y zod de analítica)
- `components/brand/` (PlateChip, StatusBadge, KpiCard, SectionHeader, EmptyState, ErrorState, Logo), `components/data/` (tabla base), `components/shell/` (layout), `components/ui/` (shadcn)
- `app/globals.css` — tokens de diseño como variables CSS

## Autenticación (BFF)
- El route handler `POST /api/auth/login` llama a `POST {BACKEND_URL}/api/admin/login` y guarda el JWT en la cookie `cupo_session`: httpOnly, Secure en producción, SameSite=Strict, path `/`, caducidad igual a la del token (4 h).
- El token nunca llega a JavaScript del navegador ni va en `localStorage`. El navegador solo habla con Next.js; las llamadas al backend salen del servidor con `Authorization: Bearer`.
- `proxy.ts` protege todo salvo `/login` y `/api/auth/login`. Ante 401 del backend se borra la cookie y el cliente va a `/login?aviso=sesion`.
- Los route handlers que modifican estado llaman a `rejectForeignOrigin`. Sin `dangerouslySetInnerHTML`.
- Los errores del backend son ProblemDetail (RFC 9457) en español; se muestran con sonner o `ErrorState`.

## Cómo agregar una llamada al backend
1. Añade `"MÉTODO ruta/:id"` a la lista `ALLOWED` de `lib/server/backend.ts` (sin eso el BFF responde 404).
2. Define el schema zod en `lib/schemas.ts`.
3. Llama con `api` / `apiSend` desde un `useQuery` o `useMutation` apuntando a `/api/bff/<ruta del backend sin /api>`.
Los comprobantes se piden con `apiBlobUrl` (imagen protegida, nunca una URL directa al backend). El código de activación de un usuario solo se muestra al crearlo o regenerarlo; no se guarda.

## Analítica (`app/(panel)/analitica/`)
- Contrato: `../backend/docs/contrato-analitica.md`. Rutas del BFF, todas `GET`: `analitica/resumen`, `analitica/ocupacion`, `analitica/ocupacion/mapa-calor`, `analitica/ingresos`, `analitica/morosidad`, `analitica/permanencia`, `analitica/pronostico/vacancia`, `analitica/pronostico/ocupacion` y `analitica/pronostico/llegadas`. `/api/usuarios/yo/resumen` es de la app móvil y **no** se expone.
- Pestañas en la URL (`?vista=operacion|dinero|pronostico`). Gráficas con Recharts mediante `components/ui/chart.tsx`; el mapa de calor es una cuadrícula CSS.
- Interruptor "Incluir datos simulados": apagado por defecto y en la URL (`?simulados=1`). `useAnalitica` lo pone en la query y en la `queryKey`, para que nunca se mezclen resultados reales y simulados. Cuando está activo se ven la banda, el borde `--sim` y la insignia de origen: "Real + simulado" en Spring, "Solo simulado" en el pronóstico.
- Honestidad: el pronóstico siempre lleva su banda p10-p90. Las métricas del modelo se leen de `metricas.resumen`, nunca van fijas en el código. Con datos insuficientes no se dibuja ninguna cifra (`InsuficienteState`) y las horas sin datos quedan como hueco. `probLleno`, `usuariosDistintos` y `probabilidadLlenoCarro` no se muestran. Las llegadas van plegadas, marcadas "Sin validar", y solo se piden al abrirlas.
- Un 503 del pronóstico (`PRONOSTICO_NO_DISPONIBLE`) se muestra en su tarjeta con el mensaje del backend y no se reintenta. El resto de la página sigue funcionando.
- Series: `--serie-carro` y `--serie-moto`, validadas en claro y oscuro con el validador de paletas (daltonismo y contraste). El morado `--sim` nunca se usa como serie. Si se agrega una serie, hay que volver a validar.

## Reglas
- **Nada de emojis** en UI, código, textos, commits ni docs. Iconos solo con lucide.
- Textos de la interfaz en español.
- Colores, radios y tipografías salen de los tokens de `globals.css`, no de valores sueltos. El amarillo de placa (`plate`) solo como fondo con texto oscuro, nunca como color de texto.
- Los estados llevan icono y texto (`StatusBadge`), nunca solo color.
- Cifras, montos y placas con `tabular`. Títulos y KPIs en Space Grotesk, cuerpo en Inter.
- Si cambia un endpoint del backend, actualiza el schema zod y el route handler correspondientes. Contrato: `../backend/docs/arquitectura/fase-1-modelo.md` §5 y `../backend/docs/cambios-de-contrato-fase-1.md`.
- Dependencias nuevas solo con justificación.

## Pendiente
- Cámaras y Configuración (tarifas, cupos) no existen todavía en `panel/`.
- Analítica: falta un selector de fechas libre (hoy solo hay rangos fijos de 7 días a 12 meses).
- Sin pruebas automatizadas; la verificación ha sido build, lint, tsc y curl contra el BFF.
- Retirar el frontend legado de la raíz al final.
- CSP con `unsafe-inline` en scripts (Next lo exige sin nonce); evaluar CSP con nonce.
