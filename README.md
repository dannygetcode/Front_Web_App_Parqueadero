# Cupo: panel de administración del parqueadero

Panel web para administrar un parqueadero pequeño (6 cupos de carro y 1 de moto): usuarios, pagos, puerta y analítica con pronóstico. Es el cliente del backend de Spring Boot del proyecto (`../backend`).

El panel nuevo vive en [`panel/`](panel/). El HTML y JavaScript plano que hay en la raíz del repo (`index.html`, `dashboard/`, `js/`, `css/`) es el panel anterior: apunta al contrato viejo del backend y **no funciona**. Se conserva solo hasta que `panel/` lo reemplace por completo.

## Qué incluye

| Sección | Qué permite |
|---|---|
| Resumen | Estado de los 7 cupos y vehículos dentro en este momento |
| Usuarios | Alta con código de activación (se muestra una sola vez), edición, cambio de vehículo, suspensión y reactivación, baja y código nuevo |
| Pagos | Revisión de comprobantes con imagen, aprobar o rechazar, aviso de posible duplicado y registro de cortesías |
| Puerta | Persiana animada con cuenta regresiva, apertura y cierre manual, simulador de lectura de cámara e historial de accesos |
| Analítica | KPIs, ocupación por hora o día, mapa de calor, permanencia, ingresos, morosidad y pronóstico (cupo libre, ocupación esperada y hora de llegada) |

La analítica tiene un interruptor **Incluir datos simulados**, apagado por defecto, para que nunca se confundan cifras reales con simuladas. El pronóstico siempre se muestra con su intervalo de incertidumbre y con las métricas de su backtest, y dice con claridad cuándo faltan datos.

## Requisitos

- Node.js 20 o superior y npm.
- El backend corriendo (por defecto en `http://127.0.0.1:8080`). Las credenciales del administrador son las que configura el backend en su `.env` (`ADMIN_USERNAME` y `ADMIN_PASSWORD`).

## Cómo correrlo

```bash
cd panel
cp .env.example .env.local     # ajusta BACKEND_URL si hace falta
npm install
npm run dev                    # http://localhost:3000
```

Para producción:

```bash
npm run build
npm run start
```

Verificación antes de subir cambios:

```bash
npm run build && npm run lint && npx tsc --noEmit
```

### Variables de entorno

Solo existen en el servidor (ninguna lleva el prefijo `NEXT_PUBLIC_`, por lo que nunca llegan al navegador). Van en `panel/.env.local`, que Git ignora.

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `BACKEND_URL` | URL del backend, sin barra final | `http://127.0.0.1:8080` |
| `ALLOWED_DEV_ORIGINS` | Solo desarrollo: IP o host de la red local desde la que abres el panel, separados por coma | `192.168.1.10` |

## Cómo funciona

El navegador solo habla con Next.js; las llamadas al backend salen del servidor. Es un patrón BFF (backend for frontend):

1. El formulario de login envía usuario y contraseña a `POST /api/auth/login`. Ese handler llama al backend y guarda el JWT en la cookie `cupo_session`: `httpOnly`, `SameSite=Strict`, `Secure` en producción y con la misma caducidad que el token (4 horas).
2. El token nunca es accesible desde JavaScript del navegador ni se guarda en `localStorage`.
3. Las pantallas piden datos a `/api/bff/<ruta>`. Ese proxy reenvía al backend con `Authorization: Bearer` solo las rutas de una lista blanca (`panel/lib/server/backend.ts`); cualquier otra responde 404.
4. Los métodos que modifican estado exigen un `Origin` que coincida con el del panel.
5. Si el backend responde 401, se borra la cookie y se vuelve al login con un aviso.
6. Los errores del backend llegan como `ProblemDetail` (RFC 9457) en español y se muestran al usuario.

Además hay cabeceras de seguridad (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) y ningún uso de `dangerouslySetInnerHTML`.

## Stack

Next.js 16 (App Router), React 19, TypeScript estricto, Tailwind CSS v4, shadcn/ui sobre Radix, lucide-react, TanStack Query, react-hook-form con zod, next-themes (tema claro, oscuro o del sistema), sonner para avisos y Recharts para las gráficas.

## Estructura de `panel/`

```
panel/
  app/
    login/              pantalla de acceso
    (panel)/            pantallas autenticadas: resumen, usuarios, pagos, puerta, analitica
    api/auth/           login y logout
    api/bff/[...path]/  proxy hacia el backend con lista blanca
    globals.css         tokens de diseño (variables CSS, claro y oscuro)
  components/
    brand/              PlateChip, StatusBadge, KpiCard, EmptyState, ErrorState, Persiana...
    data/               tabla base y campos de formulario
    shell/              barra lateral, barra superior y menús
    ui/                 componentes de shadcn/ui
  lib/
    server/             solo servidor: proxy con lista blanca y validación de Origin
    api-client.ts       cliente del navegador hacia el BFF
    schemas.ts          schemas zod de usuarios, pagos, puerta y formularios
    analitica*.ts       hooks, fechas de Bogotá, formato y schemas de analítica
  proxy.ts              protege todas las rutas salvo /login
```

## Diseño

La marca "Cupo" toma el estilo de la señalética vial: azul de la señal P como color primario y amarillo de placa colombiana solo como fondo con texto oscuro. Los estados siempre se muestran con icono y texto, nunca solo con color. Los títulos y las cifras usan Space Grotesk, el cuerpo usa Inter, y los montos y las placas llevan cifras tabulares. Los tokens están en `panel/app/globals.css`. La interfaz está en español.

## Contrato con el backend

- Endpoints y DTOs: `../backend/docs/arquitectura/fase-1-modelo.md` (sección 5) y `../backend/docs/cambios-de-contrato-fase-1.md`.
- Analítica y pronóstico: `../backend/docs/contrato-analitica.md`.

Para agregar una llamada nueva: añade la ruta a la lista blanca de `panel/lib/server/backend.ts`, define su schema en `panel/lib/schemas.ts` (o `panel/lib/analitica-schemas.ts`) y úsala con `api` o `apiSend` desde un `useQuery` o `useMutation`.

## Pendiente

- Pantallas de Cámaras y Configuración (tarifas y cupos).
- Selector de fechas libre en Analítica (hoy hay rangos fijos de 7 días a 12 meses).
- Pruebas automatizadas: por ahora se verifica con build, lint, tsc y pruebas manuales.
- Retirar el panel anterior de la raíz del repo.
- Política de seguridad de contenido con nonce, en lugar de `unsafe-inline` en scripts.
