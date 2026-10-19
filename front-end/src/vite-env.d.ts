/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute base URL of the .NET API, e.g. http://localhost:5000/api/v1. */
  readonly VITE_API_BASE_URL: string;
  /** Origin of the .NET server without a path, e.g. http://localhost:5000. */
  readonly VITE_SERVER_ORIGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
