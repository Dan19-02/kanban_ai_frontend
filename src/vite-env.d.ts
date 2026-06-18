/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the backend API in production, e.g. https://kanban-ai-backend.onrender.com */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
