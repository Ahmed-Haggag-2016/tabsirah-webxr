/**
 * Tabsirah: The Architecture of Light & Order
 * 3D HRTF Spatial Audio Synthesizer & Calm English Voice Narrator
 * 100% procedural Web Audio API + window.speechSynthesis (zero external audio files).
 */

class SpatialAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneFilter = null;
    this.droneGain = null;
    this.oscillators = [];
    this.voiceGains = [];
    this.isMuted = false;
    this.isInitialized = false;
    this.currentScene = 'light';
    this.breathBoost = 0;

    this.scaleProfiles = {
      light: { freqs: [261.63, 392.0, 523.25], filterHz: 1100, gain: 0.036 },
      morphogenesis: { freqs: [196.0, 293.66, 440.0], filterHz: 820, gain: 0.04 },
      gravity: { freqs: [98.0, 146.83, 220.0], filterHz: 520, gain: 0.048 },
      abyss: { freqs: [65.41, 130.81, 196.0], filterHz: 340, gain: 0.05 },
      resonance: { freqs: [174.61, 261.63, 349.23], filterHz: 760, gain: 0.042 }
    };
  }

  ensureContext() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.value = 780;
      this.droneFilter.Q.value = 0.8;

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0.0001;
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      const profile = this.scaleProfiles[this.currentScene] || this.scaleProfiles.light;
      const waves = ['sine', 'triangle', 'sine'];

      profile.freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const vg = this.ctx.createGain();
        osc.type = waves[idx % waves.length];
        osc.frequency.value = freq;
        osc.detune.value = (idx - 1) * 3.0;
        vg.gain.value = idx === 0 ? 0.5 : 0.25;
        osc.connect(vg);
        vg.connect(this.droneFilter);
        osc.start();
        this.oscillators.push(osc);
        this.voiceGains.push(vg);
      });

      this.isInitialized = true;
      this.setScaleMood(this.currentScene);
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
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, now, 0.08);
    }
    return this.isMuted;
  }

  setScaleMood(sceneId) {
    this.currentScene = sceneId;
    if (!this.isInitialized || !this.ctx) return;

    const profile = this.scaleProfiles[sceneId] || this.scaleProfiles.light;
    const now = this.ctx.currentTime;
    this.oscillators.forEach((osc, idx) => {
      osc.frequency.setTargetAtTime(profile.freqs[idx] || profile.freqs[0], now, 0.65);
    });
    if (this.droneFilter) {
      this.droneFilter.frequency.setTargetAtTime(profile.filterHz, now, 0.65);
    }
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(profile.gain, now, 0.65);
    }
  }

  setBreathModulation(breathPhase01) {
    this.breathBoost = breathPhase01;
    if (!this.isInitialized || !this.ctx || this.currentScene !== 'resonance' || this.isMuted) return;
    const now = this.ctx.currentTime;
    const profile = this.scaleProfiles.resonance;
    if (this.droneFilter) {
      this.droneFilter.frequency.setTargetAtTime(profile.filterHz * (0.55 + breathPhase01 * 0.95), now, 0.12);
    }
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(profile.gain * (0.65 + breathPhase01 * 0.75), now, 0.12);
    }
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
    } else if (typeof L.setPosition === 'function') {
      L.setPosition(pos.x, pos.y, pos.z);
      L.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  playTone(freq, duration = 0.5, type = 'sine', peakGain = 0.06, delay = 0, spatialPos = null) {
    if (this.isMuted || !this.ensureContext()) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(peakGain, now + 0.025);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(env);
    if (spatialPos) {
      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1.2;
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

  playPrismShimmer(normAngle = 0.5, spatialPos = null) {
    const base = 523.25 + normAngle * 260;
    this.playTone(base, 0.35, 'sine', 0.032, 0, spatialPos);
    this.playTone(base * 1.5, 0.42, 'triangle', 0.018, 0.03, spatialPos);
  }

  playMorphogenPulse(spatialPos = null) {
    this.playTone(329.63, 0.42, 'sine', 0.05, 0, spatialPos);
    this.playTone(493.88, 0.55, 'triangle', 0.032, 0.06, spatialPos);
    this.playTone(659.25, 0.6, 'sine', 0.022, 0.12, spatialPos);
  }

  playGravityWellTone(massCount = 1, spatialPos = null) {
    const root = 110 * Math.pow(1.12246, Math.min(6, massCount));
    this.playTone(root, 0.75, 'sine', 0.065, 0, spatialPos);
    this.playTone(root * 1.5, 0.85, 'triangle', 0.036, 0.05, spatialPos);
  }

  playAbyssalPing(spatialPos = null) {
    this.playTone(440, 0.9, 'sine', 0.028, 0, spatialPos);
    this.playTone(659.25, 1.1, 'sine', 0.015, 0.09, spatialPos);
  }

  playTransition() {
    this.playTone(293.66, 0.38, 'sine', 0.038, 0);
    this.playTone(440.0, 0.48, 'triangle', 0.03, 0.08);
  }
}

class VoiceNarrator {
  constructor() {
    this.synth =
      typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentText = '';
    this.currentLabel = '';
    this.activeUtterance = null;

    if (this.synth) {
      this.pickVoice();
      if (typeof this.synth.addEventListener === 'function') {
        this.synth.addEventListener('voiceschanged', () => this.pickVoice());
      } else {
        this.synth.onvoiceschanged = () => this.pickVoice();
      }
    }
  }

  pickVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;
    const preferred = ['Google UK English Male', 'Daniel', 'Alex', 'Microsoft George', 'Google US English', 'Samantha'];
    for (const name of preferred) {
      const found = voices.find((v) => v.name.includes(name) && v.lang.startsWith('en'));
      if (found) {
        this.selectedVoice = found;
        return;
      }
    }
    this.selectedVoice =
      voices.find((v) => v.lang === 'en-GB' || v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
  }

  emitState() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('narrator-state-changed', {
        detail: {
          isSpeaking: this.isSpeaking,
          isPaused: this.isPaused,
          label: this.currentLabel
        }
      })
    );
  }

  speak(text, { label = 'Contemplation', rate = 0.92, pitch = 0.94, volume = 0.95 } = {}) {
    if (!text) return;
    this.currentText = text;
    this.currentLabel = label;

    if (!this.synth) {
      this.isSpeaking = false;
      this.isPaused = false;
      this.emitState();
      return;
    }

    this.synth.cancel();
    this.pickVoice();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) utterance.voice = this.selectedVoice;
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      if (this.activeUtterance !== utterance) return;
      this.isSpeaking = true;
      this.isPaused = false;
      this.emitState();
    };
    utterance.onpause = () => {
      if (this.activeUtterance !== utterance) return;
      this.isPaused = true;
      this.emitState();
    };
    utterance.onresume = () => {
      if (this.activeUtterance !== utterance) return;
      this.isPaused = false;
      this.emitState();
    };
    const finish = () => {
      if (this.activeUtterance !== utterance) return;
      this.isSpeaking = false;
      this.isPaused = false;
      this.activeUtterance = null;
      this.emitState();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    this.activeUtterance = utterance;
    this.isSpeaking = true;
    this.isPaused = false;
    this.emitState();
    this.synth.speak(utterance);
  }

  togglePlayPause(fallbackText, label = 'Contemplation') {
    if (!this.synth) return;
    if (this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.emitState();
    } else if (this.isSpeaking && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.emitState();
    } else {
      this.speak(fallbackText || this.currentText, { label });
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

export const spatialAudio = new SpatialAudioEngine();
export const narrator = new VoiceNarrator();

if (typeof window !== 'undefined') {
  window.tabsirahAudio = spatialAudio;
  window.tabsirahNarrator = narrator;
}

/**
 * Register Camera AudioListener Sync & Spatial Beacon A-Frame Components
 */
if (typeof AFRAME !== 'undefined') {
  const _listenerPos = new THREE.Vector3();
  const _listenerFwd = new THREE.Vector3();
  const _listenerUp = new THREE.Vector3();
  const _beaconPos = new THREE.Vector3();

  if (!AFRAME.components['audio-listener-sync']) {
    AFRAME.registerComponent('audio-listener-sync', {
      tick: function () {
        if (!spatialAudio.isInitialized) return;
        const obj = this.el.object3D;
        obj.getWorldPosition(_listenerPos);
        _listenerFwd.set(0, 0, -1).applyQuaternion(obj.quaternion).normalize();
        _listenerUp.set(0, 1, 0).applyQuaternion(obj.quaternion).normalize();
        spatialAudio.updateListener(_listenerPos, _listenerFwd, _listenerUp);
      }
    });
  }

  if (!AFRAME.components['spatial-beacon']) {
    AFRAME.registerComponent('spatial-beacon', {
      schema: {
        freq: { type: 'number', default: 261.63 },
        gain: { type: 'number', default: 0.012 },
        type: { type: 'string', default: 'sine' }
      },
      init: function () {
        this.osc = null;
        this.panner = null;
        this.beaconGain = null;
        this.started = false;
      },
      tryStart: function () {
        if (this.started || !spatialAudio.isInitialized || !spatialAudio.ctx) return;
        const ctx = spatialAudio.ctx;
        this.panner = ctx.createPanner();
        this.panner.panningModel = 'HRTF';
        this.panner.distanceModel = 'inverse';
        this.panner.refDistance = 1.0;

        this.beaconGain = ctx.createGain();
        this.beaconGain.gain.value = this.data.gain;

        this.osc = ctx.createOscillator();
        this.osc.type = this.data.type;
        this.osc.frequency.value = this.data.freq;

        this.osc.connect(this.beaconGain);
        this.beaconGain.connect(this.panner);
        this.panner.connect(spatialAudio.masterGain);
        this.osc.start();
        this.started = true;
      },
      tick: function () {
        if (!this.started) this.tryStart();
        if (this.panner && spatialAudio.ctx) {
          this.el.object3D.getWorldPosition(_beaconPos);
          this.panner.positionX.value = _beaconPos.x;
          this.panner.positionY.value = _beaconPos.y;
          this.panner.positionZ.value = _beaconPos.z;
        }
      },
      remove: function () {
        if (this.osc) {
          try {
            this.osc.stop();
            this.osc.disconnect();
          } catch {
            // ignore
          }
        }
        this.beaconGain?.disconnect();
        this.panner?.disconnect();
      }
    });
  }
}
