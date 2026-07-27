import { useAppStore } from "../store/useAppStore";

let audioCtx: AudioContext | null = null;

function unlockAudioContext() {
  if (typeof window === "undefined") return;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

if (typeof window !== "undefined") {
  const events = ["click", "pointerdown", "keydown"];
  const unlock = () => {
    unlockAudioContext();
    if (audioCtx && audioCtx.state === "running") {
      events.forEach((evt) => window.removeEventListener(evt, unlock));
    }
  };
  events.forEach((evt) => window.addEventListener(evt, unlock, { passive: true }));
}

function getAudioContext(): AudioContext | null {
  unlockAudioContext();
  return audioCtx;
}

export type RetroSoundType = "hover" | "click" | "success" | "error" | "achievement" | "startup";

export function playRetroSound(type: RetroSoundType) {
  // Check if retro sounds are enabled in store
  const enabled = useAppStore.getState().retroSoundsEnabled;
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    if (type === "hover") {
      // Crisp pleasant click/blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "click") {
      // Classic 8-bit action click arpeggio
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(450, now + 0.04);
      osc.frequency.setValueAtTime(600, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "success") {
      // Happy retro chime (C5 -> E5 -> G5)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const duration = 0.09;

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + duration);
      });
    } else if (type === "error") {
      // Low descending buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "achievement") {
      // Level up fan-fare
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      const duration = 0.12;

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === notes.length - 1 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + (idx === notes.length - 1 ? 0.3 : duration));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + (idx === notes.length - 1 ? 0.3 : duration));
      });
    } else if (type === "startup") {
      // Boot-up welcome chime — ethereal ascending arpeggio
      const notes = [196.00, 261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx < 3 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, noteTime);

        const noteDuration = idx === notes.length - 1 ? 0.4 : 0.14;
        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + noteDuration);
      });
    }
  } catch (e) {
    console.error("Failed to play retro sound", e);
  }
}
