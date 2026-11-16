/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Upgraded Real-Time Procedural + PBR Biome Geometry Generators:
 *  1. crystalline-aurora-valley  (Polar terrain + ice PBR normal map + Arctic pines + geomagnetic arcs)
 *  2. lsystem-ancient-tree       (Fractal L-System canopy + bark PBR normal map + wet-leaf rain sheen)
 *  3. rainforest-floor-flora     (Moss PBR floor + rain-unfurling ferns & blossoms)
 *  4. rainforest-wildlife-system (24 flapping Blue/Emerald Morpho butterflies + waterfall splash mist)
 *  5. particle-weather-system    (Rain, Snow, Waterfall, Alpine Mist, and Sahara Sand-Drift engines)
 *  6. coral-cathedral-ecosystem  (Coral PBR normal map + Swaying Kelp + Gliding Manta Ray + 90 Boids + Bubbles)
 *  7. desert-dunes-oasis         (Sand-ripple PBR normal map + Swaying Palms + Oasis Lantern + Constellations)
 */

import { natureAudio } from './nature-audio.js';
import { getBiomePBRTextures } from './pbr-texture-factory.js';
import { createForestCanopySwayMaterial } from './nature-shaders.js';
import { tactileTouchFX } from './tactile-touch-fx.js';

function createSoftGlowSprite() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.82)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function valueNoise2D(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const hash = (a, b) => {
    const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  };
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const n00 = hash(xi, yi);
  const n10 = hash(xi + 1, yi);
  const n01 = hash(xi, yi + 1);
  const n11 = hash(xi + 1, yi + 1);
  return (n00 * (1 - u) + n10 * u) * (1 - v) + (n01 * (1 - u) + n11 * u) * v;
}

function fbm2D(x, y, octaves = 3) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2D(x * freq, y * freq);
    freq *= 2.05;
    amp *= 0.5;
  }
  return sum;
}

if (typeof AFRAME !== 'undefined') {
  const _dummy = new THREE.Object3D();
  const _vA = new THREE.Vector3();
  const _vB = new THREE.Vector3();
  const _color = new THREE.Color();
  const _fishForward = new THREE.Vector3(0, 0, 1);
  const _fishQuat = new THREE.Quaternion();

  /**
   * 1. Polar Crystalline Valley, Snow-Dusted Arctic Pines & Geomagnetic Arcs (Biome 1)
   */
  if (!AFRAME.components['crystalline-aurora-valley']) {
    AFRAME.registerComponent('crystalline-aurora-valley', {
      init: function () {
        const group = new THREE.Group();
        this.disposables = [];
        const icePBR = getBiomePBRTextures('ice', 10, 10);

        // Continuous 360-degree Arctic Snow Valley & Surrounding Fjord Mountain Ring (zero cut edges!)
        const floorGeo = new THREE.PlaneGeometry(145, 145, 116, 116);
        floorGeo.rotateX(-Math.PI / 2);
        const pos = floorGeo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        const cLow = new THREE.Color('#254970');
        const cMid = new THREE.Color('#CBE6FA');
        const cHigh = new THREE.Color('#FFFFFF');
        const getAuroraGroundY = (x, z) => {
          const distCamera = Math.hypot(x, z - 1.0);
          const distLake = Math.hypot(x, z + 4.5);
          const clearMask = THREE.MathUtils.smoothstep(Math.min(distCamera, distLake), 5.2, 13.0);
          const ridgeDist = Math.hypot(x, z);
          const mountainRing = THREE.MathUtils.smoothstep(ridgeDist, 14.0, 52.0);
          const rollingHills = (fbm2D(x * 0.08 + 4, z * 0.08 + 4, 3) * 2.4 + Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.65) * clearMask;
          const perimeterPeaks = (3.5 + fbm2D(x * 0.055 + 11, z * 0.055 + 9, 4) * 10.5) * mountainRing;
          return rollingHills + perimeterPeaks - (1 - clearMask) * 0.16;
        };
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const h = getAuroraGroundY(x, z);
          pos.setY(i, h);
          if (h > 3.2) {
            _color.lerpColors(cMid, cHigh, THREE.MathUtils.clamp((h - 3.2) / 5.5, 0, 1));
          } else {
            _color.lerpColors(cLow, cMid, THREE.MathUtils.clamp((h + 0.18) * 0.48, 0, 1));
          }
          colors[i * 3] = _color.r;
          colors[i * 3 + 1] = _color.g;
          colors[i * 3 + 2] = _color.b;
        }
        floorGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        floorGeo.computeVertexNormals();
        const floorMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          normalMap: icePBR.normalMap,
          normalScale: new THREE.Vector2(0.85, 0.85),
          roughness: 0.42,
          metalness: 0.08,
          flatShading: false
        });
        this.auroraFloorMesh = new THREE.Mesh(floorGeo, floorMat);
        group.add(this.auroraFloorMesh);
        this.disposables.push(floorGeo, floorMat);
        tactileTouchFX.registerInteractiveSurface(this.auroraFloorMesh, {
          biomeId: 'aurora',
          specimenKey: 'aurora-ice-valley',
          materials: [floorMat]
        });

        // Snow-dusted 3-tiered Arctic Pine groves circling 360 degrees around the fjord valley (72 trees)
        const pineTrunkGeo = new THREE.CylinderGeometry(0.036, 0.062, 0.62, 6);
        pineTrunkGeo.translate(0, 0.31, 0);
        const pineTrunkMat = new THREE.MeshStandardMaterial({ color: '#5D4037', roughness: 0.9 });
        const pineTierGeo = new THREE.ConeGeometry(0.38, 0.72, 10);
        pineTierGeo.translate(0, 0.36, 0);
        const pineMat = new THREE.MeshStandardMaterial({
          color: '#14532D',
          emissive: '#052E16',
          emissiveIntensity: 0.22,
          roughness: 0.82
        });
        const snowCapGeo = new THREE.ConeGeometry(0.24, 0.32, 10);
        snowCapGeo.translate(0, 0.16, 0);
        const snowCapMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.58 });
        const pineCount = 72;
        const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, pineTrunkMat, pineCount);
        const pines = new THREE.InstancedMesh(pineTierGeo, pineMat, pineCount * 3);
        const snowCaps = new THREE.InstancedMesh(snowCapGeo, snowCapMat, pineCount);
        let pIdx = 0;
        for (let i = 0; i < pineCount; i++) {
          const ang = (i / pineCount) * Math.PI * 2 + (i % 3) * 0.14;
          const r = 6.2 + (i % 6) * 2.35;
          const x = Math.cos(ang) * r;
          const z = -2.0 + Math.sin(ang) * r;
          const s = 0.85 + (i % 5) * 0.32;
          const baseY = Math.max(-0.1, getAuroraGroundY(x, z) - 0.04);

          _dummy.position.set(x, baseY, z);
          _dummy.rotation.set(0, i * 0.7, 0);
          _dummy.scale.setScalar(s);
          _dummy.updateMatrix();
          pineTrunks.setMatrixAt(i, _dummy.matrix);

          // 3 stacked organic foliage tiers
          _dummy.position.set(x, baseY + 0.24 * s, z);
          _dummy.scale.set(s * 1.05, s * 0.92, s * 1.05);
          _dummy.updateMatrix();
          pines.setMatrixAt(pIdx++, _dummy.matrix);

          _dummy.position.set(x, baseY + 0.56 * s, z);
          _dummy.scale.set(s * 0.82, s * 0.84, s * 0.82);
          _dummy.updateMatrix();
          pines.setMatrixAt(pIdx++, _dummy.matrix);

          _dummy.position.set(x, baseY + 0.85 * s, z);
          _dummy.scale.set(s * 0.62, s * 0.75, s * 0.62);
          _dummy.updateMatrix();
          pines.setMatrixAt(pIdx++, _dummy.matrix);

          _dummy.position.set(x, baseY + 1.08 * s, z);
          _dummy.scale.setScalar(s * 0.74);
          _dummy.updateMatrix();
          snowCaps.setMatrixAt(i, _dummy.matrix);
        }
        pineTrunks.instanceMatrix.needsUpdate = true;
        pines.instanceMatrix.needsUpdate = true;
        snowCaps.instanceMatrix.needsUpdate = true;
        group.add(pineTrunks, pines, snowCaps);
        this.disposables.push(pineTrunkGeo, pineTrunkMat, pineTierGeo, pineMat, snowCapGeo, snowCapMat);

        // Ice Crystal Spires circling the frozen shoreline (36 spires)
        const spireGeo = new THREE.ConeGeometry(0.18, 1.05, 6);
        spireGeo.translate(0, 0.52, 0);
        const spireMat = new THREE.MeshStandardMaterial({
          color: '#7DD3FC',
          emissive: '#0284C7',
          emissiveIntensity: 0.45,
          roughness: 0.12,
          metalness: 0.25,
          transparent: true,
          opacity: 0.88
        });
        const spireCount = 36;
        const spires = new THREE.InstancedMesh(spireGeo, spireMat, spireCount);
        for (let i = 0; i < spireCount; i++) {
          const ang = (i / spireCount) * Math.PI * 2 + 0.25;
          const r = 4.6 + (i % 4) * 1.45;
          const x = Math.cos(ang) * r;
          const z = -2.8 + Math.sin(ang) * r;
          _dummy.position.set(x, 0, z);
          _dummy.rotation.set((Math.random() - 0.5) * 0.16, i * 0.6, (Math.random() - 0.5) * 0.16);
          _dummy.scale.setScalar(0.55 + (i % 4) * 0.28);
          _dummy.updateMatrix();
          spires.setMatrixAt(i, _dummy.matrix);
        }
        spires.instanceMatrix.needsUpdate = true;
        group.add(spires);
        this.disposables.push(spireGeo, spireMat);

        // Translucent Glacial Ice Floes drifting in the Arctic fjord mirror
        const floeGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.14, 7);
        const floeMat = new THREE.MeshStandardMaterial({
          color: '#E0F2FE',
          emissive: '#0284C7',
          emissiveIntensity: 0.28,
          roughness: 0.2,
          metalness: 0.15,
          flatShading: true
        });
        this.iceFloes = [];
        [
          { x: -1.1, z: -3.2, sx: 1.15, sz: 0.85, p: 0.2 },
          { x: 1.25, z: -4.1, sx: 0.9, sz: 1.1, p: 1.7 },
          { x: 0.15, z: -5.0, sx: 1.35, sz: 0.75, p: 3.1 }
        ].forEach((fc) => {
          const fm = new THREE.Mesh(floeGeo, floeMat);
          fm.position.set(fc.x, 0.03, fc.z);
          fm.scale.set(fc.sx, 1, fc.sz);
          fm.userData = { baseX: fc.x, baseZ: fc.z, phase: fc.p };
          group.add(fm);
          this.iceFloes.push(fm);
        });
        this.disposables.push(floeGeo, floeMat);

        // Herd of 5 Realistic Arctic Reindeer (Rangifer tarandus) around the snowy fjord banks
        const deerCoatMat = new THREE.MeshStandardMaterial({ color: '#795548', roughness: 0.82 });
        const deerRuffMat = new THREE.MeshStandardMaterial({ color: '#EFEBE9', roughness: 0.9 });
        const antlerMat = new THREE.MeshStandardMaterial({ color: '#D7CCC8', roughness: 0.65 });
        const deerTorsoGeo = new THREE.SphereGeometry(0.24, 12, 10);
        deerTorsoGeo.scale(1.0, 0.72, 1.35);
        const deerRuffGeo = new THREE.ConeGeometry(0.12, 0.26, 8);
        deerRuffGeo.rotateX(-0.4);
        const deerHeadGeo = new THREE.ConeGeometry(0.08, 0.18, 6);
        deerHeadGeo.rotateX(Math.PI / 2);
        const deerLegGeo = new THREE.CylinderGeometry(0.018, 0.014, 0.32, 6);
        const antlerMainGeo = new THREE.CylinderGeometry(0.008, 0.014, 0.26, 5);
        const antlerTineGeo = new THREE.CylinderGeometry(0.006, 0.008, 0.12, 4);
        this.disposables.push(deerCoatMat, deerRuffMat, antlerMat, deerTorsoGeo, deerRuffGeo, deerHeadGeo, deerLegGeo, antlerMainGeo, antlerTineGeo);

        this.reindeerList = [];
        [
          { x: -2.45, z: -2.95, ry: 0.55, sc: 1.0 },
          { x: -3.15, z: -3.55, ry: 0.25, sc: 0.84 },
          { x: 3.35, z: -3.25, ry: -2.1, sc: 0.96 },
          { x: 4.10, z: -2.45, ry: -1.7, sc: 0.78 },
          { x: -3.6, z: 2.2, ry: 1.9, sc: 0.92 }
        ].forEach((dc, dIdx) => {
          dc.y = Math.max(0.0, getAuroraGroundY(dc.x, dc.z)) + 0.36 * dc.sc;
          const deer = new THREE.Group();
          const body = new THREE.Mesh(deerTorsoGeo, deerCoatMat);
          const neckPivot = new THREE.Group();
          const ruff = new THREE.Mesh(deerRuffGeo, deerRuffMat);
          ruff.position.set(0.16, 0.14, 0.12);
          const head = new THREE.Mesh(deerHeadGeo, deerCoatMat);
          head.position.set(0.26, 0.28, 0.22);
          head.rotation.y = 0.15;
          neckPivot.add(ruff, head);
          deer.add(body, neckPivot);

          [[-0.14, -0.16], [-0.14, 0.14], [0.14, -0.16], [0.14, 0.14]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(deerLegGeo, deerCoatMat);
            leg.position.set(lx, -0.22, lz);
            deer.add(leg);
          });

          [-1, 1].forEach((side) => {
            const ant = new THREE.Mesh(antlerMainGeo, antlerMat);
            ant.position.set(0.26, 0.44, 0.22 + side * 0.06);
            ant.rotation.set(side * 0.35, 0, -0.25);
            const tine = new THREE.Mesh(antlerTineGeo, antlerMat);
            tine.position.set(0, 0.08, 0.04);
            tine.rotation.x = side * 0.6;
            ant.add(tine);
            neckPivot.add(ant);
          });

          deer.position.set(dc.x, dc.y, dc.z);
          deer.rotation.y = dc.ry;
          deer.scale.setScalar(dc.sc);
          deer.userData = { neckPivot, phase: dIdx * 1.35, baseRy: dc.ry };
          group.add(deer);
          this.reindeerList.push(deer);
        });

        // Realistic Arctic Fox (Vulpes lagopus) curled on the snowy bank
        const foxMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.95 });
        const foxNoseMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.4 });
        const foxBodyGeo = new THREE.SphereGeometry(0.12, 10, 8);
        foxBodyGeo.scale(1.2, 0.8, 1.0);
        const foxTailGeo = new THREE.ConeGeometry(0.08, 0.24, 7);
        foxTailGeo.rotateZ(Math.PI * 0.65);
        const foxHeadGeo = new THREE.ConeGeometry(0.06, 0.12, 6);
        foxHeadGeo.rotateX(Math.PI / 2);
        const foxEarGeo = new THREE.ConeGeometry(0.024, 0.045, 4);

        const fox = new THREE.Group();
        const fBody = new THREE.Mesh(foxBodyGeo, foxMat);
        const fTail = new THREE.Mesh(foxTailGeo, foxMat);
        fTail.position.set(-0.14, -0.02, 0.06);
        const fHead = new THREE.Mesh(foxHeadGeo, foxMat);
        fHead.position.set(0.14, 0.06, 0);
        const fNose = new THREE.Mesh(foxHeadGeo, foxNoseMat);
        fNose.scale.set(0.25, 0.25, 0.25);
        fNose.position.set(0.19, 0.06, 0);
        const earL = new THREE.Mesh(foxEarGeo, foxMat);
        earL.position.set(0.12, 0.12, 0.035);
        const earR = new THREE.Mesh(foxEarGeo, foxMat);
        earR.position.set(0.12, 0.12, -0.035);
        fox.add(fBody, fTail, fHead, fNose, earL, earR);
        const foxGroundY = Math.max(0.0, getAuroraGroundY(2.4, -2.6));
        fox.position.set(2.4, foxGroundY + 0.09, -2.6);
        fox.rotation.y = -1.2;
        fox.scale.setScalar(1.15);
        this.arcticFox = { fox, fTail, baseRy: -1.2 };
        group.add(fox);
        this.disposables.push(foxMat, foxNoseMat, foxBodyGeo, foxTailGeo, foxHeadGeo, foxEarGeo);

        // Huddle of 4 Cheerful Emperor Penguins along the ice floes and frosted shore
        const pengBlackMat = new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.55 });
        const pengWhiteMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.72 });
        const pengBeakMat = new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.45 });
        const pengBodyGeo = new THREE.SphereGeometry(0.085, 10, 8);
        pengBodyGeo.scale(0.85, 1.45, 0.85);
        const pengBellyGeo = new THREE.SphereGeometry(0.068, 8, 8);
        pengBellyGeo.scale(0.85, 1.35, 0.75);
        const pengHeadGeo = new THREE.SphereGeometry(0.052, 8, 8);
        const pengBeakGeo = new THREE.ConeGeometry(0.015, 0.045, 5);
        pengBeakGeo.rotateX(Math.PI / 2);
        this.penguins = [];
        [
          { x: -1.05, y: 0.21, z: -3.15, ry: 0.4, p: 0.0 },
          { x: -0.82, y: 0.21, z: -3.28, ry: -0.5, p: 1.4 },
          { x: 1.22, y: 0.21, z: -4.05, ry: -1.8, p: 2.5 },
          { x: 1.45, y: 0.21, z: -3.9, ry: -2.2, p: 0.8 }
        ].forEach((pc) => {
          const pGroup = new THREE.Group();
          const pb = new THREE.Mesh(pengBodyGeo, pengBlackMat);
          const pBelly = new THREE.Mesh(pengBellyGeo, pengWhiteMat);
          pBelly.position.set(0, -0.01, 0.028);
          const pHead = new THREE.Mesh(pengHeadGeo, pengBlackMat);
          pHead.position.set(0, 0.145, 0.01);
          const pBeak = new THREE.Mesh(pengBeakGeo, pengBeakMat);
          pBeak.position.set(0, 0.145, 0.068);
          pGroup.add(pb, pBelly, pHead, pBeak);
          pGroup.position.set(pc.x, pc.y, pc.z);
          pGroup.rotation.y = pc.ry;
          pGroup.userData = { baseY: pc.y, phase: pc.p };
          group.add(pGroup);
          this.penguins.push(pGroup);
        });
        this.disposables.push(pengBlackMat, pengWhiteMat, pengBeakMat, pengBodyGeo, pengBellyGeo, pengHeadGeo, pengBeakGeo);

        // Warm Expedition Timber Campfire Lantern casting cheerful golden warmth on snow
        const lanternBaseY = Math.max(0.0, getAuroraGroundY(1.45, -2.1));
        const lanternPoleGeo = new THREE.CylinderGeometry(0.022, 0.028, 0.72, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: '#5C3A21', roughness: 0.85 });
        const pole = new THREE.Mesh(lanternPoleGeo, poleMat);
        pole.position.set(1.45, lanternBaseY + 0.36, -2.1);
        const lanternGlassGeo = new THREE.CylinderGeometry(0.06, 0.075, 0.14, 6);
        const lanternGlassMat = new THREE.MeshStandardMaterial({
          color: '#FEF3C7',
          emissive: '#F59E0B',
          emissiveIntensity: 1.45,
          roughness: 0.2,
          transparent: true,
          opacity: 0.92
        });
        const lamp = new THREE.Mesh(lanternGlassGeo, lanternGlassMat);
        lamp.position.set(1.45, lanternBaseY + 0.72, -2.1);
        const lampLight = new THREE.PointLight('#FBBF24', 1.35, 6.0);
        lampLight.position.set(1.45, lanternBaseY + 0.75, -2.1);
        this.auroraLampLight = lampLight;
        this.auroraLampMat = lanternGlassMat;
        group.add(pole, lamp, lampLight);
        this.disposables.push(lanternPoleGeo, poleMat, lanternGlassGeo, lanternGlassMat);

        // Polar Meteor Streaks gliding silently across night sky
        const meteorGeo = new THREE.CylinderGeometry(0.005, 0.022, 0.95, 5);
        meteorGeo.rotateZ(Math.PI / 2);
        const meteorMat = new THREE.MeshBasicMaterial({
          color: '#E0F2FE',
          transparent: true,
          opacity: 0.0,
          blending: THREE.AdditiveBlending
        });
        this.meteors = [];
        for (let i = 0; i < 2; i++) {
          const mm = new THREE.Mesh(meteorGeo, meteorMat.clone());
          mm.rotation.z = -0.32;
          mm.userData = { offset: i * 5.2, laneY: 5.4 + i * 1.1, laneZ: -9.5 - i * 1.4 };
          group.add(mm);
          this.meteors.push(mm);
          this.disposables.push(mm.material);
        }
        this.disposables.push(meteorGeo, meteorMat);

        // Educational Model: Geomagnetic Dipole Field Arcs + Solar-Wind Particle Stream (toggled on aurora-magnetic-pulse / aurora-toggle-shield)
        this.shieldVisible = false;
        this.magnetosphereGroup = new THREE.Group();
        this.magnetosphereGroup.visible = false;
        this.fieldArcMat = new THREE.MeshBasicMaterial({
          color: '#38BDF8',
          transparent: true,
          opacity: 0.42,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.fieldCurves = [];
        for (let a = 0; a < 7; a++) {
          const az = ((a - 3) / 3) * 0.95;
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.sin(az) * 11, 0.5, -10.5),
            new THREE.Vector3(Math.sin(az) * 8.2, 4.8 + Math.abs(az) * 1.4, -10.0),
            new THREE.Vector3(Math.sin(az) * 3.8, 7.1, -9.2),
            new THREE.Vector3(Math.sin(az) * 1.1, 4.4, -8.5),
            new THREE.Vector3(Math.sin(az) * 0.5, 0.8, -7.8)
          ]);
          this.fieldCurves.push(curve);
          const arcGeo = new THREE.TubeGeometry(curve, 36, 0.025, 6, false);
          this.magnetosphereGroup.add(new THREE.Mesh(arcGeo, this.fieldArcMat));
          this.disposables.push(arcGeo);
        }

        // Animated solar-wind particles spiraling down geomagnetic arcs
        this.solarWindCount = 84;
        this.solarWindPos = new Float32Array(this.solarWindCount * 3);
        this.solarWindProg = new Float32Array(this.solarWindCount);
        for (let i = 0; i < this.solarWindCount; i++) {
          this.solarWindProg[i] = Math.random();
        }
        const swGeo = new THREE.BufferGeometry();
        this.solarWindAttr = new THREE.BufferAttribute(this.solarWindPos, 3);
        swGeo.setAttribute('position', this.solarWindAttr);
        const swTex = createSoftGlowSprite();
        this.solarWindMat = new THREE.PointsMaterial({
          size: 0.24,
          map: swTex,
          color: '#6EE7B7',
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.magnetosphereGroup.add(new THREE.Points(swGeo, this.solarWindMat));
        this.disposables.push(this.fieldArcMat, swGeo, this.solarWindMat, swTex);
        group.add(this.magnetosphereGroup);

        this.auroraResonance = 0.0;
        this.coronalBurstCooldown = 0.0;
        this.conductorBend = 0.0;
        this.conductorBendTarget = 0.0;
        this.lastSkyX = null;
        this.lastConductorFeedback = 0;

        this.applyConductorSweep = (deltaStrength, dxNorm) => {
          this.auroraResonance = Math.min(1.0, this.auroraResonance + deltaStrength);
          this.conductorBendTarget = THREE.MathUtils.clamp(this.conductorBendTarget + dxNorm * 0.42, -0.36, 0.36);
          if (!this.shieldVisible && this.auroraResonance > 0.08) {
            this.magnetosphereGroup.visible = true;
          }
          const now = performance.now();
          if (this.auroraResonance >= 1.0 && this.coronalBurstCooldown <= 0) {
            this.coronalBurstCooldown = 8.0;
            this.auroraResonance = 0.25;
            this.shieldVisible = true;
            this.magnetosphereGroup.visible = true;
            window.dispatchEvent(new CustomEvent('aurora-shield-state', { detail: { visible: true } }));
            this.el.sceneEl?.emit('aurora-coronal-burst', {}, false);
            natureAudio.playCoronalBurst();
            window.dispatchEvent(
              new CustomEvent('tabsirah-wonder-progress', {
                detail: { message: 'Coronal Substorm Triggered! Magnetic field channeled incoming solar wind.' }
              })
            );
          } else if (now - this.lastConductorFeedback > 420 && this.auroraResonance > 0.14) {
            this.lastConductorFeedback = now;
            const pct = Math.round(this.auroraResonance * 100);
            window.dispatchEvent(
              new CustomEvent('tabsirah-wonder-progress', {
                detail: { message: `Solar Wind Resonance: ${pct}% — keep sweeping the aurora sky!` }
              })
            );
          }
        };

        this.onAuroraShield = (evt) => {
          if (typeof evt.detail?.visible === 'boolean') {
            this.shieldVisible = evt.detail.visible;
          } else {
            this.shieldVisible = !this.shieldVisible;
          }
          this.magnetosphereGroup.visible = this.shieldVisible;
          window.dispatchEvent(new CustomEvent('aurora-shield-state', { detail: { visible: this.shieldVisible } }));
        };
        this.onConductorSweep = (evt) => {
          if (window.tabsirahActiveBiome !== 'aurora') return;
          const speed = evt.detail?.speed ?? 0.06;
          const dx = evt.detail?.dx ?? 0;
          this.applyConductorSweep(Math.min(0.16, speed * 1.45), dx * 6.0);
        };
        this.onAuroraPointerMove = (e) => {
          if (window.tabsirahActiveBiome !== 'aurora') return;
          const h = window.innerHeight || 720;
          if (e.clientY < h * 0.56) {
            if (this.lastSkyX !== null) {
              const dx = e.clientX - this.lastSkyX;
              if (Math.abs(dx) > 8 && Math.abs(dx) < 160) {
                this.applyConductorSweep(Math.min(0.085, Math.abs(dx) * 0.0012), Math.sign(dx) * 0.35);
              }
            }
            this.lastSkyX = e.clientX;
          } else {
            this.lastSkyX = null;
          }
        };

        this.el.sceneEl?.addEventListener('aurora-magnetic-pulse', this.onAuroraShield);
        this.el.sceneEl?.addEventListener('aurora-toggle-shield', this.onAuroraShield);
        this.el.sceneEl?.addEventListener('aurora-conductor-sweep', this.onConductorSweep);
        window.addEventListener('pointermove', this.onAuroraPointerMove);

        this.el.setObject3D('mesh', group);
      },
      tick: function (time, timeDelta) {
        const dt = timeDelta ? Math.min(timeDelta, 50) / 1000 : 0.016;
        const t = time * 0.001 * (window.tabsirahTimeScale || 1.0);
        if (this.coronalBurstCooldown > 0) this.coronalBurstCooldown = Math.max(0, this.coronalBurstCooldown - dt);
        if (this.auroraResonance > 0 && this.coronalBurstCooldown <= 0) {
          this.auroraResonance = Math.max(0, this.auroraResonance - dt * 0.06);
          if (!this.shieldVisible && this.auroraResonance < 0.04) {
            this.magnetosphereGroup.visible = false;
          }
        }
        this.conductorBend = THREE.MathUtils.damp(this.conductorBend, this.conductorBendTarget, 5.5, dt);
        this.conductorBendTarget = THREE.MathUtils.damp(this.conductorBendTarget, 0, 1.8, dt);
        if (this.magnetosphereGroup) {
          this.magnetosphereGroup.rotation.z = this.conductorBend;
          this.magnetosphereGroup.rotation.y = this.conductorBend * 0.55;
        }
        if (this.iceFloes) {
          this.iceFloes.forEach((fm) => {
            const p = fm.userData.phase;
            fm.position.y = 0.028 + Math.sin(t * 0.8 + p) * 0.018;
            fm.rotation.z = Math.sin(t * 0.65 + p) * 0.025;
            fm.rotation.y = Math.sin(t * 0.25 + p) * 0.08;
          });
        }
        if (this.penguins) {
          this.penguins.forEach((pg) => {
            const p = pg.userData.phase;
            pg.position.y = pg.userData.baseY + Math.sin(t * 0.8 + p * 0.5) * 0.014;
            pg.rotation.z = Math.sin(t * 3.2 + p) * 0.11;
          });
        }
        if (this.meteors) {
          this.meteors.forEach((mm) => {
            const cycle = (t + mm.userData.offset) % 10.5;
            if (cycle < 1.35) {
              const p = cycle / 1.35;
              mm.position.set(-6.5 + p * 13.0, mm.userData.laneY - p * 2.2, mm.userData.laneZ);
              mm.material.opacity = Math.sin(p * Math.PI) * 0.85;
            } else {
              mm.material.opacity = 0.0;
            }
          });
        }
        if (this.reindeerList) {
          this.reindeerList.forEach((deer) => {
            const { neckPivot, phase, baseRy } = deer.userData;
            neckPivot.rotation.z = -0.1 + Math.sin(t * 0.85 + phase) * 0.14;
            deer.rotation.y = baseRy + Math.sin(t * 0.42 + phase) * 0.08;
          });
        }
        if (this.arcticFox) {
          this.arcticFox.fox.rotation.y = this.arcticFox.baseRy + Math.sin(t * 0.7) * 0.14;
          this.arcticFox.fTail.rotation.y = Math.sin(t * 2.2) * 0.18;
        }
        if (this.auroraLampLight && this.auroraLampMat) {
          const flicker = 1.0 + Math.sin(t * 7.3) * 0.08 + Math.cos(t * 13.1) * 0.05;
          this.auroraLampLight.intensity = 1.35 * flicker;
          this.auroraLampMat.emissiveIntensity = 1.45 * flicker;
        }
        if ((this.shieldVisible || this.magnetosphereGroup?.visible) && this.fieldCurves && this.solarWindAttr) {
          const resAlpha = this.shieldVisible ? 0.34 : Math.max(0.12, this.auroraResonance * 0.45);
          this.fieldArcMat.opacity = resAlpha + Math.sin(t * 2.2) * 0.1;
          const swSpeed = 0.32 + this.auroraResonance * 0.38;
          for (let i = 0; i < this.solarWindCount; i++) {
            this.solarWindProg[i] = (this.solarWindProg[i] + dt * swSpeed) % 1.0;
            const curve = this.fieldCurves[i % this.fieldCurves.length];
            curve.getPoint(this.solarWindProg[i], _vA);
            this.solarWindPos[i * 3] = _vA.x + Math.sin(t * 6.0 + i) * 0.08;
            this.solarWindPos[i * 3 + 1] = _vA.y + Math.cos(t * 6.0 + i) * 0.08;
            this.solarWindPos[i * 3 + 2] = _vA.z;
          }
          this.solarWindAttr.needsUpdate = true;
        }
      },
      remove: function () {
        tactileTouchFX.unregisterInteractiveSurface(this.auroraFloorMesh);
        this.el.sceneEl?.removeEventListener('aurora-magnetic-pulse', this.onAuroraShield);
        this.el.sceneEl?.removeEventListener('aurora-toggle-shield', this.onAuroraShield);
        this.el.sceneEl?.removeEventListener('aurora-conductor-sweep', this.onConductorSweep);
        window.removeEventListener('pointermove', this.onAuroraPointerMove);
        this.el.removeObject3D('mesh');
        this.disposables?.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 2. L-System Ancient Rainforest Tree (Bark PBR Normal Map + Wet-Leaf Rain Sheen)
   */
  if (!AFRAME.components['lsystem-ancient-tree']) {
    AFRAME.registerComponent('lsystem-ancient-tree', {
      schema: {
        iterations: { type: 'int', default: 4 },
        height: { type: 'number', default: 0.95 },
        seedOffset: { type: 'number', default: 0 }
      },

      init: function () {
        const group = new THREE.Group();
        this.disposables = [];
        const barkPBR = getBiomePBRTextures('bark', 4, 4);

        const branches = [];
        const leafPositions = [];

        const growBranch = (origin, dir, len, radius, depth) => {
          const end = origin.clone().addScaledVector(dir, len);
          branches.push({ origin: origin.clone(), end, radius });
          if (depth <= 1) {
            leafPositions.push(end.clone());
            return;
          }
          const childCount = depth >= 3 ? 3 : 2;
          for (let c = 0; c < childCount; c++) {
            const az = (c / childCount) * Math.PI * 2 + depth * 1.1 + this.data.seedOffset;
            const spread = 0.46 + (depth % 2) * 0.14;
            const nextDir = dir
              .clone()
              .add(new THREE.Vector3(Math.cos(az) * spread, 0.25, Math.sin(az) * spread))
              .normalize();
            growBranch(end, nextDir, len * 0.72, radius * 0.64, depth - 1);
          }
        };

        growBranch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), this.data.height, 0.14, this.data.iterations);

        const segGeo = new THREE.CylinderGeometry(0.68, 1.0, 1, 7);
        const barkMat = new THREE.MeshStandardMaterial({
          color: '#5C3A21',
          normalMap: barkPBR.normalMap,
          normalScale: new THREE.Vector2(1.1, 1.1),
          roughness: 0.88,
          metalness: 0.04
        });
        const trunkMesh = new THREE.InstancedMesh(segGeo, barkMat, branches.length);
        const up = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion();
        const mid = new THREE.Vector3();
        const diff = new THREE.Vector3();

        branches.forEach((b, idx) => {
          mid.addVectors(b.origin, b.end).multiplyScalar(0.5);
          diff.subVectors(b.end, b.origin);
          const len = diff.length();
          q.setFromUnitVectors(up, diff.normalize());
          _dummy.position.copy(mid);
          _dummy.quaternion.copy(q);
          _dummy.scale.set(b.radius, len, b.radius);
          _dummy.updateMatrix();
          trunkMesh.setMatrixAt(idx, _dummy.matrix);
        });
        trunkMesh.instanceMatrix.needsUpdate = true;
        group.add(trunkMesh);
        this.disposables.push(segGeo, barkMat);

        // Natural layered tropical broadleaf foliage clusters
        const leafGeo = new THREE.SphereGeometry(0.34, 10, 8);
        leafGeo.scale(1.25, 0.45, 1.15);
        this.leafMat = createForestCanopySwayMaterial({
          baseColor: '#10B981',
          emissiveColor: '#059669',
          windStrength: 0.085
        });
        this.targetWetness = 0.0;
        this.swayElapsed = 0;

        const leafMesh = new THREE.InstancedMesh(leafGeo, this.leafMat, leafPositions.length);
        leafPositions.forEach((p, idx) => {
          _dummy.position.copy(p);
          _dummy.rotation.set(idx * 0.4, idx * 0.8, 0);
          _dummy.scale.setScalar(0.88 + (idx % 3) * 0.25);
          _dummy.updateMatrix();
          leafMesh.setMatrixAt(idx, _dummy.matrix);
        });
        leafMesh.instanceMatrix.needsUpdate = true;
        group.add(leafMesh);
        this.disposables.push(leafGeo, this.leafMat);

        this.el.setObject3D('mesh', group);

        this.onRain = (evt) => {
          const wet = Boolean(evt.detail?.active);
          this.targetWetness = wet ? 1.0 : 0.0;
        };
        this.el.sceneEl?.addEventListener('rainforest-rain-state', this.onRain);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.leafMat?.uniforms) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.swayElapsed += dt;
        this.leafMat.uniforms.uTime.value = this.swayElapsed;
        this.leafMat.uniforms.uWetness.value = THREE.MathUtils.damp(
          this.leafMat.uniforms.uWetness.value,
          this.targetWetness,
          2.5,
          dt
        );
      },

      remove: function () {
        this.el.sceneEl?.removeEventListener('rainforest-rain-state', this.onRain);
        this.el.removeObject3D('mesh');
        this.disposables?.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 3. Rainforest Floor Moss PBR + Rain-Unfurling Ferns & Blossoms (Biome 2)
   */
  if (!AFRAME.components['rainforest-floor-flora']) {
    AFRAME.registerComponent('rainforest-floor-flora', {
      init: function () {
        const group = new THREE.Group();
        this.disposables = [];
        this.bloomProgress = 0.18;
        this.bloomTarget = 0.18;
        const mossPBR = getBiomePBRTextures('moss', 12, 12);

        // Continuous 360-degree Rolling Emerald Rainforest Basin (no hard cut edges!)
        const getRainforestGroundY = (x, z) => {
          const dCam = Math.hypot(x, z - 0.5);
          const dRiver = Math.abs(x - 0.85);
          const clearing = THREE.MathUtils.smoothstep(dCam, 4.5, 11.5) * THREE.MathUtils.smoothstep(dRiver, 1.8, 3.8);
          const rim = THREE.MathUtils.smoothstep(Math.hypot(x, z), 16.0, 52.0);
          return (fbm2D(x * 0.09 + 2, z * 0.09 + 5, 3) * 1.8 + 0.3) * clearing + rim * (2.5 + fbm2D(x * 0.06, z * 0.06, 3) * 5.0);
        };
        const mossGeo = new THREE.PlaneGeometry(145, 145, 96, 96);
        mossGeo.rotateX(-Math.PI / 2);
        const mPos = mossGeo.attributes.position;
        for (let i = 0; i < mPos.count; i++) {
          const x = mPos.getX(i);
          const z = mPos.getZ(i);
          mPos.setY(i, getRainforestGroundY(x, z));
        }
        mossGeo.computeVertexNormals();
        const mossMat = new THREE.MeshStandardMaterial({
          color: '#15803D',
          emissive: '#065F46',
          emissiveIntensity: 0.34,
          normalMap: mossPBR.normalMap,
          normalScale: new THREE.Vector2(0.85, 0.85),
          roughness: 0.82
        });
        this.mossFloorMesh = new THREE.Mesh(mossGeo, mossMat);
        group.add(this.mossFloorMesh);
        this.disposables.push(mossGeo, mossMat);
        tactileTouchFX.registerInteractiveSurface(this.mossFloorMesh, {
          biomeId: 'rainforest',
          specimenKey: 'rainforest-moss-floor',
          materials: [mossMat]
        });

        // Mossy Sculpted Waterfall Rock Cliff behind the cascading Amazon waterfall
        const cliffGeo = new THREE.SphereGeometry(1.45, 14, 10);
        cliffGeo.scale(1.5, 2.2, 0.9);
        const cliffMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.88 });
        const mossRockGeo = new THREE.SphereGeometry(1.1, 10, 8);
        mossRockGeo.scale(1.4, 0.7, 1.0);
        [
          { x: 1.35, y: 1.8, z: -5.85, s: 1.05 },
          { x: 0.25, y: 1.2, z: -5.9, s: 0.85 },
          { x: 2.35, y: 1.4, z: -5.65, s: 0.9 }
        ].forEach((rc) => {
          const rock = new THREE.Mesh(cliffGeo, cliffMat);
          rock.position.set(rc.x, rc.y, rc.z);
          rock.scale.setScalar(rc.s);
          const cap = new THREE.Mesh(mossRockGeo, mossMat);
          cap.position.set(rc.x, rc.y + 1.4 * rc.s, rc.z);
          cap.scale.setScalar(rc.s);
          group.add(rock, cap);
        });
        this.disposables.push(cliffGeo, cliffMat, mossRockGeo);

        // Buttress Roots anchoring the foreground emergent giant trees into the forest floor
        const buttressGeo = new THREE.CylinderGeometry(0.06, 0.28, 1.05, 5);
        buttressGeo.scale(1.0, 1.0, 0.32);
        const buttressMat = new THREE.MeshStandardMaterial({ color: '#5C3A21', roughness: 0.9 });
        [
          { x: -2.35, z: -3.8 },
          { x: 2.45, z: -4.2 },
          { x: -0.25, z: -5.9 }
        ].forEach((treePos) => {
          for (let b = 0; b < 4; b++) {
            const ang = (b / 4) * Math.PI * 2 + 0.4;
            const fin = new THREE.Mesh(buttressGeo, buttressMat);
            fin.position.set(treePos.x + Math.cos(ang) * 0.22, 0.48, treePos.z + Math.sin(ang) * 0.22);
            fin.rotation.y = -ang;
            fin.rotation.z = 0.22;
            group.add(fin);
          }
        });
        this.disposables.push(buttressGeo, buttressMat);

        // Dense 360-degree Surrounding Rainforest Tree & Palm Grove grounded via getRainforestGroundY
        const jungleTrunkGeo = new THREE.CylinderGeometry(0.11, 0.18, 4.2, 7);
        jungleTrunkGeo.translate(0, 2.1, 0);
        const jungleTrunkMat = new THREE.MeshStandardMaterial({ color: '#5C3A21', roughness: 0.9 });
        const jungleCrownGeo = new THREE.SphereGeometry(1.35, 10, 8);
        jungleCrownGeo.scale(1.45, 0.62, 1.45);
        const jungleCrownMat = new THREE.MeshStandardMaterial({
          color: '#10B981',
          emissive: '#065F46',
          emissiveIntensity: 0.28,
          roughness: 0.72
        });
        const jCount = 52;
        const jTrunks = new THREE.InstancedMesh(jungleTrunkGeo, jungleTrunkMat, jCount);
        const jCrowns = new THREE.InstancedMesh(jungleCrownGeo, jungleCrownMat, jCount * 2);
        let cIdx = 0;
        for (let i = 0; i < jCount; i++) {
          const ang = (i / jCount) * Math.PI * 2 + (i % 3) * 0.18;
          const r = 6.5 + (i % 6) * 4.2;
          const x = Math.cos(ang) * r;
          const z = -1.5 + Math.sin(ang) * r;
          const s = 0.85 + (i % 4) * 0.35;
          const groundY = Math.max(-0.05, getRainforestGroundY(x, z) - 0.15);

          _dummy.position.set(x, groundY, z);
          _dummy.rotation.set(0, i * 0.8, 0);
          _dummy.scale.setScalar(s);
          _dummy.updateMatrix();
          jTrunks.setMatrixAt(i, _dummy.matrix);

          _dummy.position.set(x, groundY + 3.8 * s, z);
          _dummy.scale.setScalar(s);
          _dummy.updateMatrix();
          jCrowns.setMatrixAt(cIdx++, _dummy.matrix);

          _dummy.position.set(x + 0.65 * s, groundY + 4.4 * s, z - 0.5 * s);
          _dummy.scale.setScalar(s * 0.78);
          _dummy.updateMatrix();
          jCrowns.setMatrixAt(cIdx++, _dummy.matrix);
        }
        jTrunks.instanceMatrix.needsUpdate = true;
        jCrowns.instanceMatrix.needsUpdate = true;
        group.add(jTrunks, jCrowns);
        this.disposables.push(jungleTrunkGeo, jungleTrunkMat, jungleCrownGeo, jungleCrownMat);

        this.fernCount = 44;
        const frondGeo = new THREE.ConeGeometry(0.08, 0.48, 5);
        frondGeo.translate(0, 0.24, 0);
        const frondMat = new THREE.MeshStandardMaterial({
          color: '#34D399',
          emissive: '#10B981',
          emissiveIntensity: 0.68
        });
        this.fernMesh = new THREE.InstancedMesh(frondGeo, frondMat, this.fernCount * 5);

        // Realistic 5-Petal Tropical Orchid / Hibiscus Blossoms in joyful tropical colors
        const blossomGeo = new THREE.CylinderGeometry(0.015, 0.085, 0.035, 5);
        blossomGeo.rotateX(Math.PI / 2);
        const blossomMat = new THREE.MeshStandardMaterial({
          color: '#FFFFFF',
          emissive: '#F59E0B',
          emissiveIntensity: 0.42,
          roughness: 0.4
        });
        this.blossomMesh = new THREE.InstancedMesh(blossomGeo, blossomMat, this.fernCount);

        const bloomPalette = ['#FDE047', '#F472B6', '#FB7185', '#FBBF24'];
        this.fernOrigins = Array.from({ length: this.fernCount }, (_, i) => {
          const angle = (i / this.fernCount) * Math.PI * 2;
          const r = 1.6 + (i % 5) * 1.15;
          _color.set(bloomPalette[i % bloomPalette.length]);
          this.blossomMesh.setColorAt(i, _color);
          return { x: Math.cos(angle) * r, z: -1.8 + Math.sin(angle) * r * 0.85 };
        });
        if (this.blossomMesh.instanceColor) this.blossomMesh.instanceColor.needsUpdate = true;

        group.add(this.fernMesh, this.blossomMesh);
        this.disposables.push(frondGeo, frondMat, blossomGeo, blossomMat);

        // Floating Emerald Water-Lily Pads & Realistic Multi-Petal Lotus Blossoms (Nymphaea)
        const padGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.014, 16, 1, false, 0.15, Math.PI * 1.85);
        const padMat = new THREE.MeshStandardMaterial({
          color: '#16A34A',
          emissive: '#064E3B',
          emissiveIntensity: 0.25,
          roughness: 0.45
        });
        const lotusGeo = new THREE.SphereGeometry(0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.65);
        lotusGeo.scale(1.15, 0.75, 1.15);
        const lotusMat = new THREE.MeshStandardMaterial({
          color: '#F9A8D4',
          emissive: '#DB2777',
          emissiveIntensity: 0.55,
          roughness: 0.35,
          side: THREE.DoubleSide
        });
        this.lilyPads = [];
        [
          { x: 0.35, z: -1.85, s: 1.0, hasLotus: true },
          { x: 1.05, z: -2.4, s: 0.85, hasLotus: false },
          { x: 0.6, z: -3.1, s: 1.15, hasLotus: true },
          { x: 1.35, z: -3.7, s: 0.9, hasLotus: true },
          { x: 0.25, z: -0.95, s: 0.78, hasLotus: false },
          { x: 1.1, z: -4.4, s: 1.05, hasLotus: true },
          { x: 0.5, z: -5.1, s: 0.88, hasLotus: false }
        ].forEach((lp, idx) => {
          const padGroup = new THREE.Group();
          const pad = new THREE.Mesh(padGeo, padMat);
          pad.rotation.y = idx * 1.25;
          padGroup.add(pad);
          if (lp.hasLotus) {
            const lotus = new THREE.Mesh(lotusGeo, lotusMat);
            lotus.position.set(0, 0.015, 0);
            padGroup.add(lotus);
          }
          padGroup.position.set(lp.x, 0.045, lp.z);
          padGroup.scale.setScalar(lp.s);
          padGroup.userData = { baseY: 0.045, phase: idx * 0.95 };
          group.add(padGroup);
          this.lilyPads.push(padGroup);
        });
        this.disposables.push(padGeo, padMat, lotusGeo, lotusMat);

        // Hanging Jungle Liana Vines gently framing the rainforest canopy
        const vineMat = new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.75 });
        this.vines = [];
        [
          { x: -1.75, z: -2.9, len: 2.2, p: 0.3 },
          { x: -2.65, z: -3.5, len: 2.6, p: 1.4 },
          { x: 2.1, z: -3.4, len: 2.3, p: 2.2 },
          { x: 2.85, z: -4.1, len: 2.5, p: 0.9 }
        ].forEach((vc) => {
          const vGeo = new THREE.CylinderGeometry(0.015, 0.022, vc.len, 5);
          vGeo.translate(0, -vc.len * 0.5, 0);
          const vm = new THREE.Mesh(vGeo, vineMat);
          vm.position.set(vc.x, 4.1, vc.z);
          vm.userData = { phase: vc.p };
          group.add(vm);
          this.vines.push(vm);
          this.disposables.push(vGeo);
        });
        this.disposables.push(vineMat);

        // Expanding rain splash ripple rings on the rainforest river surface during showers
        const rippleGeo = new THREE.RingGeometry(0.16, 0.22, 24);
        rippleGeo.rotateX(-Math.PI / 2);
        this.rainRipples = [];
        for (let r = 0; r < 8; r++) {
          const rMat = new THREE.MeshBasicMaterial({
            color: '#BAE6FD',
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            depthWrite: false
          });
          const rMesh = new THREE.Mesh(rippleGeo, rMat);
          rMesh.position.set(0.3 + (r % 3) * 0.55, 0.048, -1.6 - r * 0.48);
          rMesh.userData = { phase: r * 0.38 };
          group.add(rMesh);
          this.rainRipples.push(rMesh);
          this.disposables.push(rMat);
        }
        this.disposables.push(rippleGeo);
        this.rainRippleActive = false;

        this.mistGather = 0.0;
        this.lastSkyY = null;
        this.seededRainSent = false;
        this.lastMistHint = 0;

        this.el.setObject3D('mesh', group);
        this.updateFlora(0.18);

        this.onRain = (evt) => {
          const active = typeof evt.detail?.active === 'boolean' ? evt.detail.active : this.bloomTarget < 0.5;
          this.bloomTarget = active ? 1.0 : 0.18;
          this.rainRippleActive = active;
          if (!active) {
            this.seededRainSent = false;
            this.mistGather = 0.0;
          }
        };
        this.onSkySweep = (e) => {
          if (window.tabsirahActiveBiome !== 'rainforest') return;
          const h = window.innerHeight || 720;
          if (this.bloomTarget > 0.8) {
            this.lastSkyY = e.clientY;
            return;
          }
          if (e.clientY < h * 0.56 && this.lastSkyY !== null) {
            const dy = this.lastSkyY - e.clientY;
            if (dy > 5 && dy < 140) {
              this.mistGather = Math.min(1.0, this.mistGather + dy * 0.0068);
              const now = performance.now();
              if (this.mistGather >= 1.0 && !this.seededRainSent) {
                this.seededRainSent = true;
                this.el.sceneEl?.emit('biome-gesture-rain', {}, false);
                window.dispatchEvent(
                  new CustomEvent('tabsirah-wonder-progress', {
                    detail: { message: 'Mist gathered! Warm rain awakened the orchids & Morpho butterflies.' }
                  })
                );
              } else if (now - this.lastMistHint > 450 && this.mistGather > 0.15) {
                this.lastMistHint = now;
                window.dispatchEvent(
                  new CustomEvent('tabsirah-wonder-progress', {
                    detail: { message: `Cloud-Seeding Mist: ${Math.round(this.mistGather * 100)}% — sweep upward!` }
                  })
                );
              }
            }
          }
          this.lastSkyY = e.clientY;
        };

        this.el.sceneEl?.addEventListener('rainforest-rain-state', this.onRain);
        window.addEventListener('pointermove', this.onSkySweep);
      },

      updateFlora: function (p) {
        let idx = 0;
        this.fernOrigins.forEach((o, fIdx) => {
          for (let petal = 0; petal < 5; petal++) {
            const az = (petal / 5) * Math.PI * 2 + fIdx * 0.4;
            _dummy.position.set(o.x, 0.02, o.z);
            _dummy.rotation.set(Math.cos(az) * (0.25 + p * 0.65), az, Math.sin(az) * (0.25 + p * 0.65));
            _dummy.scale.setScalar(0.35 + p * 0.85);
            _dummy.updateMatrix();
            this.fernMesh.setMatrixAt(idx++, _dummy.matrix);
          }
          _dummy.position.set(o.x, 0.08 + p * 0.36, o.z);
          _dummy.rotation.set(0, p * 2.5 + fIdx, 0);
          _dummy.scale.setScalar(0.15 + p * 1.15);
          _dummy.updateMatrix();
          this.blossomMesh.setMatrixAt(fIdx, _dummy.matrix);
        });
        this.fernMesh.instanceMatrix.needsUpdate = true;
        this.blossomMesh.instanceMatrix.needsUpdate = true;
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        const t = time * 0.001 * scale;
        if (Math.abs(this.bloomTarget - this.bloomProgress) > 0.002) {
          this.bloomProgress = THREE.MathUtils.damp(this.bloomProgress, this.bloomTarget, 2.2, dt);
          this.updateFlora(this.bloomProgress);
        }
        if (this.vines) {
          this.vines.forEach((vm) => {
            vm.rotation.z = Math.sin(t * 0.9 + vm.userData.phase) * 0.06;
          });
        }
        if (this.lilyPads) {
          this.lilyPads.forEach((pg) => {
            const p = pg.userData.phase;
            pg.position.y = pg.userData.baseY + Math.sin(t * 1.35 + p) * 0.008;
            pg.rotation.z = Math.sin(t * 1.1 + p) * 0.035;
          });
        }
        if (this.rainRipples) {
          this.rainRipples.forEach((rm) => {
            if (!this.rainRippleActive) {
              rm.material.opacity = THREE.MathUtils.damp(rm.material.opacity, 0.0, 4.0, dt);
              return;
            }
            const cycle = (t * 0.85 + rm.userData.phase) % 1.0;
            const s = 0.4 + cycle * 2.2;
            rm.scale.setScalar(s);
            rm.material.opacity = (1.0 - cycle) * 0.52;
          });
        }
      },

      remove: function () {
        tactileTouchFX.unregisterInteractiveSurface(this.mossFloorMesh);
        this.el.sceneEl?.removeEventListener('rainforest-rain-state', this.onRain);
        window.removeEventListener('pointermove', this.onSkySweep);
        this.el.removeObject3D('mesh');
        this.disposables?.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 4. Rainforest Morpho Butterflies (24 Animated Wing-Flapping Blue & Emerald Morphos)
   */
  if (!AFRAME.components['rainforest-wildlife-system']) {
    AFRAME.registerComponent('rainforest-wildlife-system', {
      init: function () {
        const group = new THREE.Group();
        this.disposables = [];
        this.count = 24;

        const wingGeo = new THREE.PlaneGeometry(0.085, 0.11);
        wingGeo.translate(0.042, 0, 0);
        wingGeo.rotateX(-Math.PI / 2);

        const wingMat = new THREE.MeshStandardMaterial({
          color: '#38BDF8',
          emissive: '#0284C7',
          emissiveIntensity: 0.72,
          roughness: 0.25,
          metalness: 0.35,
          side: THREE.DoubleSide
        });

        this.leftWings = new THREE.InstancedMesh(wingGeo, wingMat, this.count);
        this.rightWings = new THREE.InstancedMesh(wingGeo, wingMat, this.count);

        this.butterflies = Array.from({ length: this.count }, (_, i) => {
          const isEmerald = i % 3 === 0;
          _color.set(isEmerald ? '#34D399' : '#38BDF8');
          this.leftWings.setColorAt(i, _color);
          this.rightWings.setColorAt(i, _color);
          return {
            cx: (Math.random() - 0.5) * 4.4,
            cy: 1.0 + Math.random() * 1.8,
            cz: -1.8 - Math.random() * 3.4,
            rx: 0.45 + Math.random() * 0.7,
            rz: 0.45 + Math.random() * 0.7,
            speed: 0.6 + Math.random() * 0.6,
            flapFreq: 7.5 + Math.random() * 4.0,
            phase: Math.random() * Math.PI * 2
          };
        });
        if (this.leftWings.instanceColor) this.leftWings.instanceColor.needsUpdate = true;
        if (this.rightWings.instanceColor) this.rightWings.instanceColor.needsUpdate = true;

        group.add(this.leftWings, this.rightWings);
        this.disposables.push(wingGeo, wingMat);

        // 4 Realistic Scarlet Macaws gliding gracefully above the sunlit rainforest canopy
        const macawBodyGeo = new THREE.SphereGeometry(0.055, 10, 8);
        macawBodyGeo.scale(1.0, 0.9, 2.35);
        const macawBodyMat = new THREE.MeshStandardMaterial({
          color: '#EF4444',
          emissive: '#B91C1C',
          emissiveIntensity: 0.28,
          roughness: 0.42
        });
        const macawTailGeo = new THREE.ConeGeometry(0.025, 0.24, 6);
        macawTailGeo.rotateX(-Math.PI / 2);
        macawTailGeo.translate(0, 0, -0.2);
        const macawBeakGeo = new THREE.ConeGeometry(0.022, 0.065, 6);
        macawBeakGeo.rotateX(Math.PI / 2);
        macawBeakGeo.translate(0, 0, 0.145);
        const macawBeakMat = new THREE.MeshStandardMaterial({ color: '#FDE047', roughness: 0.35 });
        const macawWingGeo = new THREE.SphereGeometry(0.14, 8, 6);
        macawWingGeo.scale(1.35, 0.08, 0.46);
        macawWingGeo.translate(0.16, 0, 0);
        const macawWingMat = new THREE.MeshStandardMaterial({
          color: '#F59E0B',
          emissive: '#B45309',
          emissiveIntensity: 0.25,
          roughness: 0.45
        });
        this.macaws = [];
        for (let m = 0; m < 4; m++) {
          const bird = new THREE.Group();
          const body = new THREE.Mesh(macawBodyGeo, macawBodyMat);
          const tail = new THREE.Mesh(macawTailGeo, macawBodyMat);
          const beak = new THREE.Mesh(macawBeakGeo, macawBeakMat);
          const rw = new THREE.Mesh(macawWingGeo, macawWingMat);
          const lw = new THREE.Mesh(macawWingGeo, macawWingMat);
          lw.scale.x = -1;
          bird.add(body, tail, beak, rw, lw);
          bird.userData = {
            rw,
            lw,
            radius: 2.2 + (m % 2) * 0.9,
            y: 2.75 + (m % 3) * 0.32,
            speed: 0.38 + m * 0.04,
            phase: (m / 4) * Math.PI * 2
          };
          group.add(bird);
          this.macaws.push(bird);
        }
        this.disposables.push(macawBodyGeo, macawBodyMat, macawTailGeo, macawBeakGeo, macawBeakMat, macawWingGeo, macawWingMat);

        this.attractTarget = new THREE.Vector3(0, 1.45, -2.5);
        this.attractActive = false;
        this.rainAwakened = false;

        this.onRainState = (evt) => {
          this.rainAwakened = Boolean(evt.detail?.active);
        };
        this.onPointerMove = (e) => {
          if (window.tabsirahActiveBiome !== 'rainforest') return;
          const w = window.innerWidth || 1280;
          const h = window.innerHeight || 720;
          const nx = (e.clientX / w) * 2 - 1;
          const ny = 1 - (e.clientY / h) * 2;
          this.attractTarget.set(nx * 2.4, THREE.MathUtils.clamp(1.5 + ny * 0.85, 0.7, 2.55), -2.5);
          this.attractActive = true;
        };
        this.el.sceneEl?.addEventListener('rainforest-rain-state', this.onRainState);
        window.addEventListener('pointermove', this.onPointerMove);

        this.el.setObject3D('mesh', group);
      },

      tick: function (time) {
        const t = time * 0.001 * (window.tabsirahTimeScale || 1.0);
        if (this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode')) {
          const rh = document.getElementById('right-hand');
          if (rh?.object3D && rh.object3D.position.lengthSq() > 0.001) {
            rh.object3D.getWorldPosition(this.attractTarget);
            this.attractActive = true;
          }
        }
        const followWeight = this.rainAwakened ? 0.58 : (this.attractActive ? 0.24 : 0.0);

        for (let i = 0; i < this.count; i++) {
          const b = this.butterflies[i];
          const ang = t * b.speed + b.phase;
          const baseCx = THREE.MathUtils.lerp(b.cx, this.attractTarget.x, followWeight);
          const baseCy = THREE.MathUtils.lerp(b.cy, this.attractTarget.y, followWeight);
          const baseCz = THREE.MathUtils.lerp(b.cz, this.attractTarget.z, followWeight);
          const x = baseCx + Math.cos(ang) * b.rx;
          const z = baseCz + Math.sin(ang * 1.2) * b.rz;
          const y = baseCy + Math.sin(ang * 2.4) * 0.24;
          const heading = Math.atan2(-Math.cos(ang * 1.2) * b.rz, -Math.sin(ang) * b.rx);
          const flap = Math.sin(t * b.flapFreq + b.phase) * 0.95;

          _dummy.position.set(x, y, z);
          _dummy.rotation.set(0, heading, flap);
          _dummy.scale.setScalar(1);
          _dummy.updateMatrix();
          this.rightWings.setMatrixAt(i, _dummy.matrix);

          _dummy.rotation.set(0, heading + Math.PI, flap);
          _dummy.updateMatrix();
          this.leftWings.setMatrixAt(i, _dummy.matrix);
        }
        this.leftWings.instanceMatrix.needsUpdate = true;
        this.rightWings.instanceMatrix.needsUpdate = true;

        if (this.macaws) {
          this.macaws.forEach((bird) => {
            const { rw, lw, radius, y, speed, phase } = bird.userData;
            const a = t * speed + phase;
            const x = Math.cos(a) * radius;
            const z = -3.8 + Math.sin(a) * radius * 0.72;
            bird.position.set(x, y + Math.sin(a * 2) * 0.14, z);
            bird.rotation.y = Math.atan2(-Math.sin(a) * radius, Math.cos(a) * radius * 0.72);
            const wingBeat = Math.sin(t * 5.2 + phase) * 0.45;
            rw.rotation.z = wingBeat;
            lw.rotation.z = -wingBeat;
          });
        }
      },

      remove: function () {
        this.el.sceneEl?.removeEventListener('rainforest-rain-state', this.onRainState);
        window.removeEventListener('pointermove', this.onPointerMove);
        this.el.removeObject3D('mesh');
        this.disposables?.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 5. Unified Particle Weather Engine (Rain, Snow, Waterfall, Alpine Mist, & Sahara Sand-Drift)
   */
  if (!AFRAME.components['particle-weather-system']) {
    AFRAME.registerComponent('particle-weather-system', {
      schema: {
        mode: { type: 'string', default: 'snow' }, // 'snow' | 'rain' | 'waterfall' | 'mist' | 'sand-drift'
        count: { type: 'int', default: 280 },
        active: { type: 'boolean', default: true }
      },

      init: function () {
        const c = this.data.count;
        this.positions = new Float32Array(c * 3);
        this.speeds = new Float32Array(c);

        for (let i = 0; i < c; i++) {
          if (this.data.mode === 'waterfall') {
            this.positions[i * 3] = (Math.random() - 0.5) * 1.15;
            this.positions[i * 3 + 1] = Math.random() * 3.6;
            this.positions[i * 3 + 2] = (Math.random() - 0.5) * 0.45;
            this.speeds[i] = 2.4 + Math.random() * 1.2;
          } else if (this.data.mode === 'mist') {
            this.positions[i * 3] = (Math.random() - 0.5) * 14;
            this.positions[i * 3 + 1] = (Math.random() - 0.5) * 0.65;
            this.positions[i * 3 + 2] = -1 - Math.random() * 7;
            this.speeds[i] = 0.25 + Math.random() * 0.35;
          } else if (this.data.mode === 'sand-drift') {
            this.positions[i * 3] = (Math.random() - 0.5) * 14;
            this.positions[i * 3 + 1] = 0.1 + Math.random() * 1.3;
            this.positions[i * 3 + 2] = -0.8 - Math.random() * 7.2;
            this.speeds[i] = 1.1 + Math.random() * 1.3;
          } else {
            this.positions[i * 3] = (Math.random() - 0.5) * 10;
            this.positions[i * 3 + 1] = Math.random() * 4.5;
            this.positions[i * 3 + 2] = -0.5 - Math.random() * 7;
            this.speeds[i] = this.data.mode === 'rain' ? 3.4 + Math.random() * 1.6 : 0.45 + Math.random() * 0.45;
          }
        }

        this.geo = new THREE.BufferGeometry();
        this.posAttr = new THREE.BufferAttribute(this.positions, 3);
        this.geo.setAttribute('position', this.posAttr);
        this.tex = createSoftGlowSprite();

        const isMist = this.data.mode === 'mist';
        const isSand = this.data.mode === 'sand-drift';
        this.mat = new THREE.PointsMaterial({
          size: isMist ? 0.35 : isSand ? 0.065 : this.data.mode === 'waterfall' ? 0.14 : 0.08,
          map: this.tex,
          color:
            this.data.mode === 'rain'
              ? '#7DD3FC'
              : this.data.mode === 'waterfall'
                ? '#BAE6FD'
                : isSand
                  ? '#FDE68A'
                  : '#E2E8F0',
          transparent: true,
          opacity: this.data.active ? (isMist ? 0.22 : isSand ? 0.42 : 0.82) : 0.0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        this.el.setObject3D('mesh', new THREE.Points(this.geo, this.mat));
        this.targetOpacity = this.data.active ? (isMist ? 0.22 : isSand ? 0.42 : 0.82) : 0.0;
      },

      update: function () {
        if (!this.mat) return;
        const isMist = this.data.mode === 'mist';
        const isSand = this.data.mode === 'sand-drift';
        this.targetOpacity = this.data.active ? (isMist ? 0.22 : isSand ? 0.42 : 0.82) : 0.0;
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.mat.opacity = THREE.MathUtils.damp(this.mat.opacity, this.targetOpacity, 4.0, dt);
        if (this.mat.opacity < 0.01) return;

        const c = this.data.count;
        const pos = this.positions;
        const mode = this.data.mode;

        for (let i = 0; i < c; i++) {
          if (mode === 'mist' || mode === 'sand-drift') {
            pos[i * 3] += this.speeds[i] * dt;
            if (mode === 'sand-drift') {
              pos[i * 3 + 1] += Math.sin(time * 0.002 + i) * 0.12 * dt;
            }
            if (pos[i * 3] > 7) pos[i * 3] = -7;
          } else {
            pos[i * 3 + 1] -= this.speeds[i] * dt;
            if (mode === 'snow') {
              pos[i * 3] += Math.sin(time * 0.001 + i) * 0.18 * dt;
            }
            if (pos[i * 3 + 1] < 0) {
              pos[i * 3 + 1] = mode === 'waterfall' ? 3.6 : 4.5;
            }
          }
        }
        this.posAttr.needsUpdate = true;
      },

      remove: function () {
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
        this.tex?.dispose();
      }
    });
  }

  /**
   * 6. Sunlit Coral Cathedral + Coral PBR + Swaying Kelp + Gliding Manta Ray + Boids + Bubbles (Biome 3)
   */
  if (!AFRAME.components['coral-cathedral-ecosystem']) {
    AFRAME.registerComponent('coral-cathedral-ecosystem', {
      init: function () {
        const group = new THREE.Group();
        this.disposables = [];
        const coralPBR = getBiomePBRTextures('coral', 5, 5);

        // A. Brain Coral Mounds with Sinusoidal Sulcus Ridges + Coral PBR Normal Map
        const brainGeo = new THREE.SphereGeometry(0.55, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.56);
        const bPos = brainGeo.attributes.position;
        for (let i = 0; i < bPos.count; i++) {
          const x = bPos.getX(i);
          const y = bPos.getY(i);
          const z = bPos.getZ(i);
          const groove = Math.sin(x * 18 + Math.cos(z * 14) * 2.2) * Math.cos(z * 18 + Math.sin(x * 14) * 2.2);
          const bump = 1 + groove * 0.075;
          bPos.setXYZ(i, x * bump, y * bump, z * bump);
        }
        brainGeo.computeVertexNormals();
        const brainMat = new THREE.MeshStandardMaterial({
          color: '#2DD4BF',
          emissive: '#0F766E',
          emissiveIntensity: 0.45,
          normalMap: coralPBR.normalMap,
          normalScale: new THREE.Vector2(0.9, 0.9),
          roughness: 0.48
        });
        [
          { x: -1.65, z: -2.9, s: 1.15 },
          { x: 1.55, z: -3.2, s: 0.95 },
          { x: 0.25, z: -4.2, s: 1.35 },
          { x: -4.8, z: 1.5, s: 1.4 },
          { x: 4.5, z: 1.8, s: 1.3 },
          { x: 0.8, z: 4.2, s: 1.25 },
          { x: -5.4, z: -4.5, s: 1.6 },
          { x: 5.8, z: -4.8, s: 1.5 }
        ].forEach((m) => {
          const mesh = new THREE.Mesh(brainGeo, brainMat);
          mesh.position.set(m.x, 0.05, m.z);
          mesh.scale.setScalar(m.s);
          group.add(mesh);
        });
        this.disposables.push(brainGeo, brainMat);

        // B. Procedural Staghorn Coral Antler Branches circling the 360-degree reef
        const hornGeo = new THREE.CylinderGeometry(0.025, 0.055, 0.45, 6);
        const hornMat = new THREE.MeshStandardMaterial({
          color: '#FB7185',
          emissive: '#BE123C',
          emissiveIntensity: 0.52,
          roughness: 0.45
        });
        const stagPos = [];
        const addCoralBranch = (origin, dir, len, depth) => {
          const end = origin.clone().addScaledVector(dir, len);
          stagPos.push({ origin: origin.clone(), end });
          if (depth <= 1) return;
          for (let b = 0; b < 2; b++) {
            const ang = (b === 0 ? 1 : -1) * 0.55 + depth * 0.7;
            const nDir = dir.clone().add(new THREE.Vector3(Math.cos(ang) * 0.6, 0.35, Math.sin(ang) * 0.6)).normalize();
            addCoralBranch(end, nDir, len * 0.75, depth - 1);
          }
        };
        [
          new THREE.Vector3(-2.4, 0, -3.7),
          new THREE.Vector3(2.2, 0, -2.5),
          new THREE.Vector3(-0.7, 0, -4.4),
          new THREE.Vector3(-4.2, 0, 1.4),
          new THREE.Vector3(4.1, 0, 1.8),
          new THREE.Vector3(0.4, 0, 4.6)
        ].forEach((base) => addCoralBranch(base, new THREE.Vector3(0, 1, 0), 0.42, 4));

        const stagMesh = new THREE.InstancedMesh(hornGeo, hornMat, stagPos.length);
        const up = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion();
        stagPos.forEach((seg, idx) => {
          _vA.addVectors(seg.origin, seg.end).multiplyScalar(0.5);
          _vB.subVectors(seg.end, seg.origin);
          const l = _vB.length();
          q.setFromUnitVectors(up, _vB.normalize());
          _dummy.position.copy(_vA);
          _dummy.quaternion.copy(q);
          _dummy.scale.set(1, l / 0.45, 1);
          _dummy.updateMatrix();
          stagMesh.setMatrixAt(idx, _dummy.matrix);
        });
        stagMesh.instanceMatrix.needsUpdate = true;
        group.add(stagMesh);
        this.disposables.push(hornGeo, hornMat);

        // B2. Composite Table / Plate Corals (Reef Symbiosis Restoration: start pale/bleached, touch 3/3 to restore)
        const tableStemGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.36, 8);
        const tablePlateGeo = new THREE.CylinderGeometry(0.46, 0.42, 0.06, 16);
        const tableCoralBaseMat = new THREE.MeshStandardMaterial({
          color: '#CBD5E1',
          emissive: '#475569',
          emissiveIntensity: 0.12,
          normalMap: coralPBR.normalMap,
          roughness: 0.48
        });
        const vibrantColors = ['#F59E0B', '#FB7185', '#22D3EE'];
        const vibrantEmissives = ['#B45309', '#BE123C', '#0E7490'];
        this.interactiveCorals = [];
        this.coralClusters = [];
        this.coralHitEntities = [];
        this.celebrationTimer = 0.0;
        this.coralGroup = group;
        this.lastCoralHandTouch = 0;

        tactileTouchFX.registerInteractiveSurface(group, {
          biomeId: 'ocean',
          specimenKey: 'coral-cathedral-reef',
          materials: [brainMat, hornMat]
        });

        this.restoreCoralCluster = (idx, evt = null, handPos = null) => {
          const cluster = this.coralClusters[idx];
          if (!cluster) return;
          this.coralPulse = 1.0;
          this.el.sceneEl?.emit('ocean-bubble-surge', {}, false);

          const { worldPoint, worldNormal } = evt
            ? tactileTouchFX.extractIntersection(evt, cluster.hitEl || this.el)
            : { worldPoint: null, worldNormal: null };
          const contactPt = worldPoint || cluster.worldCenter;
          const contactNorm =
            worldNormal ||
            (handPos
              ? handPos.clone().sub(cluster.worldCenter).normalize()
              : new THREE.Vector3(0, 1, 0));

          tactileTouchFX.trigger({
            el: cluster.hitEl || this.el,
            meshTarget: cluster.group,
            springTarget: cluster.group,
            worldPoint: contactPt,
            worldNormal: contactNorm,
            handPos,
            biomeId: 'ocean',
            specimenKey: `coral-cluster-${idx}`,
            materials: [cluster.mat]
          });

          if (!cluster.restored) {
            cluster.restored = true;
            cluster.mat.color.copy(cluster.vibrantColor);
            cluster.mat.emissive.copy(cluster.vibrantEmissive);
            cluster.mat.emissiveIntensity = 0.65;
            natureAudio.playAbyssalPing();
            const restoredCount = this.coralClusters.filter((c) => c.restored).length;
            if (restoredCount === this.coralClusters.length) {
              this.celebrationTimer = 7.0;
              natureAudio.playReefCelebration();
              window.dispatchEvent(
                new CustomEvent('tabsirah-wonder-progress', {
                  detail: { message: 'Reef Symbiosis Complete (3/3)! Golden zooxanthellae vibrancy restored!' }
                })
              );
              window.dispatchEvent(new CustomEvent('tabsirah-discovery-activated', { detail: { biomeId: 'ocean', source: 'reef-restored' } }));
            } else {
              window.dispatchEvent(
                new CustomEvent('tabsirah-wonder-progress', {
                  detail: { message: `Coral Cluster Restored (${restoredCount}/3) — touch remaining pale corals!` }
                })
              );
            }
          }
        };

        [
          { x: 0.65, z: -2.95, s: 1.0 },
          { x: -1.35, z: -3.85, s: 0.85 },
          { x: 2.35, z: -3.75, s: 1.1 }
        ].forEach((tc, tIdx) => {
          const clusterMat = tableCoralBaseMat.clone();
          const tcGroup = new THREE.Group();
          const stem = new THREE.Mesh(tableStemGeo, clusterMat);
          stem.position.y = 0.18;
          const plate1 = new THREE.Mesh(tablePlateGeo, clusterMat);
          plate1.position.y = 0.36;
          const plate2 = new THREE.Mesh(tablePlateGeo, clusterMat);
          plate2.position.set(0.14, 0.52, -0.06);
          plate2.scale.setScalar(0.68);
          tcGroup.add(stem, plate1, plate2);
          tcGroup.position.set(tc.x, 0.0, tc.z);
          tcGroup.scale.setScalar(tc.s);
          tcGroup.rotation.y = tIdx * 1.1;
          group.add(tcGroup);
          this.interactiveCorals.push(tcGroup);

          const worldCenter = new THREE.Vector3(tc.x, 0.38, tc.z);
          const hitEl = document.createElement('a-entity');
          hitEl.setAttribute('position', `${tc.x} 0.38 ${tc.z}`);
          hitEl.setAttribute('geometry', `primitive: sphere; radius: ${(0.56 * tc.s).toFixed(2)}`);
          hitEl.setAttribute('material', 'visible: false');
          hitEl.setAttribute('class', 'interactive-node vr-interactive');
          hitEl.dataset.tactileHandled = 'true';
          hitEl.dataset.specimenKey = `coral-cluster-${tIdx}`;

          this.coralClusters.push({
            group: tcGroup,
            hitEl,
            worldCenter,
            mat: clusterMat,
            vibrantColor: new THREE.Color(vibrantColors[tIdx % vibrantColors.length]),
            vibrantEmissive: new THREE.Color(vibrantEmissives[tIdx % vibrantEmissives.length]),
            restored: false
          });
          this.disposables.push(clusterMat);

          tactileTouchFX.registerInteractiveSurface(tcGroup, {
            biomeId: 'ocean',
            specimenKey: `coral-cluster-${tIdx}`,
            materials: [clusterMat],
            proximityTarget: true,
            proximityRadius: 0.42,
            proximityCenter: worldCenter,
            springTarget: tcGroup,
            springOptions: { liftAmount: 0.05, recoilAmount: 0.045, squashAmount: 0.12 }
          });

          const handler = (evt) => {
            evt?.stopPropagation?.();
            const hp = evt?.detail?.handPos
              ? new THREE.Vector3(evt.detail.handPos.x, evt.detail.handPos.y, evt.detail.handPos.z)
              : null;
            this.restoreCoralCluster(tIdx, evt, hp);
          };
          hitEl.addEventListener('click', handler);
          hitEl.addEventListener('pinchstarted', handler);
          this.el.appendChild(hitEl);
          this.coralHitEntities.push({ hitEl, handler });
        });
        this.disposables.push(tableStemGeo, tablePlateGeo, tableCoralBaseMat);

        requestAnimationFrame(() => {
          this.el.sceneEl?.components?.raycaster?.refreshObjects?.();
          document.getElementById('left-controller')?.components?.raycaster?.refreshObjects?.();
          document.getElementById('right-controller')?.components?.raycaster?.refreshObjects?.();
        });

        // B3. Clustered Violet & Amber Tube Sponges + Swaying Sea Anemones
        const spongeGeo = new THREE.CylinderGeometry(0.065, 0.048, 0.52, 10, 1, true);
        const spongeRimGeo = new THREE.TorusGeometry(0.064, 0.014, 6, 12);
        const spongeMat = new THREE.MeshStandardMaterial({
          color: '#A855F7',
          emissive: '#6B21A8',
          emissiveIntensity: 0.38,
          roughness: 0.52,
          side: THREE.DoubleSide
        });
        [
          { x: -0.95, z: -2.45 },
          { x: 1.45, z: -2.35 },
          { x: -2.85, z: -2.6 }
        ].forEach((sc) => {
          for (let t = 0; t < 4; t++) {
            const hScale = 0.65 + (t % 3) * 0.28;
            const ox = Math.cos(t * 1.6) * 0.11;
            const oz = Math.sin(t * 1.6) * 0.11;
            const tube = new THREE.Mesh(spongeGeo, spongeMat);
            tube.position.set(sc.x + ox, 0.26 * hScale, sc.z + oz);
            tube.scale.set(1, hScale, 1);
            tube.rotation.z = (t - 1.5) * 0.08;
            const rim = new THREE.Mesh(spongeRimGeo, spongeMat);
            rim.position.set(sc.x + ox, 0.52 * hScale, sc.z + oz);
            rim.rotation.x = Math.PI / 2;
            group.add(tube, rim);
          }
        });
        this.disposables.push(spongeGeo, spongeRimGeo, spongeMat);

        const anemBaseGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.14, 10);
        const anemTentacleGeo = new THREE.CylinderGeometry(0.008, 0.022, 0.26, 6);
        anemTentacleGeo.translate(0, 0.13, 0);
        const anemMat = new THREE.MeshStandardMaterial({
          color: '#F472B6',
          emissive: '#DB2777',
          emissiveIntensity: 0.55,
          roughness: 0.38
        });
        this.anemones = [];
        [
          { x: -0.35, z: -2.65 },
          { x: 0.85, z: -3.55 }
        ].forEach((ac, aIdx) => {
          const aGroup = new THREE.Group();
          aGroup.add(new THREE.Mesh(anemBaseGeo, anemMat));
          for (let k = 0; k < 12; k++) {
            const ang = (k / 12) * Math.PI * 2;
            const tent = new THREE.Mesh(anemTentacleGeo, anemMat);
            tent.position.set(Math.cos(ang) * 0.08, 0.06, Math.sin(ang) * 0.08);
            tent.rotation.set(Math.sin(ang) * 0.38, 0, -Math.cos(ang) * 0.38);
            aGroup.add(tent);
          }
          aGroup.position.set(ac.x, 0.06, ac.z);
          aGroup.userData = { phase: aIdx * 1.9 };
          group.add(aGroup);
          this.anemones.push(aGroup);
        });
        this.disposables.push(anemBaseGeo, anemTentacleGeo, anemMat);

        this.coralPulse = 0;
        this.coralBaseEmissive = brainMat;
        this.coralStagMat = hornMat;
        this.coralTableMat = tableCoralBaseMat;

        this.el.classList.add('interactive-node', 'vr-interactive');
        this.onCoralInteract = () => {
          const nextIdx = this.coralClusters.findIndex((c) => !c.restored);
          if (nextIdx >= 0) {
            this.restoreCoralCluster(nextIdx);
            return;
          }
          this.coralPulse = 1.0;
          this.el.sceneEl?.emit('ocean-bubble-surge', {}, false);
          window.dispatchEvent(new CustomEvent('tabsirah-discovery-activated', { detail: { biomeId: 'ocean', source: 'coral-click' } }));
        };
        this.el.addEventListener('click', this.onCoralInteract);
        this.el.addEventListener('pinchstarted', this.onCoralInteract);

        // C. Swaying Giant Kelp Fronds anchored in 360 degrees around the seabed
        this.kelpCount = 42;
        const kelpGeo = new THREE.PlaneGeometry(0.22, 2.2, 2, 10);
        kelpGeo.translate(0, 1.1, 0);
        const kelpMat = new THREE.MeshStandardMaterial({
          color: '#0D9488',
          emissive: '#064E3B',
          emissiveIntensity: 0.4,
          roughness: 0.5,
          side: THREE.DoubleSide
        });
        this.kelpMeshes = [];
        for (let k = 0; k < this.kelpCount; k++) {
          const km = new THREE.Mesh(kelpGeo, kelpMat);
          const ang = (k / this.kelpCount) * Math.PI * 2;
          const r = 3.8 + (k % 5) * 1.8;
          km.position.set(Math.cos(ang) * r, 0.0, -1.5 + Math.sin(ang) * r);
          km.rotation.y = k * 0.9;
          km.userData.phase = k * 0.7;
          group.add(km);
          this.kelpMeshes.push(km);
        }
        this.disposables.push(kelpGeo, kelpMat);

        // D. Graceful Gliding Manta Ray orbiting above the Coral Cathedral
        const mantaGeo = new THREE.PlaneGeometry(1.5, 0.9, 14, 6);
        mantaGeo.rotateX(-Math.PI / 2);
        const mPos = mantaGeo.attributes.position;
        this.mantaBaseY = new Float32Array(mPos.count);
        for (let i = 0; i < mPos.count; i++) {
          const x = mPos.getX(i);
          const z = mPos.getZ(i);
          // Taper wings toward tips and nose
          const span = Math.abs(x) / 0.75;
          mPos.setZ(i, z * (1 - span * 0.65) + span * 0.25);
          this.mantaBaseY[i] = mPos.getY(i);
        }
        mantaGeo.computeVertexNormals();
        this.mantaGeo = mantaGeo;
        const mantaMat = new THREE.MeshStandardMaterial({
          color: '#1E3A5F',
          emissive: '#0E7490',
          emissiveIntensity: 0.35,
          roughness: 0.35,
          side: THREE.DoubleSide
        });
        this.mantaMesh = new THREE.Mesh(mantaGeo, mantaMat);
        group.add(this.mantaMesh);
        this.disposables.push(mantaGeo, mantaMat);

        // D2. 2 Calm Swimming Green Sea Turtles with Rowing Flippers
        const shellGeo = new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
        shellGeo.scale(0.85, 0.5, 1.2);
        const shellMat = new THREE.MeshStandardMaterial({
          color: '#15803D',
          emissive: '#064E3B',
          emissiveIntensity: 0.35,
          roughness: 0.52
        });
        const flipperGeo = new THREE.SphereGeometry(0.14, 8, 6);
        flipperGeo.scale(1.1, 0.12, 0.42);
        flipperGeo.translate(0.13, 0, 0);
        const headGeo = new THREE.SphereGeometry(0.085, 8, 8);
        const skinMat = new THREE.MeshStandardMaterial({ color: '#4ADE80', roughness: 0.55 });
        this.seaTurtles = [];
        [
          { rx: 2.3, rz: 1.5, y: 1.55, speed: 0.22, phase: 0.4, sc: 1.0 },
          { rx: 2.9, rz: 1.8, y: 2.05, speed: 0.18, phase: 3.2, sc: 0.82 }
        ].forEach((tc) => {
          const turtle = new THREE.Group();
          const shell = new THREE.Mesh(shellGeo, shellMat);
          const head = new THREE.Mesh(headGeo, skinMat);
          head.position.set(0, 0.04, 0.34);
          const flR = new THREE.Mesh(flipperGeo, skinMat);
          flR.position.set(0.18, 0.02, 0.12);
          const flL = new THREE.Mesh(flipperGeo, skinMat);
          flL.position.set(-0.18, 0.02, 0.12);
          flL.scale.x = -1;
          const bR = new THREE.Mesh(flipperGeo, skinMat);
          bR.position.set(0.14, 0.01, -0.22);
          bR.scale.set(0.65, 1, 0.75);
          const bL = new THREE.Mesh(flipperGeo, skinMat);
          bL.position.set(-0.14, 0.01, -0.22);
          bL.scale.set(-0.65, 1, 0.75);
          turtle.add(shell, head, flR, flL, bR, bL);
          turtle.scale.setScalar(tc.sc);
          turtle.userData = { ...tc, flR, flL };
          group.add(turtle);
          this.seaTurtles.push(turtle);
        });
        this.disposables.push(shellGeo, shellMat, flipperGeo, headGeo, skinMat);

        // D3. 5 Realistic Translucent Moon Jellyfish (Aurelia aurita) with undulating oral arms
        const jBellGeo = new THREE.SphereGeometry(0.20, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
        const jBellMat = new THREE.MeshStandardMaterial({
          color: '#E0F2FE',
          emissive: '#0284C7',
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.58,
          roughness: 0.12,
          side: THREE.DoubleSide
        });
        const jGonadGeo = new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI * 1.4);
        const jGonadMat = new THREE.MeshStandardMaterial({
          color: '#E879F9',
          emissive: '#C026D3',
          emissiveIntensity: 0.65,
          transparent: true,
          opacity: 0.85
        });
        const jArmGeo = new THREE.CylinderGeometry(0.005, 0.002, 0.42, 4);
        jArmGeo.translate(0, -0.21, 0);
        const jArmMat = new THREE.MeshBasicMaterial({
          color: '#BAE6FD',
          transparent: true,
          opacity: 0.48
        });
        this.jellyfish = [];
        for (let j = 0; j < 5; j++) {
          const jf = new THREE.Group();
          const bell = new THREE.Mesh(jBellGeo, jBellMat);
          jf.add(bell);

          // 4 Horseshoe-shaped gastric pouches inside translucent bell
          for (let g = 0; g < 4; g++) {
            const gm = new THREE.Mesh(jGonadGeo, jGonadMat);
            const ga = (g / 4) * Math.PI * 2;
            gm.position.set(Math.cos(ga) * 0.065, 0.06, Math.sin(ga) * 0.06);
            gm.rotation.set(-Math.PI / 2, 0, ga);
            jf.add(gm);
          }

          // 8 Delicately trailing oral arms
          for (let tIdx = 0; tIdx < 8; tIdx++) {
            const ang = (tIdx / 8) * Math.PI * 2;
            const arm = new THREE.Mesh(jArmGeo, jArmMat);
            arm.position.set(Math.cos(ang) * 0.08, 0.02, Math.sin(ang) * 0.08);
            arm.rotation.set((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15);
            jf.add(arm);
          }

          jf.position.set((j - 2) * 1.15, 1.45 + (j % 3) * 0.42, -2.6 - (j % 3) * 0.85);
          jf.userData = { baseY: jf.position.y, phase: j * 1.4 };
          group.add(jf);
          this.jellyfish.push(jf);
        }
        this.disposables.push(jBellGeo, jBellMat, jGonadGeo, jGonadMat, jArmGeo, jArmMat);

        // E. 90 Realistic Tropical Reef Fish (Blue Tang, Yellow Tang & Clownfish) School
        this.fishCount = 90;
        // Sculpted anatomical fish: contoured ellipsoid body + dorsal fin + fan tail
        const fishBody = new THREE.SphereGeometry(0.065, 10, 8);
        fishBody.scale(0.38, 0.72, 1.35);
        const fishTail = new THREE.ConeGeometry(0.045, 0.11, 4);
        fishTail.rotateX(Math.PI / 2);
        fishTail.scale(0.2, 1.2, 1.0);
        fishTail.translate(0, 0, -0.11);
        const fishDorsal = new THREE.ConeGeometry(0.035, 0.09, 3);
        fishDorsal.scale(0.18, 1.0, 1.1);
        fishDorsal.translate(0, 0.06, 0.01);

        // Merge components into a single realistic fish geometry
        const fishGeo = new THREE.BufferGeometry();
        const posArr = [];
        const normArr = [];
        const addGeo = (g) => {
          const p = g.attributes.position;
          const n = g.attributes.normal;
          const idx = g.index;
          if (idx) {
            for (let k = 0; k < idx.count; k++) {
              const vi = idx.getX(k);
              posArr.push(p.getX(vi), p.getY(vi), p.getZ(vi));
              normArr.push(n.getX(vi), n.getY(vi), n.getZ(vi));
            }
          } else {
            for (let k = 0; k < p.count; k++) {
              posArr.push(p.getX(k), p.getY(k), p.getZ(k));
              normArr.push(n.getX(k), n.getY(k), n.getZ(k));
            }
          }
        };
        addGeo(fishBody);
        addGeo(fishTail);
        addGeo(fishDorsal);
        fishGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
        fishGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normArr, 3));

        const fishMat = new THREE.MeshStandardMaterial({
          color: '#F8FAFC',
          roughness: 0.28,
          metalness: 0.18
        });
        this.fishMesh = new THREE.InstancedMesh(fishGeo, fishMat, this.fishCount);
        this.fishMesh.frustumCulled = false;

        this.fishPos = [];
        this.fishVel = [];
        const tangBlue = new THREE.Color('#1D4ED8');
        const tangYellow = new THREE.Color('#FACC15');
        const clownOrange = new THREE.Color('#EA580C');
        const coralCyan = new THREE.Color('#06B6D4');

        for (let i = 0; i < this.fishCount; i++) {
          const a = (i / this.fishCount) * Math.PI * 2;
          const r = 1.4 + (i % 5) * 0.35;
          this.fishPos.push(new THREE.Vector3(Math.cos(a) * r, 1.4 + Math.sin(i) * 0.5, -3.1 + Math.sin(a) * r));
          this.fishVel.push(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(1.1));

          // Natural species variety: 45% Yellow Tangs, 35% Blue Tangs, 20% Clownfish
          const sp = i % 10;
          if (sp < 4) _color.copy(tangYellow);
          else if (sp < 7) _color.copy(tangBlue);
          else if (sp < 9) _color.copy(clownOrange);
          else _color.copy(coralCyan);
          this.fishMesh.setColorAt(i, _color);
        }
        if (this.fishMesh.instanceColor) this.fishMesh.instanceColor.needsUpdate = true;
        group.add(this.fishMesh);
        this.disposables.push(fishGeo, fishMat, fishBody, fishTail, fishDorsal);

        // F. Interactive Rising Bubble Streams
        this.bubbleCount = 120;
        this.bubblePos = new Float32Array(this.bubbleCount * 3);
        this.bubbleVelY = new Float32Array(this.bubbleCount);
        for (let i = 0; i < this.bubbleCount; i++) {
          this.bubblePos[i * 3] = (Math.random() - 0.5) * 4.5;
          this.bubblePos[i * 3 + 1] = Math.random() * 3.8;
          this.bubblePos[i * 3 + 2] = -1.5 - Math.random() * 3.5;
          this.bubbleVelY[i] = 0.55 + Math.random() * 0.65;
        }
        this.bubbleGeo = new THREE.BufferGeometry();
        this.bubbleAttr = new THREE.BufferAttribute(this.bubblePos, 3);
        this.bubbleGeo.setAttribute('position', this.bubbleAttr);
        this.bubbleTex = createSoftGlowSprite();
        this.bubbleMat = new THREE.PointsMaterial({
          size: 0.085,
          map: this.bubbleTex,
          color: '#BAE6FD',
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        group.add(new THREE.Points(this.bubbleGeo, this.bubbleMat));
        this.disposables.push(this.bubbleGeo, this.bubbleMat, this.bubbleTex);

        this.el.setObject3D('mesh', group);

        this.guideTarget = new THREE.Vector3(0, 1.65, -3.1);
        this.bubbleCursor = 0;
        this.lastBubbleSound = 0;

        this.onPointerMove = (e) => {
          const w = window.innerWidth || 1280;
          const h = window.innerHeight || 720;
          const nx = (e.clientX / w) * 2 - 1;
          const ny = 1 - (e.clientY / h) * 2;
          this.guideTarget.set(nx * 2.3, THREE.MathUtils.clamp(1.65 + ny * 0.9, 0.55, 2.8), -3.0);
          this.emitBubblesAt(this.guideTarget, 3);
        };
        this.onBubbleSurge = () => {
          this.emitBubblesAt(this.guideTarget, 16);
          natureAudio.playBubbleCluster(this.guideTarget);
        };

        window.addEventListener('pointermove', this.onPointerMove);
        this.el.sceneEl?.addEventListener('ocean-bubble-surge', this.onBubbleSurge);
      },

      emitBubblesAt: function (origin, count) {
        for (let k = 0; k < count; k++) {
          const idx = this.bubbleCursor % this.bubbleCount;
          this.bubbleCursor++;
          this.bubblePos[idx * 3] = origin.x + (Math.random() - 0.5) * 0.45;
          this.bubblePos[idx * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.3;
          this.bubblePos[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.45;
        }
        const now = performance.now();
        if (now - this.lastBubbleSound > 950) {
          this.lastBubbleSound = now;
          natureAudio.playBubbleCluster(origin);
        }
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = Math.min(0.04, (Math.min(timeDelta, 50) / 1000) * scale);
        const t = time * 0.001 * scale;

        if (this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode')) {
          const rh = document.getElementById('right-hand');
          if (rh?.object3D && rh.object3D.position.lengthSq() > 0.001) {
            rh.object3D.getWorldPosition(this.guideTarget);
            this.emitBubblesAt(this.guideTarget, 1);

            const nowHand = performance.now();
            if (nowHand - this.lastCoralHandTouch > 520 && this.coralClusters) {
              for (let cIdx = 0; cIdx < this.coralClusters.length; cIdx++) {
                const cl = this.coralClusters[cIdx];
                if (this.guideTarget.distanceTo(cl.worldCenter) < 0.42) {
                  this.lastCoralHandTouch = nowHand;
                  this.restoreCoralCluster(cIdx, null, this.guideTarget);
                  break;
                }
              }
            }
          }
        }

        // Sway kelp gently
        this.kelpMeshes.forEach((km) => {
          km.rotation.z = Math.sin(t * 1.1 + km.userData.phase) * 0.14;
        });

        if (this.celebrationTimer > 0) {
          this.celebrationTimer = Math.max(0, this.celebrationTimer - dt);
        }
        const celebBoost = this.celebrationTimer > 0 ? 1.0 + Math.min(1.0, this.celebrationTimer * 0.35) * 1.15 : 1.0;

        // Animate Manta Ray graceful figure-8 glide + wing wave
        if (this.mantaMesh && this.mantaGeo) {
          const mt = t * celebBoost;
          const mx = Math.sin(mt * 0.28) * 3.1;
          const mz = -4.0 + Math.sin(mt * 0.56) * 1.4;
          const my = 2.65 + Math.sin(mt * 0.4) * 0.25;
          const dx = Math.cos(mt * 0.28) * 3.1 * 0.28;
          const dz = Math.cos(mt * 0.56) * 1.4 * 0.56;
          this.mantaMesh.position.set(mx, my, mz);
          this.mantaMesh.rotation.y = Math.atan2(dx, dz);

          const mp = this.mantaGeo.attributes.position;
          for (let i = 0; i < mp.count; i++) {
            const x = mp.getX(i);
            const wingFactor = Math.abs(x) * 1.15;
            mp.setY(i, this.mantaBaseY[i] + Math.sin(mt * 2.8 - wingFactor * 2.2) * 0.16 * wingFactor);
          }
          mp.needsUpdate = true;
        }

        // Animate Sea Turtles rowing gracefully above coral reef
        if (this.seaTurtles) {
          this.seaTurtles.forEach((turtle) => {
            const { rx, rz, y, speed, phase, flR, flL } = turtle.userData;
            const a = t * speed * celebBoost + phase;
            const x = Math.cos(a) * rx;
            const z = -3.3 + Math.sin(a) * rz;
            const dx = -Math.sin(a) * rx;
            const dz = Math.cos(a) * rz;
            turtle.position.set(x, y + Math.sin(a * 2) * 0.12, z);
            turtle.rotation.y = Math.atan2(dx, dz);
            const row = Math.sin(t * 2.4 * celebBoost + phase) * 0.48;
            flR.rotation.z = row;
            flL.rotation.z = -row;
          });
        }

        // Animate Bioluminescent Jellyfish pulsing vertically
        if (this.jellyfish) {
          this.jellyfish.forEach((jf) => {
            const p = jf.userData.phase;
            const pulse = Math.sin(t * 2.1 + p);
            jf.position.y = jf.userData.baseY + Math.sin(t * 0.65 + p) * 0.28;
            jf.scale.set(1.0 + pulse * 0.14, 1.0 - pulse * 0.16, 1.0 + pulse * 0.14);
          });
        }

        // Animate swaying sea anemones & coral polyp bioluminescence pulse
        if (this.anemones) {
          this.anemones.forEach((ag) => {
            ag.rotation.z = Math.sin(t * 1.4 + ag.userData.phase) * 0.12;
          });
        }
        const idleGlow = 0.08 + 0.08 * Math.sin(t * 1.7);
        if (this.coralPulse > 0.01) {
          this.coralPulse = Math.max(0, this.coralPulse - dt * 0.65);
        }
        const totalGlow = idleGlow + this.coralPulse * 0.95;
        if (this.coralBaseEmissive) this.coralBaseEmissive.emissiveIntensity = 0.45 + totalGlow;
        if (this.coralStagMat) this.coralStagMat.emissiveIntensity = 0.52 + totalGlow;
        if (this.coralClusters) {
          this.coralClusters.forEach((c) => {
            c.mat.emissiveIntensity = c.restored ? 0.58 + totalGlow * 0.9 : 0.12 + this.coralPulse * 0.25;
          });
        }

        // Boids Schooling Update (zero per-frame allocations)
        for (let i = 0; i < this.fishCount; i++) {
          const p = this.fishPos[i];
          const v = this.fishVel[i];
          _vA.set(0, 0, 0);
          _vB.set(0, 0, 0);

          for (let j = i % 3; j < this.fishCount; j += 3) {
            if (i === j) continue;
            const other = this.fishPos[j];
            const dSq = p.distanceToSquared(other);
            if (dSq < 0.35 && dSq > 0.0001) {
              _vA.addScaledVector(p, 1).addScaledVector(other, -1).multiplyScalar(0.15);
            } else if (dSq < 1.8) {
              _vB.add(this.fishVel[j]);
            }
          }

          const toTargetX = this.guideTarget.x - p.x;
          const toTargetY = this.guideTarget.y - p.y;
          const toTargetZ = this.guideTarget.z - p.z;
          const swirlFactor = this.celebrationTimer > 0 ? 1.25 : 0.55;
          const swirlX = -toTargetZ * swirlFactor;
          const swirlZ = toTargetX * swirlFactor;

          v.x += (_vA.x * 1.4 + _vB.x * 0.04 + toTargetX * 0.8 + swirlX) * dt;
          v.y += (_vA.y * 1.4 + _vB.y * 0.04 + toTargetY * 1.1) * dt;
          v.z += (_vA.z * 1.4 + _vB.z * 0.04 + toTargetZ * 0.8 + swirlZ) * dt;

          const spd = v.length();
          const maxSpd = 1.75 * celebBoost;
          if (spd > maxSpd) v.multiplyScalar(maxSpd / spd);
          else if (spd < 0.75) v.multiplyScalar(0.75 / Math.max(0.01, spd));

          p.addScaledVector(v, dt);

          _dummy.position.copy(p);
          _fishQuat.setFromUnitVectors(_fishForward, _vA.copy(v).normalize());
          _dummy.quaternion.copy(_fishQuat);
          _dummy.scale.setScalar(1.0);
          _dummy.updateMatrix();
          this.fishMesh.setMatrixAt(i, _dummy.matrix);
        }
        this.fishMesh.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < this.bubbleCount; i++) {
          this.bubblePos[i * 3 + 1] += this.bubbleVelY[i] * dt;
          this.bubblePos[i * 3] += Math.sin(time * 0.003 + i) * 0.14 * dt;
          if (this.bubblePos[i * 3 + 1] > 4.2) this.bubblePos[i * 3 + 1] = 0.15;
        }
        this.bubbleAttr.needsUpdate = true;
      },

      remove: function () {
        tactileTouchFX.unregisterInteractiveSurface(this.coralGroup);
        this.coralClusters?.forEach((c) => tactileTouchFX.unregisterInteractiveSurface(c.group));
        this.el.removeEventListener('click', this.onCoralInteract);
        this.el.removeEventListener('pinchstarted', this.onCoralInteract);
        window.removeEventListener('pointermove', this.onPointerMove);
        this.el.sceneEl?.removeEventListener('ocean-bubble-surge', this.onBubbleSurge);
        if (this.coralHitEntities) {
          this.coralHitEntities.forEach(({ hitEl, handler }) => {
            hitEl.removeEventListener('click', handler);
            hitEl.removeEventListener('pinchstarted', handler);
            if (hitEl.parentNode) hitEl.parentNode.removeChild(hitEl);
          });
        }
        this.el.removeObject3D('mesh');
        this.disposables?.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 7. Sculpted Desert Dunes (Sand PBR), Swaying Date Palms, Oasis Lantern & Celestial Navigation Stars (Biome 4)
   */
  if (!AFRAME.components['desert-dunes-oasis']) {
    AFRAME.registerComponent('desert-dunes-oasis', {
      init: function () {
        const group = new THREE.Group();
        this.disposables = [];
        const sandPBR = getBiomePBRTextures('sand', 14, 14);

        // Continuous 360-degree Sahara Erg Dune Sea (145m span, smooth wind-carved sand ridges)
        const duneGeo = new THREE.PlaneGeometry(145, 145, 116, 116);
        duneGeo.rotateX(-Math.PI / 2);
        const pos = duneGeo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        const cShadow = new THREE.Color('#9A4A18');
        const cCrest = new THREE.Color('#FDE68A');

        const getDesertGroundY = (x, z) => {
          const distOasis = Math.hypot(x, z + 3.2);
          const distCamera = Math.hypot(x, z - 1.0);
          const basinMask = THREE.MathUtils.smoothstep(Math.min(distOasis, distCamera), 2.5, 7.5);
          const megaDuneMask = THREE.MathUtils.smoothstep(Math.hypot(x, z), 15.0, 56.0);
          const duneWave = Math.sin(x * 0.28 + fbm2D(x * 0.14, z * 0.14, 2) * 3.2) * 0.85;
          const windRipple = Math.sin(x * 4.6 + z * 1.3) * 0.025;
          const perimeterDunes = (2.2 + Math.abs(Math.sin(x * 0.07 + z * 0.05)) * 4.5 + fbm2D(x * 0.05 + 7, z * 0.05 + 2, 3) * 5.2) * megaDuneMask;
          return (duneWave + fbm2D(x * 0.18 + 3, z * 0.18 + 3, 3) * 1.35) * basinMask + perimeterDunes - (1 - THREE.MathUtils.smoothstep(distOasis, 1.35, 3.6)) * 0.22 + windRipple;
        };
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const h = getDesertGroundY(x, z);
          pos.setY(i, h);

          _color.lerpColors(cShadow, cCrest, THREE.MathUtils.clamp((h + 0.3) * 0.35, 0, 1));
          colors[i * 3] = _color.r;
          colors[i * 3 + 1] = _color.g;
          colors[i * 3 + 2] = _color.b;
        }
        duneGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        duneGeo.computeVertexNormals();
        const duneMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          normalMap: sandPBR.normalMap,
          normalScale: new THREE.Vector2(1.0, 1.0),
          roughness: 0.72,
          metalness: 0.05
        });
        group.add(new THREE.Mesh(duneGeo, duneMat));
        this.disposables.push(duneGeo, duneMat);

        // Date-Palm Trees with naturally arched feather-like palm frond blades around Oasis & distant dunes
        const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.88 });
        const frondGeo = new THREE.PlaneGeometry(0.24, 1.25, 2, 7);
        const fPos = frondGeo.attributes.position;
        for (let i = 0; i < fPos.count; i++) {
          const u = fPos.getX(i);
          const v = fPos.getY(i) + 0.625;
          const tLen = v / 1.25;
          const widthTapering = Math.sin(tLen * Math.PI) * 1.15 + 0.08;
          fPos.setX(i, u * widthTapering);
          fPos.setY(i, Math.sin(tLen * Math.PI * 0.75) * 0.35);
          fPos.setZ(i, v - tLen * tLen * 0.16);
        }
        frondGeo.computeVertexNormals();
        const frondMat = new THREE.MeshStandardMaterial({
          color: '#16A34A',
          emissive: '#065F46',
          emissiveIntensity: 0.28,
          roughness: 0.58,
          side: THREE.DoubleSide
        });
        this.disposables.push(trunkMat, frondGeo, frondMat);

        this.palmCrowns = [];
        [
          { x: -1.85, z: -3.45, leanX: 0.35, h: 2.35 },
          { x: 1.75, z: -3.6, leanX: -0.28, h: 2.1 },
          { x: 1.45, z: -2.35, leanX: -0.22, h: 1.85 },
          { x: -2.3, z: -1.85, leanX: 0.24, h: 2.0 },
          { x: 0.25, z: -5.2, leanX: 0.18, h: 2.55 },
          { x: -4.2, z: 2.4, leanX: 0.32, h: 2.4 },
          { x: 4.5, z: 2.8, leanX: -0.26, h: 2.3 },
          { x: -7.5, z: -6.5, leanX: 0.3, h: 2.8 },
          { x: 7.2, z: -7.0, leanX: -0.35, h: 2.75 }
        ].forEach((pCfg, pIdx) => {
          const pBaseY = getDesertGroundY(pCfg.x, pCfg.z) - 0.08;
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(pCfg.x, pBaseY, pCfg.z),
            new THREE.Vector3(pCfg.x + pCfg.leanX * 0.45, pBaseY + pCfg.h * 0.55, pCfg.z - 0.15),
            new THREE.Vector3(pCfg.x + pCfg.leanX, pBaseY + pCfg.h, pCfg.z)
          ]);
          const trunkGeo = new THREE.TubeGeometry(curve, 10, 0.065, 6, false);
          group.add(new THREE.Mesh(trunkGeo, trunkMat));
          this.disposables.push(trunkGeo);

          const crown = new THREE.Group();
          crown.position.set(pCfg.x + pCfg.leanX, pBaseY + pCfg.h, pCfg.z);
          for (let f = 0; f < 10; f++) {
            const az = (f / 10) * Math.PI * 2 + pIdx;
            const frond = new THREE.Mesh(frondGeo, frondMat);
            frond.rotation.y = az;
            frond.rotation.x = 0.25 + (f % 2) * 0.18;
            crown.add(frond);
          }
          crown.userData.phase = pIdx * 1.3;
          group.add(crown);
          this.palmCrowns.push(crown);
        });

        // Sculpted Brass & Warm Amber Glass Oasis Camp Lantern
        const lanternGroup = new THREE.Group();
        const lBrassMat = new THREE.MeshStandardMaterial({ color: '#92400E', metalness: 0.72, roughness: 0.32 });
        const lBaseGeo = new THREE.CylinderGeometry(0.075, 0.09, 0.035, 12);
        const lGlassGeo = new THREE.SphereGeometry(0.068, 12, 10);
        lGlassGeo.scale(1, 1.35, 1);
        const lGlassMat = new THREE.MeshStandardMaterial({
          color: '#FEF3C7',
          emissive: '#F59E0B',
          emissiveIntensity: 1.35,
          roughness: 0.18
        });
        const lCapGeo = new THREE.ConeGeometry(0.082, 0.055, 12);
        const lBase = new THREE.Mesh(lBaseGeo, lBrassMat);
        const lGlass = new THREE.Mesh(lGlassGeo, lGlassMat);
        lGlass.position.y = 0.09;
        const lCap = new THREE.Mesh(lCapGeo, lBrassMat);
        lCap.position.y = 0.19;
        lanternGroup.add(lBase, lGlass, lCap);
        const dLanternY = getDesertGroundY(-1.35, -2.55);
        lanternGroup.position.set(-1.35, dLanternY + 0.01, -2.55);
        group.add(lanternGroup);
        this.lanternLight = new THREE.PointLight('#F59E0B', 1.4, 6.0);
        this.lanternLight.position.set(-1.35, dLanternY + 0.25, -2.55);
        group.add(this.lanternLight);
        this.disposables.push(lBrassMat, lBaseGeo, lGlassGeo, lGlassMat, lCapGeo);

        // Celestial Navigation Guide Stars (Polaris + Ursa Major Star-Compass) brightening in Starlight mode
        this.starCompassGroup = new THREE.Group();
        this.starCompassGroup.position.set(0, 8.2, -12.0);
        this.compassAngle = 0.68;
        this.compassLocked = false;
        this.currentSolar = 0.26;
        this.starCompassGroup.rotation.z = this.compassAngle;

        const starGeo = new THREE.BufferGeometry();
        const starCoords = new Float32Array([
          0.0, 1.35, 0.0, // Polaris
          -2.4, 0.4, 0.5,
          -1.5, 0.0, 0.4,
          -0.8, -0.6, 0.2,
          0.2, -1.0, -0.1,
          1.3, -0.8, 0.0,
          1.6, 0.1, 0.2,
          0.6, -0.1, 0.1
        ]);
        starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
        const starTex = createSoftGlowSprite();
        this.navStarMat = new THREE.PointsMaterial({
          size: 0.44,
          map: starTex,
          color: '#FEF3C7',
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.starCompassGroup.add(new THREE.Points(starGeo, this.navStarMat));

        const compassRingGeo = new THREE.RingGeometry(1.3, 1.38, 48);
        this.compassRingMat = new THREE.MeshBasicMaterial({
          color: '#38BDF8',
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.starCompassGroup.add(new THREE.Mesh(compassRingGeo, this.compassRingMat));
        group.add(this.starCompassGroup);
        this.disposables.push(starGeo, this.navStarMat, starTex, compassRingGeo, this.compassRingMat);

        // 3 Realistic Sculpted Dromedary Camels grounded on desert dune ridge
        const camelMat = new THREE.MeshStandardMaterial({ color: '#C28840', roughness: 0.85 });
        const cBodyGeo = new THREE.SphereGeometry(0.18, 12, 10);
        cBodyGeo.scale(1.45, 0.85, 0.72);
        const cHumpGeo = new THREE.SphereGeometry(0.13, 10, 8);
        cHumpGeo.scale(0.95, 1.15, 0.8);
        const cNeckGeo = new THREE.CylinderGeometry(0.042, 0.062, 0.34, 8);
        const cHeadGeo = new THREE.SphereGeometry(0.065, 8, 8);
        cHeadGeo.scale(1.55, 0.85, 0.75);
        const cLegGeo = new THREE.CylinderGeometry(0.024, 0.018, 0.36, 6);
        this.disposables.push(camelMat, cBodyGeo, cHumpGeo, cNeckGeo, cHeadGeo, cLegGeo);
        this.desertCamels = [];
        [
          { x: -2.55, z: -4.1, ry: 0.4, sc: 1.0, p: 0.0 },
          { x: -3.25, z: -4.55, ry: 0.35, sc: 0.88, p: 1.2 },
          { x: 2.35, z: -4.3, ry: -2.4, sc: 0.94, p: 2.1 }
        ].forEach((cc) => {
          const groundY = getDesertGroundY(cc.x, cc.z);
          cc.y = groundY + 0.41 * cc.sc;
          const camel = new THREE.Group();
          const body = new THREE.Mesh(cBodyGeo, camelMat);
          const hump = new THREE.Mesh(cHumpGeo, camelMat);
          hump.position.set(-0.02, 0.14, 0);
          const neck = new THREE.Mesh(cNeckGeo, camelMat);
          neck.position.set(0.24, 0.18, 0);
          neck.rotation.z = -0.45;
          const head = new THREE.Mesh(cHeadGeo, camelMat);
          head.position.set(0.05, 0.17, 0);
          neck.add(head);
          camel.add(body, hump, neck);
          const legs = [];
          [[-0.17, -0.06], [-0.17, 0.06], [0.17, -0.06], [0.17, 0.06]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(cLegGeo, camelMat);
            leg.position.set(lx, -0.24, lz);
            camel.add(leg);
            legs.push(leg);
          });
          camel.position.set(cc.x, cc.y, cc.z);
          camel.rotation.y = cc.ry;
          camel.scale.setScalar(cc.sc);
          camel.userData = { baseY: cc.y, phase: cc.p, legs, neck };
          group.add(camel);
          this.desertCamels.push(camel);
        });

        // 3 Graceful White Arabian Oryx (Desert Gazelles) + 32 Golden Desert Shrubs & Wildflowers across 360°
        const oryxMat = new THREE.MeshStandardMaterial({ color: '#F5F5F4', roughness: 0.78 });
        const oryxHornMat = new THREE.MeshStandardMaterial({ color: '#292524', roughness: 0.55 });
        const oryxBodyGeo = new THREE.SphereGeometry(0.11, 10, 8);
        oryxBodyGeo.scale(1.5, 0.85, 0.68);
        const oryxNeckGeo = new THREE.CylinderGeometry(0.028, 0.042, 0.22, 6);
        const oryxHeadGeo = new THREE.SphereGeometry(0.045, 8, 8);
        oryxHeadGeo.scale(1.4, 0.8, 0.72);
        const oryxHornGeo = new THREE.CylinderGeometry(0.005, 0.009, 0.28, 5);
        const oryxLegGeo = new THREE.CylinderGeometry(0.013, 0.01, 0.26, 5);
        this.disposables.push(oryxMat, oryxHornMat, oryxBodyGeo, oryxNeckGeo, oryxHeadGeo, oryxHornGeo, oryxLegGeo);
        this.oryxList = [];
        [
          { x: 3.4, z: -3.2, ry: -1.8 },
          { x: -3.8, z: 1.8, ry: 0.7 },
          { x: 3.9, z: 2.4, ry: -2.4 }
        ].forEach((oc, oIdx) => {
          const gy = getDesertGroundY(oc.x, oc.z);
          const oryx = new THREE.Group();
          const ob = new THREE.Mesh(oryxBodyGeo, oryxMat);
          const headPivot = new THREE.Group();
          const on = new THREE.Mesh(oryxNeckGeo, oryxMat);
          on.position.set(0.15, 0.11, 0);
          on.rotation.z = -0.35;
          const oh = new THREE.Mesh(oryxHeadGeo, oryxMat);
          oh.position.set(0.21, 0.22, 0);
          headPivot.add(on, oh);
          [-0.018, 0.018].forEach((hz) => {
            const horn = new THREE.Mesh(oryxHornGeo, oryxHornMat);
            horn.position.set(0.16, 0.34, hz);
            horn.rotation.z = 0.28;
            headPivot.add(horn);
          });
          oryx.add(ob, headPivot);
          [[-0.1, -0.04], [-0.1, 0.04], [0.1, -0.04], [0.1, 0.04]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(oryxLegGeo, oryxMat);
            leg.position.set(lx, -0.17, lz);
            oryx.add(leg);
          });
          oryx.position.set(oc.x, gy + 0.29, oc.z);
          oryx.rotation.y = oc.ry;
          oryx.userData = { headPivot, baseRy: oc.ry, phase: oIdx * 1.7 };
          group.add(oryx);
          this.oryxList.push(oryx);
        });

        const shrubGeo = new THREE.DodecahedronGeometry(0.16, 1);
        shrubGeo.scale(1.3, 0.65, 1.3);
        const shrubMat = new THREE.MeshStandardMaterial({ color: '#65A30D', roughness: 0.85 });
        const dShrubs = new THREE.InstancedMesh(shrubGeo, shrubMat, 32);
        for (let s = 0; s < 32; s++) {
          const ang = (s / 32) * Math.PI * 2 + 0.15;
          const rad = 2.6 + (s % 5) * 1.45;
          const sx = Math.cos(ang) * rad;
          const sz = -2.0 + Math.sin(ang) * rad;
          const sy = getDesertGroundY(sx, sz);
          _dummy.position.set(sx, sy + 0.04, sz);
          _dummy.rotation.set(0, s * 0.7, 0);
          _dummy.scale.setScalar(0.65 + (s % 3) * 0.35);
          _dummy.updateMatrix();
          dShrubs.setMatrixAt(s, _dummy.matrix);
        }
        dShrubs.instanceMatrix.needsUpdate = true;
        group.add(dShrubs);
        this.disposables.push(shrubGeo, shrubMat);

        // Soft Luminous Full-Sphere Celestial Moon visible in desert twilight/starlight
        const moonGeo = new THREE.SphereGeometry(0.36, 18, 16);
        this.moonMat = new THREE.MeshBasicMaterial({
          color: '#FEF9C3',
          transparent: true,
          opacity: 0.18
        });
        const moonMesh = new THREE.Mesh(moonGeo, this.moonMat);
        moonMesh.position.set(-4.2, 5.4, -12.5);
        group.add(moonMesh);
        this.disposables.push(moonGeo, this.moonMat);

        // Oasis Limestone Shore Boulders & Marsh Reed Tufts framing the Artesian Spring
        const stoneGeo = new THREE.DodecahedronGeometry(0.24, 1);
        stoneGeo.scale(1.3, 0.65, 1.1);
        const stoneMat = new THREE.MeshStandardMaterial({ color: '#A8A29E', roughness: 0.85 });
        [
          { x: -1.45, z: -3.2, s: 1.05 },
          { x: 1.48, z: -2.85, s: 0.92 },
          { x: -0.95, z: -4.25, s: 1.15 },
          { x: 1.15, z: -4.15, s: 0.85 }
        ].forEach((rc, rIdx) => {
          const st = new THREE.Mesh(stoneGeo, stoneMat);
          st.position.set(rc.x, getDesertGroundY(rc.x, rc.z) + 0.05, rc.z);
          st.rotation.y = rIdx * 1.1;
          st.scale.setScalar(rc.s);
          group.add(st);
        });
        this.disposables.push(stoneGeo, stoneMat);

        // Educational Model: Subsurface Artesian Aquifer Cutaway & Spring Upwelling (toggled via desert-toggle-aquifer)
        this.aquiferVisible = false;
        this.aquiferGroup = new THREE.Group();
        this.aquiferGroup.visible = false;

        const aqStrataGeo = new THREE.CylinderGeometry(2.8, 3.6, 0.72, 24, 1, true);
        const aqStrataMat = new THREE.MeshBasicMaterial({
          color: '#0284C7',
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
          wireframe: true
        });
        const aqStrata = new THREE.Mesh(aqStrataGeo, aqStrataMat);
        aqStrata.position.set(0, -0.48, -3.2);
        this.aquiferGroup.add(aqStrata);

        const aqStreamGeo = new THREE.CylinderGeometry(0.14, 0.35, 0.95, 14, 1, true);
        const aqStreamMat = new THREE.MeshBasicMaterial({
          color: '#38BDF8',
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        const aqStream = new THREE.Mesh(aqStreamGeo, aqStreamMat);
        aqStream.position.set(0, -0.18, -3.2);
        this.aquiferGroup.add(aqStream);

        this.aquiferDropsCount = 48;
        this.aquiferDropsPos = new Float32Array(this.aquiferDropsCount * 3);
        for (let i = 0; i < this.aquiferDropsCount; i++) {
          this.aquiferDropsPos[i * 3] = (Math.random() - 0.5) * 1.6;
          this.aquiferDropsPos[i * 3 + 1] = -0.85 + Math.random() * 0.95;
          this.aquiferDropsPos[i * 3 + 2] = -3.2 + (Math.random() - 0.5) * 1.6;
        }
        const aqDropsGeo = new THREE.BufferGeometry();
        this.aqDropsAttr = new THREE.BufferAttribute(this.aquiferDropsPos, 3);
        aqDropsGeo.setAttribute('position', this.aqDropsAttr);
        const aqDropTex = createSoftGlowSprite();
        const aqDropsMat = new THREE.PointsMaterial({
          size: 0.16,
          map: aqDropTex,
          color: '#7DD3FC',
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.aquiferGroup.add(new THREE.Points(aqDropsGeo, aqDropsMat));
        this.disposables.push(aqStrataGeo, aqStrataMat, aqStreamGeo, aqStreamMat, aqDropsGeo, aqDropsMat, aqDropTex);
        group.add(this.aquiferGroup);

        // Artesian Groundwater Geyser Fountain awakened on Celestial North alignment
        this.geyserGroup = new THREE.Group();
        this.geyserGroup.position.set(0, 0.05, -3.2);
        this.geyserGroup.visible = false;
        this.geyserCount = 64;
        this.geyserPos = new Float32Array(this.geyserCount * 3);
        this.geyserPhase = new Float32Array(this.geyserCount);
        for (let i = 0; i < this.geyserCount; i++) {
          this.geyserPhase[i] = i / this.geyserCount;
        }
        const gGeo = new THREE.BufferGeometry();
        this.geyserAttr = new THREE.BufferAttribute(this.geyserPos, 3);
        gGeo.setAttribute('position', this.geyserAttr);
        const gTex = createSoftGlowSprite();
        this.geyserMat = new THREE.PointsMaterial({
          size: 0.16,
          map: gTex,
          color: '#BAE6FD',
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.geyserGroup.add(new THREE.Points(gGeo, this.geyserMat));
        group.add(this.geyserGroup);
        this.disposables.push(gGeo, this.geyserMat, gTex);

        this.duneMeshRef = group.children[0];
        tactileTouchFX.registerInteractiveSurface(this.duneMeshRef, {
          biomeId: 'desert',
          specimenKey: 'desert-dunes-surface',
          materials: [duneMat, stoneMat]
        });
        this.onToggleAquifer = (evt) => {
          this.aquiferVisible = typeof evt.detail?.visible === 'boolean' ? evt.detail.visible : !this.aquiferVisible;
          this.aquiferGroup.visible = this.aquiferVisible;
          if (this.duneMeshRef?.material) {
            this.duneMeshRef.material.transparent = this.aquiferVisible;
            this.duneMeshRef.material.opacity = this.aquiferVisible ? 0.52 : 1.0;
          }
          window.dispatchEvent(new CustomEvent('desert-aquifer-state', { detail: { visible: this.aquiferVisible } }));
        };
        this.el.sceneEl?.addEventListener('desert-toggle-aquifer', this.onToggleAquifer);

        this.updateStarCompass = (nextAngle, forceSnap = false) => {
          if (this.compassLocked && !forceSnap) return;
          this.compassAngle = forceSnap ? 0 : nextAngle;
          if (Math.abs(this.compassAngle) < 0.14 || forceSnap) {
            this.compassAngle = 0;
            this.compassLocked = true;
            this.compassRingMat.color.set('#FBBF24');
            this.navStarMat.color.set('#FDE047');
            this.geyserGroup.visible = true;
            this.el.sceneEl?.emit('desert-toggle-aquifer', { visible: true }, false);
            natureAudio.playAquiferGeyser();
            window.dispatchEvent(
              new CustomEvent('tabsirah-wonder-progress', {
                detail: { message: 'Polaris Locked True North! Artesian groundwater geyser awakened.' }
              })
            );
          } else {
            const deg = Math.round(THREE.MathUtils.radToDeg(this.compassAngle));
            window.dispatchEvent(
              new CustomEvent('tabsirah-wonder-progress', {
                detail: { message: `Star Compass offset: ${deg > 0 ? `+${deg}` : deg}° from True North` }
              })
            );
          }
          this.starCompassGroup.rotation.z = this.compassAngle;
        };

        this.onCompassRotate = (evt) => {
          if (window.tabsirahActiveBiome !== 'desert') return;
          if (evt.detail?.align) {
            this.updateStarCompass(0, true);
          } else if (typeof evt.detail?.delta === 'number') {
            this.updateStarCompass(this.compassAngle + evt.detail.delta, false);
          }
        };
        this.el.sceneEl?.addEventListener('desert-compass-rotate', this.onCompassRotate);

        this.lastCompassDragX = null;
        this.onDesertPointerMove = (e) => {
          if (window.tabsirahActiveBiome !== 'desert' || this.currentSolar >= 0.14 || this.compassLocked) {
            this.lastCompassDragX = null;
            return;
          }
          const h = window.innerHeight || 720;
          if ((e.buttons & 1) && e.clientY < h * 0.56) {
            if (this.lastCompassDragX !== null) {
              const dx = e.clientX - this.lastCompassDragX;
              if (Math.abs(dx) > 1 && Math.abs(dx) < 80) {
                this.updateStarCompass(this.compassAngle - dx * 0.008, false);
              }
            }
            this.lastCompassDragX = e.clientX;
          } else {
            this.lastCompassDragX = null;
          }
        };
        window.addEventListener('pointermove', this.onDesertPointerMove);

        this.onSolar = (evt) => {
          const s = typeof evt.detail?.solar === 'number' ? evt.detail.solar : 0.08;
          this.currentSolar = s;
          const nightVis = THREE.MathUtils.clamp(1 - (s + 0.1) * 2.2, 0.0, 1.0);
          if (this.navStarMat) this.navStarMat.opacity = nightVis * 0.92;
          if (this.compassRingMat) this.compassRingMat.opacity = s < 0.14 ? (this.compassLocked ? 0.72 : 0.36) : 0.0;
          if (this.moonMat) this.moonMat.opacity = 0.15 + nightVis * 0.82;
          if (this.lanternLight) this.lanternLight.intensity = 0.4 + nightVis * 1.65;
        };
        window.addEventListener('biome-solar-changed', this.onSolar);

        this.el.setObject3D('mesh', group);
      },

      tick: function (time, timeDelta) {
        const dt = timeDelta ? Math.min(timeDelta, 50) / 1000 : 0.016;
        const t = time * 0.001 * (window.tabsirahTimeScale || 1.0);
        this.palmCrowns.forEach((crown) => {
          crown.rotation.z = Math.sin(t * 1.15 + crown.userData.phase) * 0.055;
        });
        if (this.desertCamels) {
          this.desertCamels.forEach((camel) => {
            const p = camel.userData.phase;
            camel.position.y = camel.userData.baseY + Math.abs(Math.sin(t * 1.8 + p)) * 0.018;
            camel.userData.neck.rotation.z = -0.45 + Math.sin(t * 1.1 + p) * 0.06;
            camel.userData.legs.forEach((leg, idx) => {
              leg.rotation.z = Math.sin(t * 1.8 + p + (idx % 2) * Math.PI) * 0.12;
            });
          });
        }
        if (this.oryxList) {
          this.oryxList.forEach((oryx) => {
            const { headPivot, baseRy, phase } = oryx.userData;
            headPivot.rotation.z = Math.sin(t * 0.9 + phase) * 0.12;
            oryx.rotation.y = baseRy + Math.sin(t * 0.48 + phase) * 0.09;
          });
        }
        if (this.aquiferVisible && this.aqDropsAttr) {
          for (let i = 0; i < this.aquiferDropsCount; i++) {
            this.aquiferDropsPos[i * 3 + 1] += 0.42 * dt;
            if (this.aquiferDropsPos[i * 3 + 1] > 0.12) {
              this.aquiferDropsPos[i * 3 + 1] = -0.85;
            }
          }
          this.aqDropsAttr.needsUpdate = true;
        }
        if (this.geyserGroup?.visible && this.geyserAttr) {
          for (let i = 0; i < this.geyserCount; i++) {
            this.geyserPhase[i] = (this.geyserPhase[i] + dt * 0.72) % 1.0;
            const p = this.geyserPhase[i];
            const ang = i * 2.39996;
            const spread = p * 0.68;
            this.geyserPos[i * 3] = Math.cos(ang) * spread;
            this.geyserPos[i * 3 + 1] = 4.0 * p * (1.0 - p) * 1.45;
            this.geyserPos[i * 3 + 2] = Math.sin(ang) * spread;
          }
          this.geyserAttr.needsUpdate = true;
        }
      },

      remove: function () {
        tactileTouchFX.unregisterInteractiveSurface(this.duneMeshRef);
        this.el.sceneEl?.removeEventListener('desert-toggle-aquifer', this.onToggleAquifer);
        this.el.sceneEl?.removeEventListener('desert-compass-rotate', this.onCompassRotate);
        window.removeEventListener('pointermove', this.onDesertPointerMove);
        window.removeEventListener('biome-solar-changed', this.onSolar);
        this.el.removeObject3D('mesh');
        this.disposables?.forEach((d) => d?.dispose());
      }
    });
  }
}
