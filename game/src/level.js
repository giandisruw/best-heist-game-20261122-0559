// The Velvet Vault — the three floors of the Marlow Gallery.
// Each floor is one room the thief crosses: walls and display cases that
// block movement and sight, patrol routes for the guards, cameras on the
// walls, loot to grab, and the green exit door that ends the floor.
//
// Coordinates are in the 1280x720 view; the top 64 pixels are the HUD bar,
// so every floor starts at y = 64.

import { VIEW_W, VIEW_H, HUD_H } from './config.js';

const TOP = HUD_H;
const BOTTOM = VIEW_H - 12;
const LEFT = 12;
const RIGHT = VIEW_W - 12;

// The gallery's outer walls, with a gap left open at each exit door.
function borderWalls(exit) {
  const walls = [
    { x: 0, y: TOP - 12, w: VIEW_W, h: 12 }, // top
    { x: 0, y: BOTTOM, w: VIEW_W, h: 12 }, // bottom
    { x: 0, y: TOP, w: 12, h: BOTTOM - TOP }, // left
    { x: RIGHT, y: TOP, w: 12, h: BOTTOM - TOP }, // right
  ];
  if (exit) {
    // Cut the top wall open where the exit door sits.
    walls[0] = { x: 0, y: TOP - 12, w: exit.x - 8, h: 12 };
    walls.push({ x: exit.x + exit.w + 8, y: TOP - 12, w: VIEW_W - (exit.x + exit.w + 8), h: 12 });
  }
  return walls;
}

export const FLOORS = [
  {
    name: 'Floor 1 — The Marble Hall',
    briefing: 'Lift the hall loot and slip out the green door. Two guards walk the floor; one camera watches the middle.',
    playerStart: { x: 110, y: 640 },
    exit: { x: 1140, y: TOP, w: 84, h: 26 },
    lootGoal: 450,
    walls: [
      // A low partition wall in the middle, with a doorway on each side.
      { x: 560, y: 300, w: 14, h: 190 },
      { x: 560, y: 300, w: 160, h: 14 },
      { x: 560, y: 476, w: 160, h: 14 },
    ],
    cases: [
      { x: 300, y: 180, w: 150, h: 60 },
      { x: 820, y: 170, w: 150, h: 60 },
      { x: 300, y: 520, w: 150, h: 60 },
      { x: 830, y: 520, w: 150, h: 60 },
    ],
    rugs: [
      { x: 180, y: 330, w: 260, h: 130 },
      { x: 840, y: 330, w: 260, h: 130 },
    ],
    loot: [
      { kind: 'coin', x: 375, y: 150, value: 150 },
      { kind: 'coin', x: 895, y: 140, value: 150 },
      { kind: 'vase', x: 640, y: 395, value: 300 },
      { kind: 'coin', x: 640, y: 620, value: 150 },
    ],
    guardDefs: [
      { route: [{ x: 240, y: 420 }, { x: 240, y: 150 }, { x: 480, y: 150 }, { x: 480, y: 420 }], pause: 1.2 },
      { route: [{ x: 1040, y: 150 }, { x: 1040, y: 420 }, { x: 780, y: 420 }, { x: 780, y: 150 }], pause: 1.2 },
    ],
    cameraDefs: [
      { x: 640, y: TOP + 4, baseAngle: Math.PI / 2, sweep: 0.9, phase: 0 },
    ],
    paintings: [
      { x: 150, y: TOP + 6, w: 70, h: 46, hue: 210 },
      { x: 950, y: TOP + 6, w: 70, h: 46, hue: 30 },
      { x: 60, y: 300, w: 46, h: 70, hue: 150 },
    ],
  },
  {
    name: 'Floor 2 — The Portrait Wing',
    briefing: 'The Star of Marlow hangs in the middle case — crack it (stand still) and get out. Three guards, two cameras.',
    playerStart: { x: 110, y: 640 },
    exit: { x: 1140, y: TOP, w: 84, h: 26 },
    lootGoal: 1500,
    walls: [
      { x: 380, y: 200, w: 14, h: 240 },
      { x: 380, y: 200, w: 220, h: 14 },
      { x: 900, y: 300, w: 14, h: 240 },
      { x: 700, y: 526, w: 200, h: 14 },
      { x: 700, y: 300, w: 14, h: 120 },
    ],
    cases: [
      { x: 560, y: 330, w: 160, h: 90 },
      { x: 180, y: 180, w: 140, h: 56 },
      { x: 980, y: 180, w: 140, h: 56 },
      { x: 180, y: 560, w: 140, h: 56 },
      { x: 980, y: 560, w: 140, h: 56 },
    ],
    rugs: [
      { x: 480, y: 130, w: 320, h: 120 },
      { x: 480, y: 560, w: 320, h: 120 },
    ],
    loot: [
      { kind: 'coin', x: 250, y: 150, value: 150 },
      { kind: 'coin', x: 1050, y: 150, value: 150 },
      { kind: 'vase', x: 250, y: 640, value: 300 },
      { kind: 'coin', x: 1050, y: 640, value: 150 },
      { kind: 'star', x: 640, y: 375, value: 1500 },
    ],
    guardDefs: [
      { route: [{ x: 320, y: 470 }, { x: 320, y: 130 }, { x: 540, y: 130 }], pause: 1.0 },
      { route: [{ x: 960, y: 130 }, { x: 960, y: 470 }, { x: 740, y: 470 }], pause: 1.0 },
      { route: [{ x: 640, y: 620 }, { x: 640, y: 500 }, { x: 880, y: 620 }, { x: 400, y: 620 }], pause: 0.8 },
    ],
    cameraDefs: [
      { x: 300, y: TOP + 4, baseAngle: Math.PI / 2, sweep: 1.0, phase: 0 },
      { x: 980, y: TOP + 4, baseAngle: Math.PI / 2, sweep: 1.0, phase: Math.PI },
    ],
    paintings: [
      { x: 120, y: TOP + 6, w: 64, h: 80, hue: 280 },
      { x: 640, y: TOP + 6, w: 64, h: 80, hue: 45 },
      { x: 1120, y: TOP + 6, w: 64, h: 80, hue: 200 },
      { x: 60, y: 420, w: 46, h: 70, hue: 0 },
    ],
  },
  {
    name: 'Floor 3 — The Vault',
    briefing: 'The vault safe holds the night’s fortune — crack it under the cameras and vanish. The alarm bites fast here.',
    playerStart: { x: 110, y: 640 },
    exit: { x: 1140, y: TOP, w: 84, h: 26 },
    lootGoal: 2000,
    walls: [
      { x: 300, y: 200, w: 14, h: 300 },
      { x: 300, y: 200, w: 260, h: 14 },
      { x: 980, y: 200, w: 14, h: 300 },
      { x: 720, y: 486, w: 260, h: 14 },
      { x: 560, y: 380, w: 160, h: 14 },
      { x: 560, y: 380, w: 14, h: 130 },
    ],
    cases: [
      { x: 620, y: 250, w: 180, h: 90 },
      { x: 120, y: 180, w: 130, h: 56 },
      { x: 1030, y: 180, w: 130, h: 56 },
      { x: 120, y: 560, w: 130, h: 56 },
      { x: 1030, y: 560, w: 130, h: 56 },
    ],
    rugs: [
      { x: 480, y: 430, w: 320, h: 110 },
    ],
    loot: [
      { kind: 'coin', x: 185, y: 150, value: 150 },
      { kind: 'coin', x: 1095, y: 150, value: 150 },
      { kind: 'vase', x: 185, y: 640, value: 300 },
      { kind: 'vase', x: 1095, y: 640, value: 300 },
      { kind: 'coin', x: 430, y: 300, value: 150 },
      { kind: 'safe', x: 710, y: 295, value: 2000 },
    ],
    guardDefs: [
      { route: [{ x: 260, y: 480 }, { x: 260, y: 130 }, { x: 520, y: 130 }, { x: 520, y: 480 }], pause: 0.9 },
      { route: [{ x: 1020, y: 130 }, { x: 1020, y: 480 }, { x: 760, y: 480 }, { x: 760, y: 130 }], pause: 0.9 },
      { route: [{ x: 640, y: 640 }, { x: 430, y: 640 }, { x: 430, y: 560 }, { x: 850, y: 560 }, { x: 850, y: 640 }], pause: 0.7 },
    ],
    cameraDefs: [
      { x: 200, y: TOP + 4, baseAngle: Math.PI / 2, sweep: 1.1, phase: 0 },
      { x: 640, y: TOP + 4, baseAngle: Math.PI / 2, sweep: 1.1, phase: 2.1 },
      { x: 1080, y: TOP + 4, baseAngle: Math.PI / 2, sweep: 1.1, phase: 4.2 },
    ],
    paintings: [
      { x: 500, y: TOP + 6, w: 64, h: 80, hue: 320 },
      { x: 760, y: TOP + 6, w: 64, h: 80, hue: 90 },
    ],
  },
];

/** Build a playable copy of one floor: loot gets a taken flag, guards and cameras get live state. */
export function buildLevel(floorIndex) {
  const def = FLOORS[floorIndex];
  return {
    ...def,
    walls: [...borderWalls(def.exit), ...def.walls],
    // Every solid rectangle: walls plus display cases. Both block
    // movement and block a guard's line of sight.
    solids: [...borderWalls(def.exit), ...def.walls, ...def.cases],
    loot: def.loot.map((item) => ({ ...item, taken: false, crack: 0 })),
    index: floorIndex,
  };
}

/** Every solid rectangle in the level, for movement and sight checks. */
export function levelSolids(level) {
  return level.solids;
}
