/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Professional WebXR Cinematic Autopilot Director (`wow-mechanics-manager`):
 * Continuous, smooth 3D Catmull-Rom flight splines navigating through the natural
 * landmarks, wildlife, arches, water pools, and hero structures across all biomes.
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

/**
 * Curated 3D flight waypoints & camera focal targets navigating through
 * the actual natural subjects, arches, channels, and flora/fauna of each biome.
 */
const BIOME_CINEMATIC_TRACKS = {
  aurora: [
    { pos: [-2.6, 1.8, 3.2], look: [0.0, 1.6, -4.5], fov: 82, label: 'Aerial Fjord Descent · Gliding into Polar Aurora' },
    { pos: [-2.4, 0.45, -0.8], look: [-3.8, 1.2, -3.6], fov: 72, label: 'Crystalline Ice Shards & Singing Ice Harp' },
    { pos: [-3.6, 0.5, 0.8], look: [-5.0, 1.8, 0.4], fov: 66, label: 'Western Inuksuk Ridge · Arctic Snowy Owl & Lichen Crust' },
    { pos: [-1.8, 0.6, 3.2], look: [0.0, 1.8, 4.4], fov: 74, label: 'Approaching Glacial Channel & Ice Arch' },
    { pos: [0.8, 0.75, 3.8], look: [0.0, 1.0, 4.2], fov: 70, label: 'Glacial Ice Arch · Breaching Narwhal & Ice Span' },
    { pos: [2.8, 0.6, 2.8], look: [3.9, 1.3, 3.1], fov: 70, label: 'Solar Wind Armillary · Geomagnetic Energy Conduit' },
    { pos: [3.8, 0.5, 0.6], look: [4.8, 1.1, 0.2], fov: 68, label: 'Eastern Fumarole · Steaming Vents & Basalt Columns' },
    { pos: [0.0, 1.8, 1.6], look: [0.0, 3.2, -3.2], fov: 86, label: 'Zenith Reflection · Magnetosphere & Aurora Shimmer' }
  ],
  rainforest: [
    { pos: [2.4, 2.0, 3.0], look: [0.0, 1.6, -4.5], fov: 82, label: 'Canopy Mist Descent · Ancient Ceiba & Waterfall Cliff' },
    { pos: [0.8, 0.35, -1.6], look: [-0.4, 1.2, -4.2], fov: 72, label: 'Cascading River Pool · Mossy Boulders & Ferns' },
    { pos: [-3.2, 0.35, 0.4], look: [-4.2, 0.9, 0.6], fov: 66, label: 'Western Understory · Glowing Mycena Fungi & Dart Frog' },
    { pos: [-2.0, 0.5, 2.6], look: [-0.2, 2.2, 4.0], fov: 74, label: 'Canopy Liana Trail · Approaching Strangler Fig Arch' },
    { pos: [-0.3, 0.7, 3.6], look: [0.35, 2.8, 4.0], fov: 68, label: 'Strangler Fig Arch · Tropical Toco Toucan Perched in Vines' },
    { pos: [2.6, 0.5, 2.4], look: [3.6, 1.1, 2.9], fov: 70, label: 'Cedar Rain Drum · Acoustic Canopy Resonance' },
    { pos: [3.6, 0.4, 0.6], look: [4.4, 0.6, 0.4], fov: 68, label: 'Victoria amazonica Lagoon · Giant Floating Water Lilies' },
    { pos: [0.0, 2.0, 1.5], look: [0.0, 2.4, -2.8], fov: 84, label: 'Canopy Stillness · Hydrological Evapotranspiration Wonder' }
  ],
  ocean: [
    { pos: [-2.4, 1.6, 2.8], look: [0.0, 1.2, -5.0], fov: 82, label: 'Sunlit Caustic Dive · Descending into Coral Atoll' },
    { pos: [-0.8, 0.35, -2.2], look: [0.0, 0.9, -4.8], fov: 70, label: 'Symbiotic Coral Shelf · Staghorn Corals & Clownfish' },
    { pos: [-3.4, 0.35, 0.5], look: [-4.4, 1.1, 0.7], fov: 66, label: 'Posidonia Seagrass Meadow · Swimming Chambered Nautilus' },
    { pos: [-1.8, 0.5, 2.8], look: [0.2, 1.8, 4.2], fov: 74, label: 'Pelagic Canyon · Approaching Karst Reef Arch' },
    { pos: [0.2, 0.6, 3.8], look: [0.1, 1.7, 4.1], fov: 70, label: 'Karst Limestone Arch · Spotted Eagle Ray Soaring Through' },
    { pos: [2.8, 0.5, 2.6], look: [3.9, 1.3, 3.1], fov: 70, label: 'Pelagic Sonar Bell · Acoustic Marine Telemetry' },
    { pos: [3.6, 0.45, 0.6], look: [4.4, 1.2, 0.4], fov: 68, label: 'Hydrothermal Chimneys · Mineral Spires & Chemosynthetic Vent Life' },
    { pos: [0.0, 1.6, 1.5], look: [0.0, 2.2, -3.2], fov: 84, label: 'Pelagic Depths · Abyssal Stillness & Light Shaft Wonder' }
  ],
  desert: [
    { pos: [-2.6, 2.0, 3.0], look: [0.0, 1.4, -4.8], fov: 82, label: 'Dune Crest Soar · Approaching Mirrored Oasis Spring' },
    { pos: [-0.8, 0.35, -1.8], look: [0.0, 1.0, -4.4], fov: 72, label: 'Artesian Oasis Spring · Date Palm Grove & Star Compass' },
    { pos: [-3.4, 0.4, 0.5], look: [-4.5, 1.1, 0.7], fov: 66, label: 'Wadi Canyon Shelf · Crystallized Gypsum Desert Rose Minerals' },
    { pos: [-1.8, 0.5, 2.8], look: [0.2, 2.2, 4.2], fov: 74, label: 'Aeolian Slip-Face · Approaching Wind-Harp Pavilion' },
    { pos: [0.2, 0.7, 3.6], look: [0.2, 3.2, 4.4], fov: 68, label: 'Aeolian Wind-Harp · Soaring Lanner Falcon & Resonant Strings' },
    { pos: [2.8, 0.5, 2.5], look: [3.8, 1.3, 3.2], fov: 70, label: 'Celestial Astrolabe · Classical Brass Sundial & Coordinate Rings' },
    { pos: [3.8, 0.45, 0.6], look: [4.6, 1.0, 0.5], fov: 68, label: 'Sandstone Yardang Ridge · Alert Fennec Fox & Shadow Gnomon' },
    { pos: [0.0, 2.0, 1.8], look: [0.0, 1.6, -3.6], fov: 84, label: 'Twilight Sand Sea · Celestial Orientation & Sacred Silence' }
  ]
};

// Reusable zero-GC vectors for per-frame sampling
const _tmpPos = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
const _tmpLook = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;

if (typeof AFRAME !== 'undefined' && !AFRAME.components['wow-mechanics-manager']) {
  AFRAME.registerComponent('wow-mechanics-manager', {
    init: function () {
      this.sceneEl = this.el.sceneEl;
      this.isRunning = false;
      this.isPaused = false;
      this.loopEnabled = true;
      this.currentIndex = 0;
      this.stationElapsed = 0;
      this.stationDuration = 28.0;
      this.stageLabel = 'Aerial Panorama';
      this.lastPoseEmit = 0;
      this.lastToneIndex = -1;

      // Build Catmull-Rom flight splines for each biome
      this.curvesByBiome = {};
      Object.keys(BIOME_CINEMATIC_TRACKS).forEach((bId) => {
        const track = BIOME_CINEMATIC_TRACKS[bId];
        const posPts = track.map((t) => new THREE.Vector3(t.pos[0], t.pos[1], t.pos[2]));
        const lookPts = track.map((t) => new THREE.Vector3(t.look[0], t.look[1], t.look[2]));
        this.curvesByBiome[bId] = {
          posCurve: new THREE.CatmullRomCurve3(posPts, false, 'catmullrom', 0.5),
          lookCurve: new THREE.CatmullRomCurve3(lookPts, false, 'catmullrom', 0.5),
          track
        };
      });

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
      this.lastToneIndex = -1;

      const biomeId = BIOME_ORDER[index];
      const data = EARTH_BIOMES_DATA[biomeId];

      // Keep 3D scene clean & unblocked during cinematic flight
      mgr.setMediaVisible(false);
      mgr.setUIState('explore');
      mgr.switchBiome(biomeId);

      window.tabsirahTimeScale = 1.0;
      natureAudio.setStillnessMode(false);
      window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.35, radius: 0.72 } }));

      const solarArc = BIOME_SOLAR_ARCS[biomeId] || [data.defaultSolar, data.defaultSolar];
      mgr.setSolarElevation(solarArc[0]);

      // Set initial entry pose from track[0]
      const trackData = this.curvesByBiome[biomeId] || this.curvesByBiome.aurora;
      const firstWp = trackData?.track?.[0];
      if (firstWp) {
        this.stageLabel = firstWp.label;
        this.emitCameraPose({
          active: true,
          posX: firstWp.pos[0],
          posY: firstWp.pos[1],
          posZ: firstWp.pos[2],
          yaw: 0.12,
          pitch: 0.12,
          fov: firstWp.fov,
          label: firstWp.label
        });
      }

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
      this.stageLabel = 'Exploration';
      window.tabsirahTimeScale = 1.0;
      natureAudio.setStillnessMode(false);
      window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.25, radius: 0.65 } }));

      this.emitCameraPose({ active: false, zoom: 0.0, panX: 0.0, posX: 0.0, posY: 0.0, posZ: 0.0 });
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
      const tNorm = Math.min(1.0, this.stationElapsed / this.stationDuration);

      // Smooth continuous solar sweep
      if (mgr) {
        const solarNow = solarArc[0] + (solarArc[1] - solarArc[0]) * tNorm;
        mgr.setSolarElevation(solarNow);
      }

      // Sample 3D Catmull-Rom trajectory
      const curveData = this.curvesByBiome[biomeId] || this.curvesByBiome.aurora;
      if (curveData && curveData.posCurve && curveData.lookCurve && _tmpPos && _tmpLook) {
        curveData.posCurve.getPointAt(tNorm, _tmpPos);
        curveData.lookCurve.getPointAt(tNorm, _tmpLook);

        // Interpolate FOV & determine active landmark label
        const track = curveData.track;
        const n = track.length - 1;
        const keyIdx = Math.min(n - 1, Math.floor(tNorm * n));
        const frac = tNorm * n - keyIdx;
        const currentFov = THREE.MathUtils.lerp(track[keyIdx].fov, track[keyIdx + 1].fov, frac);
        const activeWp = track[Math.min(n, Math.round(tNorm * n))];
        this.stageLabel = activeWp.label;

        // Subtle ecological harmonic tone when entering each wonder quadrant
        const currentToneIndex = Math.floor(tNorm * 4);
        if (currentToneIndex !== this.lastToneIndex) {
          this.lastToneIndex = currentToneIndex;
          const tonePitches = [0.25, 0.45, 0.65, 0.85];
          natureAudio.playWonderScaleNote(biomeId, tonePitches[currentToneIndex] || 0.5, _tmpPos);
        }

        // Compute Euler look-at orientation from camera head to target
        const eyeX = _tmpPos.x;
        const eyeY = _tmpPos.y + 1.6; // camera height inside rig
        const eyeZ = _tmpPos.z;

        const dx = _tmpLook.x - eyeX;
        const dy = _tmpLook.y - eyeY;
        const dz = _tmpLook.z - eyeZ;

        const targetYaw = Math.atan2(-dx, -dz);
        const horizDist = Math.hypot(dx, dz);
        const rawPitch = Math.atan2(dy, Math.max(0.01, horizDist));
        // Keep pitch safe: never look straight down or under ground (-0.20 to +0.42 rad)
        const targetPitch = Math.max(-0.20, Math.min(0.42, rawPitch));

        this.emitCameraPose({
          active: true,
          posX: _tmpPos.x,
          posY: _tmpPos.y,
          posZ: _tmpPos.z,
          yaw: targetYaw,
          pitch: targetPitch,
          fov: currentFov,
          label: this.stageLabel
        });
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

