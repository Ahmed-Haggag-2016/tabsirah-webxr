/**
 * Tabsirah: The Architecture of Light & Order
 * Embodied Controls & Physics Interaction Suite:
 *  1. BreathResonanceController (Microphone breath envelope detector + 0.1 Hz Guided Breath fallback)
 *  2. gravity-fabric-system (Station 3: Sculptable Spacetime Well shader + Orbital Harmony integrator)
 *  3. hand-gesture, xr-hand-pinch-bridge & chronos-time-control (Meta Quest hands + desktop parity)
 */

import { spatialAudio } from './spatial-audio.js';

if (typeof window !== 'undefined') {
  if (typeof window.tabsirahTimeScale !== 'number') window.tabsirahTimeScale = 1.0;
  if (typeof window.tabsirahBreathPhase !== 'number') window.tabsirahBreathPhase = 0.25;
}

class BreathResonanceController {
  constructor() {
    this.mode = 'guided'; // 'guided' | 'mic'
    this.micStream = null;
    this.micCtx = null;
    this.micAnalyser = null;
    this.micData = null;
    this.phase = 0.25;
    this.cycleClock = 0;
    this.rafId = null;
    this.lastTick = performance.now();
    this.onUpdateCb = null;
  }

  start(onUpdate) {
    this.onUpdateCb = onUpdate;
    if (this.rafId) return;
    this.lastTick = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTick) / 1000));
      this.lastTick = now;
      this.step(dt);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  async enableMicrophone() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { ok: false, reason: 'Microphone API unavailable in this browser; using Guided Breath.' };
    }
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.micCtx = new AudioCtx();
      const src = this.micCtx.createMediaStreamSource(this.micStream);
      this.micAnalyser = this.micCtx.createAnalyser();
      this.micAnalyser.fftSize = 512;
      this.micData = new Uint8Array(this.micAnalyser.fftSize);
      src.connect(this.micAnalyser);
      this.mode = 'mic';
      return { ok: true };
    } catch {
      this.disableMicrophone();
      return { ok: false, reason: 'Mic permission declined; using Guided Breath rhythm.' };
    }
  }

  disableMicrophone() {
    this.mode = 'guided';
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micCtx) {
      this.micCtx.close().catch(() => {});
      this.micCtx = null;
    }
    this.micAnalyser = null;
    this.micData = null;
  }

  step(dt) {
    const timeScale = window.tabsirahTimeScale || 1.0;
    let target = 0.2;
    let label = 'Exhale';

    if (this.mode === 'mic' && this.micAnalyser && this.micData) {
      this.micAnalyser.getByteTimeDomainData(this.micData);
      let sumSq = 0;
      for (let i = 0; i < this.micData.length; i++) {
        const sample = (this.micData[i] - 128) / 128;
        sumSq += sample * sample;
      }
      const rms = Math.sqrt(sumSq / this.micData.length);
      // Map soft breath RMS (0.01–0.14) cleanly into 0..1 resonance scalar
      target = Math.max(0.05, Math.min(1.0, (rms - 0.006) * 11.5));
      label = target > 0.42 ? 'Inhale Flow' : 'Stillness';
    } else {
      // Guided 10-second coherent breathing (4s smooth inhale -> 6s calm exhale)
      this.cycleClock = (this.cycleClock + dt * Math.max(0.4, Math.min(2.0, timeScale))) % 10.0;
      if (this.cycleClock < 4.0) {
        const t = this.cycleClock / 4.0;
        target = 0.5 - 0.5 * Math.cos(t * Math.PI);
        label = 'Inhale';
      } else {
        const t = (this.cycleClock - 4.0) / 6.0;
        target = 0.5 + 0.5 * Math.cos(t * Math.PI);
        label = 'Exhale';
      }
    }

    const alpha = 1 - Math.exp(-5.0 * dt);
    this.phase = this.phase + (target - this.phase) * alpha;
    window.tabsirahBreathPhase = this.phase;
    spatialAudio.setBreathModulation(this.phase);
    this.onUpdateCb?.(this.phase, label, this.mode);
  }
}

export const breathController = new BreathResonanceController();

if (typeof AFRAME !== 'undefined') {
  const _vA = new THREE.Vector3();
  const _vB = new THREE.Vector3();
  const _localHit = new THREE.Vector3();
  const _worldPos = new THREE.Vector3();

  /**
   * 1. Hand Gesture & Desktop Pointer Component
   */
  if (!AFRAME.components['hand-gesture']) {
    AFRAME.registerComponent('hand-gesture', {
      schema: {
        hoverScale: { type: 'number', default: 1.06 },
        debounceMs: { type: 'number', default: 220 }
      },
      init: function () {
        this.lastTriggerTime = 0;
        this.restScale = this.el.object3D.scale.clone();
        this.isHovered = false;
        this.onEnter = () => {
          if (!this.isHovered) this.restScale.copy(this.el.object3D.scale);
          this.isHovered = true;
          this.el.object3D.scale.copy(this.restScale).multiplyScalar(this.data.hoverScale);
          document.body.style.cursor = 'pointer';
        };
        this.onLeave = () => {
          this.isHovered = false;
          this.el.object3D.scale.copy(this.restScale);
          document.body.style.cursor = 'default';
        };
        this.onActivate = (evt) => {
          const now = performance.now();
          if (now - this.lastTriggerTime < this.data.debounceMs) return;
          this.lastTriggerTime = now;
          this.el.emit('gesture-activate', { source: evt.type, detail: evt.detail });
        };

        this.el.addEventListener('mouseenter', this.onEnter);
        this.el.addEventListener('mouseleave', this.onLeave);
        this.el.addEventListener('click', this.onActivate);
        this.el.addEventListener('pinchstarted', this.onActivate);
        this.el.addEventListener('triggerdown', this.onActivate);
      },
      remove: function () {
        this.el.removeEventListener('mouseenter', this.onEnter);
        this.el.removeEventListener('mouseleave', this.onLeave);
        this.el.removeEventListener('click', this.onActivate);
        this.el.removeEventListener('pinchstarted', this.onActivate);
        this.el.removeEventListener('triggerdown', this.onActivate);
        document.body.style.cursor = 'default';
      }
    });
  }

  /**
   * 2. Meta Quest Hand-Tracking Pinch Proximity Bridge
   */
  if (!AFRAME.components['xr-hand-pinch-bridge']) {
    AFRAME.registerComponent('xr-hand-pinch-bridge', {
      schema: { reachRadius: { type: 'number', default: 0.52 } },
      init: function () {
        this.worldPos = new THREE.Vector3();
        this.targetPos = new THREE.Vector3();
        this.onPinch = (evt) => {
          if (evt.detail?.position) this.worldPos.copy(evt.detail.position);
          else this.el.object3D.getWorldPosition(this.worldPos);

          const nodes = document.querySelectorAll('.interactive-node');
          let best = null;
          let bestDist = this.data.reachRadius;
          nodes.forEach((n) => {
            if (!n.object3D || !n.object3D.visible) return;
            n.object3D.getWorldPosition(this.targetPos);
            const d = this.worldPos.distanceTo(this.targetPos);
            if (d < bestDist) {
              bestDist = d;
              best = n;
            }
          });
          if (best) {
            best.emit('pinchstarted', { source: 'xr-hand', worldPoint: this.worldPos.clone() });
          }
        };
        this.el.addEventListener('pinchstarted', this.onPinch);
      },
      remove: function () {
        this.el.removeEventListener('pinchstarted', this.onPinch);
      }
    });
  }

  /**
   * 3. Chronos Two-Handed Time & Gravity Scrubber
   */
  if (!AFRAME.components['chronos-time-control']) {
    AFRAME.registerComponent('chronos-time-control', {
      init: function () {
        this.leftPinching = false;
        this.rightPinching = false;
        this.initialSpan = null;
        this.baseScale = 1.0;
        this.leftHand = document.getElementById('left-hand');
        this.rightHand = document.getElementById('right-hand');

        const begin = () => {
          if (this.leftPinching && this.rightPinching && this.leftHand && this.rightHand) {
            this.leftHand.object3D.getWorldPosition(_vA);
            this.rightHand.object3D.getWorldPosition(_vB);
            this.initialSpan = Math.max(0.08, _vA.distanceTo(_vB));
            this.baseScale = window.tabsirahTimeScale || 1.0;
          }
        };

        this.onLS = () => { this.leftPinching = true; begin(); };
        this.onLE = () => { this.leftPinching = false; this.initialSpan = null; };
        this.onRS = () => { this.rightPinching = true; begin(); };
        this.onRE = () => { this.rightPinching = false; this.initialSpan = null; };

        this.leftHand?.addEventListener('pinchstarted', this.onLS);
        this.leftHand?.addEventListener('pinchended', this.onLE);
        this.rightHand?.addEventListener('pinchstarted', this.onRS);
        this.rightHand?.addEventListener('pinchended', this.onRE);
      },
      tick: function () {
        if (!this.leftPinching || !this.rightPinching || this.initialSpan === null) return;
        this.leftHand.object3D.getWorldPosition(_vA);
        this.rightHand.object3D.getWorldPosition(_vB);
        const span = Math.max(0.06, _vA.distanceTo(_vB));
        const nextScale = THREE.MathUtils.clamp(this.baseScale * (span / this.initialSpan), 0.1, 4.0);
        if (Math.abs(nextScale - (window.tabsirahTimeScale || 1)) > 0.02) {
          window.tabsirahTimeScale = Number(nextScale.toFixed(2));
          window.dispatchEvent(new CustomEvent('chronos-scale-changed', { detail: { scale: window.tabsirahTimeScale } }));
        }
      },
      remove: function () {
        this.leftHand?.removeEventListener('pinchstarted', this.onLS);
        this.leftHand?.removeEventListener('pinchended', this.onLE);
        this.rightHand?.removeEventListener('pinchstarted', this.onRS);
        this.rightHand?.removeEventListener('pinchended', this.onRE);
      }
    });
  }

  /**
   * 4. Station 3: Sculptable Gravity Wells & Orbital Harmony Integrator
   * Vertex-deformed spacetime plane + interactive Mass Nodes + Keplerian test-planets.
   */
  if (!AFRAME.components['gravity-fabric-system']) {
    AFRAME.registerComponent('gravity-fabric-system', {
      init: function () {
        this.group = new THREE.Group();

        // 6 gravity slots: index 0 = central star (mass 1.0), indices 1..5 = user Mass Nodes
        this.maxWells = 6;
        this.wellVecs = Array.from({ length: this.maxWells }, () => new THREE.Vector3(0, 0, 0)); // (x, z, massStrength)
        this.wellVecs[0].set(0, 0, 1.15);
        this.activeUserWells = 0;

        // Luminous Spacetime Fabric Grid (Vertex Shader Curvature)
        this.gridGeo = new THREE.PlaneGeometry(5.2, 4.2, 56, 46);
        this.gridGeo.rotateX(-Math.PI / 2);
        this.gridMat = new THREE.ShaderMaterial({
          uniforms: {
            uWells: { value: this.wellVecs },
            uTime: { value: 0 }
          },
          vertexShader: `
            uniform vec3 uWells[6];
            varying vec2 vXZ;
            varying float vDepth;
            void main() {
              vec3 pos = position;
              float disp = 0.0;
              for (int i = 0; i < 6; i++) {
                float mass = uWells[i].z;
                if (mass > 0.001) {
                  float d = length(pos.xz - uWells[i].xy);
                  disp -= mass * 0.58 / sqrt(d * d + 0.22);
                }
              }
              pos.y += disp;
              vXZ = position.xz;
              vDepth = clamp(-disp, 0.0, 1.4);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec2 vXZ;
            varying float vDepth;
            void main() {
              // Crisp anti-aliased spacetime coordinate lines
              vec2 grid = abs(fract(vXZ * 3.0 - 0.5) - 0.5) / fwidth(vXZ * 3.0);
              float line = 1.0 - min(min(grid.x, grid.y), 1.0);
              float radialFade = smoothstep(2.65, 0.85, length(vXZ));
              vec3 flatCol = vec3(0.18, 0.58, 0.92);
              vec3 wellCol = vec3(0.99, 0.76, 0.18);
              vec3 col = mix(flatCol, wellCol, smoothstep(0.18, 0.95, vDepth));
              float pulse = 0.88 + 0.12 * sin(vDepth * 8.0 - uTime * 2.5);
              float alpha = radialFade * (0.08 + line * 0.72 * pulse + vDepth * 0.18);
              gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          extensions: { derivatives: true }
        });
        this.gridMesh = new THREE.Mesh(this.gridGeo, this.gridMat);
        this.group.add(this.gridMesh);

        // User-Placed Mass Node Visual Orbs (indices 1..5)
        this.nodeGeo = new THREE.SphereGeometry(0.11, 18, 14);
        this.nodeMat = new THREE.MeshStandardMaterial({
          color: '#38BDF8',
          emissive: '#0284C7',
          emissiveIntensity: 1.5
        });
        this.nodeMeshes = [];
        for (let i = 1; i < this.maxWells; i++) {
          const m = new THREE.Mesh(this.nodeGeo, this.nodeMat);
          m.visible = false;
          this.group.add(m);
          this.nodeMeshes.push(m);
        }

        // 4 Orbiting Test-Planets with luminous orbital trails
        this.planetConfigs = [
          { r: 0.95, speed: 1.45, color: '#38BDF8', radius: 0.065, phase: 0.2 },
          { r: 1.38, speed: 1.18, color: '#34D399', radius: 0.08, phase: 2.1 },
          { r: 1.78, speed: 1.03, color: '#A78BFA', radius: 0.072, phase: 4.0 },
          { r: 2.15, speed: 0.92, color: '#F472B6', radius: 0.062, phase: 5.3 }
        ];
        this.planetGeo = new THREE.SphereGeometry(1, 16, 12);
        this.planets = this.planetConfigs.map((cfg) => {
          const x = Math.cos(cfg.phase) * cfg.r;
          const z = Math.sin(cfg.phase) * cfg.r;
          // Circular orbital velocity v = sqrt(GM/r)
          const G = 2.05;
          const vMag = Math.sqrt(G / cfg.r);
          const vx = -Math.sin(cfg.phase) * vMag;
          const vz = Math.cos(cfg.phase) * vMag;

          const mat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            emissive: cfg.color,
            emissiveIntensity: 1.35
          });
          const mesh = new THREE.Mesh(this.planetGeo, mat);
          mesh.scale.setScalar(cfg.radius);
          this.group.add(mesh);

          // Pre-allocated BufferGeometry trail
          const trailLen = 48;
          const trailPos = new Float32Array(trailLen * 3);
          for (let k = 0; k < trailLen; k++) {
            trailPos[k * 3] = x;
            trailPos[k * 3 + 1] = 0;
            trailPos[k * 3 + 2] = z;
          }
          const trailGeo = new THREE.BufferGeometry();
          const trailAttr = new THREE.BufferAttribute(trailPos, 3);
          trailGeo.setAttribute('position', trailAttr);
          const trailMat = new THREE.LineBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: 0.6
          });
          const trailLine = new THREE.Line(trailGeo, trailMat);
          trailLine.frustumCulled = false;
          this.group.add(trailLine);

          return {
            cfg,
            pos: new THREE.Vector2(x, z),
            vel: new THREE.Vector2(vx, vz),
            mesh,
            mat,
            trailPos,
            trailGeo,
            trailAttr,
            trailMat,
            trailLen
          };
        });

        this.el.setObject3D('mesh', this.group);
        this.elapsed = 0;

        // Bind Click/Pinch on the interactive entity to place temporary Mass Nodes
        this.onPlaceNode = (evt) => {
          let lx = (Math.random() - 0.5) * 2.8;
          let lz = (Math.random() - 0.5) * 2.2;
          const intersectPt = evt.detail?.intersection?.point || evt.detail?.worldPoint;
          if (intersectPt) {
            _localHit.copy(intersectPt);
            this.el.object3D.worldToLocal(_localHit);
            lx = THREE.MathUtils.clamp(_localHit.x, -2.2, 2.2);
            lz = THREE.MathUtils.clamp(_localHit.z, -1.8, 1.8);
          }
          this.placeMassNode(lx, lz);
        };
        this.onResetWells = () => this.resetMassNodes();

        this.el.addEventListener('click', this.onPlaceNode);
        this.el.addEventListener('pinchstarted', this.onPlaceNode);
        this.el.sceneEl?.addEventListener('gravity-reset-wells', this.onResetWells);
      },

      sampleDepthAt: function (x, z) {
        let disp = 0;
        for (let i = 0; i < this.maxWells; i++) {
          const w = this.wellVecs[i];
          if (w.z > 0.001) {
            const dx = x - w.x;
            const dz = z - w.y;
            disp -= w.z * 0.58 / Math.sqrt(dx * dx + dz * dz + 0.22);
          }
        }
        return disp;
      },

      placeMassNode: function (x, z) {
        // Keep clear of solar core radius
        if (Math.hypot(x, z) < 0.55) {
          x = x >= 0 ? 0.85 : -0.85;
        }
        const slot = (this.activeUserWells % (this.maxWells - 1)) + 1;
        this.activeUserWells++;
        this.wellVecs[slot].set(x, z, 0.62);

        const orb = this.nodeMeshes[slot - 1];
        if (orb) {
          orb.visible = true;
          orb.position.set(x, this.sampleDepthAt(x, z) + 0.06, z);
        }

        this.el.object3D.getWorldPosition(_worldPos);
        spatialAudio.playGravityWellTone(Math.min(5, this.activeUserWells), _worldPos);
      },

      resetMassNodes: function () {
        this.activeUserWells = 0;
        for (let i = 1; i < this.maxWells; i++) {
          this.wellVecs[i].set(0, 0, 0);
          if (this.nodeMeshes[i - 1]) this.nodeMeshes[i - 1].visible = false;
        }
        // Restore clean circular Keplerian harmony
        const G = 2.05;
        this.planets.forEach((p) => {
          const r = p.cfg.r;
          const vMag = Math.sqrt(G / r);
          p.pos.set(Math.cos(p.cfg.phase) * r, Math.sin(p.cfg.phase) * r);
          p.vel.set(-Math.sin(p.cfg.phase) * vMag, Math.cos(p.cfg.phase) * vMag);
        });
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = Math.min(0.035, (Math.min(timeDelta, 50) / 1000) * scale);
        this.elapsed += dt;
        this.gridMat.uniforms.uTime.value = this.elapsed;

        // Gravitational sub-step integration across central star + sculpted user Mass Nodes
        const subSteps = 2;
        const h = dt / subSteps;
        const G = 1.78;

        for (let pIdx = 0; pIdx < this.planets.length; pIdx++) {
          const p = this.planets[pIdx];
          for (let s = 0; s < subSteps; s++) {
            let ax = 0;
            let az = 0;
            for (let w = 0; w < this.maxWells; w++) {
              const well = this.wellVecs[w];
              if (well.z <= 0.001) continue;
              const dx = well.x - p.pos.x;
              const dz = well.y - p.pos.y;
              const r2 = dx * dx + dz * dz + 0.14;
              const invR3 = (G * well.z) / (r2 * Math.sqrt(r2));
              ax += dx * invR3;
              az += dz * invR3;
            }
            p.vel.x += ax * h;
            p.vel.y += az * h;
            p.pos.x += p.vel.x * h;
            p.pos.y += p.vel.y * h;
          }

          // Keep captured test-planets safely bounded in view
          const rad = Math.hypot(p.pos.x, p.pos.y);
          if (rad > 2.55 || rad < 0.34) {
            const resetR = p.cfg.r;
            const vMag = Math.sqrt((G * 1.15) / resetR);
            p.pos.set(resetR, 0);
            p.vel.set(0, vMag);
          }

          const y = this.sampleDepthAt(p.pos.x, p.pos.y) + 0.06;
          p.mesh.position.set(p.pos.x, y, p.pos.y);

          // Shift trail history
          const arr = p.trailPos;
          for (let k = p.trailLen - 1; k > 0; k--) {
            arr[k * 3] = arr[(k - 1) * 3];
            arr[k * 3 + 1] = arr[(k - 1) * 3 + 1];
            arr[k * 3 + 2] = arr[(k - 1) * 3 + 2];
          }
          arr[0] = p.pos.x;
          arr[1] = y;
          arr[2] = p.pos.y;
          p.trailAttr.needsUpdate = true;
        }
      },

      remove: function () {
        this.el.removeEventListener('click', this.onPlaceNode);
        this.el.removeEventListener('pinchstarted', this.onPlaceNode);
        this.el.sceneEl?.removeEventListener('gravity-reset-wells', this.onResetWells);
        this.el.removeObject3D('mesh');
        this.gridGeo?.dispose();
        this.gridMat?.dispose();
        this.nodeGeo?.dispose();
        this.nodeMat?.dispose();
        this.planetGeo?.dispose();
        this.planets?.forEach((p) => {
          p.mat.dispose();
          p.trailGeo.dispose();
          p.trailMat.dispose();
        });
      }
    });
  }
}
