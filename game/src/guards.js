// The Velvet Vault — guards, cameras and what they can see.
// A guard walks a patrol route, stops to look, and turns toward the thief
// when suspicion grows; a camera sweeps its cone back and forth from the
// wall. Both see through a vision cone that walls and display cases block.

import { GUARD, CAMERA, STEP } from './config.js';

/** Is the straight line from (x1,y1) to (x2,y2) blocked by any solid rectangle? */
export function lineBlocked(x1, y1, x2, y2, solids) {
  for (const solid of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, solid)) return true;
  }
  return false;
}

// Slab test: does the segment cross the rectangle's interior?
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** Smallest signed angle from a to b, in (-PI, PI]. */
export function angleDifference(a, b) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff <= -Math.PI) diff += Math.PI * 2;
  return diff;
}

/** Can this watcher see the thief right now? Cone, range, and a clear line. */
export function watcherSeesThief(watcher, thief, solids, range, halfAngle) {
  const dx = thief.x - watcher.x;
  const dy = thief.y - watcher.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  // Very close: a guard feels the thief breathing, cone or not.
  if (watcher.isGuard && distance < GUARD.nearRadius) return true;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(watcher.angle, toThief)) > halfAngle) return false;
  return !lineBlocked(watcher.x, watcher.y, thief.x, thief.y, solids);
}

/** A fresh guard on its patrol route, facing its first waypoint. */
export function createGuard(def) {
  const start = def.route[0];
  const next = def.route[1] ?? def.route[0];
  return {
    isGuard: true,
    x: start.x,
    y: start.y,
    angle: Math.atan2(next.y - start.y, next.x - start.x),
    route: def.route,
    waypoint: 1 % def.route.length,
    pause: def.pause ?? 1,
    pauseLeft: 0,
    state: 'patrol', // patrol | suspicious | chase
    suspicion: 0,
    lastSeen: null,
    investigate: null,
    trail: [], // recent positions, drawn as footstep dots
  };
}

/** A fresh wall camera, sweeping its cone around its base angle. */
export function createCamera(def) {
  return {
    isGuard: false,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    phase: def.phase ?? 0,
    angle: def.baseAngle,
    time: 0,
    loopLeft: 0, // seconds left while the camera is looped (disabled)
    seesThief: false,
  };
}

/** Move a point toward a target at a speed, stopping on arrival. Returns true on arrival. */
function moveToward(body, target, speed, dt) {
  const dx = target.x - body.x;
  const dy = target.y - body.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;
  const step = Math.min(distance, speed * dt);
  body.x += (dx / distance) * step;
  body.y += (dy / distance) * step;
  body.angle = Math.atan2(dy, dx);
  return step >= distance;
}

/**
 * One step of a guard's brain: patrol the route, walk over to look when
 * suspicious, chase when sure — and always remember where the thief was
 * last seen. Returns the guard's suspicion after this step.
 */
export function updateGuard(guard, thief, level, dt) {
  const seen = watcherSeesThief(guard, thief, level.solids, GUARD.sightRange, GUARD.sightHalfAngle);
  const spotting = thief.sneaking ? GUARD.suspicionRise * 0.55 : GUARD.suspicionRise;
  guard.suspicion = seen
    ? Math.min(100, guard.suspicion + spotting * dt)
    : Math.max(0, guard.suspicion - GUARD.suspicionFall * dt);

  if (seen) {
    guard.lastSeen = { x: thief.x, y: thief.y };
    guard.investigate = null;
  }

  if (guard.suspicion >= GUARD.chaseAt) {
    guard.state = 'chase';
  } else if (guard.suspicion >= GUARD.investigateAt) {
    guard.state = guard.state === 'chase' ? 'suspicious' : 'suspicious';
    if (!guard.investigate && guard.lastSeen) {
      guard.investigate = { ...guard.lastSeen };
    }
  } else if (guard.state !== 'patrol' && guard.suspicion < 5) {
    guard.state = 'patrol';
    guard.investigate = null;
    guard.lastSeen = null;
  }

  if (guard.state === 'chase') {
    // Chase the thief's live position; give up after losing sight a while.
    moveToward(guard, thief, GUARD.chaseSpeed, dt);
    if (!seen && guard.suspicion < GUARD.investigateAt) {
      guard.state = 'suspicious';
      guard.investigate = guard.lastSeen ? { ...guard.lastSeen } : null;
    }
  } else if (guard.state === 'suspicious' && guard.investigate) {
    if (moveToward(guard, guard.investigate, GUARD.investigateSpeed, dt)) {
      guard.investigate = null;
      guard.pauseLeft = 1.6; // stand and look around the spot
    }
  } else {
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      // Scan the room while paused: slow turn, like a guard looking around.
      guard.angle += 0.9 * dt;
    } else {
      const target = guard.route[guard.waypoint];
      if (moveToward(guard, target, GUARD.patrolSpeed, dt)) {
        guard.waypoint = (guard.waypoint + 1) % guard.route.length;
        guard.pauseLeft = guard.pause;
      }
    }
  }

  // Footstep trail: a fading dotted line the player can read the patrol from.
  guard.trail.push({ x: guard.x, y: guard.y });
  if (guard.trail.length > 90) guard.trail.shift();
  return guard.suspicion;
}

/** One step of a camera: sweep the cone, or sit dark while looped. */
export function updateCamera(camera, thief, level, dt) {
  camera.time += dt;
  if (camera.loopLeft > 0) {
    camera.loopLeft = Math.max(0, camera.loopLeft - dt);
    camera.seesThief = false;
    return false;
  }
  camera.angle = camera.baseAngle + Math.sin(camera.time * CAMERA.sweepSpeed + camera.phase) * camera.sweep;
  camera.seesThief = watcherSeesThief(camera, thief, level.solids, CAMERA.sightRange, CAMERA.sightHalfAngle);
  return camera.seesThief;
}

/** Distance between the thief and the nearest guard that can touch them. */
export function nearestGuardDistance(guards, thief) {
  let best = Infinity;
  for (const guard of guards) {
    best = Math.min(best, Math.hypot(guard.x - thief.x, guard.y - thief.y));
  }
  return best;
}
