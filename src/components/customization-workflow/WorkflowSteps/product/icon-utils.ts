import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'

/**
 * Temporary mapping: cycle through Flex Duo icons until API provides icon per category
 * This is shared between CategorySelection and SubcategorySelection components
 */
export const FALLBACK_FLEX_DUO_ICONS = [
  flexFlatCategoryIcons.Shorts,
  flexFlatCategoryIcons.Hockey,
  flexFlatCategoryIcons.Baseball,
  flexFlatCategoryIcons.Soccer,
  flexFlatCategoryIcons.Football,
  flexFlatCategoryIcons.Brightness,
  flexFlatCategoryIcons.PottedFlowerTulip,
  flexFlatCategoryIcons.Leaf,
  flexFlatCategoryIcons.SnowFlake,
  flexFlatCategoryIcons.HolidayVacationBeachUmbrella,
  flexFlatCategoryIcons.Hanger,
  flexFlatCategoryIcons.Backpack,
  flexFlatCategoryIcons.ShoppingBagHandBag,
  flexFlatCategoryIcons.ModuleThree,
  flexFlatCategoryIcons.Boots,
  flexFlatCategoryIcons.CapFrozen,
  flexFlatCategoryIcons.CapSide,
  flexFlatCategoryIcons.Cricket,
  flexFlatCategoryIcons.Tennis,
  flexFlatCategoryIcons.Volleyball,
  flexFlatCategoryIcons.Cycling,
  flexFlatCategoryIcons.BicycleBike,
  flexFlatCategoryIcons.Running,
  flexFlatCategoryIcons.Swimming,
  flexFlatCategoryIcons.Hiking,
  flexFlatCategoryIcons.Skateboarding,
  flexFlatCategoryIcons.Snowboarding,
  flexFlatCategoryIcons.Surfing,
  flexFlatCategoryIcons.Kayaking,
  flexFlatCategoryIcons.RollerSkating,
  flexFlatCategoryIcons.Golf,
  flexFlatCategoryIcons.Playground,
  flexFlatCategoryIcons.Stadium,
  flexFlatCategoryIcons.Whistle,
  flexFlatCategoryIcons.Shirt,
  flexFlatCategoryIcons.Sock,
  flexFlatCategoryIcons.Meditation,
  flexFlatCategoryIcons.MartialArts,
  flexFlatCategoryIcons.MotorsportsHelmet,
  flexFlatCategoryIcons.FlagScore,
  flexFlatCategoryIcons.WalkingSteps,
  flexFlatCategoryIcons.ScubaDiving
] as const

/**
 * Get a category icon by index, cycling through available icons
 */
export function getCategoryIcon(index: number) {
  return FALLBACK_FLEX_DUO_ICONS[index % FALLBACK_FLEX_DUO_ICONS.length]
}
