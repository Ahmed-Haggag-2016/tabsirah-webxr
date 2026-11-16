/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Cinematic Autopilot Director (`wow-mechanics-manager`):
 * Automatically navigates across every biome, camera vantage, solar lighting sweep,
 * Living Revelation, Real-World Field Photography, Scientific Context, and Qur'anic Reflection.
 */

import './wow-shaders.js';
import { EARTH_BIOMES_DATA, BIOME_ORDER } from '../config/earth-biomes-data.js';
import { natureAudio, natureNarrator } from './nature-audio.js';

const BIOME_SOLAR_ARCS = {
  aurora: [-0.06, -0.22],
  rainforest: [0.64, 0.36],
  ocean: [0.78, 0.56],
  desert: [0.42, -0.18]
};

if (typeof AFRAME !== 'undefined' && !AFRAME.components['wow-mechanics-manager']) {
  AFRAME.registerComponent('wow-mechanics-manager', {
    init: function () {
      this.sceneEl = this.el.sceneEl;
      this.isRunning = false;
      this.isPaused = false;
      this.loopEnabled = true;
      this.currentIndex = 0;
      this.stationElapsed = 0;
      this.phase = 0; // 0: Explore, 1: Discover, 2: Field Photos, 3: Photo 2, 4: Understand, 5: Reflect
      this.stationDuration = 28.0;
      this.stageLabel = '1. Explore';
      this.lastPoseEmit = 0;

      this.onStart = () => this.startTour();
      this.onTogglePause = () => this.togglePause();
      this.onSkipNext = () => this.skipNext();
      this.onToggleLoop = () => this.toggleLoop();
      this.onExit = () => this.stopTour(true);

      window.addEventListener('start-guiding-light-demo', this.onStart);
      window.addEventListener('tabsirah-tour-toggle-pause', this.onTogglePause);
      window.addEventListener('tabsirah-tour-next', this.onSkipNext);
      window.addEventListener('tabsirah-tour-toggle-loop', this.onToggleLoop);
      window.addEventListener('tabsirah-tour-exit', this.onExit);
    },

    emitStatus: function () {
      const biomeId = BIOME_ORDER[this.currentIndex] || 'aurora';
      const data = EARTH_BIOMES_DATA[biomeId];
      window.dispatchEvent(
        new CustomEvent('tabsirah-tour-state', {
          detail: {
            active: this.isRunning,
            paused: this.isPaused,
            loop: this.loopEnabled,
            index: this.currentIndex,
            total: BIOME_ORDER.length,
            biomeId,
            title: data?.shortTitle || biomeId,
            stageLabel: this.stageLabel,
            progress: Math.min(1, this.stationElapsed / this.stationDuration)
          }
        })
      );
    },

    emitCameraPose: function (detail) {
      window.dispatchEvent(new CustomEvent('biome-cinematic-pose', { detail }));
    },

    startTour: function () {
      if (this.isRunning) {
        this.stopTour(true);
        return;
      }
      natureAudio.unlock();
      this.isRunning = true;
      this.isPaused = false;
      this.currentIndex = 0;
      this.enterStation(0);
    },

    enterStation: function (index) {
      const mgr = window.tabsirahBiomeManager;
      if (!mgr || index >= BIOME_ORDER.length) {
        this.stopTour(false);
        return;
      }

      this.currentIndex = index;
      this.stationElapsed = 0;
      this.phase = 0;
      this.stageLabel = '1. Explore';

      const biomeId = BIOME_ORDER[index];
      const data = EARTH_BIOMES_DATA[biomeId];

      mgr.setMediaVisible(false);
      mgr.setUIState('explore');
      mgr.switchBiome(biomeId);

      // Start from elevated aerial panorama and sweep smoothly inward
      window.tabsirahTimeScale = 1.0;
      natureAudio.setStillnessMode(false);
      window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.25, radius: 0.65 } }));

      const solarArc = BIOME_SOLAR_ARCS[biomeId] || [data.defaultSolar, data.defaultSolar];
      mgr.setSolarElevation(solarArc[0]);

      this.emitCameraPose({
        active: true,
        zoom: -0.68,
        panX: -0.5,
        yaw: 0.24,
        pitch: -0.14
      });

      if (data?.fullNarration) {
        natureNarrator.stop();
        natureNarrator.speak(data.fullNarration);
      }

      this.emitStatus();
    },

    togglePause: function () {
      if (!this.isRunning) return;
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        natureNarrator.pause?.();
      } else {
        natureNarrator.resume?.();
      }
      this.emitStatus();
    },

    toggleLoop: function () {
      this.loopEnabled = !this.loopEnabled;
      this.emitStatus();
    },

    skipNext: function () {
      if (!this.isRunning) return;
      if (this.currentIndex + 1 < BIOME_ORDER.length) {
        this.enterStation(this.currentIndex + 1);
      } else if (this.loopEnabled) {
        this.enterStation(0);
      } else {
        this.stopTour(false);
      }
    },

    stopTour: function (userCancelled = false) {
      const mgr = window.tabsirahBiomeManager;
      this.isRunning = false;
      this.isPaused = false;
      this.stationElapsed = 0;
      this.phase = 0;
      this.stageLabel = '1. Explore';
      window.tabsirahTimeScale = 1.0;
      natureAudio.setStillnessMode(false);
      window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.25, radius: 0.65 } }));

      this.emitCameraPose({ active: false, zoom: 0.0, panX: 0.0 });
      if (userCancelled) {
        natureNarrator.stop();
        mgr?.setMediaVisible(false);
        mgr?.setUIState('explore');
      }
      this.emitStatus();
    },

    tick: function (time, timeDelta) {
      if (!this.isRunning || this.isPaused || !timeDelta) return;
      const dt = Math.min(timeDelta, 50) / 1000;
      this.stationElapsed += dt;

      const mgr = window.tabsirahBiomeManager;
      const biomeId = BIOME_ORDER[this.currentIndex];
      const solarArc = BIOME_SOLAR_ARCS[biomeId] || [0.1, 0.1];
      const tNorm = Math.min(1, this.stationElapsed / this.stationDuration);

      // Continuous smooth Solar Day/Night sweep across each chapter
      if (mgr) {
        const solarNow = solarArc[0] + (solarArc[1] - solarArc[0]) * tNorm;
        mgr.setSolarElevation(solarNow);
      }

      // Beat 1 (+6.8s): Close-Up Micro Glide + Living Revelation + 2. Discover Card
      if (this.phase === 0 && this.stationElapsed >= 6.8) {
        this.phase = 1;
        this.stageLabel = '2. Discover';
        if (mgr) {
          mgr.activateCurrentDiscovery();
          mgr.setUIState('discover');
        }
      }

      // Beat 2 (+13.0s): Open Real-World Field Photography Drawer (Photo 1)
      if (this.phase === 1 && this.stationElapsed >= 13.0) {
        this.phase = 2;
        this.stageLabel = 'Field Photos';
        if (mgr) {
          mgr.setUIState('explore');
          mgr.setMediaTab('photos');
          mgr.setMediaVisible(true);
        }
      }

      // Beat 2b (+15.4s): Advance to Field Photo 2
      if (this.phase === 2 && this.stationElapsed >= 15.4) {
        this.phase = 3;
        mgr?.stepPhoto(1);
      }

      // Beat 3 (+17.8s): Close Media Drawer -> 3. Understand (Scientific Context)
      if (this.phase === 3 && this.stationElapsed >= 17.8) {
        this.phase = 4;
        this.stageLabel = '3. Understand';
        if (mgr) {
          mgr.setMediaVisible(false);
          mgr.setUIState('understand');
        }
      }

      // Beat 4 (+22.8s): Transition to 4. Reflect (Slow-Motion Wonder + Harmonic Pad Swell)
      if (this.phase === 4 && this.stationElapsed >= 22.8) {
        this.phase = 5;
        this.stageLabel = '4. Reflect';
        window.tabsirahTimeScale = 0.52;
        natureAudio.setStillnessMode(true);
        window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.52, radius: 0.78 } }));
        mgr?.setUIState('reflect');
      }

      // Continuous choreographed camera motion (every ~60ms for ultra-smooth damping)
      if (time - this.lastPoseEmit > 60) {
        this.lastPoseEmit = time;
        const e = this.stationElapsed;
        let zoom = 0.0;
        let panX = 0.0;
        let yaw = 0.0;
        let pitch = 0.0;

        if (e < 6.8) {
          // Aerial Panorama descending smoothly into Eye-Level Horizon Sweep
          const p = e / 6.8;
          zoom = -0.68 + p * 0.76; // -0.68 -> +0.08
          panX = Math.sin(p * Math.PI) * 0.55 - 0.15;
          yaw = 0.24 - p * 0.38;
          pitch = -0.14 + p * 0.20;
        } else if (e < 13.0) {
          // Intimate Micro Discovery Glide around beacon & Living Revelation
          const p = (e - 6.8) / 6.2;
          zoom = 0.62 + Math.sin(p * Math.PI) * 0.16;
          panX = Math.sin(p * Math.PI * 1.2) * 0.22;
          yaw = -0.14 + p * 0.22;
          pitch = 0.04 - Math.sin(p * Math.PI) * 0.08;
        } else if (e < 17.8) {
          // Sweeping Orbital Showcase while Field Photography opens
          const p = (e - 13.0) / 4.8;
          zoom = -0.24 - p * 0.14;
          panX = 0.48 - p * 0.96;
          yaw = 0.14 - p * 0.32;
          pitch = 0.03;
        } else {
          // Calm elevated framing behind Understand & Reflect panels
          const p = (e - 17.8) / 10.2;
          zoom = -0.44 - p * 0.18;
          panX = -0.35 + p * 0.7;
          yaw = -0.18 + p * 0.36;
          pitch = 0.08;
        }

        this.emitCameraPose({ active: true, zoom, panX, yaw, pitch });
      }

      // Advance cleanly to next biome or loop/finish
      if (this.stationElapsed >= this.stationDuration) {
        mgr?.setMediaVisible(false);
        if (this.currentIndex + 1 < BIOME_ORDER.length) {
          this.enterStation(this.currentIndex + 1);
        } else if (this.loopEnabled) {
          this.enterStation(0);
        } else {
          this.stopTour(false);
          mgr?.setUIState('reflect');
        }
        return;
      }

      this.emitStatus();
    },

    remove: function () {
      window.removeEventListener('start-guiding-light-demo', this.onStart);
      window.removeEventListener('tabsirah-tour-toggle-pause', this.onTogglePause);
      window.removeEventListener('tabsirah-tour-next', this.onSkipNext);
      window.removeEventListener('tabsirah-tour-toggle-loop', this.onToggleLoop);
      window.removeEventListener('tabsirah-tour-exit', this.onExit);
    }
  });
}
