## Architecture overview

This project follows a clear separation of concerns between domain state (Pinia stores), UI composition (composables), and cross-cutting concerns (history/undo and effects).

- Stores: Pure, imperative setters that mutate one slice and persist as needed.
- Composables: UI-facing logic. Navigation is compute-only; effects handle data fetching on step changes.
- History: Centralized undo/redo with an action registry that applies/reverts domain mutations and provides user-friendly descriptions.

### Key pieces

- [`src/stores/customization/customization.store.ts`](../src/stores/customization/customization.store.ts): Active customization state; pure setters; no history.
- [`src/stores/products/products.store.ts`](../src/stores/products/products.store.ts): Product/category/style/design details and fetch methods.
- [`src/stores/workflow/workflow.store.ts`](../src/stores/workflow/workflow.store.ts): Workflow UI state (active step, sub-steps, canvas state, saved prefs).
- [`src/stores/history/history.store.ts`](../src/stores/history/history.store.ts) + [`src/stores/history/registry.ts`](../src/stores/history/registry.ts): Centralized undo/redo and action handlers.
- [`src/composables/useWorkflowNavigation.ts`](../src/composables/useWorkflowNavigation.ts): Compute-only breadcrumb/navigation items.
- [`src/composables/useWorkflowManager.ts`](../src/composables/useWorkflowManager.ts): Thin UI helper wrapping workflow store for step selection.
- [`src/composables/useWorkflowEffects.ts`](../src/composables/useWorkflowEffects.ts): Watches workflow state and triggers required fetches.

### Data flow

1. UI triggers an action (e.g., change color) via the History store: `history.execute('color.set-group', payload)`.
2. History registry applies the action by calling pure setters on stores.
3. Stores mutate their slice and persist state.
4. History store persists undo/redo stacks to localStorage.
5. Effects composable reacts to workflow step changes and fetches as needed.
6. Navigation composable computes the breadcrumb from store state.

### Persistence

- **Customization state**: Saved to localStorage via `customization.store.ts` `save()` method.
- **Workflow state**: Sub-steps and active step saved to localStorage via `workflow.store.ts`.
- **History stacks**: Undo/redo stacks persisted to localStorage and loaded on app initialization.
- **Reset functionality**: Clears both customization and history stacks, providing a clean slate.

### Why this design

- Predictable: Domain mutations in one place (stores). History in one place (registry).
- Testable: Apply/revert actions are deterministic and serializable.
- Maintainable: Navigation is compute-only and side effects are isolated.
