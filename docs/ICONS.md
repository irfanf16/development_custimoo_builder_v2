## Icons Guide (Lucide, Flex Duo, Flex Line)

This project uses three icon sources:

- **Lucide** (via `lucide-vue-next`)
- **Streamline Flex Duo** (two‑tone) — bundled in full
- **Streamline Flex Line** (outline) — tree‑shaken (only used icons are bundled)

Vite is configured with `unplugin-icons` to load Streamline SVGs as Vue components that render inline SVG and support Tailwind colors.

### Where icons live

- Streamline Flex Duo SVGs: `src/icons/streamline/flex-duo/`
- Streamline Flex Line SVGs: `src/icons/streamline/flex-line/`

### Naming and usage (Streamline → Vue components)

- Components are auto‑generated with the pattern: `i-{collection}-{file-name-without-.svg}`
- File names are normalized to kebab‑case. We removed the `--Streamline-Flex` suffix from all files to avoid inconsistencies. Examples:
  - `src/icons/streamline/flex-line/Paint-Palette.svg` → `<i-flex-line-paint-palette />`
  - `src/icons/streamline/flex-line/Landscape1.svg` → `<i-flex-line-landscape1 />`
  - `src/icons/streamline/flex-duo/Football.svg` → `<i-flex-duo-football />`

### Coloring and sizing

- All icons render as inline SVG and follow `currentColor`.
- Use Tailwind `text-*` utilities for color and `size-*/w-*/h-*` for size.
- Flex Line (outline): stroke uses `currentColor` (monochrome by default).
- Flex Duo (two‑tone):
  - Primary layer: `var(--icon-primary, currentColor)` → inherits from `text-*`.
  - Secondary layer: `var(--icon-secondary, currentColor)` → set this CSS variable to see the second tone. Defaults to the same as primary if not set (appears monochrome).

Examples:

```vue
<!-- Flex Line (outline, tree-shaken) -->
<i-flex-line-paint-palette class="size-5 text-blue-600" />

<!-- Flex Duo (two-tone, fully bundled) -->
<i-flex-duo-football
  class="size-6 text-emerald-600"
  style="--icon-secondary:#a7f3d0"
/>
```

#### Flex Duo secondary color tips

- Per‑icon (inline):

  ```vue
  <i-flex-duo-tennis
    class="size-5 text-green-600"
    style="--icon-secondary:#b7f7c2"
  />
  ```

- Derived from the primary color (keeps harmony):

  ```vue
  <i-flex-duo-cycling
    class="size-5 text-blue-600"
    :style="{
      '--icon-secondary': 'color-mix(in oklab, currentColor 60%, white)'
    }"
  />
  ```

- Themed (apply to a wrapper so all Duo icons inside get the same secondary):
  ```html
  <div class="[&_*]:text-emerald-600" style="--icon-secondary:#a7f3d0">
    <!-- any i-flex-duo-* inside uses this secondary color -->
  </div>
  ```

### Streamline Flex Duo (bundled in full)

- All Flex Duo icons are force‑included by importing a registry once in `src/bootstrap.ts`:
  - `import '@/icons/flex-duo-categories'`
- That file imports every `virtual:icons/flex-duo/*` icon so none are tree‑shaken.
- You can still use them ad‑hoc in templates with the `i-flex-duo-*` component names.

### Streamline Flex Line (tree‑shaken)

- Only the icons you reference are bundled. Use the `i-flex-line-*` components.
- To add a new Flex Line icon: drop its SVG in `src/icons/streamline/flex-line/` and use the mapped component name.

### Lucide

- Install is already present: `lucide-vue-next`.
- Import only what you use to keep bundles small:

```vue
<script setup lang="ts">
  import { Dumbbell } from 'lucide-vue-next'
</script>

<template>
  <Dumbbell class="size-5 text-zinc-700" :stroke-width="1.5" />
  <!-- Avoid: import * as icons from 'lucide-vue-next' (bloats bundle) -->
  <!-- Use per-icon imports instead (tree-shaken) -->
  <!-- Color with Tailwind text-*; size with size-/w-/h- utilities -->
</template>
```

### Adding new Streamline icons

1. Save the SVG into the correct folder (`src/icons/streamline/flex-line/` or `src/icons/streamline/flex-duo/`).
2. Ensure the file name does not contain the `--Streamline-Flex` suffix. If your source SVG includes it, remove it and keep the `.svg` extension, e.g. `Paint-Palette--Streamline-Flex.svg` → `Paint-Palette.svg`.
3. The component will be available as `i-flex-line-{kebab-file-name}` or `i-flex-duo-{kebab-file-name}` respectively. Example: `Paint-Palette.svg` → `<i-flex-line-paint-palette />`.
4. If a new Duo icon is added and must always be included, import it in `src/icons/flex-duo-categories.ts` to keep it from being tree‑shaken.

### Troubleshooting

- **TS error: Cannot find module 'virtual:icons/...':**
  - Ensure `src/types/virtual-icons.d.ts` exists with:
    ```ts
    declare module 'virtual:icons/*' {
      import { FunctionalComponent, SVGAttributes } from 'vue'
      const component: FunctionalComponent<SVGAttributes>
      export default component
    }
    ```
  - Restart the dev server.

- **Vite error: Icon `flex-line/...` not found:**
  - Check the SVG file exists under `src/icons/streamline/flex-line/`.
  - Confirm the kebab‑case mapping. Example: `Landscape1.svg` → `landscape1` (no dash before the number).

- **Tooltips/popovers rendering incorrectly in host page:**
  - This widget runs in a Shadow DOM. Portals must teleport into the widget container.
  - We set `window.__CUSTOMIZER_CONTAINER__` in `src/bootstrap.ts` and use it in tooltip content. Reuse that target for any new portal‑based UI.

- **All Flex Duo icons not showing up:**
  - Ensure `import '@/icons/flex-duo-categories'` remains in `src/bootstrap.ts`.
  - Verify the icons exist in `src/icons/streamline/flex-duo/` (not in a subfolder).

- **Flex Duo looks monochrome:**
  - Set a secondary color: add `style="--icon-secondary: <color>"` on the icon or on a wrapper element. Without it, secondary defaults to primary.

- **Bundle size concerns:**
  - Flex Duo is intentionally fully bundled (project requirement).
  - Flex Line remains tree‑shaken; only use what you need.
  - For Lucide, always import icons individually from `lucide-vue-next`.

### References

- Vite plugin config: `vite.config.ts` (custom collections: `flex-line`, `flex-duo`)
- Duo registry: `src/icons/flex-duo-categories.ts` (forces full Duo bundle)
- Tooltip portal target: `src/bootstrap.ts` (`__CUSTOMIZER_CONTAINER__`)
