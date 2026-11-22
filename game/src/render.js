// The Velvet Vault — every pixel the player sees.
// A top-down night gallery on canvas: marble floor, rugs, paintings,
// display cases, guards with gradient vision cones, sweeping camera cones,
// glowing loot, and the HUD bar with the alarm meter. Title, caught and
// win screens draw over the live room so the game reads in a still frame.

import { VIEW_W, VIEW_H, HUD_H, GUARD, CAMERA, PALETTE } from './config.js';
import { angleDifference } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_FLOOR_CLEAR = 'floorClear';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_GAME_OVER = 'gameOver';
export const SCREEN_WIN = 'win';
export const SCREEN_PAUSED = 'paused';

/** Draw one vision cone: a wedge from the watcher's eye, fading with distance. */
function drawCone(ctx, watcher, range, halfAngle, calmColour, alertColour, heat) {
  const hot = heat > 0.5;
  // A bright core wedge near the watcher, then a fading outer wedge: the
  // cone must read at a glance even when the screenshot is shrunk.
  const core = ctx.createRadialGradient(watcher.x, watcher.y, 4, watcher.x, watcher.y, range * 0.55);
  core.addColorStop(0, hot ? 'rgba(255, 77, 77, 0.42)' : 'rgba(245, 197, 66, 0.34)');
  core.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(watcher.x, watcher.y);
  ctx.arc(watcher.x, watcher.y, range * 0.55, watcher.angle - halfAngle, watcher.angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  const gradient = ctx.createRadialGradient(watcher.x, watcher.y, 10, watcher.x, watcher.y, range);
  gradient.addColorStop(0, hot ? alertColour : calmColour);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(watcher.x, watcher.y);
  ctx.arc(watcher.x, watcher.y, range, watcher.angle - halfAngle, watcher.angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  // A bright rim on the cone's edges, so its sweep reads at a glance.
  ctx.strokeStyle = hot ? 'rgba(255, 90, 90, 0.8)' : 'rgba(245, 197, 66, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(watcher.x, watcher.y);
  ctx.lineTo(watcher.x + Math.cos(watcher.angle - halfAngle) * range, watcher.y + Math.sin(watcher.angle - halfAngle) * range);
  ctx.moveTo(watcher.x, watcher.y);
  ctx.lineTo(watcher.x + Math.cos(watcher.angle + halfAngle) * range, watcher.y + Math.sin(watcher.angle + halfAngle) * range);
  ctx.stroke();
}

/** The gallery floor: checker marble, rugs, paintings and lamplight pools. */
function drawRoom(ctx, level, time) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  // Checker marble tiles.
  const tile = 64;
  ctx.fillStyle = PALETTE.floorB;
  for (let y = HUD_H; y < VIEW_H; y += tile) {
    for (let x = 0; x < VIEW_W; x += tile) {
      if (((x / tile) | 0) % 2 === ((y / tile) | 0) % 2) {
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  // Warm lamplight pools that drift slowly with time.
  for (const lamp of level.lamps) {
    const pulse = 0.10 + 0.03 * Math.sin(time * 0.8 + lamp.x);
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, 150);
    glow.addColorStop(0, `rgba(255, 214, 140, ${pulse})`);
    glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lamp.x - 150, lamp.y - 150, 300, 300);
  }
  // Rugs.
  for (const rug of level.rugs) {
    ctx.fillStyle = PALETTE.rug;
    ctx.fillRect(rug.x, rug.y, rug.w, rug.h);
    ctx.strokeStyle = PALETTE.rugEdge;
    ctx.lineWidth = 4;
    ctx.strokeRect(rug.x + 6, rug.y + 6, rug.w - 12, rug.h - 12);
    ctx.strokeStyle = 'rgba(245, 197, 66, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rug.x + 16, rug.y + 16, rug.w - 32, rug.h - 32);
  }
  // Paintings on the walls, with little gilt frames.
  for (const painting of level.paintings) {
    ctx.fillStyle = '#6b5322';
    ctx.fillRect(painting.x - 4, painting.y - 4, painting.w + 8, painting.h + 8);
    ctx.fillStyle = `hsl(${painting.hue}, 45%, 42%)`;
    ctx.fillRect(painting.x, painting.y, painting.w, painting.h);
    ctx.fillStyle = `hsla(${painting.hue}, 60%, 70%, 0.8)`;
    ctx.beginPath();
    ctx.arc(painting.x + painting.w / 2, painting.y + painting.h / 2, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Walls: dark blocks with a lighter top edge.
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 4);
  }
  // Display cases: glass tops with brass frames; they hide the thief.
  for (const displayCase of level.cases) {
    ctx.fillStyle = '#2a2438';
    ctx.fillRect(displayCase.x, displayCase.y, displayCase.w, displayCase.h);
    ctx.fillStyle = PALETTE.caseGlass;
    ctx.fillRect(displayCase.x + 5, displayCase.y + 5, displayCase.w - 10, displayCase.h - 10);
    ctx.strokeStyle = PALETTE.caseFrame;
    ctx.lineWidth = 3;
    ctx.strokeRect(displayCase.x, displayCase.y, displayCase.w, displayCase.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(displayCase.x + 8, displayCase.y + displayCase.h - 8);
    ctx.lineTo(displayCase.x + displayCase.w - 8, displayCase.y + 8);
    ctx.stroke();
  }
}

/** Loot: coins spin, vases glow blue-white, the star and safe blaze gold. */
function drawLoot(ctx, level, time) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.4 + item.x) * 2;
    const y = item.y + bob;
    if (item.kind === 'coin') {
      const spin = Math.abs(Math.cos(time * 3 + item.x));
      ctx.fillStyle = PALETTE.goldGlow;
      ctx.beginPath();
      ctx.arc(item.x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.ellipse(item.x, y, 11 * (0.4 + 0.6 * spin), 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5a10';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', item.x, y + 0.5);
    } else if (item.kind === 'vase') {
      ctx.fillStyle = 'rgba(140, 200, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(item.x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9fd0ff';
      ctx.beginPath();
      ctx.ellipse(item.x, y, 9, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b5a8a';
      ctx.fillRect(item.x - 5, y - 18, 10, 6);
    } else if (item.kind === 'star') {
      drawStar(ctx, item.x, y, 26 + Math.sin(time * 3) * 3, PALETTE.gold, true);
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STAR OF MARLOW', item.x, y + 42);
    } else if (item.kind === 'safe') {
      ctx.fillStyle = 'rgba(245, 197, 66, 0.22)';
      ctx.beginPath();
      ctx.arc(item.x, y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d3a4a';
      ctx.fillRect(item.x - 22, y - 18, 44, 36);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(item.x - 22, y - 18, 44, 36);
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(item.x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('THE VAULT SAFE', item.x, y + 34);
    }
    // Cracking progress ring over the big loot while the thief works it.
    if (item.crack > 0 && item.crack < 1) {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(item.x, y, 32, -Math.PI / 2, -Math.PI / 2 + item.crack * Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawStar(ctx, x, y, radius, colour, glow) {
  if (glow) {
    ctx.fillStyle = PALETTE.goldGlow;
    ctx.beginPath();
    ctx.arc(x, y, radius + 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** The green exit door at the top, glowing when the thief is close. */
function drawExit(ctx, level, thief, time) {
  const exit = level.exit;
  const near = Math.hypot(thief.x - (exit.x + exit.w / 2), thief.y - (exit.y + 14)) < 220;
  const glow = near ? 0.4 + 0.15 * Math.sin(time * 5) : 0.18;
  ctx.fillStyle = `rgba(47, 212, 122, ${glow})`;
  ctx.fillRect(exit.x - 14, exit.y - 4, exit.w + 28, 70);
  ctx.fillStyle = PALETTE.exit;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#0d3d22';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 1);
  ctx.fillStyle = PALETTE.exit;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('▲ GETAWAY DOOR', exit.x + exit.w / 2, exit.y + 42);
}

/** A guard: a red-coated figure with a hat, a suspicion "?" and footstep trail. */
function drawGuard(ctx, guard, time) {
  // Footstep trail: fading dots along the patrol path.
  for (let i = 0; i < guard.trail.length; i += 6) {
    const dot = guard.trail[i];
    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + (i / guard.trail.length) * 0.10})`;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y + 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const heat = guard.suspicion / 100;
  drawCone(ctx, guard, GUARD.sightRange, GUARD.sightHalfAngle, PALETTE.coneCalm, PALETTE.coneAlert, heat);
  // Body.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 12, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.state === 'chase' ? '#ff2e2e' : PALETTE.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 4, guard.y + Math.sin(guard.angle) * 4, 7, 0, Math.PI * 2);
  ctx.fill();
  // Cap with a brim, pointing where the guard looks.
  ctx.fillStyle = PALETTE.guardHat;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 4, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(guard.x - 8, guard.y - 6, 16, 3);
  // "!" when chasing, "?" when suspicious, and a suspicion bar overhead.
  if (guard.state === 'chase') {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 26);
  } else if (guard.state === 'suspicious') {
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 26);
  }
  if (guard.suspicion > 2) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(guard.x - 16, guard.y - 24, 32, 5);
    ctx.fillStyle = guard.suspicion > 70 ? '#ff4d4d' : '#f5c542';
    ctx.fillRect(guard.x - 15, guard.y - 23, 30 * (guard.suspicion / 100), 3);
  }
}

/** A wall camera: a small dome with a sweeping red cone. */
function drawCamera(ctx, camera) {
  if (camera.loopLeft > 0) {
    // Looped: the cone is gone, a frozen "LOOPED" tag shows instead.
    ctx.fillStyle = '#2b6cb0';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y + 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bfe3ff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOOPED', camera.x, camera.y + 30);
    ctx.fillText(`${Math.ceil(camera.loopLeft)}s`, camera.x, camera.y + 42);
    return;
  }
  drawCone(ctx, camera, CAMERA.sightRange, CAMERA.sightHalfAngle, PALETTE.cameraCone, 'rgba(255, 40, 40, 0.4)', camera.seesThief ? 1 : 0);
  ctx.fillStyle = '#22222e';
  ctx.fillRect(camera.x - 10, camera.y - 4, 20, 12);
  ctx.fillStyle = camera.seesThief ? '#ff2e2e' : '#c94f4f';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y + 8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8a8a';
  ctx.beginPath();
  ctx.arc(camera.x + Math.cos(camera.angle) * 3, camera.y + 8 + Math.sin(camera.angle) * 3, 3, 0, Math.PI * 2);
  ctx.fill();
  // Blinking recording light.
  ctx.fillStyle = camera.seesThief ? '#ff2e2e' : '#ff6b6b';
  ctx.beginPath();
  ctx.arc(camera.x + 12, camera.y + 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/** The thief: a blue-hooded figure, crouched low while sneaking. */
function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * 10) * 1.5 : 0;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // A soft blue ring while sneaking, so the mode reads at a glance.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(127, 212, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.thiefCoat;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 4, player.y + Math.sin(player.facing) * 4 + bob, 6.5, 0, Math.PI * 2);
  ctx.fill();
  // Hood point and a little mask.
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.moveTo(player.x - Math.cos(player.facing) * 8, player.y - Math.sin(player.facing) * 8 + bob);
  ctx.lineTo(player.x + Math.cos(player.facing) * 10, player.y + Math.sin(player.facing) * 10 + bob);
  ctx.lineTo(player.x + Math.cos(player.facing + 1.2) * 9, player.y + Math.sin(player.facing + 1.2) * 9 + bob);
  ctx.closePath();
  ctx.fill();
  // Thrown coins in flight.
  for (const coin of player.thrownCoins) {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y - 8, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The HUD bar: floor, loot, alarm meter, coins, lives, timer, objective. */
function drawHud(ctx, game) {
  ctx.fillStyle = PALETTE.hudBack;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  // Floor name and objective.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(game.level.name, 16, 20);
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '13px sans-serif';
  ctx.fillText(game.level.briefing.split('.')[0] + '.', 16, 44);
  // Loot counter.
  const lootTotal = game.level.loot.reduce((sum, item) => sum + item.value, 0);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(`LOOT $${game.loot} / $${lootTotal}`, 560, 20);
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '12px sans-serif';
  ctx.fillText('loot grabbed', 560, 42);
  // Alarm meter — the heart of the heist.
  const alarm = game.alarm;
  const meterX = 760;
  const meterW = 220;
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, 14);
  ctx.fillStyle = '#1a1626';
  ctx.fillRect(meterX, 24, meterW, 16);
  const alarmColour = alarm >= 60 ? '#ff4d4d' : alarm >= 30 ? '#f5c542' : '#58d68d';
  ctx.fillStyle = alarmColour;
  ctx.fillRect(meterX + 1, 25, (meterW - 2) * (alarm / 100), 14);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX, 24, meterW, 16);
  ctx.fillStyle = alarm >= 60 ? '#ff4d4d' : PALETTE.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(alarm >= 60 ? 'HOT!' : alarm >= 30 ? 'WARM' : 'QUIET', meterX + meterW + 10, 32);
  // Coins, lives, timer.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`COINS x${game.player.coins}`, 1120, 20);
  ctx.fillText(`LIVES ${game.lives}`, 1120, 44);
  ctx.fillStyle = alarmColour;
  ctx.fillText(`TIME ${formatTime(game.time)}`, 1264, 20);
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '12px sans-serif';
  ctx.fillText(`score $${game.score}`, 1264, 44);
  ctx.textAlign = 'left';
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** A dim overlay panel with a big title, a few lines and a prompt. */
function drawPanel(ctx, title, titleColour, lines, prompt) {
  ctx.fillStyle = 'rgba(5, 4, 12, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const panelW = 760;
  const panelH = 150 + lines.length * 30;
  const panelX = (VIEW_W - panelW) / 2;
  const panelY = (VIEW_H - panelH) / 2;
  ctx.fillStyle = 'rgba(16, 13, 28, 0.96)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColour;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(title, VIEW_W / 2, panelY + 62);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, panelY + 108 + i * 30);
  });
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(prompt, VIEW_W / 2, panelY + panelH - 28);
  ctx.textAlign = 'left';
}

/** The title screen, drawn over the live first floor. */
function drawTitle(ctx, game) {
  drawPanel(
    ctx,
    'THE VELVET VAULT',
    PALETTE.gold,
    [
      'A midnight heist in the Marlow Gallery. You are Wren, the thief in blue.',
      'Sneak past the guards’ golden vision cones and the cameras’ red sweeps,',
      'grab the loot — crack the Star and the vault safe by standing still —',
      'and slip out the green EXIT door before the alarm hits 100.',
      '',
      'WASD / arrows — move      SHIFT — sneak (slow, harder to spot)',
      'E or CLICK — toss a coin to lure a guard      F — loop a camera (stand under it)',
      'P — pause      M — mute      R — restart the floor',
    ],
    'Press ENTER or CLICK to begin the heist',
  );
}

/** The red flash at the screen edge while the alarm is high. */
function drawAlarmVignette(ctx, game) {
  if (game.alarm < 60 || game.screen !== SCREEN_PLAY) return;
  const strength = (game.alarm - 60) / 40;
  const pulse = 0.25 + 0.15 * Math.sin(game.time * 6);
  const gradient = ctx.createRadialGradient(
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.32,
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75,
  );
  gradient.addColorStop(0, 'rgba(255, 40, 40, 0)');
  gradient.addColorStop(1, `rgba(255, 40, 40, ${pulse * strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

/** Draw the whole game: room, actors, HUD, then any overlay screen. */
export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawRoom(ctx, game.level, game.time);
  drawExit(ctx, game.level, game.player, game.time);
  drawLoot(ctx, game.level, game.time);
  for (const camera of game.cameras) drawCamera(ctx, camera);
  for (const guard of game.guards) drawGuard(ctx, guard, game.time);
  drawPlayer(ctx, game.player, game.time);
  drawAlarmVignette(ctx, game);
  drawHud(ctx, game);

  if (game.screen === SCREEN_TITLE) {
    drawTitle(ctx, game);
  } else if (game.screen === SCREEN_FLOOR_CLEAR) {
    drawPanel(
      ctx,
      'CLEAN GETAWAY!',
      PALETTE.exit,
      [
        `${game.level.name} cleared — loot $${game.floorLoot} banked this floor.`,
        `Total score $${game.score}  •  Alarm peaked at ${Math.round(game.peakAlarm)}`,
        game.levelIndex < 2 ? 'The next floor is darker, and the guards walk faster.' : '',
      ].filter(Boolean),
      'Press ENTER for the next floor',
    );
  } else if (game.screen === SCREEN_CAUGHT) {
    drawPanel(
      ctx,
      'CAUGHT!',
      '#ff4d4d',
      [
        'The alarm hit 100 — the gallery doors slammed shut and the guards closed in.',
        `You still hold $${game.loot} of loot from this floor. ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left.`,
        'Watch the cones, sneak with SHIFT, and toss a coin to pull a guard away.',
      ],
      'Press R to retry the floor',
    );
  } else if (game.screen === SCREEN_GAME_OVER) {
    drawPanel(
      ctx,
      'THE HEIST IS OVER',
      '#ff4d4d',
      [
        'Three strikes — the Marlow Gallery keeps its treasures tonight.',
        `Final score $${game.score}. The Star of Marlow still hangs in its case…`,
        'A better plan, a quieter step, and the vault is yours.',
      ],
      'Press ENTER to plan the heist again',
    );
  } else if (game.screen === SCREEN_WIN) {
    drawPanel(
      ctx,
      'THE PERFECT HEIST!',
      PALETTE.gold,
      [
        `Wren walks out of the Marlow Gallery with $${game.score} of treasure —`,
        'the Star of Marlow, the vault safe, and not a single guard the wiser.',
        `Finished in ${formatTime(game.totalTime)} with ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} to spare.`,
      ],
      'Press ENTER to run it back',
    );
  } else if (game.screen === SCREEN_PAUSED) {
    drawPanel(ctx, 'PAUSED', PALETTE.text, ['The gallery waits. The guards do not — they are frozen too.'], 'Press P to keep sneaking');
  }
}

/** Recompute the alarm label the status line announces. */
export function alarmLabel(alarm) {
  if (alarm >= 100) return 'CAUGHT';
  if (alarm >= 60) return 'HOT';
  if (alarm >= 30) return 'WARM';
  return 'QUIET';
}
