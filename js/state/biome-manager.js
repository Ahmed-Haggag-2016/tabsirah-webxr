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
import '../components/object-manipulator.js';
import '../components/gesture-scale-manager.js';
import '../components/wow-mechanics.js';
import '../components/scientific-telemetry.js';
import '../components/wow-postprocessing.js';
import '../components/spatial-discovery.js';
import '../components/light-optics.js';
import '../components/sacred-dynamics.js';
import '../components/tactile-touch-fx.js';
import '../components/webxr-beacon-haptics.js';
import { micBreathMonitor } from '../components/grand-prize-features.js';

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
  const _prevPos = new THREE.Vector3();
  const _pinchState = { left: false, right: false, twoHandDist: null };

  AFRAME.registerComponent('biome-hand-controls', {
    init: function () {
      this.hasPrev = false;
      this.isPinched = false;
      this.lastRainGesture = 0;
      this.lastAuroraWave = 0;
      this.lastConductorSweep = 0;
      this.side = this.el.id === 'left-hand' ? 'left' : 'right';

      this.onPinch = () => {
        natureAudio.unlock();
        this.isPinched = true;
        _pinchState[this.side] = true;
        this.el.object3D.getWorldPosition(_handPos);
        _prevPos.copy(_handPos);
        this.hasPrev = true;

        const nodes = this.el.sceneEl?.querySelectorAll('.interactive-node');
        if (!nodes?.length) return;

        let closest = null;
        let minDist = 3.2;
        nodes.forEach((node) => {
          node.object3D.getWorldPosition(_nodePos);
          const d = _handPos.distanceTo(_nodePos);
          if (d < minDist) {
            minDist = d;
            closest = node;
          }
        });
        if (closest) {
          closest.emit('pinchstarted', {
            hand: this.el.id,
            handPos: { x: _handPos.x, y: _handPos.y, z: _handPos.z }
          }, false);
        }
      };

      this.onPinchEnd = () => {
        this.isPinched = false;
        _pinchState[this.side] = false;
        _pinchState.twoHandDist = null;
      };

      this.el.addEventListener('pinchstarted', this.onPinch);
      this.el.addEventListener('pinchended', this.onPinchEnd);
    },

    tick: function () {
      if (!this.el.sceneEl?.is('vr-mode') && !this.el.sceneEl?.is('ar-mode')) return;
      this.el.object3D.getWorldPosition(_handPos);
      if (_handPos.lengthSq() < 0.0005) return;

      const now = performance.now();
      const biome = window.tabsirahActiveBiome;

      // Two-Hand Pinch Spread -> Smooth Aerial / Close-Up Zoom
      if (_pinchState.left && _pinchState.right && this.side === 'right') {
        const lh = document.getElementById('left-hand');
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
        const dx = _handPos.x - _prevPos.x;
        if (Math.abs(dx) > 0.0025 && Math.abs(dx) < 0.25) {
          const mgr = window.tabsirahBiomeManager;
          if (mgr) mgr.setSolarElevation(mgr.solarElevation + dx * 1.9);
        }
      }

      if (biome === 'rainforest' && _handPos.y > 1.65 && now - this.lastRainGesture > 1800) {
        this.lastRainGesture = now;
        this.el.sceneEl.emit('biome-gesture-rain', {}, false);
      }

      if (biome === 'aurora' && this.hasPrev) {
        const speed = _handPos.distanceTo(_prevPos);
        if (speed > 0.045 && now - this.lastConductorSweep > 220) {
          this.lastConductorSweep = now;
          this.el.sceneEl.emit('aurora-conductor-sweep', { speed, dx: _handPos.x - _prevPos.x }, false);
        }
        if (speed > 0.055 && now - this.lastAuroraWave > 450) {
          this.lastAuroraWave = now;
          this.el.sceneEl.emit('aurora-magnetic-pulse', {}, false);
        }
      }

      _prevPos.copy(_handPos);
      this.hasPrev = true;
    },

    remove: function () {
      this.el.removeEventListener('pinchstarted', this.onPinch);
      this.el.removeEventListener('pinchended', this.onPinchEnd);
    }
  });
}

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
    this.discoveredBiomes = new Set(['aurora']);
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

    this.cacheDOM();
    this.bindEvents();
    this.startArrowKeyLoop();
    this.switchBiome('aurora', true);
    this.setUIState('explore');
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
    this.vantageCloseupBtn = document.getElementById('btn-vantage-closeup');
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

    // Grand Prize Feature Controls
    this.micBreathBtn = document.getElementById('btn-mic-breath');
    this.tabletopBtn = document.getElementById('btn-tabletop-toggle');
    this.convergenceBtn = document.getElementById('btn-convergence-toggle');
    this.wonderBrushBtn = document.getElementById('btn-wonder-brush');
    this.relicProgressText = document.getElementById('relic-progress-text');
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
      if (biomeId !== this.currentBiomeId) return;
      this.activateCurrentDiscovery();
      if (this.uiState !== 'reflect' && this.uiState !== 'understand') {
        this.setUIState('discover');
      }
    });

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

    window.addEventListener('tabsirah-mic-breath-state', (evt) => {
      const { active, error } = evt.detail || {};
      if (this.micBreathBtn) {
        this.micBreathBtn.setAttribute('aria-pressed', String(Boolean(active)));
        this.micBreathBtn.classList.toggle('is-active', Boolean(active));
        this.micBreathBtn.textContent = active ? 'Mic Breath: Live' : (error ? 'Mic Unavailable' : 'Mic Breath');
      }
    });

    this.tabletopBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('tabsirah-tabletop-toggle'));
    });

    window.addEventListener('tabsirah-tabletop-state', (evt) => {
      const active = Boolean(evt.detail?.active);
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
    this.vantageCloseupBtn?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: 0.82 } }));
    });
    this.zoomReadoutEl?.addEventListener('click', () => {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: 0 } }));
    });

    window.addEventListener('biome-zoom-changed', (evt) => {
      const z = evt.detail?.zoom ?? 0;
      const isClose = z > 0.16;
      const isAerial = z < -0.16;
      const isEye = !isClose && !isAerial;

      if (this.zoomReadoutEl) {
        this.zoomReadoutEl.textContent = isClose
          ? `Close (${(1.0 - z * 0.72).toFixed(1)}m)`
          : isAerial
            ? `Aerial (${Math.round(8 + (-z) * 180)}m)`
            : 'Eye Level';
        this.zoomReadoutEl.classList.toggle('is-active', isEye);
        this.zoomReadoutEl.setAttribute('aria-pressed', String(isEye));
      }
      this.vantageCloseupBtn?.classList.toggle('is-active', isClose);
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
        this.sceneEl.exitVR();
        return;
      }
      try {
        if (navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar'))) {
          await this.sceneEl.enterAR();
          return;
        }
      } catch {
        // Fallback
      }
      this.sceneEl.enterAR();
    });

    this.vrBtn?.addEventListener('click', async () => {
      natureAudio.unlock();
      if (!this.sceneEl) return;
      if (this.sceneEl.is('vr-mode') || this.sceneEl.is('ar-mode')) {
        this.sceneEl.exitVR();
        return;
      }
      try {
        if (navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar'))) {
          await this.sceneEl.enterAR();
          return;
        }
      } catch {
        // Fallback cleanly to VR
      }
      this.sceneEl.enterVR();
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
        if (this.isStillness) this.setStillnessMode(false);
        else if (this.uiState !== 'explore') this.setUIState('explore');
        else if (this.moreControlsPopover && !this.moreControlsPopover.hidden) {
          this.moreControlsPopover.hidden = true;
          this.moreControlsBtn?.setAttribute('aria-pressed', 'false');
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (this.openingOverlay && !this.openingOverlay.hidden) return;
        e.preventDefault();
        natureAudio.unlock();
        this.setStillnessMode(!this.isStillness);
      } else if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1;
        if (BIOME_ORDER[idx]) this.switchBiome(BIOME_ORDER[idx]);
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
      this.setMediaVisible(false);
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
  }

  startBreathPacer() {
    if (this.breathAnimFrame) cancelAnimationFrame(this.breathAnimFrame);
    const startTime = performance.now();
    // 14-second calm contemplative breath cycle: 4s Inhale, 4s Hold, 6s Exhale (blended with live Mic Breath)
    const step = (now) => {
      if (!this.isStillness) return;
      const cycleSec = ((now - startTime) / 1000) % 14;
      let scale = 0.82;
      let breathPhase = 0.0;
      let label = 'Breathe in gently…';
      let ringColor = 'rgba(56, 189, 248, 0.72)';

      if (micBreathMonitor.isActive) {
        const micLvl = micBreathMonitor.sampleLevel();
        breathPhase = Math.min(1.0, 0.14 + micLvl * 1.15);
        scale = 0.84 + breathPhase * 0.66;
        label = micLvl > 0.16 ? 'Live breath resonance detected…' : 'Exhale softly toward mic…';
        ringColor = micLvl > 0.16 ? 'rgba(52, 211, 153, 0.88)' : 'rgba(56, 189, 248, 0.76)';
        natureAudio.setBreathHarmonicBoost(micLvl);
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

  setMediaVisible(visible) {
    this.isMediaOpen = visible;
    if (this.mediaDrawer) this.mediaDrawer.hidden = !visible;
    if (this.mediaToggleBtn) this.mediaToggleBtn.setAttribute('aria-pressed', String(visible));
    if (visible) this.syncMediaDrawer();
    else if (this.mediaIframe) this.mediaIframe.src = 'about:blank';
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
          'biome-particle-system': 'type: snow; count: 240; colorA: #E2E8F0; colorB: #A5F3FC; active: true'
        })
      );
    } else if (biomeId === 'rainforest') {
      this.container.appendChild(this.makeEntity({ 'rainforest-floor-flora': '' }));
      this.container.appendChild(
        this.makeEntity({
          'lsystem-ancient-tree': 'iterations: 4; height: 1.05; seedOffset: 0.4',
          position: '-2.35 0 -3.8'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'lsystem-ancient-tree': 'iterations: 4; height: 1.12; seedOffset: 2.1',
          position: '2.45 0 -4.2'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'lsystem-ancient-tree': 'iterations: 4; height: 1.24; seedOffset: 4.2',
          position: '-0.25 0 -5.9'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'crepuscular-god-rays': 'color: #FDE68A; opacity: 0.14; height: 5.5',
          position: '-1.1 2.7 -3.4',
          rotation: '0 0 -18'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'crepuscular-god-rays': 'color: #FDE68A; opacity: 0.12; height: 5.5',
          position: '1.15 2.7 -4.0',
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
          position: '0 1.12 -2.2',
          scale: '0.46 0.46 0.46',
          class: 'interactive-node vr-interactive',
          visible: 'false'
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
          'crepuscular-god-rays': 'color: #67E8F9; opacity: 0.11; height: 5.5',
          position: '-1.5 2.6 -3.1',
          rotation: '0 0 -14'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          'crepuscular-god-rays': 'color: #67E8F9; opacity: 0.11; height: 5.5',
          position: '1.2 2.6 -3.6',
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
          position: '-0.74 0.72 -2.35',
          scale: '0.46 0.46 0.46',
          class: 'interactive-node vr-interactive',
          visible: 'false'
        })
      );
      this.container.appendChild(
        this.makeEntity({
          id: 'ocean-voronoi-lens',
          'voronoi-cellular-mesh': 'radius: 0.56; seeds: 46',
          position: '0.74 0.72 -2.35',
          scale: '0.46 0.46 0.46',
          class: 'interactive-node vr-interactive',
          visible: 'false'
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
