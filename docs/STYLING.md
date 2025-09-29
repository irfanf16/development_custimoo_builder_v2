### Styling Guide

This project ships a self-contained widget that renders inside a Shadow DOM. Our styling approach is designed for: Tailwind CSS v4 utilities, shadcn/vue components, host-driven theming, and a single embed script that injects all CSS at runtime.

#### Overview

- Tailwind v4 is imported once in `src/widget-styles.css` via `@import 'tailwindcss'` and compiled by Vite.
- The entire compiled stylesheet is injected into the widget’s Shadow root (`bootstrap.ts`), isolating styles from the host page.
- We expose a minimal set of design tokens as CSS variables and map them to Tailwind v4 theme tokens using `@theme inline`.
- shadcn/vue component styles and our utilities consume the same design tokens.

#### Files of interest

- [`src/widget-styles.css`](../src/widget-styles.css): Single CSS entry, contains Tailwind import, theme tokens, base/utilities, and transitions.
- [`tailwind.config.js`](../tailwind.config.js): Tailwind v4 config, plugins, animations, and font families (including `font-brand`).
- [`src/composables/useColorScheme.ts`](../src/composables/useColorScheme.ts): Applies host theme overrides (colors, radius, fonts) to the Shadow root at runtime.
- [`src/lib/hostThemes.ts`](../src/lib/hostThemes.ts): Declarative host theme definitions (per hostname), used to override the widget's tokens.

#### Design tokens (canonical variables)

We define canonical app tokens that the widget owns. Hosts override these at runtime:

- Colors: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--border`, `--input`, `--ring`, etc.
- Radius: `--radius` (base value used to derive Tailwind radius scale tokens)
- Fonts: `--font-sans` and `--font-brand` (brand falls back to sans if not provided)

These variables live under `:host, :root` in `src/widget-styles.css` with sensible light-theme defaults and a `.dark` scope for dark mode.

#### Tailwind v4 theme tokens (for utilities)

Inside `@theme inline`, we map Tailwind’s theme tokens to our canonical tokens. Examples:

- `--color-background: var(--background)` → used by `bg-background`
- `--color-foreground: var(--foreground)` → used by `text-foreground`
- `--color-primary: var(--primary)` and `--color-primary-foreground`
- Radius scale: `--radius-sm|md|lg|xl|2xl` derived from `--radius`
- Animations: `--animate-accordion-down|up` and corresponding keyframes

This keeps Tailwind utilities and shadcn components in sync with a single source of truth.

#### Fonts

- Default body font: `--font-sans`.
- Brand font: `--font-brand` (optional). Tailwind utility `font-brand` is provided via `tailwind.config.js`:
  - `fontFamily.brand = ['var(--font-brand)', 'var(--font-sans)', 'system-ui', 'sans-serif']`
- Apply brand font on demand using the `font-brand` class. There’s no automatic heading override.

#### Host theming

`src/lib/hostThemes.ts` lets you define per-host themes:

- `primary` (hex), optional `radius`, and optional `font` definitions (default and brandAccent).
- In `useColorScheme.ts`, we load fonts if specified and set CSS variables on the Shadow root:
  - `--primary`, `--radius`, `--font-sans`, `--font-brand`
- Dark mode is toggled by adding/removing the `dark` class on the widget root.

#### Shadow DOM specifics

- All styles are injected into the Shadow root, so they don’t leak to the host page.
- Avoid using global selectors like `body`—scope styles to the widget or use Tailwind utilities.
- We provide Tailwind internal fallbacks (`--tw-*`) to ensure utilities behave inside Shadow DOM.

#### What to change and when

- Change design intent (colors, radii, fonts): update canonical variables or host theme values.
- Change Tailwind utilities behavior (e.g., color of `bg-background`): adjust the mapping in `@theme inline`.
- Use brand typography: add the `font-brand` class to specific elements.
- Introduce new component tokens: add new canonical variables under `:host, :root` and map them in `@theme inline` if you want to use Tailwind utility names for them.

#### shadcn/vue

- shadcn/vue components work with Tailwind v4 and use our canonical tokens via utilities.
- Add shadcn components via the CLI (run with `npx shadcn-vue@latest`). See README for exact commands.

#### Animations

- Accordion animations are unified on `--reka-accordion-content-height` to match our components.
- Custom transitions are defined in `src/widget-styles.css` and can be used with utility classes.

#### Common recipes

- New host theme: update `hostThemes.ts` and ensure fonts load in `useColorScheme.ts`.
- Change primary color at runtime (integration): set `--primary` on the widget’s host element or call `applyColorScheme` with a custom theme.
- Switch to brand font for a title: add `class="font-brand"` on that element.

#### Gotchas

- Don’t hardcode colors in components; prefer utilities backed by tokens.
- Don’t rely on document-level dark mode; toggle `dark` on the widget root.
- Avoid `!important`; with Shadow DOM and token-backed utilities, it shouldn’t be necessary.
