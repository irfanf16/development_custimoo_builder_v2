## Customizer Widget

This repository contains a Vue 3 + TypeScript widget for product customization.

### Docs

- Architecture: `docs/ARCHITECTURE.md`
- Icons: `docs/ICONS.md`
- Styling: `docs/STYLING.md`
- Stores guide: `src/stores/README.md`
- Composables guide: `src/composables/README.md`
- History (undo/redo): `src/stores/history/README.md`

### Quick start

```bash
npm install
npm dev
```

### Component scaffolding (shadcn/vue)

We vendor UI components into `src/components/ui/*` using the shadcn/vue CLI. Use npx to run the CLI without installing it:

```bash
# Initialize (generates/updates components.json)
npx shadcn-vue@latest init --yes

# Add a component (example: button)
npx shadcn-vue@latest add button --yes
```

Refer to `docs/STYLING.md` for how our tokens and Tailwind v4 map into component styles.
