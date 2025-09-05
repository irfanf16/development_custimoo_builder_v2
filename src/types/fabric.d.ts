// Ambient module augmentation for Fabric.js used throughout the app
// Provides optional custom fields we read (id, fill) and access to group objects

import 'fabric'

declare module 'fabric' {
  interface FabricObject {
    id?: string
    // fill can be a string or objects exposing color via helpers
    fill?: string | { toHex: () => string } | { color: string }
  }

  interface Group {
    // We traverse internal objects when extracting SVG groups/colors
    _objects: FabricObject[]
  }
}
