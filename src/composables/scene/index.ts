/**
 * Scene-related composables
 * Shared functionality for TwoDScene and ThreeDScene components
 */
export { useSceneCommon } from './useSceneCommon'
export type { DesignData, LoadDesignOptions } from './useSceneCommon'
export { useStorage } from './useStorage'
export { useSvgGroups } from './useSvgGroups'
export { useColorCustomization } from './useColorCustomization'
export type { SvgGroupColorsContainer } from './useColorCustomization'
export { useColorGrouping } from './useColorGrouping'
export {
  useLogos,
  addLogoToCanvas,
  deleteLogoFromCanvas,
  resetLogosFromCanvas,
  syncLogosOnCanvas,
  getLogoSignature,
  getLogoSignatureUrlSide
} from './useLogos'
export type { AddLogoOptions, LogoPositionOptions, SyncLogosOptions } from './useLogos'
export {
  useFabricControls,
  setupFabricControls,
  FABRIC_CONTROL_VISIBILITY
} from './useFabricControls'
export {
  useTexts,
  getTextObjectKey,
  getTextSignature,
  getTextSignatureValuePlacement,
  isTextItemVisible,
  addTextToCanvas,
  syncTextsOnCanvas
} from './useTexts'
export type {
  AddTextOptions,
  CreateTextAsPathParams,
  SyncTextsOptions,
  TextEntryWithItemsForSide,
  UpdateTextPositionOptions
} from './useTexts'
export { createTextAsPathFromFonts } from './useTextAsPath'
export type { ProductsFonts, OpentypeFont } from './useTextAsPath'
export { getDimensionDisplayStrings, useDimensionDisplayComputed } from './useDimensionDisplay'
export type {
  GetDimensionDisplayOptions,
  DimensionDisplayCustomization,
  UseDimensionDisplayComputedOptions
} from './useDimensionDisplay'
