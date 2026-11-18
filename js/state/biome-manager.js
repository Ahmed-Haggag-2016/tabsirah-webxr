/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * State Manager orchestrating 4 procedural WebXR biomes,
 * 4-stage Explore -> Discover -> Understand -> Reflect progression,
 * 3D spatial discovery beacons, Living Revelation toggles,
 * Real-World Video/Photo Field Drawer, Guided Journey controls,
 * Meta Quest hand interactions, and voice narration.
 */

import { EARTH_BIOMES_DATA, BIOME_ORDER } from '../config/earth-biomes-data.js';
import { natureAudio, natureNarrator } from '../components/nature-audio.js';
import '../components/nature-shaders.js';
import '../components/biome-generators.js';
import '../components/particle-system.js';
import '../components/zoom-detail-system.js';
import '../components/vr-spatial-console.js';
import '../components/gesture-scale-manager.js';
import '../components/wow-mechanics.js';
import '../components/scientific-telemetry.js';
import '../components/wow-postprocessing.js';
import '../components/spatial-discovery.js';
import '../components/light-optics.js';
import '../components/sacred-dynamics.js';
import '../components/tactile-touch-fx.js';
import '../components/webxr-beacon-haptics.js';
import '../components/wrist-flip-quick-menu.js';
import { LAB_SPECIMENS } from '../components/spatial-lab.js';
import '../components/expedition-play.js';
import '../components/grand-prize-upgrade.js';
import { BIOME_360_SITES } from '../components/biome-360-enrichments.js';
import { BIOME_VISTAS, BIOME_WONDER_PROPS } from '../components/expedition-play.js';
import { micBreathMonitor } from '../components/grand-prize-features.js';
import { discoveryJournal } from './discovery-journal.js';
import {
  ecosystemEngine,
  ECOSYSTEM_EXPERIMENTS,
  TIME_HORIZONS,
  ECOSYSTEM_MODEL_DISCLAIMER
} from './ecosystem-engine.js';
import { askNatureCompanion, COMPANION_QUICK_PROMPTS } from '../components/nature-companion.js';

if (typeof window !== 'undefined') {
  if (typeof window.tabsirahTimeScale !== 'number') window.tabsirahTimeScale = 1.0;
  if (typeof window.tabsirahActiveBiome !== 'string') window.tabsirahActiveBiome = 'aurora';
  if (typeof window.tabsirahBreathPhase !== 'number') window.tabsirahBreathPhase = 0.25;
  if (!window.tabsirahMrDiorama) window.tabsirahMrDiorama = { active: false, radius: 0, center: [0, -1.05] };
}

if (typeof AFRAME !== 'undefined' && !AFRAME.components['biome-hand-controls']) {
  const _handPos = new THREE.Vector3();
  const _otherPos = new THREE.Vector3();
  const _nodePos = new THREE.Vector3();
  const _handQuat = new THREE.Quaternion();
  const _palmDir = new THREE.Vector3();
  const _camWorldPos = new THREE.Vector3();
  const _toCam = new THREE.Vector3();
  const _pinchState = { left: false, right: false, twoHandDist: null };

  const HOVER_RADIUS = 0.42;
  const ACTIVATE_RADIUS = 0.24;
  const EXIT_RADIUS = 0.48;
  const COOLDOWN_MS = 850;
  const OPEN_PALM_COOLDOWN_MS = 1400;

  AFRAME.registerComponent('biome-hand-controls', {
    init: function () {
      this.hasPrev = false;
      this.isPinched = false;
      this.gestureState = 'idle'; // 'idle' | 'hover-preview' | 'active' | 'cooldown'
      this.cooldownUntil = 0;
      this.lastEmittedState = '';
      this.hoveredNode = null;
      this.prevPos = new THREE.Vector3();
      this.lastValidTrackTime = 0;
      this.lastRainGesture = 0;
      this.lastAuroraWave = 0;
      this.lastConductorSweep = 0;
      this.lastOpenPalmTrigger = 0;
      this.side = this.el.id === 'left-hand' ? 'left' : 'right';
      this.leftHandEl = null;
      this.rightHandEl = null;
      this.camEl = null;
      this.cachedNodes = [];

      this.refreshNodes = () => {
        this.cachedNodes = Array.from(this.el.sceneEl?.querySelectorAll('.interactive-node') || []);
      };

      this.emitGestureState = (nextState, extra = null) => {
        if (nextState === this.lastEmittedState && !extra) return;
        this.lastEmittedState = nextState;
        window.dispatchEvent(
          new CustomEvent('tabsirah-hand-gesture-state', {
            detail: extra
              ? { side: this.side, state: nextState, xrInput: 'hand-tracking', ...extra }
              : { side: this.side, state: nextState, xrInput: 'hand-tracking' }
          })
        );
      };

      this.onPinch = () => {
        natureAudio.unlock();
        this.isPinched = true;
        _pinchState[this.side] = true;
        this.el.object3D.getWorldPosition(_handPos);
        this.prevPos.copy(_handPos);
        this.hasPrev = true;

        if (!this.cachedNodes.length) this.refreshNodes();
        if (!this.cachedNodes.length) return;

        let closest = null;
        let minDist = 3.2;
        for (let i = 0; i < this.cachedNodes.length; i++) {
          const node = this.cachedNodes[i];
          if (!node.isConnected) continue;
          node.object3D.getWorldPosition(_nodePos);
          const d = _handPos.distanceTo(_nodePos);
          if (d < minDist) {
            minDist = d;
            closest = node;
          }
        }
        if (closest) {
          this.gestureState = 'active';
          this.cooldownUntil = performance.now() + COOLDOWN_MS;
          this.emitGestureState('active');
          closest.emit(
            'pinchstarted',
            {
              hand: this.el.id,
              handPos: { x: _handPos.x, y: _handPos.y, z: _handPos.z }
            },
            false
          );
        }
      };

      this.onPinchEnd = () => {
        this.isPinched = false;
        _pinchState[this.side] = false;
        _pinchState.twoHandDist = null;
      };

      this.el.addEventListener('pinchstarted', this.onPinch);
      this.el.addEventListener('pinchended', this.onPinchEnd);
      window.addEventListener('tabsirah-biome-changed', this.refreshNodes);
    },

    tick: function () {
      if (!this.el.sceneEl?.is('vr-mode') && !this.el.sceneEl?.is('ar-mode')) return;
      const now = performance.now();
      this.el.object3D.getWorldPosition(_handPos);
      if (_handPos.lengthSq() < 0.0005) {
        if (this.lastValidTrackTime > 0 && now - this.lastValidTrackTime > 260) {
          this.isPinched = false;
          this.hasPrev = false;
          this.gestureState = 'idle';
          this.emitGestureState('idle');
          _pinchState[this.side] = false;
          _pinchState.twoHandDist = null;
        }
        return;
      }
      this.lastValidTrackTime = now;

      const biome = window.tabsirahActiveBiome;

      // Formal proximity state machine with hysteresis & cooldown
      if (now < this.cooldownUntil) {
        this.gestureState = 'cooldown';
        this.emitGestureState('cooldown');
      } else {
        if (!this.cachedNodes.length) this.refreshNodes();
        let closest = null;
        let minDist = Infinity;
        for (let i = 0; i < this.cachedNodes.length; i++) {
          const node = this.cachedNodes[i];
          if (!node.isConnected) continue;
          node.object3D.getWorldPosition(_nodePos);
          const d = _handPos.distanceTo(_nodePos);
          if (d < minDist) {
            minDist = d;
            closest = node;
          }
        }

        if (closest && minDist <= ACTIVATE_RADIUS) {
          this.gestureState = 'active';
          this.cooldownUntil = now + COOLDOWN_MS;
          this.emitGestureState('active');
          closest.emit(
            'pinchstarted',
            {
              hand: this.el.id,
              handPos: { x: _handPos.x, y: _handPos.y, z: _handPos.z }
            },
            false
          );
        } else if (closest && minDist <= HOVER_RADIUS) {
          const isNewHover = this.gestureState !== 'hover-preview';
          this.gestureState = 'hover-preview';
          this.hoveredNode = closest;
          if (isNewHover) {
            this.emitGestureState('hover-preview', { distance: minDist, proximityRadius: HOVER_RADIUS });
          }
        } else if (minDist > EXIT_RADIUS || !closest) {
          this.hoveredNode = null;
          this.gestureState = 'idle';
          this.emitGestureState('idle');
        }
      }

      // Two-Hand Pinch Spread -> Smooth Aerial / Close-Up Zoom
      if (_pinchState.left && _pinchState.right && this.side === 'right') {
        if (!this.leftHandEl || !this.leftHandEl.isConnected) {
          this.leftHandEl = document.getElementById('left-hand');
        }
        const lh = this.leftHandEl;
        if (lh?.object3D) {
          lh.object3D.getWorldPosition(_otherPos);
          const dist = _handPos.distanceTo(_otherPos);
          if (_pinchState.twoHandDist !== null) {
            const delta = (dist - _pinchState.twoHandDist) * 2.4;
            if (Math.abs(delta) > 0.004) {
              window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta } }));
            }
          }
          _pinchState.twoHandDist = dist;
        }
      } else if (this.side === 'left' && this.isPinched && !_pinchState.right && this.hasPrev) {
        // Left-Hand Pinch + Horizontal Sweep -> Scrub Solar Day/Night smoothly
        const dx = _handPos.x - this.prevPos.x;
        if (Math.abs(dx) > 0.0025 && Math.abs(dx) < 0.25) {
          const mgr = window.tabsirahBiomeManager;
          if (mgr) mgr.setSolarElevation(mgr.solarElevation + dx * 1.9);
        }
      }

      // Open Palm Steady Hold (chest/eye zone) -> Toggle Active Scientific Layer
      if (!this.isPinched && this.hasPrev && _handPos.y >= 0.95 && _handPos.y <= 1.55) {
        const moveSpeed = _handPos.distanceTo(this.prevPos);
        if (moveSpeed < 0.012 && now - this.lastOpenPalmTrigger > OPEN_PALM_COOLDOWN_MS) {
          this.el.object3D.getWorldQuaternion(_handQuat);
          _palmDir.set(0, 1, 0).applyQuaternion(_handQuat);
          if (!this.camEl || !this.camEl.isConnected) {
            this.camEl = this.el.sceneEl?.querySelector('a-camera');
          }
          if (this.camEl?.object3D) {
            this.camEl.object3D.getWorldPosition(_camWorldPos);
            _toCam.subVectors(_camWorldPos, _handPos).normalize();
            if (_palmDir.dot(_toCam) > 0.78) {
              this.lastOpenPalmTrigger = now;
              window.tabsirahBiomeManager?.triggerBiomeAction();
            }
          }
        }
      }

      // Raise Hand(s) Overhead (> 1.72 m) -> Biome Atmospheric Response
      if (_handPos.y > 1.72 && now - this.lastRainGesture > 1800) {
        this.lastRainGesture = now;
        if (biome === 'rainforest') {
          this.el.sceneEl.emit('biome-gesture-rain', {}, false);
        } else if (biome === 'aurora') {
          this.el.sceneEl.emit('aurora-magnetic-pulse', {}, false);
        } else if (biome === 'ocean') {
          this.el.sceneEl.emit('ocean-bubble-surge', {}, false);
        } else if (biome === 'desert') {
          window.tabsirahBiomeManager?.setDesertAquiferState(true);
        }
      }

      if (biome === 'aurora' && this.hasPrev) {
        const speed = _handPos.distanceTo(this.prevPos);
        if (speed > 0.045 && now - this.lastConductorSweep > 220) {
          this.lastConductorSweep = now;
          this.el.sceneEl.emit('aurora-conductor-sweep', { speed, dx: _handPos.x - this.prevPos.x }, false);
        }
        if (speed > 0.055 && now - this.lastAuroraWave > 450) {
          this.lastAuroraWave = now;
          this.el.sceneEl.emit('aurora-magnetic-pulse', {}, false);
        }
      }

      this.prevPos.copy(_handPos);
      this.hasPrev = true;
    },

    remove: function () {
      this.el.removeEventListener('pinchstarted', this.onPinch);
      this.el.removeEventListener('pinchended', this.onPinchEnd);
      window.removeEventListener('tabsirah-biome-changed', this.refreshNodes);
    }
  });
}

const HAPTIC_PATTERN_META = {
  'beacon-hover': { priority: 1, cooldownMs: 85, label: 'Beacon Hover' },
  'beacon-proximity': { priority: 1, cooldownMs: 200, label: 'Beacon Proximity' },
  'beacon-touch': { priority: 4, cooldownMs: 160, label: 'Beacon Touch' },
  'discovery-celebration': { priority: 5, cooldownMs: 320, label: 'Discovery Celebration' },
  'wonder-brush-stroke': { priority: 2, cooldownMs: 42, label: 'Wonder Brush Stroke' },
  'wonder-brush-toggle': { priority: 3, cooldownMs: 140, label: 'Wonder Brush Toggle' },
  'biome-action': { priority: 4, cooldownMs: 220, label: 'Biome Action' },
  'ecosystem-experiment': { priority: 4, cooldownMs: 240, label: 'Ecosystem Experiment' },
  'time-horizon': { priority: 3, cooldownMs: 120, label: 'Time Horizon Detent' },
  'lab-detent': { priority: 3, cooldownMs: 110, label: 'Spatial Lab Detent' },
  'convergence-finale': { priority: 5, cooldownMs: 500, label: 'Cosmic Convergence' },
  'tabletop-anchor': { priority: 4, cooldownMs: 180, label: 'Tabletop Anchor' },
  'ui-tap': { priority: 2, cooldownMs: 60, label: 'Spatial UI Tap' }
};

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function normalizeHandTarget(hand = 'both') {
  if (typeof hand !== 'string') return 'both';
  const low = hand.toLowerCase();
  if (low === 'left' || low.includes('left')) return 'left';
  if (low === 'right' || low.includes('right')) return 'right';
  return 'both';
}

/**
 * High-Fidelity WebXR Haptic Feedback Service
 * Synthesizes distinct frequency-weighted dual-rumble and pulse-train envelopes
 * for beacon interactions, Wonder Brush strokes, and Living Creation Engine events.
 */
export class HapticFeedbackService {
  constructor() {
    this.enabled = true;
    this.masterGain = 1.0;
    this.sceneEl = null;
    this.cooldowns = new Map();
    this.activeTimers = { left: new Set(), right: new Set() };
    this.activeLockUntil = { left: 0, right: 0 };
    this.lastDispatch = null;
    this._attached = false;

    this._onTriggerHaptic = (e) => {
      const detail = e.detail || {};
      if (detail.pattern && HAPTIC_PATTERN_META[detail.pattern]) {
        this.playPattern(detail.pattern, detail);
        return;
      }
      const hand = normalizeHandTarget(detail.hand || 'both');
      const intensity = clamp01(detail.intensity ?? 0.36);
      const durationMs = Math.max(10, Math.min(250, Number(detail.duration) || 32));
      const frequencyHz = Number(detail.frequencyHz) || (durationMs <= 26 ? 185 : durationMs >= 70 ? 85 : 140);
      this.playCustomSteps([{ delayMs: 0, intensity, durationMs, frequencyHz }], {
        hand,
        priority: 2,
        cooldownMs: 45,
        patternId: 'trigger-haptic'
      });
    };

    this._onWonderBrushStroke = (e) => {
      const detail = e.detail || {};
      this.playPattern('wonder-brush-stroke', {
        hand: detail.hand || 'right',
        biomeId: detail.biomeId,
        pitchNorm: detail.pitchNorm,
        speed: detail.speed
      });
    };

    this._onWonderBrushState = (e) => {
      this.playPattern('wonder-brush-toggle', {
        active: Boolean(e.detail?.active),
        hand: 'both'
      });
    };

    this._onDiscoveryActivated = (e) => {
      const detail = e.detail || {};
      this.playPattern('discovery-celebration', {
        hand: detail.handId || detail.hand || 'both',
        biomeId: detail.biomeId
      });
    };

    this._onEcosystemExperiment = (e) => {
      const detail = e.detail || {};
      this.playPattern('ecosystem-experiment', {
        hand: 'both',
        biomeId: detail.biomeId
      });
    };

    this._onTimelineChanged = () => {
      this.playPattern('time-horizon', { hand: 'both' });
    };

    this._onLabCommand = (e) => {
      const detail = e.detail || {};
      if (
        typeof detail.extract === 'boolean' ||
        typeof detail.microZoom === 'boolean' ||
        typeof detail.rotateY === 'number' ||
        typeof detail.scaleDelta === 'number'
      ) {
        this.playPattern('lab-detent', { hand: 'both' });
      }
    };

    this._onConvergenceState = (e) => {
      if (e.detail?.active) {
        this.playPattern('convergence-finale', { hand: 'both' });
      }
    };

    this._onHandGestureState = (e) => {
      const detail = e.detail || {};
      if (detail.state === 'hover-preview') {
        this.playPattern('beacon-hover', {
          hand: detail.side || 'right',
          distance: detail.distance,
          proximityRadius: detail.proximityRadius
        });
      }
    };
  }

  attach(sceneEl) {
    this.sceneEl = sceneEl || document.querySelector('a-scene');
    if (this._attached || typeof window === 'undefined') {
      if (typeof window !== 'undefined') window.tabsirahHaptics = this;
      return;
    }
    this._attached = true;
    window.tabsirahHaptics = this;

    window.addEventListener('trigger-haptic', this._onTriggerHaptic);
    window.addEventListener('tabsirah-wonder-brush-stroke', this._onWonderBrushStroke);
    window.addEventListener('tabsirah-wonder-brush-state', this._onWonderBrushState);
    window.addEventListener('tabsirah-discovery-activated', this._onDiscoveryActivated);
    window.addEventListener('tabsirah-ecosystem-experiment', this._onEcosystemExperiment);
    window.addEventListener('tabsirah-timeline-changed', this._onTimelineChanged);
    window.addEventListener('tabsirah-lab-command', this._onLabCommand);
    window.addEventListener('tabsirah-convergence-state', this._onConvergenceState);
    window.addEventListener('tabsirah-hand-gesture-state', this._onHandGestureState);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this._clearHandTimers('left');
      this._clearHandTimers('right');
    }
  }

  setMasterGain(gain) {
    this.masterGain = Math.max(0, Math.min(1.5, Number(gain) || 1.0));
  }

  getPatternCatalog() {
    return HAPTIC_PATTERN_META;
  }

  getLastDispatch() {
    return this.lastDispatch;
  }

  _clearHandTimers(channel) {
    const timers = this.activeTimers[channel];
    if (!timers) return;
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
  }

  _pulseGamepadWithFrequency(gp, amp, durationMs, frequencyHz) {
    if (!gp) return false;
    const freqNorm = clamp01((frequencyHz - 25) / 215);
    const weakRatio = 0.28 + 0.72 * freqNorm;
    const strongRatio = 1.0 - 0.78 * freqNorm;

    if (gp.vibrationActuator?.playEffect) {
      gp.vibrationActuator
        .playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude: clamp01(amp * weakRatio),
          strongMagnitude: clamp01(amp * strongRatio)
        })
        .catch(() => {});
      return true;
    }

    if (gp.hapticActuators && gp.hapticActuators[0]?.pulse) {
      gp.hapticActuators[0].pulse(clamp01(amp), durationMs).catch(() => {});
      return true;
    }

    return false;
  }

  dispatchHardwarePulse(hand = 'both', intensity = 0.4, durationMs = 36, frequencyHz = 140) {
    if (!this.enabled) return false;
    const scene = this.sceneEl || document.querySelector('a-scene');
    if (!scene || (!scene.is('vr-mode') && !scene.is('ar-mode'))) return false;

    const amp = clamp01((Number(intensity) || 0) * this.masterGain);
    const dur = Math.max(10, Math.min(250, Math.round(Number(durationMs) || 36)));
    const freq = Math.max(25, Math.min(240, Number(frequencyHz) || 140));
    if (amp <= 0.005) return false;

    const targetHand = normalizeHandTarget(hand);
    let pulsed = false;

    const session = scene.renderer?.xr?.getSession?.();
    if (session?.inputSources) {
      for (const source of session.inputSources) {
        if (targetHand === 'left' || targetHand === 'right') {
          if (source.handedness && source.handedness !== targetHand) continue;
        }
        if (this._pulseGamepadWithFrequency(source.gamepad, amp, dur, freq)) {
          pulsed = true;
        }
      }
    }

    if (!pulsed && typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (!gp) continue;
        if ((targetHand === 'left' || targetHand === 'right') && gp.hand && gp.hand !== targetHand) continue;
        if (this._pulseGamepadWithFrequency(gp, amp, dur, freq)) {
          pulsed = true;
        }
      }
    }

    return pulsed;
  }

  _computeMagneticProximity(options = {}) {
    let linearProx;
    if (typeof options.proximity === 'number') {
      linearProx = clamp01(options.proximity);
    } else if (typeof options.distance === 'number') {
      const outer = Math.max(0.15, Number(options.proximityRadius) || 0.52);
      const core = Math.max(0.02, Math.min(outer - 0.05, Number(options.coreRadius) || 0.09));
      linearProx = clamp01(1 - Math.max(0, options.distance - core) / (outer - core));
    } else {
      linearProx = 0.35;
    }

    const pull = Math.pow(linearProx, 1.55);
    const boost = clamp01(options.approachBoost || 0) * 0.22;
    const intensity = Math.max(0.08, Math.min(0.68, 0.08 + pull * 0.56 + boost));
    const frequencyHz = Math.round(74 + pull * 146);
    const durationMs = Math.round(14 + (1 - pull) * 10 + (pull > 0.72 ? 4 : 0));
    const cooldownMs = Math.max(52, Math.round(240 - pull * 186));
    return { linearProx, pull, intensity, frequencyHz, durationMs, cooldownMs };
  }

  _buildPatternSteps(patternId, options = {}) {
    const biomeId = options.biomeId || window.tabsirahActiveBiome || 'aurora';

    switch (patternId) {
      case 'beacon-hover':
        return [{ delayMs: 0, intensity: 0.20, durationMs: 14, frequencyHz: 195 }];

      case 'beacon-proximity': {
        const mag = this._computeMagneticProximity(options);
        const steps = [
          {
            delayMs: 0,
            intensity: mag.intensity,
            durationMs: mag.durationMs,
            frequencyHz: mag.frequencyHz
          }
        ];
        if (mag.pull > 0.78) {
          steps.push({
            delayMs: 28,
            intensity: clamp01(mag.intensity * 0.52),
            durationMs: 12,
            frequencyHz: Math.min(240, mag.frequencyHz + 18)
          });
        }
        return steps;
      }

      case 'beacon-touch': {
        if (biomeId === 'aurora') {
          return [
            { delayMs: 0, intensity: 0.62, durationMs: 24, frequencyHz: 185 },
            { delayMs: 48, intensity: 0.48, durationMs: 20, frequencyHz: 215 },
            { delayMs: 92, intensity: 0.30, durationMs: 16, frequencyHz: 230 }
          ];
        }
        if (biomeId === 'ocean') {
          return [
            { delayMs: 0, intensity: 0.68, durationMs: 58, frequencyHz: 55 },
            { delayMs: 86, intensity: 0.36, durationMs: 42, frequencyHz: 72 }
          ];
        }
        if (biomeId === 'desert') {
          return [
            { delayMs: 0, intensity: 0.62, durationMs: 38, frequencyHz: 88 },
            { delayMs: 60, intensity: 0.38, durationMs: 26, frequencyHz: 115 }
          ];
        }
        // Rainforest droplet cascade
        return [
          { delayMs: 0, intensity: 0.50, durationMs: 32, frequencyHz: 130 },
          { delayMs: 58, intensity: 0.38, durationMs: 22, frequencyHz: 165 },
          { delayMs: 104, intensity: 0.24, durationMs: 16, frequencyHz: 195 }
        ];
      }

      case 'discovery-celebration':
        return [
          { delayMs: 0, intensity: 0.44, durationMs: 26, frequencyHz: 115 },
          { delayMs: 55, intensity: 0.68, durationMs: 34, frequencyHz: 155 },
          { delayMs: 125, intensity: 0.92, durationMs: 54, frequencyHz: 190 }
        ];

      case 'wonder-brush-stroke': {
        const pitchNorm = clamp01(options.pitchNorm ?? 0.5);
        const speedNorm = clamp01((Number(options.speed) || 0.35) / 1.5);
        const frequencyHz = Math.round(95 + pitchNorm * 135);
        const intensity = Math.max(0.12, Math.min(0.58, 0.14 + speedNorm * 0.34 + pitchNorm * 0.10));
        const durationMs = Math.round(28 - pitchNorm * 12);
        const steps = [{ delayMs: 0, intensity, durationMs, frequencyHz }];
        if (speedNorm > 0.55) {
          steps.push({
            delayMs: 34,
            intensity: Math.max(0.1, intensity * 0.45),
            durationMs: 12,
            frequencyHz: Math.min(240, frequencyHz + 25)
          });
        }
        return steps;
      }

      case 'wonder-brush-toggle':
        if (options.active === false) {
          return [{ delayMs: 0, intensity: 0.28, durationMs: 24, frequencyHz: 110 }];
        }
        return [
          { delayMs: 0, intensity: 0.45, durationMs: 22, frequencyHz: 175 },
          { delayMs: 50, intensity: 0.58, durationMs: 26, frequencyHz: 210 }
        ];

      case 'biome-action': {
        if (biomeId === 'aurora') {
          return [
            { delayMs: 0, intensity: 0.52, durationMs: 36, frequencyHz: 175 },
            { delayMs: 66, intensity: 0.72, durationMs: 42, frequencyHz: 210 }
          ];
        }
        if (biomeId === 'ocean') {
          return [
            { delayMs: 0, intensity: 0.58, durationMs: 52, frequencyHz: 62 },
            { delayMs: 78, intensity: 0.42, durationMs: 36, frequencyHz: 92 }
          ];
        }
        if (biomeId === 'desert') {
          return [
            { delayMs: 0, intensity: 0.56, durationMs: 44, frequencyHz: 78 },
            { delayMs: 70, intensity: 0.46, durationMs: 28, frequencyHz: 135 }
          ];
        }
        return [
          { delayMs: 0, intensity: 0.44, durationMs: 26, frequencyHz: 145 },
          { delayMs: 52, intensity: 0.52, durationMs: 28, frequencyHz: 185 }
        ];
      }

      case 'ecosystem-experiment':
        return [
          { delayMs: 0, intensity: 0.42, durationMs: 24, frequencyHz: 110 },
          { delayMs: 56, intensity: 0.54, durationMs: 28, frequencyHz: 145 },
          { delayMs: 118, intensity: 0.66, durationMs: 32, frequencyHz: 175 }
        ];

      case 'time-horizon':
        return [{ delayMs: 0, intensity: 0.44, durationMs: 24, frequencyHz: 160 }];

      case 'lab-detent':
        return [
          { delayMs: 0, intensity: 0.34, durationMs: 16, frequencyHz: 185 },
          { delayMs: 36, intensity: 0.46, durationMs: 18, frequencyHz: 210 }
        ];

      case 'convergence-finale':
        return [
          { delayMs: 0, intensity: 0.38, durationMs: 40, frequencyHz: 85 },
          { delayMs: 72, intensity: 0.58, durationMs: 46, frequencyHz: 125 },
          { delayMs: 150, intensity: 0.78, durationMs: 54, frequencyHz: 165 },
          { delayMs: 235, intensity: 0.94, durationMs: 75, frequencyHz: 195 }
        ];

      case 'tabletop-anchor':
        return [
          { delayMs: 0, intensity: 0.68, durationMs: 46, frequencyHz: 85 },
          { delayMs: 70, intensity: 0.48, durationMs: 26, frequencyHz: 175 }
        ];

      case 'ui-tap':
      default:
        return [{ delayMs: 0, intensity: 0.30, durationMs: 18, frequencyHz: 175 }];
    }
  }

  playPattern(patternId, options = {}) {
    if (!this.enabled) return false;
    const meta = HAPTIC_PATTERN_META[patternId] || HAPTIC_PATTERN_META['ui-tap'];
    const steps = this._buildPatternSteps(patternId, options);
    let resolvedCooldown = options.cooldownMs ?? meta.cooldownMs;
    if (patternId === 'beacon-proximity' && options.cooldownMs == null) {
      resolvedCooldown = this._computeMagneticProximity(options).cooldownMs;
    }
    return this.playCustomSteps(steps, {
      hand: options.hand || 'both',
      priority: meta.priority,
      cooldownMs: resolvedCooldown,
      patternId
    });
  }

  playCustomSteps(steps, config = {}) {
    if (!this.enabled || !Array.isArray(steps) || steps.length === 0) return false;

    const hand = normalizeHandTarget(config.hand || 'both');
    const priority = config.priority ?? 2;
    const cooldownMs = config.cooldownMs ?? 60;
    const patternId = config.patternId || 'custom';
    const now = performance.now();

    const cooldownKey = `${patternId}:${hand}`;
    const lastTime = this.cooldowns.get(cooldownKey) || 0;
    if (now - lastTime < cooldownMs) return false;

    const channels = hand === 'both' ? ['left', 'right'] : [hand];
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      if (now < this.activeLockUntil[ch] && priority < 4) {
        return false;
      }
    }

    this.cooldowns.set(cooldownKey, now);

    let maxSpanMs = 0;
    for (let i = 0; i < steps.length; i++) {
      const span = (Number(steps[i].delayMs) || 0) + (Number(steps[i].durationMs) || 24);
      if (span > maxSpanMs) maxSpanMs = span;
    }

    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      this._clearHandTimers(ch);
      if (priority >= 4) {
        this.activeLockUntil[ch] = now + maxSpanMs + 25;
      }
    }

    this.lastDispatch = {
      patternId,
      hand,
      priority,
      steps,
      timestamp: now
    };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const delayMs = Math.max(0, Number(step.delayMs) || 0);
      if (delayMs === 0) {
        this.dispatchHardwarePulse(hand, step.intensity, step.durationMs, step.frequencyHz);
      } else {
        const anchorChannel = channels[0];
        const timerId = window.setTimeout(() => {
          this.activeTimers[anchorChannel]?.delete(timerId);
          this.dispatchHardwarePulse(hand, step.intensity, step.durationMs, step.frequencyHz);
        }, delayMs);
        channels.forEach((ch) => this.activeTimers[ch]?.add(timerId));
      }
    }

    return true;
  }

  destroy() {
    this._clearHandTimers('left');
    this._clearHandTimers('right');
    if (typeof window !== 'undefined' && this._attached) {
      window.removeEventListener('trigger-haptic', this._onTriggerHaptic);
      window.removeEventListener('tabsirah-wonder-brush-stroke', this._onWonderBrushStroke);
      window.removeEventListener('tabsirah-wonder-brush-state', this._onWonderBrushState);
      window.removeEventListener('tabsirah-discovery-activated', this._onDiscoveryActivated);
      window.removeEventListener('tabsirah-ecosystem-experiment', this._onEcosystemExperiment);
      window.removeEventListener('tabsirah-timeline-changed', this._onTimelineChanged);
      window.removeEventListener('tabsirah-lab-command', this._onLabCommand);
      window.removeEventListener('tabsirah-convergence-state', this._onConvergenceState);
      window.removeEventListener('tabsirah-hand-gesture-state', this._onHandGestureState);
      this._attached = false;
    }
  }
}

export const hapticFeedbackService = new HapticFeedbackService();

class BiomeManager {
  constructor() {
    this.currentBiomeId = 'aurora';
    this.solarElevation = EARTH_BIOMES_DATA.aurora.defaultSolar;
    this.uiState = 'explore'; // 'explore' | 'discover' | 'reflect'
    this.rainActive = false;
    this.xrayActive = false;
    this.auroraShieldActive = false;
    this.desertAquiferActive = false;
    this.oceanEnergized = false;

    this.isMediaOpen = false;
    this.isStillness = false;
    this.slowMotionUser = false;
    this.breathAnimFrame = null;
    this.discoveredBiomes = new Set(discoveryJournal.getSnapshot().discoveredBiomes || ['aurora']);
    this.mediaTab = 'video';
    this.photoIndex = 0;
    this.isTransitioning = false;
    this.solarAnimFrame = null;

    this.activeArrowKeys = new Set();
    this.arrowControlMode = 'rotate';
    this.shiftPressed = false;
    this.arrowAnimFrame = null;
    this.hintResetTimer = null;
    this.mrClipPlanes = null;
    this.compassTurnAnimFrame = null;
    this.facingDirection = 'N';
    this.symphonyUnlockedBiomes = new Set();

    this.cacheDOM();
    this.haptics = hapticFeedbackService;
    this.haptics.attach(this.sceneEl);
    this.bindEvents();
    this.startArrowKeyLoop();
    this.switchBiome('aurora', true);
    this.syncCompass360UI(false);
    this.setUIState('explore');
    this.renderEcosystemDrawer();
    this.renderJournalDrawer();
    this.renderCompanionPrompts('aurora');
  }

  cacheDOM() {
    this.sceneEl = document.querySelector('a-scene');
    this.container = document.getElementById('biome-container');
    this.skyDomeEl = document.getElementById('biome-sky-dome');
    this.navButtons = Array.from(document.querySelectorAll('[data-biome-btn]'));

    // Opening Overlay
    this.openingOverlay = document.getElementById('opening-overlay');
    this.beginExploreBtn = document.getElementById('btn-begin-exploration');
    this.beginGuidedBtn = document.getElementById('btn-begin-guided');

    // Top Bar & Tour Control Pill
    this.demoModeBtn = document.getElementById('btn-demo-mode');
    this.vrBtn = document.getElementById('btn-enter-vr');
    this.arBtn = document.getElementById('btn-enter-ar');
    this.tourBar = document.getElementById('tour-bar');
    this.tourStatusLabel = document.getElementById('tour-status-label');
    this.tourProgressFill = document.getElementById('tour-progress-fill');
    this.tourPauseBtn = document.getElementById('btn-tour-pause');
    this.tourLoopBtn = document.getElementById('btn-tour-loop');
    this.tourNextBtn = document.getElementById('btn-tour-next');
    this.tourExitBtn = document.getElementById('btn-tour-exit');

    // Bottom Explore Dock
    this.bottomStack = document.getElementById('hud-bottom-stack');
    this.collapseDockBtn = document.getElementById('btn-collapse-dock');
    this.titleEl = document.getElementById('hud-biome-title');
    this.hintEl = document.getElementById('hud-hint');

    this.stepExplore = document.getElementById('step-explore');
    this.stepDiscover = document.getElementById('step-discover');
    this.stepUnderstand = document.getElementById('step-understand');
    this.stepReflect = document.getElementById('step-reflect');

    this.prevBtn = document.getElementById('btn-prev-biome');
    this.nextBtn = document.getElementById('btn-next-biome');
    this.actionBtn = document.getElementById('btn-biome-action');
    this.reflectToggleBtn = document.getElementById('btn-reflect-toggle');
    this.narrateBtn = document.getElementById('btn-narrate-toggle');
    this.voiceWave = document.getElementById('hud-voice-wave');
    this.audioBtn = document.getElementById('btn-audio-toggle');

    // Mode 2: Discover Contextual Card
    this.discoverCard = document.getElementById('discover-card');
    this.discoverObjectName = document.getElementById('discover-object-name');
    this.discoverModelNote = document.getElementById('discover-model-note');
    this.discoverSummary = document.getElementById('discover-summary');
    this.discoverReflectBtn = document.getElementById('btn-discover-reflect');
    this.discoverCloseBtn = document.getElementById('btn-discover-close');

    // Mode 3: Reflection & Scientific Context Panel
    this.reflectPanel = document.getElementById('reflect-panel');
    this.reflectBiomeLabel = document.getElementById('reflect-biome-label');
    this.reflectTitle = document.getElementById('reflect-title');
    this.reflectArabicVerse = document.getElementById('reflect-arabic-verse');
    this.reflectTranslation = document.getElementById('reflect-translation');
    this.reflectSurahRef = document.getElementById('reflect-surah-ref');
    this.reflectCommentary = document.getElementById('reflect-commentary');
    this.reflectScienceBox = document.getElementById('reflect-science-box');
    this.reflectScience = document.getElementById('reflect-science');
    this.reflectNarrateBtn = document.getElementById('btn-reflect-narrate');
    this.reflectMediaBtn = document.getElementById('btn-reflect-media');
    this.closeReflectBtn = document.getElementById('btn-close-reflect');

    // Environment & Camera Popover
    this.moreControlsBtn = document.getElementById('btn-more-controls');
    this.moreControlsPopover = document.getElementById('more-controls-popover');
    this.closePopoverBtn = document.getElementById('btn-close-popover');
    this.solarPresetBtn = document.getElementById('btn-solar-preset');
    this.solarSlider = document.getElementById('solar-weather-slider');
    this.solarReadout = document.getElementById('solar-weather-readout');
    this.bloomBtn = document.getElementById('btn-bloom-toggle');
    this.bloomSlider = document.getElementById('bloom-intensity-slider');
    this.bloomReadout = document.getElementById('bloom-intensity-readout');
    this.timeScaleBtn = document.getElementById('btn-timescale-toggle');

    // Deep Stillness Sanctuary Overlay
    this.stillnessBtn = document.getElementById('btn-stillness-toggle');
    this.stillnessVeil = document.getElementById('stillness-veil');
    this.exitStillnessBtn = document.getElementById('btn-exit-stillness');
    this.stillnessNextBtn = document.getElementById('btn-stillness-next');
    this.stillnessKicker = document.getElementById('stillness-biome-kicker');
    this.stillnessArabic = document.getElementById('stillness-arabic');
    this.stillnessTranslation = document.getElementById('stillness-translation');
    this.stillnessSurah = document.getElementById('stillness-surah');
    this.breathRingOuter = document.getElementById('breath-ring-outer');
    this.breathPhaseLabel = document.getElementById('breath-phase-label');
    this.reflectionProgressEl = document.getElementById('reflection-progress-label');

    this.zoomOutBtn = document.getElementById('btn-zoom-out');
    this.vantageAerialBtn = document.getElementById('btn-vantage-aerial');
    this.vantageVistaBtn = document.getElementById('btn-vantage-vista');
    this.zoomInBtn = document.getElementById('btn-zoom-in');
    this.zoomReadoutEl = document.getElementById('zoom-scale-readout');
    this.arrowModeBtn = document.getElementById('btn-arrow-mode');

    // Real-World Video & Field Photography Drawer
    this.mediaToggleBtn = document.getElementById('btn-media-toggle');
    this.mediaDrawer = document.getElementById('media-drawer');
    this.mediaCloseBtn = document.getElementById('btn-close-media');
    this.mediaTabVideoBtn = document.getElementById('btn-tab-video');
    this.mediaTabPhotosBtn = document.getElementById('btn-tab-photos');
    this.mediaVideoPanel = document.getElementById('media-video-panel');
    this.mediaPhotosPanel = document.getElementById('media-photos-panel');
    this.mediaIframe = document.getElementById('media-youtube-frame');
    this.mediaVideoTitle = document.getElementById('media-video-title');
    this.mediaPhotoImg = document.getElementById('media-photo-img');
    this.mediaPhotoCaption = document.getElementById('media-photo-caption');
    this.mediaPhotoCredit = document.getElementById('media-photo-credit');
    this.mediaPrevPhotoBtn = document.getElementById('btn-prev-photo');
    this.mediaNextPhotoBtn = document.getElementById('btn-next-photo');
    this.mediaCoordsEl = document.getElementById('media-coords');

    // Innovation 1, 2 & 3 Elements
    this.mrDioramaRingEl = document.getElementById('mr-diorama-ring');
    this.wonderContextBar = document.getElementById('wonder-context-bar');
    this.wonderContextLabel = document.getElementById('wonder-context-label');
    this.desertCompassControls = document.getElementById('desert-compass-controls');
    this.compassLeftBtn = document.getElementById('btn-compass-left');
    this.compassAlignBtn = document.getElementById('btn-compass-align');
    this.compassRightBtn = document.getElementById('btn-compass-right');

    // Grand Prize Feature Controls & Stillness Calibrated Mic Controls
    this.micBreathBtn = document.getElementById('btn-mic-breath');
    this.breathModeBtn = document.getElementById('btn-breath-mode');
    this.breathSensitivitySlider = document.getElementById('breath-sensitivity-slider');
    this.breathSensitivityReadout = document.getElementById('breath-sensitivity-readout');
    this.breathCountReadout = document.getElementById('breath-count-readout');
    this.tabletopBtn = document.getElementById('btn-tabletop-toggle');
    this.tabletopExitPill = document.getElementById('tabletop-exit-pill');
    this.exitTabletopBtn = document.getElementById('btn-exit-tabletop-pill');
    this.convergenceBtn = document.getElementById('btn-convergence-toggle');
    this.wonderBrushBtn = document.getElementById('btn-wonder-brush');
    this.relicProgressText = document.getElementById('relic-progress-text');

    // Living Creation Engine Drawers & Modals
    this.ecosystemToggleBtn = document.getElementById('btn-ecosystem-toggle');
    this.ecosystemDrawer = document.getElementById('ecosystem-drawer');
    this.closeEcosystemBtn = document.getElementById('btn-close-ecosystem');
    this.horizonButtons = Array.from(document.querySelectorAll('[data-horizon-btn]'));
    this.ecosystemHorizonNote = document.getElementById('ecosystem-horizon-note');
    this.expButtons = Array.from(document.querySelectorAll('[data-exp-btn]'));
    this.ecoResetBtn = document.getElementById('btn-eco-reset');
    this.ecosystemMetricsList = document.getElementById('ecosystem-metrics-list');
    this.ecosystemChainBox = document.getElementById('ecosystem-chain-box');
    this.ecosystemDisclaimer = document.getElementById('ecosystem-disclaimer');

    this.labToggleBtn = document.getElementById('btn-lab-toggle');
    this.labDrawer = document.getElementById('lab-drawer');
    this.closeLabBtn = document.getElementById('btn-close-lab');
    this.labSpecimenTitle = document.getElementById('lab-specimen-title');
    this.labBiomeButtons = Array.from(document.querySelectorAll('[data-lab-biome]'));
    this.labExtractBtn = document.getElementById('btn-lab-extract');
    this.labRotLeftBtn = document.getElementById('btn-lab-rot-left');
    this.labRotRightBtn = document.getElementById('btn-lab-rot-right');
    this.labMicroBtn = document.getElementById('btn-lab-micro');
    this.labScaleDownBtn = document.getElementById('btn-lab-scale-down');
    this.labScaleSlider = document.getElementById('lab-scale-slider');
    this.labScaleUpBtn = document.getElementById('btn-lab-scale-up');
    this.labScaleReadout = document.getElementById('lab-scale-readout');
    this.labScaleLabel = document.getElementById('lab-scale-label');
    this.labSummaryText = document.getElementById('lab-summary-text');
    this.labMicroText = document.getElementById('lab-micro-text');

    this.journalToggleBtn = document.getElementById('btn-journal-toggle');
    this.journalDrawer = document.getElementById('journal-drawer');
    this.closeJournalBtn = document.getElementById('btn-close-journal');
    this.journalBiomesCount = document.getElementById('journal-biomes-count');
    this.journalExperimentsCount = document.getElementById('journal-experiments-count');
    this.journalRelicsCount = document.getElementById('journal-relics-count');
    this.journalSpecimensCount = document.getElementById('journal-specimens-count');
    this.journalDetailList = document.getElementById('journal-detail-list');
    this.journalResetBtn = document.getElementById('btn-journal-reset');

    this.companionToggleBtn = document.getElementById('btn-companion-toggle');
    this.companionDrawer = document.getElementById('companion-drawer');
    this.closeCompanionBtn = document.getElementById('btn-close-companion');
    this.companionModeLabel = document.getElementById('companion-mode-label');
    this.companionQuickPrompts = document.getElementById('companion-quick-prompts');
    this.companionForm = document.getElementById('companion-form');
    this.companionInput = document.getElementById('companion-input');
    this.companionAskBtn = document.getElementById('btn-companion-ask');
    this.companionAnswer = document.getElementById('companion-answer');

    this.convergenceModal = document.getElementById('convergence-summary-modal');
    this.convSummaryStats = document.getElementById('conv-summary-stats');
    this.closeConvergenceModalBtn = document.getElementById('btn-close-convergence-modal');
    this.convExitModeBtn = document.getElementById('btn-conv-exit-mode');

    // Wide View Immersion & Vista Overlook Controls
    this.isWideView = false;
    this.wideViewToggleBtn = document.getElementById('btn-wide-view-toggle');
    this.topbarWideViewBtn = document.getElementById('btn-topbar-wide-view');
    this.wideViewExitPill = document.getElementById('wide-view-exit-pill');
    this.exitWideViewBtn = document.getElementById('btn-exit-wide-view');
    this.vistaButtons = Array.from(document.querySelectorAll('[data-vista-btn]'));

    // 360° Field Compass Strip
    this.compass360Strip = document.getElementById('compass-360-strip');
    this.compassDirButtons = Array.from(document.querySelectorAll('[data-compass-dir]'));
    this.compass360Count = document.getElementById('compass-360-count');
  }

  bindEvents() {
    const unlockOnce = () => {
      natureAudio.unlock();
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce, { passive: true });
    window.addEventListener('keydown', unlockOnce, { passive: true });

    // Opening Invitation Actions
    this.beginExploreBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      if (this.openingOverlay) this.openingOverlay.hidden = true;
      this.setUIState('explore');
    });

    this.beginGuidedBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      if (this.openingOverlay) this.openingOverlay.hidden = true;
      window.dispatchEvent(new CustomEvent('start-guiding-light-demo'));
    });

    // Top Nav Biomes
    this.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        natureAudio.unlock();
        if (document.body.classList.contains('is-cinematic')) {
          window.dispatchEvent(new CustomEvent('tabsirah-tour-exit'));
        }
        const id = btn.getAttribute('data-biome-btn');
        if (id) this.switchBiome(id);
      });
    });

    this.prevBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      if (document.body.classList.contains('is-cinematic')) {
        window.dispatchEvent(new CustomEvent('tabsirah-tour-exit'));
      }
      this.stepBiome(-1);
    });

    this.nextBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      if (document.body.classList.contains('is-cinematic')) {
        window.dispatchEvent(new CustomEvent('tabsirah-tour-exit'));
      }
      this.stepBiome(1);
    });

    this.actionBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.triggerBiomeAction();
    });



    // Progressive 4-Stage Stepper & Panel Controls
    this.stepExplore?.addEventListener('click', () => {
      natureAudio.unlock();
      this.setUIState('explore');
    });

    this.stepDiscover?.addEventListener('click', () => {
      natureAudio.unlock();
      this.activateCurrentDiscovery();
      this.setUIState('discover');
    });

    this.stepUnderstand?.addEventListener('click', () => {
      natureAudio.unlock();
      this.setUIState('understand');
    });

    this.stepReflect?.addEventListener('click', () => {
      natureAudio.unlock();
      this.setUIState('reflect');
    });

    this.reflectToggleBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const isReflectOpen = this.uiState === 'reflect' || this.uiState === 'understand';
      this.setUIState(isReflectOpen ? 'explore' : 'reflect');
    });

    this.closeReflectBtn?.addEventListener('click', () => {
      this.setUIState('explore');
    });

    this.discoverReflectBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.setUIState('understand');
    });

    this.discoverCloseBtn?.addEventListener('click', () => {
      this.setUIState('explore');
    });

    this.reflectNarrateBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const data = EARTH_BIOMES_DATA[this.currentBiomeId];
      natureNarrator.togglePlayPause(data.fullNarration);
    });

    this.reflectMediaBtn?.addEventListener('click', () => {
      this.setMediaVisible(true);
    });

    // 3D Beacon or Coral Discovery Event -> Living Revelation + Mode 2 Discover Card
    window.addEventListener('tabsirah-discovery-activated', (evt) => {
      const biomeId = evt.detail?.biomeId || this.currentBiomeId;
      this.discoveredBiomes.add(biomeId);
      this.updateProgressLabel();
      this.syncCompass360UI(true);
      if (biomeId !== this.currentBiomeId) return;
      this.activateCurrentDiscovery();
      if (this.uiState !== 'reflect' && this.uiState !== 'understand') {
        this.setUIState('discover');
      }
    });

    // 360° Cardinal Field Compass Navigation & Multi-Quadrant Discovery Sync
    this.compassDirButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        natureAudio.unlock();
        const dir = btn.getAttribute('data-compass-dir') || 'N';
        this.rotateCameraToDirection(dir);
      });
    });
    window.addEventListener('tabsirah-quadrant-discovered', () => {
      this.syncCompass360UI(true);
    });
    window.addEventListener('tabsirah-relic-attuned', () => {
      this.syncCompass360UI(true);
    });
    this.sceneEl?.addEventListener('pointerdown', () => {
      if (this.compassTurnAnimFrame) {
        cancelAnimationFrame(this.compassTurnAnimFrame);
        this.compassTurnAnimFrame = null;
      }
    }, { passive: true });

    // Deep Stillness Sanctuary Events
    this.stillnessBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.setStillnessMode(!this.isStillness);
    });
    this.exitStillnessBtn?.addEventListener('click', () => {
      this.setStillnessMode(false);
    });
    this.stillnessNextBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.stepBiome(1);
    });

    // Grand Prize Feature Controls: Mic Breath, Tabletop Portal, Convergence, Wonder Brush
    this.micBreathBtn?.addEventListener('click', async () => {
      natureAudio.unlock();
      await micBreathMonitor.toggle();
    });

    this.breathModeBtn?.addEventListener('click', async () => {
      natureAudio.unlock();
      if (micBreathMonitor.isActive) {
        micBreathMonitor.setManualMode(true);
      } else {
        await micBreathMonitor.start();
      }
    });

    this.breathSensitivitySlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      micBreathMonitor.setSensitivity(val);
      if (this.breathSensitivityReadout) {
        this.breathSensitivityReadout.textContent = `${val.toFixed(1)}x`;
      }
    });

    window.addEventListener('tabsirah-mic-breath-state', (evt) => {
      const { active, manualMode, status, sensitivity, breathCount, phaseLabel, error } = evt.detail || {};
      if (this.micBreathBtn) {
        this.micBreathBtn.setAttribute('aria-pressed', String(Boolean(active)));
        this.micBreathBtn.classList.toggle('is-active', Boolean(active));
        this.micBreathBtn.textContent = active
          ? (status === 'calibrating' ? 'Calibrating…' : 'Mic Breath: Live')
          : (error ? 'Guided Pacer' : 'Mic Breath');
      }
      if (this.breathModeBtn) {
        this.breathModeBtn.setAttribute('aria-pressed', String(Boolean(active)));
        this.breathModeBtn.classList.toggle('is-active', Boolean(active));
        this.breathModeBtn.textContent = active
          ? (status === 'calibrating' ? 'Mode: Calibrating…' : 'Mode: Live Mic')
          : (manualMode ? 'Mode: Guided Pacer' : 'Mode: Guided Pacer');
      }
      if (this.breathSensitivityReadout && typeof sensitivity === 'number') {
        this.breathSensitivityReadout.textContent = `${sensitivity.toFixed(1)}x`;
      }
      if (this.breathCountReadout && typeof breathCount === 'number') {
        this.breathCountReadout.textContent = `${breathCount} ${breathCount === 1 ? 'wave' : 'waves'}`;
      }
      if (this.breathPhaseLabel && phaseLabel && (active || error || manualMode)) {
        this.breathPhaseLabel.textContent = phaseLabel;
      }
    });

    this.tabletopBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('tabsirah-tabletop-toggle'));
    });

    this.exitTabletopBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('tabsirah-tabletop-toggle'));
    });

    window.addEventListener('tabsirah-tabletop-state', (evt) => {
      const active = Boolean(evt.detail?.active);
      document.body.classList.toggle('is-tabletop-mode', active);
      if (this.tabletopExitPill) this.tabletopExitPill.hidden = !active;
      if (this.tabletopBtn) {
        this.tabletopBtn.setAttribute('aria-pressed', String(active));
        this.tabletopBtn.classList.toggle('is-active', active);
        this.tabletopBtn.textContent = active ? 'Exit Tabletop (T)' : 'Tabletop (T)';
      }
    });

    this.convergenceBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('tabsirah-convergence-toggle'));
    });

    window.addEventListener('tabsirah-relics-updated', (evt) => {
      const { count = 0, total = 4, allUnlocked = false, convergenceActive = false } = evt.detail || {};
      if (this.relicProgressText) {
        this.relicProgressText.textContent = allUnlocked
          ? `${count} / ${total} Attuned (Unlocked)`
          : `${count} / ${total} Attuned`;
      }
      if (this.convergenceBtn) {
        this.convergenceBtn.setAttribute('aria-pressed', String(convergenceActive));
        this.convergenceBtn.classList.toggle('is-active', convergenceActive);
        this.convergenceBtn.textContent = convergenceActive
          ? 'Exit Convergence'
          : (allUnlocked ? `Convergence (${count}/${total})` : `Convergence (${count}/${total})`);
      }
    });

    this.wonderBrushBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('tabsirah-wonder-brush-toggle'));
    });

    window.addEventListener('tabsirah-wonder-brush-state', (evt) => {
      const active = Boolean(evt.detail?.active);
      if (this.wonderBrushBtn) {
        this.wonderBrushBtn.setAttribute('aria-pressed', String(active));
        this.wonderBrushBtn.classList.toggle('is-active', active);
        this.wonderBrushBtn.textContent = active ? 'Brush Active (W)' : 'Wonder Brush';
      }
    });

    // Wide View Immersion Mode Controls
    this.wideViewToggleBtn?.addEventListener('click', () => this.toggleWideView());
    this.topbarWideViewBtn?.addEventListener('click', () => this.toggleWideView());
    this.exitWideViewBtn?.addEventListener('click', () => this.setWideView(false));
    this.wideViewExitPill?.addEventListener('click', () => this.setWideView(false));

    this.vistaButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        natureAudio.unlock();
        const idx = parseInt(btn.getAttribute('data-vista-btn') || '0', 10);
        window.dispatchEvent(new CustomEvent('tabsirah-vista-go', { detail: { index: idx } }));
      });
    });

    window.addEventListener('tabsirah-vista-changed', (evt) => {
      const { index = 0, vistas = [] } = evt.detail || {};
      this.vistaButtons.forEach((btn) => {
        const bIdx = parseInt(btn.getAttribute('data-vista-btn') || '0', 10);
        const active = bIdx === index;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
        if (vistas[bIdx]?.label) btn.textContent = vistas[bIdx].label;
      });
    });

    // Sync local states when triggered from VR or external events
    window.addEventListener('aurora-shield-state', (evt) => {
      this.auroraShieldActive = Boolean(evt.detail?.visible);
      this.syncActionButton();
    });
    window.addEventListener('desert-aquifer-state', (evt) => {
      this.desertAquiferActive = Boolean(evt.detail?.visible);
      this.syncActionButton();
    });
    window.addEventListener('tabsirah-wonder-progress', (evt) => {
      const msg = evt.detail?.message;
      if (!msg || !this.hintEl) return;
      if (this.hintResetTimer) {
        clearTimeout(this.hintResetTimer);
        this.hintResetTimer = null;
      }
      this.hintEl.textContent = msg;
      this.hintEl.style.color = '#34D399';
      this.hintResetTimer = setTimeout(() => {
        if (!this.hintEl) return;
        const data = EARTH_BIOMES_DATA[this.currentBiomeId];
        this.hintEl.textContent = data?.interactionHint || '';
        this.hintEl.style.color = '';
        this.hintResetTimer = null;
      }, 5500);
    });

    // Contextual Wonder Controls (Desert Star Compass)
    this.compassLeftBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.sceneEl?.emit('desert-compass-rotate', { delta: 0.24 }, false);
    });
    this.compassRightBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.sceneEl?.emit('desert-compass-rotate', { delta: -0.24 }, false);
    });
    this.compassAlignBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.sceneEl?.emit('desert-compass-rotate', { align: true }, false);
    });

    // Cinematic Autopilot Bar Events
    this.demoModeBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      if (this.openingOverlay) this.openingOverlay.hidden = true;
      window.dispatchEvent(new CustomEvent('start-guiding-light-demo'));
    });
    this.tourPauseBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tabsirah-tour-toggle-pause'));
    });
    this.tourLoopBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tabsirah-tour-toggle-loop'));
    });
    this.tourNextBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tabsirah-tour-next'));
    });
    this.tourExitBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tabsirah-tour-exit'));
    });

    window.addEventListener('tabsirah-tour-state', (evt) => {
      const s = evt.detail || {};
      document.body.classList.toggle('is-cinematic', Boolean(s.active));
      if (this.tourBar) this.tourBar.hidden = !s.active;
      if (this.demoModeBtn) {
        this.demoModeBtn.textContent = s.active ? 'Stop Cinematic' : 'Cinematic Mode';
        this.demoModeBtn.setAttribute('aria-pressed', String(Boolean(s.active)));
      }
      if (this.tourStatusLabel && s.active) {
        const stagePart = s.stageLabel ? ` · ${s.stageLabel}` : '';
        this.tourStatusLabel.textContent = `Cinematic · ${(s.index ?? 0) + 1}/${s.total ?? 4} · ${s.title || ''}${stagePart}`;
      }
      if (this.tourProgressFill && typeof s.progress === 'number') {
        this.tourProgressFill.style.width = `${Math.round(s.progress * 100)}%`;
      }
      if (this.tourPauseBtn) {
        this.tourPauseBtn.textContent = s.paused ? 'Resume' : 'Pause';
      }
      if (this.tourLoopBtn && typeof s.loop === 'boolean') {
        this.tourLoopBtn.textContent = s.loop ? 'Loop: On' : 'Loop: Off';
        this.tourLoopBtn.classList.toggle('is-active', s.loop);
        this.tourLoopBtn.setAttribute('aria-pressed', String(s.loop));
      }
    });

    // Collapse Dock Button
    this.collapseDockBtn?.addEventListener('click', () => {
      if (!this.bottomStack) return;
      this.bottomStack.classList.toggle('is-collapsed');
      this.collapseDockBtn.textContent = this.bottomStack.classList.contains('is-collapsed')
        ? 'Show Controls (H)'
        : 'Hide Controls (H)';
    });

    // Real-World Field Media Drawer Events
    this.mediaToggleBtn?.addEventListener('click', () => this.setMediaVisible(!this.isMediaOpen));
    this.mediaCloseBtn?.addEventListener('click', () => this.setMediaVisible(false));
    this.mediaTabVideoBtn?.addEventListener('click', () => this.setMediaTab('video'));
    this.mediaTabPhotosBtn?.addEventListener('click', () => this.setMediaTab('photos'));
    this.mediaPrevPhotoBtn?.addEventListener('click', () => this.stepPhoto(-1));
    this.mediaNextPhotoBtn?.addEventListener('click', () => this.stepPhoto(1));

    // Living Creation Engine: Ecosystem & Time Machine Drawer
    this.ecosystemToggleBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const open = Boolean(this.ecosystemDrawer?.hidden);
      this.setEcosystemDrawerVisible(open);
    });
    this.closeEcosystemBtn?.addEventListener('click', () => this.setEcosystemDrawerVisible(false));
    this.horizonButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        natureAudio.unlock();
        const horizonId = btn.getAttribute('data-horizon-btn');
        if (horizonId) ecosystemEngine.setTimeHorizon(horizonId);
      });
    });
    this.expButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        natureAudio.unlock();
        const expId = btn.getAttribute('data-exp-btn');
        if (expId) ecosystemEngine.triggerExperiment(expId);
      });
    });
    this.ecoResetBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      ecosystemEngine.triggerExperiment('reset-baseline');
    });
    window.addEventListener('tabsirah-ecosystem-updated', (e) => {
      this.renderEcosystemDrawer(e.detail);
    });

    // Living Creation Engine: Spatial Scientific Lab Drawer & 3D Pedestal
    this.labToggleBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const open = Boolean(this.labDrawer?.hidden);
      this.openRightDrawer(open ? 'lab' : null);
    });
    this.closeLabBtn?.addEventListener('click', () => this.openRightDrawer(null));
    this.labBiomeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        natureAudio.unlock();
        const biomeId = btn.getAttribute('data-lab-biome');
        if (biomeId) {
          window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { biomeId, open: true } }));
        }
      });
    });
    this.labExtractBtn?.addEventListener('click', () => {
      const pressed = this.labExtractBtn.getAttribute('aria-pressed') === 'true';
      window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { extract: !pressed } }));
    });
    this.labRotLeftBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { rotateY: -0.45 } }));
    });
    this.labRotRightBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { rotateY: 0.45 } }));
    });
    this.labMicroBtn?.addEventListener('click', () => {
      const pressed = this.labMicroBtn.getAttribute('aria-pressed') === 'true';
      window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { microZoom: !pressed } }));
    });
    this.labScaleDownBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { scaleDelta: -0.15 } }));
    });
    this.labScaleUpBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { scaleDelta: 0.15 } }));
    });
    this.labScaleSlider?.addEventListener('input', (e) => {
      window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { scale: parseFloat(e.target.value) } }));
    });
    window.addEventListener('tabsirah-lab-state', (e) => {
      this.syncLabDrawerState(e.detail || {});
    });

    // Living Creation Engine: Discovery Journal Drawer
    this.journalToggleBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const open = Boolean(this.journalDrawer?.hidden);
      this.openRightDrawer(open ? 'journal' : null);
    });
    this.closeJournalBtn?.addEventListener('click', () => this.openRightDrawer(null));
    this.journalResetBtn?.addEventListener('click', () => {
      discoveryJournal.reset();
      this.discoveredBiomes = new Set([this.currentBiomeId]);
      discoveryJournal.recordBiome(this.currentBiomeId);
      this.updateProgressLabel();
      this.renderJournalDrawer();
    });
    window.addEventListener('tabsirah-journal-updated', (e) => {
      this.renderJournalDrawer(e.detail);
      this.syncCompass360UI(false);
    });

    // Living Creation Engine: Nature Science Companion Drawer
    this.companionToggleBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const open = Boolean(this.companionDrawer?.hidden);
      this.openRightDrawer(open ? 'companion' : null);
    });
    this.closeCompanionBtn?.addEventListener('click', () => this.openRightDrawer(null));
    this.companionForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = this.companionInput?.value?.trim();
      if (!q) return;
      await this.submitCompanionQuestion(q);
    });

    // Cosmic Convergence 2.0 Summary Modal
    window.addEventListener('tabsirah-convergence-state', (e) => {
      const { active } = e.detail || {};
      if (!this.convergenceModal) return;
      if (active) {
        this.renderConvergenceSummary();
        this.convergenceModal.hidden = false;
      } else {
        this.convergenceModal.hidden = true;
      }
    });
    this.closeConvergenceModalBtn?.addEventListener('click', () => {
      if (this.convergenceModal) this.convergenceModal.hidden = true;
    });
    this.convExitModeBtn?.addEventListener('click', () => {
      if (this.convergenceModal) this.convergenceModal.hidden = true;
      window.dispatchEvent(new CustomEvent('tabsirah-convergence-toggle', { detail: { active: false } }));
    });

    // Popover Menu Events
    this.moreControlsBtn?.addEventListener('click', () => {
      if (!this.moreControlsPopover) return;
      const isHidden = this.moreControlsPopover.hidden;
      this.moreControlsPopover.hidden = !isHidden;
      this.moreControlsBtn.setAttribute('aria-pressed', String(isHidden));
    });
    this.closePopoverBtn?.addEventListener('click', () => {
      if (this.moreControlsPopover) this.moreControlsPopover.hidden = true;
      if (this.moreControlsBtn) this.moreControlsBtn.setAttribute('aria-pressed', 'false');
    });

    // Zoom & Vantage Presets
    this.zoomOutBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: -0.55 } }));
    });
    this.zoomInBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: 0.55 } }));
    });
    this.vantageAerialBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: -0.82 } }));
    });
    this.vantageVistaBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: -0.38 } }));
    });
    this.zoomReadoutEl?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: 0 } }));
    });

    window.addEventListener('biome-zoom-changed', (evt) => {
      const z = evt.detail?.zoom ?? 0;
      const isAerial = z < -0.58;
      const isVista = !isAerial && z < -0.16;
      const isEye = !isAerial && !isVista;

      if (this.zoomReadoutEl) {
        this.zoomReadoutEl.textContent = isAerial || isVista
          ? `Aerial (${Math.round(8 + (-z) * 180)}m)`
          : 'Eye Level';
        this.zoomReadoutEl.classList.toggle('is-active', isEye);
        this.zoomReadoutEl.setAttribute('aria-pressed', String(isEye));
      }
      this.vantageVistaBtn?.classList.toggle('is-active', isVista);
      this.vantageAerialBtn?.classList.toggle('is-active', isAerial);
    });

    this.arrowModeBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.toggleArrowControlMode();
    });

    // Solar Day/Night Controls
    this.solarPresetBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const target = this.solarElevation < 0.12 ? 0.56 : -0.22;
      this.animateSolarTo(target);
    });

    this.solarSlider?.addEventListener('input', (e) => {
      natureAudio.unlock();
      if (this.solarAnimFrame) {
        cancelAnimationFrame(this.solarAnimFrame);
        this.solarAnimFrame = null;
      }
      this.setSolarElevation(parseFloat(e.target.value));
    });

    // Narration & Audio
    this.narrateBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const data = EARTH_BIOMES_DATA[this.currentBiomeId];
      natureNarrator.togglePlayPause(data.fullNarration);
    });

    window.addEventListener('narrator-state-changed', (evt) => {
      const { isSpeaking, isPaused } = evt.detail || {};
      let label = 'Narrate';
      if (isSpeaking && !isPaused) label = 'Pause';
      else if (isSpeaking && isPaused) label = 'Resume';
      if (this.narrateBtn) this.narrateBtn.textContent = label;
      if (this.reflectNarrateBtn) {
        this.reflectNarrateBtn.textContent = label === 'Narrate' ? 'Narrate Passage' : `${label} Voice`;
      }
      if (this.voiceWave) {
        this.voiceWave.classList.toggle('is-speaking', Boolean(isSpeaking && !isPaused));
      }
      window.dispatchEvent(new CustomEvent('biome-state-changed', { detail: { narrateLabel: label } }));
    });

    this.audioBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      const muted = natureAudio.toggleMute();
      this.audioBtn.textContent = muted ? 'Audio Off' : 'Audio On';
      this.audioBtn.setAttribute('aria-pressed', String(!muted));
      window.dispatchEvent(new CustomEvent('biome-state-changed', { detail: { muted } }));
    });

    this.bloomBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('toggle-wow-bloom'));
    });

    this.bloomSlider?.addEventListener('input', (e) => {
      natureAudio.unlock();
      this.applyBloomAtmosphere(parseFloat(e.target.value));
    });

    window.addEventListener('set-wow-bloom', (evt) => {
      const s = evt.detail?.strength;
      if (typeof s === 'number' && Number.isFinite(s)) {
        const clamped = Math.max(0, Math.min(2.5, s));
        if (this.bloomSlider) this.bloomSlider.value = String(clamped.toFixed(2));
        if (this.bloomReadout) this.bloomReadout.textContent = clamped.toFixed(2);
      }
    });

    this.timeScaleBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      this.slowMotionUser = !this.slowMotionUser;
      if (!this.isStillness) {
        window.tabsirahTimeScale = this.slowMotionUser ? 0.45 : 1.0;
      }
      this.timeScaleBtn.textContent = this.slowMotionUser ? 'Speed: 0.45x Slow Wonder' : 'Speed: 1.0x Normal';
      this.timeScaleBtn.classList.toggle('is-active', this.slowMotionUser);
      this.timeScaleBtn.setAttribute('aria-pressed', String(this.slowMotionUser));
    });

    // XR & MR Entry Buttons
    this.arBtn?.addEventListener('click', async () => {
      natureAudio.unlock();
      if (!this.sceneEl) return;
      if (this.sceneEl.is('ar-mode')) {
        Promise.resolve(this.sceneEl.exitVR?.()).catch(() => {});
        return;
      }
      try {
        if (navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar'))) {
          await this.sceneEl.enterAR?.();
          return;
        }
      } catch {
        // Fallback
      }
      Promise.resolve(this.sceneEl.enterAR?.()).catch(() => {});
    });

    this.vrBtn?.addEventListener('click', async () => {
      natureAudio.unlock();
      if (!this.sceneEl) return;
      if (this.sceneEl.is('vr-mode') || this.sceneEl.is('ar-mode')) {
        Promise.resolve(this.sceneEl.exitVR?.()).catch(() => {});
        return;
      }
      try {
        if (navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar'))) {
          await this.sceneEl.enterAR?.();
          return;
        }
      } catch {
        // Fallback cleanly to VR
      }
      Promise.resolve(this.sceneEl.enterVR?.()).catch(() => {});
    });

    if (this.sceneEl) {
      this.sceneEl.addEventListener('enter-vr', () => this.handleXRState(true));
      this.sceneEl.addEventListener('exit-vr', () => this.handleXRState(false));
      this.sceneEl.addEventListener('biome-gesture-rain', () => {
        if (this.currentBiomeId === 'rainforest' && !this.rainActive) {
          this.setRainState(true);
        }
      });

      this.sceneEl.addEventListener('loaded', () => {
        this.applyBiomeFog(this.currentBiomeId);
        const canvas = this.sceneEl.canvas;
        if (!canvas) return;
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
        });
        canvas.addEventListener('webglcontextrestored', () => {
          this.switchBiome(this.currentBiomeId, true);
        });
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.shiftKey) this.shiftPressed = true;

      if (e.key === 'Escape') {
        const isTabletop = Boolean(this.sceneEl?.components?.['xr-tabletop-portal']?.isTabletopMode);
        if (isTabletop) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('tabsirah-tabletop-toggle'));
          return;
        }
        if (window.tabsirahCinematicActive) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('tabsirah-tour-exit'));
          return;
        }
        if (this.isStillness) this.setStillnessMode(false);
        else if (this.convergenceModal && !this.convergenceModal.hidden) this.convergenceModal.hidden = true;
        else if (this.labDrawer && !this.labDrawer.hidden) this.openRightDrawer(null);
        else if (this.journalDrawer && !this.journalDrawer.hidden) this.openRightDrawer(null);
        else if (this.companionDrawer && !this.companionDrawer.hidden) this.openRightDrawer(null);
        else if (this.isMediaOpen) this.openRightDrawer(null);
        else if (this.ecosystemDrawer && !this.ecosystemDrawer.hidden) this.setEcosystemDrawerVisible(false);
        else if (this.moreControlsPopover && !this.moreControlsPopover.hidden) {
          this.moreControlsPopover.hidden = true;
          this.moreControlsBtn?.setAttribute('aria-pressed', 'false');
        } else if (this.isWideView) {
          e.preventDefault();
          this.setWideView(false);
        } else if (this.uiState !== 'explore') this.setUIState('explore');
      } else if (e.key === 's' || e.key === 'S') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        natureAudio.unlock();
        this.setStillnessMode(!this.isStillness);
      } else if (e.key === 'l' || e.key === 'L') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        natureAudio.unlock();
        const open = Boolean(this.labDrawer?.hidden);
        this.openRightDrawer(open ? 'lab' : null);
      } else if (e.key >= '1' && e.key <= '4') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        natureAudio.unlock();
        const idx = parseInt(e.key, 10) - 1;
        if (e.shiftKey || e.altKey) {
          window.dispatchEvent(new CustomEvent('tabsirah-vista-go', { detail: { index: idx } }));
        } else {
          if (BIOME_ORDER[idx]) this.switchBiome(BIOME_ORDER[idx]);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        natureAudio.unlock();
        if (this.openingOverlay && !this.openingOverlay.hidden) {
          this.openingOverlay.hidden = true;
        } else {
          this.stepBiome(e.shiftKey ? -1 : 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        natureAudio.unlock();
        this.activeArrowKeys.add('ArrowLeft');
        this.rotateCamera(0.065, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        natureAudio.unlock();
        this.activeArrowKeys.add('ArrowRight');
        this.rotateCamera(-0.065, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        natureAudio.unlock();
        this.activeArrowKeys.add('ArrowUp');
        if (e.shiftKey || e.ctrlKey || e.altKey || this.arrowControlMode === 'zoom') {
          window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: 0.5 } }));
        } else {
          this.rotateCamera(0, 0.055);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        natureAudio.unlock();
        this.activeArrowKeys.add('ArrowDown');
        if (e.shiftKey || e.ctrlKey || e.altKey || this.arrowControlMode === 'zoom') {
          window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: -0.5 } }));
        } else {
          this.rotateCamera(0, -0.055);
        }
      } else if (e.key === '+' || e.key === '=' || e.key === 'PageUp') {
        e.preventDefault();
        natureAudio.unlock();
        window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: 0.5 } }));
      } else if (e.key === '-' || e.key === '_' || e.key === 'PageDown') {
        e.preventDefault();
        natureAudio.unlock();
        window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: -0.5 } }));
      } else if (e.key === 'z' || e.key === 'Z') {
        this.toggleArrowControlMode();
      } else if (e.key === 'b' || e.key === 'B') {
        window.dispatchEvent(new CustomEvent('toggle-wow-bloom'));
      } else if (e.key === 't' || e.key === 'T') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        natureAudio.unlock();
        window.dispatchEvent(new CustomEvent('tabsirah-tabletop-toggle'));
      } else if (e.key === 'w' || e.key === 'W') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        natureAudio.unlock();
        window.dispatchEvent(new CustomEvent('tabsirah-wonder-brush-toggle'));
      } else if (e.key === 'g' || e.key === 'G') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        natureAudio.unlock();
        window.dispatchEvent(new CustomEvent('tabsirah-convergence-toggle'));
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        natureAudio.unlock();
        this.triggerBiomeAction();
      } else if (e.key === 'v' || e.key === 'V') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        this.toggleWideView();
      } else if (e.key === 'h' || e.key === 'H') {
        this.collapseDockBtn?.click();
      } else if (e.key === '[') {
        this.setSolarElevation(this.solarElevation - 0.08);
      } else if (e.key === ']') {
        this.setSolarElevation(this.solarElevation + 0.08);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!e.shiftKey) this.shiftPressed = false;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        this.activeArrowKeys.delete(e.key);
      }
    });

    window.addEventListener('blur', () => {
      this.activeArrowKeys.clear();
      this.shiftPressed = false;
    });
  }

  setWideView(active) {
    this.isWideView = Boolean(active);
    document.body.classList.toggle('is-wide-view', this.isWideView);
    if (this.wideViewExitPill) this.wideViewExitPill.hidden = !this.isWideView;
    if (this.wideViewToggleBtn) {
      this.wideViewToggleBtn.classList.toggle('is-active', this.isWideView);
      this.wideViewToggleBtn.setAttribute('aria-pressed', String(this.isWideView));
    }
    if (this.topbarWideViewBtn) {
      this.topbarWideViewBtn.classList.toggle('is-active', this.isWideView);
      this.topbarWideViewBtn.setAttribute('aria-pressed', String(this.isWideView));
    }

    const sceneEl = this.sceneEl;
    const cam = sceneEl?.camera;
    if (cam && !sceneEl.is('vr-mode') && !sceneEl.is('ar-mode')) {
      cam.fov = this.isWideView ? 96 : 88;
      cam.updateProjectionMatrix();
    }

    natureAudio.unlock();
    natureAudio.playTone(this.isWideView ? 523.25 : 392.0, 0.32, 'sine', 0.032);
    window.tabsirahHaptics?.playPattern('ui-tap', { hand: 'both' });
    window.dispatchEvent(
      new CustomEvent('tabsirah-wonder-progress', {
        detail: {
          message: this.isWideView
            ? 'Panoramic Wide View active — full unconstrained horizon'
            : 'Standard Explorer View restored'
        }
      })
    );
  }

  toggleWideView() {
    this.setWideView(!this.isWideView);
  }

  applyBloomAtmosphere(intensityValue) {
    const v = Math.max(0, Math.min(2.5, Number.isFinite(intensityValue) ? intensityValue : 1.25));
    const strength = Number(v.toFixed(2));
    const radius = Number((0.22 + (v / 2.5) * 0.86).toFixed(2));

    if (this.sceneEl) {
      const current = this.sceneEl.getAttribute('wow-postprocessing') || {};
      const enabled = v > 0 ? true : Boolean(current.enabled);
      this.sceneEl.setAttribute('wow-postprocessing', {
        enabled,
        strength,
        radius
      });
      if (this.bloomBtn && v > 0) {
        this.bloomBtn.classList.add('is-active');
        this.bloomBtn.setAttribute('aria-pressed', 'true');
        this.bloomBtn.textContent = 'Bloom Glow';
      }
    }

    if (this.bloomSlider) this.bloomSlider.value = String(strength);
    if (this.bloomReadout) this.bloomReadout.textContent = strength.toFixed(2);
  }

  activateCurrentDiscovery() {
    const biomeId = this.currentBiomeId;
    this.discoveredBiomes.add(biomeId);
    this.updateProgressLabel();
    if (biomeId === 'aurora' && !this.auroraShieldActive) this.setAuroraShieldState(true);
    else if (biomeId === 'rainforest' && !this.rainActive) this.setRainState(true);
    else if (biomeId === 'desert' && !this.desertAquiferActive) this.setDesertAquiferState(true);
    else if (biomeId === 'ocean') {
      this.oceanEnergized = true;
      this.sceneEl?.emit('ocean-bubble-surge', {}, false);
      this.syncActionButton();
    }
    window.dispatchEvent(new CustomEvent('tabsirah-relic-attuned', { detail: { biomeId } }));
  }

  updateProgressLabel() {
    if (!this.reflectionProgressEl) return;
    this.reflectionProgressEl.textContent =
      `${this.discoveredBiomes.size} / ${BIOME_ORDER.length} Biomes Discovered · Press S for Stillness · Space for next`;
  }

  setStillnessMode(active) {
    this.isStillness = Boolean(active);
    document.body.classList.toggle('is-stillness', this.isStillness);
    if (this.stillnessVeil) this.stillnessVeil.hidden = !this.isStillness;
    if (this.stillnessBtn) {
      this.stillnessBtn.setAttribute('aria-pressed', String(this.isStillness));
      this.stillnessBtn.classList.toggle('is-active', this.isStillness);
    }

    if (this.isStillness) {
      if (document.body.classList.contains('is-cinematic')) {
        window.dispatchEvent(new CustomEvent('tabsirah-tour-exit'));
      }
      this.openRightDrawer(null);
      this.setEcosystemDrawerVisible(false);
      if (this.moreControlsPopover) this.moreControlsPopover.hidden = true;
      window.tabsirahTimeScale = 0.42;
      natureAudio.setStillnessMode(true);
      window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.56, radius: 0.82 } }));
      this.startBreathPacer();
    } else {
      if (micBreathMonitor.isActive) micBreathMonitor.stop();
      natureAudio.setBreathHarmonicBoost(0);
      window.tabsirahBreathPhase = 0.25;
      window.tabsirahTimeScale = this.slowMotionUser ? 0.45 : 1.0;
      natureAudio.setStillnessMode(false);
      window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.25, radius: 0.65 } }));
      if (this.breathAnimFrame) {
        cancelAnimationFrame(this.breathAnimFrame);
        this.breathAnimFrame = null;
      }
    }

    window.dispatchEvent(new CustomEvent('tabsirah-stillness-state', { detail: { active: this.isStillness } }));
  }

  startBreathPacer() {
    if (this.breathAnimFrame) cancelAnimationFrame(this.breathAnimFrame);
    const startTime = performance.now();
    // 14-second calm contemplative breath cycle: 4s Inhale, 4s Hold, 6s Exhale (with calibrated Mic Breath option)
    const step = (now) => {
      if (!this.isStillness) return;
      const cycleSec = ((now - startTime) / 1000) % 14;
      let scale = 0.82;
      let breathPhase = 0.0;
      let label = 'Breathe in gently…';
      let ringColor = 'rgba(56, 189, 248, 0.72)';

      if (micBreathMonitor.isActive) {
        const micLvl = micBreathMonitor.sampleLevel();
        const micStatus = micBreathMonitor.getStatus();
        if (micStatus.status === 'calibrating') {
          breathPhase = 0.22;
          scale = 0.96;
          label = micStatus.phaseLabel;
          ringColor = 'rgba(251, 191, 36, 0.78)';
        } else {
          breathPhase = Math.min(1.0, 0.14 + micLvl * 1.15);
          scale = 0.84 + breathPhase * 0.66;
          label = micStatus.phaseLabel || (micLvl > 0.18 ? 'Breath wave detected (local audio)' : 'Ready — exhale softly near mic');
          ringColor = micLvl > 0.18 ? 'rgba(52, 211, 153, 0.88)' : 'rgba(56, 189, 248, 0.76)';
          natureAudio.setBreathHarmonicBoost(micLvl);
        }
      } else if (cycleSec < 4) {
        const p = cycleSec / 4;
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);
        breathPhase = ease;
        scale = 0.82 + ease * 0.58;
        label = 'Breathe in gently…';
        ringColor = 'rgba(56, 189, 248, 0.76)';
      } else if (cycleSec < 8) {
        breathPhase = 1.0;
        scale = 1.4;
        label = 'Hold stillness & notice…';
        ringColor = 'rgba(251, 191, 36, 0.82)';
      } else {
        const p = (cycleSec - 8) / 6;
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);
        breathPhase = 1.0 - ease;
        scale = 1.4 - ease * 0.58;
        label = 'Release slowly…';
        ringColor = 'rgba(52, 211, 153, 0.72)';
      }

      window.tabsirahBreathPhase = breathPhase;

      if (this.breathRingOuter) {
        this.breathRingOuter.style.transform = `scale(${scale.toFixed(3)})`;
        this.breathRingOuter.style.borderColor = ringColor;
      }
      if (this.breathPhaseLabel && this.breathPhaseLabel.textContent !== label) {
        this.breathPhaseLabel.textContent = label;
      }

      this.breathAnimFrame = requestAnimationFrame(step);
    };
    this.breathAnimFrame = requestAnimationFrame(step);
  }

  setUIState(nextState) {
    this.uiState = nextState;
    const isReflectOpen = nextState === 'reflect' || nextState === 'understand';

    if (this.discoverCard) this.discoverCard.hidden = nextState !== 'discover';
    if (this.reflectPanel) this.reflectPanel.hidden = !isReflectOpen;
    if (this.reflectToggleBtn) {
      this.reflectToggleBtn.setAttribute('aria-pressed', String(isReflectOpen));
    }
    if (this.reflectScienceBox) {
      this.reflectScienceBox.classList.toggle('is-highlighted', nextState === 'understand');
    }

    if (nextState === 'understand' && this.reflectScienceBox) {
      requestAnimationFrame(() => {
        this.reflectScienceBox?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } else if (nextState === 'reflect' && this.reflectPanel) {
      requestAnimationFrame(() => {
        if (this.reflectPanel) this.reflectPanel.scrollTop = 0;
      });
    }

    const stepMap = [
      [this.stepExplore, nextState === 'explore'],
      [this.stepDiscover, nextState === 'discover'],
      [this.stepUnderstand, nextState === 'understand'],
      [this.stepReflect, nextState === 'reflect']
    ];
    stepMap.forEach(([el, active]) => {
      if (!el) return;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-selected', String(active));
    });
  }

  rotateCamera(deltaYaw, deltaPitch) {
    if (this.compassTurnAnimFrame) {
      cancelAnimationFrame(this.compassTurnAnimFrame);
      this.compassTurnAnimFrame = null;
    }
    const camEl = this.sceneEl?.querySelector('a-camera') || this.sceneEl?.camera?.el;
    if (!camEl) return;
    const lc = camEl.components && camEl.components['look-controls'];
    if (lc) {
      if (lc.yawObject && deltaYaw !== 0) {
        lc.yawObject.rotation.y += deltaYaw;
      }
      if (lc.pitchObject && deltaPitch !== 0) {
        lc.pitchObject.rotation.x = Math.max(-1.48, Math.min(1.48, lc.pitchObject.rotation.x + deltaPitch));
      }
    } else if (camEl.object3D) {
      if (deltaYaw !== 0) camEl.object3D.rotation.y += deltaYaw;
      if (deltaPitch !== 0) {
        camEl.object3D.rotation.x = Math.max(-1.48, Math.min(1.48, camEl.object3D.rotation.x + deltaPitch));
      }
    }
  }

  rotateCameraToDirection(dir) {
    const yawMap = { N: 0, E: -Math.PI / 2, S: Math.PI, W: Math.PI / 2 };
    const targetYaw = yawMap[dir] ?? 0;
    this.facingDirection = dir;
    this.compassDirButtons.forEach((btn) => {
      btn.classList.toggle('is-facing', btn.getAttribute('data-compass-dir') === dir);
    });

    const camEl = this.sceneEl?.querySelector('a-camera') || this.sceneEl?.camera?.el;
    if (!camEl) return;
    const lc = camEl.components && camEl.components['look-controls'];
    const yawTargetObj = lc?.yawObject || camEl.object3D;
    const pitchTargetObj = lc?.pitchObject || camEl.object3D;
    if (!yawTargetObj) return;

    if (this.compassTurnAnimFrame) {
      cancelAnimationFrame(this.compassTurnAnimFrame);
      this.compassTurnAnimFrame = null;
    }

    const startYaw = yawTargetObj.rotation.y;
    const startPitch = pitchTargetObj ? pitchTargetObj.rotation.x : 0;
    const diffYaw = Math.atan2(Math.sin(targetYaw - startYaw), Math.cos(targetYaw - startYaw));
    const targetPitch = -0.04;
    const startTime = performance.now();
    const duration = 680;

    natureAudio.playTone(dir === 'N' ? 523.25 : dir === 'E' ? 587.33 : dir === 'S' ? 659.25 : 493.88, 0.22, 'sine', 0.025);
    window.tabsirahHaptics?.playPattern('ui-tap', { hand: 'both' });

    const siteMeta = BIOME_360_SITES[this.currentBiomeId]?.[dir];
    if (siteMeta) {
      window.dispatchEvent(
        new CustomEvent('tabsirah-wonder-progress', {
          detail: { message: `${dir} Quadrant: ${siteMeta.title} (${siteMeta.discipline}) — touch 3D site to interact` }
        })
      );
    }

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      yawTargetObj.rotation.y = startYaw + diffYaw * ease;
      if (pitchTargetObj && pitchTargetObj !== yawTargetObj) {
        pitchTargetObj.rotation.x = startPitch + (targetPitch - startPitch) * ease;
      }
      if (t < 1) {
        this.compassTurnAnimFrame = requestAnimationFrame(step);
      } else {
        this.compassTurnAnimFrame = null;
      }
    };
    this.compassTurnAnimFrame = requestAnimationFrame(step);
  }

  syncCompass360UI(checkSymphony = false) {
    const snap = discoveryJournal.getSnapshot();
    const discoveredSet = new Set(snap.discoveredQuadrants || []);
    const dirs = ['N', 'E', 'S', 'W'];
    let count = 0;

    this.compassDirButtons.forEach((btn) => {
      const d = btn.getAttribute('data-compass-dir') || 'N';
      const isDisc = discoveredSet.has(`${this.currentBiomeId}:${d}`);
      if (isDisc) count += 1;
      btn.classList.toggle('is-discovered', isDisc);
      btn.classList.toggle('is-facing', d === this.facingDirection);
      const siteInfo = BIOME_360_SITES[this.currentBiomeId]?.[d];
      if (siteInfo) {
        btn.title = `${d}: ${siteInfo.title} (${siteInfo.discipline})${isDisc ? ' — Explored' : ''}`;
      }
    });

    if (this.compass360Count) {
      this.compass360Count.textContent = `${count}/${dirs.length}`;
    }

    if (checkSymphony && count === 4 && !this.symphonyUnlockedBiomes.has(this.currentBiomeId)) {
      this.symphonyUnlockedBiomes.add(this.currentBiomeId);
      natureAudio.playBiome360Symphony(this.currentBiomeId);
      window.tabsirahHaptics?.playPattern('convergence', { hand: 'both' });
      const title = EARTH_BIOMES_DATA[this.currentBiomeId]?.shortTitle || this.currentBiomeId;
      window.dispatchEvent(
        new CustomEvent('tabsirah-wonder-progress', {
          detail: {
            message: `Full 360° ${title} Symphony Unlocked! All N·E·S·W natural field sites explored.`
          }
        })
      );
    }
  }

  toggleArrowControlMode() {
    this.arrowControlMode = this.arrowControlMode === 'rotate' ? 'zoom' : 'rotate';
    if (this.arrowModeBtn) {
      this.arrowModeBtn.textContent = this.arrowControlMode === 'rotate' ? 'Arrows: Rotate' : 'Arrows: Zoom';
      this.arrowModeBtn.classList.toggle('is-active', this.arrowControlMode === 'zoom');
    }
  }

  startArrowKeyLoop() {
    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (this.activeArrowKeys && this.activeArrowKeys.size > 0) {
        const isZoom = this.shiftPressed || this.arrowControlMode === 'zoom';
        const yawSpeed = 1.35;
        const pitchSpeed = 1.1;
        let deltaYaw = 0;
        let deltaPitch = 0;

        if (this.activeArrowKeys.has('ArrowLeft')) deltaYaw += yawSpeed * dt;
        if (this.activeArrowKeys.has('ArrowRight')) deltaYaw -= yawSpeed * dt;

        if (this.activeArrowKeys.has('ArrowUp')) {
          if (isZoom) window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: 2.2 * dt } }));
          else deltaPitch += pitchSpeed * dt;
        }
        if (this.activeArrowKeys.has('ArrowDown')) {
          if (isZoom) window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: -2.2 * dt } }));
          else deltaPitch -= pitchSpeed * dt;
        }

        if (deltaYaw !== 0 || deltaPitch !== 0) {
          this.rotateCamera(deltaYaw, deltaPitch);
        }
      }

      this.arrowAnimFrame = requestAnimationFrame(tick);
    };
    this.arrowAnimFrame = requestAnimationFrame(tick);
  }

  handleXRState(active) {
    const isAR = Boolean(this.sceneEl?.is('ar-mode'));
    if (this.vrBtn) {
      this.vrBtn.textContent = active ? (isAR ? 'Exit MR' : 'Exit VR') : 'Enter VR / MR';
    }
    if (this.arBtn) {
      this.arBtn.textContent = active && isAR ? 'Exit MR' : 'MR Passthrough';
      this.arBtn.setAttribute('aria-pressed', String(active && isAR));
    }
    if (this.skyDomeEl) {
      this.skyDomeEl.setAttribute('visible', !isAR);
    }
    if (this.mrDioramaRingEl) {
      this.mrDioramaRingEl.setAttribute('visible', active && isAR);
    }

    const dioramaRadius = 0.425;
    const dioramaCenter = [0, -1.05];
    window.tabsirahMrDiorama = {
      active: Boolean(active && isAR),
      radius: active && isAR ? dioramaRadius : 0,
      center: dioramaCenter
    };
    window.dispatchEvent(new CustomEvent('tabsirah-mr-diorama', { detail: window.tabsirahMrDiorama }));

    if (this.container?.object3D) {
      if (active && isAR) {
        this.container.object3D.position.set(0, 0.88, -1.05);
        this.container.object3D.scale.setScalar(0.155);
      } else {
        this.container.object3D.position.set(0, 0, 0);
        this.container.object3D.scale.setScalar(1.0);
      }
    }

    if (this.sceneEl?.renderer) {
      const renderer = this.sceneEl.renderer;
      renderer.setClearAlpha(isAR ? 0 : 1);
      if (active && isAR) {
        if (!this.mrClipPlanes) {
          this.mrClipPlanes = [];
          const segs = 12;
          for (let i = 0; i < segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            const normal = new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a));
            const coplanar = new THREE.Vector3(Math.cos(a) * dioramaRadius, 0.88, -1.05 + Math.sin(a) * dioramaRadius);
            this.mrClipPlanes.push(new THREE.Plane().setFromNormalAndCoplanarPoint(normal, coplanar));
          }
        }
        renderer.localClippingEnabled = true;
        renderer.clippingPlanes = this.mrClipPlanes;
      } else {
        renderer.clippingPlanes = [];
      }
    }
    this.applyBiomeFog(this.currentBiomeId);
  }

  applyBiomeFog(biomeId) {
    const obj = this.sceneEl?.object3D;
    if (!obj) return;
    const isTabletop = Boolean(this.sceneEl?.components?.['xr-tabletop-portal']?.isTabletopMode);
    if (this.sceneEl?.is('ar-mode') || isTabletop) {
      obj.fog = null;
      return;
    }
    if (biomeId === 'ocean') obj.fog = new THREE.FogExp2('#0E7490', 0.0055);
    else if (biomeId === 'rainforest') obj.fog = new THREE.FogExp2('#10B981', 0.0012);
    else if (biomeId === 'desert') obj.fog = new THREE.FogExp2('#FDE68A', 0.0010);
    else if (biomeId === 'aurora') obj.fog = new THREE.FogExp2('#0EA5E9', 0.0014);
    else obj.fog = null;
  }

  setEcosystemDrawerVisible(visible) {
    const show = Boolean(visible);
    if (this.ecosystemDrawer) this.ecosystemDrawer.hidden = !show;
    if (this.ecosystemToggleBtn) {
      this.ecosystemToggleBtn.setAttribute('aria-pressed', String(show));
      this.ecosystemToggleBtn.classList.toggle('is-active', show);
    }
    if (show) this.renderEcosystemDrawer();
  }

  openRightDrawer(name) {
    const isMedia = name === 'media';
    const isLab = name === 'lab';
    const isJournal = name === 'journal';
    const isCompanion = name === 'companion';

    this.isMediaOpen = isMedia;
    if (this.mediaDrawer) this.mediaDrawer.hidden = !isMedia;
    if (this.mediaToggleBtn) this.mediaToggleBtn.setAttribute('aria-pressed', String(isMedia));
    if (isMedia) this.syncMediaDrawer();
    else if (this.mediaIframe) this.mediaIframe.src = 'about:blank';

    if (this.labDrawer) this.labDrawer.hidden = !isLab;
    if (this.labToggleBtn) {
      this.labToggleBtn.setAttribute('aria-pressed', String(isLab));
      this.labToggleBtn.classList.toggle('is-active', isLab);
    }
    window.dispatchEvent(new CustomEvent('tabsirah-lab-command', { detail: { open: isLab } }));

    if (this.journalDrawer) this.journalDrawer.hidden = !isJournal;
    if (this.journalToggleBtn) {
      this.journalToggleBtn.setAttribute('aria-pressed', String(isJournal));
      this.journalToggleBtn.classList.toggle('is-active', isJournal);
    }
    if (isJournal) this.renderJournalDrawer();

    if (this.companionDrawer) this.companionDrawer.hidden = !isCompanion;
    if (this.companionToggleBtn) {
      this.companionToggleBtn.setAttribute('aria-pressed', String(isCompanion));
      this.companionToggleBtn.classList.toggle('is-active', isCompanion);
    }
    if (isCompanion) this.renderCompanionPrompts(this.currentBiomeId);
  }

  renderEcosystemDrawer(state = ecosystemEngine.getState()) {
    this.horizonButtons.forEach((btn) => {
      const hId = btn.getAttribute('data-horizon-btn');
      const active = hId === state.timeHorizon;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    if (this.ecosystemHorizonNote) {
      this.ecosystemHorizonNote.textContent = state.horizonMeta?.note || '';
    }
    this.expButtons.forEach((btn) => {
      const expId = btn.getAttribute('data-exp-btn');
      const active = state.activeExperiments?.includes(expId);
      btn.classList.toggle('is-active', Boolean(active));
      btn.setAttribute('aria-pressed', String(Boolean(active)));
    });
    if (this.ecosystemMetricsList && state.biomes) {
      const rows = [
        ['Polar Aurora · Geomagnetic Excitation', state.biomes.aurora.upperAirExcitation, '#34D399'],
        ['Living Rainforest · Canopy Moisture', state.biomes.rainforest.canopyMoisture, '#10B981'],
        ['Coral Cathedral · Reef Symbiosis Health', state.biomes.ocean.coralHealth, '#22D3EE'],
        ['Desert Oasis · Oasis Hydration', state.biomes.desert.oasisHydration, '#FBBF24']
      ];
      this.ecosystemMetricsList.textContent = '';
      rows.forEach(([label, val, color]) => {
        const pct = Math.round(Math.max(0, Math.min(1, val || 0)) * 100);
        const row = document.createElement('div');
        row.className = 'lce-metric-row';
        const head = document.createElement('div');
        head.className = 'lce-metric-head';
        const lSpan = document.createElement('span');
        lSpan.textContent = label;
        const pSpan = document.createElement('span');
        pSpan.textContent = `${pct}%`;
        head.append(lSpan, pSpan);
        const track = document.createElement('div');
        track.className = 'lce-meter-track';
        const fill = document.createElement('div');
        fill.className = 'lce-meter-fill';
        fill.style.width = `${pct}%`;
        fill.style.background = color;
        track.appendChild(fill);
        row.append(head, track);
        this.ecosystemMetricsList.appendChild(row);
      });
    }
    if (this.ecosystemChainBox) {
      this.ecosystemChainBox.textContent = '';
      const chain = state.lastChain || [];
      if (chain.length > 0) {
        const lead = document.createElement('div');
        lead.textContent = chain[0];
        this.ecosystemChainBox.appendChild(lead);
        if (chain.length > 1) {
          const ul = document.createElement('ul');
          chain.slice(1).forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
          });
          this.ecosystemChainBox.appendChild(ul);
        }
      }
    }
    if (this.ecosystemDisclaimer) {
      this.ecosystemDisclaimer.textContent = state.disclaimer || ECOSYSTEM_MODEL_DISCLAIMER;
    }
  }

  syncLabDrawerState(detail) {
    const spec = detail.specimen || LAB_SPECIMENS[detail.biomeId || this.currentBiomeId] || LAB_SPECIMENS.aurora;
    if (this.labSpecimenTitle) this.labSpecimenTitle.textContent = spec.title;
    this.labBiomeButtons.forEach((btn) => {
      const active = btn.getAttribute('data-lab-biome') === spec.biomeId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    if (this.labExtractBtn) {
      const ext = detail.extracted !== false;
      this.labExtractBtn.setAttribute('aria-pressed', String(ext));
      this.labExtractBtn.classList.toggle('is-active', ext);
      this.labExtractBtn.textContent = ext ? 'Extracted' : 'Return Specimen';
    }
    if (this.labMicroBtn) {
      const micro = Boolean(detail.microZoom);
      this.labMicroBtn.setAttribute('aria-pressed', String(micro));
      this.labMicroBtn.classList.toggle('is-active', micro);
      this.labMicroBtn.textContent = micro ? 'Fine Structure: On' : 'Fine Structure';
    }
    if (typeof detail.scale === 'number') {
      if (this.labScaleSlider) this.labScaleSlider.value = detail.scale.toFixed(2);
      if (this.labScaleReadout) this.labScaleReadout.textContent = `${detail.scale.toFixed(2)}x`;
    }
    if (this.labScaleLabel) this.labScaleLabel.textContent = spec.scaleLabel;
    if (this.labSummaryText) this.labSummaryText.textContent = spec.summary;
    if (this.labMicroText) this.labMicroText.textContent = `Cellular & Atomic Scale: ${spec.microDetail}`;
  }

  renderJournalDrawer(snap = discoveryJournal.getSnapshot()) {
    if (this.journalBiomesCount) this.journalBiomesCount.textContent = `${snap.discoveredBiomes.length} / 4`;
    if (this.journalExperimentsCount) this.journalExperimentsCount.textContent = `${snap.completedExperiments.length} / 4`;
    if (this.journalRelicsCount) this.journalRelicsCount.textContent = `${snap.unlockedRelics.length} / 4`;
    if (this.journalSpecimensCount) this.journalSpecimensCount.textContent = `${snap.inspectedSpecimens.length} / 4`;
    if (this.journalDetailList) {
      this.journalDetailList.textContent = '';
      const rows = [
        `Biomes explored: ${snap.discoveredBiomes.map((id) => EARTH_BIOMES_DATA[id]?.shortTitle || id).join(', ') || 'None yet'}`,
        `360° Field Sites: ${snap.discoveredQuadrants?.length || 0} / 16 across N · E · S · W quadrants`,
        `Wonders played: ${snap.inspectedWonders?.length || 0} / 8 interactive 3D biome instruments`,
        `Experiments run: ${snap.completedExperiments.map((id) => ECOSYSTEM_EXPERIMENTS.find((e) => e.id === id)?.shortLabel || id).join(', ') || 'None yet'}`,
        `Relics attuned: ${snap.unlockedRelics.map((id) => EARTH_BIOMES_DATA[id]?.shortTitle || id).join(', ') || 'None yet'}`,
        `Time horizons visited: ${snap.visitedHorizons.map((id) => TIME_HORIZONS[id]?.shortLabel || id).join(', ')}`
      ];
      rows.forEach((line) => {
        const div = document.createElement('div');
        div.style.marginBottom = '4px';
        div.textContent = line;
        this.journalDetailList.appendChild(div);
      });
    }
  }

  renderCompanionPrompts(biomeId = this.currentBiomeId) {
    if (!this.companionQuickPrompts) return;
    this.companionQuickPrompts.textContent = '';
    const prompts = COMPANION_QUICK_PROMPTS[biomeId] || COMPANION_QUICK_PROMPTS.aurora;
    prompts.forEach((prompt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hud-btn';
      btn.style.textAlign = 'left';
      btn.style.whiteSpace = 'normal';
      btn.textContent = prompt;
      btn.addEventListener('click', () => {
        if (this.companionInput) this.companionInput.value = prompt;
        this.submitCompanionQuestion(prompt);
      });
      this.companionQuickPrompts.appendChild(btn);
    });
  }

  async submitCompanionQuestion(question) {
    const data = EARTH_BIOMES_DATA[this.currentBiomeId] || EARTH_BIOMES_DATA.aurora;
    if (this.companionAskBtn) this.companionAskBtn.disabled = true;
    if (this.companionAnswer) this.companionAnswer.textContent = 'Analyzing active biome & ecosystem context…';

    const result = await askNatureCompanion({
      question,
      biomeId: this.currentBiomeId,
      scienceContext: data.scientificContext,
      experimentState: ecosystemEngine.getState(),
      journalSummary: discoveryJournal.getSnapshot()
    });

    if (this.companionModeLabel) {
      this.companionModeLabel.textContent =
        result.mode === 'ai' ? 'Live AI Companion (Gemini)' : 'Science Guide · Offline Mode';
    }
    if (this.companionAnswer) this.companionAnswer.textContent = result.answer;
    if (this.companionAskBtn) this.companionAskBtn.disabled = false;
  }

  renderConvergenceSummary() {
    if (!this.convSummaryStats) return;
    const snap = discoveryJournal.getSnapshot();
    const eco = ecosystemEngine.getState();
    this.convSummaryStats.textContent =
      `Journal Progress: ${snap.discoveredBiomes.length}/4 Biomes · ${snap.unlockedRelics.length}/4 Relics · ${snap.completedExperiments.length}/4 Experiments · ${snap.inspectedSpecimens.length}/4 Lab Specimens · Active Horizon: ${eco.horizonMeta?.label || 'Current'}`;
  }

  setMediaVisible(visible) {
    this.openRightDrawer(visible ? 'media' : null);
  }

  setMediaTab(tab) {
    this.mediaTab = tab;
    const isVideo = tab === 'video';
    this.mediaTabVideoBtn?.classList.toggle('is-active', isVideo);
    this.mediaTabVideoBtn?.setAttribute('aria-pressed', String(isVideo));
    this.mediaTabPhotosBtn?.classList.toggle('is-active', !isVideo);
    this.mediaTabPhotosBtn?.setAttribute('aria-pressed', String(!isVideo));
    if (this.mediaVideoPanel) this.mediaVideoPanel.hidden = !isVideo;
    if (this.mediaPhotosPanel) this.mediaPhotosPanel.hidden = isVideo;
    this.syncMediaDrawer();
  }

  stepPhoto(delta) {
    const photos = EARTH_BIOMES_DATA[this.currentBiomeId]?.realMedia?.photos || [];
    if (!photos.length) return;
    this.photoIndex = (this.photoIndex + delta + photos.length) % photos.length;
    this.renderCurrentPhoto();
  }

  renderCurrentPhoto() {
    const photos = EARTH_BIOMES_DATA[this.currentBiomeId]?.realMedia?.photos || [];
    const item = photos[this.photoIndex % Math.max(1, photos.length)];
    if (!item) return;
    if (this.mediaPhotoImg) {
      this.mediaPhotoImg.src = item.url;
      this.mediaPhotoImg.alt = item.caption;
    }
    if (this.mediaPhotoCaption) this.mediaPhotoCaption.textContent = item.caption;
    if (this.mediaPhotoCredit) {
      this.mediaPhotoCredit.textContent = `${item.credit} (${this.photoIndex + 1}/${photos.length})`;
    }
  }

  syncMediaDrawer() {
    if (!this.isMediaOpen) return;
    const data = EARTH_BIOMES_DATA[this.currentBiomeId];
    if (!data?.realMedia) return;

    if (this.mediaCoordsEl) this.mediaCoordsEl.textContent = data.coordinates;

    if (this.mediaTab === 'video') {
      const targetSrc = `https://www.youtube.com/embed/${data.realMedia.youtubeId}?rel=0&modestbranding=1`;
      if (this.mediaIframe && this.mediaIframe.src !== targetSrc) {
        this.mediaIframe.src = targetSrc;
      }
      if (this.mediaVideoTitle) this.mediaVideoTitle.textContent = data.realMedia.videoTitle;
    } else {
      if (this.mediaIframe && this.mediaIframe.src !== 'about:blank') {
        this.mediaIframe.src = 'about:blank';
      }
      this.renderCurrentPhoto();
    }
  }

  formatSolarLabel(elev) {
    if (elev < -0.1) return 'Starlight';
    if (elev < 0.08) return 'Twilight';
    if (elev < 0.28) return 'Golden Hour';
    if (elev < 0.58) return 'Morning';
    return 'High Sun';
  }

  setSolarElevation(value) {
    this.solarElevation = Math.max(-0.25, Math.min(0.85, value));
    if (this.solarSlider) this.solarSlider.value = String(this.solarElevation.toFixed(2));
    if (this.solarReadout) this.solarReadout.textContent = this.formatSolarLabel(this.solarElevation);
    if (this.solarPresetBtn) {
      const isNight = this.solarElevation < 0.12;
      this.solarPresetBtn.textContent = isNight ? 'Daylight' : 'Starlight';
      this.solarPresetBtn.setAttribute('aria-pressed', String(!isNight));
    }
    natureAudio.setSolarElevation(this.solarElevation);
    window.dispatchEvent(new CustomEvent('biome-solar-changed', { detail: { solar: this.solarElevation } }));

    if (this.currentBiomeId === 'desert') {
      const duskIntensity = Math.max(0.12, Math.min(1.0, 1.0 - (this.solarElevation + 0.1) * 1.8));
      this.sceneEl?.emit('biome-weather-update', {
        targetId: 'desert-dusk-fireflies',
        intensity: duskIntensity
      });
    }
    this.syncWonderContextBar();
  }

  syncWonderContextBar() {
    if (!this.wonderContextBar) return;
    const isDesertCompass = this.currentBiomeId === 'desert' && this.solarElevation < 0.14;
    this.wonderContextBar.hidden = !isDesertCompass;
    if (this.desertCompassControls) this.desertCompassControls.hidden = !isDesertCompass;
    if (this.wonderContextLabel && isDesertCompass) {
      this.wonderContextLabel.textContent = 'Star Compass: Align Polaris North';
    }
  }

  animateSolarTo(target) {
    if (this.solarAnimFrame) cancelAnimationFrame(this.solarAnimFrame);
    const start = this.solarElevation;
    const startTime = performance.now();
    const duration = 1100;
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t * t * (3 - 2 * t);
      this.setSolarElevation(start + (target - start) * ease);
      if (t < 1) this.solarAnimFrame = requestAnimationFrame(step);
      else this.solarAnimFrame = null;
    };
    this.solarAnimFrame = requestAnimationFrame(step);
  }

  setAuroraShieldState(visible) {
    this.auroraShieldActive = Boolean(visible);
    this.sceneEl?.emit('aurora-toggle-shield', { visible: this.auroraShieldActive }, false);
    this.syncActionButton();
  }

  setRainState(active) {
    this.rainActive = Boolean(active);
    const rainEl = document.getElementById('rainforest-rain-emitter');
    if (rainEl) {
      rainEl.setAttribute('biome-particle-system', 'active', this.rainActive);
    }
    this.sceneEl?.emit('biome-weather-update', { targetId: 'rainforest-rain-emitter', active: this.rainActive }, false);
    this.sceneEl?.emit('rainforest-rain-state', { active: this.rainActive }, false);
    natureAudio.setRainIntensity(this.rainActive ? 1.0 : 0.0);
    this.syncActionButton();
  }

  setDesertAquiferState(visible) {
    this.desertAquiferActive = Boolean(visible);
    this.sceneEl?.emit('desert-toggle-aquifer', { visible: this.desertAquiferActive }, false);
    this.syncActionButton();
  }

  syncActionButton() {
    if (!this.actionBtn) return;
    const data = EARTH_BIOMES_DATA[this.currentBiomeId];
    let actionLabel = data.discovery?.revelationLabel || data.actionLabel;
    let actionActive = false;

    if (this.currentBiomeId === 'aurora') {
      actionActive = this.auroraShieldActive;
      actionLabel = this.auroraShieldActive ? data.discovery?.activeLabel : actionLabel;
    } else if (this.currentBiomeId === 'rainforest') {
      actionActive = this.rainActive;
      actionLabel = this.rainActive ? data.discovery?.activeLabel : actionLabel;
    } else if (this.currentBiomeId === 'ocean') {
      actionActive = this.oceanEnergized;
      actionLabel = this.oceanEnergized ? data.discovery?.activeLabel : actionLabel;
    } else if (this.currentBiomeId === 'desert') {
      actionActive = this.desertAquiferActive;
      actionLabel = this.desertAquiferActive ? data.discovery?.activeLabel : actionLabel;
    }

    this.actionBtn.textContent = actionLabel;
    this.actionBtn.setAttribute('aria-pressed', String(actionActive));
    window.dispatchEvent(
      new CustomEvent('biome-state-changed', {
        detail: {
          biomeId: this.currentBiomeId,
          shortTitle: data.shortTitle || data.title,
          actionLabel,
          actionActive
        }
      })
    );
  }

  triggerBiomeAction() {
    this.haptics?.playPattern('biome-action', { biomeId: this.currentBiomeId, hand: 'both' });
    switch (this.currentBiomeId) {
      case 'aurora':
        this.setAuroraShieldState(!this.auroraShieldActive);
        if (this.auroraShieldActive) {
          window.dispatchEvent(new CustomEvent('tabsirah-relic-attuned', { detail: { biomeId: 'aurora' } }));
          if (this.uiState === 'explore') this.setUIState('discover');
        }
        break;
      case 'rainforest':
        this.setRainState(!this.rainActive);
        if (this.rainActive) {
          window.dispatchEvent(new CustomEvent('tabsirah-relic-attuned', { detail: { biomeId: 'rainforest' } }));
          if (this.uiState === 'explore') this.setUIState('discover');
        }
        break;
      case 'ocean':
        this.oceanEnergized = true;
        this.sceneEl?.emit('ocean-bubble-surge', {}, false);
        this.syncActionButton();
        window.dispatchEvent(new CustomEvent('tabsirah-relic-attuned', { detail: { biomeId: 'ocean' } }));
        if (this.uiState === 'explore') this.setUIState('discover');
        break;
      case 'desert':
        this.setDesertAquiferState(!this.desertAquiferActive);
        if (this.desertAquiferActive) {
          window.dispatchEvent(new CustomEvent('tabsirah-relic-attuned', { detail: { biomeId: 'desert' } }));
          if (this.uiState === 'explore') this.setUIState('discover');
        }
        break;
      default:
        break;
    }
  }

  stepBiome(delta) {
    const idx = BIOME_ORDER.indexOf(this.currentBiomeId);
    const nextIdx = (idx + delta + BIOME_ORDER.length) % BIOME_ORDER.length;
    this.switchBiome(BIOME_ORDER[nextIdx]);
  }

  switchBiome(biomeId, immediate = false) {
    if (!EARTH_BIOMES_DATA[biomeId] || (this.isTransitioning && !immediate)) return;

    this.currentBiomeId = biomeId;
    window.tabsirahActiveBiome = biomeId;
    this.rainActive = false;
    this.xrayActive = false;
    this.auroraShieldActive = false;
    this.desertAquiferActive = false;
    this.oceanEnergized = false;
    this.photoIndex = 0;

    if (this.solarAnimFrame) {
      cancelAnimationFrame(this.solarAnimFrame);
      this.solarAnimFrame = null;
    }

    natureNarrator.stop();
    const data = EARTH_BIOMES_DATA[biomeId];
    this.updateHUD(data);
    this.syncCompass360UI(false);
    this.syncMediaDrawer();
    natureAudio.setBiomeMood(biomeId);
    this.applyBiomeFog(biomeId);

    if (this.uiState === 'discover') {
      this.setUIState('explore');
    }

    if (!immediate) {
      natureAudio.playTransition();
    }

    if (this.hintResetTimer) {
      clearTimeout(this.hintResetTimer);
      this.hintResetTimer = null;
    }
    if (this.hintEl) {
      this.hintEl.style.color = '';
    }

    this.setSolarElevation(data.defaultSolar);
    this.syncWonderContextBar();

    if (this.skyDomeEl) {
      this.skyDomeEl.setAttribute('atmospheric-sky-dome', {
        solarElevation: data.defaultSolar,
        underwater: biomeId === 'ocean',
        tintColor: data.accentColor,
        panoramaUrl: data.panoramaUrl || ''
      });
    }

    if (this.mrDioramaRingEl) {
      this.mrDioramaRingEl.setAttribute('portal-window-shader', 'color', data.accentColor);
      this.mrDioramaRingEl.setAttribute('portal-occlusion-shader', 'color', data.accentColor);
    }

    const isAR = Boolean(this.sceneEl?.is('ar-mode'));
    const isTabletop = Boolean(this.sceneEl?.components?.['xr-tabletop-portal']?.isTabletopMode);
    const targetScale = isAR ? 0.155 : (isTabletop ? 0.18 : 1.0);
    if (this.container?.object3D) {
      if (isAR) this.container.object3D.position.set(0, 0.88, -1.05);
      else if (isTabletop) this.container.object3D.position.set(0, 0.88, -1.48);
      else this.container.object3D.position.set(0, 0, 0);
    }

    if (immediate || !this.container) {
      if (this.container?.object3D) this.container.object3D.scale.setScalar(targetScale);
      this.populateBiomeEntities(biomeId);
      return;
    }

    this.isTransitioning = true;
    this.container.object3D.scale.setScalar(targetScale * 0.92);
    this.populateBiomeEntities(biomeId);

    const start = performance.now();
    const dur = 420;
    const anim = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      const s = targetScale * (0.92 + 0.08 * ease);
      this.container.object3D.scale.setScalar(s);
      if (t < 1) {
        requestAnimationFrame(anim);
      } else {
        this.container.object3D.scale.setScalar(targetScale);
        this.isTransitioning = false;
      }
    };
    requestAnimationFrame(anim);
  }

  updateHUD(data) {
    if (this.titleEl) this.titleEl.textContent = data.title;
    if (this.hintEl) {
      this.hintEl.textContent = data.interactionHint;
      this.hintEl.style.color = '';
    }

    // Mode 2 Discover Card Payload
    if (this.discoverObjectName) this.discoverObjectName.textContent = data.discovery?.objectName || data.shortTitle;
    if (this.discoverModelNote) {
      this.discoverModelNote.textContent = data.discovery?.modelNote || '';
      this.discoverModelNote.hidden = !data.discovery?.modelNote;
    }
    if (this.discoverSummary) this.discoverSummary.textContent = data.discovery?.conciseSummary || data.subtitle;

    // Mode 3 Reflect Panel Payload (Cleanly separated Qur'an, Translation, Commentary, Science)
    if (this.reflectBiomeLabel) this.reflectBiomeLabel.textContent = data.coordinates;
    if (this.reflectTitle) this.reflectTitle.textContent = data.title;
    if (this.reflectArabicVerse) this.reflectArabicVerse.textContent = data.arabicVerse;
    if (this.reflectTranslation) this.reflectTranslation.textContent = `"${data.quranTranslation || data.englishTafsir}"`;
    if (this.reflectSurahRef) this.reflectSurahRef.textContent = data.surahRef || '';
    if (this.reflectCommentary) this.reflectCommentary.textContent = data.explanatoryReflection || data.englishTafsir;
    if (this.reflectScience) this.reflectScience.textContent = data.scientificContext || data.insight?.detail;

    // Deep Stillness Veil Payload
    if (this.stillnessKicker) this.stillnessKicker.textContent = `${data.coordinates} · ${data.shortTitle}`;
    if (this.stillnessArabic) this.stillnessArabic.textContent = data.arabicVerse;
    if (this.stillnessTranslation) this.stillnessTranslation.textContent = `"${data.quranTranslation || data.englishTafsir}"`;
    if (this.stillnessSurah) this.stillnessSurah.textContent = data.surahRef || '';
    this.discoveredBiomes.add(data.id);
    this.updateProgressLabel();

    this.navButtons.forEach((btn) => {
      const active = btn.getAttribute('data-biome-btn') === data.id;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    this.renderCompanionPrompts(data.id);
    this.syncActionButton();
  }

  clearContainer() {
    if (!this.container) return;
    while (this.container.firstChild) {
      const child = this.container.firstChild;
      if (typeof child.destroy === 'function') {
        try {
          child.destroy();
        } catch {
          // Safe cleanup
        }
      }
      this.container.removeChild(child);
    }
  }

  makeEntity(attrs = {}) {
    const el = document.createElement('a-entity');
    Object.entries(attrs).forEach(([k, v]) => {
      el.setAttribute(k, v);
    });
    return el;
  }

  populateBiomeEntities(biomeId) {
    this.clearContainer();
    if (!this.container) return;

    const data = EARTH_BIOMES_DATA[biomeId];

    // Progressive Dual-Direction Zoom Layers
    this.container.appendChild(this.makeEntity({ 'biome-zoom-details': `biome: ${biomeId}` }));

    // Interactive 3D Spatial Discovery Beacon for hands-first / pointer discovery
    if (data?.discovery?.beaconPos) {
      this.container.appendChild(
        this.makeEntity({
          position: data.discovery.beaconPos,
          class: 'interactive-node vr-interactive',
          'spatial-discovery-beacon': `biomeId: ${biomeId}; accentColor: ${data.accentColor}; label: ${data.discovery.objectName}`
        })
      );
    }

    // Walkable Vista Overlook Waypoints (indexes 1 & 2; index 0 is Origin)
    const vistas = BIOME_VISTAS[biomeId] || [];
    for (let i = 1; i < vistas.length; i++) {
      const v = vistas[i];
      this.container.appendChild(
        this.makeEntity({
          position: `${v.pos[0]} ${v.pos[1]} ${v.pos[2]}`,
          class: 'interactive-node vr-interactive',
          'vista-waypoint': `vistaIndex: ${v.index}; label: ${v.label}; accentColor: ${data.accentColor}`
        })
      );
    }

    // Multi-Part Playable Environmental Wonder Toys (2 per biome)
    const wonderProps = BIOME_WONDER_PROPS[biomeId] || [];
    wonderProps.forEach((wp) => {
      this.container.appendChild(
        this.makeEntity({
          position: wp.position,
          class: 'interactive-node vr-interactive',
          'interactive-wonder-prop': `propType: ${wp.propType}; biomeId: ${wp.biomeId}; title: ${wp.title}; fact: ${wp.fact}; accentColor: ${wp.accent}`
        })
      );
    });

    // 360° Multi-Disciplinary Field Sites & Animated Wildlife Across East, West, South & Sky
    this.container.appendChild(this.makeEntity({ 'biome-360-panorama': `biomeId: ${biomeId}` }));

    if (biomeId === 'aurora') {
      this.container.appendChild(this.makeEntity({ 'crystalline-aurora-valley': '' }));
      this.container.appendChild(
        this.makeEntity({
          'caustic-water-surface': 'mode: fjord-mirror; width: 14; depth: 14; tint: #34D399',
          position: '0 0.02 -4.5'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'aurora-curtain-shader': 'width: 24; height: 6.2; ribbonIndex: 0',
          position: '0 4.6 -9.0',
          rotation: '14 0 0'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'aurora-curtain-shader': 'width: 22; height: 5.4; ribbonIndex: 1',
          position: '0.5 5.4 -12.0',
          rotation: '18 14 0'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'aurora-curtain-shader': 'width: 26; height: 5.8; ribbonIndex: 2',
          position: '-1.2 6.0 -15.5',
          rotation: '20 -12 0'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'aurora-curtain-shader': 'width: 22; height: 5.2; ribbonIndex: 1',
          position: '10.5 5.3 2.5',
          rotation: '18 105 0'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'aurora-curtain-shader': 'width: 22; height: 5.5; ribbonIndex: 2',
          position: '-9.5 5.6 7.5',
          rotation: '20 -135 0'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'biome-particle-system': 'type: snow; count: 240; colorA: #E2E8F0; colorB: #A5F3FC; active: true'
        })
      );
    } else if (biomeId === 'rainforest') {
      this.container.appendChild(this.makeEntity({ 'rainforest-floor-flora': '' }));
      this.container.appendChild(
        this.makeEntity({
          'lsystem-ancient-tree': 'iterations: 4; height: 1.35; seedOffset: 0.4',
          position: '-5.4 0 -6.2'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'lsystem-ancient-tree': 'iterations: 4; height: 1.42; seedOffset: 2.1',
          position: '5.8 0 -6.8'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'lsystem-ancient-tree': 'iterations: 4; height: 1.55; seedOffset: 4.2',
          position: '-0.4 0 -9.5'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'crepuscular-god-rays': 'color: #FDE68A; opacity: 0.14; height: 6.5',
          position: '-3.2 3.2 -5.5',
          rotation: '0 0 -18'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'crepuscular-god-rays': 'color: #FDE68A; opacity: 0.12; height: 6.5',
          position: '3.4 3.2 -6.2',
          rotation: '0 0 -18'
        })
      );
      this.container.appendChild(this.makeEntity({ 'rainforest-wildlife-system': '' }));
      this.container.appendChild(
        this.makeEntity({
          'biome-particle-system': 'type: waterfall; count: 320; colorA: #BAE6FD; colorB: #E0F2FE; active: true',
          position: '1.35 0.05 -4.9'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'caustic-water-surface': 'mode: pool; width: 4.2; depth: 12.0; tint: #10B981',
          position: '0.85 0.03 -3.2'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          id: 'rainforest-rain-emitter',
          'biome-particle-system': 'type: rain; count: 420; colorA: #7DD3FC; colorB: #BAE6FD; active: false'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'biome-particle-system': 'type: fireflies; count: 280; colorA: #34D399; colorB: #FDE047; active: true'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          id: 'rainforest-prism-lens',
          'water-prism-optics': 'beamLength: 2.5',
          position: '-1.55 1.48 -3.45',
          scale: '0.68 0.68 0.68',
          class: 'interactive-node vr-interactive',
          visible: 'true'
        })
      );
    } else if (biomeId === 'ocean') {
      this.container.appendChild(
        this.makeEntity({
          'caustic-water-surface': 'mode: underwater-canopy; width: 95; depth: 95',
          position: '0 5.4 -2.0'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'caustic-water-surface': 'mode: seabed; width: 95; depth: 95',
          position: '0 -0.02 -2.0'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'crepuscular-god-rays': 'color: #67E8F9; opacity: 0.11; height: 6.5',
          position: '-3.5 3.0 -5.2',
          rotation: '0 0 -14'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'crepuscular-god-rays': 'color: #67E8F9; opacity: 0.11; height: 6.5',
          position: '3.2 3.0 -5.8',
          rotation: '0 0 -14'
        })
      );
      this.container.appendChild(this.makeEntity({ 'coral-cathedral-ecosystem': '' }));
      this.container.appendChild(
        this.makeEntity({
          'biome-particle-system': 'type: fireflies; count: 210; colorA: #22D3EE; colorB: #BAE6FD; active: true'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          id: 'ocean-turing-lens',
          'turing-coral-sphere': 'gridSize: 84; radius: 0.56',
          position: '-2.15 1.32 -3.6',
          scale: '0.66 0.66 0.66',
          class: 'interactive-node vr-interactive',
          visible: 'true'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          id: 'ocean-voronoi-lens',
          'voronoi-cellular-mesh': 'radius: 0.56; seeds: 46',
          position: '2.15 1.32 -3.6',
          scale: '0.66 0.66 0.66',
          class: 'interactive-node vr-interactive',
          visible: 'true'
        })
      );
    } else if (biomeId === 'desert') {
      this.container.appendChild(this.makeEntity({ 'desert-dunes-oasis': '' }));
      this.container.appendChild(
        this.makeEntity({
          'desert-heat-shimmer-shader': '',
          position: '0 1.45 -9.5'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'caustic-water-surface': 'mode: pool; width: 3.6; depth: 3.2; tint: #38BDF8',
          position: '0 0.04 -3.2'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'biome-particle-system': 'type: sand-drift; count: 180; colorA: #FDE68A; colorB: #F59E0B; active: true'
        })
      );
      const duskIntensity = Math.max(0.12, Math.min(1.0, 1.0 - (this.solarElevation + 0.1) * 1.8));
      this.container.appendChild(
        this.makeEntity({
          id: 'desert-dusk-fireflies',
          'biome-particle-system': `type: fireflies; count: 90; colorA: #FBBF24; colorB: #FDE68A; intensity: ${duskIntensity.toFixed(2)}; active: true`
        })
      );
    }

    // Refresh desktop & VR controller raycasters for newly mounted interactive nodes
    this.sceneEl?.components?.raycaster?.refreshObjects?.();
    document.getElementById('left-controller')?.components?.raycaster?.refreshObjects?.();
    document.getElementById('right-controller')?.components?.raycaster?.refreshObjects?.();
    window.dispatchEvent(new CustomEvent('tabsirah-biome-changed', { detail: { biomeId } }));

    // Sync micro-lens weights if already zoomed in
    requestAnimationFrame(() => {
      const z = window.tabsirahZoomState?.zoom;
      if (typeof z === 'number' && Math.abs(z) > 0.01) {
        window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: z } }));
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.tabsirahBiomeManager = new BiomeManager();
});
