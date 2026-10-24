/**
 * CAMPUS RUSH - Core Constants & Balancing
 */

export const COLORS = {
  // Atmospheric Skies
  skyCampus: 0x5EB4EF,
  skyCampusFog: 0x7EC4F8,
  skyLakefront: 0xFDBA74,
  skyLakefrontFog: 0xFED7AA,
  skyMarket: 0x7DD3FC,
  skyMarketFog: 0xBAE6FD,
  skyNeon: 0x0F172A,
  skyNeonFog: 0x1E1B4B,
  skyFestival: 0x2E1065,
  skyFestivalFog: 0x3B0764,

  // Palette Accents
  midnightNavy: 0x0F172A,
  deepIndigo: 0x1E293B,
  electricCyan: 0x38BDF8,
  vividViolet: 0x8B5CF6,
  warmSaffron: 0xFBBF24,
  coralAccent: 0xF43F5E,
  softWhite: 0xF8FAFC,

  // Road Infrastructure
  roadAsphalt: 0x333F52,    // High-contrast slate road
  roadMarking: 0xFFFFFF,    // Brilliant white dashed lines
  curbColor: 0xCBD5E1,      // Clean stone curb
  curbAccent: 0xF59E0B,     // Warm curb highlight

  // Scenery & Flora
  grassCampus: 0x22C55E,    // Lush spring campus lawn
  grassDark: 0x16A34A,
  treeLeaves: 0x15803D,
  treeLeavesBright: 0x4ADE80,
  treeLeavesAccent: 0xEA580C, // Flowering shade tree
  treeTrunk: 0x78350F,
  brickAcademic: 0xB45309,  // Rich campus brick
  brickTrim: 0xF8FAFC,      // Clean architectural trim
  neonPink: 0xF43F5E
};

export const LANES = [-3.2, 0, 3.2] as const;
export type LaneIndex = 0 | 1 | 2;

export const GAME_CONFIG = {
  // Movement & Physics
  initialSpeed: 24,           // Starting world speed (units / sec)
  maxSpeed: 54,               // Terminal speed cap
  speedAcceleration: 0.0035,  // Speed increase per meter
  laneSwitchSpeed: 16,        // Units/sec for lateral interpolation
  jumpVelocity: 16.5,         // Initial upward jump burst
  gravity: -54,               // Gravity pulling player down
  slideDuration: 0.65,        // Duration in seconds for slide state

  // Hitbox dimensions
  playerWidth: 0.9,
  playerHeight: 2.1,
  playerSlideHeight: 0.8,
  playerDepth: 0.8,

  // Signature Mechanic - FOCUS MODE
  sparksForFocus: 3,
  focusModeDuration: 5.5,
  focusModeMultiplier: 3,

  // Power-Ups
  shieldHitPoints: 1,
  magnetDuration: 10.0,
  magnetRadius: 15.0,
  sprintBoostDuration: 6.0,
  sprintBoostMultiplier: 1.6,

  // Zone Distance Thresholds (meters)
  zoneDistances: {
    campusMorning: 0,
    lakefront: 450,
    bhopalLakefront: 450, // Backwards compatible alias
    marketRush: 950,
    neonCodeCity: 1500,
    festivalNights: 2100
  }
};

export interface OutfitDefinition {
  id: string;
  name: string;
  cost: number;
  hoodieColor: number;
  pantsColor: number;
  accentColor: number;
  glowColor: number;
  description: string;
}

export const OUTFITS: OutfitDefinition[] = [
  {
    id: 'demo_day',
    name: 'Campus Sprint',
    cost: 0,
    hoodieColor: 0x2563EB,     // Vibrant athletic cobalt
    pantsColor: 0x1E293B,      // Charcoal athletic joggers
    accentColor: 0x38BDF8,     // Electric cyan runner stripes
    glowColor: 0x38BDF8,
    description: 'The signature campus athletic kit. Built for speed.'
  },
  {
    id: 'bhopal_lake',
    name: 'Lakefront Runner',
    cost: 100,
    hoodieColor: 0xF59E0B,     // Warm amber windbreaker
    pantsColor: 0x334155,
    accentColor: 0xF43F5E,
    glowColor: 0xF59E0B,
    description: 'Breezy lakeside windbreaker with sunset trim.'
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    cost: 250,
    hoodieColor: 0x0F172A,
    pantsColor: 0x020617,
    accentColor: 0x8B5CF6,
    glowColor: 0x38BDF8,
    description: 'High-contrast runner suit with illuminated circuit trim.'
  },
  {
    id: 'fest_kurta',
    name: 'Festival Spirit',
    cost: 500,
    hoodieColor: 0x0284C7,
    pantsColor: 0xF8FAFC,
    accentColor: 0xF59E0B,
    glowColor: 0xF59E0B,
    description: 'Festive campus celebratory attire.'
  }
];
