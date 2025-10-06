## Architecture overview

This project follows a clear separation of concerns between domain state (Pinia stores), UI composition (composables), and cross-cutting concerns (history/undo and effects).

- Stores: Pure, imperative setters that mutate one slice and persist as needed.
- Composables: UI-facing logic. Workflow composable handles navigation and required effects for each step.
- History: Centralized undo/redo with an action registry that applies/reverts domain mutations and provides user-friendly descriptions.

### Key pieces

- [`src/stores/customization/customization.store.ts`](../src/stores/customization/customization.store.ts): Active customization state; pure setters; no history.
- [`src/stores/products/products.store.ts`](../src/stores/products/products.store.ts): Product/category/style/design details and fetch methods.
- [`src/stores/workflow/workflow.store.ts`](../src/stores/workflow/workflow.store.ts): Workflow UI state (active step, sub-steps, canvas state, saved prefs).
- [`src/stores/history/history.store.ts`](../src/stores/history/history.store.ts) + [`src/stores/history/registry.ts`](../src/stores/history/registry.ts): Centralized undo/redo and action handlers.
- [`src/composables/useWorkflow.ts`](../src/composables/useWorkflow.ts): Unified workflow controller combining navigation helpers, sub-step state, and side effects.

### Data flow

1. UI triggers an action (e.g., change color) via the History store: `history.execute('color.set-group', payload)`.
2. History registry applies the action by calling pure setters on stores.
3. Stores mutate their slice and persist state.
4. History store persists undo/redo stacks to localStorage.
5. Workflow composable reacts to step changes and fetches as needed while computing navigation breadcrumbs.

### Persistence

- **Customization state**: Saved to localStorage via `customization.store.ts` `save()` method.
- **Workflow state**: Sub-steps and active step saved to localStorage via `workflow.store.ts`.
- **History stacks**: Undo/redo stacks persisted to localStorage and loaded on app initialization.
- **Reset functionality**: Clears both customization and history stacks, providing a clean slate.

### Why this design

- Predictable: Domain mutations in one place (stores). History in one place (registry).
- Testable: Apply/revert actions are deterministic and serializable.
- Maintainable: Navigation is compute-only and side effects are isolated.
