// The Velvet Vault — sound, synthesized live with WebAudio.
// No audio files: every blip, clink and alarm is a small oscillator
// envelope built at run time, so the game stays a handful of text files.

let audioContext = null;
let muted = false;

/** Create the audio context on the first user gesture (browsers require it). */
export function ensureAudio() {
  if (!audioContext) {
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      audioContext = new Ctor();
    } catch {
      audioContext = null;
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

/** Toggle the mute; returns the new muted state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

/** One short tone: a sine or square blip that slides between frequencies. */
function blip(frequencyFrom, frequencyTo, duration, type, volume, delay = 0) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequencyFrom, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, frequencyTo), start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export const sfx = {
  /** A coin or vase pocketed: a bright two-note chime. */
  pickup() {
    blip(880, 880, 0.09, 'sine', 0.16);
    blip(1318, 1318, 0.14, 'sine', 0.14, 0.07);
  },
  /** The big loot cracked open: a rising arpeggio. */
  crack() {
    blip(523, 523, 0.1, 'triangle', 0.18);
    blip(659, 659, 0.1, 'triangle', 0.18, 0.09);
    blip(784, 784, 0.16, 'triangle', 0.2, 0.18);
    blip(1046, 1046, 0.24, 'triangle', 0.2, 0.27);
  },
  /** A coin tossed: a metallic clink as it lands. */
  coinToss() {
    blip(2400, 1800, 0.06, 'square', 0.07);
    blip(1900, 1500, 0.12, 'square', 0.09, 0.16);
  },
  /** A camera looped: a soft electronic chirp. */
  loopCamera() {
    blip(1200, 600, 0.18, 'sawtooth', 0.07);
    blip(600, 1200, 0.18, 'sawtooth', 0.06, 0.12);
  },
  /** A guard grows suspicious: a low questioning thud. */
  suspicious() {
    blip(220, 180, 0.22, 'triangle', 0.16);
  },
  /** The alarm climbs past the tense line: a rising two-tone warning. */
  alarmRise() {
    blip(440, 660, 0.16, 'square', 0.08);
    blip(660, 440, 0.16, 'square', 0.08, 0.16);
  },
  /** Caught: a harsh descending sting. */
  caught() {
    blip(392, 392, 0.18, 'sawtooth', 0.18);
    blip(311, 311, 0.18, 'sawtooth', 0.18, 0.16);
    blip(233, 110, 0.5, 'sawtooth', 0.2, 0.32);
  },
  /** A floor cleared: a short victorious run. */
  floorClear() {
    blip(523, 523, 0.12, 'triangle', 0.18);
    blip(659, 659, 0.12, 'triangle', 0.18, 0.11);
    blip(784, 784, 0.12, 'triangle', 0.18, 0.22);
    blip(1046, 1046, 0.3, 'triangle', 0.2, 0.33);
  },
  /** The whole heist won: a longer golden fanfare. */
  heistWin() {
    const notes = [523, 659, 784, 1046, 784, 1046, 1318];
    notes.forEach((note, i) => blip(note, note, 0.22, 'triangle', 0.18, i * 0.13));
  },
  /** A soft footstep tick while sneaking, so movement has a sound. */
  step() {
    blip(180, 140, 0.05, 'sine', 0.05);
  },
};
