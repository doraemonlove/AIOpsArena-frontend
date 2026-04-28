/// <reference types="vite/client" />
/// <reference types="element-plus/global" />
/// <reference types="jsdom" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const vueComponent: DefineComponent<{}, {}, any>
  export default vueComponent
}

declare module 'nprogress'
declare module 'crypto-js'
declare module 'vue3-json-viewer'

interface ImportMetaEnv {
  readonly VITE_BASE_URL?: string
  readonly VITE_PLATFORM_ASSISTANT_BACKEND_BASE_URL?: string
  readonly VITE_PLATFORM_ASSISTANT_AGENT_SERVER_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
