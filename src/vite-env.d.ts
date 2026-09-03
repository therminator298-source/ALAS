/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_LAUNCHER_URL?: string;
  readonly VITE_ALAS_MODULE_KEY?: string;
  readonly VITE_ALAS_SSO_VERIFY_URL?: string;
  readonly VITE_ALAS_SSO_VERIFY_ANON_KEY?: string;
  readonly VITE_REQUIRE_ALAS_SSO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
