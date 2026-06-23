// 8-Bit Retro sound synthesizer using Web Audio API
// No assets required, lightweight, pure retro bleeps and bloops

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = (type: "move" | "capture" | "check" | "victory" | "defeat" | "click") => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (type) {
      case "click": {
        // Light retro click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case "move": {
        // NES style wood move sound - short low-pass triangle
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(120, now + 0.04);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }
      case "capture": {
        // Sharp explosion/noise burst capture sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "square";
        osc1.frequency.setValueAtTime(300, now);
        osc1.frequency.linearRampToValueAtTime(80, now + 0.12);

        osc2.type = "sawtooth";
        osc2.frequency.setValueAtTime(450, now);
        osc2.frequency.linearRampToValueAtTime(120, now + 0.12);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
        break;
      }
      case "check": {
        // Double warning beeps
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(500, now + 0.08);
        osc.frequency.setValueAtTime(650, now + 0.16);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.01, now + 0.07);
        gain.gain.setValueAtTime(0.15, now + 0.08);
        gain.gain.setValueAtTime(0.01, now + 0.15);
        gain.gain.setValueAtTime(0.18, now + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case "victory": {
        // Ascending major chord retro arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major notes
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + index * 0.08);

          gain.gain.setValueAtTime(0.1, now + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + index * 0.08);
          osc.stop(now + index * 0.08 + 0.3);
        });
        break;
      }
      case "defeat": {
        // Descending sad retro sound
        const notes = [587.33, 554.37, 523.25, 440.00, 392.00, 349.23, 293.66]; // Sad minor progression
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + index * 0.12);

          gain.gain.setValueAtTime(0.1, now + index * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + index * 0.12);
          osc.stop(now + index * 0.12 + 0.35);
        });
        break;
      }
    }
  } catch (error) {
    console.warn("AudioContext failed to trigger:", error);
  }
};
