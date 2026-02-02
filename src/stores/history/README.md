## History (Undo/Redo)

The history system centralizes undo/redo. Actions are serializable entries with a type, payload, and description. The registry knows how to apply/revert each action and describes it for the UI.

### Files

- `history.store.ts`: Manages stacks, exposes `execute`, `undo`, `redo`, batching, and persistence.
- `registry.ts`: Maps action types to `apply`, `revert`, `describe` handlers.
- `types.ts`: Shared types and payload shapes.

### Persistence

- Undo/redo stacks are automatically saved to localStorage after each operation.
- Stacks are loaded during app initialization via `useAppInitialization.ts`.
- Use `history.clear()` to reset both stacks and persist the change.

### Basic usage

```ts
const history = useHistoryStore()
await history.execute('color.set-group', {
  groupId: 'base',
  prevColor: null,
  nextColor: { name: 'Blue', value: '#0070f3', position: 0 }
})
```

### Undo / Redo with description

```ts
await history.undo()
await history.redo()
```

### Clear history

```ts
// Clear both undo and redo stacks
history.clear()
```

### Batch operations

```ts
await history.runBatch('Shuffle colors', add => {
  add('color.set-group', {
    groupId: 'base',
    prevColor: null,
    nextColor: { name: '', value: '#f00', position: 0 }
  })
  add('color.set-group', {
    groupId: 'trim',
    prevColor: null,
    nextColor: { name: '', value: '#0f0', position: 0 }
  })
})
```
