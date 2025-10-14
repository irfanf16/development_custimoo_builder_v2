import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as ColorSelector } from './ColorSelector.vue'

export const colorSelectorVariants = cva(
  'relative rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-ring',
  {
    variants: {
      size: {
        default: 'h-[2.875rem] w-[2.875rem]',
        sm: 'h-[1.875rem] w-[1.875rem]'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
)

export type ColorSelectorVariants = VariantProps<typeof colorSelectorVariants>
