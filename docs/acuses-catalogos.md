# Catálogos reales de Acuses

El importador usa únicamente los datos necesarios para crear un acuse:

- Clientes: código, nombre, RUC, dirección, ciudad, departamento y teléfono.
- Mercaderías: código, descripción y unidad de medida.

`Marca`, `Grupo` y `Familia` no se importan. Los Excel originales nunca se
modifican y el proceso es idempotente: si se repite, actualiza cada código en
lugar de duplicarlo.

## 1. Validar los Excel

Desde la raíz del repositorio:

```powershell
npm.cmd run verify:acuses-catalogs
```

La validación no usa red ni escribe en Supabase. Revisa hojas, columnas,
códigos vacíos, duplicados y campos obligatorios.

## 2. Instalar el guardado atómico

Ejecutar una vez en el SQL Editor del proyecto de Acuses:

```text
db/acuse_guardado_atomico.sql
```

La función guarda cabecera, mercaderías, historial y auditoría dentro de una
única transacción. También toma nombre, dirección, departamento y descripción
directamente de los catálogos, evitando datos manipulados o desactualizados.

Se puede verificar localmente con:

```powershell
npm.cmd run verify:sql
```

## 3. Importar

La clave secreta se usa solo en la terminal. Nunca debe tener prefijo `VITE_`,
guardarse en Git ni enviarse al navegador. El importador todavía admite la
variable legacy `ACUSE_SUPABASE_SERVICE_ROLE_KEY` si el proyecto la utiliza.

```powershell
$env:ACUSE_SUPABASE_URL='https://TU_PROYECTO.supabase.co'
$env:ACUSE_SUPABASE_SECRET_KEY='sb_secret_TU_CLAVE'
npm.cmd run import:acuses-catalogs
```

El proceso muestra avance por lotes y los conteos antes/después. Si se corta,
puede ejecutarse otra vez de forma segura.

También admite rutas diferentes:

```powershell
node scripts/import-acuse-catalogs.mjs --clientes="C:\ruta\clientes.xlsx" --mercaderias="C:\ruta\mercaderias.xlsm" --apply
```

## 4. Retirar datos demo

Después de comprobar búsquedas, creación e impresión con datos reales, estos
códigos demo pueden eliminarse desde el SQL Editor:

```sql
delete from clientes
where cod_cliente in ('C1001', 'C1002', 'C1003', 'C1004');

delete from articulos
where material in ('100023', '100048', '100112', '100205');
```

Los códigos demo no aparecen en los Excel entregados.
