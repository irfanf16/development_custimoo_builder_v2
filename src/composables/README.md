## Composables

Composables encapsulate UI-oriented logic. They do not mutate domain state directly (except through store actions) and they avoid side effects unless explicitly designed for that role.

### useWorkflowNavigation.ts

- Compute-only breadcrumb items based on store state.
- Returns labels and callbacks that call `workflowStore`.

Example:

```ts
const { navigationItems } = useWorkflowNavigation(currentStep, () => {})
```

### useWorkflowManager.ts

- Thin UI helpers around `workflowStore` to handle category/subcategory selection.
- No local step state; derives `currentStep` from `workflowStore`.

Example:

```ts
const { currentStep, handleCategorySelect } = useWorkflowManager()
handleCategorySelect(12)
```

### useWorkflowEffects.ts

- Centralized side effects for workflow step changes (fetch previews, recent logos, etc.).
- Initialize once at app start, e.g. inside `useAppInitialization`.
- Also loads history stacks from localStorage during initialization.

Example:

```ts
// In app init
useWorkflowEffects()
```

### useAppInitialization.ts

- Single entry-point to initialize the app in phases.
- Loads localStorage state (auth, customization, workflow), loads history stacks early, fetches essentials, sets locale, determines category, loads previews, restores customization or creates defaults, initializes workflow effects.
- Handles missing product/style/design IDs by filling with defaults during restoration.

Phases overview:

1. Load auth, customization, workflow sub-steps, and history stacks
2. Fetch company + categories
3. Initialize locale, compute effective category
4. Fetch product previews
5. Restore customization (A) or clear history and create defaults (B)
   - **SCENARIO A**: Hydrate from stored customization; if IDs missing, fill defaults
   - **SCENARIO B**: Create default customization but navigate to category selection
6. Initialize workflow effects
7. Mark ready

Example:

```ts
const { isInitialized, initializeApp } = useAppInitialization()
onMounted(() => initializeApp())
```
