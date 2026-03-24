/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_KEY_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
