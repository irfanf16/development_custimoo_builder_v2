## Stores

Pinia stores hold domain and UI state. They expose simple, imperative setters and async fetchers. They do not contain undo/redo logic and they should not navigate.

### Standardized Structure

All stores follow a consistent organizational pattern:

```typescript
export const useStoreName = defineStore('storeName', () => {
  // ===== DEPENDENCIES =====
  const otherStore = useOtherStore()

  // ===== STATE =====
  const state = ref<Type>(initialValue)

  // ===== COMPUTED =====
  const computedValue = computed(() => derivedValue)

  // ===== PERSISTENCE =====
  function saveToLocalStorage() {
    /* ... */
  }
  function loadFromLocalStorage() {
    /* ... */
  }

  // ===== ACTIONS =====
  function setValue(value: Type) {
    /* ... */
  }

  // ===== BUSINESS LOGIC =====
  function complexOperation() {
    /* ... */
  }

  // ===== RETURN =====
  return {
    // State
    state,
    // Computed
    computedValue,
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    // Actions
    setValue,
    // Business Logic
    complexOperation
  }
})
```

### Naming Conventions

- **State**: `camelCase` (e.g., `isLoading`, `currentUser`)
- **Actions**: `verb + noun` (e.g., `setUser`, `clearAuth`, `fetchProducts`)
- **Computed**: `camelCase` with descriptive names (e.g., `isAuthenticated`, `effectiveProductId`)
- **Persistence**: `saveToLocalStorage`, `loadFromLocalStorage`, `clearLocalStorage`

### customization.store.ts

Manages the active product customization object and related state.

**Key responsibilities:**

- Store and persist the `ActiveProductCustomization` object
- Provide computed properties for active IDs (product, style, design, category, subcategory)
- Handle customization mutations (setProduct, setStyle, setDesign, etc.)
- Manage group colors, custom texts, logos, and patterns
- Provide helper functions for creating default customizations

**Key functions:**

- `loadFromLocalStorage()` / `saveToLocalStorage()` - Persistence
- `setProduct(id)`, `setStyle(id)`, `setDesign(id)` - Update active selections
- `setGroupColor(group, color)` - Update group colors
- `ensureCustomization()` - Create default customization if none exists
- `clearCustomization()` - Reset customization while preserving IDs
- `createDefaultCustomization(preservedIds?)` - Create default with optional preserved IDs

**Example (do not call directly from components if you want undo/redo):**

```ts
const customization = useCustomizationStore()
customization.setGroupColor('base', {
  name: 'Blue',
  value: '#0070f3',
  position: 0
})
customization.clearCustomization() // Resets while preserving IDs
```

**With undo/redo (recommended):**

```ts
const history = useHistoryStore()
history.execute('color.set-group', {
  groupId: 'base',
  prevColor: null,
  nextColor: { name: 'Blue', value: '#0070f3', position: 0 }
})
```

### products.store.ts

Manages product-related data and API interactions.

**Key responsibilities:**

- Store product details, styles, designs, and categories
- Handle API calls for fetching product data
- Manage SVG groups for color customization
- Handle addons and recent logos
- Provide request deduplication for API calls

**Key functions:**

- `fetchActiveProductDetails(id)` - Load product with default style/design
- `fetchStylePreviews(productId)` - Load available styles
- `fetchDesignPreviewsByStyleId(styleId)` - Load available designs
- `setSvgGroups()` - Process SVG for color customization
- `captureDefaultsSnapshot()` / `resetToDefaultsSnapshot()` - Snapshot management

**Example:**

```ts
const products = useProductsStore()
await products.fetchCustomizedCategories()
await products.fetchProductPreviews(12)
```

### workflow.store.ts

Manages UI workflow state and navigation.

**Key responsibilities:**

- Track active workflow step and sub-steps
- Manage canvas state (zoom, side)
- Handle preview selections before committing to customization
- Persist workflow state to localStorage

**Key functions:**

- `setActiveStep(step)` - Change workflow step
- `setLogosSubStep(step)` - Change logos sub-step
- `commitSelectedCategory()` - Apply preview selection to customization
- `setActiveCanvasSide(side)` - Switch canvas view
- `zoomIn()` / `zoomOut()` - Canvas zoom controls

**Example:**

```ts
const wf = useWorkflowStore()
wf.setActiveStep('Colors')
wf.setLogosSubStep('list')
```

### auth.store.ts

Manages user authentication state and session.

**Key responsibilities:**

- Store user information and access tokens
- Handle login/logout operations
- Persist authentication state to localStorage
- Provide computed properties for authentication status
- Listen for external authentication changes (e.g., from parent window)

**Key functions:**

- `ensureHydrated()` - Deduplicated localStorage hydration
- `loadFromLocalStorage()` / `saveToLocalStorage()` - Persistence
- `login(credentials)` - Authenticate user
- `logout()` - Clear authentication state
- `setCustomer(data)` / `setAccessToken(token)` - Update state
- `startListeningForAuth()` - Start listening for external auth changes
- `stopListeningForAuth()` - Stop listening for auth changes

**External Authentication Listener:**

The auth store automatically starts listening for `jwtToken` and `customer` in localStorage when the app initializes without authentication. This allows external systems (e.g., parent window, external scripts) to authenticate the user by setting these values:

```ts
// External system sets auth data
localStorage.setItem('jwtToken', 'eyJhbGc...')
localStorage.setItem('customer', JSON.stringify({ id: 123, email: 'user@example.com', ... }))

// The customizer automatically detects and hydrates the auth state
```

The listener uses two strategies:

1. **Storage events** - Detects changes from other tabs/windows
2. **Polling (500ms)** - Detects changes from same-window external scripts

The listener automatically stops when:

- Authentication is detected
- 5 minutes have elapsed (safety timeout)
- User explicitly logs out

**Example:**

```ts
const auth = useAuthStore()
const result = await auth.login({ email, password })
if (result.success) {
  // User is now authenticated
  console.log(auth.isAuthenticated) // true
}

// Or manually start listening for external auth
auth.startListeningForAuth()
```

**For External Systems:**

External systems can use the global API:

```js
// External system authenticates user
window.customizerApi.auth.setCredentials({
  jwtToken: 'eyJhbGc...',
  customer: { id: 123, email: 'user@example.com', ... }
})

// Or set localStorage directly (auto-detected)
localStorage.setItem('jwtToken', token)
localStorage.setItem('customer', JSON.stringify(customer))
// Automatically detected within 500ms
```

See [docs/AUTHENTICATION.md](../../docs/AUTHENTICATION.md) for complete integration guide.

### locale.store.ts

Manages internationalization and localization.

**Key responsibilities:**

- Store current locale and available languages
- Handle locale switching and validation
- Persist locale preference to localStorage
- Integrate with Paraglide runtime

**Key functions:**

- `loadFromLocalStorage()` / `saveToLocalStorage()` - Persistence
- `setCurrentLocale(locale)` - Change active locale
- `initializeLocale()` - Initialize from company settings
- `isValidLocale(locale)` - Validate locale availability

**Example:**

```ts
const locale = useLocaleStore()
locale.setCurrentLocale('fr') // Switch to French
console.log(locale.availableLocales) // ['en', 'fr', 'da']
```

### history.store.ts + history/registry.ts

Centralized undo/redo system for customization actions.

**Key responsibilities:**

- Manage undo/redo stacks
- Execute actions through the registry
- Provide batch operations
- Persist history to localStorage

**Key functions:**

- `execute(type, payload, description?)` - Execute new action
- `undo()` / `redo()` - Navigate history
- `runBatch(description, builder)` - Group multiple actions
- `canUndo` / `canRedo` - Check if navigation is possible
- `nextUndoDescription` / `nextRedoDescription` - Get action descriptions

**Example:**

```ts
const history = useHistoryStore()
await history.execute('text.set-value', {
  key: '42',
  index: 0,
  prevValue: 'OLD',
  nextValue: 'NEW'
})
await history.undo()
await history.redo()
history.clear() // Clears both stacks and persists
```

### effective.store.ts

Provides computed selectors that combine data from multiple stores.

**Key responsibilities:**

- Combine customization and products store data
- Provide effective IDs that prioritize customization over defaults
- Compute derived values like effective SVG groups
- Generate render version for cache invalidation

**Key functions:**

- `effectiveProductId` / `effectiveStyleId` / `effectiveDesignId` - Computed IDs
- `effectiveSvgGroups` - SVG groups with customization overrides
- `renderVersion` - Version string for cache invalidation

**Example:**

```ts
const { effectiveProductId, effectiveSvgGroups } = useEffectiveSelectors()
// effectiveProductId prioritizes customization over activeProductDetails
// effectiveSvgGroups applies color overrides from customization
```
