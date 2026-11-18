/**
 * Tabsirah: Interactive Field Expedition & Spatial Play (`expedition-play.js`)
 *  1. `vista-waypoint` & `vista-rig-navigator` — Walkable/teleportable scenic Vista Overlook pads (4 wide vistas per biome)
 *  2. `interactive-wonder-prop` — 2 multi-part tactile 3D environmental toys per biome with spring kinematics & particle bursts
 */

import { EARTH_BIOMES_DATA } from '../config/earth-biomes-data.js';
import { natureAudio } from './nature-audio.js';
import { tactileTouchFX } from './tactile-touch-fx.js';

export const BIOME_VISTAS = {
  aurora: [
    { index: 0, id: 'aurora-shore', label: '1. Fjord Shore (Center)', pos: [0, 0, 0] },
    { index: 1, id: 'aurora-owl-ridge', label: '2. Snowy Owl Ridge (W)', pos: [-4.4, 0.2, 0.6] },
    { index: 2, id: 'aurora-fumarole', label: '3. Geothermal Spring (E)', pos: [4.6, 0.2, 0.4] },
    { index: 3, id: 'aurora-ice-arch', label: '4. Narwhal Ice Arch (S)', pos: [0.2, 0.25, 4.2] }
  ],
  rainforest: [
    { index: 0, id: 'rainforest-clearing', label: '1. Canopy Clearing (Center)', pos: [0, 0, 0] },
    { index: 1, id: 'rainforest-mycena', label: '2. Mycena Log & Frog (W)', pos: [-4.0, 0.25, 0.9] },
    { index: 2, id: 'rainforest-lagoon', label: '3. Victoria Lagoon (E)', pos: [4.2, 0.25, 0.6] },
    { index: 3, id: 'rainforest-fig-arch', label: '4. Strangler Fig Arch (S)', pos: [-0.2, 0.2, 3.8] }
  ],
  ocean: [
    { index: 0, id: 'ocean-sanctuary', label: '1. Coral Atoll (Center)', pos: [0, 0, 0] },
    { index: 1, id: 'ocean-nautilus', label: '2. Seagrass & Nautilus (W)', pos: [-4.2, 0.2, 0.8] },
    { index: 2, id: 'ocean-vent', label: '3. Hydrothermal Vent (E)', pos: [4.3, 0.2, 0.6] },
    { index: 3, id: 'ocean-karst-arch', label: '4. Karst Reef Arch (S)', pos: [0.2, 0.2, 4.1] }
  ],
  desert: [
    { index: 0, id: 'desert-oasis', label: '1. Oasis Spring (Center)', pos: [0, 0, 0] },
    { index: 1, id: 'desert-rose-wadi', label: '2. Desert Rose Wadi (W)', pos: [-4.4, 0.35, 0.8] },
    { index: 2, id: 'desert-yardang', label: '3. Yardang & Fennec (E)', pos: [4.6, 0.35, 0.6] },
    { index: 3, id: 'desert-wind-harp', label: '4. Wind-Harp Pavilion (S)', pos: [0.2, 0.3, 4.1] }
  ]
};

export const BIOME_WONDER_PROPS = {
  aurora: [
    {
      propType: 'ice-harp',
      biomeId: 'aurora',
      title: 'Singing Ice Harp',
      fact: 'Crystalline ice pipes resonate crisp high-Q acoustic harmonics in sub-zero polar air.',
      accent: '#67E8F9',
      position: '-3.85 0.95 -3.6'
    },
    {
      propType: 'solar-armillary',
      biomeId: 'aurora',
      title: 'Solar Wind Conduit Sphere',
      fact: 'Channeling geomagnetic gusts excites upper-atmospheric oxygen into 557.7 nm emerald curtains.',
      accent: '#34D399',
      position: '3.95 1.12 3.1'
    }
  ],
  rainforest: [
    {
      propType: 'touch-orchid',
      biomeId: 'rainforest',
      title: 'Bioluminescent Canopy Orchid',
      fact: 'Nectar-bearing rainforest orchids open rapidly under mist and tactile contact to guide pollinators.',
      accent: '#F472B6',
      position: '-3.75 0.95 -3.4'
    },
    {
      propType: 'rain-drum',
      biomeId: 'rainforest',
      title: 'Hollow Cedar Rain Drum',
      fact: 'Dense heartwood chambers carry low-frequency acoustic vibrations beneath the rainforest canopy.',
      accent: '#34D399',
      position: '3.65 0.88 2.95'
    }
  ],
  ocean: [
    {
      propType: 'pearl-clam',
      biomeId: 'ocean',
      title: 'Giant Pearl Clam Sanctuary',
      fact: 'Tridacna giant clams host photosynthetic algae inside their mantle while depositing iridescent nacre.',
      accent: '#38BDF8',
      position: '-3.85 0.72 -3.4'
    },
    {
      propType: 'sonar-bell',
      biomeId: 'ocean',
      title: 'Pelagic Sonar Bell',
      fact: 'Sound travels ~4.3x faster through seawater (~1,500 m/s), letting whales and reef fish sense across kilometers.',
      accent: '#22D3EE',
      position: '3.95 1.05 3.1'
    }
  ],
  desert: [
    {
      propType: 'sand-chime',
      biomeId: 'desert',
      title: 'Singing Quartz Sand Chime',
      fact: 'Wind-sorted Sahara quartz grains (~0.2 mm) produce booming and singing aeolian resonances across dune slip-faces.',
      accent: '#FBBF24',
      position: '-3.95 1.15 -3.8'
    },
    {
      propType: 'astrolabe-dial',
      biomeId: 'desert',
      title: 'Celestial Astrolabe Sundial',
      fact: 'Classical desert astronomers mapped solar altitude and twilight scattering with brass armillary rings.',
      accent: '#F59E0B',
      position: '3.85 1.08 3.25'
    }
  ]
};

function makeGlowSpriteTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePlaqueTexture(title, subtitle, accentColor = '#38BDF8') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');

  const draw = (hovered = false) => {
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = hovered ? 'rgba(10, 22, 42, 0.94)' : 'rgba(6, 13, 28, 0.84)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(8, 8, 496, 112, 18);
    } else {
      const x = 8, y = 8, w = 496, h = 112, r = 18;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    ctx.fill();

    ctx.lineWidth = hovered ? 3 : 1.5;
    ctx.strokeStyle = hovered ? accentColor : 'rgba(255,255,255,0.22)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(title, 256, 56);

    ctx.fillStyle = accentColor;
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtitle, 256, 92);
  };

  draw(false);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, draw };
}



function playTeleportWhooshAudio() {
  if (!natureAudio.ensureContext() || natureAudio.isMuted || !natureAudio.ctx) return;
  const ctx = natureAudio.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.04, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  osc.connect(g);
  g.connect(natureAudio.masterGain);
  osc.start(now);
  osc.stop(now + 0.3);
}

if (typeof AFRAME !== 'undefined') {
  /**
   * 1. Smooth Vista Navigator (`vista-rig-navigator` mounted on `#rig`)
   */
  if (!AFRAME.components['vista-rig-navigator']) {
    const _targetPos = new THREE.Vector3();

    AFRAME.registerComponent('vista-rig-navigator', {
      init: function () {
        this.currentIndex = 0;
        this.gliding = false;
        this.targetVec = new THREE.Vector3(0, 0, 0);

        this.goToVista = (index = 0, immediate = false) => {
          const scene = this.el.sceneEl;
          if (scene?.is('ar-mode') || scene?.components?.['xr-tabletop-portal']?.isTabletopMode) {
            return;
          }
          const biomeId = window.tabsirahActiveBiome || 'aurora';
          const vistas = BIOME_VISTAS[biomeId] || BIOME_VISTAS.aurora;
          const idx = Math.max(0, Math.min(vistas.length - 1, Number(index) || 0));
          const vista = vistas[idx];
          if (!vista) return;

          this.currentIndex = idx;
          this.targetVec.set(vista.pos[0], vista.pos[1], vista.pos[2]);

          if (immediate) {
            this.el.object3D.position.copy(this.targetVec);
            this.gliding = false;
          } else {
            this.gliding = true;
            natureAudio.unlock();
            playTeleportWhooshAudio();
            window.tabsirahHaptics?.playPattern('ui-tap', { hand: 'both' });
            window.dispatchEvent(
              new CustomEvent('tabsirah-wonder-progress', {
                detail: { message: `Moved to ${vista.label}` }
              })
            );
          }

          window.dispatchEvent(
            new CustomEvent('tabsirah-vista-changed', {
              detail: { biomeId, index: idx, label: vista.label, vistas }
            })
          );
        };

        window.tabsirahGoToVista = (index, immediate = false) => this.goToVista(index, immediate);

        this.onGoVista = (e) => {
          this.goToVista(e.detail?.index ?? 0, Boolean(e.detail?.immediate));
        };
        this.onBiomeChanged = () => {
          this.goToVista(0, true);
        };
        this.onTabletopState = (e) => {
          if (e.detail?.active) this.goToVista(0, true);
        };

        window.addEventListener('tabsirah-vista-go', this.onGoVista);
        window.addEventListener('tabsirah-biome-changed', this.onBiomeChanged);
        window.addEventListener('tabsirah-tabletop-state', this.onTabletopState);
      },

      tick: function (time, timeDelta) {
        if (!this.gliding || !timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        const p = this.el.object3D.position;
        _targetPos.copy(this.targetVec);
        p.x = THREE.MathUtils.damp(p.x, _targetPos.x, 7.5, dt);
        p.y = THREE.MathUtils.damp(p.y, _targetPos.y, 7.5, dt);
        p.z = THREE.MathUtils.damp(p.z, _targetPos.z, 7.5, dt);
        if (p.distanceToSquared(_targetPos) < 0.0004) {
          p.copy(_targetPos);
          this.gliding = false;
        }
      },

      remove: function () {
        window.removeEventListener('tabsirah-vista-go', this.onGoVista);
        window.removeEventListener('tabsirah-biome-changed', this.onBiomeChanged);
        window.removeEventListener('tabsirah-tabletop-state', this.onTabletopState);
      }
    });
  }

  /**
   * 2. Walkable/Teleportable Floor Vista Pad (`vista-waypoint`)
   */
  if (!AFRAME.components['vista-waypoint']) {
    AFRAME.registerComponent('vista-waypoint', {
      schema: {
        vistaIndex: { type: 'number', default: 1 },
        label: { type: 'string', default: 'Overlook' },
        accentColor: { type: 'color', default: '#38BDF8' }
      },

      init: function () {
        this.disposables = [];
        this.isHovered = false;
        this.elapsed = 0;

        const group = new THREE.Group();
        this.group = group;
        const accent = new THREE.Color(this.data.accentColor);

        // 1. Compass Base Ring
        const outerGeo = new THREE.TorusGeometry(0.32, 0.014, 10, 40);
        this.outerMat = new THREE.MeshBasicMaterial({
          color: accent,
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending
        });
        const outerMesh = new THREE.Mesh(outerGeo, this.outerMat);
        outerMesh.rotation.x = -Math.PI / 2;
        group.add(outerMesh);

        // 2. Inner Disc Pad
        const discGeo = new THREE.CircleGeometry(0.24, 32);
        this.discMat = new THREE.MeshBasicMaterial({
          color: accent,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const discMesh = new THREE.Mesh(discGeo, this.discMat);
        discMesh.rotation.x = -Math.PI / 2;
        discMesh.position.y = 0.005;
        group.add(discMesh);

        // 3. Gentle Translucent Light Column
        const colGeo = new THREE.CylinderGeometry(0.21, 0.26, 0.95, 24, 1, true);
        this.colMat = new THREE.MeshBasicMaterial({
          color: accent,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const colMesh = new THREE.Mesh(colGeo, this.colMat);
        colMesh.position.y = 0.48;
        group.add(colMesh);

        // 4. Floating Label Plaque
        this.plaqueEntry = makePlaqueTexture(this.data.label, 'Step / Click to Visit', this.data.accentColor);
        const plaqueGeo = new THREE.PlaneGeometry(0.68, 0.17);
        this.plaqueMat = new THREE.MeshBasicMaterial({
          map: this.plaqueEntry.tex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        this.plaqueMesh = new THREE.Mesh(plaqueGeo, this.plaqueMat);
        this.plaqueMesh.position.y = 0.62;
        group.add(this.plaqueMesh);

        // 5. Generous invisible hit cylinder
        const hitGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.85, 12);
        const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.y = 0.42;
        group.add(hitMesh);

        this.disposables.push(outerGeo, this.outerMat, discGeo, this.discMat, colGeo, this.colMat, plaqueGeo, this.plaqueMat, this.plaqueEntry.tex, hitGeo, hitMat);
        this.el.setObject3D('mesh', group);
        this.el.classList.add('interactive-node', 'vr-interactive');

        this.onHover = () => {
          this.isHovered = true;
          document.body.style.cursor = 'pointer';
          this.outerMat.opacity = 1.0;
          this.discMat.opacity = 0.42;
          this.colMat.opacity = 0.24;
          this.plaqueEntry.draw(true);
          this.plaqueEntry.tex.needsUpdate = true;
        };
        this.onLeave = () => {
          this.isHovered = false;
          document.body.style.cursor = '';
          this.outerMat.opacity = 0.78;
          this.discMat.opacity = 0.22;
          this.colMat.opacity = 0.12;
          this.plaqueEntry.draw(false);
          this.plaqueEntry.tex.needsUpdate = true;
        };
        this.onActivate = (evt) => {
          evt?.stopPropagation?.();
          window.dispatchEvent(new CustomEvent('tabsirah-vista-go', { detail: { index: this.data.vistaIndex } }));
        };

        this.el.addEventListener('mouseenter', this.onHover);
        this.el.addEventListener('mouseleave', this.onLeave);
        this.el.addEventListener('click', this.onActivate);
        this.el.addEventListener('pinchstarted', this.onActivate);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        this.elapsed += dt;
        const cam = this.el.sceneEl?.camera;
        if (cam && this.plaqueMesh) {
          this.plaqueMesh.lookAt(cam.getWorldPosition(this._camPos || (this._camPos = new THREE.Vector3())));
        }
        const pulse = 1.0 + Math.sin(this.elapsed * 2.6) * 0.05;
        this.group.scale.set(pulse, 1, pulse);
      },

      remove: function () {
        document.body.style.cursor = '';
        this.el.removeEventListener('mouseenter', this.onHover);
        this.el.removeEventListener('mouseleave', this.onLeave);
        this.el.removeEventListener('click', this.onActivate);
        this.el.removeEventListener('pinchstarted', this.onActivate);
        this.el.removeObject3D('mesh');
        this.disposables.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 3. Multi-Part Playable Environmental Wonder Toys (`interactive-wonder-prop`)
   */
  if (!AFRAME.components['interactive-wonder-prop']) {
    const _handCheckPos = new THREE.Vector3();
    const _propWorldPos = new THREE.Vector3();
    const _sparkColor = new THREE.Color();

    AFRAME.registerComponent('interactive-wonder-prop', {
      schema: {
        propType: { type: 'string', default: 'ice-harp' },
        biomeId: { type: 'string', default: 'aurora' },
        title: { type: 'string', default: 'Living Wonder' },
        fact: { type: 'string', default: '' },
        accentColor: { type: 'color', default: '#34D399' }
      },

      init: function () {
        this.disposables = [];
        this.elapsed = 0;
        this.energy = 0;
        this.toggleState = false;
        this.lastTriggerTime = 0;
        this.isHovered = false;
        this.animatedParts = [];
        this.sparkBurst = null;

        this.group = new THREE.Group();
        this.group.scale.setScalar(1.25);
        const accent = new THREE.Color(this.data.accentColor);
        this._accent = accent;

        this.buildPropGeometry(this.data.propType, accent);
        this.buildBurstParticles(accent);

        // Generous invisible touch sphere for effortless pointing/pinching
        const hitGeo = new THREE.SphereGeometry(0.55, 12, 10);
        const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.y = 0.25;
        this.group.add(hitMesh);
        this.disposables.push(hitGeo, hitMat);

        // Floating miniature hover plaque
        this.plaqueEntry = makePlaqueTexture(this.data.title, 'Touch / Click to Play', this.data.accentColor);
        const plaqueGeo = new THREE.PlaneGeometry(0.62, 0.155);
        const plaqueMat = new THREE.MeshBasicMaterial({
          map: this.plaqueEntry.tex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        this.plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
        this.plaqueMesh.position.y = 0.68;
        this.plaqueMesh.visible = false;
        this.group.add(this.plaqueMesh);
        this.disposables.push(plaqueGeo, plaqueMat, this.plaqueEntry.tex);

        this.el.setObject3D('mesh', this.group);
        this.el.classList.add('interactive-node', 'vr-interactive');
        this.el.dataset.tactileHandled = 'true';

        tactileTouchFX.registerInteractiveSurface(this.group, {
          biomeId: this.data.biomeId,
          specimenKey: `wonder-${this.data.propType}`,
          proximityTarget: true,
          proximityRadius: 0.45,
          springTarget: this.group,
          springOptions: { liftAmount: 0.045, recoilAmount: 0.04, squashAmount: 0.12 }
        });

        this.onHover = () => {
          this.isHovered = true;
          this.plaqueMesh.visible = true;
          this.plaqueEntry.draw(true);
          this.plaqueEntry.tex.needsUpdate = true;
          document.body.style.cursor = 'pointer';
        };
        this.onLeave = () => {
          this.isHovered = false;
          this.plaqueMesh.visible = false;
          document.body.style.cursor = '';
        };
        this.onTrigger = (evt) => {
          evt?.stopPropagation?.();
          const handId = evt?.detail?.hand || evt?.detail?.cursorEl?.id || '';
          this.playWonderToy(handId);
        };

        this.el.addEventListener('mouseenter', this.onHover);
        this.el.addEventListener('mouseleave', this.onLeave);
        this.el.addEventListener('click', this.onTrigger);
        this.el.addEventListener('pinchstarted', this.onTrigger);
      },

      buildBurstParticles: function (accent) {
        const COUNT = 36;
        this.sparkCount = COUNT;
        this.sparkPos = new Float32Array(COUNT * 3);
        this.sparkVel = new Float32Array(COUNT * 3);
        this.sparkAge = new Float32Array(COUNT);
        for (let i = 0; i < COUNT; i++) {
          this.sparkAge[i] = 99;
          this.sparkPos[i * 3 + 1] = -999;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3));
        const tex = makeGlowSpriteTexture();
        const mat = new THREE.PointsMaterial({
          size: 0.11,
          map: tex,
          color: accent,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.sparkBurst = new THREE.Points(geo, mat);
        this.sparkBurst.frustumCulled = false;
        this.group.add(this.sparkBurst);
        this.disposables.push(geo, mat, tex);
      },

      spawnBurst: function () {
        for (let i = 0; i < this.sparkCount; i++) {
          const i3 = i * 3;
          const a = (i / this.sparkCount) * Math.PI * 2 + Math.random() * 0.4;
          const r = 0.05 + Math.random() * 0.16;
          this.sparkPos[i3] = Math.cos(a) * r;
          this.sparkPos[i3 + 1] = 0.2 + Math.random() * 0.18;
          this.sparkPos[i3 + 2] = Math.sin(a) * r;

          this.sparkVel[i3] = Math.cos(a) * (0.35 + Math.random() * 0.45);
          this.sparkVel[i3 + 1] = 0.45 + Math.random() * 0.75;
          this.sparkVel[i3 + 2] = Math.sin(a) * (0.35 + Math.random() * 0.45);
          this.sparkAge[i] = 0;
        }
        this.sparkBurst.geometry.attributes.position.needsUpdate = true;
      },

      buildPropGeometry: function (type, accent) {
        const metalMat = new THREE.MeshStandardMaterial({
          color: '#CBD5E1',
          metalness: 0.85,
          roughness: 0.18
        });
        const stoneMat = new THREE.MeshStandardMaterial({
          color: '#1E293B',
          metalness: 0.12,
          roughness: 0.78
        });
        const glowMat = new THREE.MeshStandardMaterial({
          color: '#FFFFFF',
          emissive: accent,
          emissiveIntensity: 0.85,
          roughness: 0.16,
          metalness: 0.2,
          transparent: true,
          opacity: 0.92
        });
        this.glowMat = glowMat;
        this.disposables.push(metalMat, stoneMat, glowMat);

        if (type === 'ice-harp') {
          const baseGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.1, 8);
          const base = new THREE.Mesh(baseGeo, stoneMat);
          this.group.add(base);
          const archGeo = new THREE.TorusGeometry(0.28, 0.018, 10, 28, Math.PI);
          const arch = new THREE.Mesh(archGeo, metalMat);
          arch.position.y = 0.12;
          this.group.add(arch);
          this.disposables.push(baseGeo, archGeo);

          for (let i = 0; i < 7; i++) {
            const h = 0.22 + (1 - Math.abs(i - 3) / 3.5) * 0.22;
            const pipeGeo = new THREE.CylinderGeometry(0.016, 0.016, h, 8);
            const pipeMat = glowMat.clone();
            const pipe = new THREE.Mesh(pipeGeo, pipeMat);
            pipe.position.set((i - 3) * 0.065, 0.14 + h * 0.5, 0);
            this.group.add(pipe);
            this.animatedParts.push({ mesh: pipe, mat: pipeMat, baseY: pipe.position.y, index: i });
            this.disposables.push(pipeGeo, pipeMat);
          }
        } else if (type === 'solar-armillary' || type === 'astrolabe-dial') {
          const pedGeo = new THREE.CylinderGeometry(0.14, 0.22, 0.14, 12);
          const ped = new THREE.Mesh(pedGeo, stoneMat);
          this.group.add(ped);
          this.disposables.push(pedGeo);

          const radii = [0.28, 0.22, 0.16];
          radii.forEach((r, idx) => {
            const ringGeo = new THREE.TorusGeometry(r, 0.014, 10, 36);
            const ring = new THREE.Mesh(ringGeo, idx === 0 ? metalMat : glowMat);
            ring.position.y = 0.32;
            ring.rotation.set(idx * 0.6, idx * 0.9, 0);
            this.group.add(ring);
            this.animatedParts.push({ mesh: ring, speed: 0.7 + idx * 0.5 });
            this.disposables.push(ringGeo);
          });

          const coreGeo = new THREE.OctahedronGeometry(0.08, 1);
          const core = new THREE.Mesh(coreGeo, glowMat);
          core.position.y = 0.32;
          this.group.add(core);
          this.coreMesh = core;
          this.disposables.push(coreGeo);
        } else if (type === 'touch-orchid') {
          const moundGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.12, 12);
          const mound = new THREE.Mesh(moundGeo, stoneMat);
          this.group.add(mound);
          const stemGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.24, 10);
          const stem = new THREE.Mesh(stemGeo, stoneMat);
          stem.position.y = 0.16;
          this.group.add(stem);
          this.disposables.push(moundGeo, stemGeo);

          for (let i = 0; i < 6; i++) {
            const pivot = new THREE.Group();
            pivot.position.y = 0.27;
            pivot.rotation.y = (i / 6) * Math.PI * 2;
            const petalGeo = new THREE.ConeGeometry(0.085, 0.24, 8);
            petalGeo.scale(1, 1, 0.35);
            const petal = new THREE.Mesh(petalGeo, glowMat);
            petal.position.set(0, 0.11, 0.05);
            petal.rotation.x = 0.42;
            pivot.add(petal);
            this.group.add(pivot);
            this.animatedParts.push({ mesh: petal, baseRot: 0.42 });
            this.disposables.push(petalGeo);
          }
          const budGeo = new THREE.SphereGeometry(0.06, 12, 10);
          const bud = new THREE.Mesh(budGeo, metalMat);
          bud.position.y = 0.29;
          this.group.add(bud);
          this.disposables.push(budGeo);
        } else if (type === 'rain-drum') {
          const bodyGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.34, 16);
          const body = new THREE.Mesh(bodyGeo, stoneMat);
          body.position.y = 0.17;
          this.group.add(body);
          const rimGeo = new THREE.TorusGeometry(0.245, 0.018, 10, 32);
          const rim = new THREE.Mesh(rimGeo, metalMat);
          rim.rotation.x = Math.PI / 2;
          rim.position.y = 0.34;
          this.group.add(rim);
          const headGeo = new THREE.CircleGeometry(0.23, 28);
          const head = new THREE.Mesh(headGeo, glowMat);
          head.rotation.x = -Math.PI / 2;
          head.position.y = 0.345;
          this.group.add(head);
          this.drumHead = head;
          this.disposables.push(bodyGeo, rimGeo, headGeo);
        } else if (type === 'pearl-clam') {
          const baseShellGeo = new THREE.SphereGeometry(0.28, 18, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.45);
          const baseShell = new THREE.Mesh(baseShellGeo, stoneMat);
          baseShell.scale.set(1.2, 0.65, 1.0);
          baseShell.position.y = 0.12;
          this.group.add(baseShell);

          const lidPivot = new THREE.Group();
          lidPivot.position.set(0, 0.14, -0.22);
          const lidGeo = new THREE.SphereGeometry(0.28, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.48);
          const lid = new THREE.Mesh(lidGeo, metalMat);
          lid.scale.set(1.2, 0.65, 1.0);
          lid.position.set(0, 0, 0.22);
          lidPivot.add(lid);
          lidPivot.rotation.x = -0.22;
          this.group.add(lidPivot);
          this.clamLid = lidPivot;

          const pearlGeo = new THREE.SphereGeometry(0.085, 16, 14);
          const pearl = new THREE.Mesh(pearlGeo, glowMat);
          pearl.position.set(0, 0.16, 0.02);
          this.group.add(pearl);
          this.coreMesh = pearl;
          this.disposables.push(baseShellGeo, lidGeo, pearlGeo);
        } else if (type === 'sonar-bell') {
          const yokeGeo = new THREE.TorusGeometry(0.26, 0.016, 10, 28, Math.PI);
          const yoke = new THREE.Mesh(yokeGeo, metalMat);
          yoke.position.y = 0.24;
          this.group.add(yoke);
          const bellGeo = new THREE.ConeGeometry(0.18, 0.32, 20, 1, true);
          const bell = new THREE.Mesh(bellGeo, metalMat);
          bell.position.y = 0.26;
          this.group.add(bell);
          const clapperGeo = new THREE.SphereGeometry(0.065, 12, 10);
          const clapper = new THREE.Mesh(clapperGeo, glowMat);
          clapper.position.y = 0.12;
          this.group.add(clapper);
          this.sonarBell = bell;
          this.coreMesh = clapper;
          this.disposables.push(yokeGeo, bellGeo, clapperGeo);
        } else {
          // Singing Quartz Sand Chime
          const archGeo = new THREE.TorusGeometry(0.28, 0.018, 10, 28, Math.PI);
          const arch = new THREE.Mesh(archGeo, metalMat);
          arch.position.y = 0.24;
          this.group.add(arch);
          const baseGeo = new THREE.CylinderGeometry(0.22, 0.27, 0.08, 12);
          const base = new THREE.Mesh(baseGeo, stoneMat);
          this.group.add(base);
          this.disposables.push(archGeo, baseGeo);

          for (let i = 0; i < 5; i++) {
            const chimeGeo = new THREE.OctahedronGeometry(0.042, 0);
            chimeGeo.scale(0.65, 2.4, 0.65);
            const chime = new THREE.Mesh(chimeGeo, glowMat);
            chime.position.set((i - 2) * 0.095, 0.26, 0);
            this.group.add(chime);
            this.animatedParts.push({ mesh: chime, index: i });
            this.disposables.push(chimeGeo);
          }
        }
      },

      playWonderToy: function (handId = '') {
        const now = performance.now();
        if (now - this.lastTriggerTime < 280) return;
        this.lastTriggerTime = now;
        this.energy = 1.0;
        this.toggleState = !this.toggleState;

        natureAudio.unlock();
        this.el.object3D.getWorldPosition(_propWorldPos);
        this.spawnBurst();

        // Dispatch rich spatial sound per toy
        const type = this.data.propType;
        if (type === 'ice-harp') {
          const notes = [587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
          notes.forEach((f, idx) => natureAudio.playTone(f, 0.65, 'sine', 0.045, idx * 0.06, _propWorldPos));
          natureAudio.playIceChime(_propWorldPos);
        } else if (type === 'solar-armillary') {
          this.el.sceneEl?.emit('aurora-magnetic-pulse', {}, false);
          natureAudio.playCoronalBurst(_propWorldPos);
        } else if (type === 'touch-orchid') {
          [392.0, 493.88, 587.33, 783.99].forEach((f, idx) =>
            natureAudio.playTone(f, 0.55, 'triangle', 0.045, idx * 0.07, _propWorldPos)
          );
          natureAudio.playSpatialBirdCall(_propWorldPos);
        } else if (type === 'rain-drum') {
          natureAudio.playTone(110, 0.45, 'sine', 0.09, 0, _propWorldPos);
          natureAudio.playTone(164.81, 0.35, 'triangle', 0.055, 0.08, _propWorldPos);
          natureAudio.playWonderRipple('rainforest', _propWorldPos);
        } else if (type === 'pearl-clam') {
          natureAudio.playBubbleCluster(_propWorldPos);
          [523.25, 659.25, 783.99].forEach((f, idx) =>
            natureAudio.playTone(f, 0.6, 'sine', 0.045, idx * 0.08, _propWorldPos)
          );
        } else if (type === 'sonar-bell') {
          natureAudio.playAbyssalPing(_propWorldPos);
          natureAudio.playWhaleCall(_propWorldPos);
        } else if (type === 'sand-chime') {
          [220.0, 277.18, 329.63, 440.0, 554.37].forEach((f, idx) =>
            natureAudio.playTone(f, 0.72, 'sine', 0.04, idx * 0.07, _propWorldPos)
          );
        } else if (type === 'astrolabe-dial') {
          const mgr = window.tabsirahBiomeManager;
          if (mgr) {
            const nextSolar = mgr.solarElevation > 0.15 ? -0.18 : 0.42;
            mgr.animateSolarTo(nextSolar);
          }
          natureAudio.playTone(293.66, 0.65, 'triangle', 0.05, 0, _propWorldPos);
          natureAudio.playTone(440.0, 0.75, 'sine', 0.045, 0.09, _propWorldPos);
        }

        // Tactile FX + Biome-calibrated Haptics
        tactileTouchFX.trigger({
          el: this.el,
          meshTarget: this.group,
          springTarget: this.group,
          worldPoint: _propWorldPos,
          biomeId: this.data.biomeId,
          specimenKey: `wonder-${type}`
        });
        window.tabsirahHaptics?.playPattern('beacon-touch', {
          biomeId: this.data.biomeId,
          hand: handId || 'both'
        });

        window.dispatchEvent(
          new CustomEvent('tabsirah-wonder-interacted', {
            detail: { propType: type, biomeId: this.data.biomeId, title: this.data.title }
          })
        );
        window.dispatchEvent(
          new CustomEvent('tabsirah-wonder-progress', {
            detail: { message: `${this.data.title} — ${this.data.fact}` }
          })
        );
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        this.elapsed += dt;
        this.energy = Math.max(0, this.energy - dt * 0.72);

        if (this.glowMat) {
          this.glowMat.emissiveIntensity = 0.8 + this.energy * 1.45 + (this.isHovered ? 0.45 : 0);
        }
        const targetHoverScale = this.isHovered ? 1.32 : 1.25;
        const curScale = THREE.MathUtils.damp(this.group.scale.x, targetHoverScale, 8.0, dt);
        this.group.scale.setScalar(curScale);

        const type = this.data.propType;
        if (type === 'ice-harp') {
          this.animatedParts.forEach((p) => {
            const ripple = Math.sin(this.elapsed * 9 - p.index * 0.7) * 0.025 * this.energy;
            p.mesh.position.y = p.baseY + ripple;
            p.mat.emissiveIntensity = 0.85 + Math.max(0, Math.sin(this.elapsed * 8 - p.index * 0.6)) * 1.4 * this.energy;
          });
        } else if (type === 'solar-armillary' || type === 'astrolabe-dial') {
          const boost = 1 + this.energy * 5.2;
          this.animatedParts.forEach((p, idx) => {
            p.mesh.rotation.y += dt * p.speed * boost;
            p.mesh.rotation.x += dt * p.speed * 0.45 * boost * (idx % 2 === 0 ? 1 : -1);
          });
          if (this.coreMesh) {
            this.coreMesh.scale.setScalar(1 + this.energy * 0.35);
          }
        } else if (type === 'touch-orchid') {
          const targetOpen = this.toggleState ? 1.12 : 0.42;
          this.animatedParts.forEach((p, idx) => {
            const target = targetOpen + Math.sin(this.elapsed * 3.5 + idx) * 0.08 * this.energy;
            p.mesh.rotation.x = THREE.MathUtils.damp(p.mesh.rotation.x, target, 6.0, dt);
          });
        } else if (type === 'rain-drum' && this.drumHead) {
          const bounce = 1 + Math.sin(this.elapsed * 22) * 0.14 * this.energy;
          this.drumHead.scale.setScalar(bounce);
        } else if (type === 'pearl-clam' && this.clamLid) {
          const targetLid = this.toggleState ? -0.95 : -0.22;
          this.clamLid.rotation.x = THREE.MathUtils.damp(this.clamLid.rotation.x, targetLid, 5.5, dt);
          if (this.coreMesh) this.coreMesh.scale.setScalar(1 + (this.toggleState ? 0.22 : 0) + this.energy * 0.2);
        } else if (type === 'sonar-bell' && this.sonarBell) {
          this.sonarBell.rotation.z = Math.sin(this.elapsed * 10) * 0.24 * this.energy;
        } else if (type === 'sand-chime') {
          this.animatedParts.forEach((p) => {
            p.mesh.rotation.z = Math.sin(this.elapsed * 6 + p.index * 0.8) * (0.08 + this.energy * 0.36);
          });
        }

        // Update pooled burst sparks
        if (this.sparkBurst) {
          let dirty = false;
          for (let i = 0; i < this.sparkCount; i++) {
            if (this.sparkAge[i] > 1.35) continue;
            dirty = true;
            this.sparkAge[i] += dt;
            const i3 = i * 3;
            this.sparkPos[i3] += this.sparkVel[i3] * dt;
            this.sparkPos[i3 + 1] += this.sparkVel[i3 + 1] * dt;
            this.sparkPos[i3 + 2] += this.sparkVel[i3 + 2] * dt;
            this.sparkVel[i3 + 1] -= 0.45 * dt;
            if (this.sparkAge[i] >= 1.35) {
              this.sparkPos[i3 + 1] = -999;
            }
          }
          if (dirty) {
            this.sparkBurst.geometry.attributes.position.needsUpdate = true;
          }
        }

        // Face plaque toward camera when visible
        if (this.plaqueMesh?.visible && this.el.sceneEl?.camera) {
          this.plaqueMesh.lookAt(
            this.el.sceneEl.camera.getWorldPosition(this._camPos || (this._camPos = new THREE.Vector3()))
          );
        }

        // Direct Meta Quest Bare-Hand touch detection
        if (this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode')) {
          this.el.object3D.getWorldPosition(_propWorldPos);
          if (!this._cachedHands) {
            this._cachedHands = [document.getElementById('left-hand'), document.getElementById('right-hand')];
          }
          for (let i = 0; i < this._cachedHands.length; i++) {
            const h = this._cachedHands[i];
            if (!h?.isConnected || !h.object3D) continue;
            h.object3D.getWorldPosition(_handCheckPos);
            if (_handCheckPos.lengthSq() > 0.001 && _handCheckPos.distanceTo(_propWorldPos) < 0.36) {
              this.playWonderToy(h.id);
              break;
            }
          }
        }
      },

      remove: function () {
        document.body.style.cursor = '';
        tactileTouchFX.unregisterInteractiveSurface(this.group);
        this.el.removeEventListener('mouseenter', this.onHover);
        this.el.removeEventListener('mouseleave', this.onLeave);
        this.el.removeEventListener('click', this.onTrigger);
        this.el.removeEventListener('pinchstarted', this.onTrigger);
        this.el.removeObject3D('mesh');
        this.disposables.forEach((d) => d?.dispose());
      }
    });
  }
}


