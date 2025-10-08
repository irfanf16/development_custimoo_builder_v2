import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { registry, createHistoryContext } from './registry'
import type { HistoryEntry, HistoryActionType, HistoryContext } from './types'

export const useHistoryStore = defineStore('historyStore', () => {
  const undoStack = ref<HistoryEntry[]>([])
  const redoStack = ref<HistoryEntry[]>([])
  const isApplying = ref(false)

  const ctx = createHistoryContext()

  const KEY_UNDO = 'history.undo'
  const KEY_REDO = 'history.redo'

  function saveStacks() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(KEY_UNDO, JSON.stringify(undoStack.value))
      window.localStorage.setItem(KEY_REDO, JSON.stringify(redoStack.value))
    } catch (_) {}
  }

  function load() {
    if (typeof window === 'undefined') return
    try {
      const u = JSON.parse(window.localStorage.getItem(KEY_UNDO) || '[]') as unknown
      const r = JSON.parse(window.localStorage.getItem(KEY_REDO) || '[]') as unknown
      if (Array.isArray(u)) undoStack.value = u as HistoryEntry[]
      if (Array.isArray(r)) redoStack.value = r as HistoryEntry[]
    } catch {
      undoStack.value = []
      redoStack.value = []
    }
  }

  function clear() {
    undoStack.value = []
    redoStack.value = []
    saveStacks()
  }

  function apply(entry: HistoryEntry) {
    return (
      registry[entry.type] as {
        apply: (ctx: ReturnType<typeof createHistoryContext>, payload: unknown) => unknown
      }
    ).apply(ctx, entry.payload)
  }
  function revert(entry: HistoryEntry) {
    return (
      registry[entry.type] as {
        revert: (ctx: ReturnType<typeof createHistoryContext>, payload: unknown) => unknown
      }
    ).revert(ctx, entry.payload)
  }

  async function execute<T>(type: HistoryActionType, payload: T, description?: string) {
    const desc =
      description ??
      (
        registry[type] as {
          describe: (ctx: HistoryContext, payload: T) => string
        }
      ).describe(ctx, payload)
    const entry: HistoryEntry<T> = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      type,
      payload,
      description: desc
    }
    isApplying.value = true
    await apply(entry)
    isApplying.value = false
    undoStack.value.push(entry)
    redoStack.value = []
    saveStacks()
  }

  async function undo() {
    const entry = undoStack.value.pop()
    if (!entry) return
    isApplying.value = true
    await revert(entry)
    isApplying.value = false
    redoStack.value.push(entry)
    saveStacks()
  }

  async function redo() {
    const entry = redoStack.value.pop()
    if (!entry) return
    isApplying.value = true
    await apply(entry)
    isApplying.value = false
    undoStack.value.push(entry)
    saveStacks()
  }

  async function runBatch(
    description: string,
    builder: (add: <T>(type: HistoryActionType, payload: T) => void) => void
  ) {
    const entries: Array<{ type: HistoryActionType; payload: unknown }> = []
    const add = <T>(type: HistoryActionType, payload: T) => {
      entries.push({ type, payload })
    }
    builder(add)
    if (!entries.length) return
    await execute('batch', { entries, label: description }, description)
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  const nextUndoDescription = computed(
    () => undoStack.value[undoStack.value.length - 1]?.description || null
  )
  const nextRedoDescription = computed(
    () => redoStack.value[redoStack.value.length - 1]?.description || null
  )

  return {
    undoStack,
    redoStack,
    isApplying,
    execute,
    undo,
    redo,
    runBatch,
    canUndo,
    canRedo,
    nextUndoDescription,
    nextRedoDescription,
    load,
    clear
  }
})
