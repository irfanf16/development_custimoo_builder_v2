import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Dialog } from './Dialog.vue'
export { default as DialogClose } from './DialogClose.vue'
export { default as DialogContent } from './DialogContent.vue'
export { default as DialogDescription } from './DialogDescription.vue'
export { default as DialogFooter } from './DialogFooter.vue'
export { default as DialogHeader } from './DialogHeader.vue'
export { default as DialogScrollContent } from './DialogScrollContent.vue'
export { default as DialogTitle } from './DialogTitle.vue'
export { default as DialogTrigger } from './DialogTrigger.vue'

const MOBILE_CONTENT_CLASSES = [
  // mobile-first layout (defaults)
  'inset-x-0 bottom-0 top-auto',
  'translate-x-0 translate-y-0',
  'transform-none',
  'rounded-t-2xl rounded-b-none',
  'shadow-none border-0'
].join(' ')

export const dialogContentVariants = cva(
  'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-[425px]',
  {
    variants: {
      variant: {
        default: '',
        large: `${MOBILE_CONTENT_CLASSES} max-w-none w-full h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] md:h-[760px] md:w-[1192px] md:max-w-full md:max-h-full md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:transform md:rounded-lg md:shadow-lg md:border`
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export type DialogContentVariants = VariantProps<typeof dialogContentVariants>
