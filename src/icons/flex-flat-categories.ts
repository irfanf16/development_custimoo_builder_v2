// src/icons/flex-flat-categories.ts (now includes all flex-flat icons)
import Ball from 'virtual:icons/flex-flat/ball'
import Baseball from 'virtual:icons/flex-flat/baseball'
import BicycleBike from 'virtual:icons/flex-flat/bicycle-bike'
import Cricket from 'virtual:icons/flex-flat/cricket'
import Cycling from 'virtual:icons/flex-flat/cycling'
import DownhillSkiing from 'virtual:icons/flex-flat/downhill-skiing'
import DribbleLogo from 'virtual:icons/flex-flat/dribble-logo'
import FishingPhishing from 'virtual:icons/flex-flat/fishing-phishing'
import FlagScore from 'virtual:icons/flex-flat/flag-score'
import Football from 'virtual:icons/flex-flat/football'
import Golf from 'virtual:icons/flex-flat/golf'
import Gymnastics from 'virtual:icons/flex-flat/gymnastics'
import Hiking from 'virtual:icons/flex-flat/hiking'
import Hockey from 'virtual:icons/flex-flat/hockey'
import IceSkating from 'virtual:icons/flex-flat/ice-skating'
import Kayaking from 'virtual:icons/flex-flat/kayaking'
import MartialArts from 'virtual:icons/flex-flat/martial-arts'
import Meditation from 'virtual:icons/flex-flat/meditation'
import MotorsportsHelmet from 'virtual:icons/flex-flat/motorsports-helmet'
import NordicWalking from 'virtual:icons/flex-flat/nordic-walking'
import PaintPalette from 'virtual:icons/flex-flat/paint-palette'
import Playground from 'virtual:icons/flex-flat/playground'
import RollerSkating from 'virtual:icons/flex-flat/roller-skating'
import Running from 'virtual:icons/flex-flat/running'
import ScubaDiving from 'virtual:icons/flex-flat/scuba-diving'
import Shirt from 'virtual:icons/flex-flat/shirt'
import Shorts from 'virtual:icons/flex-flat/shorts'
import Skateboarding from 'virtual:icons/flex-flat/skateboarding'
import Sledding from 'virtual:icons/flex-flat/sledding'
import Snowboarding from 'virtual:icons/flex-flat/snowboarding'
import Soccer from 'virtual:icons/flex-flat/soccer'
import Sock from 'virtual:icons/flex-flat/sock'
import Sprint from 'virtual:icons/flex-flat/sprint'
import Stadium from 'virtual:icons/flex-flat/stadium'
import Surfing from 'virtual:icons/flex-flat/surfing'
import Swimming from 'virtual:icons/flex-flat/swimming'
import Tennis from 'virtual:icons/flex-flat/tennis'
import Volleyball from 'virtual:icons/flex-flat/volleyball'
import WalkingSteps from 'virtual:icons/flex-flat/walking-steps'
import Whistle from 'virtual:icons/flex-flat/whistle'
import Hanger from 'virtual:icons/flex-flat/hanger'
import Backpack from 'virtual:icons/flex-flat/backpack'
import ShoppingBagHandBag from 'virtual:icons/flex-flat/shopping-bag-hand-bag'
import ModuleThree from 'virtual:icons/flex-flat/module-three'
import Boots from 'virtual:icons/flex-flat/boots'
import CapFront from 'virtual:icons/flex-flat/cap-front'
import CapSide from 'virtual:icons/flex-flat/cap-side'
import Brightness from 'virtual:icons/flex-flat/brightness'
import PottedFlowerTulip from 'virtual:icons/flex-flat/potted-flower-tulip'
import Leaf from 'virtual:icons/flex-flat/leaf'
import SnowFlake from 'virtual:icons/flex-flat/snow-flake'
import HolidayVacationBeachUmbrella from 'virtual:icons/flex-flat/holiday-vacation-beach-umbrella'
import UserIcon from 'virtual:icons/flex-flat/user-circle'
import SettingsIcon from 'virtual:icons/flex-flat/settings-icon'
import OrderIcon from 'virtual:icons/flex-flat/orders-icon'
import AddressIcon from 'virtual:icons/flex-flat/address-book-icon'
import NotificationIcon from 'virtual:icons/flex-flat/notification-icon'
import OrdersIcon from 'virtual:icons/flex-flat/orders-icon'
import UserCircle from 'virtual:icons/flex-flat/user-circle'
import UploadImagePlaceholder from 'virtual:icons/flex-flat/upload-image-placeholder'
export const flexFlatCategoryIcons = {
  Ball,
  Baseball,
  BicycleBike,
  Cricket,
  Cycling,
  DownhillSkiing,
  DribbleLogo,
  FishingPhishing,
  FlagScore,
  Football,
  Golf,
  Gymnastics,
  Hiking,
  Hockey,
  IceSkating,
  Kayaking,
  MartialArts,
  Meditation,
  MotorsportsHelmet,
  NordicWalking,
  PaintPalette,
  Playground,
  RollerSkating,
  Running,
  ScubaDiving,
  Shirt,
  Shorts,
  Skateboarding,
  Sledding,
  Snowboarding,
  Soccer,
  Sock,
  Sprint,
  Stadium,
  Surfing,
  Swimming,
  Tennis,
  Volleyball,
  WalkingSteps,
  Whistle,
  Hanger,
  Backpack,
  ShoppingBagHandBag,
  ModuleThree,
  Boots,
  CapFront,
  CapSide,
  Brightness,
  PottedFlowerTulip,
  Leaf,
  SnowFlake,
  HolidayVacationBeachUmbrella,
  UserIcon,
  SettingsIcon,
  OrderIcon,
  AddressIcon,
  NotificationIcon,
  OrdersIcon,
  UserCircle,
  UploadImagePlaceholder
}

// Keep a reference so tree-shaking can't drop them
if (typeof window !== 'undefined') {
  // Keep a reference on window for runtime access, without suppressing type checks
  ;(
    window as unknown as { __FLEX_FLAT_CATEGORIES__?: Record<string, unknown> }
  ).__FLEX_FLAT_CATEGORIES__ = flexFlatCategoryIcons as Record<string, unknown>
}
