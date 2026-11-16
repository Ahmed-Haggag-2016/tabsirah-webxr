/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Dual-Direction Multi-Scale Zoom & Reality Detail Engine:
 *  - `zoom-lod-controller`: Smooth mouse-wheel, touch-pinch, HUD slider/buttons,
 *    and XR two-hand spread zoom (-1.0 Macro Aerial <-> 0.0 Eye Level <-> +1.0 Micro Close-Up).
 *  - `biome-zoom-details`: Reveals intricate real-world Micro details when zooming IN
 *    AND sweeping Macro planetary/aerial structures when zooming OUT for all 5 biomes.
 */

import { natureAudio } from './nature-audio.js';

if (typeof window !== 'undefined' && !window.tabsirahZoomState) {
  window.tabsirahZoomState = { zoom: 0, microWeight: 0, macroWeight: 0 };
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function createRadialGlowTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

if (typeof AFRAME !== 'undefined') {
  const _dummy = new THREE.Object3D();
  const _color = new THREE.Color();

  /**
   * 1. Smooth Multi-Input Zoom Controller
   */
  if (!AFRAME.components['zoom-lod-controller']) {
    AFRAME.registerComponent('zoom-lod-controller', {
      init: function () {
        this.targetZoom = 0.0; // -1.0 (Macro Aerial) .. 0.0 (Eye Level) .. +1.0 (Micro Detail)
        this.currentZoom = 0.0;
        this.appliedOffsetX = 0.0;
        this.appliedOffsetY = 0.0;
        this.appliedOffsetZ = 0.0;
        this.lastBroadcastZoom = -99;
        this.pinchStartDist = null;

        // Cinematic Camera Autopilot Targets (desktop only, yields immediately on user drag)
        this.cinematicActive = false;
        this.cinematicPanX = 0.0;
        this.currentPanX = 0.0;
        this.cinematicYaw = 0.0;
        this.cinematicPitch = 0.0;
        this.userLookPauseUntil = 0;

        this.onWheel = (e) => {
          // Ignore wheel events over scrollable UI drawers
          if (e.target && e.target.closest && e.target.closest('.media-drawer, .hud-bottom, .inspector-card')) {
            return;
          }
          e.preventDefault();
          const step = -Math.sign(e.deltaY) * Math.min(0.35, Math.max(0.12, Math.abs(e.deltaY) * 0.0024));
          this.setTargetZoom(this.targetZoom + step);
        };

        this.onTouchStart = (e) => {
          this.userLookPauseUntil = performance.now() + 2500;
          if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this.pinchStartDist = Math.hypot(dx, dy);
          }
        };

        this.onTouchMove = (e) => {
          if (e.touches && e.touches.length === 2 && this.pinchStartDist) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const delta = (dist - this.pinchStartDist) * 0.0095;
            this.pinchStartDist = dist;
            this.setTargetZoom(this.targetZoom + delta);
          }
        };

        this.onTouchEnd = () => {
          this.pinchStartDist = null;
        };

        this.onPointerDownCanvas = () => {
          this.userLookPauseUntil = performance.now() + 3000;
        };

        this.onZoomCommand = (evt) => {
          const d = evt.detail || {};
          if (typeof d.zoom === 'number') this.setTargetZoom(d.zoom);
          else if (typeof d.delta === 'number') this.setTargetZoom(this.targetZoom + d.delta);
        };

        this.onCinematicPose = (evt) => {
          const d = evt.detail || {};
          this.cinematicActive = Boolean(d.active);
          if (typeof d.panX === 'number') this.cinematicPanX = d.panX;
          if (typeof d.yaw === 'number') this.cinematicYaw = d.yaw;
          if (typeof d.pitch === 'number') this.cinematicPitch = d.pitch;
          if (typeof d.zoom === 'number') this.setTargetZoom(d.zoom);
          if (!this.cinematicActive) {
            this.cinematicPanX = 0.0;
          }
        };

        const bindCanvas = () => {
          const canvas = this.el.sceneEl?.canvas;
          if (!canvas) return;
          canvas.addEventListener('wheel', this.onWheel, { passive: false });
          canvas.addEventListener('pointerdown', this.onPointerDownCanvas, { passive: true });
          canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
          canvas.addEventListener('touchmove', this.onTouchMove, { passive: true });
          canvas.addEventListener('touchend', this.onTouchEnd, { passive: true });
        };

        if (this.el.sceneEl?.hasLoaded) bindCanvas();
        else this.el.sceneEl?.addEventListener('loaded', bindCanvas);

        window.addEventListener('biome-zoom-command', this.onZoomCommand);
        window.addEventListener('biome-cinematic-pose', this.onCinematicPose);
      },

      setTargetZoom: function (val) {
        this.targetZoom = Math.max(-1.0, Math.min(1.0, val));
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        const dampRate = this.cinematicActive ? 5.5 : 14.0;
        this.currentZoom = THREE.MathUtils.damp(this.currentZoom, this.targetZoom, dampRate, dt);
        this.currentPanX = THREE.MathUtils.damp(this.currentPanX, this.cinematicActive ? this.cinematicPanX : 0.0, 2.8, dt);

        // Compute smooth dual-direction rig displacement relative to user's current WASD position
        let targetOffsetY = 0;
        let targetOffsetZ = 0;
        if (this.currentZoom >= 0) {
          // Zoom IN: glide close & lower slightly toward surface micro-details
          targetOffsetZ = -this.currentZoom * 2.15;
          targetOffsetY = -this.currentZoom * 0.62;
        } else {
          // Zoom OUT: soar smoothly up & back for dramatic aerial macro vistas
          const out = -this.currentZoom;
          targetOffsetZ = out * 4.6;
          targetOffsetY = out * 2.9;
        }

        const rigObj = this.el.object3D;
        rigObj.position.x += this.currentPanX - this.appliedOffsetX;
        rigObj.position.y += targetOffsetY - this.appliedOffsetY;
        rigObj.position.z += targetOffsetZ - this.appliedOffsetZ;
        this.appliedOffsetX = this.currentPanX;
        this.appliedOffsetY = targetOffsetY;
        this.appliedOffsetZ = targetOffsetZ;

        // Subtle optical lens FOV & smooth cinematic camera rotation on desktop only (never touch WebXR HMD projection)
        const sceneEl = this.el.sceneEl;
        if (sceneEl && !sceneEl.is('vr-mode') && !sceneEl.is('ar-mode')) {
          const cam = sceneEl.camera;
          if (cam) {
            const targetFov =
              this.currentZoom >= 0
                ? 80 - this.currentZoom * 22 // Macro telephoto focus (80 -> 58 deg)
                : 80 + (-this.currentZoom) * 12; // Wide aerial vista (80 -> 92 deg)
            if (Math.abs(cam.fov - targetFov) > 0.05) {
              cam.fov = targetFov;
              cam.updateProjectionMatrix();
            }
          }

          if (this.cinematicActive && performance.now() > this.userLookPauseUntil) {
            const camEl = sceneEl.querySelector('a-camera') || cam?.el;
            const lc = camEl?.components?.['look-controls'];
            if (lc?.yawObject && lc?.pitchObject) {
              lc.yawObject.rotation.y = THREE.MathUtils.damp(lc.yawObject.rotation.y, this.cinematicYaw, 2.2, dt);
              lc.pitchObject.rotation.x = THREE.MathUtils.damp(
                lc.pitchObject.rotation.x,
                Math.max(-1.2, Math.min(1.2, this.cinematicPitch)),
                2.2,
                dt
              );
            }
          }
        }

        const microWeight = smoothstep(0.08, 0.72, this.currentZoom);
        const macroWeight = smoothstep(-0.08, -0.72, this.currentZoom);

        if (Math.abs(this.currentZoom - this.lastBroadcastZoom) > 0.008) {
          this.lastBroadcastZoom = this.currentZoom;
          window.tabsirahZoomState = { zoom: this.currentZoom, microWeight, macroWeight };
          natureAudio.setZoomDepth(this.currentZoom);
          window.dispatchEvent(
            new CustomEvent('biome-zoom-changed', {
              detail: { zoom: this.currentZoom, microWeight, macroWeight }
            })
          );
        }
      },

      remove: function () {
        const canvas = this.el.sceneEl?.canvas;
        if (canvas) {
          canvas.removeEventListener('wheel', this.onWheel);
          canvas.removeEventListener('pointerdown', this.onPointerDownCanvas);
          canvas.removeEventListener('touchstart', this.onTouchStart);
          canvas.removeEventListener('touchmove', this.onTouchMove);
          canvas.removeEventListener('touchend', this.onTouchEnd);
        }
        window.removeEventListener('biome-zoom-command', this.onZoomCommand);
        window.removeEventListener('biome-cinematic-pose', this.onCinematicPose);
      }
    });
  }

  /**
   * 2. Biome-Specific Micro (Zoom-In) & Macro (Zoom-Out) Reality Detail Layers
   */
  if (!AFRAME.components['biome-zoom-details']) {
    AFRAME.registerComponent('biome-zoom-details', {
      schema: {
        biome: { type: 'string', default: 'aurora' }
      },

      init: function () {
        this.root = new THREE.Group();
        this.microGroup = new THREE.Group();
        this.macroGroup = new THREE.Group();
        this.disposables = [];
        this.animatedItems = [];
        this.microMaterials = [];
        this.macroMaterials = [];

        this.root.add(this.microGroup, this.macroGroup);
        this.microLensHinted = false;
        this.buildForBiome(this.data.biome);
        this.el.setObject3D('mesh', this.root);

        const initZoom = window.tabsirahZoomState || { microWeight: 0, macroWeight: 0 };
        this.applyWeights(initZoom.microWeight, initZoom.macroWeight);

        this.onZoom = (evt) => {
          const { microWeight, macroWeight } = evt.detail || {};
          this.applyWeights(microWeight || 0, macroWeight || 0);
        };
        window.addEventListener('biome-zoom-changed', this.onZoom);
      },

      regMat: function (mat, groupType, baseOpacity = 1.0) {
        mat.transparent = true;
        mat.userData.baseOpacity = baseOpacity;
        if (groupType === 'micro') this.microMaterials.push(mat);
        else this.macroMaterials.push(mat);
        this.disposables.push(mat);
        return mat;
      },

      applyWeights: function (microW, macroW) {
        this.microGroup.visible = microW > 0.01;
        this.macroGroup.visible = macroW > 0.01;
        this.microMaterials.forEach((m) => {
          m.opacity = (m.userData.baseOpacity ?? 1.0) * microW;
        });
        this.macroMaterials.forEach((m) => {
          m.opacity = (m.userData.baseOpacity ?? 1.0) * macroW;
        });

        const showMicroLens = microW > 0.16;
        const lensScale = 0.12 + 0.36 * microW;

        if (this.data.biome === 'rainforest') {
          const prismEl = document.getElementById('rainforest-prism-lens');
          if (prismEl) {
            prismEl.setAttribute('visible', showMicroLens);
            prismEl.object3D?.scale.setScalar(lensScale);
            if (showMicroLens && !this.microLensHinted) {
              this.microLensHinted = true;
              window.dispatchEvent(
                new CustomEvent('tabsirah-wonder-progress', {
                  detail: {
                    biomeId: 'rainforest',
                    message: 'Micro Lens Active: Drag or click the Raindrop Prism to refract a 7-band rainbow.'
                  }
                })
              );
            }
          }
        } else if (this.data.biome === 'ocean') {
          const turingEl = document.getElementById('ocean-turing-lens');
          const voronoiEl = document.getElementById('ocean-voronoi-lens');
          if (turingEl) {
            turingEl.setAttribute('visible', showMicroLens);
            turingEl.object3D?.scale.setScalar(lensScale);
          }
          if (voronoiEl) {
            voronoiEl.setAttribute('visible', showMicroLens);
            voronoiEl.object3D?.scale.setScalar(lensScale);
          }
          if (showMicroLens && (turingEl || voronoiEl) && !this.microLensHinted) {
            this.microLensHinted = true;
            window.dispatchEvent(
              new CustomEvent('tabsirah-wonder-progress', {
                detail: {
                  biomeId: 'ocean',
                  message: 'Micro Lens Active: Touch either Morphogenesis Sphere to inject live Turing & Voronoi ripples.'
                }
              })
            );
          }
        }
      },

      buildForBiome: function (biome) {
        if (biome === 'aurora') {
          this.buildAuroraZoomLayers();
        } else if (biome === 'rainforest') {
          this.buildRainforestZoomLayers();
        } else if (biome === 'ocean') {
          this.buildOceanZoomLayers();
        } else if (biome === 'desert') {
          this.buildDesertZoomLayers();
        }
      },

      // BIOME 1: AURORA
      buildAuroraZoomLayers: function () {
        // MICRO (Zoom-In): Intricate 6-pointed dendritic ice crystals & trapped glacial air bubbles
        const branchGeo = new THREE.CylinderGeometry(0.004, 0.008, 0.24, 5);
        const frostMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#E0F2FE',
            emissive: '#38BDF8',
            emissiveIntensity: 0.72,
            roughness: 0.12,
            metalness: 0.45
          }),
          'micro',
          0.95
        );
        this.disposables.push(branchGeo);

        const crystalCount = 26;
        const crystalMesh = new THREE.InstancedMesh(branchGeo, frostMat, crystalCount * 3);
        let idx = 0;
        for (let i = 0; i < crystalCount; i++) {
          const cx = (Math.random() - 0.5) * 4.2;
          const cz = -1.6 - Math.random() * 2.8;
          const cy = 0.08 + Math.random() * 0.14;
          const sc = 0.55 + Math.random() * 0.75;
          for (let arm = 0; arm < 3; arm++) {
            _dummy.position.set(cx, cy, cz);
            _dummy.rotation.set(Math.PI * 0.42, (arm * Math.PI) / 3, i * 0.4);
            _dummy.scale.setScalar(sc);
            _dummy.updateMatrix();
            crystalMesh.setMatrixAt(idx++, _dummy.matrix);
          }
        }
        crystalMesh.instanceMatrix.needsUpdate = true;
        this.microGroup.add(crystalMesh);

        // Glacial trapped ice bubbles right below surface
        const bubbleGeo = new THREE.SphereGeometry(0.032, 10, 10);
        const bubbleMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#BAE6FD',
            emissive: '#0EA5E9',
            emissiveIntensity: 0.65,
            roughness: 0.1
          }),
          'micro',
          0.82
        );
        const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, 45);
        for (let b = 0; b < 45; b++) {
          _dummy.position.set((Math.random() - 0.5) * 3.2, 0.03 + (b % 3) * 0.015, -2.0 - Math.random() * 2.6);
          _dummy.scale.setScalar(0.5 + (b % 4) * 0.35);
          _dummy.updateMatrix();
          bubbles.setMatrixAt(b, _dummy.matrix);
        }
        bubbles.instanceMatrix.needsUpdate = true;
        this.microGroup.add(bubbles);
        this.disposables.push(bubbleGeo);

        // Bioluminescent Arctic ice-edge micro-algae patches along the fjord frost shelf
        const algaeGeo = new THREE.CircleGeometry(0.055, 8);
        algaeGeo.rotateX(-Math.PI / 2);
        const algaeMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#6EE7B7',
            emissive: '#10B981',
            emissiveIntensity: 0.72,
            roughness: 0.5
          }),
          'micro',
          0.86
        );
        const algae = new THREE.InstancedMesh(algaeGeo, algaeMat, 28);
        for (let a = 0; a < 28; a++) {
          _dummy.position.set((Math.random() - 0.5) * 3.4, 0.025, -1.9 - Math.random() * 2.2);
          _dummy.rotation.set(0, a * 0.7, 0);
          _dummy.scale.set(0.6 + (a % 3) * 0.4, 1, 0.5 + (a % 4) * 0.35);
          _dummy.updateMatrix();
          algae.setMatrixAt(a, _dummy.matrix);
        }
        algae.instanceMatrix.needsUpdate = true;
        this.microGroup.add(algae);
        this.disposables.push(algaeGeo);

        // MACRO (Zoom-Out): Seamless 360-degree Smooth Snow-Frosted Arctic Glacial Ridges
        const ridgeGeo = new THREE.ConeGeometry(7.5, 6.2, 24);
        const ridgeMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#475569',
            emissive: '#0EA5E9',
            emissiveIntensity: 0.24,
            roughness: 0.55,
            flatShading: false
          }),
          'macro',
          0.92
        );
        for (let r = 0; r < 8; r++) {
          const ang = (r / 8) * Math.PI * 2 + 0.2;
          const dist = 24.0 + (r % 2) * 3.5;
          const rm = new THREE.Mesh(ridgeGeo, ridgeMat);
          const sc = 1.2 + (r % 3) * 0.25;
          rm.position.set(Math.cos(ang) * dist, 2.8 * sc, Math.sin(ang) * dist);
          rm.scale.set(sc * 1.45, sc, sc * 1.3);
          this.macroGroup.add(rm);
        }
        this.disposables.push(ridgeGeo);

        // 2 Realistic Circling Snowy Owls gliding silently over the arctic peaks
        const owlBodyGeo = new THREE.SphereGeometry(0.095, 10, 8);
        owlBodyGeo.scale(1.0, 0.88, 1.85);
        const owlHeadGeo = new THREE.SphereGeometry(0.068, 8, 8);
        owlHeadGeo.translate(0, 0.03, 0.16);
        const owlWingGeo = new THREE.SphereGeometry(0.24, 8, 6);
        owlWingGeo.scale(1.3, 0.05, 0.42);
        const owlMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#FFFFFF',
            emissive: '#BAE6FD',
            emissiveIntensity: 0.28,
            roughness: 0.62
          }),
          'macro',
          0.95
        );
        const snowyOwls = [];
        for (let o = 0; o < 2; o++) {
          const owl = new THREE.Group();
          owl.add(new THREE.Mesh(owlBodyGeo, owlMat), new THREE.Mesh(owlHeadGeo, owlMat), new THREE.Mesh(owlWingGeo, owlMat));
          this.macroGroup.add(owl);
          snowyOwls.push({ owl, phase: o * Math.PI, y: 4.5 + o * 0.65, r: 4.4 + o * 0.9 });
        }
        this.animatedItems.push((elapsed) => {
          snowyOwls.forEach((item) => {
            const a = elapsed * 0.28 + item.phase;
            item.owl.position.set(Math.cos(a) * item.r, item.y + Math.sin(a * 2) * 0.15, -5.0 + Math.sin(a) * item.r * 0.6);
            item.owl.rotation.y = Math.atan2(-Math.sin(a) * item.r, Math.cos(a) * item.r * 0.6);
          });
        });
        this.disposables.push(owlBodyGeo, owlHeadGeo, owlWingGeo);
      },

      // BIOME 2: RAINFOREST
      buildRainforestZoomLayers: function () {
        // MICRO (Zoom-In): Bioluminescent forest-floor mycelium mushrooms & glistening morning dew beads
        const capGeo = new THREE.SphereGeometry(0.065, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
        const stemGeo = new THREE.CylinderGeometry(0.012, 0.018, 0.14, 6);
        stemGeo.translate(0, 0.07, 0);
        const mushMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#6EE7B7',
            emissive: '#10B981',
            emissiveIntensity: 0.95,
            roughness: 0.3
          }),
          'micro',
          0.95
        );
        const stemMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#D1FAE5', roughness: 0.7 }),
          'micro',
          0.95
        );
        const mCount = 32;
        const caps = new THREE.InstancedMesh(capGeo, mushMat, mCount);
        const stems = new THREE.InstancedMesh(stemGeo, stemMat, mCount);
        for (let i = 0; i < mCount; i++) {
          const x = (Math.random() - 0.5) * 3.8;
          const z = -1.6 - Math.random() * 2.6;
          const sc = 0.65 + Math.random() * 0.95;
          _dummy.position.set(x, 0.0, z);
          _dummy.rotation.set(0, i * 0.8, (Math.random() - 0.5) * 0.15);
          _dummy.scale.setScalar(sc);
          _dummy.updateMatrix();
          stems.setMatrixAt(i, _dummy.matrix);
          _dummy.position.set(x, 0.13 * sc, z);
          _dummy.updateMatrix();
          caps.setMatrixAt(i, _dummy.matrix);
        }
        caps.instanceMatrix.needsUpdate = true;
        stems.instanceMatrix.needsUpdate = true;
        this.microGroup.add(stems, caps);
        this.disposables.push(capGeo, stemGeo);

        // Glistening micro-dew beads along forest floor & fern heights
        const dewGeo = new THREE.SphereGeometry(0.018, 8, 8);
        const dewMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#E0F2FE',
            emissive: '#38BDF8',
            emissiveIntensity: 0.55,
            roughness: 0.05,
            metalness: 0.6
          }),
          'micro',
          0.92
        );
        const dewMesh = new THREE.InstancedMesh(dewGeo, dewMat, 55);
        for (let d = 0; d < 55; d++) {
          _dummy.position.set((Math.random() - 0.5) * 3.6, 0.12 + Math.random() * 0.45, -1.6 - Math.random() * 2.5);
          _dummy.scale.setScalar(0.6 + (d % 4) * 0.35);
          _dummy.updateMatrix();
          dewMesh.setMatrixAt(d, _dummy.matrix);
        }
        dewMesh.instanceMatrix.needsUpdate = true;
        this.microGroup.add(dewMesh);
        this.disposables.push(dewGeo);

        // 2 Realistic Iridescent Hovering Hummingbirds darting near blossoms & dew drops
        const hbBodyGeo = new THREE.SphereGeometry(0.022, 8, 8);
        hbBodyGeo.scale(0.9, 0.85, 1.85);
        const hbBeakGeo = new THREE.ConeGeometry(0.004, 0.045, 5);
        hbBeakGeo.rotateX(Math.PI / 2);
        hbBeakGeo.translate(0, 0.006, 0.055);
        const hbWingGeo = new THREE.SphereGeometry(0.032, 6, 4);
        hbWingGeo.scale(1.35, 0.08, 0.42);
        hbWingGeo.translate(0.036, 0, 0);
        const hbMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#2DD4BF',
            emissive: '#0F766E',
            emissiveIntensity: 0.65,
            metalness: 0.45,
            roughness: 0.25
          }),
          'micro',
          0.98
        );
        const hummingbirds = [];
        for (let h = 0; h < 2; h++) {
          const hb = new THREE.Group();
          const body = new THREE.Mesh(hbBodyGeo, hbMat);
          const beak = new THREE.Mesh(hbBeakGeo, hbMat);
          const rw = new THREE.Mesh(hbWingGeo, hbMat);
          const lw = new THREE.Mesh(hbWingGeo, hbMat);
          lw.scale.x = -1;
          hb.add(body, beak, rw, lw);
          this.microGroup.add(hb);
          hummingbirds.push({ hb, rw, lw, cx: h === 0 ? -0.65 : 0.75, cz: -2.2 - h * 0.55, phase: h * 2.1 });
        }
        this.animatedItems.push((elapsed) => {
          hummingbirds.forEach((item) => {
            const a = elapsed * 1.45 + item.phase;
            item.hb.position.set(item.cx + Math.cos(a) * 0.35, 0.52 + Math.sin(a * 2.5) * 0.14, item.cz + Math.sin(a) * 0.28);
            item.hb.rotation.y = -a;
            const blur = Math.sin(elapsed * 32.0 + item.phase) * 0.65;
            item.rw.rotation.z = blur;
            item.lw.rotation.z = -blur;
          });
        });
        this.disposables.push(hbBodyGeo, hbBeakGeo, hbWingGeo);

        // MACRO (Zoom-Out): 360-degree Sunlit Emergent Canopy Crowns + High-Altitude Crisp Cumulus Clouds
        const crownGeo = new THREE.SphereGeometry(1.45, 14, 10);
        const crownMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#10B981',
            emissive: '#065F46',
            emissiveIntensity: 0.35,
            roughness: 0.72
          }),
          'macro',
          0.95
        );
        const crowns = new THREE.InstancedMesh(crownGeo, crownMat, 24);
        for (let c = 0; c < 24; c++) {
          const ang = (c / 24) * Math.PI * 2;
          const r = 10.5 + (c % 3) * 3.8;
          _dummy.position.set(Math.cos(ang) * r, 3.2 + (c % 3) * 0.85, Math.sin(ang) * r);
          _dummy.rotation.set(0, c * 0.9, 0);
          _dummy.scale.set(1.55, 0.68, 1.55);
          _dummy.updateMatrix();
          crowns.setMatrixAt(c, _dummy.matrix);
        }
        crowns.instanceMatrix.needsUpdate = true;
        this.macroGroup.add(crowns);
        this.disposables.push(crownGeo);

        // Winding Emerald Oxbow River snaking across the sunlit rainforest basin horizon
        const oxbowCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-12.5, 0.12, -10.5),
          new THREE.Vector3(-3.5, 0.12, -12.8),
          new THREE.Vector3(3.8, 0.12, -10.2),
          new THREE.Vector3(12.5, 0.12, -13.5)
        ]);
        const oxbowGeo = new THREE.TubeGeometry(oxbowCurve, 32, 0.55, 6, false);
        oxbowGeo.scale(1, 0.12, 1);
        const oxbowMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#0EA5E9',
            emissive: '#0284C7',
            emissiveIntensity: 0.42,
            roughness: 0.18
          }),
          'macro',
          0.85
        );
        this.macroGroup.add(new THREE.Mesh(oxbowGeo, oxbowMat));
        this.disposables.push(oxbowGeo);

        // High-Altitude Crisp White Sunlight Cumulus Clouds (high overhead in sky, never blurry near camera)
        const mistGeo = new THREE.SphereGeometry(1.55, 14, 10);
        const mistMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#FFFFFF',
            emissive: '#E0F2FE',
            emissiveIntensity: 0.18,
            roughness: 0.92
          }),
          'macro',
          0.92
        );
        for (let cl = 0; cl < 6; cl++) {
          const ang = (cl / 6) * Math.PI * 2 + 0.3;
          const rad = 20.0 + (cl % 2) * 5.0;
          const cluster = new THREE.Group();
          [[-1.1, 0, 0, 0.85], [0, 0.4, 0.2, 1.1], [1.1, 0.05, -0.1, 0.82]].forEach(([mx, my, mz, ms]) => {
            const puff = new THREE.Mesh(mistGeo, mistMat);
            puff.position.set(mx, my, mz);
            puff.scale.set(ms * 1.45, ms * 0.5, ms);
            cluster.add(puff);
          });
          cluster.position.set(Math.cos(ang) * rad, 10.5 + (cl % 2) * 1.5, Math.sin(ang) * rad);
          cluster.rotation.y = -ang;
          this.macroGroup.add(cluster);
        }
        this.disposables.push(mistGeo);
      },

      // BIOME 3: OCEAN
      buildOceanZoomLayers: function () {
        // MICRO (Zoom-In): Bioluminescent coral polyps & pearl oysters on seabed
        const polypGeo = new THREE.ConeGeometry(0.018, 0.11, 5);
        polypGeo.translate(0, 0.055, 0);
        const polypMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#67E8F9',
            emissive: '#22D3EE',
            emissiveIntensity: 1.05,
            roughness: 0.35
          }),
          'micro',
          0.95
        );
        const polypCount = 60;
        const polyps = new THREE.InstancedMesh(polypGeo, polypMat, polypCount);
        for (let i = 0; i < polypCount; i++) {
          const x = (Math.random() - 0.5) * 3.4;
          const z = -2.2 - Math.random() * 2.2;
          _dummy.position.set(x, 0.38 + (i % 3) * 0.12, z);
          _dummy.rotation.set((Math.random() - 0.5) * 0.5, i * 0.5, (Math.random() - 0.5) * 0.5);
          _dummy.scale.setScalar(0.8 + Math.random() * 0.7);
          _dummy.updateMatrix();
          polyps.setMatrixAt(i, _dummy.matrix);
        }
        polyps.instanceMatrix.needsUpdate = true;
        this.microGroup.add(polyps);
        this.disposables.push(polypGeo);

        // Glowing Pearl Shell in foreground sand
        const shellGeo = new THREE.CircleGeometry(0.18, 12, 0, Math.PI);
        const shellMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#FDA4AF', roughness: 0.4, side: THREE.DoubleSide }),
          'micro',
          0.95
        );
        const pearlGeo = new THREE.SphereGeometry(0.042, 16, 16);
        const pearlMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#FFFBEB',
            emissive: '#FDE68A',
            emissiveIntensity: 0.65,
            roughness: 0.08,
            metalness: 0.3
          }),
          'micro',
          1.0
        );
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.position.set(-0.45, 0.08, -2.35);
        shell.rotation.x = -0.5;
        const pearl = new THREE.Mesh(pearlGeo, pearlMat);
        pearl.position.set(-0.45, 0.12, -2.34);
        this.microGroup.add(shell, pearl);
        this.disposables.push(shellGeo, pearlGeo);

        // Coral-Red Sea Stars on seabed sand & Golden Seahorses swaying by reef
        const starArmGeo = new THREE.ConeGeometry(0.022, 0.095, 4);
        starArmGeo.translate(0, 0.047, 0);
        starArmGeo.rotateX(Math.PI / 2);
        const starMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#FB7185', emissive: '#E11D48', emissiveIntensity: 0.38, roughness: 0.5 }),
          'micro',
          0.95
        );
        [
          { x: 0.62, z: -2.25, sc: 1.0 },
          { x: -1.05, z: -2.65, sc: 0.82 }
        ].forEach((ss) => {
          const starfish = new THREE.Group();
          for (let arm = 0; arm < 5; arm++) {
            const m = new THREE.Mesh(starArmGeo, starMat);
            m.rotation.y = (arm / 5) * Math.PI * 2;
            starfish.add(m);
          }
          starfish.position.set(ss.x, 0.03, ss.z);
          starfish.scale.setScalar(ss.sc);
          this.microGroup.add(starfish);
        });
        const shGeo = new THREE.TorusGeometry(0.035, 0.012, 6, 10, Math.PI * 1.4);
        const shMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#FBBF24', emissive: '#D97706', emissiveIntensity: 0.45 }),
          'micro',
          0.96
        );
        const seahorses = [];
        [-0.75, 0.92].forEach((sx, idx) => {
          const sh = new THREE.Mesh(shGeo, shMat);
          sh.position.set(sx, 0.55 + idx * 0.12, -2.55);
          this.microGroup.add(sh);
          seahorses.push({ sh, baseY: sh.position.y, phase: idx * 1.7 });
        });
        this.disposables.push(starArmGeo, shGeo);

        // MACRO (Zoom-Out): Full 360-degree Continental Reef Drop-Off Ridge + Pelagic Tuna & Dolphins
        const dropGeo = new THREE.CylinderGeometry(16.0, 20.0, 3.4, 48, 1, true);
        const dropMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#0E7490',
            emissive: '#083344',
            emissiveIntensity: 0.28,
            roughness: 0.75,
            side: THREE.DoubleSide
          }),
          'macro',
          0.88
        );
        const dropShelf = new THREE.Mesh(dropGeo, dropMat);
        dropShelf.position.set(0, -1.4, 0);
        this.macroGroup.add(dropShelf);
        this.disposables.push(dropGeo);

        const tunaBodyGeo = new THREE.SphereGeometry(0.085, 8, 8);
        tunaBodyGeo.scale(0.85, 1.15, 2.8);
        const tunaTailGeo = new THREE.ConeGeometry(0.065, 0.14, 4);
        tunaTailGeo.scale(0.2, 1.3, 1.0);
        tunaTailGeo.rotateX(Math.PI / 2);
        tunaTailGeo.translate(0, 0, -0.25);
        const tunaMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#CBD5E1', emissive: '#0EA5E9', emissiveIntensity: 0.35, metalness: 0.55 }),
          'macro',
          0.95
        );
        this.tunaRing = new THREE.Group();
        this.tunaRing.position.set(0, 3.1, 0);
        for (let t = 0; t < 24; t++) {
          const ang = (t / 24) * Math.PI * 2;
          const fish = new THREE.Group();
          fish.add(new THREE.Mesh(tunaBodyGeo, tunaMat), new THREE.Mesh(tunaTailGeo, tunaMat));
          fish.position.set(Math.cos(ang) * 7.8, (t % 3) * 0.28, Math.sin(ang) * 7.8);
          fish.rotation.y = -ang;
          this.tunaRing.add(fish);
        }
        this.macroGroup.add(this.tunaRing);

        // Pod of 5 Realistic Sculpted Pelagic Dolphins cruising 360 degrees around the reef
        const dolBodyGeo = new THREE.SphereGeometry(0.13, 12, 10);
        dolBodyGeo.scale(0.85, 1.0, 3.4);
        const dolFinGeo = new THREE.ConeGeometry(0.055, 0.16, 4);
        dolFinGeo.scale(0.25, 1.0, 1.1);
        dolFinGeo.rotateX(-0.35);
        dolFinGeo.translate(0, 0.14, 0.02);
        const dolTailGeo = new THREE.ConeGeometry(0.11, 0.18, 4);
        dolTailGeo.scale(1.4, 0.2, 1.0);
        dolTailGeo.rotateX(Math.PI / 2);
        dolTailGeo.translate(0, 0, -0.45);
        const dolMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#94A3B8', emissive: '#0EA5E9', emissiveIntensity: 0.22, roughness: 0.25 }),
          'macro',
          0.95
        );
        const dolphins = [];
        for (let d = 0; d < 5; d++) {
          const dm = new THREE.Group();
          dm.add(new THREE.Mesh(dolBodyGeo, dolMat), new THREE.Mesh(dolFinGeo, dolMat), new THREE.Mesh(dolTailGeo, dolMat));
          this.macroGroup.add(dm);
          dolphins.push({ dm, phase: (d / 5) * Math.PI * 2 });
        }

        this.animatedItems.push((elapsed) => {
          this.tunaRing.rotation.y = elapsed * 0.16;
          seahorses.forEach((s) => {
            s.sh.position.y = s.baseY + Math.sin(elapsed * 2.0 + s.phase) * 0.04;
          });
          dolphins.forEach((d) => {
            const a = elapsed * 0.22 - d.phase;
            d.dm.position.set(Math.cos(a) * 9.5, 3.4 + Math.sin(a * 3) * 0.45, Math.sin(a) * 9.5);
            d.dm.rotation.y = Math.atan2(-Math.sin(a) * 9.5, Math.cos(a) * 9.5);
          });
        });
        this.disposables.push(tunaBodyGeo, tunaTailGeo, dolBodyGeo, dolFinGeo, dolTailGeo);
      },

      // BIOME 4: DESERT
      buildDesertZoomLayers: function () {
        // MICRO (Zoom-In): Rounded sunlit silica sand grains + hardy desert succulents beside oasis
        const grainGeo = new THREE.IcosahedronGeometry(0.014, 1);
        const grainMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#FEF3C7',
            emissive: '#F59E0B',
            emissiveIntensity: 0.55,
            roughness: 0.12,
            metalness: 0.7
          }),
          'micro',
          0.95
        );
        const grains = new THREE.InstancedMesh(grainGeo, grainMat, 90);
        for (let i = 0; i < 90; i++) {
          _dummy.position.set((Math.random() - 0.5) * 3.4, 0.04 + Math.random() * 0.08, -1.5 - Math.random() * 2.5);
          _dummy.rotation.set(i * 0.5, i * 0.9, 0);
          _dummy.scale.setScalar(0.5 + (i % 4) * 0.35);
          _dummy.updateMatrix();
          grains.setMatrixAt(i, _dummy.matrix);
        }
        grains.instanceMatrix.needsUpdate = true;
        this.microGroup.add(grains);
        this.disposables.push(grainGeo);

        // Oasis Reeds along water edge
        const reedGeo = new THREE.CylinderGeometry(0.008, 0.014, 0.55, 5);
        reedGeo.translate(0, 0.27, 0);
        const reedMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#4D7C0F', roughness: 0.6 }),
          'micro',
          0.95
        );
        const reeds = new THREE.InstancedMesh(reedGeo, reedMat, 28);
        for (let r = 0; r < 28; r++) {
          const ang = (r / 28) * Math.PI * 1.4 - 0.7;
          _dummy.position.set(Math.sin(ang) * 1.35, 0.0, -3.2 + Math.cos(ang) * 1.15);
          _dummy.rotation.set((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.2);
          _dummy.scale.setScalar(0.8 + (r % 3) * 0.25);
          _dummy.updateMatrix();
          reeds.setMatrixAt(r, _dummy.matrix);
        }
        reeds.instanceMatrix.needsUpdate = true;
        this.microGroup.add(reeds);
        this.disposables.push(reedGeo);

        // Blooming 5-Petal Desert Acacia Blossoms & Iridescent Scarab Beetles beside oasis water
        const flowerGeo = new THREE.CylinderGeometry(0.008, 0.04, 0.018, 5);
        const flowerMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#FDE047', emissive: '#F59E0B', emissiveIntensity: 0.55 }),
          'micro',
          0.95
        );
        const acacia = new THREE.InstancedMesh(flowerGeo, flowerMat, 18);
        for (let f = 0; f < 18; f++) {
          _dummy.position.set(-1.1 + (f % 6) * 0.42, 0.18 + (f % 3) * 0.08, -2.0 - Math.floor(f / 6) * 0.35);
          _dummy.scale.setScalar(0.6 + (f % 3) * 0.35);
          _dummy.updateMatrix();
          acacia.setMatrixAt(f, _dummy.matrix);
        }
        acacia.instanceMatrix.needsUpdate = true;
        const scarabGeo = new THREE.SphereGeometry(0.025, 8, 6);
        scarabGeo.scale(1.3, 0.65, 0.9);
        const scarabMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#10B981', emissive: '#047857', emissiveIntensity: 0.55, metalness: 0.75, roughness: 0.2 }),
          'micro',
          0.96
        );
        [-0.35, 0.48].forEach((bx, idx) => {
          const bug = new THREE.Mesh(scarabGeo, scarabMat);
          bug.position.set(bx, 0.04, -2.15 - idx * 0.3);
          this.microGroup.add(bug);
        });
        this.microGroup.add(acacia);
        this.disposables.push(flowerGeo, scarabGeo);

        // MACRO (Zoom-Out): Sculpted Sunlit Saharan Camel Caravan + Milky Way Dust Band
        const caravanMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#B45309', roughness: 0.85 }),
          'macro',
          0.92
        );
        const bodyGeo = new THREE.SphereGeometry(0.14, 10, 8);
        bodyGeo.scale(1.4, 0.85, 0.7);
        const humpGeo = new THREE.SphereGeometry(0.1, 8, 6);
        const neckGeo = new THREE.CylinderGeometry(0.028, 0.042, 0.24, 6);
        const headGeo = new THREE.SphereGeometry(0.045, 8, 6);
        headGeo.scale(1.4, 0.85, 0.75);
        this.caravanGroup = new THREE.Group();
        for (let c = 0; c < 6; c++) {
          const camel = new THREE.Group();
          const b = new THREE.Mesh(bodyGeo, caravanMat);
          const h = new THREE.Mesh(humpGeo, caravanMat);
          h.position.set(0, 0.11, 0);
          const n = new THREE.Mesh(neckGeo, caravanMat);
          n.position.set(0.16, 0.14, 0);
          n.rotation.z = -0.35;
          const hd = new THREE.Mesh(headGeo, caravanMat);
          hd.position.set(0.04, 0.12, 0);
          n.add(hd);
          camel.add(b, h, n);
          camel.position.set(-1.5 + c * 0.55, 0.95 + Math.sin(c * 0.5) * 0.08, -7.8);
          this.caravanGroup.add(camel);
        }
        this.macroGroup.add(this.caravanGroup);
        this.animatedItems.push((elapsed) => {
          this.caravanGroup.position.x = Math.sin(elapsed * 0.08) * 1.8;
        });
        this.disposables.push(bodyGeo, humpGeo, neckGeo, headGeo);

        // Ecliptic Milky Way Dust Arch overhead
        const mwCount = 220;
        const mwPos = new Float32Array(mwCount * 3);
        for (let i = 0; i < mwCount; i++) {
          const t = (i / mwCount) * Math.PI;
          mwPos[i * 3] = Math.cos(t) * 14 + (Math.random() - 0.5) * 1.4;
          mwPos[i * 3 + 1] = Math.sin(t) * 10 + 1.5 + (Math.random() - 0.5) * 1.2;
          mwPos[i * 3 + 2] = -9.5 + (Math.random() - 0.5) * 2.5;
        }
        const mwGeo = new THREE.BufferGeometry();
        mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
        const mwTex = createRadialGlowTexture();
        const mwMat = this.regMat(
          new THREE.PointsMaterial({
            size: 0.45,
            map: mwTex,
            color: '#FDE68A',
            depthWrite: false,
            blending: THREE.AdditiveBlending
          }),
          'macro',
          0.35
        );
        this.macroGroup.add(new THREE.Points(mwGeo, mwMat));
        this.disposables.push(mwGeo, mwTex);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.animatedItems.length) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const t = (time * 0.001) * scale;
        this.animatedItems.forEach((fn) => fn(t));
      },

      remove: function () {
        window.removeEventListener('biome-zoom-changed', this.onZoom);
        this.el.removeObject3D('mesh');
        this.disposables?.forEach((d) => d?.dispose());
      }
    });
  }
}
