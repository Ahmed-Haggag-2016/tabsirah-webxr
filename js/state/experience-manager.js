/**
 * Tabsirah: The Architecture of Light & Order
 * Seamless Experience Manager & Procedural WebXR Scene Orchestrator
 * Coordinates all 5 stations:
 *   1. light          (Water-Droplet Prism, 7-Band Dispersion & Caustics)
 *   2. morphogenesis  (Voronoi Cellular Mesh & Gray-Scott Turing Sphere)
 *   3. gravity        (Sculptable Spacetime Fabric, Mass Nodes & Solar MHD Loops)
 *   4. abyss          (Bioluminescent Fresnel Jellyfish & Swirling Plankton)
 *   5. resonance      (16-Fold Islamic Geometric Star Mandala & Breath Sync)
 */

import { COSMIC_DATA, SCENE_ORDER } from '../config/cosmic-data.js';
import { spatialAudio, narrator } from '../components/spatial-audio.js';
import { breathController } from '../components/embodied-controls.js';
import '../components/light-optics.js';
import '../components/sacred-dynamics.js';

class ExperienceManager {
  constructor() {
    this.activeSceneId = 'light';
    this.sceneEl = null;
    this.containerEl = null;
    this.skyEl = null;
    this.isReady = false;
    this.supportsAR = false;
    this.currentGroupEl = null;
    this.activeTransitionRafs = [];
    this.exitingGroups = [];
    this.lastWheelTime = 0;
  }

  init() {
    this.sceneEl = document.querySelector('a-scene');
    this.containerEl = document.getElementById('cosmic-container');
    this.skyEl = document.getElementById('cosmic-sky');
    if (!this.sceneEl || !this.containerEl) return;

    this.checkXRSupport();
    this.bindHudEvents();
    this.bindSceneEvents();
    this.startBreathSyncLoop();

    const startInitial = () => {
      this.isReady = true;
      this.switchScene('light', { immediate: true, autoNarrate: false });
    };

    if (this.sceneEl.hasLoaded) startInitial();
    else this.sceneEl.addEventListener('loaded', startInitial, { once: true });
  }

  async checkXRSupport() {
    if (navigator.xr && typeof navigator.xr.isSessionSupported === 'function') {
      try {
        this.supportsAR = await navigator.xr.isSessionSupported('immersive-ar');
      } catch {
        this.supportsAR = false;
      }
    }
  }

  startBreathSyncLoop() {
    const ring = document.getElementById('breath-ring-progress');
    const labelEl = document.getElementById('breath-phase-label');
    const circumference = 75.4;

    breathController.start((phase, label, mode) => {
      if (ring) {
        ring.style.strokeDashoffset = String(circumference * (1 - phase));
      }
      if (labelEl) {
        labelEl.textContent = mode === 'mic' ? `Mic · ${label}` : label;
      }
    });
  }

  setChronosScale(value) {
    const clamped = Math.max(0.1, Math.min(4.0, Number(value) || 1.0));
    window.tabsirahTimeScale = Number(clamped.toFixed(2));
    const slider = document.getElementById('chronos-slider');
    const readout = document.getElementById('chronos-readout');
    if (slider) slider.value = String(window.tabsirahTimeScale);
    if (readout) readout.textContent = `${window.tabsirahTimeScale.toFixed(1)}x`;
  }

  bindHudEvents() {
    const unlock = () => spatialAudio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    document.querySelectorAll('[data-scene-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        spatialAudio.unlock();
        const id = btn.getAttribute('data-scene-btn');
        if (id && COSMIC_DATA[id]) this.switchScene(id);
      });
    });

    document.getElementById('chronos-slider')?.addEventListener('input', (e) => {
      this.setChronosScale(parseFloat(e.target.value));
    });
    window.addEventListener('chronos-scale-changed', (evt) => {
      if (evt.detail && typeof evt.detail.scale === 'number') {
        this.setChronosScale(evt.detail.scale);
      }
    });

    document.getElementById('btn-prev-station')?.addEventListener('click', () => {
      spatialAudio.unlock();
      this.stepStation(-1);
    });
    document.getElementById('btn-next-station')?.addEventListener('click', () => {
      spatialAudio.unlock();
      this.stepStation(1);
    });

    document.getElementById('btn-station-action')?.addEventListener('click', () => {
      spatialAudio.unlock();
      this.triggerPrimaryAction();
    });

    document.getElementById('btn-insight-toggle')?.addEventListener('click', () => {
      this.toggleInsightCard();
    });
    document.getElementById('btn-close-insight')?.addEventListener('click', () => {
      const card = document.getElementById('insight-card');
      if (card) card.hidden = true;
    });

    document.getElementById('btn-narrate-toggle')?.addEventListener('click', () => {
      spatialAudio.unlock();
      const cfg = COSMIC_DATA[this.activeSceneId];
      if (cfg) narrator.togglePlayPause(cfg.fullNarration, cfg.title);
    });

    const muteBtn = document.getElementById('btn-audio-toggle');
    muteBtn?.addEventListener('click', () => {
      const muted = spatialAudio.toggleMute();
      muteBtn.textContent = muted ? 'Audio Off' : 'Audio On';
      muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    });

    const micBreathBtn = document.getElementById('btn-breath-mode');
    micBreathBtn?.addEventListener('click', async () => {
      spatialAudio.unlock();
      if (breathController.mode === 'mic') {
        breathController.disableMicrophone();
        micBreathBtn.textContent = 'Guided Breath';
        micBreathBtn.setAttribute('aria-pressed', 'false');
      } else {
        const res = await breathController.enableMicrophone();
        if (res.ok) {
          micBreathBtn.textContent = 'Mic Breath On';
          micBreathBtn.setAttribute('aria-pressed', 'true');
        } else {
          const hint = document.getElementById('hud-hint');
          if (hint && res.reason) hint.textContent = res.reason;
        }
      }
    });

    document.getElementById('btn-enter-vr')?.addEventListener('click', () => {
      spatialAudio.unlock();
      if (!this.sceneEl) return;
      if (this.sceneEl.is('vr-mode') || this.sceneEl.is('ar-mode')) {
        this.sceneEl.exitVR();
        return;
      }
      if (this.supportsAR && typeof this.sceneEl.enterAR === 'function') {
        this.sceneEl.enterAR().catch(() => this.tryEnterVR());
      } else {
        this.tryEnterVR();
      }
    });

    window.addEventListener('narrator-state-changed', (evt) => {
      const { isSpeaking, isPaused } = evt.detail || {};
      const btn = document.getElementById('btn-narrate-toggle');
      const wave = document.getElementById('hud-voice-wave');
      if (btn) {
        btn.textContent = isSpeaking && !isPaused ? 'Pause' : isSpeaking && isPaused ? 'Resume' : 'Narrate';
      }
      if (wave) wave.classList.toggle('is-speaking', Boolean(isSpeaking && !isPaused));
    });

    window.addEventListener(
      'wheel',
      (e) => {
        const now = performance.now();
        if (now - this.lastWheelTime < 700 || Math.abs(e.deltaY) < 20) return;
        this.lastWheelTime = now;
        spatialAudio.unlock();
        this.stepStation(e.deltaY > 0 ? 1 : -1);
      },
      { passive: true }
    );

    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < SCENE_ORDER.length) this.switchScene(SCENE_ORDER[idx]);
      else if (e.key === '[') this.setChronosScale((window.tabsirahTimeScale || 1) - 0.25);
      else if (e.key === ']') this.setChronosScale((window.tabsirahTimeScale || 1) + 0.25);
      else if (e.key === ' ') {
        e.preventDefault();
        this.triggerPrimaryAction();
      }
    });
  }

  tryEnterVR() {
    if (!this.sceneEl || typeof this.sceneEl.enterVR !== 'function') return;
    this.sceneEl.enterVR().catch(() => {
      const hint = document.getElementById('hud-hint');
      if (hint) hint.textContent = 'WebXR headset not detected. Interactive desktop 3D controls remain active.';
    });
  }

  bindSceneEvents() {
    this.sceneEl.addEventListener('enter-vr', () => {
      const btn = document.getElementById('btn-enter-vr');
      if (this.sceneEl.is('ar-mode')) {
        if (this.skyEl) this.skyEl.setAttribute('visible', 'false');
        this.sceneEl.renderer?.setClearColor(0x000000, 0);
        if (btn) btn.textContent = 'Exit MR';
      } else if (btn) {
        btn.textContent = 'Exit VR';
      }
    });

    this.sceneEl.addEventListener('exit-vr', () => {
      const btn = document.getElementById('btn-enter-vr');
      if (this.skyEl) this.skyEl.setAttribute('visible', 'true');
      const sky = COSMIC_DATA[this.activeSceneId]?.skyColor || '#040713';
      this.sceneEl.renderer?.setClearColor(sky, 1);
      if (btn) btn.textContent = 'Enter VR / MR';
    });

    this.sceneEl.addEventListener('renderstart', () => {
      const canvas = this.sceneEl.canvas;
      if (!canvas) return;
      canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
      canvas.addEventListener('webglcontextrestored', () => {
        this.switchScene(this.activeSceneId, { immediate: true, autoNarrate: false });
      });
    });
  }

  triggerPrimaryAction() {
    if (this.activeSceneId === 'light') {
      this.sceneEl.emit('light-tilt-cycle');
    } else if (this.activeSceneId === 'morphogenesis') {
      spatialAudio.playMorphogenPulse();
      this.sceneEl.emit('morphogen-pulse');
    } else if (this.activeSceneId === 'gravity') {
      this.sceneEl.emit('gravity-reset-wells');
      spatialAudio.playGravityWellTone(1);
    } else if (this.activeSceneId === 'abyss') {
      spatialAudio.playAbyssalPing();
    } else if (this.activeSceneId === 'resonance') {
      document.getElementById('btn-breath-mode')?.click();
    }
  }

  toggleInsightCard() {
    const card = document.getElementById('insight-card');
    if (!card) return;
    if (!card.hidden) {
      card.hidden = true;
      return;
    }
    const cfg = COSMIC_DATA[this.activeSceneId];
    if (!cfg?.nodeInsight) return;
    document.getElementById('insight-title').textContent = cfg.nodeInsight.title;
    document.getElementById('insight-metric').textContent = cfg.nodeInsight.metric;
    document.getElementById('insight-detail').textContent = cfg.nodeInsight.detail;
    card.hidden = false;
  }

  stepStation(delta) {
    const idx = SCENE_ORDER.indexOf(this.activeSceneId);
    const next = Math.max(0, Math.min(SCENE_ORDER.length - 1, idx + delta));
    if (next !== idx) this.switchScene(SCENE_ORDER[next]);
  }

  cancelTransitions() {
    this.activeTransitionRafs.forEach((id) => cancelAnimationFrame(id));
    this.activeTransitionRafs = [];
    this.exitingGroups.forEach((g) => g?.parentElement?.removeChild(g));
    this.exitingGroups = [];
  }

  animateGroupScale(groupEl, { fromScale, toScale, durationMs = 500, onComplete }) {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const s = fromScale + (toScale - fromScale) * eased;
      groupEl.object3D?.scale.set(s, s, s);
      if (p < 1) {
        this.activeTransitionRafs.push(requestAnimationFrame(tick));
      } else {
        onComplete?.();
      }
    };
    groupEl.object3D?.scale.set(fromScale, fromScale, fromScale);
    this.activeTransitionRafs.push(requestAnimationFrame(tick));
  }

  switchScene(sceneId, { immediate = false, autoNarrate = true } = {}) {
    if (!this.isReady || !COSMIC_DATA[sceneId]) return;
    if (!immediate && sceneId === this.activeSceneId && this.currentGroupEl) return;

    const movingForward = SCENE_ORDER.indexOf(sceneId) >= SCENE_ORDER.indexOf(this.activeSceneId);
    this.cancelTransitions();
    narrator.stop();

    const oldGroup = this.currentGroupEl;
    this.activeSceneId = sceneId;
    const config = COSMIC_DATA[sceneId];

    if (!this.sceneEl.is('ar-mode')) {
      this.skyEl?.setAttribute('color', config.skyColor);
      this.sceneEl.renderer?.setClearColor(config.skyColor, 1);
    }
    spatialAudio.setScaleMood(sceneId);
    if (!immediate) spatialAudio.playTransition();

    const newGroup = this.buildStationGroup(sceneId);
    this.currentGroupEl = newGroup;

    if (immediate || !oldGroup) {
      oldGroup?.parentElement?.removeChild(oldGroup);
      newGroup.object3D?.scale.set(1, 1, 1);
    } else {
      this.exitingGroups.push(oldGroup);
      this.animateGroupScale(oldGroup, {
        fromScale: 1,
        toScale: movingForward ? 2.8 : 0.12,
        durationMs: 420,
        onComplete: () => {
          oldGroup?.parentElement?.removeChild(oldGroup);
          this.exitingGroups = this.exitingGroups.filter((g) => g !== oldGroup);
        }
      });
      this.animateGroupScale(newGroup, {
        fromScale: movingForward ? 0.14 : 2.6,
        toScale: 1,
        durationMs: 480
      });
    }

    this.updateHud(config);
    if (autoNarrate) narrator.speak(config.fullNarration, { label: config.title });
  }

  createEntity(tag, attrs = {}, parent = null) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    parent?.appendChild(el);
    return el;
  }

  buildStationGroup(sceneId) {
    if (sceneId === 'light') return this.buildLightStation();
    if (sceneId === 'morphogenesis') return this.buildMorphogenesisStation();
    if (sceneId === 'gravity') return this.buildGravityStation();
    if (sceneId === 'abyss') return this.buildAbyssStation();
    return this.buildResonanceStation();
  }

  buildLightStation() {
    const root = this.createEntity('a-entity', { id: 'station-light' }, this.containerEl);
    this.createEntity(
      'a-entity',
      {
        position: '0 1.48 -3.15',
        'water-prism-optics': 'beamLength: 2.9',
        'spatial-beacon': 'freq: 523.25; gain: 0.008'
      },
      root
    );
    this.createEntity(
      'a-text',
      {
        value: 'WATER-DROPLET OPTICAL PRISM\nDrag Prism or Move Cursor to Sweep Rainbow',
        position: '0 2.55 -3.15',
        align: 'center',
        width: '2.9',
        color: '#E0F2FE'
      },
      root
    );
    return root;
  }

  buildMorphogenesisStation() {
    const root = this.createEntity('a-entity', { id: 'station-morphogenesis' }, this.containerEl);

    const voronoiEl = this.createEntity(
      'a-entity',
      {
        class: 'interactive-node',
        position: '-1.15 1.72 -3.15',
        'voronoi-cellular-mesh': 'radius: 0.68; seeds: 46',
        'hand-gesture': 'hoverScale: 1.07'
      },
      root
    );
    voronoiEl.addEventListener('gesture-activate', () => {
      spatialAudio.playMorphogenPulse();
      this.sceneEl.emit('morphogen-pulse');
    });
    this.createEntity(
      'a-text',
      {
        value: '3D VORONOI TESSELLATION\nClick / Pinch for Morphogen Pulse',
        position: '-1.15 0.68 -3.15',
        align: 'center',
        width: '2.35',
        color: '#6EE7B7'
      },
      root
    );

    const turingEl = this.createEntity(
      'a-entity',
      {
        class: 'interactive-node',
        position: '1.15 1.72 -3.15',
        'turing-coral-sphere': 'gridSize: 84; radius: 0.68',
        'hand-gesture': 'hoverScale: 1.07',
        'spatial-beacon': 'freq: 329.63; gain: 0.008'
      },
      root
    );
    turingEl.addEventListener('gesture-activate', () => {
      spatialAudio.playMorphogenPulse();
      this.sceneEl.emit('morphogen-pulse');
    });
    this.createEntity(
      'a-text',
      {
        value: 'GRAY-SCOTT REACTION-DIFFUSION\nLive Coral Morphogenesis Shader',
        position: '1.15 0.68 -3.15',
        align: 'center',
        width: '2.35',
        color: '#FDE68A'
      },
      root
    );

    return root;
  }

  buildGravityStation() {
    const root = this.createEntity('a-entity', { id: 'station-gravity' }, this.containerEl);
    const systemAnchor = this.createEntity('a-entity', { position: '0 1.32 -3.55', rotation: '18 0 0' }, root);

    this.createEntity(
      'a-entity',
      {
        class: 'interactive-node',
        'gravity-fabric-system': ''
      },
      systemAnchor
    );

    this.createEntity(
      'a-entity',
      {
        position: '0 0.14 0',
        'mhd-solar-loops': 'starRadius: 0.42; loopCount: 10',
        'spatial-beacon': 'freq: 146.83; gain: 0.01'
      },
      systemAnchor
    );

    this.createEntity(
      'a-text',
      {
        value: 'SCULPTABLE SPACETIME WELLS & MHD SOLAR LOOPS\nClick Spacetime Grid to Place Mass Nodes',
        position: '0 2.65 -3.45',
        align: 'center',
        width: '3.2',
        color: '#FEF08A'
      },
      root
    );

    return root;
  }

  buildAbyssStation() {
    const root = this.createEntity('a-entity', { id: 'station-abyss' }, this.containerEl);

    this.createEntity('a-entity', { 'plankton-swirl-cloud': 'count: 520' }, root);

    const jellies = [
      { pos: '-1.35 2.05 -3.35', color: '#22D3EE', accent: '#818CF8', scale: 1.05, phase: 0.0 },
      { pos: '0.05 1.82 -2.95', color: '#38BDF8', accent: '#C084FC', scale: 1.28, phase: 1.7 },
      { pos: '1.42 2.15 -3.55', color: '#34D399', accent: '#22D3EE', scale: 0.92, phase: 3.1 }
    ];
    jellies.forEach((j, idx) => {
      const attrs = {
        position: j.pos,
        'abyssal-jellyfish': `color: ${j.color}; accent: ${j.accent}; scaleFactor: ${j.scale}; phaseOffset: ${j.phase}`
      };
      if (idx === 1) attrs['spatial-beacon'] = 'freq: 196.0; gain: 0.008';
      this.createEntity('a-entity', attrs, root);
    });

    this.createEntity(
      'a-text',
      {
        value: 'ABYSSAL BIOLUMINESCENCE (475 nm)\nSweep Cursor or Hands to Stir Plankton Trails',
        position: '0 2.75 -3.2',
        align: 'center',
        width: '2.95',
        color: '#67E8F9'
      },
      root
    );

    return root;
  }

  buildResonanceStation() {
    const root = this.createEntity('a-entity', { id: 'station-resonance' }, this.containerEl);

    this.createEntity(
      'a-entity',
      {
        position: '0 1.82 -3.2',
        'islamic-star-mandala': 'folds: 16',
        'spatial-beacon': 'freq: 261.63; gain: 0.009'
      },
      root
    );

    this.createEntity(
      'a-text',
      {
        value: '16-FOLD GIRIH STAR MANDALA\nSynchronized with Your Breath Cycle',
        position: '0 3.05 -3.2',
        align: 'center',
        width: '2.85',
        color: '#FEF08A'
      },
      root
    );

    return root;
  }

  updateHud(config) {
    document.querySelectorAll('[data-scene-btn]').forEach((btn) => {
      const active = btn.getAttribute('data-scene-btn') === config.id;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set('hud-scene-title', config.title);
    set('hud-scene-domain', `${config.domainTag} · ${config.scientificConstant}`);
    set('hud-arabic-verse', config.arabicVerse);
    set('hud-english-tafsir', config.englishTafsir);
    set('hud-hint', config.interactionHint);

    const actionLabels = {
      light: 'Tilt Prism',
      morphogenesis: 'Morphogen Pulse',
      gravity: 'Reset Wells',
      abyss: 'Sonar Ping',
      resonance: breathController.mode === 'mic' ? 'Guided Breath' : 'Mic Breath'
    };
    const actionBtn = document.getElementById('btn-station-action');
    if (actionBtn) actionBtn.textContent = actionLabels[config.id] || 'Interact';

    const prevBtn = document.getElementById('btn-prev-station');
    const nextBtn = document.getElementById('btn-next-station');
    if (prevBtn) prevBtn.disabled = config.orderIndex <= 0;
    if (nextBtn) nextBtn.disabled = config.orderIndex >= SCENE_ORDER.length - 1;

    const card = document.getElementById('insight-card');
    if (card) card.hidden = true;
  }
}

const experienceManager = new ExperienceManager();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => experienceManager.init());
} else {
  experienceManager.init();
}

export default experienceManager;
