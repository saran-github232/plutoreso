/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public base URL of the backend API (public config only — never secrets). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
