/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_FC_BASE_URL?: string
  readonly VITE_FC_WS_URL?: string
  readonly VITE_FC_SECRET_ID?: string
  readonly VITE_FC_SECRET_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
