/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * 100% Procedural Web Audio Nature Soundscape Engine + Calm English Voice Narrator
 * Synthesizes filtered pink-noise ocean waves, leaf wind, rainfall, bird calls,
 * and ice-crystal chimes with zero external audio files.
 */

class NatureAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.noiseSource = null;
    this.noiseFilter = null;
    this.noiseGain = null;
    this.rainFilter = null;
    this.rainGain = null;
    this.lfo = null;
    this.lfoGain = null;

    this.isMuted = false;
    this.isInitialized = false;
    this.isStillness = false;
    this.currentBiome = 'aurora';
    this.rainIntensity = 0;
    this.solarElevation = 0.2;
    this.birdTimer = null;
    this.ambientTimer = null;
    this.wonderStep = 0;

    this.padOscs = [];
    this.padFilter = null;
    this.padGain = null;
    this.padLfo = null;
    this._fftBins = new Uint8Array(128);
    this._cymaticOut = { bass: 0, mid: 0, high: 0, overall: 0, peak: 0 };

    this.profiles = {
      aurora: {
        filterType: 'bandpass',
        freq: 340,
        Q: 1.8,
        gain: 0.032,
        lfoHz: 0.14,
        lfoDepth: 90,
        chords: [146.83, 220.0, 293.66, 440.0],
        scale: [293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]
      },
      rainforest: {
        filterType: 'bandpass',
        freq: 620,
        Q: 0.9,
        gain: 0.048,
        lfoHz: 0.22,
        lfoDepth: 140,
        chords: [196.0, 293.66, 392.0, 493.88],
        scale: [392.0, 440.0, 493.88, 587.33, 659.25, 783.99]
      },
      ocean: {
        filterType: 'lowpass',
        freq: 420,
        Q: 1.1,
        gain: 0.085,
        lfoHz: 0.13,
        lfoDepth: 230,
        chords: [130.81, 196.0, 261.63, 392.0],
        scale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
      },
      desert: {
        filterType: 'bandpass',
        freq: 460,
        Q: 1.5,
        gain: 0.042,
        lfoHz: 0.09,
        lfoDepth: 160,
        chords: [110.0, 164.81, 220.0, 329.63],
        scale: [220.0, 277.18, 293.66, 329.63, 440.0, 554.37]
      }
    };
  }

  createPinkNoiseBuffer(ctx) {
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  ensureContext() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.88;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.78;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      const pinkBuf = this.createPinkNoiseBuffer(this.ctx);

      // Ambient wind / ocean wave pink-noise channel
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = pinkBuf;
      this.noiseSource.loop = true;

      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = 'bandpass';
      this.noiseFilter.frequency.value = 420;
      this.noiseFilter.Q.value = 1.2;

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.value = 0.04;

      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.value = 0.15;
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 120;
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.noiseFilter.frequency);
      this.lfo.start();

      this.noiseSource.connect(this.noiseFilter);
      this.noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);
      this.noiseSource.start();

      // Secondary high-frequency rain shower channel
      const rainSrc = this.ctx.createBufferSource();
      rainSrc.buffer = pinkBuf;
      rainSrc.loop = true;
      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'highpass';
      this.rainFilter.frequency.value = 1650;
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.value = 0.0001;
      rainSrc.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);
      rainSrc.start();

      // Contemplative Harmonic Pad (silky low-passed breathing chord bed)
      this.padFilter = this.ctx.createBiquadFilter();
      this.padFilter.type = 'lowpass';
      this.padFilter.frequency.value = 640;
      this.padFilter.Q.value = 0.7;

      this.padGain = this.ctx.createGain();
      this.padGain.gain.value = this.isStillness ? 0.052 : 0.018;

      this.padLfo = this.ctx.createOscillator();
      this.padLfo.frequency.value = 0.08;
      const padLfoGain = this.ctx.createGain();
      padLfoGain.gain.value = 160;
      this.padLfo.connect(padLfoGain);
      padLfoGain.connect(this.padFilter.frequency);
      this.padLfo.start();

      const initChord = (this.profiles[this.currentBiome] || this.profiles.aurora).chords;
      this.padOscs = initChord.map((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const voiceGain = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (idx - 1.5) * 4.5;
        voiceGain.gain.value = idx === 0 ? 0.34 : 0.21;
        osc.connect(voiceGain);
        voiceGain.connect(this.padFilter);
        osc.start();
        return osc;
      });
      this.padFilter.connect(this.padGain);
      this.padGain.connect(this.masterGain);

      this.isInitialized = true;
      this.setBiomeMood(this.currentBiome);
      return true;
    } catch {
      return false;
    }
  }

  unlock() {
    this.ensureContext();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ensureContext() && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.88, now, 0.08);
    }
    return this.isMuted;
  }

  setStillnessMode(active) {
    this.isStillness = Boolean(active);
    if (!this.isInitialized || !this.ctx || !this.padGain || !this.padFilter) return;
    const now = this.ctx.currentTime;
    this.padGain.gain.setTargetAtTime(this.isStillness ? 0.052 : 0.018, now, 0.75);
    this.padFilter.frequency.setTargetAtTime(this.isStillness ? 920 : 620, now, 0.75);
  }

  setBiomeMood(biomeId) {
    this.currentBiome = biomeId;
    if (biomeId === 'rainforest') this.startBirdCalls();
    else this.stopBirdCalls();
    this.startAmbientMicroSounds();

    if (!this.isInitialized || !this.ctx) return;
    const p = this.profiles[biomeId] || this.profiles.aurora;
    const now = this.ctx.currentTime;
    this.noiseFilter.type = p.filterType;
    this.noiseFilter.frequency.setTargetAtTime(p.freq, now, 0.45);
    this.noiseFilter.Q.setTargetAtTime(p.Q, now, 0.45);
    this.noiseGain.gain.setTargetAtTime(p.gain, now, 0.45);
    this.lfo.frequency.setTargetAtTime(p.lfoHz, now, 0.45);
    this.lfoGain.gain.setTargetAtTime(p.lfoDepth, now, 0.45);

    if (this.padOscs.length && p.chords) {
      this.padOscs.forEach((osc, idx) => {
        const f = p.chords[idx % p.chords.length];
        osc.frequency.setTargetAtTime(f, now, 0.65);
      });
    }

    this.setRainIntensity(biomeId === 'rainforest' ? this.rainIntensity : 0);
  }

  startAmbientMicroSounds() {
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    const schedule = () => {
      if (!this.isMuted && this.isInitialized && this.ctx) {
        const b = this.currentBiome;
        const x = (Math.random() - 0.5) * 6;
        if (b === 'aurora') {
          this.playIceChime({ x, y: 3.0, z: -5 });
        } else if (b === 'ocean') {
          this.playWhaleCall({ x, y: 1.8, z: -6 });
        } else if (b === 'desert') {
          this.playWonderRipple('desert', { x, y: 1.5, z: -4 });
        }
      }
      this.ambientTimer = window.setTimeout(schedule, 6500 + Math.random() * 6500);
    };
    this.ambientTimer = window.setTimeout(schedule, 4200);
  }

  setRainIntensity(amount) {
    this.rainIntensity = Math.max(0, Math.min(1, amount));
    if (!this.isInitialized || !this.ctx || !this.rainGain) return;
    const now = this.ctx.currentTime;
    this.rainGain.gain.setTargetAtTime(0.0001 + this.rainIntensity * 0.095, now, 0.25);
  }

  setSolarElevation(elev) {
    this.solarElevation = elev;
    if (!this.isInitialized || !this.ctx || !this.noiseFilter) return;
    if (this.currentBiome === 'desert') {
      const windShift = 280 + Math.max(0, elev + 0.2) * 380;
      this.noiseFilter.frequency.setTargetAtTime(windShift, this.ctx.currentTime, 0.15);
    }
  }

  setZoomDepth(zoom) {
    if (!this.isInitialized || !this.ctx || !this.noiseFilter) return;
    const baseProfile = this.profiles[this.currentBiome] || this.profiles.aurora;
    // Zoom Out (zoom < 0): deeper wide atmospheric wind; Zoom In (zoom > 0): crisp micro clarity
    const multiplier = zoom >= 0 ? 1 + zoom * 0.45 : 1 + zoom * 0.35;
    const freq = Math.max(160, Math.min(1800, baseProfile.freq * multiplier));
    this.noiseFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.2);
  }

  startBirdCalls() {
    if (this.birdTimer) return;
    const schedule = () => {
      if (this.currentBiome !== 'rainforest') {
        this.birdTimer = null;
        return;
      }
      if (!this.isMuted && this.isInitialized && this.ctx) {
        this.playSpatialBirdCall({
          x: (Math.random() - 0.5) * 6,
          y: 2.2 + Math.random() * 1.8,
          z: -2.0 - Math.random() * 3.5
        });
      }
      this.birdTimer = window.setTimeout(schedule, 3200 + Math.random() * 4200);
    };
    this.birdTimer = window.setTimeout(schedule, 1600);
  }

  stopBirdCalls() {
    if (this.birdTimer) {
      clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }
  }

  playSpatialBirdCall(pos = { x: 1.5, y: 2.8, z: -3 }) {
    if (this.isMuted || !this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.refDistance = 1.4;
    panner.positionX.value = pos.x;
    panner.positionY.value = pos.y;
    panner.positionZ.value = pos.z;
    panner.connect(this.masterGain);

    // 3-note melodic chirp motif
    [0, 0.13, 0.28].forEach((offset, i) => {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      const baseF = 1950 + i * 260 + Math.random() * 180;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseF, now + offset);
      osc.frequency.exponentialRampToValueAtTime(baseF * 1.32, now + offset + 0.08);
      env.gain.setValueAtTime(0.0001, now + offset);
      env.gain.exponentialRampToValueAtTime(0.025, now + offset + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.11);
      osc.connect(env);
      env.connect(panner);
      osc.start(now + offset);
      osc.stop(now + offset + 0.14);
    });
  }

  playTone(freq, duration = 0.45, type = 'sine', peakGain = 0.05, delay = 0, spatialPos = null) {
    if (this.isMuted || !this.ensureContext()) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(peakGain, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env);
    if (spatialPos) {
      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.positionX.value = spatialPos.x;
      panner.positionY.value = spatialPos.y;
      panner.positionZ.value = spatialPos.z;
      env.connect(panner);
      panner.connect(this.masterGain);
    } else {
      env.connect(this.masterGain);
    }
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  playWhaleCall(spatialPos = null) {
    if (this.isMuted || !this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(118, now + 1.35);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.032, now + 0.28);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
    osc.connect(env);
    if (spatialPos) {
      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.positionX.value = spatialPos.x;
      panner.positionY.value = spatialPos.y;
      panner.positionZ.value = spatialPos.z;
      env.connect(panner);
      panner.connect(this.masterGain);
    } else {
      env.connect(this.masterGain);
    }
    osc.start(now);
    osc.stop(now + 1.5);
  }

  playWonderRipple(biomeId = null, spatialPos = null) {
    const profile = this.profiles[biomeId || this.currentBiome] || this.profiles.aurora;
    const scale = profile.scale;
    const note = scale[this.wonderStep % scale.length];
    this.wonderStep = (this.wonderStep + 1 + Math.floor(Math.random() * 2)) % scale.length;
    this.playTone(note, 0.9, 'sine', 0.034, 0, spatialPos);
    this.playTone(note * 1.5, 1.05, 'triangle', 0.015, 0.06, spatialPos);
  }

  playIceChime(spatialPos = null) {
    const scale = [1046.5, 1174.66, 1318.51, 1567.98];
    const f = scale[Math.floor(Math.random() * scale.length)];
    this.playTone(f, 0.55, 'sine', 0.03, 0, spatialPos);
    this.playTone(f * 1.5, 0.65, 'triangle', 0.016, 0.04, spatialPos);
  }

  playBubbleCluster(spatialPos = null) {
    [0, 0.07, 0.15].forEach((d, idx) => {
      this.playTone(340 + idx * 140 + Math.random() * 90, 0.16, 'sine', 0.028, d, spatialPos);
    });
  }

  playTectonicResonance() {
    this.playTone(98.0, 0.85, 'sine', 0.07, 0);
    this.playTone(146.83, 0.95, 'triangle', 0.04, 0.06);
  }

  playTransition() {
    this.playTone(293.66, 0.35, 'sine', 0.036, 0);
    this.playTone(440.0, 0.45, 'triangle', 0.028, 0.07);
  }

  playPrismShimmer(normAngle = 0.5, spatialPos = null) {
    const base = 523.25 + normAngle * 260;
    this.playTone(base, 0.36, 'sine', 0.03, 0, spatialPos);
    this.playTone(base * 1.5, 0.44, 'triangle', 0.016, 0.03, spatialPos);
  }

  playMorphogenPulse(spatialPos = null) {
    this.playTone(329.63, 0.42, 'sine', 0.044, 0, spatialPos);
    this.playTone(493.88, 0.55, 'triangle', 0.028, 0.06, spatialPos);
    this.playTone(659.25, 0.62, 'sine', 0.02, 0.12, spatialPos);
  }

  playAbyssalPing(spatialPos = null) {
    this.playTone(440.0, 0.85, 'sine', 0.026, 0, spatialPos);
    this.playTone(659.25, 1.05, 'sine', 0.014, 0.09, spatialPos);
  }

  playCoronalBurst(spatialPos = null) {
    [293.66, 440.0, 587.33, 880.0, 1174.66].forEach((freq, i) => {
      this.playTone(freq, 1.15 - i * 0.1, i % 2 === 0 ? 'sine' : 'triangle', 0.034, i * 0.07, spatialPos);
    });
  }

  playAquiferGeyser(spatialPos = null) {
    [220.0, 329.63, 440.0, 659.25].forEach((freq, i) => {
      this.playTone(freq, 0.75, 'sine', 0.034, i * 0.08, spatialPos);
    });
  }

  playReefCelebration(spatialPos = null) {
    [261.63, 329.63, 392.0, 523.25, 659.25].forEach((freq, i) => {
      this.playTone(freq, 0.85, 'triangle', 0.028, i * 0.065, spatialPos);
    });
  }

  playEagleCall(spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2600, now);
    osc.frequency.exponentialRampToValueAtTime(1420, now + 0.42);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.value = 2.8;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);

    if (spatialPos) {
      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.positionX.value = spatialPos.x;
      panner.positionY.value = spatialPos.y;
      panner.positionZ.value = spatialPos.z;
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }
    osc.start(now);
    osc.stop(now + 0.48);
  }

  playMarmotWhistle(spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    [0, 0.14].forEach((delay, idx) => {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const f = idx === 0 ? 3200 : 3480;
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.92, now + 0.09);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.038, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      if (spatialPos) {
        const panner = this.ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.positionX.value = spatialPos.x;
        panner.positionY.value = spatialPos.y;
        panner.positionZ.value = spatialPos.z;
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }
      osc.start(now);
      osc.stop(now + 0.1);
    });
  }

  /**
   * Biome-Adaptive Procedural Tactile Touch Audio Signature
   */
  playTactileSignature(biomeId = 'aurora', spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

    if (biomeId === 'aurora') {
      // Crystalline ice-bell harmonics
      const root = [1046.5, 1174.66, 1318.51][Math.floor(Math.random() * 3)];
      this.playTone(root, 0.68, 'sine', 0.036, 0, spatialPos);
      this.playTone(root * 1.5, 0.82, 'triangle', 0.018, 0.035, spatialPos);
      this.playTone(root * 2.0, 0.55, 'sine', 0.012, 0.075, spatialPos);
    } else if (biomeId === 'rainforest') {
      // Marimba-like water-droplet resonance
      const base = [392.0, 440.0, 523.25][Math.floor(Math.random() * 3)];
      this.playTone(base, 0.24, 'sine', 0.042, 0, spatialPos);
      this.playTone(base * 2.0, 0.18, 'triangle', 0.02, 0.02, spatialPos);
      this.playTone(base * 3.0, 0.32, 'sine', 0.016, 0.065, spatialPos);
    } else if (biomeId === 'ocean') {
      // Deep underwater sonar chime + soft bubble cluster
      this.playTone(220.0, 0.78, 'sine', 0.038, 0, spatialPos);
      this.playTone(440.0, 0.92, 'sine', 0.022, 0.06, spatialPos);
      this.playBubbleCluster(spatialPos);
    } else if (biomeId === 'desert') {
      // Warm Hijaz/pentatonic oud-style plucked harmonics + golden sand shimmer
      this.playTone(293.66, 0.52, 'triangle', 0.038, 0, spatialPos);
      this.playTone(369.99, 0.58, 'sine', 0.024, 0.04, spatialPos);
      this.playTone(587.33, 0.65, 'sine', 0.016, 0.09, spatialPos);
    } else {
      this.playTone(523.25, 0.55, 'sine', 0.032, 0, spatialPos);
    }
  }

  /**
   * Plays a harmonic note along the active biome's musical scale (for Wonder Brush trails)
   */
  playWonderScaleNote(biomeId = 'aurora', pitchNorm = 0.5, spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const profile = this.profiles[biomeId] || this.profiles.aurora;
    const scale = profile.scale || [293.66, 392.0, 440.0, 523.25, 659.25];
    const clamped = Math.max(0, Math.min(0.999, pitchNorm));
    const idx = Math.floor(clamped * scale.length);
    const freq = scale[idx];
    this.playTone(freq, 0.42, 'sine', 0.024, 0, spatialPos);
    this.playTone(freq * 1.5, 0.34, 'triangle', 0.009, 0.025, spatialPos);
  }

  /**
   * Plays the grand polyphonic 4-biome convergence chord
   */
  playConvergenceChord() {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const notes = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33, 659.25, 880.0];
    notes.forEach((freq, i) => {
      this.playTone(freq, 1.65 + i * 0.15, i % 2 === 0 ? 'sine' : 'triangle', 0.026, i * 0.075);
    });
  }

  playOwlHoot(spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    // Soft double-hoot of Bubo scandiacus (Snowy Owl)
    [0, 0.34].forEach((offset, idx) => {
      const now = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      const base = idx === 0 ? 315 : 292;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 0.88, now + 0.24);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.042, now + 0.045);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc.connect(env);
      if (spatialPos) {
        const panner = this.ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.positionX.value = spatialPos.x;
        panner.positionY.value = spatialPos.y;
        panner.positionZ.value = spatialPos.z;
        env.connect(panner);
        panner.connect(this.masterGain);
      } else {
        env.connect(this.masterGain);
      }
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  playNarwhalSonar(spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    // Arctic cetacean echolocation click train + resonant arctic harmonic
    for (let i = 0; i < 6; i++) {
      this.playTone(1480 + i * 190, 0.055, 'triangle', 0.022, i * 0.045, spatialPos);
    }
    this.playWhaleCall(spatialPos);
  }

  playFrogAndToucan(spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    // Dart-frog chirps + rainforest marimba droplet triad
    [0, 0.09, 0.22].forEach((d, idx) => {
      this.playTone(960 + idx * 240, 0.085, 'sine', 0.028, d, spatialPos);
    });
    this.playTone(392.0, 0.26, 'triangle', 0.032, 0.32, spatialPos);
    this.playTone(587.33, 0.32, 'sine', 0.024, 0.38, spatialPos);
  }

  playHydrothermalRumble(spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    this.playTone(74.0, 1.05, 'sine', 0.058, 0, spatialPos);
    this.playTone(110.0, 0.85, 'triangle', 0.032, 0.05, spatialPos);
    this.playBubbleCluster(spatialPos);
  }

  playDesertCrystalChime(spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    [880.0, 1108.73, 1318.51, 1760.0].forEach((f, i) => {
      this.playTone(f, 0.85 - i * 0.08, i % 2 === 0 ? 'sine' : 'triangle', 0.026, i * 0.055, spatialPos);
    });
  }

  playAeolianWindHarp(spatialPos = null) {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    // Hijaz / sunlit desert wind-harp cascade
    [293.66, 369.99, 440.0, 554.37, 587.33, 739.99].forEach((f, i) => {
      this.playTone(f, 0.95, 'triangle', 0.028, i * 0.07, spatialPos);
    });
  }

  playBiome360Symphony(biomeId = 'aurora') {
    this.unlock();
    if (this.isMuted || !this.isInitialized || !this.ctx) return;
    const p = this.profiles[biomeId] || this.profiles.aurora;
    const notes = [...(p.chords || [220, 330, 440]), ...(p.scale?.slice(0, 4) || [523.25, 659.25])];
    notes.forEach((f, i) => {
      this.playTone(f, 1.25 + i * 0.08, i % 2 === 0 ? 'sine' : 'triangle', 0.024, i * 0.08);
    });
  }

  /**
   * Modulates ambient harmonic pad brightness & swell from real-time mic breath energy
   */
  setBreathHarmonicBoost(level = 0) {
    if (!this.isInitialized || !this.ctx || !this.padGain || !this.padFilter) return;
    const now = this.ctx.currentTime;
    const baseGain = this.isStillness ? 0.048 : 0.018;
    const baseFreq = this.isStillness ? 840 : 620;
    const clamped = Math.max(0, Math.min(1, level));
    this.padGain.gain.setTargetAtTime(baseGain + clamped * 0.055, now, 0.12);
    this.padFilter.frequency.setTargetAtTime(baseFreq + clamped * 680, now, 0.12);
  }

  updateListener(pos, forward, up) {
    if (!this.isInitialized || !this.ctx || !this.ctx.listener) return;
    const L = this.ctx.listener;
    if (L.positionX) {
      L.positionX.value = pos.x;
      L.positionY.value = pos.y;
      L.positionZ.value = pos.z;
      L.forwardX.value = forward.x;
      L.forwardY.value = forward.y;
      L.forwardZ.value = forward.z;
      L.upX.value = up.x;
      L.upY.value = up.y;
      L.upZ.value = up.z;
    }
  }

  sampleCymaticBands() {
    const out = this._cymaticOut;
    let bass = 0;
    let mid = 0;
    let high = 0;
    let peak = 0;

    if (this.isInitialized && this.analyser && !this.isMuted && this._fftBins) {
      this.analyser.getByteFrequencyData(this._fftBins);
      const len = Math.min(this.analyser.frequencyBinCount || 64, this._fftBins.length);

      let bSum = 0;
      let bCnt = 0;
      let mSum = 0;
      let mCnt = 0;
      let hSum = 0;
      let hCnt = 0;

      for (let i = 1; i < len; i++) {
        const v = this._fftBins[i] / 255.0;
        if (v > peak) peak = v;
        if (i <= 7) {
          bSum += v;
          bCnt++;
        } else if (i <= 24) {
          mSum += v;
          mCnt++;
        } else if (i <= 56) {
          hSum += v;
          hCnt++;
        }
      }

      bass = bCnt > 0 ? Math.min(1, (bSum / bCnt) * 1.45) : 0;
      mid = mCnt > 0 ? Math.min(1, (mSum / mCnt) * 1.65) : 0;
      high = hCnt > 0 ? Math.min(1, (hSum / hCnt) * 2.0) : 0;
    }

    const micLvl =
      typeof window !== 'undefined' && typeof window.tabsirahMicBreathLevel === 'number'
        ? window.tabsirahMicBreathLevel
        : 0;
    if (micLvl > 0.01) {
      bass = Math.min(1, Math.max(bass, micLvl * 0.92));
      mid = Math.min(1, Math.max(mid, micLvl * 0.65));
    }

    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking && mid < 0.25) {
      mid = Math.max(mid, 0.34);
    }

    const overall = Math.min(1, bass * 0.44 + mid * 0.34 + high * 0.22);
    out.bass = bass;
    out.mid = mid;
    out.high = high;
    out.overall = overall;
    out.peak = Math.max(peak, micLvl);
    return out;
  }
}

class NatureVoiceNarrator {
  constructor() {
    this.synth =
      typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentText = '';
    this.activeUtterance = null;
    if (this.synth) {
      this.pickVoice();
      this.synth.addEventListener?.('voiceschanged', () => this.pickVoice());
    }
  }

  pickVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices?.length) return;
    const preferred = ['Google UK English Male', 'Daniel', 'Alex', 'Microsoft George', 'Google US English', 'Samantha'];
    for (const name of preferred) {
      const v = voices.find((item) => item.name.includes(name) && item.lang.startsWith('en'));
      if (v) {
        this.selectedVoice = v;
        return;
      }
    }
    this.selectedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
  }

  emitState() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('narrator-state-changed', {
        detail: { isSpeaking: this.isSpeaking, isPaused: this.isPaused }
      })
    );
  }

  speak(text, { rate = 0.92, pitch = 0.94, volume = 0.95 } = {}) {
    if (!text) return;
    this.currentText = text;
    if (!this.synth) return;
    this.synth.cancel();
    this.pickVoice();

    const u = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) u.voice = this.selectedVoice;
    u.lang = 'en-US';
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    u.onstart = () => {
      if (this.activeUtterance !== u) return;
      this.isSpeaking = true;
      this.isPaused = false;
      this.emitState();
    };
    u.onpause = () => {
      if (this.activeUtterance !== u) return;
      this.isPaused = true;
      this.emitState();
    };
    u.onresume = () => {
      if (this.activeUtterance !== u) return;
      this.isPaused = false;
      this.emitState();
    };
    const done = () => {
      if (this.activeUtterance !== u) return;
      this.isSpeaking = false;
      this.isPaused = false;
      this.activeUtterance = null;
      this.emitState();
    };
    u.onend = done;
    u.onerror = done;

    this.activeUtterance = u;
    this.isSpeaking = true;
    this.isPaused = false;
    this.emitState();
    this.synth.speak(u);
  }

  pause() {
    if (!this.synth || !this.isSpeaking || this.isPaused) return;
    this.synth.pause();
    this.isPaused = true;
    this.emitState();
  }

  resume() {
    if (!this.synth || !this.isSpeaking || !this.isPaused) return;
    this.synth.resume();
    this.isPaused = false;
    this.emitState();
  }

  togglePlayPause(fallbackText) {
    if (!this.synth) return;
    if (this.isSpeaking && !this.isPaused) {
      this.pause();
    } else if (this.isSpeaking && this.isPaused) {
      this.resume();
    } else {
      this.speak(fallbackText || this.currentText);
    }
  }

  stop() {
    this.activeUtterance = null;
    if (this.synth) this.synth.cancel();
    this.isSpeaking = false;
    this.isPaused = false;
    this.emitState();
  }
}

export const natureAudio = new NatureAudioEngine();
export const natureNarrator = new NatureVoiceNarrator();

if (typeof AFRAME !== 'undefined' && !AFRAME.components['nature-audio-listener']) {
  const _pos = new THREE.Vector3();
  const _fwd = new THREE.Vector3();
  const _up = new THREE.Vector3();
  AFRAME.registerComponent('nature-audio-listener', {
    tick: function () {
      if (!natureAudio.isInitialized) return;
      const obj = this.el.object3D;
      obj.getWorldPosition(_pos);
      _fwd.set(0, 0, -1).applyQuaternion(obj.quaternion).normalize();
      _up.set(0, 1, 0).applyQuaternion(obj.quaternion).normalize();
      natureAudio.updateListener(_pos, _fwd, _up);
    }
  });
}
