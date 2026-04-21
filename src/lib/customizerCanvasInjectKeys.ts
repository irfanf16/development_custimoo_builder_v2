import type { ComputedRef, InjectionKey } from 'vue'

/** Main 2D preview bitmap edge length (px), driven by Customizer canvas row width. */
export const CUSTOMIZER_MAIN_CANVAS_PX: InjectionKey<ComputedRef<number>> =
  Symbol('CUSTOMIZER_MAIN_CANVAS_PX')
