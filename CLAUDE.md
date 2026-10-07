# Panel web de administración — Parqueadero

Panel del administrador en HTML, CSS y JavaScript plano. Sin build, sin gestor de paquetes. Bootstrap 5.3.3, Bootstrap Icons y SweetAlert2 vienen por CDN.

## Cómo correrlo
Sirve la carpeta con un servidor estático local y abre `index.html`. El backend (`backend`, puerto 8080) debe estar corriendo y permitir ese origen en CORS (`SecurityConfig.corsConfigurationSource`).

## Estructura
- `index.html` — login del administrador (`js/login.js`)
- `dashboard/` — `usuarios`, `pagos`, `camaras`, `acceso-puerta`, `config` (`.html`)
- `js/` — un archivo por pantalla (`usuarios.js`, `pagos.js`, `camaras.js`, `puerta.js`, `alertas.js`, `login.js`)
- `css/` — estilos por pantalla y `style.css` general

## Autenticación
`POST /api/admin/login` devuelve un JWT que se guarda en `localStorage` bajo la clave `adminToken` y se envía como `Authorization: Bearer <token>`.

## Reglas para trabajar aquí
- Mantén JavaScript plano. No agregues frameworks ni bundlers si no se piden.
- Textos de la interfaz en español.
- Si cambia un endpoint en el backend, hay que actualizar la llamada `fetch` en el `js/` de la pantalla correspondiente.

## Deuda conocida (no la "arregles" sin que se pida)
- La URL del backend está repetida en cada archivo de `js/`, mezclando `http://localhost:8080` y una IP de la red local. Lo ideal sería un solo `js/config.js`.
- El token del admin en `localStorage` es accesible desde cualquier script de la página.
