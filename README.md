# Custimoo Builder v2

A complete rewrite of the Custimoo product customizer using **Vue 3, TypeScript, Pinia, TailwindCSS v4, Vite, and Reka UI**. Features a structured 9-step customization workflow, AI logo generation with daily quotas, Inlang/Paraglide compile-time i18n, adaptive routing (widget/SPA/iframe), PostHog analytics, and an undo/redo history system.

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat&logo=vuedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)
![Pinia](https://img.shields.io/badge/Pinia-3.0-FFD859?style=flat)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?style=flat&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=flat&logo=vite)
![Fabric.js](https://img.shields.io/badge/Fabric.js-6.7-F0A500?style=flat)
![Three.js](https://img.shields.io/badge/Three.js-0.180-000000?style=flat&logo=threedotjs)
![Reka UI](https://img.shields.io/badge/Reka_UI-2.6-Headless-purple?style=flat)
![PostHog](https://img.shields.io/badge/PostHog-Analytics-orange?style=flat)
![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?style=flat)

## Customization Workflow (9 steps)

| Step | Description |
|---|---|
| **Products** | Browse catalog by category/subcategory |
| **Style** | Choose garment style variant |
| **Design** | Select design template by category |
| **Colors** | Pick per SVG group; Pantone/TCX; gradient; color clipboard; shuffle; extract from logo |
| **Patterns** | Apply patterns to design layers |
| **Logos** | Upload, position, resize, edit logos; AI logo generation with daily quota |
| **Texts** | Place and style custom text/numbers on canvas zones |
| **Roster** | Per-garment name/number; Excel import; roster sharing |
| **Summary** | Review customization, live pricing, add to cart |

## State Management (18 Pinia stores)

`customization` (colors/logos/texts/rosters + 10-entry undo/redo), `products`, `auth`, `cart`, `company`, `workflow`, `history`, `locker-room`, `logos`, `orders`, `scene`, `ui`, `queryParams`, `profile`, `products-fonts`, `selectors/effective`.

## Key Technical Features

- **API Client** — Axios with "latest-wins" request deduplication (cancels duplicate in-flight requests)
- **E-commerce Adapters** — `ShopifyCartService`, `WooCommerceCartService` via `BaseEcommerceCartService`
- **Adaptive Router** — auto-detects widget (hash), SPA (history), or sandboxed iframe (memory) routing
- **Inlang Paraglide** — compile-time i18n, typed message imports, machine translation support
- **PostHog** — user behavior analytics
- **Vitest** — unit tests with `@vue/test-utils` and `@pinia/testing`

## Build Targets

```bash
npm run build:production  # Paraglide compile + TypeScript check + minify
npm run build:staging
npm run dev               # port 3000
```

## Getting Started

```bash
npm install
npm run dev:with-paraglide   # dev server + i18n compilation
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_ENDPOINT` | Backend API base URL (`/api/v2` appended) |
| `VITE_APP_STORAGE_URL` | AWS S3 base URL |
| `VITE_POSTHOG_KEY` | PostHog API key |
| `VITE_POSTHOG_HOST` | PostHog host URL |

## License
MIT
