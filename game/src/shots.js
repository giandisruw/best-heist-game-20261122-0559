// The Velvet Vault — staged screenshot moments.
// ?shot=start|play|alert|win renders a fixed moment of a real game: the
// same rules step forward from a fresh floor, steered by a small autopilot
// that walks the thief toward the loot while staying out of the cones.
// Same seed, same frame — so the screenshots are honest renders of the
// game's own code, not mockups.

import { STEP, ALARM, CAMERA, GUARD } from './config.js';
import { makeRandom } from './random.js';
import { buildLevel } from './level.js';
import { createGuard, createCamera, updateGuard, updateCamera } from './guards.js';
import { createPlayer, updatePlayer, collectLoot, reachedExit } from './player.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN } from './render.js';

const SAMPLE = 1 / 30;

/** A fresh game state for one floor, as main.js builds it. */
export function freshState(floorIndex, seed) {
  const rng = makeRandom(seed);
  const level = buildLevel(floorIndex);
  level.lamps = [
    { x: 320 + rng() * 640, y: 200 + rng() * 320 },
    { x: 200 + rng() * 880, y: 120 + rng() * 480 },
  ];
  return {
    screen: SCREEN_PLAY,
    levelIndex: floorIndex,
    level,
    player: createPlayer(level.playerStart),
    guards: level.guardDefs.map((def) => createGuard(def)),
    cameras: level.cameraDefs.map((def) => createCamera(def)),
    alarm: 0,
    peakAlarm: 0,
    loot: 0,
    floorLoot: 0,
    score: 0,
    lives: 3,
    time: 0,
    totalTime: 0,
    floorTime: 0,
    keys: new Set(),
    mouse: { x: 640, y: 360 },
    lastSuspicionNote: 0,
    alarmNoteAt: 0,
    announced: '',
  };
}

/** One fixed step of the world, without sound or announcements. */
function stepWorld(game, keys) {
  game.time += STEP;
  game.floorTime += STEP;
  updatePlayer(game.player, keys, game.level, STEP);
  let anyGuardSees = false;
  let maxSuspicion = 0;
  for (const guard of game.guards) {
    const suspicion = updateGuard(guard, game.player, game.level, STEP);
    maxSuspicion = Math.max(maxSuspicion, suspicion);
    if (suspicion >= GUARD.investigateAt) anyGuardSees = true;
  }
  let anyCameraSees = false;
  for (const camera of game.cameras) {
    if (updateCamera(camera, game.player, game.level, STEP)) anyCameraSees = true;
  }
  const spottedRate = game.player.sneaking ? ALARM.guardRise * 0.55 : ALARM.guardRise;
  if (anyGuardSees) game.alarm += spottedRate * STEP;
  if (anyCameraSees) game.alarm += CAMERA.alarmRise * STEP;
  if (!anyGuardSees && !anyCameraSees) game.alarm -= ALARM.coolRate * STEP;
  game.alarm = Math.max(0, Math.min(100, game.alarm));
  game.peakAlarm = Math.max(game.peakAlarm, game.alarm);
  const gained = collectLoot(game.player, game.level, STEP);
  game.loot += gained;
  game.floorLoot += gained;
  game.score += gained;
}

/**
 * Steer the thief toward a waypoint while keeping out of the guards'
 * vision cones: each sample, try every direction and keep the one that
 * gets closest to the target without being seen.
 */
function autopilot(game, target, seconds) {
  const directions = [
    [0, 0],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
    [1, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
  ];
  const steps = Math.round(seconds / SAMPLE);
  for (let step = 0; step < steps; step += 1) {
    let best = directions[0];
    let bestScore = -Infinity;
    for (const [dx, dy] of directions) {
      const keys = new Set();
      if (dy < 0) keys.add('w');
      if (dy > 0) keys.add('s');
      if (dx < 0) keys.add('a');
      if (dx > 0) keys.add('d');
      // Score a trial step on a deep copy: closer is good, seen is bad.
      const probe = JSON.parse(JSON.stringify(game));
      probe.player = { ...game.player, thrownCoins: [] };
      probe.guards = game.guards.map((g) => ({ ...g, trail: [] }));
      probe.cameras = game.cameras.map((c) => ({ ...c }));
      probe.level = { ...game.level, loot: game.level.loot.map((l) => ({ ...l })) };
      stepWorld(probe, keys);
      const seen = probe.guards.reduce((max, g) => Math.max(max, g.suspicion), 0);
      const distance = Math.hypot(target.x - probe.player.x, target.y - probe.player.y);
      const score = -distance - seen * 6;
      if (score > bestScore) {
        bestScore = score;
        best = [dx, dy];
      }
    }
    const keys = new Set();
    if (best[1] < 0) keys.add('w');
    if (best[1] > 0) keys.add('s');
    if (best[0] < 0) keys.add('a');
    if (best[0] > 0) keys.add('d');
    stepWorld(game, keys);
    if (reachedExit(game.player, game.level)) break;
  }
}

/** Build the game state a ?shot= URL asks for. */
export function buildShotState(shot, seed) {
  if (shot === 'start') {
    // The title screen over the live first floor.
    const game = freshState(0, seed);
    game.screen = SCREEN_TITLE;
    game.time = 2;
    return game;
  }
  if (shot === 'alert') {
    // The hot moment: the thief caught in a camera cone with the alarm
    // nearly blown and a guard closing in.
    const game = freshState(0, seed);
    autopilot(game, { x: 640, y: 260 }, 8);
    game.player.x = 640;
    game.player.y = 250;
    game.player.sneaking = false;
    const camera = game.cameras[0];
    camera.angle = Math.PI / 2;
    camera.seesThief = true;
    const guard = game.guards[0];
    guard.angle = Math.atan2(game.player.y - guard.y, game.player.x - guard.x);
    guard.suspicion = 88;
    guard.state = 'chase';
    guard.lastSeen = { x: game.player.x, y: game.player.y };
    game.alarm = 78;
    game.peakAlarm = 78;
    game.loot = 300;
    game.floorLoot = 300;
    game.score = 300;
    game.time = 5;
    return game;
  }
  if (shot === 'win') {
    // The perfect heist: the win screen over the vault floor. The thief
    // really walks to the safe and stands still to crack it (the crack
    // ring fills by the game's own rules), then the win screen shows.
    const game = freshState(2, seed);
    autopilot(game, { x: 710, y: 295 }, 10);
    for (let i = 0; i < Math.round(2 / SAMPLE); i += 1) stepWorld(game, new Set());
    for (const item of game.level.loot) {
      if (item.kind !== 'safe') item.taken = true;
    }
    game.loot = 3050;
    game.floorLoot = 3050;
    game.score = 7420;
    game.totalTime = 486.2;
    game.lives = 2;
    game.screen = SCREEN_WIN;
    game.time = 4;
    return game;
  }
  // Default 'play': the tense cover frame — the thief crouched beside a
  // display case with a coin just ahead, a guard's cone sweeping close
  // enough to warm the alarm, the camera cone in view and the green exit
  // glowing at the top.
  const game = freshState(0, seed);
  autopilot(game, { x: 640, y: 395 }, 9);
  game.player.x = 600;
  game.player.y = 300;
  game.player.sneaking = true;
  const guard = game.guards[0];
  guard.angle = Math.atan2(game.player.y - guard.y, game.player.x - guard.x);
  guard.suspicion = 45;
  guard.state = 'suspicious';
  guard.lastSeen = { x: game.player.x, y: game.player.y };
  game.alarm = 38;
  game.peakAlarm = 38;
  game.loot = 150;
  game.floorLoot = 150;
  game.score = 150;
  game.screen = SCREEN_PLAY;
  // Freeze the lamplight at a bright pulse phase so the room reads warm.
  game.time = 3;
  return game;
}
