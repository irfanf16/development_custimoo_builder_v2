## Composables

Composables encapsulate UI-oriented logic. They do not mutate domain state directly (except through store actions) and they avoid side effects unless explicitly designed for that role.

### Standardized Structure

All composables follow a consistent organizational pattern:

```typescript
export function useComposableName() {
  // ===== DEPENDENCIES =====
  const store = useStore()

  // ===== STATE =====
  const state = ref<Type>(initialValue)

  // ===== COMPUTED =====
  const computedValue = computed(() => derivedValue)

  // ===== UTILITIES =====
  function utilityFunction() {
    /* ... */
  }

  // ===== ACTIONS =====
  function actionFunction() {
    /* ... */
  }

  // ===== WATCHERS =====
  watch(() => dependency, callback)

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
    // Actions
    actionFunction,
    // Business Logic
    complexOperation
  }
}
```

### Naming Conventions

- **State**: `camelCase` (e.g., `isLoading`, `currentUser`)
- **Actions**: `verb + noun` (e.g., `handleClick`, `fetchData`, `updateValue`)
- **Computed**: `camelCase` with descriptive names (e.g., `isAuthenticated`, `effectiveProductId`)
- **Utilities**: `camelCase` with descriptive names (e.g., `formatDate`, `validateInput`)

### useAppInitialization.ts

Single entry-point to initialize the app in phases.

**Key responsibilities:**

- Load localStorage state (auth, customization, workflow), loads history stacks early, fetches essentials, sets locale, determines category, loads previews, restores customization or creates defaults, initializes workflow effects.
- Handles missing product/style/design IDs by filling with defaults during restoration.
- Refactored into focused methods for better maintainability and readability.

**Phases overview:**

1. **`initializeStoresFromLocalStorage()`**: Load auth, customization, workflow sub-steps, and history stacks
2. **`fetchEssentialData()`**: Fetch company + categories
3. **`initializeLocalizationAndCategory()`**: Initialize locale, compute effective category
4. **`loadProductData()`**: Fetch product previews
5. **`restoreCustomizationWithDefaults()` / `createDefaultCustomization()`**: Restore customization (A) or clear history and create defaults (B)
   - **SCENARIO A**: Hydrate from stored customization; if IDs missing, fill defaults
   - **SCENARIO B**: Create default customization but navigate to category selection
6. **`initializeWorkflowEffects()`**: Initialize workflow effects
7. **Mark ready**: Complete initialization

**Example:**

```ts
const { isInitialized, initializeApp } = useAppInitialization()
onMounted(() => initializeApp())
```

### useWorkflow.ts

Unified controller for workflow UI state.

**Key responsibilities:**

- Expose current workflow step, panel state, and step-specific sub-state
- Provide navigation breadcrumbs and routing helpers
- Trigger step-dependent side effects (design/style/logo preload)
- Offer actions for category/subcategory selection

**Key functions:**

- `currentStep`, `contentKey`, `navigationItems`
- `handleCategorySelect(categoryId)`
- `handleSubcategorySelect(subcategoryId)`
- `initializeEffects()`

**Example:**

```ts
const { currentStep, navigationItems, initializeEffects } = useWorkflow()
onMounted(() => initializeEffects())
```

### useColorActions.ts

Encapsulates color-related actions, particularly for shuffling colors.

**Key responsibilities:**

- Provide color palette management
- Handle color shuffling with history integration
- Work with effective SVG groups for color application

**Key functions:**

- `palettes` - Computed available color palettes
- `shuffleColors(paletteId?)` - Shuffle colors using history batch operations

**Example:**

```ts
const { palettes, shuffleColors } = useColorActions()
shuffleColors(currentPaletteId.value)
```

### useFabricPreview.ts

Manages Fabric.js canvas operations for product preview rendering.

**Key responsibilities:**

- Handle canvas initialization and management
- Manage layer operations (model, design)
- Provide animation utilities (fade in/out)
- Handle SVG processing and color application

**Key functions:**

- `initCanvas(options?)` - Initialize Fabric.js canvas
- `addModelLayer(url, composition)` - Add model layer to canvas
- `addDesignLayer(url, ext)` - Add design layer with color overrides
- `fadeOut(duration?)` / `fadeIn()` - Canvas animation utilities

**Example:**

```ts
const { canvasEl, initCanvas, addDesignLayer } = useFabricPreview()
initCanvas({ selection: false })
await addDesignLayer(designUrl, 'svg')
```

### useBrandStyling.ts

Manages theme and color scheme application.

**Key responsibilities:**

- Apply CSS variables for theming
- Handle font loading and application
- Manage light/dark mode switching
- Apply host theme integration

**Key functions:**

- `applyBrandStyling(container?, hostTheme?)` - Apply color scheme to container

**Example:**

```ts
const { applyBrandStyling } = useBrandStyling()
await applyBrandStyling(container, hostTheme)
```

### useParaglideLocale.ts

Thin wrapper around locale store for Paraglide integration.

**Key responsibilities:**

- Provide locale management for Paraglide
- Initialize locale on first use
- Expose locale store functionality

**Key functions:**

- `currentLocale` - Current active locale
- `changeLocale(locale)` - Change active locale
- `availableLocales` - Available locales
- `isValidLocale(locale)` - Validate locale
- `resetToDefault()` - Reset to default locale

**Example:**

```ts
const { currentLocale, changeLocale } = useParaglideLocale()
changeLocale('fr')
```
