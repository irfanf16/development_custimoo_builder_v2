declare module 'three' {
  export * from 'three'
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader, LoadingManager } from 'three'
  import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager)
    load(
      url: string,
      onLoad?: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: unknown) => void
    ): void
    loadAsync(
      url: string,
      onProgress?: (event: ProgressEvent) => void
    ): Promise<GLTF>
  }
}
