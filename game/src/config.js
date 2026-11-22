// The Velvet Vault — tuning and shared constants.
// One place for every number that shapes how the heist feels: the size of
// the gallery, how fast the thief and the guards move, how far a vision cone
// reaches, and how quickly the alarm climbs when the thief is seen.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;

export const STEP = 1 / 60;

export const THIEF = {
  radius: 13,
  walkSpeed: 205,
  sneakSpeed: 118,
  // A running thief is much easier to spot than a sneaking one.
  runSpottedRate: 1.0,
  sneakSpottedRate: 0.45,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  investigateSpeed: 96,
  chaseSpeed: 148,
  // Vision cone: how far a guard can see and how wide the cone is.
  sightRange: 190,
  sightHalfAngle: 0.62,
  // How fast suspicion (0-100) climbs while the thief is inside the cone.
  suspicionRise: 55,
  suspicionFall: 26,
  // Below this distance a guard spots the thief whatever the cone says.
  nearRadius: 46,
  // A guard that reaches this suspicion starts chasing the thief.
  chaseAt: 100,
  // A guard that reaches this suspicion walks over to look.
  investigateAt: 45,
};

export const CAMERA = {
  sightRange: 210,
  sightHalfAngle: 0.42,
  sweepSpeed: 0.55,
  // Alarm points per second while the thief stands in a camera cone.
  alarmRise: 34,
  // Seconds a looped (disabled) camera stays dark.
  loopSeconds: 10,
};

export const ALARM = {
  // Alarm points per second while a guard has eyes on the thief.
  guardRise: 30,
  // Alarm slowly cools off while nobody can see the thief.
  coolRate: 7,
  // The alarm level that means the heist is blown and the thief is caught.
  caughtAt: 100,
  // A near miss while the alarm is high flashes the screen edge.
  tenseAt: 60,
};

export const LOOT = {
  // Seconds of standing still it takes to crack the big display case.
  crackSeconds: 1.4,
  coinValue: 150,
  vaseValue: 300,
  starValue: 1500,
};

export const FLOOR = {
  lives: 3,
  coinsPerFloor: 3,
  // Bonus paid for finishing a floor quickly (per second under par).
  parSeconds: 150,
  parBonusPerSecond: 5,
};

// Palette: a night gallery — dark marble, warm lamplight, gold loot,
// red danger. Safe cover reads green-blue, danger reads red, loot gold.
export const PALETTE = {
  floorA: '#1c1a26',
  floorB: '#211e2e',
  wall: '#3a3450',
  wallTop: '#4c4568',
  rug: '#5a2e3d',
  rugEdge: '#7a3a4d',
  caseGlass: 'rgba(140, 200, 255, 0.10)',
  caseFrame: '#8a6d3b',
  exit: '#2fd47a',
  exitGlow: 'rgba(47, 212, 122, 0.25)',
  gold: '#f5c542',
  goldGlow: 'rgba(245, 197, 66, 0.30)',
  guardBody: '#c94f4f',
  guardHat: '#7a2e2e',
  coneCalm: 'rgba(245, 197, 66, 0.30)',
  coneAlert: 'rgba(255, 77, 77, 0.46)',
  cameraCone: 'rgba(255, 90, 90, 0.34)',
  thief: '#7fd4ff',
  thiefCoat: '#2b6cb0',
  hudBack: 'rgba(10, 8, 18, 0.88)',
  text: '#e8ecf4',
  dimText: '#9aa3b8',
};
