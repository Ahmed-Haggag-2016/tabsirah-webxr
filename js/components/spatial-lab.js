/**
 * Tabṣirah — Spatial Scientific Laboratory (`spatial-scientific-lab`)
 * Multi-scale interactive 3D specimen pedestal extracted directly from the active biome.
 * Supports: Select Specimen, Extract/Return, Rotate, Scale, Microscopic Zoom, and Scientific Explanation.
 * Zero-GC tick animation loop and complete Three.js disposal.
 */

import { natureAudio } from './nature-audio.js';

export const LAB_SPECIMENS = {
  aurora: {
    id: 'aurora-dipole-cell',
    biomeId: 'aurora',
    title: 'Dipole Magnetosphere & 557.7 nm Excitation Cell',
    scaleLabel: 'Planetary → Atomic (90–300 km)',
    accent: '#34D399',
    summary:
      'Educational dipole model: Earth’s dipolar field deflects charged solar plasma away from low latitudes and guides particles into polar ovals where atomic oxygen emits 557.7 nm green photons.',
    microDetail:
      'At microscopic orbital scale, incoming electrons excite ground-state oxygen to the ¹S metastable level; radiative relaxation (~0.7 s lifetime) releases characteristic emerald 557.7 nm light.'
  },
  rainforest: {
    id: 'rainforest-stomata',
    biomeId: 'rainforest',
    title: 'Leaf Cuticle & Stomata Evapotranspiration Chamber',
    scaleLabel: 'Canopy Leaf → Cellular Pore (~20 µm)',
    accent: '#10B981',
    summary:
      'Paired guard cells regulate microscopic stomatal pores on leaf undersides, exchanging CO₂ for photosynthesis while releasing water vapor droplets that cool the canopy and seed clouds.',
    microDetail:
      'Turgor pressure inside kidney-shaped guard cells widens the pore aperture during sunlit hydration, accelerating upward moisture transport across the rainforest boundary layer.'
  },
  ocean: {
    id: 'ocean-coral-polyp',
    biomeId: 'ocean',
    title: 'Stony Coral Polyp & Zooxanthellae Symbiosis Cup',
    scaleLabel: 'Reef Head → Symbiotic Cell (~10 µm)',
    accent: '#22D3EE',
    summary:
      'Each stony coral polyp secretes a porous aragonite (CaCO₃) calyx and shelters photosynthetic dinoflagellate algae (zooxanthellae) within its translucent gastrodermal tissue.',
    microDetail:
      'Algal symbionts convert refracted sunlight into sugars and amino acids for the host polyp while receiving CO₂ and nitrogenous nutrients in a mutualistic cycle sensitive to heat stress.'
  },
  desert: {
    id: 'desert-aquifer-core',
    biomeId: 'desert',
    title: 'Porous Sandstone & Confined Oasis Aquifer Core',
    scaleLabel: 'Geological Strata → Pore Matrix',
    accent: '#FBBF24',
    summary:
      'Cross-section of an artesian desert oasis: upper wind-sorted sand rests over a low-permeability clay/shale cap that seals freshwater within porous deep sandstone until a basin fracture lets it rise.',
    microDetail:
      'Intergranular sandstone pores act like a subterranean sponge holding ancient recharge water under hydrostatic pressure, feeding date palm roots despite arid surface winds.'
  }
};

if (typeof AFRAME !== 'undefined' && !AFRAME.components['spatial-scientific-lab']) {
  const _dragVec = new THREE.Vector2();

  AFRAME.registerComponent('spatial-scientific-lab', {
    init: function () {
      this.sceneEl = this.el.sceneEl || this.el;
      this.isOpen = false;
      this.isExtracted = true;
      this.microZoom = false;
      this.activeBiome = window.tabsirahActiveBiome || 'aurora';
      this.specimenScale = 1.0;
      this.rotY = 0;
      this.rotX = 0.14;
      this.elapsed = 0;
      this.isDragging = false;
      this.disposables = [];

      // Main floating lab stage comfortably angled at chest/eye height with generous depth
      this.labRoot = new THREE.Group();
      this.labRoot.position.set(0, 1.22, -1.85);
      this.labRoot.visible = false;
      this.sceneEl.object3D.add(this.labRoot);

      // Sleek obsidian & gold micro-plinth beneath extracted specimen
      const baseGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.03, 36);
      const baseMat = new THREE.MeshStandardMaterial({
        color: '#0B1324',
        metalness: 0.35,
        roughness: 0.6
      });
      this.plinthBase = new THREE.Mesh(baseGeo, baseMat);
      this.plinthBase.position.y = -0.26;
      this.labRoot.add(this.plinthBase);

      const rimGeo = new THREE.TorusGeometry(0.325, 0.008, 12, 48);
      const rimMat = new THREE.MeshBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.72 });
      this.plinthRim = new THREE.Mesh(rimGeo, rimMat);
      this.plinthRim.rotation.x = Math.PI / 2;
      this.plinthRim.position.y = -0.245;
      this.labRoot.add(this.plinthRim);
      this.disposables.push(baseGeo, baseMat, rimGeo, rimMat);

      this.specimenHolder = new THREE.Group();
      this.labRoot.add(this.specimenHolder);

      this.specimenGroups = {};
      this.buildAuroraCell();
      this.buildRainforestStomata();
      this.buildOceanPolyp();
      this.buildDesertCore();

      this.selectSpecimen(this.activeBiome);

      this.onCommand = (e) => {
        const d = e.detail || {};
        if (typeof d.open === 'boolean') this.setOpen(d.open);
        else if (d.toggle) this.setOpen(!this.isOpen);
        if (d.biomeId && LAB_SPECIMENS[d.biomeId]) this.selectSpecimen(d.biomeId);
        if (typeof d.extract === 'boolean') this.setExtracted(d.extract);
        if (typeof d.scale === 'number') this.setSpecimenScale(d.scale);
        if (typeof d.scaleDelta === 'number') this.setSpecimenScale(this.specimenScale + d.scaleDelta);
        if (typeof d.microZoom === 'boolean') this.setMicroZoom(d.microZoom);
        if (typeof d.rotateY === 'number') this.rotY += d.rotateY;
        if (typeof d.rotateX === 'number') this.rotX = THREE.MathUtils.clamp(this.rotX + d.rotateX, -0.7, 0.7);
      };

      this.onBiomeChanged = (e) => {
        const bId = e.detail?.biomeId;
        if (bId && LAB_SPECIMENS[bId]) {
          this.selectSpecimen(bId);
        }
      };

      this.onPointerDown = (e) => {
        if (!this.isOpen || e.target !== this.sceneEl.canvas) return;
        this.isDragging = true;
        _dragVec.set(e.clientX, e.clientY);
      };
      this.onPointerMove = (e) => {
        if (!this.isOpen || !this.isDragging) return;
        const dx = e.clientX - _dragVec.x;
        const dy = e.clientY - _dragVec.y;
        _dragVec.set(e.clientX, e.clientY);
        this.rotY += dx * 0.01;
        this.rotX = THREE.MathUtils.clamp(this.rotX + dy * 0.008, -0.7, 0.7);
      };
      this.onPointerUp = () => {
        this.isDragging = false;
      };

      window.addEventListener('tabsirah-lab-command', this.onCommand);
      window.addEventListener('tabsirah-biome-changed', this.onBiomeChanged);
      window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
      window.addEventListener('pointerup', this.onPointerUp, { passive: true });
    },

    buildAuroraCell: function () {
      const g = new THREE.Group();
      const earthGeo = new THREE.SphereGeometry(0.08, 24, 18);
      const earthMat = new THREE.MeshStandardMaterial({
        color: '#0EA5E9',
        emissive: '#0369A1',
        emissiveIntensity: 0.45,
        roughness: 0.4
      });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      g.add(earth);

      // Dipole field lines
      const arcMat = new THREE.MeshBasicMaterial({
        color: '#34D399',
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.075, 0),
          new THREE.Vector3(Math.cos(a) * 0.19, 0.14, Math.sin(a) * 0.19),
          new THREE.Vector3(Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24),
          new THREE.Vector3(Math.cos(a) * 0.19, -0.14, Math.sin(a) * 0.19),
          new THREE.Vector3(0, -0.075, 0)
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.004, 6, false);
        g.add(new THREE.Mesh(tubeGeo, arcMat));
        this.disposables.push(tubeGeo);
      }

      // Polar 557.7 nm auroral emission halos
      const ringGeo = new THREE.TorusGeometry(0.068, 0.009, 10, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: '#6EE7B7', transparent: true, opacity: 0.9 });
      const northOval = new THREE.Mesh(ringGeo, ringMat);
      northOval.rotation.x = Math.PI / 2;
      northOval.position.y = 0.056;
      const southOval = new THREE.Mesh(ringGeo, ringMat);
      southOval.rotation.x = Math.PI / 2;
      southOval.position.y = -0.056;
      g.add(northOval, southOval);

      // Microscopic oxygen-atom excitation shell (revealed strongly in microZoom)
      const shellGeo = new THREE.IcosahedronGeometry(0.16, 1);
      const shellMat = new THREE.MeshBasicMaterial({
        color: '#38BDF8',
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
      });
      const microShell = new THREE.Mesh(shellGeo, shellMat);
      g.add(microShell);

      g.userData = { northOval, southOval, microShell };
      this.disposables.push(earthGeo, earthMat, arcMat, ringGeo, ringMat, shellGeo, shellMat);
      this.specimenHolder.add(g);
      this.specimenGroups.aurora = g;
    },

    buildRainforestStomata: function () {
      const g = new THREE.Group();
      const leafGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.018, 28);
      const leafMat = new THREE.MeshStandardMaterial({
        color: '#065F46',
        emissive: '#047857',
        emissiveIntensity: 0.28,
        roughness: 0.55
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = -0.04;
      g.add(leaf);

      // Paired kidney-shaped guard cells framing central stomatal pore
      const guardGeo = new THREE.TorusGeometry(0.085, 0.028, 12, 24, Math.PI * 0.95);
      const guardMat = new THREE.MeshStandardMaterial({
        color: '#34D399',
        emissive: '#10B981',
        emissiveIntensity: 0.45,
        roughness: 0.35
      });
      const guardLeft = new THREE.Mesh(guardGeo, guardMat);
      guardLeft.rotation.x = Math.PI / 2;
      guardLeft.rotation.z = Math.PI * 0.52;
      guardLeft.position.set(-0.02, -0.015, 0);

      const guardRight = new THREE.Mesh(guardGeo, guardMat);
      guardRight.rotation.x = Math.PI / 2;
      guardRight.rotation.z = -Math.PI * 0.48;
      guardRight.position.set(0.02, -0.015, 0);
      g.add(guardLeft, guardRight);

      // Transpiring H2O vapor spheres ascending from stomatal aperture
      const dropGeo = new THREE.SphereGeometry(0.014, 10, 8);
      const dropMat = new THREE.MeshBasicMaterial({
        color: '#BAE6FD',
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const vaporDrops = [];
      for (let i = 0; i < 12; i++) {
        const d = new THREE.Mesh(dropGeo, dropMat);
        d.userData = { phase: i / 12, ang: i * 1.9 };
        g.add(d);
        vaporDrops.push(d);
      }

      g.userData = { guardLeft, guardRight, vaporDrops };
      this.disposables.push(leafGeo, leafMat, guardGeo, guardMat, dropGeo, dropMat);
      this.specimenHolder.add(g);
      this.specimenGroups.rainforest = g;
    },

    buildOceanPolyp: function () {
      const g = new THREE.Group();
      // Calcareous aragonite calyx cup
      const cupGeo = new THREE.CylinderGeometry(0.14, 0.10, 0.14, 12, 1, true);
      const cupMat = new THREE.MeshStandardMaterial({
        color: '#E2E8F0',
        roughness: 0.65,
        side: THREE.DoubleSide
      });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.y = -0.06;
      g.add(cup);

      // Ring of 10 swaying translucent polyp tentacles
      const tentGeo = new THREE.ConeGeometry(0.016, 0.16, 8);
      tentGeo.translate(0, 0.08, 0);
      const tentMat = new THREE.MeshStandardMaterial({
        color: '#22D3EE',
        emissive: '#0891B2',
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.84
      });
      const tentacles = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const tm = new THREE.Mesh(tentGeo, tentMat);
        tm.position.set(Math.cos(a) * 0.11, 0.01, Math.sin(a) * 0.11);
        tm.rotation.z = -Math.cos(a) * 0.35;
        tm.rotation.x = Math.sin(a) * 0.35;
        tm.userData = { baseRx: tm.rotation.x, baseRz: tm.rotation.z, phase: i * 0.6 };
        g.add(tm);
        tentacles.push(tm);
      }

      // Orbiting photosynthetic zooxanthellae symbiont spheres inside tissue
      const algaeGeo = new THREE.SphereGeometry(0.016, 10, 8);
      const algaeMat = new THREE.MeshBasicMaterial({ color: '#FBBF24' });
      const algaeList = [];
      for (let i = 0; i < 10; i++) {
        const am = new THREE.Mesh(algaeGeo, algaeMat);
        am.userData = { phase: (i / 10) * Math.PI * 2, r: 0.04 + (i % 3) * 0.022 };
        g.add(am);
        algaeList.push(am);
      }

      g.userData = { tentacles, algaeList };
      this.disposables.push(cupGeo, cupMat, tentGeo, tentMat, algaeGeo, algaeMat);
      this.specimenHolder.add(g);
      this.specimenGroups.ocean = g;
    },

    buildDesertCore: function () {
      const g = new THREE.Group();
      // Upper golden sand dune strata
      const sandGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 28);
      const sandMat = new THREE.MeshStandardMaterial({ color: '#FBBF24', roughness: 0.85 });
      const sandLayer = new THREE.Mesh(sandGeo, sandMat);
      sandLayer.position.y = 0.08;
      g.add(sandLayer);

      // Confining shale/clay cap layer
      const capGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.035, 28);
      const capMat = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.9 });
      const capLayer = new THREE.Mesh(capGeo, capMat);
      capLayer.position.y = 0.025;
      g.add(capLayer);

      // Saturated porous sandstone aquifer reservoir
      const aqGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.10, 28);
      const aqMat = new THREE.MeshStandardMaterial({
        color: '#38BDF8',
        emissive: '#0284C7',
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.82
      });
      const aqLayer = new THREE.Mesh(aqGeo, aqMat);
      aqLayer.position.y = -0.055;
      g.add(aqLayer);

      // Rising hydrostatic artesian fissure column
      const pipeGeo = new THREE.CylinderGeometry(0.022, 0.03, 0.22, 14);
      const pipeMat = new THREE.MeshBasicMaterial({
        color: '#BAE6FD',
        transparent: true,
        opacity: 0.86,
        blending: THREE.AdditiveBlending
      });
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.y = 0.03;
      g.add(pipe);

      g.userData = { pipe, aqLayer };
      this.disposables.push(sandGeo, sandMat, capGeo, capMat, aqGeo, aqMat, pipeGeo, pipeMat);
      this.specimenHolder.add(g);
      this.specimenGroups.desert = g;
    },

    selectSpecimen: function (biomeId) {
      if (!LAB_SPECIMENS[biomeId]) return;
      this.activeBiome = biomeId;
      Object.entries(this.specimenGroups).forEach(([id, grp]) => {
        grp.visible = id === biomeId;
      });
      const spec = LAB_SPECIMENS[biomeId];
      this.plinthRim.material.color.set(spec.accent);
      if (this.isOpen) {
        window.dispatchEvent(new CustomEvent('tabsirah-specimen-inspected', { detail: { specimenId: spec.id, biomeId } }));
      }
      this.emitState();
    },

    setOpen: function (open) {
      this.isOpen = Boolean(open);
      this.labRoot.visible = this.isOpen;
      if (this.isOpen) {
        natureAudio.playTransition();
        const spec = LAB_SPECIMENS[this.activeBiome];
        if (spec) {
          window.dispatchEvent(new CustomEvent('tabsirah-specimen-inspected', { detail: { specimenId: spec.id, biomeId: this.activeBiome } }));
        }
      }
      this.emitState();
    },

    setExtracted: function (extracted) {
      this.isExtracted = Boolean(extracted);
      this.emitState();
    },

    setMicroZoom: function (micro) {
      this.microZoom = Boolean(micro);
      this.setSpecimenScale(this.microZoom ? 1.75 : 1.0);
      natureAudio.playPrismShimmer(this.microZoom ? 0.85 : 0.35);
      this.emitState();
    },

    setSpecimenScale: function (scale) {
      this.specimenScale = THREE.MathUtils.clamp(scale, 0.55, 2.35);
      this.emitState();
    },

    emitState: function () {
      const spec = LAB_SPECIMENS[this.activeBiome] || LAB_SPECIMENS.aurora;
      window.dispatchEvent(
        new CustomEvent('tabsirah-lab-state', {
          detail: {
            open: this.isOpen,
            extracted: this.isExtracted,
            microZoom: this.microZoom,
            scale: this.specimenScale,
            biomeId: this.activeBiome,
            specimen: spec
          }
        })
      );
    },

    tick: function (time, timeDelta) {
      if (!timeDelta || !this.isOpen) return;
      const dt = Math.min(timeDelta, 50) / 1000;
      this.elapsed += dt;

      const targetY = this.isExtracted ? 0.04 : -0.14;
      this.specimenHolder.position.y = THREE.MathUtils.damp(this.specimenHolder.position.y, targetY, 6.0, dt);
      const curScale = THREE.MathUtils.damp(this.specimenHolder.scale.x, this.specimenScale, 7.0, dt);
      this.specimenHolder.scale.setScalar(curScale);

      if (!this.isDragging) this.rotY += dt * 0.32;
      this.specimenHolder.rotation.y = this.rotY;
      this.specimenHolder.rotation.x = this.rotX;

      const t = this.elapsed;
      const au = this.specimenGroups.aurora?.userData;
      if (au && this.activeBiome === 'aurora') {
        const pulse = 1.0 + Math.sin(t * 2.8) * 0.09;
        au.northOval.scale.setScalar(pulse);
        au.southOval.scale.setScalar(pulse);
        au.microShell.visible = this.microZoom;
        au.microShell.rotation.y += dt * 0.6;
      }

      const rf = this.specimenGroups.rainforest?.userData;
      if (rf && this.activeBiome === 'rainforest') {
        const aperture = this.microZoom ? 0.036 : 0.022 + Math.sin(t * 1.4) * 0.008;
        rf.guardLeft.position.x = -aperture;
        rf.guardRight.position.x = aperture;
        rf.vaporDrops.forEach((d) => {
          const p = (t * 0.45 + d.userData.phase) % 1.0;
          d.position.set(
            Math.cos(d.userData.ang + t) * 0.03 * p,
            p * 0.24,
            Math.sin(d.userData.ang + t) * 0.03 * p
          );
          d.scale.setScalar(0.6 + p * 0.7);
        });
      }

      const oc = this.specimenGroups.ocean?.userData;
      if (oc && this.activeBiome === 'ocean') {
        oc.tentacles.forEach((tm) => {
          tm.rotation.z = tm.userData.baseRz + Math.sin(t * 2.2 + tm.userData.phase) * 0.14;
        });
        oc.algaeList.forEach((am) => {
          const a = t * 0.95 + am.userData.phase;
          am.position.set(
            Math.cos(a) * am.userData.r,
            -0.02 + Math.sin(t * 1.8 + am.userData.phase) * 0.025,
            Math.sin(a) * am.userData.r
          );
          am.scale.setScalar(this.microZoom ? 1.45 : 1.0);
        });
      }

      const ds = this.specimenGroups.desert?.userData;
      if (ds && this.activeBiome === 'desert') {
        const flow = 1.0 + Math.sin(t * 2.5) * 0.08;
        ds.pipe.scale.set(flow, 1.0, flow);
      }
    },

    remove: function () {
      window.removeEventListener('tabsirah-lab-command', this.onCommand);
      window.removeEventListener('tabsirah-biome-changed', this.onBiomeChanged);
      window.removeEventListener('pointerdown', this.onPointerDown);
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      this.sceneEl?.object3D?.remove(this.labRoot);
      this.disposables.forEach((d) => d?.dispose());
    }
  });
}
