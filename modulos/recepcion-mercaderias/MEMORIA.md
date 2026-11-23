# SISTEMA DE RECEPCIÓN DE MERCADERÍAS

## Objetivo
Sistema web para que el recepcionista pueda **importar archivos Excel** con mercadería recibida y **llevar el control parcial** de cada item, registrando cantidades encontradas de forma incremental.

---

## Flujo de uso

### 1. Importar Excel
- El recepcionista sube un archivo Excel (.xlsx, .xls)
- El sistema lee las hojas y muestra una **vista previa**
- El usuario selecciona: qué hoja usar, qué columna es código, descripción y cantidad
- El usuario ingresa el **proveedor** y **documento de compras**
- Se guarda la importación con todos sus items

### 2. Dashboard
- Muestra todas las importaciones registradas
- Tarjetas con estadísticas: Totales / Abiertos / Parciales / Completos
- Filtros por proveedor y estado
- Cada importación muestra: fecha, proveedor, doc compras, items, controlados, estado

### 3. Detalle de importación
- Al hacer clic en "Ver" se abre el detalle con todos los items
- Muestra por cada item: código, descripción, cant. esperada, cant. por caja, cant. controlada, bultos, progreso, estado
- Botón "Controlar" para abrir el modal de control parcial

### 4. Control Parcial (clave del sistema)
- Se abre un modal donde el recepcionista ingresa:
  - **Cantidad encontrada** (ej: 10)
  - **Bultos / cajas** (ej: 1)
- Al guardar, se suma al total controlado del item
- Se puede controlar varias veces: encuentra 10 → guarda, encuentra 5 más → guarda, total = 15
- Queda registro de cada control parcial (fecha, cantidad, bultos)
- Los controles se pueden eliminar individualmente

### 5. Estados automáticos
- **Pendiente** = no se controló nada
- **Parcial** = se controló algo pero no alcanza la cantidad esperada
- **Completo** = la cantidad controlada >= cantidad esperada

---

## Estructura de datos

| Tabla | Descripción |
|---|---|
| `proveedores` | Proveedores (se crean automáticamente al importar) |
| `importaciones` | Cada importación de Excel con su proveedor, documento, estado |
| `items` | Items de cada importación con código, descripción, cantidades, estado |
| `controles_parciales` | Registro individual de cada control (cantidad, bultos, fecha) |

---

## Tecnología
- **Frontend:** HTML + CSS + JavaScript vanilla (sin frameworks)
- **Backend:** Node.js + Express
- **Base de datos:** SQLite (archivo local, no requiere instalación)
- **Excel:** Librería `xlsx` (SheetJS)

## Cómo ejecutar
```bash
cd "LAUNCHER 2.0/Recepcion de mercaderias"
npm start
```
Abrir en navegador: http://localhost:3000

---

## Pendientes / ideas futuras
- [ ] Exportar reporte de control por importación
- [ ] Editar items manualmente
- [ ] Múltiples usuarios con login
- [ ] Subir fotos de la mercadería recibida
