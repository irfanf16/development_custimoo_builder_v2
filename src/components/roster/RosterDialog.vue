<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import * as XLSX from 'xlsx'
  import { toast } from 'vue-sonner'
  import { Button } from '@/components/ui/button'
  import { Separator } from '@/components/ui/separator'
  import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import { CheckCircle2, X, Plus, ChevronRight, Download, Info } from 'lucide-vue-next'
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription
  } from '@/components/ui/dialog'
  import RosterTable from '@/components/customization-workflow/WorkflowSteps/roster/RosterTable.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { storeToRefs } from 'pinia'
  import type { APCustomizationRosterEntry } from '@/services/products/types'
  import lockersService from '@/services/lockers/lockers.service'
  import {
    colors_separator_or,
    logos_empty_click_to_upload,
    logos_empty_drag_drop,
    roster_drop_helper,
    roster_manual_create,
    roster_import_ready,
    roster_import_success,
    roster_add_player,
    ui_close,
    roster_error_excel,
    roster_error_generic,
    roster_error_headers,
    roster_error_no_rows,
    roster_reset_action,
    roster_reset_action_tooltip,
    roster_template_button,
    roster_description,
    roster_update_action,
    roster_retry,
    roster_total_label,
    roster_nav_aria_label,
    roster_edit_roster,
    profile_cancel,
    msg_roster_updated_success,
    msg_failed_to_update_roster
  } from '@/paraglide/messages'

  // ─── Types ────────────────────────────────────────────────────────────────────

  interface ImportSummary {
    totalRows: number
  }

  interface RosterSize {
    value: string
    text: string
  }

  /**
   * A single roster entry as returned by get-product-locker-roster.
   * text/number are null when the player hasn't been personalised yet.
   */
  interface RawRosterEntry {
    code?: string
    size: string
    text: string | null
    number: string | null
    quantity: number
    size_index?: number
    information: string | null
  }

  /**
   * A text preset on the product — result.product_locker_detail.text[n].
   * type is 'name' or 'number'; used to determine column visibility.
   */
  interface ProductTextPreset {
    id: number
    type: 'name' | 'number' | string
    label: string
  }

  /**
   * result.product_locker_detail from the real API (doc 11).
   * Note: `text` is a parsed array (NOT a JSON string).
   */
  interface ProductLockerDetail {
    id: number
    product_id: number
    product_name: string
    product_roster_detail: RawRosterEntry[] | null
    /** Parsed array of text presets — check .type for 'name' / 'number'. */
    text: ProductTextPreset[]
    product_front_url: string | null
    product_back_url: string | null
  }

  /**
   * result.sizes from the real API.
   */
  interface ProductSizes {
    json_data: { name: string }[]
  }

  /**
   * Full response envelope from GET get-product-locker-roster/{id}.
   * result is an OBJECT (not an array).
   */
  interface FetchedRosterResponse {
    success: boolean
    message: string
    result: {
      product_locker_detail: ProductLockerDetail
      sizes: ProductSizes
      size_image_url: string | null
      allow_name_number: 0 | 1
      display_name: string | null
    }
    errors: unknown[]
    status_code: number
  }

  // ─── XLSX import helpers (mirrors useRosterImporter logic) ───────────────────

  type RosterColumnKey = 'product' | 'text' | 'number' | 'size' | 'quantity'

  const EXCEL_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ])
  const SUPPORTED_EXTENSION = /\.xlsx$/i

  const HEADER_TITLES: Record<RosterColumnKey, string> = {
    product: 'PRODUCTS',
    text: 'NAME ON PRODUCT',
    number: 'NUMBER',
    size: 'SIZE*',
    quantity: 'QUANTITY*'
  }

  // Required headers — if any of these are missing the file is invalid
  const REQUIRED_HEADERS: RosterColumnKey[] = ['size', 'quantity']

  function normalizeHeaderValue(value: unknown): string {
    if (typeof value === 'string') return value.trim().toUpperCase()
    if (typeof value === 'number') return String(value).trim().toUpperCase()
    return ''
  }

  function parseExcelRoster(buffer: ArrayBuffer): APCustomizationRosterEntry[] {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return []
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return []

    const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json<
      (string | number | undefined)[]
    >(sheet, { header: 1, defval: '', blankrows: false })

    if (!rows.length) return []

    const headerRow = rows[0]?.map(value => normalizeHeaderValue(value)) || []
    const columnIndexes = Object.entries(HEADER_TITLES).reduce(
      (acc, [key, label]) => {
        acc[key as RosterColumnKey] = headerRow.indexOf(label)
        return acc
      },
      {} as Record<RosterColumnKey, number>
    )

    // Only SIZE* and QUANTITY* are required — NAME ON PRODUCT and NUMBER are optional
    if (REQUIRED_HEADERS.some(key => columnIndexes[key] === -1)) {
      throw new Error('missing_headers')
    }

    const entries: APCustomizationRosterEntry[] = []
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i]
      if (!row) continue

      const size = String(row[columnIndexes.size] ?? '').trim()
      const quantityRaw = String(row[columnIndexes.quantity] ?? '').trim()

      // Skip rows with no size and no quantity
      if (!size && !quantityRaw) continue

      // NAME ON PRODUCT and NUMBER are optional — read only if the column exists
      const name = columnIndexes.text !== -1 ? String(row[columnIndexes.text] ?? '').trim() : ''
      const number =
        columnIndexes.number !== -1 ? String(row[columnIndexes.number] ?? '').trim() : ''

      const parsedQuantity = Number.parseInt(quantityRaw, 10)

      entries.push({
        text: name,
        number,
        size,
        quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
        information: ''
      })
    }

    return entries
  }

  interface Props {
    open: boolean

    /**
     * When provided, the dialog fetches its own roster data from
     * GET /get-product-locker-roster/{lockerId} on open (locker / edit mode).
     * When omitted, the dialog is fully prop-driven (workflow / import mode).
     */
    lockerId?: number | null

    // ── Prop-driven mode (used when lockerId is NOT provided) ──────────────
    entries?: APCustomizationRosterEntry[]
    availableSizes?: string[]
    showNameColumn?: boolean
    showNumberColumn?: boolean
    isImporting?: boolean
    importError?: string | null
    lastImportSummary?: ImportSummary | null
    // ───────────────────────────────────────────────────────────────────────

    canPickFromLocker?: boolean
    title?: string
    /**
     * 'import' — show upload/pick screen when entries are empty (workflow context, default).
     * 'edit'   — always show the table even when entries are empty (locker context).
     *            When lockerId is set this is forced to 'edit' automatically.
     */
    mode?: 'import' | 'edit'
    templateDownloadUrl?: string | null
  }

  const props = withDefaults(defineProps<Props>(), {
    lockerId: null,
    entries: () => [],
    availableSizes: () => [],
    showNameColumn: true,
    showNumberColumn: true,
    isImporting: false,
    importError: null,
    lastImportSummary: null,
    canPickFromLocker: false,
    title: 'Roster',
    mode: 'import',
    templateDownloadUrl: null
  })

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    // Prop-driven events (workflow mode)
    (e: 'update:entry', index: number, payload: Partial<APCustomizationRosterEntry>): void
    (e: 'remove', index: number): void
    (e: 'add-row'): void
    (e: 'import-file', file: File): void
    (e: 'pick-from-locker'): void
    (e: 'create-manual'): void
    (e: 'dismiss-summary'): void
    // Shared events
    (e: 'save'): void
    (e: 'cancel'): void
    // Self-contained mode event — emitted after a successful update-roster POST
    (e: 'roster-updated', payload: { id: number; totalQuantity: number }): void
  }>()

  // ─── Stores ───────────────────────────────────────────────────────────────────

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)

  // ─── Self-contained state (mirrors old EditRosterDetails data properties) ─────

  /**
   * True when a lockerId is provided — the component owns its full data lifecycle
   * (fetch, display, save). In the locker room context this is always true because
   * LockerProductsGrid always passes a lockerId.
   *
   * When false (no lockerId), the component is prop-driven: the parent supplies
   * entries/sizes and handles save — used in the customization workflow context.
   */
  const isSelfContained = computed(() => props.lockerId != null)

  // Internal roster entries — only used in self-contained mode
  const internalEntries = ref<APCustomizationRosterEntry[]>([])
  /**
   * Deep-copy snapshot of entries as loaded from the server (reserved for future use).
   */
  const originalEntries = ref<APCustomizationRosterEntry[]>([])
  const internalSizes = ref<RosterSize[]>([])
  const internalShowNameColumn = ref(true)
  const internalShowNumberColumn = ref(true)
  const isFetching = ref(false)
  const fetchError = ref<string | null>(null)
  // Stored from fetch — needed for template download (mirrors Vue 2 product_id + display_name)
  const internalProductId = ref<number | null>(null)
  const internalDisplayName = ref<string | null>(null)

  // Default blank row — size is set after sizes load (mirrors old default_obj + InitialMidSizeIndex)
  const defaultEntry = (): APCustomizationRosterEntry => ({
    text: '',
    number: '',
    size: internalSizes.value[Math.ceil((internalSizes.value.length - 1) / 2)]?.value ?? '',
    quantity: 1,
    information: ''
  })

  /**
   * Mirrors old resetRosterItem: clears personalised fields while keeping
   * structural ones (size). Used when duplicating a row template for Add Player.
   */
  function buildNewPlayerFromTemplate(
    template: APCustomizationRosterEntry,
    prevSize: string
  ): APCustomizationRosterEntry {
    return {
      text: '',
      number: '',
      size: prevSize || template.size || '',
      quantity: 1,
      information: ''
    }
  }

  /**
   * Resolve a roster size against the available product sizes.
   * If the size from the API isn't in the product size list, fall back to the
   * first available size — mirrors old fixRosterSizes / selectLockerProductRoster.
   */
  function resolveSize(rosterSize: string): string {
    if (!rosterSize?.trim()) return internalSizes.value[0]?.value ?? ''
    if (!internalSizes.value.length) return rosterSize
    const normalized = rosterSize.trim().toLowerCase()
    const match = internalSizes.value.find(
      s => s.value.toLowerCase() === normalized || s.text.toLowerCase() === normalized
    )
    // Return the matched canonical value, or the original string if no match —
    // do NOT silently substitute internalSizes[0] as that hides data errors.
    return match ? match.value : rosterSize
  }

  // ─── Fetch roster on open (self-contained mode only) ─────────────────────────

  async function fetchRoster() {
    if (!props.lockerId) return

    isFetching.value = true
    fetchError.value = null
    internalEntries.value = []
    internalSizes.value = []
    currentView.value = 'import' // show loading over the import screen while fetching

    try {
      // Mirrors old: http.get(`get-product-locker-roster/${this.locker_id}`)
      // lockersService uses Axios so base URL, auth headers, and interceptors apply.
      const response = await lockersService.getRoster(props.lockerId)
      const json = response.data as FetchedRosterResponse

      // result is an OBJECT — destructure directly (not result[0])
      const { product_locker_detail, sizes, allow_name_number } = json.result

      if (!product_locker_detail) throw new Error('No product data returned from the server.')

      const { product_roster_detail, text: textPresets, product_id } = product_locker_detail

      // Store product_id and display_name — used by downloadTemplate()
      internalProductId.value = product_id ?? null
      internalDisplayName.value = json.result.display_name ?? null

      // ── Determine column visibility ──────────────────────────────────────────
      // result.product_locker_detail.text is a parsed array of preset objects.
      // Each has a `type` field: 'name' | 'number'.
      // Fall back to allow_name_number if text is missing/empty.
      const hasTextPresets = Array.isArray(textPresets) && textPresets.length > 0
      if (hasTextPresets) {
        internalShowNameColumn.value = textPresets.some(t => t.type === 'name')
        internalShowNumberColumn.value = textPresets.some(t => t.type === 'number')
      } else {
        // Mirrors old allow_name_number fallback
        internalShowNameColumn.value = allow_name_number === 1
        internalShowNumberColumn.value = allow_name_number === 1
      }

      // ── Build size list from sizes.json_data ─────────────────────────────────
      // The dedicated sizes object is present in this endpoint — use it so the
      // dropdown shows all available sizes, not just those already in the roster.
      internalSizes.value = (sizes?.json_data ?? []).map(s => ({ value: s.name, text: s.name }))

      // ── Map roster entries ────────────────────────────────────────────────────
      if (product_roster_detail && product_roster_detail.length > 0) {
        const mapped = product_roster_detail.map(entry => ({
          text: entry.text ?? '',
          number: entry.number ?? '',
          size: resolveSize(entry.size),
          quantity: entry.quantity ?? 1,
          information: entry.information ?? ''
        }))
        internalEntries.value = mapped
        // Deep-copy snapshot of server-loaded roster
        originalEntries.value = mapped.map(e => ({ ...e }))
        // Existing roster → go straight to the table
        currentView.value = 'table'
      } else {
        originalEntries.value = []
        // No existing roster → show import/upload screen so user can
        // upload an Excel file or click "Create Manually"
        currentView.value = 'import'
      }
    } catch (err) {
      fetchError.value =
        err instanceof Error ? err.message : 'Something went wrong, please try again'
    } finally {
      isFetching.value = false
    }
  }

  /**
   * Trigger a fetch whenever:
   *  - the dialog opens (open flips true) AND a lockerId is already set, OR
   *  - lockerId first arrives while the dialog is already open
   *    (covers the case where lockerId is set after mount / from async parent state).
   * { immediate: true } handles the case where both are true at mount time.
   */
  watch(
    () => [props.open, props.lockerId] as const,
    ([open, lockerId]) => {
      if (open && lockerId != null) {
        fetchRoster()
      }
    },
    { immediate: true }
  )

  // ─── Resolved data — single source of truth for the template ─────────────────

  /**
   * In self-contained mode: use internal state fetched from the API.
   * In prop-driven mode:    use whatever the parent passes in.
   */
  const activeEntries = computed(() =>
    isSelfContained.value ? internalEntries.value : props.entries
  )
  const activeSizes = computed(() =>
    isSelfContained.value ? internalSizes.value.map(s => s.text) : props.availableSizes
  )
  const activeShowNameColumn = computed(() =>
    isSelfContained.value ? internalShowNameColumn.value : props.showNameColumn
  )
  const activeShowNumberColumn = computed(() =>
    isSelfContained.value ? internalShowNumberColumn.value : props.showNumberColumn
  )

  // Total quantity for the footer counter — mirrors old totalQuantity getter
  const totalQuantity = computed(() =>
    activeEntries.value.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  )

  // ─── Local UI state ───────────────────────────────────────────────────────────

  const selectedRowIndex = ref<number | null>(null)

  const fileInputRef = ref<HTMLInputElement | null>(null)
  const uploadInputId = `roster-upload-${Math.random().toString(36).slice(2)}`
  const isDragging = ref(false)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  // Import state — used in self-contained mode when parsing an uploaded XLSX.
  // In prop-driven mode these come from the parent via props.
  const internalIsImporting = ref(false)
  const internalImportError = ref<string | null>(null)
  // Success summary shown after a successful XLSX import in self-contained mode.
  // Mirrors useRosterImporter's setLastImportSummary call.
  const internalImportSummary = ref<ImportSummary | null>(null)

  /**
   * Tracks the user's current sub-screen within the dialog.
   *
   * 'import' — upload/pick screen (dropzone, locker, manual button)
   * 'table'  — roster table (edit entries, add/remove players)
   *
   * In self-contained mode (lockerId provided):
   *   - Starts as 'import' while fetching; switches to 'table' once data loads.
   *   - User can navigate back to 'import' via the breadcrumb to replace the roster.
   * In prop-driven mode:
   *   - Starts as 'import' when entries are empty; switches to 'table' after import
   *     or after the user clicks "Create Manually".
   *   - Breadcrumb back only shown after "Create Manually" (isManualEditView).
   */
  type DialogView = 'import' | 'table'
  const currentView = ref<DialogView>('import')

  /**
   * Whether the user reached the table via "Create Manually" (prop-driven mode).
   * Used to show the breadcrumb back link specifically for that flow.
   */
  const isManualEditView = ref(false)

  // ─── Derived screen state ─────────────────────────────────────────────────────
  const hasEntries = computed(() => activeEntries.value.length > 0)
  const canDeleteRows = computed(() => activeEntries.value.length > 1)
  const playersCount = computed(() => activeEntries.value.length)
  const showInlineMessage = computed(
    () =>
      (isSelfContained.value && internalImportSummary.value != null) ||
      (!isSelfContained.value && props.lastImportSummary != null)
  )

  // Resolved import summary — local ref in self-contained, prop in prop-driven
  const activeImportSummary = computed(() =>
    isSelfContained.value ? internalImportSummary.value : props.lastImportSummary
  )

  // Loading screen: initial fetch in self-contained mode, OR parent signals importing
  // Note: XLSX import spinner is shown inline on the dropzone (isImporting), not here.
  const showLoadingScreen = computed(
    () =>
      (isSelfContained.value && isFetching.value) ||
      (!isSelfContained.value && props.isImporting && !hasEntries.value)
  )

  // Resolved import error — local ref in self-contained mode, prop in prop-driven mode
  const activeImportError = computed(() =>
    isSelfContained.value ? internalImportError.value : props.importError
  )

  // Resolved importing flag — local ref in self-contained, prop in prop-driven
  const activeIsImporting = computed(() =>
    isSelfContained.value ? internalIsImporting.value : props.isImporting
  )

  // Which screen to show — driven by currentView, but prop-driven import mode can
  // also show the table when entries arrive from the parent without a manual nav.
  const showEditScreen = computed(
    () => currentView.value === 'table' || (!isSelfContained.value && hasEntries.value)
  )

  /**
   * Breadcrumb appears whenever the user is on the table screen AND there is a
   * meaningful "back" destination:
   *  - Self-contained mode: always (back → import/replace screen)
   *  - Prop-driven mode: only after "Create Manually" (back → dropzone)
   */
  const showBreadcrumb = computed(
    () =>
      currentView.value === 'table' &&
      !isFetching.value &&
      (isSelfContained.value || isManualEditView.value)
  )

  // ─── File import (self-contained mode) ───────────────────────────────────────
  // Mirrors useRosterImporter: validates file type, parses XLSX, populates entries.

  async function importFile(file: File) {
    const isExcelFile = EXCEL_MIME_TYPES.has(file.type) || SUPPORTED_EXTENSION.test(file.name ?? '')
    if (!isExcelFile) {
      internalImportError.value = roster_error_excel({}, { locale: locale.value })
      return
    }

    isDragging.value = false
    internalImportError.value = null

    if (isSelfContained.value) {
      // Self-contained: parse locally and populate internalEntries directly
      internalIsImporting.value = true
      try {
        const buffer = await file.arrayBuffer()
        const parsed = parseExcelRoster(buffer)
        if (!parsed.length) {
          internalImportError.value = roster_error_no_rows({}, { locale: locale.value })
        } else {
          // Resolve sizes against the loaded size list
          internalEntries.value = parsed.map(entry => ({
            ...entry,
            // Ensure quantity is always a number (guards against string from xlsx)
            quantity: Number(entry.quantity) || 1,
            size: resolveSize(entry.size)
          }))
          // Re-derive column visibility from the imported data
          const first = parsed[0]
          internalShowNameColumn.value = typeof first?.text === 'string'
          internalShowNumberColumn.value = typeof first?.number === 'string'
          // Mirror useRosterImporter's setLastImportSummary — drives the success banner
          internalImportSummary.value = { totalRows: parsed.length }
          currentView.value = 'table'
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'missing_headers') {
          internalImportError.value = roster_error_headers({}, { locale: locale.value })
        } else {
          internalImportError.value = roster_error_generic({}, { locale: locale.value })
        }
      } finally {
        internalIsImporting.value = false
      }
    } else {
      // Prop-driven: hand off to parent via emit
      emit('import-file', file)
    }
  }

  function openFilePicker() {
    fileInputRef.value?.click()
  }

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) await importFile(file)
    if (target) target.value = ''
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    internalImportError.value = null
    isDragging.value = true
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) await importFile(file)
  }

  // ─── Row mutations (self-contained mode) ─────────────────────────────────────

  /**
   * Mirrors old handleRosterItemUpdate — mutates the existing entry object in place
   * rather than replacing it via splice. Replacing creates a new object reference
   * which causes Vue to re-render the row and destroy the focused input.
   */
  function handleInternalUpdate(index: number, payload: Partial<APCustomizationRosterEntry>) {
    const entry = internalEntries.value[index]
    if (!entry) return
    Object.assign(entry, payload)
  }

  /**
   * Mirrors old removeRosterItem.
   */
  function handleInternalRemove(index: number) {
    internalEntries.value.splice(index, 1)
  }

  /**
   * Mirrors old addRosterItem:
   * - If empty roster, push a blank default entry.
   * - Otherwise, clone the structure of the first row but clear personal fields,
   *   and inherit the size of the previous (last) row.
   */
  function handleInternalAddPlayer() {
    if (!internalEntries.value.length) {
      internalEntries.value = [defaultEntry()]
      return
    }
    const lastEntry = internalEntries.value[internalEntries.value.length - 1]
    const newEntry = buildNewPlayerFromTemplate(
      internalEntries.value[0] ?? defaultEntry(),
      lastEntry?.size ?? defaultEntry().size
    )
    internalEntries.value = [...internalEntries.value, newEntry]
  }

  // ─── Unified handlers that delegate to self-contained or prop-driven ──────────

  function handleUpdate(index: number, payload: Partial<APCustomizationRosterEntry>) {
    if (isSelfContained.value) {
      handleInternalUpdate(index, payload)
    } else {
      emit('update:entry', index, payload)
    }
  }

  function handleRemove(index: number) {
    if (isSelfContained.value) {
      handleInternalRemove(index)
    } else {
      emit('remove', index)
    }
  }

  function handleAddPlayer() {
    if (isSelfContained.value) {
      handleInternalAddPlayer()
    } else {
      emit('add-row')
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  function resetLocalState() {
    currentView.value = 'import'
    isManualEditView.value = false
    saveError.value = null
    fetchError.value = null
    internalImportError.value = null
    internalImportSummary.value = null
    // Clear internal data on full close so the next open always starts
    // with a fresh fetch (important when switching between products).
    internalEntries.value = []
    originalEntries.value = []
    internalSizes.value = []
    internalProductId.value = null
    internalDisplayName.value = null
    selectedRowIndex.value = null
  }

  function handleDismissSummary() {
    if (isSelfContained.value) {
      internalImportSummary.value = null
    } else {
      emit('dismiss-summary')
    }
  }

  function handleClose() {
    resetLocalState()
    emit('update:open', false)
    emit('cancel')
  }

  function handleCreateManual() {
    isManualEditView.value = true
    currentView.value = 'table'
    if (!isSelfContained.value) {
      // Prop-driven: parent owns entries, tell it to add a blank row
      emit('add-row')
      emit('create-manual')
    } else {
      // Self-contained: fetched entries are already in internalEntries.
      // Just switch to the table view — don't reset or add anything.
      // If for some reason the roster is empty (e.g. user navigated back and
      // cleared), add one blank default row so the table isn't empty.
      if (!internalEntries.value.length) {
        internalEntries.value = [defaultEntry()]
      }
    }
  }

  function handleBackToImport() {
    currentView.value = 'import'
    isManualEditView.value = false
    saveError.value = null
    // Intentionally do NOT clear internalEntries here.
    // The fetched roster data is kept in memory so that:
    //  - "Create Manually" from the import screen restores the existing entries
    //  - the user doesn't lose their data just by navigating back
    // Entries are only reset when the dialog is fully closed or a new fetch runs.
  }

  /**
   * Clears the in-memory roster and returns to the import screen (drag-and-drop / click to upload),
   * same as opening with no saved roster. Scoped to this locker product only.
   */
  function handleReset() {
    currentView.value = 'import'
    isManualEditView.value = false
    internalEntries.value = []
    internalImportSummary.value = null
    internalImportError.value = null
    saveError.value = null
    isDragging.value = false
    selectedRowIndex.value = null
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────

  /**
   * Validates that no size fields are empty — mirrors old updateRoster guard.
   */
  function validateEntries(entries: APCustomizationRosterEntry[]): string | null {
    const hasEmptySize = entries.some(e => !e.size?.trim())
    if (hasEmptySize) return 'Please make sure all roster rows have a size selected.'
    return null
  }

  async function handleSave() {
    isSaving.value = true
    saveError.value = null

    const entries = activeEntries.value
    const validationError = validateEntries(entries)
    if (validationError) {
      saveError.value = validationError
      isSaving.value = false
      return
    }

    try {
      if (isSelfContained.value) {
        /**
         * Self-contained mode: POST to update-roster via lockersService.
         * Mirrors old: http.post('update-roster', { locker_product_id, product_roster_detail })
         */
        await lockersService.updateRoster(props.lockerId!, entries)

        emit('roster-updated', {
          id: props.lockerId!,
          totalQuantity: totalQuantity.value
        })
        emit('save')
        toast.success(msg_roster_updated_success({}, { locale: locale.value }), {
          position: 'top-right',
          richColors: true
        })
        handleClose()
      } else {
        /**
         * Prop-driven / workflow mode: emit save and let the parent handle
         * the API call with its own service/store. RosterDialog does not
         * own the save logic in this mode — the parent chose the endpoint.
         */
        emit('save')
      }
    } catch (err) {
      saveError.value =
        err instanceof Error ? err.message : 'Something went wrong, please try again.'
      toast.error(msg_failed_to_update_roster({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    } finally {
      isSaving.value = false
    }
  }

  // ─── Template download ────────────────────────────────────────────────────────

  const isDownloadingTemplate = ref(false)

  /**
   * Mirrors Vue 2 downloadSampleTemplate(prod_id):
   *   GET template/download/{product_id} → blob → trigger browser download
   *   filename: product_{display_name}_template.xlsx
   *
   * Uses product_id from product_locker_detail (NOT lockerId / locker_product_id).
   */
  async function downloadTemplate() {
    if (!internalProductId.value) return
    isDownloadingTemplate.value = true
    try {
      const response = await lockersService.downloadRosterTemplate(internalProductId.value)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `product_${internalDisplayName.value ?? internalProductId.value}_template.xlsx`
      link.click()
      window.URL.revokeObjectURL(link.href)
    } catch {
      // Non-critical — silently fail; could add a toast here if desired
    } finally {
      isDownloadingTemplate.value = false
    }
  }
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      val => {
        if (!val) handleClose()
      }
    "
  >
    <DialogContent
      data-testid="roster-dialog"
      class="p-0 flex flex-col w-full overflow-hidden max-h-[85vh]"
      style="max-width: 680px"
      :class="isMobile ? 'h-full max-h-full' : ''"
    >
      <!-- ── Header ──────────────────────────────────────────────────────────── -->
      <DialogHeader class="p-4 border-b bg-background w-full shrink-0">
        <div class="flex items-center justify-between gap-3">
          <div class="flex flex-col gap-1 min-w-0">
            <!--
              Breadcrumb: shown whenever the user is on the table screen and there is a
              meaningful "back" destination.
              - Self-contained mode: always shown (back → import/replace screen)
              - Prop-driven mode: shown only after "Create Manually" (back → dropzone)
            -->
            <nav
              v-if="showBreadcrumb"
              class="flex items-center gap-1 text-sm text-muted-foreground"
              :aria-label="roster_nav_aria_label({}, { locale })"
            >
              <button
                type="button"
                class="hover:text-foreground transition-colors underline underline-offset-2"
                @click="handleBackToImport"
              >
                {{ title }}
              </button>
              <ChevronRight class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="text-foreground font-medium" aria-current="page">
                {{
                  isSelfContained
                    ? roster_edit_roster({}, { locale })
                    : roster_manual_create({}, { locale })
                }}
              </span>
            </nav>

            <DialogTitle class="text-lg font-semibold leading-none">{{ title }}</DialogTitle>
            <DialogDescription class="sr-only">{{ title }} roster management</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <!-- ── Loading screen ─────────────────────────────────────────────────── -->
      <!--
        Self-contained mode: shown while GET /get-product-locker-roster is in flight.
        Prop-driven mode: shown while parent signals isImporting with no entries yet.
      -->
      <div
        v-if="showLoadingScreen"
        class="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground flex-1"
      >
        <Spinner class="size-6 text-primary" />
        <p class="text-sm">Loading...</p>
      </div>

      <!-- ── Fetch error (self-contained mode only) ──────────────────────────── -->
      <div
        v-else-if="fetchError"
        class="flex flex-col items-center justify-center gap-4 px-6 py-16 flex-1"
      >
        <p
          class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center"
        >
          {{ fetchError }}
        </p>
        <Button variant="secondary" size="sm" @click="fetchRoster">
          {{ roster_retry({}, { locale }) }}
        </Button>
      </div>

      <!-- ── Import / pick screen ───────────────────────────────────────────── -->
      <!--
        Shown when currentView === 'import':
          - No existing roster on first open (product has no entries yet)
          - User navigated back from the table via breadcrumb
      -->
      <div
        v-else-if="!showEditScreen"
        class="flex flex-col gap-4 px-4 pb-4 md:px-6 md:pb-6 pt-4 overflow-y-auto"
      >
        <!-- Template download — above dropzone, mirrors Vue 2 position -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            {{ roster_description({}, { locale }) }}
          </p>
          <Button
            v-if="isSelfContained && internalProductId"
            variant="outline"
            size="sm"
            class="gap-1.5 shrink-0"
            :disabled="isDownloadingTemplate"
            @click="downloadTemplate"
          >
            <Spinner v-if="isDownloadingTemplate" class="size-3.5" />
            <Download v-else class="size-3.5" aria-hidden="true" />
            {{ roster_template_button({}, { locale }) }}
          </Button>
          <a
            v-else-if="templateDownloadUrl"
            :href="templateDownloadUrl"
            download
            class="inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 hover:bg-accent transition-colors shrink-0"
          >
            <Download class="size-3.5" aria-hidden="true" />
            {{ roster_template_button({}, { locale }) }}
          </a>
        </div>

        <!-- Dropzone -->
        <div
          class="rounded-2xl border border-dashed px-6 py-8 text-center transition-all bg-background"
          :class="[
            isDragging ? 'border-primary bg-primary/5' : 'border-border',
            activeIsImporting ? 'pointer-events-none opacity-70' : 'cursor-pointer'
          ]"
          role="button"
          tabindex="0"
          @click.prevent="openFilePicker"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <div class="mx-auto mb-3 flex size-12 items-center justify-center text-primary">
            <i-other-excel class="size-8" aria-hidden="true" />
          </div>
          <p class="text-sm font-medium">
            {{ logos_empty_drag_drop({}, { locale }) }}
            <label
              :for="uploadInputId"
              class="cursor-pointer text-primary underline underline-offset-4 hover:text-primary/80"
              @click.stop
            >
              {{ logos_empty_click_to_upload({}, { locale }) }}
            </label>
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            {{ roster_drop_helper({}, { locale }) }}
          </p>
          <div v-if="activeIsImporting" class="mt-3 flex justify-center">
            <Spinner class="size-5 text-primary" />
          </div>
        </div>

        <input
          :id="uploadInputId"
          ref="fileInputRef"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          class="hidden"
          @change="handleFileChange"
        />

        <p
          v-if="activeImportError"
          class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ activeImportError }}
        </p>

        <div class="flex items-center gap-3 text-sm text-muted-foreground">
          <Separator class="flex-1 bg-border" />
          <span>{{ colors_separator_or({}, { locale }) }}</span>
          <Separator class="flex-1 bg-border" />
        </div>

        <Button variant="default" class="w-full" @click="handleCreateManual">
          {{ roster_manual_create({}, { locale }) }}
        </Button>
      </div>

      <!-- ── Edit / table screen ────────────────────────────────────────────── -->
      <!--
        Shown when:
          - self-contained mode (lockerId provided) — always shown after fetch
          - prop-driven edit mode — always shown
          - entries exist after import
          - user clicked "Create Manually"
        Uses `activeEntries` / `activeSizes` which resolve to internal or prop data.
      -->
      <div v-else class="flex flex-col flex-1 overflow-hidden">
        <div class="flex flex-col gap-4 px-4 pb-4 md:px-6 md:pb-6 pt-4 overflow-y-auto flex-1">
          <!-- Import success alert -->
          <transition name="fade">
            <Alert
              v-if="showInlineMessage"
              class="relative flex items-start gap-3 rounded-2xl border-primary/20 bg-primary/10"
            >
              <div class="flex flex-row gap-2">
                <CheckCircle2 class="size-9 text-primary" aria-hidden="true" />
                <div class="flex flex-col">
                  <AlertTitle>
                    {{
                      roster_import_success(
                        { count: activeImportSummary?.totalRows ?? playersCount },
                        { locale }
                      )
                    }}
                  </AlertTitle>
                  <AlertDescription class="text-muted-foreground">
                    {{ roster_import_ready({}, { locale }) }}
                  </AlertDescription>
                </div>
              </div>
              <button
                type="button"
                class="absolute right-4 top-4 text-primary transition hover:text-primary/80"
                :aria-label="ui_close({}, { locale })"
                @click="handleDismissSummary"
              >
                <X class="size-4" aria-hidden="true" />
              </button>
            </Alert>
          </transition>

          <!-- Save / validation error -->
          <transition name="fade">
            <p
              v-if="saveError"
              class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {{ saveError }}
            </p>
          </transition>

          <!-- Roster table — bound to resolved active data -->
          <div class="space-y-4">
            <!--
              Reset List — mirrors useRosterConfig's actionButton with Info icon.
              Shown whenever on the edit table in self-contained mode.
              Clears the roster and returns to the import (upload / create manually) screen.
            -->
            <div v-if="isSelfContained" class="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                class="gap-1.5"
                :disabled="isSaving"
                :title="roster_reset_action_tooltip({}, { locale })"
                @click="handleReset"
              >
                <Info class="size-3.5" aria-hidden="true" />
                {{ roster_reset_action({}, { locale }) }}
              </Button>
            </div>
            <RosterTable
              v-model:selected-row-index="selectedRowIndex"
              :entries="activeEntries"
              :show-name-column="activeShowNameColumn"
              :show-number-column="activeShowNumberColumn"
              :size-options="activeSizes"
              :can-delete="canDeleteRows"
              :enable-row-select="false"
              @update:entry="handleUpdate"
              @remove="handleRemove"
            />

            <!--
              Add Player — mirrors old addRosterItem button label.
              Delegates to internal mutation (self-contained) or parent emit (prop-driven).
            -->
            <Button
              variant="outline"
              size="sm"
              class="w-full gap-2"
              :disabled="isSaving"
              @click="handleAddPlayer"
            >
              <Plus class="size-4" aria-hidden="true" />
              {{ roster_add_player({}, { locale }) }}
            </Button>
          </div>
        </div>

        <!-- Footer -->
        <DialogFooter class="p-4 border-t shrink-0">
          <div class="flex items-center justify-between w-full gap-4">
            <!--
              Total quantity counter — mirrors old totalQuantity display.
              Shown in both modes so the user always knows the roster size.
            -->
            <p class="text-sm text-muted-foreground shrink-0">
              {{ roster_total_label({}, { locale }) }}:
              <span class="font-semibold text-foreground">{{ totalQuantity }}</span>
            </p>

            <div class="flex gap-3 flex-1 justify-end">
              <Button variant="outline" class="flex-1" :disabled="isSaving" @click="handleClose">
                {{ profile_cancel({}, { locale }) }}
              </Button>
              <Button variant="default" class="flex-1" :disabled="isSaving" @click="handleSave">
                <Spinner v-if="isSaving" class="size-4 mr-2" />
                {{ roster_update_action({}, { locale }) }}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
