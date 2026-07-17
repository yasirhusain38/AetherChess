"use client";

let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.04) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(c.destination);
  const now = c.currentTime;
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

export type SoundEvent = "move" | "capture" | "check" | "castle" | "gameEnd" | "error" | "success";

export function playSound(event: SoundEvent, enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  try {
    void getCtx()?.resume();
    switch (event) {
      case "move":
        tone(380, 0.06, "triangle", 0.03);
        break;
      case "capture":
        tone(220, 0.08, "square", 0.03);
        tone(160, 0.1, "triangle", 0.025);
        break;
      case "check":
        tone(520, 0.07, "sine", 0.04);
        tone(680, 0.09, "sine", 0.03);
        break;
      case "castle":
        tone(300, 0.05, "triangle", 0.03);
        tone(420, 0.07, "triangle", 0.03);
        break;
      case "gameEnd":
        tone(440, 0.1, "sine", 0.04);
        tone(554, 0.12, "sine", 0.035);
        tone(659, 0.18, "sine", 0.03);
        break;
      case "error":
        tone(140, 0.12, "sawtooth", 0.03);
        break;
      case "success":
        tone(523, 0.08, "sine", 0.035);
        tone(659, 0.12, "sine", 0.03);
        break;
    }
  } catch {
    // ignore autoplay restrictions
  }
}

export function soundFromSan(san: string, enabled = true) {
  if (san.includes("x")) playSound("capture", enabled);
  else if (san.includes("O-O")) playSound("castle", enabled);
  else if (san.includes("+") || san.includes("#")) playSound("check", enabled);
  else playSound("move", enabled);
}
