# Calendario de tareas — vista móvil

Reestructuración del apartado Calendario para que un operario de rol
`CALENDARIO` pueda cargar, registrar y leer tareas desde el teléfono.

## ⚠️ Antes de desplegar

Correr en el **SQL Editor del proyecto Supabase del Calendario**:

```
db/calendario_orden_fix.sql
```

Renumera el `orden` de las tareas ya cargadas y crea la RPC `reorder_tareas`.
Sin esto la app funciona igual (cae a un PATCH por fila), pero el orden manual
sigue mezclando las tareas de distintos días. El script es idempotente.

## Qué estaba roto

| # | Problema | Dónde |
|---|---|---|
| 1 | El drag & drop usaba eventos HTML5, que **no existen en móvil**: reordenar y reprogramar eran imposibles desde el teléfono, con un asa `⠿` visible que no hacía nada | `CalendarioView.tsx` |
| 2 | El título de la tarea tenía **~70px** de ancho en un teléfono de 360px: se cortaba a ~8 caracteres | fila de escritorio |
| 3 | Los campos usaban 14px → **iOS hacía zoom** al enfocarlos y no volvía | `index.css` |
| 4 | "Eliminar" al lado de "Guardar", los tres botones del mismo ancho y **sin confirmación** | `TareaFormModal.tsx` |
| 5 | El chip de estado (la acción más frecuente) medía **32px** y estaba dentro de una fila clickeable | fila de escritorio |
| 6 | El error de lectura se mostraba como "Sin tareas": el operario podía **recargar algo ya existente** | `calendarioApi.ts` |
| 7 | `orden` se escribía 0..n sobre la lista visible → reordenar un día **desordenaba el mes entero** | `CalendarioView.tsx` |
| 8 | Reordenar disparaba **un PATCH por tarea**, con los fallos silenciados | `CalendarioView.tsx` |
| 9 | No había cabecera, usuario ni "salir" en móvil; el `Topbar` y el sidebar están ocultos en `/calendario` | `AppShell.tsx` |
| 10 | `min-height: 100vh` con la barra de URL visible → scroll fantasma y última tarea tapada | `modelShell.css` |
| 11 | En un Android de 640px la lista quedaba con **106px** de alto | layout anidado |
| 12 | Sin `@media (hover: hover)`: los estados hover se quedaban pegados tras cada toque | global |
| 13 | El popover de tipo de tarea se cortaba dentro de la hoja de 92dvh | `TareaFormModal.tsx` |
| 14 | Realtime publicado en el schema pero nadie suscrito | `calendarioApi.ts` |

## Cómo quedó

**Tarjeta móvil dedicada** (`TareaCardMobile.tsx`). Vertical, con el título en
hasta 3 líneas completas y los metadatos como chips que envuelven. Elegida por
`useMediaQuery` en tiempo de ejecución, no con `hidden lg:block`: dos árboles
montados registrarían los mismos ids en dnd-kit dos veces.

**Tres caminos para cada acción.** Un gesto nunca es el único camino:

| Acción | Gesto | Botón |
|---|---|---|
| Cambiar estado | deslizar la tarjeta ←/→ | chip grande, o menú `···` |
| Reordenar | arrastrar desde el asa `⠿` | — |
| Reprogramar | arrastrar a un día del riel | `···` → Mover |
| Editar | tocar la tarjeta | `···` → Editar |
| Eliminar | — | `···` → Eliminar (2 pasos) |

**Reparto de gestos.** El cuerpo de la tarjeta lleva `touch-action: pan-y` (el
navegador conserva el scroll vertical, nosotros el horizontal para el swipe) y
el asa lleva `touch-action: none` con los listeners de dnd-kit. Si los
listeners viven en toda la tarjeta, el navegador se queda con el gesto vertical
y el arrastre no arranca nunca.

**Scroll de página en móvil.** El layout dejó de anidar un scroller de altura
fija: la página crece y el riel de días queda `sticky`. El FAB es fijo, así que
"Nueva tarea" siempre está a mano.

**`orden` por (depósito, fecha)** y consulta ordenada por fecha primero.
Reordenar con filtros activos está bloqueado y avisado: renumerar sobre la lista
visible pisaría las tareas ocultas.

## Verificación

```bash
npm run dev:test          # en una terminal
npm run verify:mobile     # en otra
```

Corre 10 comprobaciones en un viewport de 390x844 táctil y deja capturas en
`node_modules/.cache/calendar-mobile/`. Requiere `npx playwright install chromium`.

```
OK  campos con fuente >= 16px (sin zoom en iOS)
OK  todos los controles >= 44px
OK  sin scroll horizontal en la página
OK  título largo visible completo
OK  deslizar cambia el estado y lo guarda
OK  el asa reordena con el dedo
OK  el reorden se guarda en una sola llamada
OK  el menú ofrece por botón lo que hacen los gestos
OK  popover de tipo de tarea entero en pantalla
OK  se puede crear una tarea desde el teléfono
```

## Pendiente

- El chip de estado del escritorio sigue en 36px de alto; en táctil lo cubre la
  regla global de 44px, pero la fila de escritorio no se rediseñó.
- Los tres depósitos se traen en una sola consulta del mes porque el segmentado
  muestra el contador de cada uno. Filtrar por depósito en el servidor obligaría
  a tres consultas; se dejó el filtro en el cliente a propósito.
- El manifest ya no fija `orientation: portrait-primary`: el teléfono puede
  rotar. Si se prefiere bloquear vertical, volver a agregarlo.
