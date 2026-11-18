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

        // Cinematic Camera Autopilot Targets (smooth 3D spline navigation across objects)
        this.cinematicActive = false;
        this.cinematicPosX = 0.0;
        this.cinematicPosY = 0.0;
        this.cinematicPosZ = 0.0;
        this.cinematicPanX = 0.0;
        this.currentPanX = 0.0;
        this.cinematicYaw = 0.0;
        this.cinematicPitch = 0.0;
        this.cinematicFov = null;
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
          this.userLookPauseUntil = performance.now() + 3500;
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
          this.userLookPauseUntil = performance.now() + 3500;
        };

        this.onZoomCommand = (evt) => {
          const d = evt.detail || {};
          if (typeof d.zoom === 'number') this.setTargetZoom(d.zoom);
          else if (typeof d.delta === 'number') this.setTargetZoom(this.targetZoom + d.delta);
        };

        this.onCinematicPose = (evt) => {
          const d = evt.detail || {};
          this.cinematicActive = Boolean(d.active);
          if (typeof d.posX === 'number') this.cinematicPosX = d.posX;
          if (typeof d.posY === 'number') this.cinematicPosY = d.posY;
          if (typeof d.posZ === 'number') this.cinematicPosZ = d.posZ;
          if (typeof d.panX === 'number') this.cinematicPanX = d.panX;
          if (typeof d.yaw === 'number') this.cinematicYaw = d.yaw;
          if (typeof d.pitch === 'number') this.cinematicPitch = d.pitch;
          if (typeof d.fov === 'number') this.cinematicFov = d.fov;
          if (typeof d.zoom === 'number') this.setTargetZoom(d.zoom);
          if (!this.cinematicActive) {
            this.cinematicPanX = 0.0;
            this.cinematicFov = null;
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
        this.targetZoom = Math.max(-1.0, Math.min(0.0, val));
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        const dampRate = this.cinematicActive ? 5.5 : 14.0;
        this.currentZoom = THREE.MathUtils.damp(this.currentZoom, this.targetZoom, dampRate, dt);
        this.currentPanX = THREE.MathUtils.damp(this.currentPanX, this.cinematicActive ? this.cinematicPanX : 0.0, 2.8, dt);

        const rigObj = this.el.object3D;
        if (this.cinematicActive) {
          // Broadcast-grade smooth cubic damping along the 3D flight trajectory
          rigObj.position.x = THREE.MathUtils.damp(rigObj.position.x, this.cinematicPosX, 3.2, dt);
          // Safe ground clearance: rig.y >= 0.22m ensures camera eye level (rig.y + 1.6m) >= 1.82m above surface
          const safeY = Math.max(0.22, this.cinematicPosY);
          rigObj.position.y = THREE.MathUtils.damp(rigObj.position.y, safeY, 3.2, dt);
          rigObj.position.z = THREE.MathUtils.damp(rigObj.position.z, this.cinematicPosZ, 3.2, dt);
          this.appliedOffsetX = 0;
          this.appliedOffsetY = 0;
          this.appliedOffsetZ = 0;
        } else {
          // Compute smooth elevated panorama displacement relative to user's current WASD position
          let targetOffsetY = 0;
          let targetOffsetZ = 0;
          if (this.currentZoom < 0) {
            const out = -this.currentZoom;
            targetOffsetZ = out * 8.2;
            targetOffsetY = out * 4.6;
          }
          rigObj.position.x += this.currentPanX - this.appliedOffsetX;
          rigObj.position.y = Math.max(0.0, rigObj.position.y + targetOffsetY - this.appliedOffsetY);
          rigObj.position.z += targetOffsetZ - this.appliedOffsetZ;
          this.appliedOffsetX = this.currentPanX;
          this.appliedOffsetY = targetOffsetY;
          this.appliedOffsetZ = targetOffsetZ;
        }

        // Optical lens FOV & smooth cinematic camera tracking (desktop only, never touch WebXR HMD projection)
        const sceneEl = this.el.sceneEl;
        if (sceneEl && !sceneEl.is('vr-mode') && !sceneEl.is('ar-mode')) {
          const cam = sceneEl.camera;
          if (cam) {
            const isWideView = typeof document !== 'undefined' && document.body.classList.contains('is-wide-view');
            const baseFov = isWideView ? 96 : 88;
            const targetFov = this.cinematicActive && typeof this.cinematicFov === 'number'
              ? this.cinematicFov
              : baseFov + Math.max(0, -this.currentZoom) * 12;
            if (Math.abs(cam.fov - targetFov) > 0.05) {
              cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 2.5, dt);
              cam.updateProjectionMatrix();
            }
          }

          if (this.cinematicActive && performance.now() > this.userLookPauseUntil) {
            const camEl = sceneEl.querySelector('a-camera') || cam?.el;
            const lc = camEl?.components?.['look-controls'];
            if (lc?.yawObject && lc?.pitchObject) {
              // Shortest-arc angular interpolation prevents 360-degree spins
              const diffYaw = Math.atan2(
                Math.sin(this.cinematicYaw - lc.yawObject.rotation.y),
                Math.cos(this.cinematicYaw - lc.yawObject.rotation.y)
              );
              lc.yawObject.rotation.y += diffYaw * (1 - Math.exp(-3.5 * dt));
              lc.pitchObject.rotation.x = THREE.MathUtils.damp(
                lc.pitchObject.rotation.x,
                Math.max(-0.25, Math.min(0.45, this.cinematicPitch)),
                3.2,
                dt
              );
            }
          }
        }

        const microWeight = 1.0 - smoothstep(-0.22, -0.72, this.currentZoom);
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
   * 2. Biome-Specific Eye-Level Habitat Layer & Aerial Panorama Layer
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

        const initZoom = window.tabsirahZoomState || { microWeight: 1, macroWeight: 0 };
        this.applyWeights(initZoom.microWeight, initZoom.macroWeight);

        this.onZoom = (evt) => {
          const { microWeight, macroWeight } = evt.detail || {};
          this.applyWeights(microWeight ?? 1, macroWeight ?? 0);
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
        // EYE-LEVEL HABITAT: Sculpted Glacial Ice Spires along Fjord Bank + Airborne Diamond-Dust Crystals
        const spireGeo = new THREE.ConeGeometry(0.24, 1.35, 6);
        spireGeo.translate(0, 0.675, 0);
        const spireMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#E0F2FE',
            emissive: '#0EA5E9',
            emissiveIntensity: 0.48,
            roughness: 0.14,
            metalness: 0.28
          }),
          'micro',
          0.9
        );
        const spireCoords = [
          [-2.85, -3.9, 0.95],
          [-2.55, -4.3, 0.65],
          [2.75, -4.1, 1.05],
          [3.15, -3.7, 0.72],
          [-3.4, -2.6, 0.85],
          [3.55, -2.8, 0.78]
        ];
        spireCoords.forEach(([sx, sz, sc], idx) => {
          const sp = new THREE.Mesh(spireGeo, spireMat);
          sp.position.set(sx, 0, sz);
          sp.scale.set(sc, sc * (0.85 + (idx % 2) * 0.35), sc);
          sp.rotation.set((idx % 2 === 0 ? 1 : -1) * 0.08, idx * 0.7, (idx % 3 - 1) * 0.1);
          this.microGroup.add(sp);
        });
        this.disposables.push(spireGeo);

        // Elevated Diamond-Dust Hexagonal Ice Prisms shimmering in the cold Arctic air
        const prismGeo = new THREE.OctahedronGeometry(0.036, 0);
        const prismMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#F0F9FF',
            emissive: '#38BDF8',
            emissiveIntensity: 0.85,
            roughness: 0.08,
            metalness: 0.55
          }),
          'micro',
          0.88
        );
        const dustCount = 28;
        const dustPrisms = [];
        for (let i = 0; i < dustCount; i++) {
          const m = new THREE.Mesh(prismGeo, prismMat);
          const bx = (Math.random() - 0.5) * 6.4;
          const by = 0.95 + Math.random() * 1.85;
          const bz = -1.6 - Math.random() * 4.4;
          m.position.set(bx, by, bz);
          this.microGroup.add(m);
          dustPrisms.push({ m, bx, by, bz, phase: i * 0.65 });
        }
        this.animatedItems.push((elapsed) => {
          dustPrisms.forEach((p) => {
            p.m.position.y = p.by + Math.sin(elapsed * 0.9 + p.phase) * 0.12;
            p.m.rotation.y = elapsed * 0.6 + p.phase;
            p.m.rotation.x = elapsed * 0.4 + p.phase;
          });
        });
        this.disposables.push(prismGeo);


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
        // EYE-LEVEL HABITAT: Hanging Canopy Epiphyte Blooms & Hummingbirds Pollinating at Eye Height (y = 1.4..1.9m)
        const petalGeo = new THREE.ConeGeometry(0.08, 0.18, 5);
        petalGeo.rotateX(Math.PI * 0.32);
        const orchidMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#F472B6',
            emissive: '#DB2777',
            emissiveIntensity: 0.58,
            roughness: 0.35
          }),
          'micro',
          0.96
        );
        const leafMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#10B981', emissive: '#065F46', emissiveIntensity: 0.28, roughness: 0.55 }),
          'micro',
          0.95
        );
        const vineGeo = new THREE.CylinderGeometry(0.012, 0.014, 1.35, 5);
        const orchidSpots = [
          [-2.35, 1.65, -2.95],
          [2.15, 1.72, -3.15],
          [-1.35, 1.92, -4.15],
          [1.55, 1.58, -2.55]
        ];
        orchidSpots.forEach(([ox, oy, oz], idx) => {
          const cluster = new THREE.Group();
          cluster.position.set(ox, oy, oz);
          const stem = new THREE.Mesh(vineGeo, leafMat);
          stem.position.y = 0.65;
          cluster.add(stem);
          for (let p = 0; p < 5; p++) {
            const pet = new THREE.Mesh(petalGeo, orchidMat);
            const ang = (p / 5) * Math.PI * 2;
            pet.position.set(Math.cos(ang) * 0.06, 0, Math.sin(ang) * 0.06);
            pet.rotation.y = ang + idx * 0.4;
            cluster.add(pet);
          }
          this.microGroup.add(cluster);
        });
        this.disposables.push(petalGeo, vineGeo);

        // 2 Realistic Iridescent Hovering Hummingbirds darting between eye-level blossoms
        const hbBodyGeo = new THREE.SphereGeometry(0.032, 8, 8);
        hbBodyGeo.scale(0.9, 0.85, 1.85);
        const hbBeakGeo = new THREE.ConeGeometry(0.005, 0.058, 5);
        hbBeakGeo.rotateX(Math.PI / 2);
        hbBeakGeo.translate(0, 0.008, 0.072);
        const hbWingGeo = new THREE.SphereGeometry(0.045, 6, 4);
        hbWingGeo.scale(1.35, 0.08, 0.42);
        hbWingGeo.translate(0.048, 0, 0);
        const hbMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#2DD4BF',
            emissive: '#0F766E',
            emissiveIntensity: 0.72,
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
          hummingbirds.push({ hb, rw, lw, cx: h === 0 ? -1.85 : 1.75, cy: 1.62 + h * 0.14, cz: -2.95 - h * 0.15, phase: h * 2.1 });
        }
        this.animatedItems.push((elapsed) => {
          hummingbirds.forEach((item) => {
            const a = elapsed * 1.45 + item.phase;
            item.hb.position.set(item.cx + Math.cos(a) * 0.42, item.cy + Math.sin(a * 2.5) * 0.16, item.cz + Math.sin(a) * 0.32);
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
        // EYE-LEVEL HABITAT: Swaying Gorgonian Sea Fans & Golden Reef Seahorses swimming mid-water
        const fanGeo = new THREE.CircleGeometry(0.48, 16, 0, Math.PI);
        const fanMat = this.regMat(
          new THREE.MeshStandardMaterial({
            color: '#F472B6',
            emissive: '#DB2777',
            emissiveIntensity: 0.45,
            roughness: 0.45,
            wireframe: true,
            side: THREE.DoubleSide
          }),
          'micro',
          0.92
        );
        const seaFans = [];
        [
          [-2.65, 0.72, -3.4, 0.4],
          [2.75, 0.68, -3.5, -0.35],
          [-1.75, 0.58, -4.6, 0.2]
        ].forEach(([fx, fy, fz, ry], idx) => {
          const fan = new THREE.Mesh(fanGeo, fanMat);
          fan.position.set(fx, fy, fz);
          fan.rotation.y = ry;
          this.microGroup.add(fan);
          seaFans.push({ fan, phase: idx * 1.4 });
        });
        this.disposables.push(fanGeo);

        const shGeo = new THREE.TorusGeometry(0.062, 0.018, 6, 12, Math.PI * 1.45);
        const shMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#FBBF24', emissive: '#D97706', emissiveIntensity: 0.55 }),
          'micro',
          0.96
        );
        const seahorses = [];
        [-1.35, 1.42].forEach((sx, idx) => {
          const sh = new THREE.Mesh(shGeo, shMat);
          sh.position.set(sx, 1.18 + idx * 0.16, -2.85);
          this.microGroup.add(sh);
          seahorses.push({ sh, baseY: sh.position.y, phase: idx * 1.7 });
        });
        this.animatedItems.push((elapsed) => {
          seaFans.forEach((f) => {
            f.fan.rotation.z = Math.sin(elapsed * 1.1 + f.phase) * 0.08;
          });
        });
        this.disposables.push(shGeo);


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
        // EYE-LEVEL HABITAT: Tall Oasis Cattail Reeds, Blooming Desert Acacia Bushes & Hovering Oasis Dragonflies
        const reedGeo = new THREE.CylinderGeometry(0.01, 0.018, 0.85, 5);
        reedGeo.translate(0, 0.42, 0);
        const reedMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#4D7C0F', roughness: 0.6 }),
          'micro',
          0.95
        );
        const reeds = new THREE.InstancedMesh(reedGeo, reedMat, 28);
        for (let r = 0; r < 28; r++) {
          const ang = (r / 28) * Math.PI * 1.4 - 0.7;
          _dummy.position.set(Math.sin(ang) * 1.42, 0.0, -3.2 + Math.cos(ang) * 1.2);
          _dummy.rotation.set((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.2);
          _dummy.scale.setScalar(0.8 + (r % 3) * 0.25);
          _dummy.updateMatrix();
          reeds.setMatrixAt(r, _dummy.matrix);
        }
        reeds.instanceMatrix.needsUpdate = true;
        this.microGroup.add(reeds);
        this.disposables.push(reedGeo);

        // Blooming Desert Acacia & Golden Wildflower Bushes framing the oasis bank
        const flowerGeo = new THREE.DodecahedronGeometry(0.055, 0);
        const flowerMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#FDE047', emissive: '#F59E0B', emissiveIntensity: 0.45 }),
          'micro',
          0.95
        );
        const acacia = new THREE.InstancedMesh(flowerGeo, flowerMat, 16);
        for (let f = 0; f < 16; f++) {
          const ang = (f / 16) * Math.PI * 2;
          const r = 1.65 + (f % 2) * 0.35;
          _dummy.position.set(Math.cos(ang) * r, 0.35 + (f % 3) * 0.14, -3.2 + Math.sin(ang) * r);
          _dummy.scale.setScalar(0.75 + (f % 3) * 0.28);
          _dummy.updateMatrix();
          acacia.setMatrixAt(f, _dummy.matrix);
        }
        acacia.instanceMatrix.needsUpdate = true;
        this.microGroup.add(acacia);

        // Emerald Oasis Dragonflies skimming serenely above the spring water (y = 0.75..1.15m)
        const dfBodyGeo = new THREE.CylinderGeometry(0.008, 0.005, 0.14, 5);
        dfBodyGeo.rotateX(Math.PI / 2);
        const dfWingGeo = new THREE.PlaneGeometry(0.16, 0.032);
        const dfMat = this.regMat(
          new THREE.MeshStandardMaterial({ color: '#34D399', emissive: '#10B981', emissiveIntensity: 0.65, side: THREE.DoubleSide }),
          'micro',
          0.94
        );
        const dragonflies = [];
        for (let d = 0; d < 3; d++) {
          const df = new THREE.Group();
          df.add(new THREE.Mesh(dfBodyGeo, dfMat));
          const wings = new THREE.Mesh(dfWingGeo, dfMat);
          wings.rotation.x = Math.PI / 2;
          df.add(wings);
          this.microGroup.add(df);
          dragonflies.push({ df, phase: d * 2.1, r: 0.75 + d * 0.28, y: 0.78 + d * 0.15 });
        }
        this.animatedItems.push((elapsed) => {
          dragonflies.forEach((item) => {
            const a = elapsed * 1.15 + item.phase;
            item.df.position.set(Math.cos(a) * item.r, item.y + Math.sin(a * 2.4) * 0.09, -3.2 + Math.sin(a) * item.r);
            item.df.rotation.y = -a;
          });
        });
        this.disposables.push(flowerGeo, dfBodyGeo, dfWingGeo);


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
