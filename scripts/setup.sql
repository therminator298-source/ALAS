-- ============================================================
--  ALAS Fabrica Pro - Esquema Supabase
--  Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'operativo' CHECK (rol IN ('operativo','admin')),
  dep TEXT NOT NULL DEFAULT 'fabrica' CHECK (dep IN ('fabrica','deposito','admin')),
  activo BOOLEAN NOT NULL DEFAULT true,
  pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA: tareas
CREATE TABLE IF NOT EXISTS tareas (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT '',
  obs TEXT NOT NULL DEFAULT '',
  hi TEXT NOT NULL DEFAULT '',
  hf TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_proceso','terminado')),
  asig TEXT NOT NULL DEFAULT '',
  dep TEXT NOT NULL DEFAULT 'fabrica' CHECK (dep IN ('fabrica','deposito')),
  prio BOOLEAN NOT NULL DEFAULT false,
  "pOrder" INTEGER,
  "fCrea" TEXT NOT NULL DEFAULT '',
  "fIni" TEXT NOT NULL DEFAULT '',
  "fFin" TEXT NOT NULL DEFAULT '',
  "creadoPor" TEXT NOT NULL DEFAULT '',
  retraso TEXT NOT NULL DEFAULT '',
  "delayCount" INTEGER NOT NULL DEFAULT 0,
  "delayTotalMinutes" INTEGER NOT NULL DEFAULT 0,
  "delayActive" BOOLEAN NOT NULL DEFAULT false,
  "delayCurrentId" TEXT NOT NULL DEFAULT '',
  "delayCurrentStart" TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA: demoras (historial)
CREATE TABLE IF NOT EXISTS demoras (
  id TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL DEFAULT '',
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fin TIMESTAMPTZ,
  minutos INTEGER NOT NULL DEFAULT 0,
  "abiertaPor" TEXT NOT NULL DEFAULT '',
  "cerradaPor" TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','cerrada')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA: sesiones
CREATE TABLE IF NOT EXISTS sesiones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- 5. FUNCIÓN: login_usuario
CREATE OR REPLACE FUNCTION login_usuario(p_id TEXT, p_pin TEXT DEFAULT '')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user record;
  v_token text;
BEGIN
  SELECT * INTO v_user FROM usuarios WHERE id = p_id AND activo = true;
  IF NOT FOUND THEN
    RETURN json_build_object('status', 'error', 'message', 'Usuario no encontrado o inactivo');
  END IF;

  IF v_user.rol = 'admin' THEN
    IF p_pin = '' OR encode(digest(p_pin, 'sha256'), 'hex') != v_user.pin_hash THEN
      RETURN json_build_object('status', 'error', 'message', 'PIN incorrecto');
    END IF;
  END IF;

  INSERT INTO sesiones ("userId", token) VALUES (v_user.id, gen_random_uuid()::text)
  RETURNING token INTO v_token;

  RETURN json_build_object(
    'status', 'ok',
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'nombre', v_user.nombre,
      'rol', v_user.rol,
      'dep', v_user.dep
    )
  );
END;
$$;

-- 6. FUNCIÓN: validar_sesion
CREATE OR REPLACE FUNCTION validar_sesion(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session record;
  v_user record;
BEGIN
  SELECT s.* INTO v_session FROM sesiones s
  WHERE s.token = p_token AND s.activa = true AND s.expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'error', 'message', 'Sesion invalida o expirada');
  END IF;

  SELECT * INTO v_user FROM usuarios WHERE id = v_session."userId" AND activo = true;
  IF NOT FOUND THEN
    RETURN json_build_object('status', 'error', 'message', 'Usuario no disponible');
  END IF;

  RETURN json_build_object(
    'status', 'ok',
    'user', json_build_object(
      'id', v_user.id,
      'nombre', v_user.nombre,
      'rol', v_user.rol,
      'dep', v_user.dep
    )
  );
END;
$$;

-- 7. DESHABILITAR RLS (Row-Level Security) para que la app pueda leer/escribir
--    La app maneja su propio sistema de autenticación con PIN, no usa auth de Supabase
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE tareas DISABLE ROW LEVEL SECURITY;
ALTER TABLE demoras DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones DISABLE ROW LEVEL SECURITY;

-- 8. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_tareas_fecha ON tareas(fecha);
CREATE INDEX IF NOT EXISTS idx_tareas_dep ON tareas(dep);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_demoras_taskId ON demoras("taskId");
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_userId ON sesiones("userId");

-- 9. HABILITAR REAL-TIME para tareas (ignora si ya existe)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tareas;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;
