import type { InjectionKey } from 'vue'

/** `WorkflowLayout` + `CustomizerMenuMobile` are inside `MobileBodyDockShell` (teleported to `body`). */
export const CUSTIMOO_BODY_MOBILE_DOCK: InjectionKey<boolean> = Symbol('custimooBodyMobileDock')
