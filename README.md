# The Velvet Vault

A midnight heist in the Marlow Gallery. You are **Wren**, the thief in blue.
Sneak past the guards' golden vision cones and the cameras' red sweeps,
grab the loot — crack the Star of Marlow and the vault safe by standing
still — and slip out the green EXIT door before the alarm hits 100.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with
`node serve.ts` and open http://localhost:8080). No network, no build step,
no install: plain HTML, canvas and JavaScript.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move |
| SHIFT (hold) | Sneak — slower, harder to spot, alarm rises slower |
| E or mouse click | Toss a coin toward the cursor — the clink lures nearby guards over to look |
| F | Loop a camera — stand under a camera to freeze its feed for 10 seconds |
| P | Pause |
| M | Mute |
| R | Retry the floor (after being caught) |
| ENTER / click | Start, continue to the next floor |

## The heist

- **Three floors.** The Marble Hall, the Portrait Wing, and the Vault — each
  a bigger room with more guards, more cameras and richer loot.
- **The alarm meter** (top bar) climbs whenever a guard or a camera has eyes
  on you, faster while you run, slower while you sneak — and cools off while
  you hide behind a display case or a wall. At 100 the doors slam shut and
  you are caught. A chasing guard that touches you catches you too.
- **Guards** patrol routes, pause to scan, grow suspicious (`?`) when they
  glimpse you, and chase (`!`) when they are sure. Their footstep trails on
  the floor show where they have walked, so you can read a patrol before
  you move.
- **Cameras** sweep red cones from the walls. Stand directly under one and
  press F to loop its feed — but each camera loops only once per floor.
- **Loot:** coins and vases pocket on touch. The **Star of Marlow** and the
  **vault safe** are the big scores: stand still beside them while the gold
  crack ring fills. The exit door only opens once you have grabbed the
  floor's loot goal — then a speed bonus pays for finishing under par.
- **Lives:** three. Lose them all and the gallery keeps its treasures.

## What makes it a heist game

Planning before moving (read the cones, time the sweeps), tools with a
cost (three coins a floor, one loop per camera), a rising alarm that is the
real enemy, and a getaway that pays off the planning — the green door only
opens when the loot is in the bag.

## Files

- `game/index.html` — the page; `game/src/main.js` — loop, input, alarm, floors
- `game/src/level.js` — the three gallery floors
- `game/src/guards.js` — guard and camera brains, vision cones, line of sight
- `game/src/player.js` — the thief: movement, coin toss, camera loop, loot
- `game/src/render.js` — every pixel: room, cones, HUD, title/caught/win screens
- `game/src/audio.js` — sounds synthesized live with WebAudio (no audio files)
- `game/src/shots.js` — staged screenshot moments (`?shot=play|start|alert|win`)
- `game/src/config.js` — tuning; `game/src/random.js` — seeded RNG
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
- `screenshots/` — real renders of the game's own code, taken in a browser

## License

MIT — see `LICENSE`.
