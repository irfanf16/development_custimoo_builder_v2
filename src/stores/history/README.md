## History (Undo/Redo)

The history system centralizes undo/redo. Actions are serializable entries with a type, payload, and description. The registry knows how to apply/revert each action and describes it for the UI.

### Files

- `history.store.ts`: Manages stacks, exposes `execute`, `undo`, `redo`, and batching.
- `registry.ts`: Maps action types to `apply`, `revert`, `describe` handlers.
- `types.ts`: Shared types and payload shapes.

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
console.log(history.nextRedoDescription)
await history.redo()
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
