const hoverCues = new Set([
      "poster-hover",
      "nav-hover",
      "suggestion-hover",
]);

let audioContext = null;
let masterGain = null;
let lastHoverAt = 0;

function getAudioContext() {
      if (typeof window === "undefined") return null;

      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) return null;

      if (!audioContext || audioContext.state === "closed") {
            audioContext = new AudioContextConstructor();

            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -22;
            compressor.knee.value = 18;
            compressor.ratio.value = 4;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.16;

            masterGain = audioContext.createGain();
            masterGain.gain.value = 0.78;
            masterGain.connect(compressor);
            compressor.connect(audioContext.destination);
      }

      return audioContext;
}

function playTone(context, frequency, settings, volume) {
      const {
            start = context.currentTime,
            duration = 0.12,
            endFrequency = frequency,
            waveform = "sine",
            peak = 0.06,
      } = settings;

      const oscillator = context.createOscillator();
      const envelope = context.createGain();

      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, start);

      if (endFrequency !== frequency) {
            oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
      }

      const attack = Math.min(0.012, duration * 0.3);

      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * volume), start + attack);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(envelope);
      envelope.connect(masterGain);

      oscillator.onended = () => {
            oscillator.disconnect();
            envelope.disconnect();
      };

      oscillator.start(start);
      oscillator.stop(start + duration + 0.015);
}

function playSoftTap(context, start, volume, peak = 0.018) {
      const duration = 0.024;
      const length = Math.max(1, Math.floor(context.sampleRate * duration));
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const samples = buffer.getChannelData(0);

      for (let i = 0; i < length; i += 1) {
            const fade = Math.pow(1 - i / length, 3);
            samples[i] = (Math.random() * 2 - 1) * fade;
      }

      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();

      filter.type = "lowpass";
      filter.frequency.value = 2400;

      envelope.gain.setValueAtTime(Math.max(0.0001, peak * volume), start);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      source.buffer = buffer;
      source.connect(filter);
      filter.connect(envelope);
      envelope.connect(masterGain);

      source.onended = () => {
            source.disconnect();
            filter.disconnect();
            envelope.disconnect();
      };

      source.start(start);
      source.stop(start + duration);
}

const cues = {
      "poster-hover": (context, time, volume) => {
            playTone(context, 560, {
                  start: time,
                  duration: 0.11,
                  endFrequency: 790,
                  peak: 0.072,
            }, volume);

            playTone(context, 980, {
                  start: time + 0.025,
                  duration: 0.075,
                  peak: 0.02,
            }, volume);
      },

      "poster-select": (context, time, volume) => {
            playSoftTap(context, time, volume, 0.019);

            playTone(context, 392, {
                  start: time,
                  duration: 0.13,
                  waveform: "triangle",
                  peak: 0.075,
            }, volume);

            playTone(context, 587, {
                  start: time + 0.032,
                  duration: 0.14,
                  peak: 0.037,
            }, volume);
      },

      "nav-hover": (context, time, volume) => {
            playTone(context, 735, {
                  start: time,
                  duration: 0.07,
                  endFrequency: 810,
                  peak: 0.034,
            }, volume);
      },

      "nav-select": (context, time, volume) => {
            playSoftTap(context, time, volume, 0.012);

            playTone(context, 523, {
                  start: time,
                  duration: 0.11,
                  peak: 0.061,
            }, volume);

            playTone(context, 784, {
                  start: time + 0.04,
                  duration: 0.12,
                  peak: 0.032,
            }, volume);
      },

      "search-open": (context, time, volume) => {
            playTone(context, 440, {
                  start: time,
                  duration: 0.14,
                  endFrequency: 659,
                  peak: 0.053,
            }, volume);

            playTone(context, 880, {
                  start: time + 0.05,
                  duration: 0.08,
                  peak: 0.021,
            }, volume);
      },

      "search-close": (context, time, volume) => {
            playTone(context, 659, {
                  start: time,
                  duration: 0.14,
                  endFrequency: 440,
                  peak: 0.048,
            }, volume);

            playTone(context, 523, {
                  start: time + 0.025,
                  duration: 0.085,
                  peak: 0.018,
            }, volume);
      },

      "suggestion-hover": (context, time, volume) => {
            playTone(context, 900, {
                  start: time,
                  duration: 0.055,
                  endFrequency: 1020,
                  peak: 0.045,
            }, volume);
      },

      "result-select": (context, time, volume) => {
            playSoftTap(context, time, volume, 0.014);

            playTone(context, 440, {
                  start: time,
                  duration: 0.095,
                  peak: 0.06,
            }, volume);

            playTone(context, 660, {
                  start: time + 0.035,
                  duration: 0.13,
                  peak: 0.035,
            }, volume);
      },

      "cast-select": (context, time, volume) => {
            playSoftTap(context, time, volume, 0.013);

            playTone(context, 554, {
                  start: time,
                  duration: 0.095,
                  waveform: "triangle",
                  peak: 0.055,
            }, volume);

            playTone(context, 831, {
                  start: time + 0.028,
                  duration: 0.07,
                  peak: 0.018,
            }, volume);
      },

      "review-focus": (context, time, volume) => {
            playTone(context, 350, {
                  start: time,
                  duration: 0.13,
                  endFrequency: 294,
                  peak: 0.035,
            }, volume);
      },

      "season-select": (context, time, volume) => {
            playTone(context, 392, {
                  start: time,
                  duration: 0.17,
                  peak: 0.052,
            }, volume);

            playTone(context, 523, {
                  start: time + 0.028,
                  duration: 0.15,
                  peak: 0.035,
            }, volume);

            playTone(context, 659, {
                  start: time + 0.06,
                  duration: 0.18,
                  peak: 0.026,
            }, volume);
      },

      "carousel-select": (context, time, volume) => {
            playTone(context, 466, {
                  start: time,
                  duration: 0.10,
                  peak: 0.055,
            }, volume);

            playTone(context, 698, {
                  start: time + 0.035,
                  duration: 0.12,
                  peak: 0.03,
            }, volume);
      },

      "shelf-select": (context, time, volume) => {
            playTone(context, 370, {
                  start: time,
                  duration: 0.12,
                  peak: 0.048,
            }, volume);

            playTone(context, 554, {
                  start: time + 0.04,
                  duration: 0.10,
                  peak: 0.025,
            }, volume);
      },
};

export function playSound(name, options = {}) {
      const cue = cues[name];
      if (!cue) return;

      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
            return;
      }

      const settings = options && typeof options === "object" ? options : {};
      const volume = Number.isFinite(settings.volume)
            ? Math.max(0, Math.min(1, settings.volume))
            : 1;

      if (volume === 0) return;

      if (hoverCues.has(name)) {
            const now = Date.now();
            if (now - lastHoverAt < 85) return;
            lastHoverAt = now;
      }

      const context = getAudioContext();
      if (!context || !masterGain) return;

      if (context.state !== "running") {
            context.resume()
                  .then(() => {
                        if (context.state === "running") {
                              cue(context, context.currentTime, volume);
                        }
                  })
                  .catch(() => {});
            return;
      }

      cue(context, context.currentTime, volume);
}