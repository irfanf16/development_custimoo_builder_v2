import { type Ref } from 'vue'
import { Canvas, Group, Gradient, FabricImage, type FabricObject } from 'fabric'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useDesignConfig } from '@/components/customization-workflow/WorkflowSteps/design/useDesignConfig'
import { useProductsStore } from '@/stores/products/products.store'
import {
  getSelectedProductPantones,
  getClosestColor,
  getColorType,
  hexToRgbObject,
  getPermutation
} from '@/lib/utils'
import type { OutputSvgGroupColor } from '@/services/products/types'
import type { CanvasSide } from '@/stores/workflow/workflow.store.types'

/**
 * Composable for color customization functionality
 * Shared between TwoDScene and ThreeDScene
 */
export function useColorCustomization(
  canvas: Ref<Canvas | null>,
  designObject: Ref<FabricObject | FabricImage | null>,
  svgGroups: Ref<OutputSvgGroupColor[]>,
  initialSvgGroups: Ref<OutputSvgGroupColor[]>,
  parts: Ref<string[]>,
  effectiveProductId: Ref<number | null>,
  productsStore: ReturnType<typeof useProductsStore>,
  mainPreview: boolean,
  side: CanvasSide,
  colorGrouping?: Ref<Record<string, string[]> | null>
) {
  // ===== DEPENDENCIES =====
  const customizationStore = useCustomizationStore()
  const { applyCustomizationOverrides } = useDesignConfig()

  // ===== UTILITIES =====
  /**
   * Get SVG group colors for a specific group (helper for checking available colors)
   */
  function getSvgGroupColors(svgGroup: string) {
    const product = effectiveProductId.value
      ? productsStore.getProductById(effectiveProductId.value)
      : productsStore.activeProductDetails

    if (product?.svg_group_color_container?.[svgGroup]) {
      return product.svg_group_color_container[svgGroup]
    }
    return null
  }

  /**
   * Get group color by SVG group name
   * @param svgGroup - SVG group ID
   * @param gradientColorIndex - Optional gradient color index
   * @returns Color object with color, pantone, and name
   */
  function getGroupColorBySvgGroup(
    svgGroup: string,
    gradientColorIndex: number | null = null
  ): { color: string; pantone: string; name: string } {
    const groupColors = customizationStore.customization?.group_colors || {}
    const groupColor = groupColors[svgGroup]

    if (!groupColor) {
      return { color: '', pantone: '', name: '' }
    }

    let finalColor: { color: string; pantone: string; name: string }

    if (gradientColorIndex !== null && groupColor.gradient_colors) {
      finalColor = groupColor.gradient_colors[gradientColorIndex] || {
        color: '',
        pantone: '',
        name: ''
      }
    } else {
      finalColor = {
        color: groupColor.color || '',
        pantone: '',
        name: groupColor.name || ''
      }
    }

    // Check if color exists in product's SVG group colors
    const product = effectiveProductId.value
      ? productsStore.getProductById(effectiveProductId.value)
      : productsStore.activeProductDetails

    if (product?.svg_group_color_container?.[svgGroup]) {
      const productColors = product.svg_group_color_container[svgGroup].json_data || []
      const colorExists = productColors.some(
        (color: { value?: string }) => color.value === finalColor.color
      )

      if (!colorExists && finalColor.color) {
        // Find closest color match
        const selectProductPantonesList = getSelectedProductPantones(
          effectiveProductId.value,
          svgGroup
        )
        const closestColor = getClosestColor(
          finalColor.color,
          selectProductPantonesList,
          getColorType(svgGroup, effectiveProductId.value)
        )
        return {
          color: closestColor.hex,
          pantone: closestColor.pantone,
          name: closestColor.name
        }
      }
    }

    return finalColor
  }

  /**
   * Get default color by SVG group name
   * @param svgGroup - SVG group ID
   * @param defaultColorOriginal - Original default color object
   * @returns Color object with color, pantone, and name
   */
  function getDefaultColorBySvgGroup(
    svgGroup: string,
    defaultColorOriginal: { color: string; pantone?: string; name?: string }
  ): { color: string; pantone: string; name: string } {
    const svgGroupColors = getSvgGroupColors(svgGroup)
    if (svgGroupColors && svgGroupColors.json_data) {
      const colorExists = svgGroupColors.json_data.some(
        (color: { value?: string }) => color.value === defaultColorOriginal.color
      )
      if (!colorExists && defaultColorOriginal.color) {
        // Find closest color match
        const selectProductPantonesList = getSelectedProductPantones(
          effectiveProductId.value,
          svgGroup
        )
        const closestColor = getClosestColor(
          defaultColorOriginal.color,
          selectProductPantonesList,
          getColorType(svgGroup, effectiveProductId.value)
        )
        return {
          color: closestColor.hex,
          pantone: closestColor.pantone,
          name: closestColor.name
        }
      }
    }
    return {
      color: defaultColorOriginal.color || '',
      pantone: defaultColorOriginal.pantone || '',
      name: defaultColorOriginal.name || ''
    }
  }

  /**
   * Find closest color index from product part colors to default colors
   * @param productPartColors - Array of product part colors
   * @param defaultColors - Array of default colors
   * @returns Index of the closest default color
   */
  function findClosestColorIndex(
    productPartColors: Array<{ value?: string }>,
    defaultColors: Array<{ color?: string | null }>
  ): number {
    let groupColorIndex = 0
    let leastColorDifference = 765 // Max color difference: 255 + 255 + 255 = 765

    const defaultColorsRGB = defaultColors
      .filter(color => color.color)
      .map(color => hexToRgbObject(color.color as string))
      .filter((rgb): rgb is { red: number; green: number; blue: number } => rgb !== null)

    const productPartColorsRGB = productPartColors
      .map(color => hexToRgbObject(color.value || ''))
      .filter((rgb): rgb is { red: number; green: number; blue: number } => rgb !== null)

    defaultColorsRGB.forEach((defaultColor, defaultColorIndex) => {
      productPartColorsRGB.forEach(productPartColor => {
        // Calculate the Euclidean distance
        const diff = Math.sqrt(
          Math.pow(defaultColor.red - productPartColor.red, 2) +
            Math.pow(defaultColor.green - productPartColor.green, 2) +
            Math.pow(defaultColor.blue - productPartColor.blue, 2)
        )
        if (diff < leastColorDifference) {
          leastColorDifference = diff
          groupColorIndex = defaultColorIndex
        }
      })
    })

    return groupColorIndex
  }

  // ===== ACTIONS =====
  /**
   * Change default colors on the canvas
   * @param renderTime - Optional render delay time
   */
  function changeDefaultColors(renderTime = 0): void {
    if (!canvas.value || !designObject.value) return

    const defaultColors = customizationStore.customization?.default_colors || []
    const filteredDefaultColors = defaultColors.filter(
      (color: { color?: string | null }) => color.color
    )

    if (filteredDefaultColors.length === 0) return

    // Get design objects - handle both Group and single object
    const design: FabricObject[] = (designObject.value as Group & { _objects?: FabricObject[] })
      ._objects
      ? (designObject.value as Group)._objects || []
      : [designObject.value as FabricObject]

    const shuffleColorNumber = customizationStore.customization?.shuffle_color_number || 0

    // If still no parts, we can't apply colors
    if (parts.value.length === 0) {
      console.warn('No parts available for default colors application')
      return
    }

    const sequences = getPermutation(shuffleColorNumber, parts.value.length)
    const appliedDefaultColors: Record<string, string | string[]> = {}
    let useColorIndex = 0

    // Apply default colors to SVG groups
    sequences.forEach((sequence: number) => {
      const svgPart = parts.value[sequence]
      if (svgPart) {
        const partIndex = svgPart.split('_')
        const part = partIndex[0] || svgPart
        const index = partIndex[1] || '1'
        const gradientColorIndex = parseInt(index) - 1
        const svgIndex = svgGroups.value.findIndex(group => group.id === part)

        if (svgIndex !== -1) {
          const svgGroup = svgGroups.value[svgIndex]
          if (!svgGroup) return

          const product = effectiveProductId.value
            ? productsStore.getProductById(effectiveProductId.value)
            : productsStore.activeProductDetails

          // Find closest color if product has svg_group_color_container
          if (product?.svg_group_color_container?.[svgGroup.id]?.json_data) {
            const productPartColors =
              product.svg_group_color_container[svgGroup.id]?.json_data || []
            useColorIndex = findClosestColorIndex(productPartColors, filteredDefaultColors)
          }

          const defaultColor = filteredDefaultColors[useColorIndex] as {
            color: string
            pantone?: string
            name?: string
          }

          if (defaultColor) {
            let finalColor: { color: string; pantone: string; name: string }

            if (svgGroup.gradient_colors) {
              finalColor = getDefaultColorBySvgGroup(svgGroup.id, defaultColor)
              if (svgGroup.gradient_colors[gradientColorIndex]) {
                svgGroup.gradient_colors[gradientColorIndex].color = finalColor.color
                svgGroup.gradient_colors[gradientColorIndex].pantone = finalColor.pantone
                svgGroup.gradient_colors[gradientColorIndex].name = finalColor.name
              }
              if (Array.isArray(appliedDefaultColors[part])) {
                appliedDefaultColors[part].push(finalColor.color)
              } else {
                appliedDefaultColors[part] = [finalColor.color]
              }
            } else {
              finalColor = getDefaultColorBySvgGroup(svgGroup.id, defaultColor)
              appliedDefaultColors[part] = finalColor.color
              svgGroup.color = finalColor.color
              svgGroup.pantone = finalColor.pantone
              svgGroup.name = finalColor.name
            }

            // Update store if mainPreview is enabled (only for front/back, not 3d)
            if (mainPreview && (side === 'front' || side === 'back')) {
              productsStore.setSvgGroups(svgGroups.value, side, false)
            }
          }

          useColorIndex++
          if (useColorIndex >= filteredDefaultColors.length) {
            useColorIndex = 0
          }
        }
      }
    })

    // Update design objects on canvas
    design.forEach(item => {
      const itemWithId = item as FabricObject & {
        id?: string
        fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
      }

      if (!itemWithId.id) return

      const itemId = itemWithId.id.toLowerCase()
      const appliedColor = appliedDefaultColors[itemId]

      if (appliedColor) {
        if (
          itemWithId.fill &&
          typeof itemWithId.fill === 'object' &&
          'gradientUnits' in itemWithId.fill &&
          itemWithId.fill.gradientUnits
        ) {
          // Handle gradient fill
          if (Array.isArray(appliedColor)) {
            itemWithId.fill.colorStops?.forEach(
              (gradient: { color: string }, gradientIndex: number) => {
                if (appliedColor[gradientIndex]) {
                  gradient.color = appliedColor[gradientIndex]
                }
              }
            )
            itemWithId.set(
              'fill',
              new Gradient(itemWithId.fill as unknown as ConstructorParameters<typeof Gradient>[0])
            )
          }
        } else if (
          itemWithId.fill &&
          typeof itemWithId.fill === 'string' &&
          typeof appliedColor === 'string'
        ) {
          // Handle solid fill
          itemWithId.set('fill', appliedColor)
        }
      }
    })

    // Apply color grouping if available
    if (colorGrouping?.value) {
      unHideColorGrouping(renderTime)
    } else {
      // Render canvas after a delay
      if (renderTime > 0) {
        setTimeout(() => {
          canvas.value?.requestRenderAll()
        }, renderTime)
      } else {
        canvas.value?.requestRenderAll()
      }
    }
  }

  /**
   * Change group colors on the canvas
   * @param renderTime - Optional render delay time
   */
  function changeGroupColors(renderTime = 0): void {
    if (!canvas.value || !designObject.value) return

    const groupColors = customizationStore.customization?.group_colors || {}
    const hasGroupColors = Object.keys(groupColors).length > 0

    if (!hasGroupColors) return

    // Get design objects - handle both Group and single object
    const design: FabricObject[] = (designObject.value as Group & { _objects?: FabricObject[] })
      ._objects
      ? (designObject.value as Group)._objects || []
      : [designObject.value as FabricObject]

    // Update SVG groups in local state
    svgGroups.value.forEach(svgGroup => {
      if (groupColors[svgGroup.id]) {
        if (svgGroup.gradient_colors) {
          if (groupColors[svgGroup.id]?.gradient_colors) {
            // Update all gradient colors
            groupColors[svgGroup.id]?.gradient_colors?.forEach(
              (_gradientColor: unknown, gradientColorIndex: number) => {
                const finalColor = getGroupColorBySvgGroup(svgGroup.id, gradientColorIndex)
                if (svgGroup.gradient_colors && svgGroup.gradient_colors[gradientColorIndex]) {
                  svgGroup.gradient_colors[gradientColorIndex].color = finalColor.color
                  svgGroup.gradient_colors[gradientColorIndex].pantone = finalColor.pantone
                  svgGroup.gradient_colors[gradientColorIndex].name = finalColor.name
                }
              }
            )
          } else {
            // Update first gradient color if other product same group changed color without gradient
            if (svgGroup.gradient_colors[0]) {
              const finalColor = getGroupColorBySvgGroup(svgGroup.id)
              svgGroup.gradient_colors[0].color = finalColor.color
              svgGroup.gradient_colors[0].pantone = finalColor.pantone
              svgGroup.gradient_colors[0].name = finalColor.name
            }
          }
        } else {
          // Update solid color
          const finalColor = getGroupColorBySvgGroup(
            svgGroup.id,
            groupColors[svgGroup.id]?.gradient_colors ? 0 : null
          )
          svgGroup.color = finalColor.color
          svgGroup.name = finalColor.name
          svgGroup.pantone = finalColor.pantone
        }

        // Update store if mainPreview is enabled (only for front/back, not 3d)
        if (mainPreview && (side === 'front' || side === 'back')) {
          productsStore.setSvgGroups(svgGroups.value, side, false)
        }
      } else {
        // Reset to initial color if no group color is set
        const initialGroup = initialSvgGroups.value.find(g => g.id === svgGroup.id)
        if (initialGroup) {
          Object.assign(svgGroup, initialGroup)
          if (mainPreview && (side === 'front' || side === 'back')) {
            productsStore.setSvgGroups(svgGroups.value, side, false)
          }
        }
      }
    })

    // Update design objects on canvas
    design.forEach(item => {
      const itemWithId = item as FabricObject & {
        id?: string
        fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
      }

      if (!itemWithId.id) return

      const itemId = itemWithId.id.toLowerCase()

      if (groupColors[itemId]) {
        if (
          itemWithId.fill &&
          typeof itemWithId.fill === 'object' &&
          'gradientUnits' in itemWithId.fill &&
          itemWithId.fill.gradientUnits
        ) {
          // Handle gradient fill
          if (groupColors[itemId].gradient_colors) {
            // Update all gradient color stops
            groupColors[itemId].gradient_colors.forEach(
              (_gradientColor: { color: string }, gradientColorIndex: number) => {
                if (
                  itemWithId.fill &&
                  typeof itemWithId.fill === 'object' &&
                  'colorStops' in itemWithId.fill &&
                  itemWithId.fill.colorStops?.[gradientColorIndex]
                ) {
                  const finalColor = getGroupColorBySvgGroup(itemId, gradientColorIndex)
                  itemWithId.fill.colorStops[gradientColorIndex].color = finalColor.color
                }
              }
            )
          } else {
            // Update first gradient color stop
            if (
              itemWithId.fill &&
              typeof itemWithId.fill === 'object' &&
              'colorStops' in itemWithId.fill &&
              itemWithId.fill.colorStops?.[0]
            ) {
              const finalColor = getGroupColorBySvgGroup(itemId)
              itemWithId.fill.colorStops[0].color = finalColor.color
            }
          }
          // Apply the updated gradient
          if (
            itemWithId.fill &&
            typeof itemWithId.fill === 'object' &&
            'gradientUnits' in itemWithId.fill
          ) {
            itemWithId.set(
              'fill',
              new Gradient(itemWithId.fill as unknown as ConstructorParameters<typeof Gradient>[0])
            )
          }
        } else if (itemWithId.fill && typeof itemWithId.fill === 'string') {
          // Handle solid fill
          const finalColor = getGroupColorBySvgGroup(
            itemId,
            groupColors[itemId].gradient_colors ? 0 : null
          )
          itemWithId.set('fill', finalColor.color)
        }
      } else {
        const defaultColors = customizationStore.customization?.default_colors || []
        const filteredDefaultColors = defaultColors.filter(
          (color: { color?: string | null }) => color.color
        )
        // If no default colors are not set, then reset to initial color
        if (filteredDefaultColors.length === 0) {
          // Reset to initial color
          const initialGroup = initialSvgGroups.value.find(
            (g: OutputSvgGroupColor) => g.id === itemId
          )
          if (initialGroup) {
            if (
              itemWithId.fill &&
              typeof itemWithId.fill === 'object' &&
              'gradientUnits' in itemWithId.fill &&
              itemWithId.fill.gradientUnits
            ) {
              // Reset gradient fill
              if (
                initialGroup.gradient_colors &&
                itemWithId.fill &&
                typeof itemWithId.fill === 'object' &&
                'colorStops' in itemWithId.fill
              ) {
                initialGroup.gradient_colors.forEach(
                  (gradientColor: { color: string }, gradientColorIndex: number) => {
                    if (
                      itemWithId.fill &&
                      typeof itemWithId.fill === 'object' &&
                      'colorStops' in itemWithId.fill &&
                      itemWithId.fill.colorStops?.[gradientColorIndex]
                    ) {
                      itemWithId.fill.colorStops[gradientColorIndex].color = gradientColor.color
                    }
                  }
                )
                itemWithId.set(
                  'fill',
                  new Gradient(
                    itemWithId.fill as unknown as ConstructorParameters<typeof Gradient>[0]
                  )
                )
              }
            } else if (itemWithId.fill && typeof itemWithId.fill === 'string') {
              // Reset solid fill
              itemWithId.set('fill', initialGroup.color)
            }
          }
        }
      }
    })

    // Apply color grouping if available
    if (colorGrouping?.value) {
      unHideColorGrouping(renderTime)
    } else {
      // Render canvas after a delay
      if (renderTime > 0) {
        setTimeout(() => {
          canvas.value?.requestRenderAll()
        }, renderTime)
      } else {
        canvas.value?.requestRenderAll()
      }
    }
  }

  /**
   * Reset colors to their original state from initialSvgGroups
   * @param renderTime - Optional render delay time
   */
  /**
   * Check if svgGroups and initialSvgGroups are the same
   */
  function areSvgGroupsSame(): boolean {
    if (svgGroups.value.length !== initialSvgGroups.value.length) return false

    for (let i = 0; i < svgGroups.value.length; i++) {
      const current = svgGroups.value[i] as OutputSvgGroupColor
      const initial = initialSvgGroups.value.find(g => g.id === current.id)

      if (!initial) return false

      // Compare solid colors
      if (current.color !== initial.color) return false

      // Compare gradient colors
      if (current.gradient_colors && initial.gradient_colors) {
        if (current.gradient_colors.length !== initial.gradient_colors.length) return false
        for (let j = 0; j < current.gradient_colors.length; j++) {
          if (current.gradient_colors[j]?.color !== initial.gradient_colors[j]?.color) return false
        }
      } else if (current.gradient_colors || initial.gradient_colors) {
        return false // One has gradient, other doesn't
      }
    }

    return true
  }

  function resetToInitialColors(renderTime = 0): void {
    if (!canvas.value || !designObject.value || initialSvgGroups.value.length === 0) return

    // Only reset if svgGroups and initialSvgGroups are different
    if (areSvgGroupsSame()) return

    // Create a map of initial SVG groups for quick lookup
    const defaultSvgGroups: Record<string, OutputSvgGroupColor> = {}
    initialSvgGroups.value.forEach(svgGroup => {
      defaultSvgGroups[svgGroup.id] = svgGroup
    })

    // Reset SVG groups to initial state
    svgGroups.value.forEach(svgGroup => {
      if (defaultSvgGroups[svgGroup.id]) {
        const initialGroup = defaultSvgGroups[svgGroup.id]
        // Simply assign all properties from initial group
        Object.assign(svgGroup, initialGroup)

        // Update store if mainPreview is enabled (only for front/back, not 3d)
        if (mainPreview && (side === 'front' || side === 'back')) {
          productsStore.setSvgGroups(svgGroups.value, side, false)
        }
      }
    })

    // Get design objects - handle both Group and single object
    const design: FabricObject[] = (designObject.value as Group & { _objects?: FabricObject[] })
      ._objects
      ? (designObject.value as Group)._objects || []
      : [designObject.value as FabricObject]

    // Reset design objects on canvas to initial colors
    design.forEach(item => {
      const itemWithId = item as FabricObject & {
        id?: string
        fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
      }

      if (!itemWithId.id) return

      const itemId = itemWithId.id.toLowerCase()
      const initialGroup = defaultSvgGroups[itemId]

      if (initialGroup) {
        if (
          itemWithId.fill &&
          typeof itemWithId.fill === 'object' &&
          'gradientUnits' in itemWithId.fill &&
          itemWithId.fill.gradientUnits &&
          initialGroup.gradient_colors
        ) {
          // Reset gradient fill
          itemWithId.fill.colorStops?.forEach(
            (gradient: { color: string }, gradientIndex: number) => {
              if (initialGroup.gradient_colors && initialGroup.gradient_colors[gradientIndex]) {
                gradient.color = initialGroup.gradient_colors[gradientIndex].color
              }
            }
          )
          itemWithId.set(
            'fill',
            new Gradient(itemWithId.fill as unknown as ConstructorParameters<typeof Gradient>[0])
          )
        } else if (itemWithId.fill && typeof itemWithId.fill === 'string' && initialGroup.color) {
          // Reset solid fill
          itemWithId.set('fill', initialGroup.color)
        }
      }
    })

    // Render canvas after a delay
    if (renderTime > 0) {
      setTimeout(() => {
        canvas.value?.requestRenderAll()
      }, renderTime)
    } else {
      canvas.value?.requestRenderAll()
    }
  }

  /**
   * Unhide color grouping - ensures parts that should be visually distinct have different colors
   * @param renderTime - Optional render delay time
   */
  function unHideColorGrouping(renderTime = 0): void {
    if (!canvas.value || !designObject.value || !colorGrouping?.value) return

    const grouping = colorGrouping.value

    for (const key in grouping) {
      const distinguishPart = svgGroups.value.filter(
        (svgGroup: OutputSvgGroupColor) => svgGroup.id === key.toLowerCase()
      )

      const keyArray = grouping[key]
      if (!keyArray) continue

      keyArray.forEach((comparePartId: string) => {
        const comparePart = svgGroups.value.filter(
          (svgGroup: OutputSvgGroupColor) => svgGroup.id === comparePartId.toLowerCase()
        )

        if (
          distinguishPart.length &&
          comparePart.length &&
          distinguishPart[0] &&
          comparePart[0] &&
          (distinguishPart[0].color === comparePart[0].color ||
            (distinguishPart[0].name &&
              comparePart[0].name &&
              distinguishPart[0].name === comparePart[0].name) ||
            (distinguishPart[0].pantone &&
              comparePart[0].pantone &&
              distinguishPart[0].pantone === comparePart[0].pantone))
        ) {
          // Colors match, need to change the distinguish part color
          let changeColor: { value: string; name: string; pantone: string } | null = null

          // Get product colors (namecolors)
          const product = effectiveProductId.value
            ? productsStore.getProductById(effectiveProductId.value)
            : productsStore.activeProductDetails

          const productColors = product?.namecolors || []

          // Find a different color from product colors
          for (const colorGroup of productColors) {
            const colors = colorGroup.json_data || []
            for (const color of colors) {
              if (color.value !== comparePart[0].color) {
                // Get pantone info for this color
                const pantoneProductId = effectiveProductId.value || 0
                const selectProductPantonesList = getSelectedProductPantones(
                  pantoneProductId,
                  key.toLowerCase()
                )
                const closestColor = getClosestColor(
                  color.value,
                  selectProductPantonesList,
                  getColorType(key.toLowerCase(), effectiveProductId.value)
                )
                changeColor = {
                  value: color.value || '',
                  name: color.name || '',
                  pantone: closestColor.pantone
                }
                break
              }
            }
            if (changeColor) break
          }

          // If no different color found, use closest color to black
          if (!changeColor) {
            const pantoneProductId = effectiveProductId.value || 0
            const selectProductPantonesList = getSelectedProductPantones(
              pantoneProductId,
              key.toLowerCase()
            )
            const closestColor = getClosestColor(
              '#000000',
              selectProductPantonesList,
              getColorType(key.toLowerCase(), effectiveProductId.value)
            )
            changeColor = {
              value: closestColor.hex,
              name: closestColor.name,
              pantone: closestColor.pantone
            }
          }

          if (!changeColor) return

          // Update design objects on canvas
          const design: FabricObject[] = (
            designObject.value as Group & {
              _objects?: FabricObject[]
            }
          )._objects
            ? (designObject.value as Group)._objects || []
            : [designObject.value as FabricObject]

          design.forEach(item => {
            const itemWithId = item as FabricObject & {
              id?: string
              fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
            }

            if (!itemWithId.id) return

            const itemId = itemWithId.id.toLowerCase()
            if (key.toLowerCase() === itemId && itemWithId.fill) {
              if (typeof itemWithId.fill === 'string') {
                itemWithId.set('fill', changeColor.value)
              }
            }
          })

          // Update SVG groups
          svgGroups.value.forEach(svgGroup => {
            if (svgGroup.id === key.toLowerCase()) {
              svgGroup.color = changeColor.value
              svgGroup.name = changeColor.name
              svgGroup.pantone = changeColor.pantone

              // Update store if mainPreview is enabled
              if (mainPreview) {
                // Update customization store group_colors so effectiveSvgGroups reflects the change
                // This ensures the UI updates when colors are changed by unHideColorGrouping
                customizationStore.setGroupColor(key.toLowerCase(), {
                  value: changeColor.value,
                  name: changeColor.name,
                  position: 0
                })
                productsStore.setSvgGroups(svgGroups.value, side, false)
              }
            }
          })
        }
      })
    }

    // Render canvas after a delay
    if (renderTime > 0) {
      setTimeout(() => {
        canvas.value?.requestRenderAll()
      }, renderTime)
    } else {
      canvas.value?.requestRenderAll()
    }
  }

  /**
   * Apply all customization types to the canvas
   * This method centralizes all customization application logic
   * @param renderTime - Optional render delay time
   */
  function applyCustomization(renderTime = 0): void {
    if (!applyCustomizationOverrides.value && !mainPreview) return

    const defaultColors = customizationStore.customization?.default_colors || []
    const hasDefaultColors =
      defaultColors.filter((color: { color?: string | null }) => color.color).length > 0

    const groupColors = customizationStore.customization?.group_colors || {}
    const hasGroupColors = Object.keys(groupColors).length > 0

    // Apply default colors customization
    if (hasDefaultColors) {
      if (applyCustomizationOverrides.value || mainPreview) {
        changeDefaultColors(renderTime)
      }
    } else {
      // Reset to initial colors if default colors are cleared
      if (applyCustomizationOverrides.value || mainPreview) {
        resetToInitialColors(renderTime)
      }
    }

    // Apply group colors customization
    if (hasGroupColors) {
      if (applyCustomizationOverrides.value || mainPreview) {
        changeGroupColors(renderTime)
      }
    } else {
      // Reset to initial colors if group colors are cleared
      // Only reset if default colors are also not set (to avoid double reset)
      if (!hasDefaultColors && (applyCustomizationOverrides.value || mainPreview)) {
        resetToInitialColors(renderTime)
      }
    }

    // TODO: Add more customization types here in the future
    // e.g., await applyPatterns(renderTime)
    // e.g., await applyTexts(renderTime)
    // e.g., await applyLogos(renderTime)
  }

  // ===== RETURN =====
  return {
    // Actions
    applyCustomization,
    changeDefaultColors,
    changeGroupColors,
    resetToInitialColors,
    unHideColorGrouping,
    // Utilities
    getGroupColorBySvgGroup,
    getDefaultColorBySvgGroup,
    findClosestColorIndex,
    getSvgGroupColors
  }
}
