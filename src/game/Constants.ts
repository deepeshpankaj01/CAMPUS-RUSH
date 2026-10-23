/**
 * Campus Rush - Core Constants & Balancing
 */

export const COLORS = {
  midnightNavy: 0x0B1020,
  deepIndigo: 0x29245E,
  electricCyan: 0x41E5F5,
  vividViolet: 0x7865FF,
  warmSaffron: 0xFFB547,
  coralAccent: 0xFF5C7A,
  softWhite: 0xF4F6FC,
  roadAsphalt: 0x1A1F33,
  roadMarking: 0xFFFFFF,
  curbColor: 0x3A4466,
  grassCampus: 0x24553A,
  treeLeaves: 0x2B7A4B,
  treeTrunk: 0x5C3E25,
  brickAcademic: 0x9B422B,
  neonPink: 0xFF2A85
};

export const LANES = [-3.2, 0, 3.2] as const;
export type LaneIndex = 0 | 1 | 2;

export type ZoneType = 'CAMPUS_MORNING' | 'BHOPAL_LAKEFRONT' | 'MARKET_RUSH' | 'NEON_CODE_CITY' | 'FESTIVAL_NIGHTS';

export interface StageInfo {
  stage: number;
  name: string;
  zone: ZoneType;
}

export const ZONE_SEQUENCE: { zone: ZoneType; name: string }[] = [
  { zone: 'CAMPUS_MORNING', name: 'Campus Morning' },
  { zone: 'BHOPAL_LAKEFRONT', name: 'Bhopal Lakefront' },
  { zone: 'MARKET_RUSH', name: 'Market Rush' },
  { zone: 'NEON_CODE_CITY', name: 'Neon City' },
  { zone: 'FESTIVAL_NIGHTS', name: 'Festival Nights' }
];

export function getStageInfo(totalDistanceMeters: number): StageInfo {
  const stageDistances = [0, 450, 950, 1500, 2100];
  let stage = 1;

  if (totalDistanceMeters < stageDistances[1]) {
    stage = 1;
  } else if (totalDistanceMeters < stageDistances[2]) {
    stage = 2;
  } else if (totalDistanceMeters < stageDistances[3]) {
    stage = 3;
  } else if (totalDistanceMeters < stageDistances[4]) {
    stage = 4;
  } else if (totalDistanceMeters < 2700) {
    stage = 5;
  } else {
    // Endless progression beyond 2700m (each 550m adds a stage)
    const extra = totalDistanceMeters - 2700;
    stage = 5 + Math.floor(extra / 550) + 1;
  }

  const seqIndex = (stage - 1) % ZONE_SEQUENCE.length;
  const { zone, name } = ZONE_SEQUENCE[seqIndex];

  return {
    stage,
    name,
    zone
  };
}

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
    bhopalLakefront: 450,
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
    name: 'Demo Day Hustle',
    cost: 0,
    hoodieColor: 0x29245E,
    pantsColor: 0x0B1020,
    accentColor: 0x41E5F5,
    glowColor: 0x41E5F5,
    description: 'The official campus tech hoodie. Ready to pitch.'
  },
  {
    id: 'bhopal_lake',
    name: 'Bhopal Lakefront Casual',
    cost: 100,
    hoodieColor: 0xFFB547,
    pantsColor: 0x2A324B,
    accentColor: 0xFF5C7A,
    glowColor: 0xFFB547,
    description: 'Chilled VIP road sunset vibes with saffron jacket.'
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Hacker Neon',
    cost: 250,
    hoodieColor: 0x11162B,
    pantsColor: 0x0A0D1A,
    accentColor: 0x7865FF,
    glowColor: 0x41E5F5,
    description: 'Emissive cyber matrix runner with glowing circuits.'
  },
  {
    id: 'fest_kurta',
    name: 'Campus Fest Fusion',
    cost: 500,
    hoodieColor: 0x1E3A8A,
    pantsColor: 0xF4F6FC,
    accentColor: 0xFFB547,
    glowColor: 0xFFB547,
    description: 'Royal festive attire for winning the tech showcase!'
  }
];
