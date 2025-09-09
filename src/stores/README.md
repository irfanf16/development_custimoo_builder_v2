## Stores

Pinia stores hold domain and UI state. They expose simple, imperative setters and async fetchers. They do not contain undo/redo logic and they should not navigate.

### customization.store.ts

- Holds `ActiveProductCustomization`.
- Exposes setters like `setGroupColor`, `setAddons`, `setProduct`, etc.
- Persists to localStorage via `save()`.
- Provides `clearCustomization()` to reset state.

Example (do not call directly from components if you want undo/redo):

```ts
const customization = useCustomizationStore()
customization.setGroupColor('base', {
  name: 'Blue',
  value: '#0070f3',
  position: 0
})
customization.clearCustomization() // Resets to null
```

With undo/redo (recommended):

```ts
const history = useHistoryStore()
history.execute('color.set-group', {
  groupId: 'base',
  prevColor: null,
  nextColor: { name: 'Blue', value: '#0070f3', position: 0 }
})
```

### products.store.ts

- Fetches product/category/style/design data.
- Holds active details and preview lists.
- Provides helpers like `captureDefaultsSnapshot()` and `resetToDefaultsSnapshot()`.

Example:

```ts
const products = useProductsStore()
await products.fetchCustomizedCategories()
await products.fetchProductPreviews(12)
```

### workflow.store.ts

- UI workflow state: `activeStep`, sub-steps, canvas controls.
- Saves sub-steps to localStorage.

Example:

```ts
const wf = useWorkflowStore()
wf.setActiveStep('Colors')
wf.setLogosSubStep('list')
```

### history.store.ts + history/registry.ts

- Centralized undo/redo with serializable entries.
- Registry applies/reverts mutations on stores and produces descriptions.
- Persists undo/redo stacks to localStorage automatically.
- Provides `load()` and `clear()` for persistence management.

Example:

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
