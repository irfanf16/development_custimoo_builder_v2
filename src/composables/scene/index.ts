/**
 * Scene-related composables
 * Shared functionality for TwoDScene and ThreeDScene components
 */
export { useSceneCommon } from './useSceneCommon'
export type { DesignData, LoadDesignOptions } from './useSceneCommon'
export { useStorage } from './useStorage'
export { useSvgGroups } from './useSvgGroups'
export { useColorCustomization } from './useColorCustomization'
export { useColorGrouping } from './useColorGrouping'
export {
  useLogos,
  addLogoToCanvas,
  deleteLogoFromCanvas,
  resetLogosFromCanvas,
  syncLogosOnCanvas,
  getLogoSignature,
  getLogoSignatureUrlSide,
  suppressCustomLogosWatch
} from './useLogos'
export type { AddLogoOptions, LogoPositionOptions, SyncLogosOptions } from './useLogos'
export {
  useFabricControls,
  setupFabricControls,
  FABRIC_CONTROL_VISIBILITY
} from './useFabricControls'
