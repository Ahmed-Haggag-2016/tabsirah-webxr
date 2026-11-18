/**
 * Tabsirah: Grand Prize Spatial Innovation Suite
 *  1. micBreathMonitor       — Live Web Audio AnalyserNode microphone breath envelope (50–450 Hz)
 *  2. xr-tabletop-portal     — WebXR immersive-ar Hit-Test surface anchoring + Desktop Tabletop Portal Showcase (T)
 *  3. relic-constellation    — 4-Biome 3D Relic Astrolabe Ring & Unlockable Cosmic Convergence Finale (G)
 *  4. diegetic-onboarding    — Zero-text 3D focus ring & animated gesture comet-arc cues (auto-fades on interact)
 *  5. wonder-brush-trails    — Zero-GC pooled GPU calligraphic stardust trails pitched to biome scales (W / Pinch)
 */

import { EARTH_BIOMES_DATA, BIOME_ORDER } from '../config/earth-biomes-data.js';
import { natureAudio } from './nature-audio.js';

function createRadialSparkTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.32, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.7, 'rgba(186,230,253,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

class MicBreathMonitor {
  constructor() {
    this.isActive = false;
    this.manualMode = false;
    this.status = 'stopped'; // 'stopped' | 'calibrating' | 'ready' | 'error'
    this.level = 0;
    this.rawSnr = 0;
    this.noiseFloor = 0.025;
    this.sensitivity = 1.0;
    this.breathCount = 0;
    this.inBreathSurge = false;
    this.lastSurgeTime = 0;
    this.calibrationStart = 0;
    this.calibrationSum = 0;
    this.calibrationSamples = 0;
    this.phaseLabel = 'Guided breath pacer active';
    this.lastEmitMs = 0;
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.freqBins = null;
    this.timeBins = null;
    if (typeof window !== 'undefined') {
      window.tabsirahMicBreathActive = false;
      window.tabsirahMicBreathLevel = 0;
    }
  }

  setSensitivity(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    this.sensitivity = Math.max(0.4, Math.min(2.0, num));
    this.emitState('');
  }

  setManualMode(manual) {
    this.manualMode = Boolean(manual);
    if (this.manualMode && this.isActive) {
      this.stop();
      return;
    }
    this.phaseLabel = this.manualMode ? 'Guided 14s Breath Pacer (Manual Fallback)' : this.phaseLabel;
    this.emitState('');
  }

  getStatus() {
    return {
      active: this.isActive,
      manualMode: this.manualMode,
      status: this.status,
      level: this.level,
      snr: this.rawSnr,
      noiseFloor: this.noiseFloor,
      sensitivity: this.sensitivity,
      breathCount: this.breathCount,
      phaseLabel: this.phaseLabel
    };
  }

  emitState(error = '') {
    if (typeof window === 'undefined') return;
    window.tabsirahMicBreathActive = this.isActive;
    window.dispatchEvent(
      new CustomEvent('tabsirah-mic-breath-state', {
        detail: {
          ...this.getStatus(),
          error
        }
      })
    );
  }

  async start() {
    if (this.isActive) return true;
    this.manualMode = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.status = 'error';
      this.phaseLabel = 'Microphone API unavailable — using Guided Pacer';
      this.emitState('Microphone unsupported in this browser');
      return false;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true }
      });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      const source = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.80;
      source.connect(this.analyser);
      this.freqBins = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeBins = new Uint8Array(this.analyser.fftSize);

      this.isActive = true;
      this.status = 'calibrating';
      this.calibrationStart = performance.now();
      this.calibrationSum = 0;
      this.calibrationSamples = 0;
      this.noiseFloor = 0.025;
      this.level = 0.08;
      this.rawSnr = 0;
      this.inBreathSurge = false;
      this.phaseLabel = 'Calibrating room noise floor (1.5 s)…';
      this.emitState('');
      return true;
    } catch {
      this.stop();
      this.status = 'error';
      this.manualMode = true;
      this.phaseLabel = 'Mic permission declined — Guided Pacer active';
      this.emitState('Microphone permission declined');
      return false;
    }
  }

  stop() {
    this.isActive = false;
    this.status = 'stopped';
    this.level = 0;
    this.rawSnr = 0;
    this.inBreathSurge = false;
    this.phaseLabel = this.manualMode ? 'Guided 14s Breath Pacer (Manual Fallback)' : 'Mic Breath Idle';
    if (typeof window !== 'undefined') {
      window.tabsirahMicBreathActive = false;
      window.tabsirahMicBreathLevel = 0;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.analyser = null;
    this.freqBins = null;
    this.timeBins = null;
    this.emitState('');
  }

  async toggle() {
    if (this.isActive) {
      this.stop();
      return false;
    }
    return this.start();
  }

  sampleLevel() {
    if (!this.isActive || !this.analyser || !this.freqBins || !this.timeBins) return 0;
    this.analyser.getByteFrequencyData(this.freqBins);
    this.analyser.getByteTimeDomainData(this.timeBins);

    // Time-domain RMS envelope
    let rmsSq = 0;
    for (let i = 0; i < this.timeBins.length; i++) {
      const n = (this.timeBins[i] - 128) / 128;
      rmsSq += n * n;
    }
    const rms = Math.sqrt(rmsSq / Math.max(1, this.timeBins.length));

    // Low-mid FFT band energy (~60–550 Hz)
    let fftSum = 0;
    const endBin = Math.min(18, this.freqBins.length);
    for (let i = 1; i < endBin; i++) {
      fftSum += this.freqBins[i] / 255;
    }
    const fftEnv = fftSum / Math.max(1, endBin - 1);
    const combinedEnv = rms * 0.55 + fftEnv * 0.45;

    const now = performance.now();
    if (this.status === 'calibrating') {
      this.calibrationSum += combinedEnv;
      this.calibrationSamples += 1;
      if (now - this.calibrationStart >= 1500) {
        const avgNoise = this.calibrationSum / Math.max(1, this.calibrationSamples);
        this.noiseFloor = Math.max(0.012, Math.min(0.28, avgNoise * 1.18));
        this.status = 'ready';
        this.phaseLabel = 'Ready — exhale gently near mic';
        this.emitState('');
      }
      this.level = 0.08;
      window.tabsirahMicBreathLevel = this.level;
      return this.level;
    }

    const net = Math.max(0, combinedEnv - this.noiseFloor);
    this.rawSnr = net / Math.max(0.015, this.noiseFloor);
    const normalized = Math.max(0, Math.min(1, (net * 4.4) * this.sensitivity));
    const coeff = normalized > this.level ? 0.22 : 0.055;
    this.level += (normalized - this.level) * coeff;

    if (this.level > 0.24 && this.rawSnr > 0.35) {
      if (!this.inBreathSurge && now - this.lastSurgeTime > 1100) {
        this.inBreathSurge = true;
        this.lastSurgeTime = now;
        this.breathCount += 1;
      }
      this.phaseLabel = 'Breath wave detected (local audio)';
    } else if (this.level > 0.12) {
      this.phaseLabel = 'Soft airflow resonance…';
    } else {
      this.inBreathSurge = false;
      this.phaseLabel = 'Still baseline — breathe naturally';
    }

    if (now - this.lastEmitMs > 180) {
      this.lastEmitMs = now;
      this.emitState('');
    }

    window.tabsirahMicBreathLevel = this.level;
    return this.level;
  }
}

export const micBreathMonitor = new MicBreathMonitor();

if (typeof AFRAME !== 'undefined') {
  /**
   * 1. XR Tabletop Portal & WebXR Hit-Test Anchoring (`xr-tabletop-portal`)
   */
  if (!AFRAME.components['xr-tabletop-portal']) {
    const _hitPos = new THREE.Vector3();
    const _hitQuat = new THREE.Quaternion();
    const _hitScale = new THREE.Vector3();
    const _hitMat = new THREE.Matrix4();

    AFRAME.registerComponent('xr-tabletop-portal', {
      init: function () {
        this.sceneEl = this.el.sceneEl || this.el;
        this.disposables = [];
        this.isTabletopMode = false;
        this.hitTestSource = null;
        this.hitTestRequested = false;
        this.isAnchored = false;
        this.desktopClips = null;
        this.anchorPos = new THREE.Vector3(0, 0.86, -1.42);
        this.elapsed = 0;

        this.portalGroup = new THREE.Group();
        this.portalGroup.visible = false;
        this.buildPortalPedestal();
        this.sceneEl.object3D.add(this.portalGroup);

        this.reticleGroup = new THREE.Group();
        this.reticleGroup.visible = false;
        this.buildHitTestReticle();
        this.sceneEl.object3D.add(this.reticleGroup);

        this.onToggleTabletop = (e) => {
          const next = typeof e.detail?.active === 'boolean' ? e.detail.active : !this.isTabletopMode;
          this.setTabletopMode(next);
        };
        this.onReanchor = () => {
          this.isAnchored = false;
          window.dispatchEvent(
            new CustomEvent('tabsirah-wonder-progress', {
              detail: { message: 'Aim reticle at your table or floor and pinch/trigger to anchor.' }
            })
          );
        };
        this.containerEl = document.getElementById('biome-container');
        this.ringEl = document.getElementById('mr-diorama-ring');
        this.onEnterVR = () => {
          this.hitTestRequested = false;
          try {
            this.hitTestSource?.cancel?.();
          } catch {
            // Safe cleanup if session already closed
          }
          this.hitTestSource = null;
          this.isAnchored = false;
          if (this.isTabletopMode) {
            this.isTabletopMode = false;
            window.dispatchEvent(new CustomEvent('tabsirah-tabletop-state', { detail: { active: false } }));
          }
          const ringEl = this.ringEl || document.getElementById('mr-diorama-ring');
          if (this.sceneEl.is('ar-mode')) {
            this.portalGroup.visible = true;
            this.portalGroup.position.set(0, 0.86, -1.05);
            this.portalGroup.scale.setScalar(0.84);
            if (ringEl?.object3D) {
              ringEl.object3D.position.set(0, 0.86, -1.05);
              ringEl.object3D.scale.setScalar(0.355);
            }
          } else {
            this.portalGroup.visible = false;
            if (ringEl) ringEl.setAttribute('visible', false);
            if (this.sceneEl.object3D) this.sceneEl.object3D.background = null;
            const skyDome = document.getElementById('biome-sky-dome');
            if (skyDome) skyDome.setAttribute('visible', true);
          }
        };
        this.onExitVR = () => {
          try {
            this.hitTestSource?.cancel?.();
          } catch {
            // Safe cleanup if session already closed
          }
          this.hitTestSource = null;
          this.hitTestRequested = false;
          this.reticleGroup.visible = false;
          if (!this.isTabletopMode) {
            this.portalGroup.visible = false;
          }
        };
        this.onXRSelect = () => {
          if (!this.sceneEl.is('ar-mode') || !this.reticleGroup.visible || this.isAnchored) return;
          this.anchorAt(this.reticleGroup.position);
        };

        window.addEventListener('tabsirah-tabletop-toggle', this.onToggleTabletop);
        window.addEventListener('tabsirah-reanchor-tabletop', this.onReanchor);
        this.sceneEl.addEventListener('enter-vr', this.onEnterVR);
        this.sceneEl.addEventListener('exit-vr', this.onExitVR);
        this.sceneEl.addEventListener('pinchstarted', this.onXRSelect);
        this.sceneEl.addEventListener('triggerdown', this.onXRSelect);
      },

      buildPortalPedestal: function () {
        // 1. Dark Obsidian Plinth Base
        const plinthGeo = new THREE.CylinderGeometry(0.60, 0.68, 0.06, 48);
        const plinthMat = new THREE.MeshStandardMaterial({
          color: '#0F172A',
          roughness: 0.78,
          metalness: 0.18
        });
        const plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.y = -0.04;
        this.portalGroup.add(plinth);

        // 2. Brushed Gold Astrolabe Rim
        const rimGeo = new THREE.TorusGeometry(0.61, 0.018, 16, 64);
        const rimMat = new THREE.MeshStandardMaterial({
          color: '#FBBF24',
          emissive: '#92400E',
          emissiveIntensity: 0.35,
          roughness: 0.22,
          metalness: 0.90
        });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = -0.01;
        this.portalGroup.add(rim);

        // 3. Dimensional Vertical Portal Arch Framing the Biome
        const archGeo = new THREE.TorusGeometry(0.64, 0.022, 16, 64, Math.PI * 1.24);
        this.archShaderMat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColorA: { value: new THREE.Color('#38BDF8') },
            uColorB: { value: new THREE.Color('#34D399') }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            varying vec2 vUv;
            void main() {
              float wave = 0.5 + 0.5 * sin(vUv.x * 18.0 - uTime * 2.8);
              vec3 col = mix(uColorA, uColorB, wave);
              gl_FragColor = vec4(col * 1.35, 0.92);
            }
          `,
          transparent: true
        });
        this.archMesh = new THREE.Mesh(archGeo, this.archShaderMat);
        this.archMesh.position.y = 0.32;
        this.archMesh.rotation.z = -Math.PI * 0.12;
        this.portalGroup.add(this.archMesh);

        // 4. Outer Compass Tick Ring (16-fold radial lines)
        const tickVerts = [];
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          tickVerts.push(
            Math.cos(a) * 0.63, -0.005, Math.sin(a) * 0.63,
            Math.cos(a) * 0.72, -0.005, Math.sin(a) * 0.72
          );
        }
        const tickGeo = new THREE.BufferGeometry();
        tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickVerts, 3));
        const tickMat = new THREE.LineBasicMaterial({
          color: '#38BDF8',
          transparent: true,
          opacity: 0.72
        });
        this.tickLines = new THREE.LineSegments(tickGeo, tickMat);
        this.portalGroup.add(this.tickLines);

        // 5. Soft Halo Shadow/Glow Disc Under Pedestal
        const haloGeo = new THREE.RingGeometry(0.58, 0.88, 48);
        const haloMat = new THREE.MeshBasicMaterial({
          color: '#38BDF8',
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.rotation.x = -Math.PI / 2;
        halo.position.y = -0.065;
        this.portalGroup.add(halo);

        this.disposables.push(
          plinthGeo, plinthMat, rimGeo, rimMat, archGeo, this.archShaderMat,
          tickGeo, tickMat, haloGeo, haloMat
        );
      },

      buildHitTestReticle: function () {
        const ringGeo = new THREE.RingGeometry(0.14, 0.175, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: '#34D399',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        this.reticleGroup.add(ring);

        const starVerts = [];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          starVerts.push(0, 0.005, 0, Math.cos(a) * 0.14, 0.005, Math.sin(a) * 0.14);
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
        const starMat = new THREE.LineBasicMaterial({ color: '#FBBF24', transparent: true, opacity: 0.85 });
        this.reticleGroup.add(new THREE.LineSegments(starGeo, starMat));

        this.disposables.push(ringGeo, ringMat, starGeo, starMat);
      },

      anchorAt: function (pos) {
        this.isAnchored = true;
        this.reticleGroup.visible = false;
        this.anchorPos.copy(pos);
        const container = document.getElementById('biome-container');
        const ringEl = document.getElementById('mr-diorama-ring');
        if (container?.object3D) {
          container.object3D.position.set(pos.x, pos.y + 0.02, pos.z);
          container.object3D.scale.setScalar(0.155);
        }
        if (ringEl?.object3D) {
          ringEl.object3D.position.set(pos.x, pos.y, pos.z);
        }
        this.portalGroup.position.set(pos.x, pos.y, pos.z);
        this.updateClippingPlanes(pos.x, pos.z, 0.425);
        natureAudio.playTactileSignature(window.tabsirahActiveBiome || 'aurora', pos);
        window.dispatchEvent(
          new CustomEvent('trigger-haptic', { detail: { pattern: 'tabletop-anchor', intensity: 0.65, duration: 55 } })
        );
        window.dispatchEvent(
          new CustomEvent('tabsirah-wonder-progress', {
            detail: { message: 'Diorama anchored to physical surface!' }
          })
        );
      },

      updateClippingPlanes: function (cx, cz, radius) {
        const renderer = this.sceneEl?.renderer;
        if (!renderer) return;
        if (!this.desktopClips) {
          this.desktopClips = [];
          for (let i = 0; i < 12; i++) {
            this.desktopClips.push(new THREE.Plane());
          }
        }
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          _hitPos.set(-Math.cos(a), 0, -Math.sin(a));
          const coplanarX = cx + Math.cos(a) * radius;
          const coplanarZ = cz + Math.sin(a) * radius;
          this.desktopClips[i].setFromNormalAndCoplanarPoint(_hitPos, _hitScale.set(coplanarX, 0, coplanarZ));
        }
        renderer.localClippingEnabled = true;
        renderer.clippingPlanes = this.desktopClips;
        window.tabsirahMrDiorama = { active: true, radius, center: [cx, cz] };
        window.dispatchEvent(new CustomEvent('tabsirah-mr-diorama', { detail: window.tabsirahMrDiorama }));
      },

      setTabletopMode: function (active) {
        if (this.sceneEl.is('ar-mode')) return;
        this.isTabletopMode = Boolean(active);
        const skyDome = document.getElementById('biome-sky-dome');
        const container = document.getElementById('biome-container');
        const ringEl = document.getElementById('mr-diorama-ring');
        const renderer = this.sceneEl?.renderer;

        if (this.isTabletopMode) {
          const px = 0;
          const py = 0.88;
          const pz = -1.48;
          this.portalGroup.visible = true;
          this.portalGroup.position.set(px, py - 0.02, pz);
          this.portalGroup.scale.setScalar(1.0);
          if (skyDome) skyDome.setAttribute('visible', false);
          if (ringEl) {
            ringEl.setAttribute('visible', true);
            ringEl.object3D.position.set(px, py - 0.015, pz);
            ringEl.object3D.scale.setScalar(0.49);
          }
          if (container?.object3D) {
            container.object3D.position.set(px, py, pz);
            container.object3D.scale.setScalar(0.18);
          }
          this.updateClippingPlanes(px, pz, 0.56);
          if (this.sceneEl.object3D) {
            this.sceneEl.object3D.background = new THREE.Color('#030816');
            this.sceneEl.object3D.fog = null;
          }
          window.dispatchEvent(
            new CustomEvent('biome-cinematic-pose', {
              detail: { active: true, zoom: 0.0, panX: 0, yaw: 0.16, pitch: -0.22 }
            })
          );
          natureAudio.playTransition();
        } else {
          this.portalGroup.visible = false;
          if (skyDome) skyDome.setAttribute('visible', true);
          if (ringEl) ringEl.setAttribute('visible', false);
          if (container?.object3D) {
            container.object3D.position.set(0, 0, 0);
            container.object3D.scale.setScalar(1.0);
          }
          if (renderer) renderer.clippingPlanes = [];
          if (this.sceneEl.object3D) this.sceneEl.object3D.background = null;
          window.tabsirahMrDiorama = { active: false, radius: 0, center: [0, -1.05] };
          window.dispatchEvent(new CustomEvent('tabsirah-mr-diorama', { detail: window.tabsirahMrDiorama }));
          window.tabsirahBiomeManager?.applyBiomeFog(window.tabsirahActiveBiome || 'aurora');
          window.dispatchEvent(
            new CustomEvent('biome-cinematic-pose', { detail: { active: false, zoom: 0, panX: 0 } })
          );
        }

        window.dispatchEvent(
          new CustomEvent('tabsirah-tabletop-state', { detail: { active: this.isTabletopMode } })
        );
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        this.elapsed += dt;

        if (!this.containerEl || !this.containerEl.isConnected) {
          this.containerEl = document.getElementById('biome-container');
        }
        const container = this.containerEl;
        if (this.portalGroup.visible) {
          this.archShaderMat.uniforms.uTime.value = this.elapsed;
          this.tickLines.rotation.y += 0.18 * dt;
          if (this.isTabletopMode && container?.object3D) {
            container.object3D.rotation.y += 0.14 * dt;
          }
        } else {
          if (container?.object3D && container.object3D.rotation.y !== 0 && !this.sceneEl.is('ar-mode')) {
            container.object3D.rotation.y = THREE.MathUtils.damp(container.object3D.rotation.y, 0, 6.0, dt);
          }
        }

        // Live WebXR Hit-Test surface tracking in AR mode
        if (this.sceneEl.is('ar-mode') && !this.isAnchored) {
          const renderer = this.sceneEl.renderer;
          const session = renderer?.xr?.getSession?.();
          const frame = this.sceneEl.frame;
          if (session && !this.hitTestRequested && session.requestHitTestSource) {
            this.hitTestRequested = true;
            session.requestReferenceSpace('viewer').then((refSpace) => {
              return session.requestHitTestSource({ space: refSpace });
            }).then((source) => {
              this.hitTestSource = source;
            }).catch(() => {});
          }
          if (this.hitTestSource && frame) {
            const refSpace = renderer.xr.getReferenceSpace();
            const hits = frame.getHitTestResults(this.hitTestSource);
            if (hits.length > 0) {
              const pose = hits[0].getPose(refSpace);
              if (pose) {
                _hitMat.fromArray(pose.transform.matrix);
                _hitMat.decompose(_hitPos, _hitQuat, _hitScale);
                this.reticleGroup.visible = true;
                this.reticleGroup.position.copy(_hitPos);
                this.reticleGroup.rotation.y += 1.2 * dt;
              }
            }
          }
        }
      },

      remove: function () {
        try {
          this.hitTestSource?.cancel?.();
        } catch {
          // Safe cleanup
        }
        this.hitTestSource = null;
        window.removeEventListener('tabsirah-tabletop-toggle', this.onToggleTabletop);
        window.removeEventListener('tabsirah-reanchor-tabletop', this.onReanchor);
        this.sceneEl?.removeEventListener('enter-vr', this.onEnterVR);
        this.sceneEl?.removeEventListener('exit-vr', this.onExitVR);
        this.sceneEl?.removeEventListener('pinchstarted', this.onXRSelect);
        this.sceneEl?.removeEventListener('triggerdown', this.onXRSelect);
        this.sceneEl?.object3D?.remove(this.portalGroup);
        this.sceneEl?.object3D?.remove(this.reticleGroup);
        this.disposables.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 2. 4-Biome Ecological Relic Constellation & Cosmic Convergence 2.0 (`relic-constellation`)
   */
  if (!AFRAME.components['relic-constellation']) {
    const _leftRelicHandPos = new THREE.Vector3();
    const _rightRelicHandPos = new THREE.Vector3();

    AFRAME.registerComponent('relic-constellation', {
      init: function () {
        this.sceneEl = this.el.sceneEl || this.el;
        this.disposables = [];
        this.litBiomes = new Set();
        this.convergenceActive = false;
        this.elapsed = 0;
        this.lastTwoHandTrigger = 0;
        this.leftHandEl = null;
        this.rightHandEl = null;

        this.root = new THREE.Group();
        this.root.position.set(0, 4.15, -8.4);
        this.sceneEl.object3D.add(this.root);

        this.relicEntries = {};
        this.buildRelicGems();
        this.buildConvergenceBeams();

        this.onDiscovered = (e) => {
          const biomeId = e.detail?.biomeId;
          if (!biomeId || !this.relicEntries[biomeId]) return;
          const wasNew = !this.litBiomes.has(biomeId);
          this.litBiomes.add(biomeId);
          this.syncRelicVisuals();
          this.emitProgress();
          if (wasNew && this.litBiomes.size === BIOME_ORDER.length && !this.convergenceActive) {
            window.dispatchEvent(
              new CustomEvent('tabsirah-wonder-progress', {
                detail: { message: 'All 4 Ecological Relics attuned! Cosmic Convergence unlocked (G).' }
              })
            );
          }
        };

        this.onToggleConvergence = (e) => {
          const next = typeof e.detail?.active === 'boolean' ? e.detail.active : !this.convergenceActive;
          this.setConvergence(next);
        };

        window.addEventListener('tabsirah-discovery-activated', this.onDiscovered);
        window.addEventListener('tabsirah-relic-attuned', this.onDiscovered);
        window.addEventListener('tabsirah-convergence-toggle', this.onToggleConvergence);
      },

      buildRelicGems: function () {
        const specs = [
          { id: 'aurora', color: '#34D399', x: -4.2 },
          { id: 'rainforest', color: '#38BDF8', x: -1.45 },
          { id: 'ocean', color: '#22D3EE', x: 1.45 },
          { id: 'desert', color: '#FBBF24', x: 4.2 }
        ];

        specs.forEach((s, idx) => {
          const holder = new THREE.Group();
          holder.position.set(s.x, 0, 0);

          let geo;
          if (s.id === 'aurora') {
            geo = new THREE.OctahedronGeometry(0.10, 0);
          } else if (s.id === 'rainforest') {
            const pts = [];
            for (let i = 0; i <= 16; i++) {
              const t = i / 16;
              pts.push(new THREE.Vector2(Math.max(0.001, Math.sin(t * Math.PI) * Math.pow(1 - t * 0.5, 0.6) * 0.08), (t - 0.4) * 0.20));
            }
            geo = new THREE.LatheGeometry(pts, 20);
          } else if (s.id === 'ocean') {
            geo = new THREE.IcosahedronGeometry(0.095, 1);
          } else {
            geo = new THREE.OctahedronGeometry(0.10, 0);
          }

          const mat = new THREE.MeshStandardMaterial({
            color: s.color,
            emissive: s.color,
            emissiveIntensity: 0.28,
            roughness: 0.22,
            metalness: 0.65,
            transparent: true,
            opacity: 0.36
          });
          const mesh = new THREE.Mesh(geo, mat);
          holder.add(mesh);

          const haloGeo = new THREE.TorusGeometry(0.145, 0.006, 10, 32);
          const haloMat = new THREE.MeshBasicMaterial({
            color: s.color,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.rotation.x = Math.PI * 0.35;
          holder.add(halo);

          this.root.add(holder);
          this.relicEntries[s.id] = { holder, mesh, mat, halo, haloMat, baseX: s.x, idx };
          this.disposables.push(geo, mat, haloGeo, haloMat);
        });
      },

      buildConvergenceBeams: function () {
        // 4 perimeter inter-biome filament edges (never blocking center vista)
        const verts = new Float32Array(4 * 2 * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        const mat = new THREE.LineBasicMaterial({
          color: '#7DD3FC',
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending
        });
        this.beams = new THREE.LineSegments(geo, mat);
        this.beams.visible = false;
        this.root.add(this.beams);

        // Subtle delicate orbital halo linking all 4 relics across the panoramic sky
        const orbitGeo = new THREE.TorusGeometry(4.2, 0.014, 10, 96);
        const orbitMat = new THREE.MeshBasicMaterial({
          color: '#FDE047',
          transparent: true,
          opacity: 0.42,
          blending: THREE.AdditiveBlending
        });
        this.orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
        this.orbitRing.rotation.x = Math.PI * 0.34;
        this.orbitRing.position.set(0, 0.25, -0.6);
        this.orbitRing.visible = false;
        this.root.add(this.orbitRing);

        this.disposables.push(geo, mat, orbitGeo, orbitMat);
      },

      syncRelicVisuals: function () {
        Object.entries(this.relicEntries).forEach(([id, entry]) => {
          const active = this.litBiomes.has(id) || this.convergenceActive;
          entry.mat.opacity = active ? 0.96 : 0.34;
          entry.mat.emissiveIntensity = active ? 1.15 : 0.24;
          entry.haloMat.opacity = active ? 0.85 : 0.20;
        });
      },

      emitProgress: function () {
        window.dispatchEvent(
          new CustomEvent('tabsirah-relics-updated', {
            detail: {
              count: this.litBiomes.size,
              total: BIOME_ORDER.length,
              allUnlocked: this.litBiomes.size >= BIOME_ORDER.length,
              convergenceActive: this.convergenceActive
            }
          })
        );
      },

      setConvergence: function (active) {
        this.convergenceActive = Boolean(active);
        this.beams.visible = this.convergenceActive;
        if (this.orbitRing) this.orbitRing.visible = this.convergenceActive;
        this.syncRelicVisuals();

        if (this.convergenceActive) {
          window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.48, radius: 0.74 } }));
          natureAudio.playConvergenceChord();
          if (!window.tabsirahHaptics) {
            window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.8, duration: 120 } }));
          }
          window.dispatchEvent(
            new CustomEvent('tabsirah-wonder-progress', {
              detail: { message: 'Cosmic Convergence active — all four living biomes harmonized.' }
            })
          );
        } else {
          window.dispatchEvent(new CustomEvent('set-wow-bloom', { detail: { strength: 1.25, radius: 0.65 } }));
        }
        window.dispatchEvent(
          new CustomEvent('tabsirah-convergence-state', {
            detail: { active: this.convergenceActive, discoveredCount: this.litBiomes.size }
          })
        );
        this.emitProgress();
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        this.elapsed += dt;

        // Two-hand XR convergence trigger: bring both tracked hands close together when unlocked
        if ((this.sceneEl.is('vr-mode') || this.sceneEl.is('ar-mode')) && this.litBiomes.size >= BIOME_ORDER.length) {
          if (!this.leftHandEl || !this.leftHandEl.isConnected) this.leftHandEl = document.getElementById('left-hand');
          if (!this.rightHandEl || !this.rightHandEl.isConnected) this.rightHandEl = document.getElementById('right-hand');
          if (this.leftHandEl?.object3D && this.rightHandEl?.object3D) {
            this.leftHandEl.object3D.getWorldPosition(_leftRelicHandPos);
            this.rightHandEl.object3D.getWorldPosition(_rightRelicHandPos);
            if (_leftRelicHandPos.lengthSq() > 0.01 && _rightRelicHandPos.lengthSq() > 0.01) {
              const dist = _leftRelicHandPos.distanceTo(_rightRelicHandPos);
              const now = performance.now();
              if (dist < 0.16 && now - this.lastTwoHandTrigger > 2200) {
                this.lastTwoHandTrigger = now;
                this.setConvergence(!this.convergenceActive);
              }
            }
          }
        }

        const targetRootY = this.convergenceActive ? 4.35 : 4.15;
        this.root.position.y = THREE.MathUtils.damp(this.root.position.y, targetRootY, 4.0, dt);

        if (this.orbitRing?.visible) {
          this.orbitRing.rotation.z += dt * 0.25;
        }

        const entries = Object.values(this.relicEntries);
        entries.forEach((entry, idx) => {
          const isLit = this.litBiomes.has(BIOME_ORDER[idx]) || this.convergenceActive;
          const speed = this.convergenceActive ? 1.5 : (isLit ? 0.9 : 0.35);
          entry.mesh.rotation.y += speed * dt;
          entry.halo.rotation.z += speed * 0.7 * dt;

          let tx = entry.baseX;
          let ty = Math.sin(this.elapsed * 1.4 + idx * 1.5) * 0.08;
          let tz = 0;

          if (this.convergenceActive) {
            const ang = this.elapsed * 0.55 + (idx / 4) * Math.PI * 2;
            tx = Math.cos(ang) * 4.2;
            ty = Math.sin(ang) * 0.85 + 0.25;
            tz = Math.sin(ang) * 0.65 - 0.6;
            entry.holder.scale.setScalar(THREE.MathUtils.damp(entry.holder.scale.x, 1.55, 5.0, dt));
          } else {
            entry.holder.scale.setScalar(THREE.MathUtils.damp(entry.holder.scale.x, isLit ? 1.28 : 0.9, 5.0, dt));
          }

          entry.holder.position.x = THREE.MathUtils.damp(entry.holder.position.x, tx, 5.0, dt);
          entry.holder.position.y = THREE.MathUtils.damp(entry.holder.position.y, ty, 5.0, dt);
          entry.holder.position.z = THREE.MathUtils.damp(entry.holder.position.z, tz, 5.0, dt);
        });

        if (this.convergenceActive) {
          const beamPos = this.beams.geometry.attributes.position;
          for (let idx = 0; idx < entries.length; idx++) {
            const a = entries[idx].holder.position;
            const b = entries[(idx + 1) % entries.length].holder.position;
            const i6 = idx * 6;
            beamPos.array[i6] = a.x;
            beamPos.array[i6 + 1] = a.y;
            beamPos.array[i6 + 2] = a.z;
            beamPos.array[i6 + 3] = b.x;
            beamPos.array[i6 + 4] = b.y;
            beamPos.array[i6 + 5] = b.z;
          }
          beamPos.needsUpdate = true;
        }
      },

      remove: function () {
        window.removeEventListener('tabsirah-discovery-activated', this.onDiscovered);
        window.removeEventListener('tabsirah-relic-attuned', this.onDiscovered);
        window.removeEventListener('tabsirah-convergence-toggle', this.onToggleConvergence);
        this.sceneEl?.object3D?.remove(this.root);
        this.disposables.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 3. Diegetic 3D Spatial Onboarding Cues (`diegetic-onboarding`)
   * Renders a minimal pulsing target ring + animated gesture comet arc without text clutter.
   */
  if (!AFRAME.components['diegetic-onboarding']) {
    const _arcColor = new THREE.Color('#38BDF8');

    AFRAME.registerComponent('diegetic-onboarding', {
      init: function () {
        this.sceneEl = this.el.sceneEl || this.el;
        this.disposables = [];
        this.active = false;
        this.elapsed = 0;
        this.fade = 0;
        this.currentBiome = 'aurora';

        this.group = new THREE.Group();
        this.group.visible = false;
        this.sceneEl.object3D.add(this.group);

        // Beacon Target Concentric Ring
        const ringGeo = new THREE.RingGeometry(0.28, 0.315, 48);
        this.ringMat = new THREE.MeshBasicMaterial({
          color: '#34D399',
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
        this.group.add(this.ringMesh);

        // 18-bead Pooled Gesture Comet Arc
        this.beadCount = 18;
        this.beadPos = new Float32Array(this.beadCount * 3);
        this.beadCol = new Float32Array(this.beadCount * 3);
        const arcGeo = new THREE.BufferGeometry();
        arcGeo.setAttribute('position', new THREE.BufferAttribute(this.beadPos, 3));
        arcGeo.setAttribute('color', new THREE.BufferAttribute(this.beadCol, 3));
        const sparkTex = createRadialSparkTexture();
        this.arcMat = new THREE.PointsMaterial({
          size: 0.13,
          map: sparkTex,
          vertexColors: true,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.arcPoints = new THREE.Points(arcGeo, this.arcMat);
        this.group.add(this.arcPoints);
        this.disposables.push(ringGeo, this.ringMat, arcGeo, this.arcMat, sparkTex);

        this.onBiomeChange = (e) => {
          const bId = e.detail?.biomeId || window.tabsirahActiveBiome;
          if (!bId) return;
          this.showForBiome(bId);
        };
        this.onInteract = () => {
          this.active = false;
        };

        window.addEventListener('biome-state-changed', this.onBiomeChange);
        window.addEventListener('tabsirah-discovery-activated', this.onInteract);
        this.sceneEl.addEventListener('pointerdown', this.onInteract);
        this.showForBiome('aurora');
      },

      showForBiome: function (biomeId) {
        const data = EARTH_BIOMES_DATA[biomeId];
        if (!data?.discovery?.beaconPos) return;
        this.currentBiome = biomeId;
        this.elapsed = 0;
        this.active = true;
        this.group.visible = true;

        const parts = data.discovery.beaconPos.split(' ').map(Number);
        this.ringMesh.position.set(parts[0] || 0, parts[1] || 1.4, parts[2] || -3.0);
        _arcColor.set(data.accentColor || '#38BDF8');
        this.ringMat.color.copy(_arcColor);

        // Build non-verbal gesture arc curve in wide 3D space aligned with beacons
        const posAttr = this.arcPoints.geometry.attributes.position;
        for (let i = 0; i < this.beadCount; i++) {
          const t = i / (this.beadCount - 1);
          let x = 0, y = 1.6, z = -5.2;
          if (biomeId === 'aurora') {
            x = -1.6 + t * 3.2;
            y = 2.45 + Math.sin(t * Math.PI) * 0.6;
            z = -5.4;
          } else if (biomeId === 'rainforest') {
            x = -0.35 + Math.sin(t * Math.PI) * 0.35;
            y = 1.45 + t * 1.15;
            z = -5.0;
          } else if (biomeId === 'ocean') {
            x = -0.55 + t * 1.8;
            y = 1.65 + Math.sin(t * Math.PI * 2) * 0.2;
            z = -5.2;
          } else {
            const a = -Math.PI * 0.65 + t * Math.PI * 0.9;
            x = Math.cos(a) * 1.15;
            y = 1.48;
            z = -5.4 + Math.sin(a) * 0.55;
          }
          posAttr.array[i * 3] = x;
          posAttr.array[i * 3 + 1] = y;
          posAttr.array[i * 3 + 2] = z;
        }
        posAttr.needsUpdate = true;
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.group.visible) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        this.elapsed += dt;
        if (this.elapsed > 11.0) this.active = false;

        this.fade = THREE.MathUtils.damp(this.fade, this.active ? 1.0 : 0.0, 4.5, dt);
        if (this.fade < 0.01 && !this.active) {
          this.group.visible = false;
          return;
        }

        const pulse = (this.elapsed * 0.85) % 1.0;
        this.ringMesh.scale.setScalar(0.85 + pulse * 0.65);
        this.ringMat.opacity = (1.0 - pulse) * 0.62 * this.fade;

        const cometHead = (this.elapsed * 0.95) % 1.0;
        const colAttr = this.arcPoints.geometry.attributes.color;
        for (let i = 0; i < this.beadCount; i++) {
          const t = i / (this.beadCount - 1);
          const dist = Math.abs(t - cometHead);
          const bright = Math.max(0.12, 1.0 - dist * 4.5);
          colAttr.array[i * 3] = _arcColor.r * bright;
          colAttr.array[i * 3 + 1] = _arcColor.g * bright;
          colAttr.array[i * 3 + 2] = _arcColor.b * bright;
        }
        colAttr.needsUpdate = true;
        this.arcMat.opacity = 0.78 * this.fade;
      },

      remove: function () {
        window.removeEventListener('biome-state-changed', this.onBiomeChange);
        window.removeEventListener('tabsirah-discovery-activated', this.onInteract);
        this.sceneEl?.removeEventListener('pointerdown', this.onInteract);
        this.sceneEl?.object3D?.remove(this.group);
        this.disposables.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 4. Pooled Calligraphic Stardust Wonder Brush (`wonder-brush-trails`)
   */
  if (!AFRAME.components['wonder-brush-trails']) {
    const MAX_TRAIL_POINTS = 360;
    const _ndc = new THREE.Vector2();
    const _rayDir = new THREE.Vector3();
    const _camPos = new THREE.Vector3();
    const _emitPos = new THREE.Vector3();
    const _handVec = new THREE.Vector3();
    const _prevStrokePos = new THREE.Vector3();
    const _brushCol = new THREE.Color('#38BDF8');

    AFRAME.registerComponent('wonder-brush-trails', {
      init: function () {
        this.sceneEl = this.el.sceneEl || this.el;
        this.brushEnabled = false;
        this.isDrawing = false;
        this.hasPrevStrokePos = false;
        this.cursor = 0;
        this.lastEmitTime = 0;
        this.lastNoteTime = 0;
        this.lastHapticStrokeTime = 0;
        this.leftHandEl = null;
        this.rightHandEl = null;
        this.leftControllerEl = null;
        this.rightControllerEl = null;
        this.controllerTriggers = { left: false, right: false };

        this.positions = new Float32Array(MAX_TRAIL_POINTS * 3);
        this.colors = new Float32Array(MAX_TRAIL_POINTS * 3);
        this.velocities = new Float32Array(MAX_TRAIL_POINTS * 3);
        this.ages = new Float32Array(MAX_TRAIL_POINTS);
        for (let i = 0; i < MAX_TRAIL_POINTS; i++) {
          this.ages[i] = 99.0;
          this.positions[i * 3 + 1] = -999;
        }

        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.tex = createRadialSparkTexture();
        this.mat = new THREE.PointsMaterial({
          size: 0.14,
          map: this.tex,
          vertexColors: true,
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.points = new THREE.Points(this.geo, this.mat);
        this.points.frustumCulled = false;
        this.sceneEl.object3D.add(this.points);

        this.onToggleBrush = (e) => {
          this.brushEnabled = typeof e.detail?.active === 'boolean' ? e.detail.active : !this.brushEnabled;
          if (!this.brushEnabled) {
            this.hasPrevStrokePos = false;
            this.controllerTriggers.left = false;
            this.controllerTriggers.right = false;
          }
          window.dispatchEvent(
            new CustomEvent('tabsirah-wonder-brush-state', { detail: { active: this.brushEnabled } })
          );
        };

        this.onPointerDown = (e) => {
          if (this.brushEnabled || e.shiftKey) {
            this.isDrawing = true;
            this.hasPrevStrokePos = false;
            this.emitFromPointer(e);
          }
        };
        this.onPointerMove = (e) => {
          if (this.isDrawing || this.brushEnabled) {
            if (e.buttons === 1 || this.brushEnabled) {
              this.emitFromPointer(e);
            }
          }
        };
        this.onPointerUp = () => {
          this.isDrawing = false;
          this.hasPrevStrokePos = false;
        };

        this.onLeftTriggerDown = () => {
          this.controllerTriggers.left = true;
          this.hasPrevStrokePos = false;
        };
        this.onLeftTriggerUp = () => {
          this.controllerTriggers.left = false;
          this.hasPrevStrokePos = false;
        };
        this.onRightTriggerDown = () => {
          this.controllerTriggers.right = true;
          this.hasPrevStrokePos = false;
        };
        this.onRightTriggerUp = () => {
          this.controllerTriggers.right = false;
          this.hasPrevStrokePos = false;
        };

        this.bindControllers = () => {
          if (!this.leftControllerEl || !this.leftControllerEl.isConnected) {
            this.leftControllerEl = document.getElementById('left-controller');
            this.leftControllerEl?.addEventListener('triggerdown', this.onLeftTriggerDown);
            this.leftControllerEl?.addEventListener('triggerup', this.onLeftTriggerUp);
          }
          if (!this.rightControllerEl || !this.rightControllerEl.isConnected) {
            this.rightControllerEl = document.getElementById('right-controller');
            this.rightControllerEl?.addEventListener('triggerdown', this.onRightTriggerDown);
            this.rightControllerEl?.addEventListener('triggerup', this.onRightTriggerUp);
          }
        };

        window.addEventListener('tabsirah-wonder-brush-toggle', this.onToggleBrush);
        this.sceneEl.addEventListener('pointerdown', this.onPointerDown);
        this.sceneEl.addEventListener('enter-vr', this.bindControllers);
        window.addEventListener('pointermove', this.onPointerMove, { passive: true });
        window.addEventListener('pointerup', this.onPointerUp, { passive: true });
        this.bindControllers();
      },

      emitAtWorldPos: function (pos, hand = 'right') {
        const now = performance.now();
        if (now - this.lastEmitTime < 22) return;
        this.lastEmitTime = now;

        const biomeId = window.tabsirahActiveBiome || 'aurora';
        const data = EARTH_BIOMES_DATA[biomeId];
        _brushCol.set(data?.accentColor || '#38BDF8');

        const speed = this.hasPrevStrokePos ? Math.min(1.5, pos.distanceTo(_prevStrokePos) * 14) : 0.35;
        _prevStrokePos.copy(pos);
        this.hasPrevStrokePos = true;

        for (let burst = 0; burst < 2; burst++) {
          const i = this.cursor;
          const i3 = i * 3;
          this.positions[i3] = pos.x + (Math.random() - 0.5) * 0.05;
          this.positions[i3 + 1] = pos.y + (Math.random() - 0.5) * 0.05;
          this.positions[i3 + 2] = pos.z + (Math.random() - 0.5) * 0.05;

          this.velocities[i3] = (Math.random() - 0.5) * 0.08;
          this.velocities[i3 + 1] = 0.06 + Math.random() * 0.09;
          this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.08;

          this.colors[i3] = _brushCol.r;
          this.colors[i3 + 1] = _brushCol.g;
          this.colors[i3 + 2] = _brushCol.b;
          this.ages[i] = 0.0;
          this.cursor = (this.cursor + 1) % MAX_TRAIL_POINTS;
        }

        const pitchNorm = THREE.MathUtils.clamp((pos.y - 0.6) / 2.2, 0, 1);

        if (now - this.lastHapticStrokeTime >= 42) {
          this.lastHapticStrokeTime = now;
          window.dispatchEvent(
            new CustomEvent('tabsirah-wonder-brush-stroke', {
              detail: { biomeId, pitchNorm, speed, hand }
            })
          );
        }

        if (now - this.lastNoteTime > 125) {
          this.lastNoteTime = now;
          natureAudio.playWonderScaleNote(biomeId, pitchNorm, pos);
        }
      },

      emitFromPointer: function (e) {
        const cam = this.sceneEl?.camera;
        if (!cam) return;
        _ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
        _ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
        _rayDir.set(_ndc.x, _ndc.y, 0.5).unproject(cam);
        cam.getWorldPosition(_camPos);
        _rayDir.sub(_camPos).normalize();
        _emitPos.copy(_camPos).addScaledVector(_rayDir, 2.75);
        this.emitAtWorldPos(_emitPos, 'both');
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;

        // Support both bare-hand XR pinches and controller triggers in VR/AR
        if (this.sceneEl.is('vr-mode') || this.sceneEl.is('ar-mode')) {
          if (!this.rightHandEl || !this.rightHandEl.isConnected) {
            this.rightHandEl = document.getElementById('right-hand');
          }
          if (!this.leftHandEl || !this.leftHandEl.isConnected) {
            this.leftHandEl = document.getElementById('left-hand');
          }
          const rh = this.rightHandEl;
          const lh = this.leftHandEl;
          if (rh?.components?.['biome-hand-controls']?.isPinched) {
            rh.object3D.getWorldPosition(_handVec);
            if (_handVec.lengthSq() > 0.01) this.emitAtWorldPos(_handVec, 'right');
          } else if (lh?.components?.['biome-hand-controls']?.isPinched) {
            lh.object3D.getWorldPosition(_handVec);
            if (_handVec.lengthSq() > 0.01) this.emitAtWorldPos(_handVec, 'left');
          } else if (this.brushEnabled) {
            this.bindControllers();
            if (this.controllerTriggers.right && this.rightControllerEl?.object3D) {
              this.rightControllerEl.object3D.getWorldPosition(_handVec);
              if (_handVec.lengthSq() > 0.01) this.emitAtWorldPos(_handVec, 'right');
            } else if (this.controllerTriggers.left && this.leftControllerEl?.object3D) {
              this.leftControllerEl.object3D.getWorldPosition(_handVec);
              if (_handVec.lengthSq() > 0.01) this.emitAtWorldPos(_handVec, 'left');
            }
          }
        }

        let anyAlive = false;
        const biomeId = window.tabsirahActiveBiome || 'aurora';
        _brushCol.set(EARTH_BIOMES_DATA[biomeId]?.accentColor || '#38BDF8');

        for (let i = 0; i < MAX_TRAIL_POINTS; i++) {
          const age = this.ages[i];
          if (age > 3.6) continue;
          anyAlive = true;
          const nextAge = age + dt;
          this.ages[i] = nextAge;
          const i3 = i * 3;
          this.positions[i3] += this.velocities[i3] * dt;
          this.positions[i3 + 1] += this.velocities[i3 + 1] * dt;
          this.positions[i3 + 2] += this.velocities[i3 + 2] * dt;

          const fade = Math.max(0, 1.0 - nextAge / 3.6);
          this.colors[i3] = _brushCol.r * fade;
          this.colors[i3 + 1] = _brushCol.g * fade;
          this.colors[i3 + 2] = _brushCol.b * fade;
          if (nextAge >= 3.6) {
            this.positions[i3 + 1] = -999;
          }
        }

        if (anyAlive) {
          this.geo.attributes.position.needsUpdate = true;
          this.geo.attributes.color.needsUpdate = true;
        }
      },

      remove: function () {
        window.removeEventListener('tabsirah-wonder-brush-toggle', this.onToggleBrush);
        this.sceneEl?.removeEventListener('pointerdown', this.onPointerDown);
        this.sceneEl?.removeEventListener('enter-vr', this.bindControllers);
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        this.leftControllerEl?.removeEventListener('triggerdown', this.onLeftTriggerDown);
        this.leftControllerEl?.removeEventListener('triggerup', this.onLeftTriggerUp);
        this.rightControllerEl?.removeEventListener('triggerdown', this.onRightTriggerDown);
        this.rightControllerEl?.removeEventListener('triggerup', this.onRightTriggerUp);
        this.sceneEl?.object3D?.remove(this.points);
        this.geo?.dispose();
        this.mat?.dispose();
        this.tex?.dispose();
      }
    });
  }
}
