import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Bed,
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  Code,
  Coffee,
  Dumbbell,
  Droplets,
  Flame,
  Footprints,
  Heart,
  Home,
  ListTodo,
  Moon,
  Music,
  PenLine,
  ShoppingCart,
  Sparkles,
  Sun,
  Target,
  Trees,
  Trophy,
  Waves,
} from "lucide-react";

export const TRACKING_ICON_MAP = {
  Brain,
  BookOpen,
  Dumbbell,
  Droplets,
  Sparkles,
  Sun,
  Moon,
  Heart,
  Coffee,
  Music,
  Bike,
  Footprints,
  Apple,
  PenLine,
  Code,
  Briefcase,
  Home,
  ShoppingCart,
  Bed,
  Trees,
  Waves,
  ListTodo,
  Flame,
  Target,
  Trophy,
} as const satisfies Record<string, LucideIcon>;

export type TrackingIconName = keyof typeof TRACKING_ICON_MAP;

export const TRACKING_ICON_NAMES = Object.keys(
  TRACKING_ICON_MAP,
) as TrackingIconName[];

const DEFAULT_ICON: TrackingIconName = "Sparkles";

export function getTrackingIcon(name: string): LucideIcon {
  return TRACKING_ICON_MAP[name as TrackingIconName] ?? TRACKING_ICON_MAP[DEFAULT_ICON];
}

export function isTrackingIconName(name: string): name is TrackingIconName {
  return name in TRACKING_ICON_MAP;
}

export function normalizeIconName(name: string | undefined): TrackingIconName {
  if (name && isTrackingIconName(name)) return name;
  return DEFAULT_ICON;
}
