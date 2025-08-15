// src/icons/flex-duo-categories.ts (now includes all flex-duo icons)
import Ball from 'virtual:icons/flex-duo/ball--streamline-flex'
import Baseball from 'virtual:icons/flex-duo/baseball--streamline-flex'
import BicycleBike from 'virtual:icons/flex-duo/bicycle-bike--streamline-flex'
import Cricket from 'virtual:icons/flex-duo/cricket--streamline-flex'
import Cycling from 'virtual:icons/flex-duo/cycling--streamline-flex'
import DownhillSkiing from 'virtual:icons/flex-duo/downhill-skiing--streamline-flex'
import DribbleLogo from 'virtual:icons/flex-duo/dribble-logo--streamline-flex'
import FishingPhishing from 'virtual:icons/flex-duo/fishing-phishing--streamline-flex'
import FlagScore from 'virtual:icons/flex-duo/flag-score--streamline-flex'
import Football from 'virtual:icons/flex-duo/football--streamline-flex'
import Golf from 'virtual:icons/flex-duo/golf--streamline-flex'
import Gymnastics from 'virtual:icons/flex-duo/gymnastics--streamline-flex'
import Hiking from 'virtual:icons/flex-duo/hiking--streamline-flex'
import Hockey from 'virtual:icons/flex-duo/hockey--streamline-flex'
import IceSkating from 'virtual:icons/flex-duo/ice-skating--streamline-flex'
import Kayaking from 'virtual:icons/flex-duo/kayaking--streamline-flex'
import MartialArts from 'virtual:icons/flex-duo/martial-arts--streamline-flex'
import Meditation from 'virtual:icons/flex-duo/meditation--streamline-flex'
import MotorsportsHelmet from 'virtual:icons/flex-duo/motorsports-helmet--streamline-flex'
import NordicWalking from 'virtual:icons/flex-duo/nordic-walking--streamline-flex'
import PaintPalette from 'virtual:icons/flex-duo/paint-palette--streamline-flex'
import Playground from 'virtual:icons/flex-duo/playground--streamline-flex'
import RollerSkating from 'virtual:icons/flex-duo/roller-skating--streamline-flex'
import Running from 'virtual:icons/flex-duo/running--streamline-flex'
import ScubaDiving from 'virtual:icons/flex-duo/scuba-diving--streamline-flex'
import Shirt from 'virtual:icons/flex-duo/shirt--streamline-flex'
import Shorts from 'virtual:icons/flex-duo/shorts--streamline-flex'
import Skateboarding from 'virtual:icons/flex-duo/skateboarding--streamline-flex'
import Sledding from 'virtual:icons/flex-duo/sledding--streamline-flex'
import Snowboarding from 'virtual:icons/flex-duo/snowboarding--streamline-flex'
import Soccer from 'virtual:icons/flex-duo/soccer--streamline-flex'
import Sock from 'virtual:icons/flex-duo/sock--streamline-flex'
import Sprint from 'virtual:icons/flex-duo/sprint--streamline-flex'
import Stadium from 'virtual:icons/flex-duo/stadium--streamline-flex'
import Surfing from 'virtual:icons/flex-duo/surfing--streamline-flex'
import Swimming from 'virtual:icons/flex-duo/swimming--streamline-flex'
import Tennis from 'virtual:icons/flex-duo/tennis--streamline-flex'
import Volleyball from 'virtual:icons/flex-duo/volleyball--streamline-flex'
import WalkingSteps from 'virtual:icons/flex-duo/walking-steps--streamline-flex'
import Whistle from 'virtual:icons/flex-duo/whistle--streamline-flex'

export const flexDuoCategoryIcons = {
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
  Whistle
}

// Keep a reference so tree-shaking can't drop them
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__FLEX_DUO_CATEGORIES__ = flexDuoCategoryIcons
}
