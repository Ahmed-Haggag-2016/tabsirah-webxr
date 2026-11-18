/**
 * Tabṣirah: 360° Multi-Disciplinary Scientific Ecosystems & Interactive Field Encounters
 * Expands every biome across East (+X), West (-X), South/Behind (+Z), and Sky Canopy
 * so rotating 360° reveals authentic, grounded composite flora, fauna, geology & playable wonders.
 * 100% Procedural Geometry, PBR Textures & Spatial Web Audio (zero external assets).
 */

import { natureAudio } from './nature-audio.js';
import { getBiomePBRTextures } from './pbr-texture-factory.js';
import { tactileTouchFX } from './tactile-touch-fx.js';

export const BIOME_360_SITES = {
  aurora: {
    N: { dir: 'N', title: 'Geomagnetic Aurora Beacon', discipline: 'Plasma Physics' },
    E: { dir: 'E', title: 'Basalt Geothermal Fumarole', discipline: 'Volcanology & Extremophiles' },
    S: { dir: 'S', title: 'Glacial Arch & Narwhal Channel', discipline: 'Glaciology & Marine Mammalogy' },
    W: { dir: 'W', title: 'Snowy Owl & Lichen Inuksuk Ridge', discipline: 'Arctic Ornithology & Lichenology' }
  },
  rainforest: {
    N: { dir: 'N', title: 'Canopy Rain & Waterfall Cliff', discipline: 'Tropical Hydrology' },
    E: { dir: 'E', title: 'Victoria amazonica & Mangrove Lagoon', discipline: 'Wetland Botany' },
    S: { dir: 'S', title: 'Strangler Fig Arch & Toco Toucan', discipline: 'Canopy Symbiosis' },
    W: { dir: 'W', title: 'Bioluminescent Mycena Log & Dart Frog', discipline: 'Mycology & Herpetology' }
  },
  ocean: {
    N: { dir: 'N', title: 'Sunlit Coral Symbiosis Reef', discipline: 'Reef Ecology & Optics' },
    E: { dir: 'E', title: 'Carbonate Hydrothermal Chimney', discipline: 'Deep Geochemistry & Chemosynthesis' },
    S: { dir: 'S', title: 'Karst Limestone Arch & Eagle Ray', discipline: 'Karst Geology & Pelagic Rays' },
    W: { dir: 'W', title: 'Posidonia Meadow & Chambered Nautilus', discipline: 'Malacology & Seagrass Ecology' }
  },
  desert: {
    N: { dir: 'N', title: 'Artesian Oasis & Star Compass', discipline: 'Hydrogeology & Astronomy' },
    E: { dir: 'E', title: 'Sandstone Yardang, Gnomon & Fennec Fox', discipline: 'Aeolian Geomorphology' },
    S: { dir: 'S', title: 'Aeolian Wind-Harp & Lanner Falcon', discipline: 'Acoustic Physics & Ornithology' },
    W: { dir: 'W', title: 'Gypsum Desert Rose Wadi Shelf', discipline: 'Evaporite Mineralogy' }
  }
};

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
  return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) +
    (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v;
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

function getAuroraGroundY(x, z) {
  const distCamera = Math.hypot(x, z - 1.0);
  const distLake = Math.hypot(x, z + 4.5);
  const clearMask = THREE.MathUtils.smoothstep(Math.min(distCamera, distLake), 5.2, 13.0);
  const ridgeDist = Math.hypot(x, z);
  const mountainRing = THREE.MathUtils.smoothstep(ridgeDist, 14.0, 52.0);
  const rollingHills =
    (fbm2D(x * 0.08 + 4, z * 0.08 + 4, 3) * 2.4 + Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.65) * clearMask;
  const perimeterPeaks = (3.5 + fbm2D(x * 0.055 + 11, z * 0.055 + 9, 4) * 10.5) * mountainRing;
  return rollingHills + perimeterPeaks - (1 - clearMask) * 0.16;
}

function getRainforestGroundY(x, z) {
  const dCam = Math.hypot(x, z - 0.5);
  const dRiver = Math.abs(x - 0.85);
  const clearing = THREE.MathUtils.smoothstep(dCam, 4.5, 11.5) * THREE.MathUtils.smoothstep(dRiver, 1.8, 3.8);
  const rim = THREE.MathUtils.smoothstep(Math.hypot(x, z), 16.0, 52.0);
  return (fbm2D(x * 0.09 + 2, z * 0.09 + 5, 3) * 1.8 + 0.3) * clearing + rim * (2.5 + fbm2D(x * 0.06, z * 0.06, 3) * 5.0);
}

function getDesertGroundY(x, z) {
  const distOasis = Math.hypot(x, z + 3.2);
  const distCamera = Math.hypot(x, z - 1.0);
  const basinMask = THREE.MathUtils.smoothstep(Math.min(distOasis, distCamera), 2.5, 7.5);
  const megaDuneMask = THREE.MathUtils.smoothstep(Math.hypot(x, z), 15.0, 56.0);
  const duneWave = Math.sin(x * 0.28 + fbm2D(x * 0.14, z * 0.14, 2) * 3.2) * 0.85;
  const windRipple = Math.sin(x * 4.6 + z * 1.3) * 0.025;
  const perimeterDunes =
    (2.2 + Math.abs(Math.sin(x * 0.07 + z * 0.05)) * 4.5 + fbm2D(x * 0.05 + 7, z * 0.05 + 2, 3) * 5.2) *
    megaDuneMask;
  return (
    (duneWave + fbm2D(x * 0.18 + 3, z * 0.18 + 3, 3) * 1.35) * basinMask +
    perimeterDunes -
    (1 - THREE.MathUtils.smoothstep(distOasis, 1.35, 3.6)) * 0.22 +
    windRipple
  );
}

function createSoftGlowSprite() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.82)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeFieldPlaqueTexture(title, discipline, accent = '#38BDF8') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 136;
  const ctx = c.getContext('2d');

  const draw = (hovered = false) => {
    ctx.clearRect(0, 0, 512, 136);
    ctx.fillStyle = hovered ? 'rgba(8, 19, 38, 0.95)' : 'rgba(6, 13, 28, 0.86)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(8, 8, 496, 120, 18);
    } else {
      ctx.rect(8, 8, 496, 120);
    }
    ctx.fill();
    ctx.lineWidth = hovered ? 3 : 1.8;
    ctx.strokeStyle = hovered ? accent : 'rgba(255,255,255,0.28)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(discipline.toUpperCase(), 256, 40);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(title, 256, 76);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '500 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Click or Touch to Interact & Discover', 256, 108);
  };

  draw(false);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, draw };
}

if (typeof AFRAME !== 'undefined' && !AFRAME.components['biome-360-panorama']) {
  const _dummy = new THREE.Object3D();
  const _vA = new THREE.Vector3();
  const _camPos = new THREE.Vector3();
  const _handPos = new THREE.Vector3();
  const _siteWorld = new THREE.Vector3();

  AFRAME.registerComponent('biome-360-panorama', {
    schema: {
      biomeId: { type: 'string', default: 'aurora' }
    },

    init: function () {
      this.disposables = [];
      this.hitEntities = [];
      this.sites = [];
      this.plumeSystems = [];
      this.animatedCallbacks = [];
      this.elapsed = 0;
      this.glowTex = createSoftGlowSprite();
      this.disposables.push(this.glowTex);

      this.group = new THREE.Group();
      const b = this.data.biomeId;

      if (b === 'aurora') this.buildAurora360();
      else if (b === 'rainforest') this.buildRainforest360();
      else if (b === 'ocean') this.buildOcean360();
      else if (b === 'desert') this.buildDesert360();

      this.el.setObject3D('mesh', this.group);

      requestAnimationFrame(() => {
        this.el.sceneEl?.components?.raycaster?.refreshObjects?.();
        document.getElementById('left-controller')?.components?.raycaster?.refreshObjects?.();
        document.getElementById('right-controller')?.components?.raycaster?.refreshObjects?.();
      });
    },

    registerSite: function ({ dir, x, y, z, radius = 1.05, plaqueY = 1.45, title, discipline, fact, accent, targetGroup, onActivate }) {
      const site = {
        dir,
        title,
        discipline,
        fact,
        accent,
        targetGroup,
        worldPos: new THREE.Vector3(x, y + 0.55, z),
        energy: 0,
        lastTrigger: 0,
        hovered: false,
        onActivate
      };

      const plaqueEntry = makeFieldPlaqueTexture(title, `${dir} · ${discipline}`, accent);
      const pGeo = new THREE.PlaneGeometry(0.95, 0.25);
      const pMat = new THREE.MeshBasicMaterial({
        map: plaqueEntry.tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const plaqueMesh = new THREE.Mesh(pGeo, pMat);
      plaqueMesh.position.set(x, y + plaqueY, z);
      plaqueMesh.visible = false;
      this.group.add(plaqueMesh);
      site.plaqueMesh = plaqueMesh;
      this.disposables.push(pGeo, pMat, plaqueEntry.tex);

      // Subtle glowing field beacon ring on terrain so user notices 360° sites naturally
      const ringGeo = new THREE.RingGeometry(0.32, 0.38, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(x, y + 0.04, z);
      this.group.add(ringMesh);
      site.ringMat = ringMat;
      this.disposables.push(ringGeo, ringMat);

      tactileTouchFX.registerInteractiveSurface(targetGroup, {
        biomeId: this.data.biomeId,
        specimenKey: `site-${this.data.biomeId}-${dir}`,
        proximityTarget: true,
        proximityRadius: 0.65,
        proximityCenter: site.worldPos,
        springTarget: targetGroup,
        springOptions: { liftAmount: 0.04, recoilAmount: 0.035, squashAmount: 0.08 }
      });

      const hitEl = document.createElement('a-entity');
      hitEl.setAttribute('position', `${x.toFixed(2)} ${(y + 0.65).toFixed(2)} ${z.toFixed(2)}`);
      hitEl.setAttribute('geometry', `primitive: sphere; radius: ${radius}`);
      hitEl.setAttribute('material', 'visible: false');
      hitEl.setAttribute('class', 'interactive-node vr-interactive');
      hitEl.dataset.tactileHandled = 'true';

      const trigger = (evt) => {
        evt?.stopPropagation?.();
        this.activateSite(site, evt?.detail?.hand || '');
      };
      const onEnter = () => {
        site.hovered = true;
        plaqueMesh.visible = true;
        plaqueEntry.draw(true);
        plaqueEntry.tex.needsUpdate = true;
        ringMat.opacity = 0.85;
        document.body.style.cursor = 'pointer';
      };
      const onLeave = () => {
        site.hovered = false;
        plaqueMesh.visible = false;
        ringMat.opacity = 0.42;
        document.body.style.cursor = '';
      };

      hitEl.addEventListener('mouseenter', onEnter);
      hitEl.addEventListener('mouseleave', onLeave);
      hitEl.addEventListener('click', trigger);
      hitEl.addEventListener('pinchstarted', trigger);
      this.el.appendChild(hitEl);

      site.hitEl = hitEl;
      this.hitEntities.push({ hitEl, trigger, onEnter, onLeave, targetGroup });
      this.sites.push(site);
      return site;
    },

    activateSite: function (site, handId = '') {
      const now = performance.now();
      if (now - site.lastTrigger < 420) return;
      site.lastTrigger = now;
      site.energy = 1.0;

      natureAudio.unlock();
      site.onActivate?.(site);

      tactileTouchFX.trigger({
        el: site.hitEl,
        meshTarget: site.targetGroup,
        springTarget: site.targetGroup,
        worldPoint: site.worldPos,
        biomeId: this.data.biomeId,
        specimenKey: `site-${this.data.biomeId}-${site.dir}`
      });

      window.tabsirahHaptics?.playPattern('beacon-touch', {
        biomeId: this.data.biomeId,
        hand: handId || 'both'
      });

      window.dispatchEvent(
        new CustomEvent('tabsirah-quadrant-discovered', {
          detail: {
            biomeId: this.data.biomeId,
            dir: site.dir,
            title: site.title,
            discipline: site.discipline,
            fact: site.fact
          }
        })
      );

      window.dispatchEvent(
        new CustomEvent('tabsirah-wonder-progress', {
          detail: { message: `[${site.dir}] ${site.title}: ${site.fact}` }
        })
      );
    },

    addPlumeParticles: function ({ count, origin, spread, height, speed, color, size = 0.14 }) {
      const positions = new Float32Array(count * 3);
      const ages = new Float32Array(count);
      const speeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        ages[i] = Math.random();
        speeds[i] = speed * (0.75 + Math.random() * 0.55);
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * spread;
        positions[i * 3] = origin.x + Math.cos(a) * r;
        positions[i * 3 + 1] = origin.y + ages[i] * height;
        positions[i * 3 + 2] = origin.z + Math.sin(a) * r;
      }
      const geo = new THREE.BufferGeometry();
      const attr = new THREE.BufferAttribute(positions, 3);
      geo.setAttribute('position', attr);
      const mat = new THREE.PointsMaterial({
        size,
        map: this.glowTex,
        color,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      this.group.add(pts);
      this.disposables.push(geo, mat);
      const sys = { origin, spread, height, positions, ages, speeds, attr, count, boost: 0 };
      this.plumeSystems.push(sys);
      return sys;
    },

    // =========================================================================
    // 1. POLAR AURORA 360° (East Geothermal Spring, West Snowy Owl, South Narwhal & Ice Arch, Overhead Terns)
    // =========================================================================
    buildAurora360: function () {
      const icePBR = getBiomePBRTextures('ice', 4, 4);

      // EAST (+X): Sub-Arctic Basalt Columnar Fumarole & Geothermal Turquoise Pool
      const ex = 6.2;
      const ez = 0.6;
      const ey = getAuroraGroundY(ex, ez);
      const geoGroup = new THREE.Group();
      geoGroup.position.set(ex, ey, ez);

      const basaltMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.88, metalness: 0.08 });
      const matRimMat = new THREE.MeshStandardMaterial({
        color: '#D97706',
        emissive: '#92400E',
        emissiveIntensity: 0.25,
        roughness: 0.72
      });
      const springWaterMat = new THREE.MeshStandardMaterial({
        color: '#2DD4BF',
        emissive: '#0D9488',
        emissiveIntensity: 0.65,
        roughness: 0.14,
        metalness: 0.2
      });
      this.disposables.push(basaltMat, matRimMat, springWaterMat);

      const poolGeo = new THREE.CircleGeometry(1.15, 28);
      poolGeo.rotateX(-Math.PI / 2);
      const poolMesh = new THREE.Mesh(poolGeo, springWaterMat);
      poolMesh.position.y = 0.06;
      geoGroup.add(poolMesh);
      this.disposables.push(poolGeo);

      const rimGeo = new THREE.TorusGeometry(1.18, 0.12, 8, 28);
      rimGeo.rotateX(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, matRimMat);
      rimMesh.position.y = 0.07;
      geoGroup.add(rimMesh);
      this.disposables.push(rimGeo);

      const colGeo = new THREE.CylinderGeometry(0.22, 0.25, 1.0, 6);
      colGeo.translate(0, 0.5, 0);
      this.disposables.push(colGeo);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 1.4 - 0.5;
        const r = 1.2 + (i % 2) * 0.24;
        const h = 0.45 + (i % 4) * 0.38;
        const col = new THREE.Mesh(colGeo, basaltMat);
        col.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        col.scale.set(1, h, 1);
        geoGroup.add(col);
      }
      this.group.add(geoGroup);

      const steamPlume = this.addPlumeParticles({
        count: 54,
        origin: new THREE.Vector3(ex, ey + 0.15, ez),
        spread: 0.85,
        height: 2.8,
        speed: 0.65,
        color: '#CCFBF1',
        size: 0.28
      });

      this.registerSite({
        dir: 'E',
        x: ex,
        y: ey,
        z: ez,
        plaqueY: 1.95,
        title: 'Geothermal Basalt Fumarole',
        discipline: 'Volcanology & Extremophiles',
        fact: 'Hexagonal basalt fractures channel geothermal heat upward, sustaining orange thermophilic microbes in sub-zero air.',
        accent: '#2DD4BF',
        targetGroup: geoGroup,
        onActivate: () => {
          steamPlume.boost = 1.4;
          natureAudio.playHydrothermalRumble(_siteWorld.set(ex, ey + 0.5, ez));
        }
      });

      // WEST (-X): Snowy Owl (Bubo scandiacus) perched on Lichen-Encrusted Arctic Inuksuk
      const wx = -6.0;
      const wz = 1.0;
      const wy = getAuroraGroundY(wx, wz);
      const owlRidgeGroup = new THREE.Group();
      owlRidgeGroup.position.set(wx, wy, wz);

      const graniteMat = new THREE.MeshStandardMaterial({ color: '#64748B', roughness: 0.9 });
      const lichenMat = new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.85 });
      const owlWhiteMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.72 });
      const owlEyeMat = new THREE.MeshStandardMaterial({ color: '#FBBF24', emissive: '#D97706', emissiveIntensity: 0.5 });
      const beakMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.4 });
      this.disposables.push(graniteMat, lichenMat, owlWhiteMat, owlEyeMat, beakMat);

      const boulderGeo = new THREE.DodecahedronGeometry(0.65, 1);
      boulderGeo.scale(1.35, 0.78, 1.15);
      const baseBoulder = new THREE.Mesh(boulderGeo, graniteMat);
      baseBoulder.position.y = 0.36;
      owlRidgeGroup.add(baseBoulder);

      // Inuksuk cairn stones beside boulder
      const stoneBoxGeo = new THREE.DodecahedronGeometry(0.18, 0);
      [
        [-0.82, 0.16, 0.15, 1.2, 0.8, 1.0],
        [-0.64, 0.16, -0.1, 1.2, 0.8, 1.0],
        [-0.73, 0.38, 0.02, 2.1, 0.55, 0.9],
        [-0.73, 0.62, 0.02, 0.9, 1.1, 0.8]
      ].forEach(([sx, sy, sz, rx, ry, rz]) => {
        const st = new THREE.Mesh(stoneBoxGeo, graniteMat);
        st.position.set(sx, sy, sz);
        st.scale.set(rx, ry, rz);
        owlRidgeGroup.add(st);
      });
      const lichenGeo = new THREE.CircleGeometry(0.12, 8);
      for (let l = 0; l < 4; l++) {
        const lm = new THREE.Mesh(lichenGeo, lichenMat);
        lm.position.set(-0.3 + l * 0.18, 0.52, 0.48 - (l % 2) * 0.25);
        lm.rotation.y = l * 0.8;
        owlRidgeGroup.add(lm);
      }

      // Composite Snowy Owl perched on top
      const owlGroup = new THREE.Group();
      owlGroup.position.set(0.08, 0.88, 0.05);
      owlGroup.rotation.y = Math.PI * 0.45;
      const bodyGeo = new THREE.SphereGeometry(0.17, 14, 12);
      bodyGeo.scale(0.92, 1.35, 0.88);
      const owlBody = new THREE.Mesh(bodyGeo, owlWhiteMat);
      owlGroup.add(owlBody);

      const wingGeo = new THREE.SphereGeometry(0.13, 10, 8);
      wingGeo.scale(0.32, 1.15, 0.72);
      const wingL = new THREE.Mesh(wingGeo, owlWhiteMat);
      wingL.position.set(-0.15, 0.02, -0.02);
      const wingR = new THREE.Mesh(wingGeo, owlWhiteMat);
      wingR.position.set(0.15, 0.02, -0.02);
      owlGroup.add(wingL, wingR);

      const owlHead = new THREE.Group();
      owlHead.position.y = 0.22;
      const headGeo = new THREE.SphereGeometry(0.115, 12, 10);
      owlHead.add(new THREE.Mesh(headGeo, owlWhiteMat));
      const eyeGeo = new THREE.SphereGeometry(0.022, 8, 8);
      [-0.045, 0.045].forEach((exOff) => {
        const eye = new THREE.Mesh(eyeGeo, owlEyeMat);
        eye.position.set(exOff, 0.02, 0.095);
        owlHead.add(eye);
      });
      const beakGeo = new THREE.ConeGeometry(0.018, 0.05, 5);
      beakGeo.rotateX(Math.PI / 2);
      const beak = new THREE.Mesh(beakGeo, beakMat);
      beak.position.set(0, -0.005, 0.12);
      owlHead.add(beak);
      owlGroup.add(owlHead);
      owlRidgeGroup.add(owlGroup);
      this.group.add(owlRidgeGroup);
      this.disposables.push(boulderGeo, stoneBoxGeo, lichenGeo, bodyGeo, wingGeo, headGeo, eyeGeo, beakGeo);

      let owlExcite = 0;
      this.animatedCallbacks.push((t, dt) => {
        owlExcite = Math.max(0, owlExcite - dt * 0.6);
        owlHead.rotation.y = Math.sin(t * 0.9) * 0.45 + Math.sin(t * 7.5) * 0.35 * owlExcite;
        const flap = Math.abs(Math.sin(t * 11.0)) * 0.65 * owlExcite;
        wingL.rotation.z = flap;
        wingR.rotation.z = -flap;
      });

      this.registerSite({
        dir: 'W',
        x: wx,
        y: wy,
        z: wz,
        plaqueY: 1.75,
        title: 'Snowy Owl & Lichen Inuksuk Ridge',
        discipline: 'Arctic Ornithology & Lichenology',
        fact: 'Snowy Owls track prey via silent fringed feathers while crustose Xanthoria lichens grow mere millimeters per century.',
        accent: '#FBBF24',
        targetGroup: owlRidgeGroup,
        onActivate: () => {
          owlExcite = 1.0;
          natureAudio.playOwlHoot(_siteWorld.set(wx, wy + 1.0, wz));
        }
      });

      // SOUTH (+Z Behind Camera): Glacial Ice-Cave Arch & Breaching Narwhal Pod
      const sx = 0.2;
      const sz = 6.2;
      const sy = Math.min(0, getAuroraGroundY(sx, sz));
      const southGroup = new THREE.Group();
      southGroup.position.set(sx, sy, sz);

      const iceArchMat = new THREE.MeshStandardMaterial({
        color: '#A5F3FC',
        emissive: '#0284C7',
        emissiveIntensity: 0.42,
        normalMap: icePBR.normalMap,
        roughness: 0.18,
        metalness: 0.15,
        transparent: true,
        opacity: 0.86
      });
      const southWaterMat = new THREE.MeshStandardMaterial({
        color: '#0C4A6E',
        emissive: '#0369A1',
        emissiveIntensity: 0.38,
        roughness: 0.12,
        metalness: 0.25
      });
      const narwhalSkinMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.42, metalness: 0.12 });
      const tuskMat = new THREE.MeshStandardMaterial({ color: '#FEF3C7', emissive: '#F59E0B', emissiveIntensity: 0.2, roughness: 0.3 });
      this.disposables.push(iceArchMat, southWaterMat, narwhalSkinMat, tuskMat);

      const coveGeo = new THREE.CircleGeometry(2.6, 32);
      coveGeo.rotateX(-Math.PI / 2);
      const coveMesh = new THREE.Mesh(coveGeo, southWaterMat);
      coveMesh.position.y = 0.04;
      southGroup.add(coveMesh);

      const archGeo = new THREE.TorusGeometry(2.35, 0.36, 10, 28, Math.PI);
      const archMesh = new THREE.Mesh(archGeo, iceArchMat);
      archMesh.position.set(0, 0.05, 0.45);
      southGroup.add(archMesh);

      // Hanging glacial icicles
      const icicleGeo = new THREE.ConeGeometry(0.08, 0.55, 6);
      icicleGeo.rotateX(Math.PI);
      for (let k = 0; k < 7; k++) {
        const ang = 0.45 + (k / 6) * (Math.PI - 0.9);
        const ic = new THREE.Mesh(icicleGeo, iceArchMat);
        ic.position.set(Math.cos(ang) * 2.05, Math.sin(ang) * 2.05, 0.45);
        southGroup.add(ic);
      }

      // Sculpted Breaching Narwhal with Spiraling Sensory Tusk
      const narwhalPivot = new THREE.Group();
      const narwhal = new THREE.Group();
      const nBodyGeo = new THREE.SphereGeometry(0.24, 14, 12);
      nBodyGeo.scale(0.82, 0.85, 2.35);
      narwhal.add(new THREE.Mesh(nBodyGeo, narwhalSkinMat));

      const flukeGeo = new THREE.ConeGeometry(0.24, 0.34, 4);
      flukeGeo.scale(1.8, 0.25, 1.0);
      flukeGeo.rotateX(-Math.PI / 2);
      const fluke = new THREE.Mesh(flukeGeo, narwhalSkinMat);
      fluke.position.set(0, 0, -0.58);
      narwhal.add(fluke);

      const tuskGeo = new THREE.ConeGeometry(0.032, 1.25, 8);
      tuskGeo.rotateX(Math.PI / 2);
      const tusk = new THREE.Mesh(tuskGeo, tuskMat);
      tusk.position.set(0, 0.03, 0.98);
      narwhal.add(tusk);

      narwhal.position.set(0, 0.35, -0.35);
      narwhalPivot.add(narwhal);
      southGroup.add(narwhalPivot);
      this.group.add(southGroup);
      this.disposables.push(coveGeo, archGeo, icicleGeo, nBodyGeo, flukeGeo, tuskGeo);

      let breachBoost = 0;
      this.animatedCallbacks.push((t, dt) => {
        breachBoost = Math.max(0, breachBoost - dt * 0.45);
        const swim = t * 0.55;
        narwhalPivot.rotation.y = Math.sin(swim) * 0.7;
        const arc = Math.sin(t * 1.45) * 0.24 + breachBoost * 0.65;
        narwhal.position.y = 0.28 + Math.max(-0.08, arc);
        narwhal.rotation.x = -Math.cos(t * 1.45) * 0.28 - breachBoost * 0.42;
      });

      this.registerSite({
        dir: 'S',
        x: sx,
        y: sy,
        z: sz,
        radius: 1.45,
        plaqueY: 2.35,
        title: 'Glacial Arch & Narwhal Channel',
        discipline: 'Glaciology & Marine Mammalogy',
        fact: 'A Narwhal’s spiral tusk is an elongated canine tooth packed with 10 million sensory nerve endings detecting salinity shifts.',
        accent: '#67E8F9',
        targetGroup: southGroup,
        onActivate: () => {
          breachBoost = 1.0;
          natureAudio.playNarwhalSonar(_siteWorld.set(sx, sy + 0.8, sz));
        }
      });

      // SKY 360°: Migrating Arctic Tern Flock circling high overhead across all quadrants
      const ternBodyGeo = new THREE.ConeGeometry(0.03, 0.22, 5);
      ternBodyGeo.rotateX(Math.PI / 2);
      const ternWingGeo = new THREE.BoxGeometry(0.32, 0.01, 0.08);
      const ternMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', emissive: '#BAE6FD', emissiveIntensity: 0.25 });
      this.disposables.push(ternBodyGeo, ternWingGeo, ternMat);
      const terns = [];
      for (let i = 0; i < 6; i++) {
        const tg = new THREE.Group();
        tg.add(new THREE.Mesh(ternBodyGeo, ternMat));
        const rw = new THREE.Mesh(ternWingGeo, ternMat);
        rw.position.x = 0.16;
        const lw = new THREE.Mesh(ternWingGeo, ternMat);
        lw.position.x = -0.16;
        tg.add(rw, lw);
        this.group.add(tg);
        terns.push({ tg, rw, lw, r: 7.5 + (i % 3) * 1.6, y: 4.8 + (i % 2) * 0.8, phase: i * 1.05 });
      }
      this.animatedCallbacks.push((t) => {
        terns.forEach((b) => {
          const a = t * 0.24 + b.phase;
          b.tg.position.set(Math.cos(a) * b.r, b.y + Math.sin(t * 1.5 + b.phase) * 0.25, Math.sin(a) * b.r);
          b.tg.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
          const fl = Math.sin(t * 7.2 + b.phase) * 0.45;
          b.rw.rotation.z = fl;
          b.lw.rotation.z = -fl;
        });
      });
    },

    // =========================================================================
    // 2. LIVING RAINFOREST 360° (East Victoria Lagoon, West Mycena Log & Dart Frog, South Strangler Fig & Toucan)
    // =========================================================================
    buildRainforest360: function () {
      // EAST (+X): Victoria amazonica Giant Water-Lily Lagoon & Red Mangrove Stilt-Roots
      const ex = 5.6;
      const ez = 0.8;
      const ey = getRainforestGroundY(ex, ez);
      const eastGroup = new THREE.Group();
      eastGroup.position.set(ex, ey, ez);

      const lagoonMat = new THREE.MeshStandardMaterial({
        color: '#065F46',
        emissive: '#047857',
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.2
      });
      const padMat = new THREE.MeshStandardMaterial({ color: '#16A34A', roughness: 0.55 });
      const padRimMat = new THREE.MeshStandardMaterial({ color: '#BE185D', roughness: 0.6 });
      const blossomMat = new THREE.MeshStandardMaterial({
        color: '#FDF2F8',
        emissive: '#F472B6',
        emissiveIntensity: 0.45,
        roughness: 0.35
      });
      const mangroveMat = new THREE.MeshStandardMaterial({ color: '#5C3A21', roughness: 0.9 });
      this.disposables.push(lagoonMat, padMat, padRimMat, blossomMat, mangroveMat);

      const lagoonGeo = new THREE.CircleGeometry(1.75, 28);
      lagoonGeo.rotateX(-Math.PI / 2);
      const lagoonMesh = new THREE.Mesh(lagoonGeo, lagoonMat);
      lagoonMesh.position.y = 0.04;
      eastGroup.add(lagoonMesh);
      this.disposables.push(lagoonGeo);

      const padGeo = new THREE.CylinderGeometry(0.42, 0.4, 0.04, 18);
      const rimGeo = new THREE.TorusGeometry(0.41, 0.032, 6, 20);
      rimGeo.rotateX(Math.PI / 2);
      const lotusGeo = new THREE.ConeGeometry(0.09, 0.16, 6);
      this.disposables.push(padGeo, rimGeo, lotusGeo);

      const lilyBlossoms = [];
      [
        [-0.65, -0.35, 1.05],
        [0.45, -0.55, 0.92],
        [-0.15, 0.52, 1.18],
        [0.72, 0.38, 0.85]
      ].forEach(([px, pz, ps]) => {
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(px, 0.07, pz);
        pad.scale.setScalar(ps);
        const rim = new THREE.Mesh(rimGeo, padRimMat);
        rim.position.set(px, 0.095, pz);
        rim.scale.setScalar(ps);
        const bloom = new THREE.Group();
        bloom.position.set(px, 0.12, pz);
        for (let p = 0; p < 6; p++) {
          const pet = new THREE.Mesh(lotusGeo, blossomMat);
          const ang = (p / 6) * Math.PI * 2;
          pet.position.set(Math.cos(ang) * 0.05, 0.05, Math.sin(ang) * 0.05);
          pet.rotation.set(Math.sin(ang) * 0.45, ang, -Math.cos(ang) * 0.45);
          bloom.add(pet);
        }
        eastGroup.add(pad, rim, bloom);
        lilyBlossoms.push(bloom);
      });

      // Red Mangrove Stilt-Roots curving into lagoon edge
      for (let r = 0; r < 5; r++) {
        const ang = (r / 5) * Math.PI * 1.1 - 0.5;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.1, 1.45, 0),
          new THREE.Vector3(1.1 + Math.cos(ang) * 0.6, 0.72, Math.sin(ang) * 0.65),
          new THREE.Vector3(1.1 + Math.cos(ang) * 1.05, 0.0, Math.sin(ang) * 1.1)
        ]);
        const rGeo = new THREE.TubeGeometry(curve, 10, 0.045, 6, false);
        eastGroup.add(new THREE.Mesh(rGeo, mangroveMat));
        this.disposables.push(rGeo);
      }
      this.group.add(eastGroup);

      let lilyOpen = 0;
      this.animatedCallbacks.push((t, dt) => {
        lilyOpen = Math.max(0, lilyOpen - dt * 0.4);
        const sc = 1.0 + lilyOpen * 0.45 + Math.sin(t * 1.5) * 0.04;
        lilyBlossoms.forEach((b) => b.scale.setScalar(sc));
      });

      this.registerSite({
        dir: 'E',
        x: ex,
        y: ey,
        z: ez,
        plaqueY: 1.7,
        title: 'Victoria amazonica & Mangrove Lagoon',
        discipline: 'Wetland Botany',
        fact: 'Giant Victoria lily pads support up to 40 kg via buoyant radial ribs, while mangrove roots desalinate water.',
        accent: '#F472B6',
        targetGroup: eastGroup,
        onActivate: () => {
          lilyOpen = 1.0;
          natureAudio.playFrogAndToucan(_siteWorld.set(ex, ey + 0.5, ez));
        }
      });

      // WEST (-X): Bioluminescent Mycena Nurse-Log, Tank Bromeliads & Blue Poison-Dart Frog
      const wx = -5.4;
      const wz = 1.2;
      const wy = getRainforestGroundY(wx, wz);
      const westGroup = new THREE.Group();
      westGroup.position.set(wx, wy, wz);

      const logGeo = new THREE.CylinderGeometry(0.28, 0.34, 2.2, 10);
      logGeo.rotateZ(Math.PI / 2);
      const logMat = new THREE.MeshStandardMaterial({ color: '#3F2E21', roughness: 0.92 });
      const logMesh = new THREE.Mesh(logGeo, logMat);
      logMesh.position.y = 0.24;
      logMesh.rotation.y = 0.32;
      westGroup.add(logMesh);

      const mycenaMat = new THREE.MeshStandardMaterial({
        color: '#A7F3D0',
        emissive: '#34D399',
        emissiveIntensity: 1.15,
        roughness: 0.25,
        transparent: true,
        opacity: 0.9
      });
      const frogMat = new THREE.MeshStandardMaterial({
        color: '#2563EB',
        emissive: '#1D4ED8',
        emissiveIntensity: 0.35,
        roughness: 0.28
      });
      const stemGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.14, 5);
      const capGeo = new THREE.SphereGeometry(0.055, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
      this.disposables.push(logGeo, logMat, mycenaMat, frogMat, stemGeo, capGeo);

      for (let m = 0; m < 12; m++) {
        const mx = -0.8 + m * 0.15;
        const mz = Math.sin(m * 1.7) * 0.12;
        const sc = 0.7 + (m % 3) * 0.35;
        const st = new THREE.Mesh(stemGeo, mycenaMat);
        st.position.set(mx, 0.52, mz);
        st.scale.setScalar(sc);
        const cap = new THREE.Mesh(capGeo, mycenaMat);
        cap.position.set(mx, 0.52 + 0.07 * sc, mz);
        cap.scale.setScalar(sc);
        westGroup.add(st, cap);
      }

      // Blue Poison-Dart Frog (Dendrobates azureus)
      const frogGroup = new THREE.Group();
      const fBodyGeo = new THREE.SphereGeometry(0.065, 10, 8);
      fBodyGeo.scale(0.85, 0.72, 1.3);
      frogGroup.add(new THREE.Mesh(fBodyGeo, frogMat));
      frogGroup.position.set(0.25, 0.56, 0.06);
      westGroup.add(frogGroup);
      this.group.add(westGroup);
      this.disposables.push(fBodyGeo);

      const sporePlume = this.addPlumeParticles({
        count: 60,
        origin: new THREE.Vector3(wx, wy + 0.45, wz),
        spread: 0.95,
        height: 2.2,
        speed: 0.42,
        color: '#6EE7B7',
        size: 0.13
      });

      let frogHop = 0;
      this.animatedCallbacks.push((t, dt) => {
        frogHop = Math.max(0, frogHop - dt * 1.4);
        frogGroup.position.y = 0.56 + Math.abs(Math.sin(frogHop * Math.PI * 2)) * 0.24 * frogHop;
        mycenaMat.emissiveIntensity = 0.95 + Math.sin(t * 2.4) * 0.25 + frogHop * 0.9;
      });

      this.registerSite({
        dir: 'W',
        x: wx,
        y: wy,
        z: wz,
        plaqueY: 1.55,
        title: 'Bioluminescent Mycena Log & Dart Frog',
        discipline: 'Mycology & Herpetology',
        fact: 'Saprophytic Mycena fungi glow via luciferin oxidation to attract nocturnal insects that disperse forest spores.',
        accent: '#34D399',
        targetGroup: westGroup,
        onActivate: () => {
          frogHop = 1.0;
          sporePlume.boost = 1.6;
          natureAudio.playFrogAndToucan(_siteWorld.set(wx, wy + 0.6, wz));
        }
      });

      // SOUTH (+Z Behind Camera): Braided Strangler Fig Cathedral Archway & Toco Toucan
      const sx = -0.2;
      const sz = 5.6;
      const sy = getRainforestGroundY(sx, sz);
      const southGroup = new THREE.Group();
      southGroup.position.set(sx, sy, sz);

      const figMat = new THREE.MeshStandardMaterial({ color: '#6D4C41', roughness: 0.88 });
      const toucanBlackMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.65 });
      const toucanBibMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.7 });
      const toucanBillMat = new THREE.MeshStandardMaterial({ color: '#F97316', emissive: '#EA580C', emissiveIntensity: 0.25, roughness: 0.35 });
      this.disposables.push(figMat, toucanBlackMat, toucanBibMat, toucanBillMat);

      for (let strand = 0; strand < 4; strand++) {
        const off = (strand - 1.5) * 0.14;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.45 + off, 0, off * 0.5),
          new THREE.Vector3(-1.1 + off * 0.6, 1.8, -off * 0.6),
          new THREE.Vector3(0, 2.75 + Math.abs(off) * 0.5, 0),
          new THREE.Vector3(1.1 - off * 0.6, 1.8, off * 0.6),
          new THREE.Vector3(1.45 - off, 0, -off * 0.5)
        ]);
        const fGeo = new THREE.TubeGeometry(curve, 18, 0.085, 6, false);
        southGroup.add(new THREE.Mesh(fGeo, figMat));
        this.disposables.push(fGeo);
      }

      // Toco Toucan perched atop the fig arch
      const toucan = new THREE.Group();
      toucan.position.set(0.35, 2.72, -0.08);
      toucan.rotation.y = Math.PI;
      const tBodyGeo = new THREE.SphereGeometry(0.11, 10, 8);
      tBodyGeo.scale(0.85, 1.25, 0.85);
      toucan.add(new THREE.Mesh(tBodyGeo, toucanBlackMat));
      const bibGeo = new THREE.SphereGeometry(0.065, 8, 8);
      const bib = new THREE.Mesh(bibGeo, toucanBibMat);
      bib.position.set(0, 0.06, 0.065);
      toucan.add(bib);
      const billGeo = new THREE.ConeGeometry(0.048, 0.24, 6);
      billGeo.rotateX(Math.PI / 2);
      const bill = new THREE.Mesh(billGeo, toucanBillMat);
      bill.position.set(0, 0.11, 0.16);
      toucan.add(bill);
      southGroup.add(toucan);
      this.group.add(southGroup);
      this.disposables.push(tBodyGeo, bibGeo, billGeo);

      let toucanExcite = 0;
      this.animatedCallbacks.push((t, dt) => {
        toucanExcite = Math.max(0, toucanExcite - dt * 0.7);
        toucan.rotation.x = Math.sin(t * 2.1) * 0.08 + Math.sin(t * 10) * 0.25 * toucanExcite;
      });

      this.registerSite({
        dir: 'S',
        x: sx,
        y: sy,
        z: sz,
        radius: 1.4,
        plaqueY: 2.3,
        title: 'Strangler Fig Arch & Toco Toucan',
        discipline: 'Canopy Symbiosis',
        fact: 'Braided aerial fig roots form living structural arches while Toco Toucans regulate body heat through vascularized bills.',
        accent: '#FB923C',
        targetGroup: southGroup,
        onActivate: () => {
          toucanExcite = 1.0;
          natureAudio.playSpatialBirdCall(_siteWorld.set(sx, sy + 2.6, sz));
        }
      });
    },

    // =========================================================================
    // 3. CORAL CATHEDRAL OCEAN 360° (East Hydrothermal Vent, West Posidonia + Nautilus, South Karst Arch + Eagle Ray)
    // =========================================================================
    buildOcean360: function () {
      const coralPBR = getBiomePBRTextures('coral', 4, 4);

      // EAST (+X): Carbonate Hydrothermal Chimney & Riftia Tube-Worm Colony
      const ex = 5.8;
      const ez = 0.8;
      const eastGroup = new THREE.Group();
      eastGroup.position.set(ex, 0, ez);

      const travertineMat = new THREE.MeshStandardMaterial({
        color: '#94A3B8',
        normalMap: coralPBR.normalMap,
        roughness: 0.84
      });
      const wormStemMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.65 });
      const wormPlumeMat = new THREE.MeshStandardMaterial({
        color: '#FB7185',
        emissive: '#E11D48',
        emissiveIntensity: 0.65,
        roughness: 0.4
      });
      this.disposables.push(travertineMat, wormStemMat, wormPlumeMat);

      [
        [0, 1.45, 0, 0.38],
        [-0.42, 0.95, 0.25, 0.26],
        [0.45, 1.1, -0.22, 0.28]
      ].forEach(([cx, h, cz, rad]) => {
        const cGeo = new THREE.CylinderGeometry(rad * 0.55, rad, h, 9);
        const cm = new THREE.Mesh(cGeo, travertineMat);
        cm.position.set(cx, h * 0.5, cz);
        eastGroup.add(cm);
        this.disposables.push(cGeo);
      });

      const wStemGeo = new THREE.CylinderGeometry(0.025, 0.032, 0.42, 6);
      const wHeadGeo = new THREE.ConeGeometry(0.045, 0.12, 7);
      wHeadGeo.rotateX(Math.PI);
      this.disposables.push(wStemGeo, wHeadGeo);
      for (let w = 0; w < 10; w++) {
        const ang = (w / 10) * Math.PI * 2;
        const r = 0.55 + (w % 2) * 0.2;
        const wx = Math.cos(ang) * r;
        const wz = Math.sin(ang) * r;
        const stem = new THREE.Mesh(wStemGeo, wormStemMat);
        stem.position.set(wx, 0.21, wz);
        stem.rotation.z = (w % 2 === 0 ? 1 : -1) * 0.14;
        const head = new THREE.Mesh(wHeadGeo, wormPlumeMat);
        head.position.set(wx, 0.44, wz);
        eastGroup.add(stem, head);
      }
      this.group.add(eastGroup);

      const ventPlume = this.addPlumeParticles({
        count: 68,
        origin: new THREE.Vector3(ex, 1.45, ez),
        spread: 0.45,
        height: 3.4,
        speed: 0.95,
        color: '#67E8F9',
        size: 0.15
      });

      this.registerSite({
        dir: 'E',
        x: ex,
        y: 0,
        z: ez,
        plaqueY: 2.0,
        title: 'Carbonate Hydrothermal Chimney',
        discipline: 'Deep Geochemistry & Chemosynthesis',
        fact: 'Chemosynthetic bacteria inside Riftia tube worms oxidize hydrogen sulfide to power ecosystems without sunlight.',
        accent: '#FB7185',
        targetGroup: eastGroup,
        onActivate: () => {
          ventPlume.boost = 1.6;
          natureAudio.playHydrothermalRumble(_siteWorld.set(ex, 1.0, ez));
        }
      });

      // WEST (-X): Posidonia Seagrass Meadow & Logarithmic-Spiral Chambered Nautilus
      const wx = -5.8;
      const wz = 1.0;
      const westGroup = new THREE.Group();
      westGroup.position.set(wx, 0, wz);

      const grassGeo = new THREE.BoxGeometry(0.04, 0.85, 0.01);
      grassGeo.translate(0, 0.425, 0);
      const grassMat = new THREE.MeshStandardMaterial({ color: '#10B981', emissive: '#047857', emissiveIntensity: 0.35, roughness: 0.55 });
      const grassCount = 84;
      const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
      for (let i = 0; i < grassCount; i++) {
        const a = (i / grassCount) * Math.PI * 2 + (i % 3) * 0.2;
        const r = 0.25 + (i % 7) * 0.24;
        _dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        _dummy.rotation.set((i % 3 - 1) * 0.14, a, (i % 5 - 2) * 0.08);
        _dummy.scale.set(1, 0.75 + (i % 4) * 0.25, 1);
        _dummy.updateMatrix();
        grassMesh.setMatrixAt(i, _dummy.matrix);
      }
      grassMesh.instanceMatrix.needsUpdate = true;
      grassMesh.computeBoundingSphere();
      westGroup.add(grassMesh);
      this.disposables.push(grassGeo, grassMat);

      // Logarithmic Equiangular Spiral Nautilus Shell
      const nautilusGroup = new THREE.Group();
      nautilusGroup.position.set(0, 0.95, 0);
      const nautilusPts = [];
      for (let i = 0; i <= 36; i++) {
        const theta = (i / 36) * Math.PI * 3.4;
        const rad = 0.04 * Math.exp(0.18 * theta);
        nautilusPts.push(new THREE.Vector3(Math.cos(theta) * rad, Math.sin(theta) * rad, 0));
      }
      const nautCurve = new THREE.CatmullRomCurve3(nautilusPts);
      const nautGeo = new THREE.TubeGeometry(nautCurve, 40, 0.12, 10, false);
      const nautMat = new THREE.MeshStandardMaterial({
        color: '#FEF3C7',
        emissive: '#D97706',
        emissiveIntensity: 0.22,
        roughness: 0.28,
        metalness: 0.15
      });
      nautilusGroup.add(new THREE.Mesh(nautGeo, nautMat));
      westGroup.add(nautilusGroup);
      this.group.add(westGroup);
      this.disposables.push(nautGeo, nautMat);

      let nautilusDart = 0;
      this.animatedCallbacks.push((t, dt) => {
        nautilusDart = Math.max(0, nautilusDart - dt * 0.65);
        const speed = 0.7 + nautilusDart * 2.4;
        nautilusGroup.position.y = 0.92 + Math.sin(t * 1.4) * 0.16 + nautilusDart * 0.28;
        nautilusGroup.rotation.y += dt * speed;
      });

      this.registerSite({
        dir: 'W',
        x: wx,
        y: 0,
        z: wz,
        plaqueY: 1.85,
        title: 'Posidonia Meadow & Chambered Nautilus',
        discipline: 'Malacology & Seagrass Ecology',
        fact: 'Chambered Nautilus shells grow along an equiangular logarithmic spiral, regulating buoyancy via gas-filled chambers.',
        accent: '#FBBF24',
        targetGroup: westGroup,
        onActivate: () => {
          nautilusDart = 1.0;
          natureAudio.playBubbleCluster(_siteWorld.set(wx, 0.9, wz));
        }
      });

      // SOUTH (+Z Behind Camera): Sunken Karst Limestone Reef Archway & Spotted Eagle Ray
      const sx = 0.2;
      const sz = 6.0;
      const southGroup = new THREE.Group();
      southGroup.position.set(sx, 0, sz);

      const karstGeo = new THREE.TorusGeometry(2.25, 0.38, 10, 28, Math.PI);
      const karstMat = new THREE.MeshStandardMaterial({
        color: '#334155',
        emissive: '#0E7490',
        emissiveIntensity: 0.28,
        normalMap: coralPBR.normalMap,
        roughness: 0.78
      });
      const karstArch = new THREE.Mesh(karstGeo, karstMat);
      southGroup.add(karstArch);

      // Giant Barrel Sponges flanking the arch
      const barrelGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.62, 12, 1, true);
      const barrelMat = new THREE.MeshStandardMaterial({
        color: '#F59E0B',
        emissive: '#B45309',
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.65
      });
      [-1.7, 1.75].forEach((bx) => {
        const bm = new THREE.Mesh(barrelGeo, barrelMat);
        bm.position.set(bx, 0.31, -0.3);
        southGroup.add(bm);
      });

      // Spotted Eagle Ray gliding through the southern arch
      const rayGroup = new THREE.Group();
      const rayBodyGeo = new THREE.ConeGeometry(0.58, 0.95, 4);
      rayBodyGeo.scale(1.8, 0.14, 1.0);
      rayBodyGeo.rotateX(Math.PI / 2);
      const rayMat = new THREE.MeshStandardMaterial({
        color: '#0F172A',
        emissive: '#0284C7',
        emissiveIntensity: 0.38,
        roughness: 0.32
      });
      rayGroup.add(new THREE.Mesh(rayBodyGeo, rayMat));
      rayGroup.position.set(0, 1.65, -0.4);
      southGroup.add(rayGroup);
      this.group.add(southGroup);
      this.disposables.push(karstGeo, karstMat, barrelGeo, barrelMat, rayBodyGeo, rayMat);

      let raySwoop = 0;
      this.animatedCallbacks.push((t, dt) => {
        raySwoop = Math.max(0, raySwoop - dt * 0.5);
        const rt = t * (0.55 + raySwoop * 1.1);
        rayGroup.position.set(Math.sin(rt) * 1.65, 1.55 + Math.cos(rt * 2) * 0.28, -0.35 + Math.cos(rt) * 0.95);
        rayGroup.rotation.y = Math.atan2(Math.cos(rt) * 1.65, -Math.sin(rt) * 0.95);
        rayGroup.rotation.z = -Math.sin(rt) * 0.25;
      });

      this.registerSite({
        dir: 'S',
        x: sx,
        y: 0,
        z: sz,
        radius: 1.45,
        plaqueY: 2.35,
        title: 'Karst Limestone Arch & Eagle Ray',
        discipline: 'Karst Geology & Pelagic Rays',
        fact: 'Submerged karst arches formed above sea level during Ice Age lowstands before coral polyps colonized them.',
        accent: '#38BDF8',
        targetGroup: southGroup,
        onActivate: () => {
          raySwoop = 1.0;
          natureAudio.playWhaleCall(_siteWorld.set(sx, 1.5, sz));
        }
      });
    },

    // =========================================================================
    // 4. DESERT OASIS 360° (East Yardang + Fennec, West Desert Rose Crystals, South Wind-Harp + Falcon)
    // =========================================================================
    buildDesert360: function () {
      const sandPBR = getBiomePBRTextures('sand', 4, 4);

      // EAST (+X): Sandstone Mushroom Yardang, Solar Gnomon & Fennec Fox Burrow
      const ex = 6.2;
      const ez = 0.8;
      const ey = getDesertGroundY(ex, ez);
      const eastGroup = new THREE.Group();
      eastGroup.position.set(ex, ey, ez);

      const yardangPts = [
        new THREE.Vector2(0.45, 0.0),
        new THREE.Vector2(0.24, 0.45),
        new THREE.Vector2(0.22, 0.92),
        new THREE.Vector2(0.95, 1.25),
        new THREE.Vector2(1.05, 1.58),
        new THREE.Vector2(0.55, 1.82),
        new THREE.Vector2(0.01, 1.88)
      ];
      const yardangGeo = new THREE.LatheGeometry(yardangPts, 14);
      const yardangMat = new THREE.MeshStandardMaterial({
        color: '#B45309',
        normalMap: sandPBR.normalMap,
        roughness: 0.88
      });
      const yardang = new THREE.Mesh(yardangGeo, yardangMat);
      eastGroup.add(yardang);

      // Solar Shadow Gnomon Obelisk
      const gnomonGeo = new THREE.CylinderGeometry(0.03, 0.08, 1.15, 4);
      const gnomonMat = new THREE.MeshStandardMaterial({ color: '#FDE68A', metalness: 0.45, roughness: 0.4 });
      const gnomon = new THREE.Mesh(gnomonGeo, gnomonMat);
      gnomon.position.set(-1.15, 0.55, 0.35);
      eastGroup.add(gnomon);

      // Composite Fennec Fox (Vulpes zerda) with heat-radiating ears
      const fennecGroup = new THREE.Group();
      fennecGroup.position.set(-0.95, 0.14, 0.72);
      fennecGroup.rotation.y = -Math.PI * 0.55;
      const fennecMat = new THREE.MeshStandardMaterial({ color: '#FDE68A', roughness: 0.78 });
      const fBodyGeo = new THREE.SphereGeometry(0.11, 10, 8);
      fBodyGeo.scale(1.4, 0.85, 0.75);
      fennecGroup.add(new THREE.Mesh(fBodyGeo, fennecMat));
      const fHeadGroup = new THREE.Group();
      fHeadGroup.position.set(0.14, 0.09, 0);
      const fHeadGeo = new THREE.SphereGeometry(0.065, 8, 8);
      fHeadGroup.add(new THREE.Mesh(fHeadGeo, fennecMat));
      const fEarGeo = new THREE.ConeGeometry(0.042, 0.14, 5);
      [-0.04, 0.04].forEach((ezOff) => {
        const ear = new THREE.Mesh(fEarGeo, fennecMat);
        ear.position.set(-0.01, 0.11, ezOff);
        ear.rotation.x = ezOff > 0 ? 0.25 : -0.25;
        fHeadGroup.add(ear);
      });
      fennecGroup.add(fHeadGroup);
      eastGroup.add(fennecGroup);
      this.group.add(eastGroup);
      this.disposables.push(yardangGeo, yardangMat, gnomonGeo, gnomonMat, fennecMat, fBodyGeo, fHeadGeo, fEarGeo);

      let fennecHop = 0;
      this.animatedCallbacks.push((t, dt) => {
        fennecHop = Math.max(0, fennecHop - dt * 1.2);
        fennecGroup.position.y = 0.14 + Math.abs(Math.sin(fennecHop * Math.PI * 2)) * 0.22 * fennecHop;
        fHeadGroup.rotation.z = Math.sin(t * 2.2) * 0.14 + Math.sin(t * 9) * 0.18 * fennecHop;
      });

      this.registerSite({
        dir: 'E',
        x: ex,
        y: ey,
        z: ez,
        plaqueY: 2.05,
        title: 'Sandstone Yardang, Gnomon & Fennec Fox',
        discipline: 'Aeolian Geomorphology',
        fact: 'Wind-driven saltating sand blasts within 1m of the ground carves mushroom yardangs; Fennec Fox ears radiate excess body heat.',
        accent: '#FBBF24',
        targetGroup: eastGroup,
        onActivate: () => {
          fennecHop = 1.0;
          natureAudio.playDesertCrystalChime(_siteWorld.set(ex, ey + 0.6, ez));
        }
      });

      // WEST (-X): Wadi Sandstone Shelf & Gypsum "Desert Rose" Crystal Rosettes
      const wx = -6.0;
      const wz = 1.1;
      const wy = getDesertGroundY(wx, wz);
      const westGroup = new THREE.Group();
      westGroup.position.set(wx, wy, wz);

      const ledgeGeo = new THREE.CylinderGeometry(1.15, 1.45, 0.35, 9);
      const ledgeMat = new THREE.MeshStandardMaterial({ color: '#9A3412', normalMap: sandPBR.normalMap, roughness: 0.88 });
      const ledge = new THREE.Mesh(ledgeGeo, ledgeMat);
      ledge.position.y = 0.14;
      westGroup.add(ledge);

      const bladeGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.025, 10);
      const roseMat = new THREE.MeshStandardMaterial({
        color: '#FDBA74',
        emissive: '#EA580C',
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.18,
        transparent: true,
        opacity: 0.9
      });
      this.disposables.push(ledgeGeo, ledgeMat, bladeGeo, roseMat);

      const rosettes = [];
      [
        [-0.35, 0.36, 0.25, 1.1],
        [0.42, 0.36, -0.18, 0.95],
        [0.05, 0.42, -0.42, 1.25],
        [0.12, 0.36, 0.45, 0.85]
      ].forEach(([rx, ry, rz, sc]) => {
        const rg = new THREE.Group();
        rg.position.set(rx, ry, rz);
        rg.scale.setScalar(sc);
        for (let b = 0; b < 9; b++) {
          const blade = new THREE.Mesh(bladeGeo, roseMat);
          blade.rotation.set(0.55 + (b % 3) * 0.35, (b / 9) * Math.PI * 2, 0.3);
          rg.add(blade);
        }
        westGroup.add(rg);
        rosettes.push(rg);
      });
      this.group.add(westGroup);

      let roseChime = 0;
      this.animatedCallbacks.push((t, dt) => {
        roseChime = Math.max(0, roseChime - dt * 0.7);
        roseMat.emissiveIntensity = 0.32 + Math.sin(t * 2.0) * 0.08 + roseChime * 1.1;
        rosettes.forEach((rg, idx) => {
          rg.rotation.y += dt * (0.08 + roseChime * 0.75) * (idx % 2 === 0 ? 1 : -1);
        });
      });

      this.registerSite({
        dir: 'W',
        x: wx,
        y: wy,
        z: wz,
        plaqueY: 1.55,
        title: 'Gypsum Desert Rose Wadi Shelf',
        discipline: 'Evaporite Mineralogy',
        fact: 'Desert Roses crystallize when shallow mineral-rich groundwater evaporates through Saharan sand, trapping quartz grains in gypsum blades.',
        accent: '#FB923C',
        targetGroup: westGroup,
        onActivate: () => {
          roseChime = 1.0;
          natureAudio.playDesertCrystalChime(_siteWorld.set(wx, wy + 0.6, wz));
        }
      });

      // SOUTH (+Z Behind Camera): Nomad Acoustic Wind-Harp Pavilion & Circling Lanner Falcon
      const sx = 0.2;
      const sz = 6.0;
      const sy = getDesertGroundY(sx, sz);
      const southGroup = new THREE.Group();
      southGroup.position.set(sx, sy, sz);

      const woodMat = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.85 });
      const canopyMat = new THREE.MeshStandardMaterial({ color: '#1E3A8A', roughness: 0.78, side: THREE.DoubleSide });
      const stringMat = new THREE.MeshStandardMaterial({
        color: '#FDE047',
        emissive: '#F59E0B',
        emissiveIntensity: 0.75,
        metalness: 0.85,
        roughness: 0.18
      });
      this.disposables.push(woodMat, canopyMat, stringMat);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.055, 2.2, 8);
      [
        [-0.95, -0.65],
        [0.95, -0.65],
        [-0.95, 0.65],
        [0.95, 0.65]
      ].forEach(([px, pz]) => {
        const pole = new THREE.Mesh(poleGeo, woodMat);
        pole.position.set(px, 1.1, pz);
        southGroup.add(pole);
      });
      const sailGeo = new THREE.PlaneGeometry(2.15, 1.55, 6, 4);
      sailGeo.rotateX(Math.PI / 2);
      const sail = new THREE.Mesh(sailGeo, canopyMat);
      sail.position.y = 2.15;
      southGroup.add(sail);

      // Acoustic Wind-Harp frame & 7 strings
      const harpArcGeo = new THREE.TorusGeometry(0.58, 0.025, 8, 24, Math.PI);
      const harpArc = new THREE.Mesh(harpArcGeo, woodMat);
      harpArc.position.y = 0.65;
      southGroup.add(harpArc);

      const strGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.92, 6);
      const harpStrings = [];
      for (let i = 0; i < 7; i++) {
        const sm = new THREE.Mesh(strGeo, stringMat);
        sm.position.set((i - 3) * 0.13, 0.72, 0);
        southGroup.add(sm);
        harpStrings.push(sm);
      }

      // Soaring Lanner Falcon circling overhead across 360° sky
      const falcon = new THREE.Group();
      const fBody = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.34, 5), woodMat);
      fBody.rotation.x = Math.PI / 2;
      const fWingGeo = new THREE.BoxGeometry(0.65, 0.012, 0.12);
      const fWings = new THREE.Mesh(fWingGeo, woodMat);
      falcon.add(fBody, fWings);
      this.group.add(falcon);
      this.group.add(southGroup);
      this.disposables.push(poleGeo, sailGeo, harpArcGeo, strGeo, fBody.geometry, fWingGeo);

      let harpStrum = 0;
      this.animatedCallbacks.push((t, dt) => {
        harpStrum = Math.max(0, harpStrum - dt * 0.55);
        stringMat.emissiveIntensity = 0.65 + harpStrum * 1.45;
        harpStrings.forEach((st, idx) => {
          st.position.z = Math.sin(t * 24 + idx) * 0.018 * harpStrum;
        });

        const fa = t * (0.28 + harpStrum * 0.35);
        falcon.position.set(Math.cos(fa) * 6.8, 5.2 + Math.sin(fa * 2) * 0.4, Math.sin(fa) * 6.8);
        falcon.rotation.y = Math.atan2(-Math.sin(fa), Math.cos(fa));
        falcon.rotation.z = 0.22;
      });

      this.registerSite({
        dir: 'S',
        x: sx,
        y: sy,
        z: sz,
        radius: 1.35,
        plaqueY: 2.1,
        title: 'Aeolian Wind-Harp & Lanner Falcon',
        discipline: 'Acoustic Physics & Ornithology',
        fact: 'Desert winds excite standing harmonic waves along tensioned aeolian strings while Lanner Falcons soar effortlessly on thermal updrafts.',
        accent: '#FDE047',
        targetGroup: southGroup,
        onActivate: () => {
          harpStrum = 1.0;
          natureAudio.playAeolianWindHarp(_siteWorld.set(sx, sy + 1.0, sz));
          natureAudio.playEagleCall(_siteWorld.set(sx, sy + 4.0, sz));
        }
      });
    },

    tick: function (time, timeDelta) {
      if (!timeDelta) return;
      const dt = (Math.min(timeDelta, 50) / 1000) * (window.tabsirahTimeScale || 1.0);
      this.elapsed += dt;

      // Update particle plumes cleanly with zero GC allocations
      for (let s = 0; s < this.plumeSystems.length; s++) {
        const ps = this.plumeSystems[s];
        ps.boost = Math.max(0, ps.boost - dt * 0.7);
        const mul = 1.0 + ps.boost * 1.4;
        for (let i = 0; i < ps.count; i++) {
          ps.ages[i] += dt * ps.speeds[i] * 0.42 * mul;
          if (ps.ages[i] >= 1.0) {
            ps.ages[i] = 0;
            const ang = (i * 2.39996 + this.elapsed) % (Math.PI * 2);
            const r = (0.15 + ((i * 17) % 100) / 100) * ps.spread;
            ps.positions[i * 3] = ps.origin.x + Math.cos(ang) * r;
            ps.positions[i * 3 + 2] = ps.origin.z + Math.sin(ang) * r;
          }
          ps.positions[i * 3 + 1] = ps.origin.y + ps.ages[i] * ps.height;
          ps.positions[i * 3] += Math.sin(this.elapsed * 1.4 + i) * 0.08 * dt;
        }
        ps.attr.needsUpdate = true;
      }

      // Run site-specific wildlife/geology animations
      for (let i = 0; i < this.animatedCallbacks.length; i++) {
        this.animatedCallbacks[i](this.elapsed, dt);
      }

      // Billboard hover plaques & check VR bare-hand proximity
      const cam = this.el.sceneEl?.camera;
      if (cam) cam.getWorldPosition(_camPos);
      const inXR = Boolean(this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode'));

      for (let i = 0; i < this.sites.length; i++) {
        const site = this.sites[i];
        site.energy = Math.max(0, site.energy - dt * 0.7);
        if (site.plaqueMesh?.visible && cam) {
          site.plaqueMesh.lookAt(_camPos);
        }
        if (inXR) {
          if (!this._hands) {
            this._hands = [document.getElementById('left-hand'), document.getElementById('right-hand')];
          }
          for (let h = 0; h < this._hands.length; h++) {
            const hand = this._hands[h];
            if (!hand?.isConnected || !hand.object3D) continue;
            hand.object3D.getWorldPosition(_handPos);
            if (_handPos.lengthSq() > 0.001 && _handPos.distanceTo(site.worldPos) < 0.52) {
              this.activateSite(site, hand.id);
              break;
            }
          }
        }
      }
    },

    remove: function () {
      document.body.style.cursor = '';
      this.hitEntities.forEach(({ hitEl, trigger, onEnter, onLeave, targetGroup }) => {
        tactileTouchFX.unregisterInteractiveSurface(targetGroup);
        hitEl.removeEventListener('mouseenter', onEnter);
        hitEl.removeEventListener('mouseleave', onLeave);
        hitEl.removeEventListener('click', trigger);
        hitEl.removeEventListener('pinchstarted', trigger);
        if (hitEl.parentNode) hitEl.parentNode.removeChild(hitEl);
      });
      this.el.removeObject3D('mesh');
      this.disposables.forEach((d) => d?.dispose());
    }
  });
}
