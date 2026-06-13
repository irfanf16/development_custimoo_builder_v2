# Custimoo Builder v2

> **Vue 3 Web Component** — Interactive 2D/3D product customizer for the [Custimoo](https://custimoo.com) platform. Compiles to a single `widget.js` that embeds into any storefront via a `<script>` tag. Customers build fully customized sportswear and apparel through a guided 9-step workflow with real-time Fabric.js 2D canvas and Three.js 3D preview.

![Vue.js](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Fabric.js](https://img.shields.io/badge/Fabric.js-6-orange?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-0.180-black?style=flat-square&logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?style=flat-square)
![i18n](https://img.shields.io/badge/i18n-11_languages-blue?style=flat-square)

---

## Table of Contents
- [What is this?](#what-is-this)
- [Web Component Architecture](#web-component-architecture)
- [Tech Stack](#tech-stack)
- [9-Step Builder Workflow](#9-step-builder-workflow)
- [Pinia Stores (16 Stores)](#pinia-stores-16-stores)
- [Router Structure](#router-structure)
- [Fabric.js — 2D Canvas](#fabricjs--2d-canvas)
- [Three.js — 3D Preview](#threejs--3d-preview)
- [AI Logo Generation](#ai-logo-generation)
- [E-commerce Integrations](#e-commerce-integrations)
- [Undo/Redo History System](#undoredo-history-system)
- [Internationalisation (11 Languages)](#internationalisation-11-languages)
- [PostHog Analytics](#posthog-analytics)
- [Test Suite](#test-suite)
- [Build Output](#build-output)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## What is this?

Custimoo has three frontend applications:
```
development_custimoo_builder_v2  — THIS REPO — Customer-facing product customizer
development_admin_v2             — Internal admin/order management panel
custimoo (backend)               — Laravel 12 REST API
```

The builder is used by **end customers** on any merchant's storefront. It is delivered as a single ES module bundle and embeds as a Shadow DOM Web Component, fully isolated from the host page's CSS and scripts.

```html
<!-- All a merchant needs to embed Custimoo on their storefront -->
<v-customizer date="..." color="#FF0000"></v-customizer>
<script src="https://cdn.custimoo.com/v2/widget.js" type="module"></script>
```

---

## Web Component Architecture

```
Host page (Shopify / WooCommerce / BigCommerce / self-hosted)
    |
    | <script src="cdn.custimoo.com/v2/widget.js">
    v
custimoo_self_build.js loader
    -> GET api.custimoo.com/api/get_app_version
    -> inject widget.js?build={version}  (cache-busted)
    |
    v
<v-customizer> Custom Element
    Shadow DOM (open mode)
        CSS injected into shadow root (full isolation)
        CSS also mirrored to document.head for Teleport portals
        |
        v
    Vue 3 app (mounted inside Shadow DOM)
        Router (Memory / Hash / Web History — adaptive)
        Pinia stores
        Axios HTTP client -> api.custimoo.com/api/v2
```

**Build mode:** Vite `lib` mode, `format: "es"`, `inlineDynamicImports: true` → single `dist/widget.js`.
Post-build step runs `esbuild` minification pass. App version injected from `package.json` as `__APP_VERSION__`.

**CDN URLs:**
- Production: `https://cdn.custimoo.com/v2/widget.js`
- Staging: `https://builder-v2.custimoo.com/widget.js`

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `vue` | ^3.5.25 | Core framework (Composition API, `<script setup>`) |
| `typescript` | ~5.9.3 | Type safety |
| `vite` | ^7.1.9 | Build tool (lib mode → single ES bundle) |
| `vue-router` | ^4.6.3 | Client-side routing (adaptive history strategy) |
| `pinia` | ^3.0.4 | State management (16 stores) |
| `pinia-plugin-persistedstate` | — | Persist workflow + history to localStorage |
| `@tanstack/vue-query` | — | Server state |
| `tailwindcss` | ^4.1.14 | Styling (v4 via `@tailwindcss/vite`) |
| `reka-ui` | ^2.6.1 | Headless component primitives |
| `vee-validate` | ^4.15.1 | Form validation |
| `@vee-validate/zod` + `zod` | ^4.15.1 / ^3.24.1 | Schema validation |
| `axios` | ^1.12.2 | HTTP client (JWT refresh interceptor, request deduplication) |
| `@vueuse/core` | ^13.9.0 | Vue composables |
| `fabric` | ^6.7.1 | 2D canvas engine for product customization |
| `three` | ^0.180.0 | 3D product preview (GLTF + DRACO + HDR) |
| `opentype.js` | ^1.3.4 | Custom font glyph-to-path for Fabric.js text |
| `@inlang/paraglide-js` | ^2.4.0 | i18n (11 languages, compiled at build time) |
| `posthog-js` | ^1.310.1 | Analytics (EU region, identified profiles only) |
| `embla-carousel-vue` | ^8.6.0 | Product carousel |
| `vuedraggable` | ^4.1.0 | Drag-to-reorder logo/text layers |
| `lodash-es` | ^4.17.21 | Utility functions |
| `lucide-vue-next` | ^0.544.0 | Icons |
| `xlsx` | ^0.18.5 | Excel roster import |
| `vitest` | ^3.2.4 | Unit testing |
| `@vue/test-utils` | ^2.4.10 | Component testing utilities |

---

## 9-Step Builder Workflow

The full customization is guided through 9 sequential steps, tracked in `workflowStore.activeStep`:

| Step | Name | Key Sub-steps | Description |
|---|---|---|---|
| 1 | `product` | category → subcategory → product | Browse product catalogue, select item |
| 2 | `designs` | Design category tabs | Select base design template |
| 3 | `styles` | — | Choose cut/style variant |
| 4 | `colors` | SVG group accordion | Recolor each SVG layer — solid, gradient, Pantone Coated/TCX |
| 5 | `patterns` | list → edit | Apply repeating pattern fills to SVG layers |
| 6 | `logos` | list → placement → edit | Upload/AI-generate logo, drag onto canvas, edit colors |
| 7 | `texts` | list → placement → single → multipleitems | Add name/number fields, choose font, set position |
| 8 | `roster` | list → edit | Build per-member size/name/number roster, Excel import |
| 9 | `summary` | — | Final review, pricing, add to cart |

Step navigation state persists to `localStorage` and restores on page reload. Each step has its own header config, breadcrumbs, and prev/next footer buttons.

---

## Pinia Stores (16 Stores)

| Store | Key State |
|---|---|
| `appStore` | App version, `isReorderFlow`, `shareUrl`, pending toast messages |
| `authStore` | Customer JWT, refresh token (AES-256 encrypted in localStorage), permissions, sales reps, token refresh logic, localStorage polling for host-page auth |
| `cartStore` | Cart items, `editingCartItemId`, e-commerce platform cart sync (factory pattern: Shopify / WooCommerce / BigCommerce) |
| `companyStore` | Company info, factory settings, branding, currencies, MOQ, color type (Pantone Coated vs TCX), localization config |
| `customizationStore` | Active customization state: product/style/design IDs, `product_custom_texts`, `custom_logos`, `default_colors`, `group_colors`, `products_rosters`, `addons_info`, `group_patterns`. History stack (max 10) |
| `historyStore` | Undo/redo stacks, action registry (apply/revert handlers), batch operations. Persisted to localStorage |
| `lockerRoomStore` | Saved designs (lockers), collections, brand colors, roster data |
| `logosStore` | Logo library, recent logos, active logo, AI logo quota state |
| `ordersStore` | Order list, order detail, reorder flow flag |
| `productsStore` | Categories, active product/style/design details, SVG groups (front+back), all previews, design custom text (persisted per design+product key) |
| `productsFontsStore` | Font assets per product (for opentype.js rendering) |
| `profileStore` | Dashboard counters, addresses, preferences, locale, effective theme (light/dark) |
| `queryParamsStore` | One-time URL params (`sync_id`, `update_item`, `token`, `roster`) — consumed at bootstrap, removed from URL |
| `sceneStore` | Refs to Fabric 2D canvases (front+back) and Three.js scene. Manages front↔back logo/text mirroring |
| `uiStore` | Container dimensions, mobile breakpoints (`isMobile` < 1025px), dialog open states (save design, locker browser, cart), fullscreen mode |
| `workflowStore` | Active step, sub-steps per step, canvas side (front/back/3d), zoom, mobile panel, header/footer config. Persisted to localStorage |

---

## Router Structure

Router uses an adaptive history strategy:
- `about:srcdoc` iframes → Memory History
- Widget mode → Hash History
- Standalone SPA → Web History

| Route | Component | Notes |
|---|---|---|
| `/` | `Customizer.vue` | Main builder entry point |
| `/reset-password/:token?` | `Customizer.vue` | Password reset flow inside builder |
| `/order/:order_id/detail` | `Customizer.vue` | Order detail view |
| `/auth` | `Auth.vue` | Standalone auth page |
| `/admin/login` | `Customizer.vue` | Admin impersonation via `?token=` or `?adminToken=` |
| `/third-party-feedback/:order_item_id` | `ThirdPartyApproval.vue` | External approver artwork review (no auth required) |
| `/collection/:collectionSlug/view` | `CollectionView.vue` | Public locker collection view |
| `/:pathMatch(.*)*` | `NotFound.vue` | 404 catch-all |

**Navigation guard:** `/share/*` URLs are intercepted, stored in `appStore.shareUrl`, then redirected to `/`. Admin tokens extracted from `?token=` param, URL cleaned afterward.

---

## Fabric.js — 2D Canvas

**Component:** `TwoDScene.vue` + composables in `src/composables/scene/`

| Feature | Implementation |
|---|---|
| SVG design loading | Fabric `loadSVGFromURL()`, parts identified by ID |
| Real-time recoloring | `useColorCustomization` — SVG object fill replace (solid, gradient, Pantone) |
| Logo placement | `FabricImage`, custom drag/scale/rotate controls via `useFabricControls` |
| Text rendering | `opentype.js` converts glyphs → SVG paths before adding to canvas (`useTextAsPath`) — consistent across all systems regardless of installed fonts |
| Fixed logos | Locked to specific canvas positions via `useFixedLogos` |
| Front↔back sync | `sceneStore` mirrors logo positions across both canvases |
| Production output | High-resolution canvas capture for order/cart submission |
| Control visibility | `FABRIC_CONTROL_VISIBILITY` config hides/shows specific handles |

**Color system:** Full Pantone Coated (`pantonesCoated.ts`) and Pantone TCX (`pantonesTcx.ts`) palettes embedded as static data. Active palette selected by company factory settings.

---

## Three.js — 3D Preview

**Component:** `ThreeDScene.vue`

| Feature | Implementation |
|---|---|
| Model loading | GLTF/GLB via `GLTFLoader` |
| Mesh compression | DRACO via `DRACOLoader` |
| Lighting | HDR environment maps via `HDRLoader` |
| Interaction | `OrbitControls` (rotation, zoom, pan) |
| Post-processing | `EffectComposer` → `RenderPass` → `SMAAPass` (anti-aliasing) → `OutputPass` |
| Material properties | PBR: `roughness`, `metalness`, `sheen`, `sheenColor`, `sheenRoughness`, `reflectivity`, `normalScale`, texture tiling (`tileX`, `tileY`) |
| Design textures | Fabric.js canvas renders applied as Three.js material maps in real time |
| Fixed logos | Positioned geometrically on 3D mesh via `create3DFixedLogoGeometry` |
| Snapshots | PNG captures for cart submission |

---

## AI Logo Generation

Three generation modes, all proxied through the Custimoo backend:

| Mode | Endpoint | Description |
|---|---|---|
| Generate | `POST /api/v2/ai/generate-logo` | New logo from text prompt + optional reference image |
| Refine | `POST /api/v2/ai/refine-logo` | Adjust existing logo (same style) |
| Redesign | `POST /api/v2/ai/redesign-logo` | Full redesign / shuffle |

**Quota system:**
- `ai_logo_generation_daily_quota` factory setting (default: 10/day per customer)
- `ai_logo_generation_unlimited_access` setting bypasses limits
- `ai_logo_generation_enabled` setting toggles the entire feature
- Backend `remaining_quota` field is authoritative; localStorage daily counter is fallback
- Mock mode (`VITE_AI_LOGO_MOCK=true`): returns 1×1 PNG placeholder after 400ms

---

## E-commerce Integrations

`cartStore` delegates all cart operations to a platform-specific service via a factory:

**Shopify** (`ShopifyCartService`):
- Uses Shopify AJAX API: `GET /cart.js`, `POST /cart/add.js`, `POST /cart/update.js`
- Custimoo-specific line item properties: `_custimoo_cart_id`, `_custimoo_cart_item_key`, `_custimoo_front_image`, `_custimoo_back_image`, `_custimoo_cart_url`
- Sizes serialized as `_Size {size}` properties
- Addon products managed as separate cart line items linked via `child_addons` property

**WooCommerce** (`WooCommerceCartService`):
- WordPress/WooCommerce AJAX cart API

**BigCommerce:** Scaffolded but not yet implemented.

**External API** (`window.customizerApi`):
Exposes auth methods to the parent window: `isAuthenticated()`, `getCustomer()`, `setCredentials()`, `checkAuth()`, `startListening()`, `stopListening()`, `logout()`. Auth auto-detection polls `localStorage` every 500ms (max 5 min) when user is not logged in.

---

## Undo/Redo History System

Type-safe action registry in `src/stores/history/registry.ts`:

```typescript
// Each action type registers apply + revert + describe handlers
registry.register('color.set-group', {
  apply: (payload) => { /* set color */ },
  revert: (payload) => { /* restore previous */ },
  describe: (payload) => `Changed color to ${payload.color}`
})
```

| Feature | Details |
|---|---|
| Stack depth | Max 10 entries per stack (undo + redo) |
| Persistence | Both stacks persisted to localStorage |
| Batch ops | Multiple actions can be batched as a single undo step |
| Tracked actions | `color.set-group`, `logo.add`, `logo.move`, `logo.remove`, `text.edit`, `text.add`, `pattern.set`, `roster.edit`, and more |

---

## Internationalisation (11 Languages)

**Library:** `@inlang/paraglide-js` v2 — messages compiled to TypeScript at build time.

| Locale | Language |
|---|---|
| `en` | English (base) |
| `fr` | French |
| `da` | Danish |
| `es` | Spanish |
| `de` | German |
| `it` | Italian |
| `nl` | Dutch |
| `no` | Norwegian |
| `pl` | Polish |
| `sv` | Swedish |
| `pt` | Portuguese |

Messages stored in `messages/{locale}.json`, compiled to `src/paraglide/` at build time. Locale is set via `setLocale()` at runtime and stored in `profileStore.currentLocale`, synced to the backend preferences API.

Machine translation available via `npm run machine-translate` (`@inlang/cli`).

---

## PostHog Analytics

- **Host:** `https://eu.i.posthog.com` (EU data residency)
- **Config:** `person_profiles: 'identified_only'` — no anonymous profiles tracked
- Exception capture: unhandled errors + unhandled promise rejections (console errors not captured)
- Initialized as a singleton composable; called in router `beforeEach` for page-level tracking
- Mock provided in `tests/helpers/mocks/posthog.ts` for test isolation

---

## Test Suite

**Framework:** Vitest 3.x + jsdom + `@vue/test-utils`

**Setup** (`tests/setup.ts`) stubs browser APIs that Fabric.js and Three.js require:
- `ResizeObserver`, `IntersectionObserver`, `matchMedia`, `scrollTo`
- `HTMLCanvasElement.getContext` — full 2D context mock
- `URL.createObjectURL` / `revokeObjectURL`

**Mocks:** `tests/helpers/mocks/fabric.ts`, `three.ts`, `posthog.ts`

**Coverage:** v8 provider (excludes `src/paraglide/`, `src/icons/`, `.d.ts` files)

```bash
npm run test           # single run
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```

---

## Build Output

```
dist/
  widget.js      # single inlined ES module (all deps bundled)
  widget.css     # compiled Tailwind + component styles
```

Post-build minification via `scripts/minify-dist.mjs` (esbuild pass on both files).

---

## Environment Variables

| Variable | Dev | Staging | Production |
|---|---|---|---|
| `VITE_API_ENDPOINT` | `http://localhost:8000` | `https://devapi.custimoo.com` | `https://api.custimoo.com` |
| `VITE_APP_STORAGE_URL` | Staging S3 | Staging S3 | CloudFront CDN |
| `VITE_AI_LOGO_MOCK` | `true` for local dev | — | — |

---

## Getting Started

```bash
npm install

# Development (standalone SPA mode)
npm run dev                    # http://localhost:5173

# Build for production
npm run build

# Machine-translate new messages
npm run machine-translate

# Lint
npm run lint

# Type check
npm run type-check
```

## Related Repositories

| Repo | Purpose |
|---|---|
| `custimoo` | Laravel 12 backend API |
| `development_admin_v2` | Vue 3 internal admin panel |
| `development_custimoo_builder` | Legacy Vue 2 version |
