import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'

/**
 * Temporary mapping: cycle through Flex Duo icons until API provides icon per category
 * This is shared between CategorySelection and SubcategorySelection components
 */

export const FALLBACK_FLEX_DUO_ICONS = {
  AddressIcon: flexFlatCategoryIcons.AddressIcon,
  BackpackIcon: flexFlatCategoryIcons.Backpack,
  BallIcon: flexFlatCategoryIcons.Ball,
  BaseballIcon: flexFlatCategoryIcons.Baseball,
  BicycleBikeIcon: flexFlatCategoryIcons.BicycleBike,
  BootsIcon: flexFlatCategoryIcons.Boots,
  BrightnessIcon: flexFlatCategoryIcons.Brightness,
  CapFrontIcon: flexFlatCategoryIcons.CapFront,
  CapSideIcon: flexFlatCategoryIcons.CapSide,
  CricketIcon: flexFlatCategoryIcons.Cricket,
  CyclingIcon: flexFlatCategoryIcons.Cycling,
  DownhillSkiingIcon: flexFlatCategoryIcons.DownhillSkiing,
  DribbleLogoIcon: flexFlatCategoryIcons.DribbleLogo,
  FishingPhishingIcon: flexFlatCategoryIcons.FishingPhishing,
  FlagScoreIcon: flexFlatCategoryIcons.FlagScore,
  FootballIcon: flexFlatCategoryIcons.Football,
  GolfIcon: flexFlatCategoryIcons.Golf,
  GymnasticsIcon: flexFlatCategoryIcons.Gymnastics,
  HangerIcon: flexFlatCategoryIcons.Hanger,
  HikingIcon: flexFlatCategoryIcons.Hiking,
  HockeyIcon: flexFlatCategoryIcons.Hockey,
  HolidayVacationBeachUmbrellaIcon: flexFlatCategoryIcons.HolidayVacationBeachUmbrella,
  IceSkatingIcon: flexFlatCategoryIcons.IceSkating,
  KayakingIcon: flexFlatCategoryIcons.Kayaking,
  LeafIcon: flexFlatCategoryIcons.Leaf,
  MartialArtsIcon: flexFlatCategoryIcons.MartialArts,
  MeditationIcon: flexFlatCategoryIcons.Meditation,
  ModuleThreeIcon: flexFlatCategoryIcons.ModuleThree,
  MotorsportsHelmetIcon: flexFlatCategoryIcons.MotorsportsHelmet,
  NordicWalkingIcon: flexFlatCategoryIcons.NordicWalking,
  NotificationIcon: flexFlatCategoryIcons.NotificationIcon,
  OrdersIcon: flexFlatCategoryIcons.OrdersIcon,
  PaintPaletteIcon: flexFlatCategoryIcons.PaintPalette,
  PlaygroundIcon: flexFlatCategoryIcons.Playground,
  PottedFlowerTulipIcon: flexFlatCategoryIcons.PottedFlowerTulip,
  RollerSkatingIcon: flexFlatCategoryIcons.RollerSkating,
  RunningIcon: flexFlatCategoryIcons.Running,
  ScubaDivingIcon: flexFlatCategoryIcons.ScubaDiving,
  SettingsIcon: flexFlatCategoryIcons.SettingsIcon,
  ShirtIcon: flexFlatCategoryIcons.Shirt,
  ShoppingBagHandBagIcon: flexFlatCategoryIcons.ShoppingBagHandBag,
  ShortsIcon: flexFlatCategoryIcons.Shorts,
  SkateboardingIcon: flexFlatCategoryIcons.Skateboarding,
  SleddingIcon: flexFlatCategoryIcons.Sledding,
  SnowFlakeIcon: flexFlatCategoryIcons.SnowFlake,
  SnowboardingIcon: flexFlatCategoryIcons.Snowboarding,
  SoccerIcon: flexFlatCategoryIcons.Soccer,
  SockIcon: flexFlatCategoryIcons.Sock,
  SprintIcon: flexFlatCategoryIcons.Sprint,
  StadiumIcon: flexFlatCategoryIcons.Stadium,
  SurfingIcon: flexFlatCategoryIcons.Surfing,
  SwimmingIcon: flexFlatCategoryIcons.Swimming,
  TennisIcon: flexFlatCategoryIcons.Tennis,
  UserCircleIcon: flexFlatCategoryIcons.UserCircle,
  VolleyballIcon: flexFlatCategoryIcons.Volleyball,
  WalkingStepsIcon: flexFlatCategoryIcons.WalkingSteps,
  WhistleIcon: flexFlatCategoryIcons.Whistle
} as const

/**
 * Type for icon keys
 */
export type CategoryIconKey = keyof typeof FALLBACK_FLEX_DUO_ICONS

/**
 * Array of icon keys for cycling through icons
 */
export const FALLBACK_ICON_KEYS = Object.keys(FALLBACK_FLEX_DUO_ICONS) as CategoryIconKey[]

/**
 * Get a category icon by key (string)
 * If the key is invalid or null, falls back to the first icon
 */
export function getCategoryIcon(
  key: string | null | undefined
): (typeof FALLBACK_FLEX_DUO_ICONS)[CategoryIconKey] {
  if (!key) {
    return FALLBACK_FLEX_DUO_ICONS[FALLBACK_ICON_KEYS[0]!]
  }

  const validKey = key as CategoryIconKey
  if (validKey in FALLBACK_FLEX_DUO_ICONS) {
    return FALLBACK_FLEX_DUO_ICONS[validKey]
  }

  // Fallback to first icon if key is invalid
  return FALLBACK_FLEX_DUO_ICONS[FALLBACK_ICON_KEYS[0]!]
}
