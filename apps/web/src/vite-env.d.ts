/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_GL_JS_PUBLIC: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
