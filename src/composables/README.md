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

Example:

```ts
// In app init
useWorkflowEffects()
```
