# Carga inicial de Acuses

La entrada esperaba Chart.js desde un CDN y despues descargaba supabase-js
desde otro CDN. El arranque consultaba catalogos, tres resumenes y el calendario
antes de terminar de mostrar la vista principal. La animacion tambien ocultaba
el contenido, con un respaldo de 2500 ms.

Ahora se muestra la estructura inmediatamente y se solicitan en paralelo la
tabla, los estados para los contadores y el catalogo de repartidores. Las
consultas simultaneas al catalogo comparten una sola solicitud. Los contadores
leen solo estado y activo, en paginas de 1000 registros, sin calcular graficos
historicos durante la entrada.

Resumen y Calendario consultan sus datos al abrirse. Chart.js se carga solo en
Resumen; la tabla funciona incluso si falla la carga de graficos. Vite sirve y
emite los SDK y sus licencias desde las dependencias instaladas y fijadas en
package-lock.json, sin depender de los CDN durante la ejecucion.

La navegacion padre/iframe conserva la vista elegida durante el arranque. Se
agregaron reintentos para errores de carga y se ajusto la vista inicial movil
para evitar barras de navegacion duplicadas y una tabla sin altura util.

## Verificacion

Prueba automatizada: `scripts/verify-acuses-startup.mjs`.
Requiere Playwright con Chromium disponible. Se puede instalar para pruebas con
`npm install --no-save --package-lock=false playwright` y
`npx playwright install chromium`. Ejecutar el servidor con `npm run dev` y usar
`ACUSES_TEST_URL` para indicar su URL; el valor predeterminado es
`http://127.0.0.1:5179`.

Ejecutar `node scripts/verify-acuses-startup.mjs`. Si Playwright ya esta instalado
en otra carpeta, `PLAYWRIGHT_PACKAGE` admite la ruta a su archivo `index.mjs`.
`--smoke` verifica solamente la entrada. Los resultados y capturas se guardan en
`node_modules/.cache/acuses-startup/`, fuera del control de versiones.

Las pruebas interceptan todas las conexiones externas y simulan los datos;
no leen ni modifican registros de produccion. Incluyen:

- Escritorio de 1440 px y movil de 390 px.
- Cambio de vista mientras siguen pendientes las consultas iniciales.
- Las cinco vistas y graficos reales, comprobando pixeles de los canvas.
- Fallos de API, SDK, contadores y graficos; recuperacion mediante Reintentar.
- Contadores de 1005 registros, estados anteriores y registros inactivos.
- El rol Calendario sigue sin poder acceder a Acuses.

Medicion local del 12/09/2026 con 400 ms por consulta, mas 1200 ms para el CDN de
graficos y 700 ms para el CDN del SDK en la version anterior:

| Primera tabla con datos | Antes | Despues |
| --- | --- | --- |
| Escritorio | 4,42 s | 0,98 s |
| Movil | 4,26 s | 1,25 s |

Las consultas iniciales a la base bajaron de 10 a 3 en este escenario. Estos
tiempos corresponden a una red simulada y no son una medicion de produccion.
El volumen real de acuses, la verificacion SSO y la red siguen influyendo.

`npm run build` incluye los dos SDK en `dist/acuse/vendor/`. No se requiere una
migracion SQL para estos cambios. Se mantiene el aviso previo de Vite sobre el
tamano del bundle principal.

Referencias de implementacion: [plugins de Vite](https://vite.dev/guide/api-plugin.html)
y [integracion de Chart.js](https://www.chartjs.org/docs/latest/getting-started/integration).
