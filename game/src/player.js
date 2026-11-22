// The Velvet Vault — the thief: movement, tools and loot.
// Wren moves with the keys, sneaks with Shift, tosses a coin to lure a
// guard away, loops a camera from underneath it, and pockets loot — the
// big pieces only after standing still to crack them.

import { THIEF, LOOT, CAMERA, FLOOR, STEP } from './config.js';

/** A fresh thief at the floor's starting spot. */
export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: THIEF.radius,
    sneaking: false,
    moving: false,
    facing: -Math.PI / 2,
    coins: FLOOR.coinsPerFloor,
    // Coins in flight: { x, y, targetX, targetY, t }.
    thrownCoins: [],
    // Cracking progress (0..1) on the big loot piece under the thief.
    cracking: null,
    // Brief grace after a close call, so one brush is not instant doom.
    graceLeft: 0,
  };
}

/** Does a circle at (x, y, r) overlap any solid rectangle? */
export function circleHitsSolid(x, y, radius, solids) {
  for (const solid of solids) {
    const nearestX = Math.max(solid.x, Math.min(x, solid.x + solid.w));
    const nearestY = Math.max(solid.y, Math.min(y, solid.y + solid.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

/**
 * Move the thief from the held keys, sliding along walls. The thief's
 * speed depends on sneaking, and the alarm notices a runner faster.
 */
export function updatePlayer(player, keys, level, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  player.sneaking = keys.has('shift');
  player.moving = dx !== 0 || dy !== 0;

  if (player.moving) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
    const speed = player.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
    player.facing = Math.atan2(dy, dx);
    const step = speed * dt;
    // Move axis by axis so the thief slides along a wall instead of sticking.
    const nextX = player.x + dx * step;
    if (!circleHitsSolid(nextX, player.y, player.radius, level.solids)) player.x = nextX;
    const nextY = player.y + dy * step;
    if (!circleHitsSolid(player.x, nextY, player.radius, level.solids)) player.y = nextY;
    // Moving breaks a crack: the big loot needs a still hand.
    player.cracking = null;
  }
  if (player.graceLeft > 0) player.graceLeft -= dt;

  // Fly the thrown coins toward their landing spots.
  for (const coin of player.thrownCoins) {
    coin.t += dt * 3.2;
    if (coin.t >= 1) {
      coin.x = coin.targetX;
      coin.y = coin.targetY;
    } else {
      coin.x = coin.startX + (coin.targetX - coin.startX) * coin.t;
      coin.y = coin.startY + (coin.targetY - coin.startY) * coin.t;
    }
  }
  player.thrownCoins = player.thrownCoins.filter((coin) => coin.t < 1.4);
}

/**
 * Toss a coin toward a point: the clink pulls every guard in earshot over
 * to look. Returns true when a coin was actually thrown.
 */
export function throwCoin(player, targetX, targetY) {
  if (player.coins <= 0) return false;
  player.coins -= 1;
  player.thrownCoins.push({
    startX: player.x,
    startY: player.y,
    x: player.x,
    y: player.y,
    targetX,
    targetY,
    t: 0,
  });
  return true;
}

/** A landed coin lures guards: any guard within earshot goes to look. */
export function lureGuards(guards, coin) {
  const earshot = 260;
  for (const guard of guards) {
    if (Math.hypot(guard.x - coin.x, guard.y - coin.y) < earshot) {
      guard.investigate = { x: coin.x, y: coin.y };
      if (guard.state === 'patrol') guard.state = 'suspicious';
      if (guard.suspicion < 30) guard.suspicion = 30;
    }
  }
}

/**
 * Loop a camera from underneath it: stand close to a camera and press F,
 * and its feed freezes for a while. Returns the camera looped, or null.
 */
export function loopNearestCamera(player, cameras) {
  let best = null;
  let bestDistance = 70;
  for (const camera of cameras) {
    const distance = Math.hypot(camera.x - player.x, camera.y - player.y);
    if (distance < bestDistance && camera.loopLeft <= 0) {
      best = camera;
      bestDistance = distance;
    }
  }
  if (best) best.loopLeft = CAMERA.loopSeconds;
  return best;
}

/**
 * Pick up loot under the thief. Small pieces pocket instantly; the star
 * and the safe need the thief to stand still and crack them. Returns the
 * value pocketed this step (0 when nothing was pocketed).
 */
export function collectLoot(player, level, dt) {
  let gained = 0;
  for (const item of level.loot) {
    if (item.taken) continue;
    const distance = Math.hypot(item.x - player.x, item.y - player.y);
    const reach = item.kind === 'star' || item.kind === 'safe' ? 46 : 30;
    if (distance > reach) {
      if (player.cracking === item) player.cracking = null;
      continue;
    }
    if (item.kind === 'coin' || item.kind === 'vase') {
      item.taken = true;
      gained += item.value;
    } else {
      // Big loot: stand still and the crack meter fills.
      if (!player.moving) {
        player.cracking = item;
        item.crack += dt / LOOT.crackSeconds;
        if (item.crack >= 1) {
          item.taken = true;
          player.cracking = null;
          gained += item.value;
        }
      } else {
        player.cracking = null;
        item.crack = Math.max(0, item.crack - dt);
      }
    }
  }
  return gained;
}

/** Has the thief reached the green exit door? */
export function reachedExit(player, level) {
  const exit = level.exit;
  return (
    player.x > exit.x - 6 &&
    player.x < exit.x + exit.w + 6 &&
    player.y > exit.y - 6 &&
    player.y < exit.y + exit.h + 30
  );
}
