# Builder v2 Test Suite

## Running tests

```bash
# Run all tests once
npm run test

# Watch mode (re-runs on file change)
npm run test:watch

# Coverage report (text + HTML in coverage/)
npm run test:coverage
```

## Stack

- [Vitest 3](https://vitest.dev) — test runner, configured in `vitest.config.ts`
- [@vue/test-utils](https://test-utils.vuejs.org) — Vue component mounting
- [@pinia/testing](https://pinia.vuejs.org/cookbook/testing.html) — Pinia store testing
- jsdom — browser environment simulation

---

## testid naming convention

All `data-testid` attributes follow the pattern:

```
data-testid="<area>-<element>-<modifier?>"
```

- Lowercase, kebab-case only. No slashes, no spaces.
- `<area>` = feature area (see table below).
- `<element>` = what the DOM element is: `root`, `button`, `input`, `dialog`, `panel`, `item`, `list`, `form`, `field`, `container`, etc.
- `<modifier>` (optional) = disambiguates when multiple of the same element exist: the action name, list index, or variant.

### Examples

| Usage | testid |
|---|---|
| Root of LayersPanel | `layers-panel` |
| A rotate button in the toolbar | `toolbar-button-rotate` |
| A list item for layer with id 42 | `:data-testid="\`layers-item-${layer.id}\`"` |
| Sign-in dialog | `auth-dialog-sign-in` |
| Email input inside sign-in dialog | `auth-field-email` |

---

## Area taxonomy

| Path | Area prefix |
|---|---|
| `src/App.vue` | `app` |
| `src/views/Customizer.vue` | `customizer` |
| `src/views/Auth.vue` | `auth` |
| `src/views/CollectionView.vue` | `collection` |
| `src/views/NotFound.vue` | `not-found` |
| `src/views/ThirdPartyApproval.vue` | `third-party` |
| `src/layouts/**` | `layout` (sub: `layout-default`, `layout-mobile`, `layout-third-party`) |
| `src/components/auth/**` | `auth` |
| `src/components/cart/**` | `cart` |
| `src/components/customization-workflow/**` | `workflow` |
| `src/components/customizer-canvas-preview/**` | `canvas` |
| `src/components/customizer-menu/**` | `menu` |
| `src/components/customizer-price/**` | `price` |
| `src/components/customizer-profile-section/**` | `profile` |
| `src/components/customizer-topbar/**` | `topbar` |
| `src/components/customizer/**` | `customizer` |
| `src/components/global/**` | `global` |
| `src/components/locker-room/**` | `locker-room` |
| `src/components/product-preview/**` | `preview` |
| `src/components/roster/**` | `roster` |
| `src/components/scene/**` | `scene` |
| `src/components/shared/**` | `shared` |
| `src/components/skeleton/**` | `skeleton` |

---

## shadcn-vue primitives — attribute forwarding

shadcn-vue components are built on reka-ui `Primitive` which forwards `$attrs` to the
rendered root element by default (`inheritAttrs: true`). This means:

```vue
<Button data-testid="my-button-save" />
```

…lands the `data-testid` on the actual `<button>` DOM node.

**Primitives verified (all forward correctly — no changes required):**

| Primitive | Root forwards `$attrs` via |
|---|---|
| `Button` | `<Primitive v-bind="$attrs">` (reka-ui) |
| `Input` | `<input v-bind="$attrs">` |
| `Checkbox` | `<CheckboxRoot v-bind="forwarded">` (reka-ui) |
| `Switch` | `<SwitchRoot v-bind="forwarded">` (reka-ui) |
| `Select` | `<SelectRoot v-bind="forwarded">` (reka-ui) |
| `Tabs` | `<TabsRoot v-bind="forwarded">` (reka-ui) |
| `Tooltip` | `<TooltipRoot v-bind="forwarded">` (reka-ui) |
| `DropdownMenu` | `<DropdownMenuRoot v-bind="forwarded">` (reka-ui) |
| `Dialog` | `<DialogRoot v-bind="forwarded">` (reka-ui) |

All 9 verified primitives correctly forward attrs. No changes were needed to
any shadcn primitive component.

---

## Using `mountWithProviders`

```ts
import { describe, it, expect } from 'vitest'
import { mountWithProviders } from '../../helpers/mount'
import MyComponent from '@/components/my-area/MyComponent.vue'

describe('MyComponent', () => {
  it('renders with expected testid', async () => {
    const wrapper = await mountWithProviders(MyComponent, {
      // Optional: override initial store state
      piniaOptions: {
        initialState: {
          myStore: { someValue: 42 }
        }
      },
      // Optional: pass props
      mountOptions: {
        props: { title: 'Hello' }
      }
    })

    // Select by testid
    const root = wrapper.find('[data-testid="my-area-root"]')
    expect(root.exists()).toBe(true)
    expect(root.text()).toContain('Hello')
  })
})
```

### Testing interactions

```ts
it('emits an event when the button is clicked', async () => {
  const wrapper = await mountWithProviders(MyComponent)

  await wrapper.find('[data-testid="my-area-button-action"]').trigger('click')

  expect(wrapper.emitted('action')).toBeTruthy()
})
```

---

## Writing tests for canvas / three.js components

Canvas and three.js components (TwoDScene, ThreeDScene, ThreePreview) are
**not unit-tested** here — they require a real WebGL context. Use
end-to-end Playwright/Cypress for those.

If you do need to import a file that imports fabric or three, add a
`vi.mock` at the top of your test file:

```ts
vi.mock('fabric', () => import('../../helpers/mocks/fabric'))
vi.mock('three', () => import('../../helpers/mocks/three'))
```
