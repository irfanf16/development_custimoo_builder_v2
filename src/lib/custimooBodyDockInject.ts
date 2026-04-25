import type { InjectionKey } from 'vue'

/** `WorkflowLayout` + `CustomizerMenuMobile` are inside `MobileBodyDockShell` (teleported to widget root, see `useTeleportTo`). */
export const CUSTIMOO_BODY_MOBILE_DOCK: InjectionKey<boolean> = Symbol('custimooBodyMobileDock')
