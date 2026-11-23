# Módulos del Grupo que viven en este repo

Dos sistemas que no tenían repositorio propio y existían **sólo en el disco de
trabajo**. Se guardan acá para que tengan respaldo e historia.

**Ninguno de los dos entra en el build de Vercel.** `vite build` sólo compila lo
que cuelga de `src/`, y `tsconfig.json` sólo incluye `src`. Estas carpetas viajan
al contenedor de build y se ignoran.

---

## `acuse-express-mysql/`

La versión **original** del sistema de Acuses: API Express sobre **MySQL** más su
front estático. Es la que se corría con `npm start` desde su propia carpeta.

⚠️ **No confundir con `public/acuse/`**, que es la copia viva: el mismo front
pero hablando **Supabase** desde el navegador, servida dentro de la app React.
Las dos ya divergieron:

| archivo | líneas distintas |
|---|---|
| `js/dashboard-acuses.js` | 158 |
| `views/dashboard-Acuses.html` | 50 |

La diferencia es el modo embebido (navegación por `postMessage`, sin su propio
sidebar) y las tipografías servidas desde `/fonts`.

Desde que el apartado Acuses se reescribió en React — listar, crear, editar,
detalle, estados, anular e imprimir — **esta versión quedó como referencia
histórica**. El front de `public/acuse/` sigue en uso sólo para las vistas
Resumen e Historial, que todavía no se migraron.

`node_modules`, `.env` (tiene la contraseña de MySQL) y los logs quedan afuera
por su propio `.gitignore`.

## `recepcion-mercaderias/`

Control de recepción en depósito: servidor **Express sobre SQLite** y el front
estático que consume su API.

- `server.js` — los endpoints
- `database.js` — esquema y acceso a SQLite
- `public/` — `index.html`, `app.js`, `style.css`
- `MEMORIA.md` — notas del módulo

Queda afuera lo que es estado de ejecución: `node_modules`, `uploads/` y `data/`
con la base. Los archivos `-wal` y `-shm` son el diario y el bloqueo de la
conexión abierta, así que **una copia de la base tomada en caliente queda
inconsistente**: para versionar los datos hace falta un volcado,

```bash
sqlite3 data/recepcion.db ".backup copia.db"
```

no el archivo vivo.
