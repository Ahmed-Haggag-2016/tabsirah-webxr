/**
 * Tabsirah: The Architecture of Light & Order
 * Sacred Mathematical & Biological Dynamics Engine:
 *  1. voronoi-cellular-mesh  (Station 2 Left: 3D Geodesic Voronoi Tessellation + Morphogen Ripple)
 *  2. turing-coral-sphere    (Station 2 Right: Real-Time Gray-Scott Reaction-Diffusion PDE Sphere)
 *  3. mhd-solar-loops        (Station 3 Center: Magnetohydrodynamic Coronal Magnetic Loops + Plasma)
 *  4. abyssal-jellyfish      (Station 4: Procedural Fresnel Bioluminescent Jellyfish & Siphonophores)
 *  5. plankton-swirl-cloud   (Station 4: Cursor/Hand-Reactive Bioluminescent Plankton Trails)
 *  6. islamic-star-mandala   (Station 5: 16-Fold Breath-Synchronized Girih Rosette Mandala)
 */

import { natureAudio } from './nature-audio.js';
import { tactileTouchFX } from './tactile-touch-fx.js';

function createSoftGlowSprite() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.82)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

if (typeof AFRAME !== 'undefined') {
  const _vec = new THREE.Vector3();
  const _wPos = new THREE.Vector3();

  /**
   * 1. Geodesic Voronoi Cellular Mesh (Station 2)
   * Evaluates spherical Voronoi cell distance (d2 - d1) across an IcosahedronGeometry(0.68, 4)
   * to sculpt glowing organic honeycomb/dragonfly-wing ridges and ripple on morphogen touch.
   */
  if (!AFRAME.components['voronoi-cellular-mesh']) {
    AFRAME.registerComponent('voronoi-cellular-mesh', {
      schema: {
        radius: { type: 'number', default: 0.68 },
        seeds: { type: 'int', default: 46 }
      },

      init: function () {
        const seedCount = this.data.seeds;
        this.seeds = [];
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < seedCount; i++) {
          const y = 1 - (i / (seedCount - 1)) * 2;
          const r = Math.sqrt(Math.max(0, 1 - y * y));
          const theta = goldenAngle * i;
          this.seeds.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize());
        }

        this.geo = new THREE.IcosahedronGeometry(this.data.radius, 4);
        const pos = this.geo.attributes.position;
        const count = pos.count;
        const edgeFactor = new Float32Array(count);
        const dir = new THREE.Vector3();

        for (let i = 0; i < count; i++) {
          dir.fromBufferAttribute(pos, i).normalize();
          let d1 = 999;
          let d2 = 999;
          for (let s = 0; s < seedCount; s++) {
            const d = dir.distanceTo(this.seeds[s]);
            if (d < d1) {
              d2 = d1;
              d1 = d;
            } else if (d < d2) {
              d2 = d;
            }
          }
          // Border ridge metric (1 at Voronoi cell wall, 0 at cell center)
          const border = Math.max(0, 1 - (d2 - d1) * 7.2);
          edgeFactor[i] = border;
          const disp = 1 + border * 0.085 - (1 - border) * 0.03;
          pos.setXYZ(i, dir.x * this.data.radius * disp, dir.y * this.data.radius * disp, dir.z * this.data.radius * disp);
        }

        this.geo.setAttribute('aEdge', new THREE.BufferAttribute(edgeFactor, 1));
        this.geo.computeVertexNormals();

        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uPulseTime: { value: -10 },
            uModeMix: { value: 0 }
          },
          vertexShader: `
            attribute float aEdge;
            uniform float uTime;
            uniform float uPulseTime;
            varying float vEdge;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            varying vec3 vPos;
            void main() {
              vEdge = aEdge;
              vPos = position;
              float age = max(0.0, uTime - uPulseTime);
              float wave = sin(position.y * 8.0 - age * 7.0) * exp(-age * 1.4) * 0.045;
              vec3 displaced = position + normal * wave;
              vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
              vNormalW = normalize(mat3(modelMatrix) * normal);
              vViewDir = normalize(cameraPosition - worldPos.xyz);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uModeMix;
            varying float vEdge;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            varying vec3 vPos;
            void main() {
              float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormalW), normalize(vViewDir))), 2.2);
              vec3 cellBase = mix(vec3(0.03, 0.14, 0.24), vec3(0.06, 0.22, 0.18), uModeMix);
              vec3 ridgeCol = mix(vec3(0.20, 0.85, 0.65), vec3(0.98, 0.78, 0.24), uModeMix * 0.7 + fresnel * 0.3);
              float glow = smoothstep(0.32, 0.95, vEdge);
              vec3 col = mix(cellBase, ridgeCol, glow) + ridgeCol * fresnel * 0.45;
              gl_FragColor = vec4(col, 0.96);
            }
          `
        });

        const group = new THREE.Group();
        this.mesh = new THREE.Mesh(this.geo, this.mat);
        group.add(this.mesh);

        // Delicate outer Voronoi wireframe halo
        this.wireGeo = new THREE.IcosahedronGeometry(this.data.radius * 1.12, 1);
        this.wireMat = new THREE.MeshBasicMaterial({
          color: '#34D399',
          wireframe: true,
          transparent: true,
          opacity: 0.22
        });
        this.wire = new THREE.Mesh(this.wireGeo, this.wireMat);
        group.add(this.wire);

        this.el.setObject3D('mesh', group);
        this.elapsed = 0;
        this.modeTarget = 0;

        this.onPulse = () => {
          this.mat.uniforms.uPulseTime.value = this.elapsed;
          this.modeTarget = this.modeTarget > 0.5 ? 0 : 1;
        };
        this.onInteract = (evt) => {
          if (!this.el.object3D?.visible) return;
          evt?.stopPropagation?.();
          natureAudio.unlock();
          this.el.object3D.getWorldPosition(_wPos);
          natureAudio.playMorphogenPulse(_wPos);
          this.el.sceneEl?.emit('morphogen-pulse', {}, false);
          window.dispatchEvent(
            new CustomEvent('tabsirah-wonder-progress', {
              detail: {
                biomeId: 'ocean',
                message: 'Geodesic Voronoi & Gray-Scott Turing morphogen wave pulsed through the reef.'
              }
            })
          );
        };
        this.el.sceneEl?.addEventListener('morphogen-pulse', this.onPulse);
        this.el.addEventListener('click', this.onInteract);
        this.el.addEventListener('pinchstarted', this.onInteract);
        tactileTouchFX.registerInteractiveSurface(this.el.object3D, {
          biomeId: 'ocean',
          specimenKey: 'ocean-voronoi-lens',
          proximityTarget: true,
          proximityRadius: 0.42,
          springTarget: this.el.object3D,
          springOptions: { liftAmount: 0.05, recoilAmount: 0.04, squashAmount: 0.1 }
        });
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.el.object3D?.visible) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.elapsed += dt;
        this.mat.uniforms.uTime.value = this.elapsed;
        this.mat.uniforms.uModeMix.value = THREE.MathUtils.damp(
          this.mat.uniforms.uModeMix.value,
          this.modeTarget,
          3.2,
          dt
        );
        this.el.object3D.rotation.y += 0.22 * dt;
        this.wire.rotation.y -= 0.12 * dt;
      },

      remove: function () {
        tactileTouchFX.unregisterInteractiveSurface(this.el.object3D);
        this.el.sceneEl?.removeEventListener('morphogen-pulse', this.onPulse);
        this.el.removeEventListener('click', this.onInteract);
        this.el.removeEventListener('pinchstarted', this.onInteract);
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
        this.wireGeo?.dispose();
        this.wireMat?.dispose();
      }
    });
  }

  /**
   * 2. Live Gray-Scott Reaction-Diffusion Sphere (Station 2)
   * Solves ∂u/∂t = Du∇²u - uv² + f(1-u), ∂v/∂t = Dv∇²v + uv² - (f+k)v on an 84x84 periodic grid
   * rendered via a live DataTexture + relief displacement shader.
   */
  if (!AFRAME.components['turing-coral-sphere']) {
    AFRAME.registerComponent('turing-coral-sphere', {
      schema: {
        gridSize: { type: 'int', default: 84 },
        radius: { type: 'number', default: 0.68 }
      },

      init: function () {
        const N = this.data.gridSize;
        this.N = N;
        const len = N * N;
        this.u = new Float32Array(len).fill(1);
        this.v = new Float32Array(len).fill(0);
        this.uNext = new Float32Array(len);
        this.vNext = new Float32Array(len);
        this.texBytes = new Uint8Array(len * 4);

        this.feed = 0.037;
        this.kill = 0.060;
        this.labyrinthMode = false;

        // Seed initial asymmetric reaction nuclei
        for (let k = 0; k < 14; k++) {
          this.seedBlob(
            Math.floor((0.15 + ((k * 0.37) % 0.7)) * N),
            Math.floor((0.15 + ((k * 0.53) % 0.7)) * N),
            3
          );
        }
        // Pre-warm 180 Gray-Scott iterations so organic ridges are visible immediately on entry
        for (let s = 0; s < 180; s++) this.stepGrayScott();

        this.texture = new THREE.DataTexture(this.texBytes, N, N, THREE.RGBAFormat);
        this.texture.wrapS = THREE.RepeatWrapping;
        this.texture.wrapT = THREE.RepeatWrapping;
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.minFilter = THREE.LinearFilter;
        this.updateTextureData();

        this.geo = new THREE.SphereGeometry(this.data.radius, 64, 48);
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uMap: { value: this.texture },
            uTime: { value: 0 },
            uPulse: { value: 0 }
          },
          vertexShader: `
            uniform sampler2D uMap;
            varying vec2 vUv;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            varying float vConc;
            void main() {
              vUv = uv;
              float vVal = texture2D(uMap, uv).r;
              vConc = vVal;
              vec3 displaced = position + normal * (vVal * 0.095);
              vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
              vNormalW = normalize(mat3(modelMatrix) * normal);
              vViewDir = normalize(cameraPosition - worldPos.xyz);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform float uPulse;
            varying float vConc;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            void main() {
              float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormalW), normalize(vViewDir))), 2.3);
              vec3 deepTeal = vec3(0.03, 0.11, 0.22);
              vec3 coralMint = vec3(0.20, 0.88, 0.68);
              vec3 goldenTip = vec3(0.99, 0.82, 0.28);
              vec3 col = mix(deepTeal, coralMint, smoothstep(0.12, 0.42, vConc));
              col = mix(col, goldenTip, smoothstep(0.45, 0.72, vConc));
              col += vec3(0.22, 0.78, 0.98) * (fresnel * 0.55 + uPulse * 0.35);
              gl_FragColor = vec4(col, 1.0);
            }
          `
        });

        this.mesh = new THREE.Mesh(this.geo, this.mat);
        this.el.setObject3D('mesh', this.mesh);
        this.pulseFlash = 0;

        this.onPulse = () => {
          this.labyrinthMode = !this.labyrinthMode;
          this.feed = this.labyrinthMode ? 0.029 : 0.037;
          this.kill = this.labyrinthMode ? 0.057 : 0.060;
          this.seedBlob(
            Math.floor(Math.random() * this.N),
            Math.floor(Math.random() * this.N),
            5
          );
          this.pulseFlash = 1.0;
        };
        this.onInteract = (evt) => {
          if (!this.el.object3D?.visible) return;
          evt?.stopPropagation?.();
          natureAudio.unlock();
          this.el.object3D.getWorldPosition(_wPos);
          natureAudio.playMorphogenPulse(_wPos);
          this.el.sceneEl?.emit('morphogen-pulse', {}, false);
          window.dispatchEvent(
            new CustomEvent('tabsirah-wonder-progress', {
              detail: {
                biomeId: 'ocean',
                message: this.labyrinthMode
                  ? 'Gray-Scott Turing morphogenesis shifted toward coral spots.'
                  : 'Gray-Scott Turing morphogenesis shifted toward brain-coral labyrinth.'
              }
            })
          );
        };
        this.el.sceneEl?.addEventListener('morphogen-pulse', this.onPulse);
        this.el.addEventListener('click', this.onInteract);
        this.el.addEventListener('pinchstarted', this.onInteract);
        tactileTouchFX.registerInteractiveSurface(this.el.object3D, {
          biomeId: 'ocean',
          specimenKey: 'ocean-turing-lens',
          proximityTarget: true,
          proximityRadius: 0.42,
          springTarget: this.el.object3D,
          springOptions: { liftAmount: 0.05, recoilAmount: 0.04, squashAmount: 0.1 }
        });
      },

      seedBlob: function (cx, cy, rad) {
        const N = this.N;
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            if (dx * dx + dy * dy <= rad * rad) {
              const x = (cx + dx + N) % N;
              const y = (cy + dy + N) % N;
              const idx = y * N + x;
              this.u[idx] = 0.5;
              this.v[idx] = 0.32;
            }
          }
        }
      },

      stepGrayScott: function () {
        const N = this.N;
        const u = this.u;
        const v = this.v;
        const uN = this.uNext;
        const vN = this.vNext;
        const Du = 0.16;
        const Dv = 0.08;
        const f = this.feed;
        const k = this.kill;

        for (let y = 0; y < N; y++) {
          const ym = (y === 0 ? N - 1 : y - 1) * N;
          const y0 = y * N;
          const yp = (y === N - 1 ? 0 : y + 1) * N;
          for (let x = 0; x < N; x++) {
            const xm = x === 0 ? N - 1 : x - 1;
            const xp = x === N - 1 ? 0 : x + 1;
            const idx = y0 + x;
            const uVal = u[idx];
            const vVal = v[idx];

            const lapU = u[y0 + xm] + u[y0 + xp] + u[ym + x] + u[yp + x] - 4 * uVal;
            const lapV = v[y0 + xm] + v[y0 + xp] + v[ym + x] + v[yp + x] - 4 * vVal;
            const uvv = uVal * vVal * vVal;

            uN[idx] = Math.max(0, Math.min(1, uVal + (Du * lapU - uvv + f * (1 - uVal))));
            vN[idx] = Math.max(0, Math.min(1, vVal + (Dv * lapV + uvv - (f + k) * vVal)));
          }
        }

        this.u = uN;
        this.uNext = u;
        this.v = vN;
        this.vNext = v;
      },

      updateTextureData: function () {
        const v = this.v;
        const bytes = this.texBytes;
        for (let i = 0; i < v.length; i++) {
          const val = Math.min(255, Math.floor(v[i] * 560));
          bytes[i * 4] = val;
          bytes[i * 4 + 1] = val;
          bytes[i * 4 + 2] = val;
          bytes[i * 4 + 3] = 255;
        }
        this.texture.needsUpdate = true;
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.el.object3D?.visible) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        const steps = Math.max(1, Math.min(8, Math.round(3 * scale)));
        for (let s = 0; s < steps; s++) this.stepGrayScott();
        this.updateTextureData();

        this.pulseFlash = Math.max(0, this.pulseFlash - dt * 1.8);
        this.mat.uniforms.uPulse.value = this.pulseFlash;
        this.el.object3D.rotation.y -= 0.18 * dt;
      },

      remove: function () {
        tactileTouchFX.unregisterInteractiveSurface(this.el.object3D);
        this.el.sceneEl?.removeEventListener('morphogen-pulse', this.onPulse);
        this.el.removeEventListener('click', this.onInteract);
        this.el.removeEventListener('pinchstarted', this.onInteract);
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
        this.texture?.dispose();
      }
    });
  }

  /**
   * 3. Magnetohydrodynamic (MHD) Solar Magnetic Loops (Station 3 Centerpiece)
   */
  if (!AFRAME.components['mhd-solar-loops']) {
    AFRAME.registerComponent('mhd-solar-loops', {
      schema: {
        starRadius: { type: 'number', default: 0.44 },
        loopCount: { type: 'int', default: 10 }
      },

      init: function () {
        const group = new THREE.Group();
        const R = this.data.starRadius;

        // Star Photosphere with animated convective granulation shader
        this.starGeo = new THREE.SphereGeometry(R, 36, 24);
        this.starMat = new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 } },
          vertexShader: `
            varying vec3 vPos;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            void main() {
              vPos = position;
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vNormalW = normalize(mat3(modelMatrix) * normal);
              vViewDir = normalize(cameraPosition - worldPos.xyz);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec3 vPos;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            void main() {
              float gran = sin(vPos.x * 16.0 + uTime * 1.6) * cos(vPos.y * 16.0 - uTime * 1.3) * sin(vPos.z * 16.0 + uTime);
              float limb = pow(1.0 - max(0.0, dot(normalize(vNormalW), normalize(vViewDir))), 2.1);
              vec3 core = mix(vec3(1.0, 0.56, 0.12), vec3(1.0, 0.96, 0.65), gran * 0.45 + 0.55);
              gl_FragColor = vec4(core + vec3(1.0, 0.42, 0.08) * limb * 0.9, 1.0);
            }
          `
        });
        group.add(new THREE.Mesh(this.starGeo, this.starMat));

        // Arching MHD Magnetic Flux Loops
        this.curves = [];
        this.tubeGeos = [];
        this.tubeMat = new THREE.MeshBasicMaterial({
          color: '#FB923C',
          transparent: true,
          opacity: 0.52,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        for (let i = 0; i < this.data.loopCount; i++) {
          const az = (i / this.data.loopCount) * Math.PI * 2;
          const latSpread = 0.25 + (i % 3) * 0.16;
          const apexR = R + 0.26 + (i % 3) * 0.14;
          const p0 = new THREE.Vector3(Math.cos(az) * Math.cos(latSpread) * R * 0.96, Math.sin(latSpread) * R * 0.96, Math.sin(az) * Math.cos(latSpread) * R * 0.96);
          const p1 = new THREE.Vector3(Math.cos(az + 0.18) * apexR, Math.sin(latSpread * 0.45) * apexR, Math.sin(az + 0.18) * apexR);
          const p2 = new THREE.Vector3(Math.cos(az + 0.36) * Math.cos(-latSpread) * R * 0.96, Math.sin(-latSpread) * R * 0.96, Math.sin(az + 0.36) * Math.cos(-latSpread) * R * 0.96);

          const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
          this.curves.push(curve);
          const tGeo = new THREE.TubeGeometry(curve, 22, 0.011, 6, false);
          this.tubeGeos.push(tGeo);
          group.add(new THREE.Mesh(tGeo, this.tubeMat));
        }

        // Plasma Particles streaming continuously along the MHD arches
        this.plasmaCount = 160;
        this.plasmaPositions = new Float32Array(this.plasmaCount * 3);
        this.plasmaMeta = Array.from({ length: this.plasmaCount }, (_, idx) => ({
          curveIdx: idx % this.curves.length,
          t: Math.random(),
          speed: 0.35 + Math.random() * 0.45
        }));
        this.plasmaGeo = new THREE.BufferGeometry();
        this.plasmaAttr = new THREE.BufferAttribute(this.plasmaPositions, 3);
        this.plasmaGeo.setAttribute('position', this.plasmaAttr);
        this.plasmaTex = createSoftGlowSprite();
        this.plasmaMat = new THREE.PointsMaterial({
          size: 0.068,
          map: this.plasmaTex,
          color: '#FEF08A',
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        group.add(new THREE.Points(this.plasmaGeo, this.plasmaMat));

        this.el.setObject3D('mesh', group);
        this.elapsed = 0;
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.elapsed += dt;
        this.starMat.uniforms.uTime.value = this.elapsed;
        this.el.object3D.rotation.y += 0.14 * dt;

        for (let i = 0; i < this.plasmaCount; i++) {
          const m = this.plasmaMeta[i];
          m.t = (m.t + m.speed * dt) % 1;
          this.curves[m.curveIdx].getPointAt(m.t, _vec);
          this.plasmaPositions[i * 3] = _vec.x;
          this.plasmaPositions[i * 3 + 1] = _vec.y;
          this.plasmaPositions[i * 3 + 2] = _vec.z;
        }
        this.plasmaAttr.needsUpdate = true;
      },

      remove: function () {
        this.el.removeObject3D('mesh');
        this.starGeo?.dispose();
        this.starMat?.dispose();
        this.tubeGeos?.forEach((g) => g.dispose());
        this.tubeMat?.dispose();
        this.plasmaGeo?.dispose();
        this.plasmaMat?.dispose();
        this.plasmaTex?.dispose();
      }
    });
  }

  /**
   * 4. Deep-Sea Bioluminescent Jellyfish & Siphonophores (Station 4)
   */
  if (!AFRAME.components['abyssal-jellyfish']) {
    AFRAME.registerComponent('abyssal-jellyfish', {
      schema: {
        color: { type: 'color', default: '#22D3EE' },
        accent: { type: 'color', default: '#818CF8' },
        scaleFactor: { type: 'number', default: 1.0 },
        phaseOffset: { type: 'number', default: 0 }
      },

      init: function () {
        const group = new THREE.Group();
        const s = this.data.scaleFactor;

        // Translucent Bioluminescent Bell (hemisphere with pulsing vertex shader)
        this.bellGeo = new THREE.SphereGeometry(0.32 * s, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.56);
        this.bellMat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uPhase: { value: this.data.phaseOffset },
            uColorA: { value: new THREE.Color(this.data.color) },
            uColorB: { value: new THREE.Color(this.data.accent) }
          },
          vertexShader: `
            uniform float uTime;
            uniform float uPhase;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            varying float vRim;
            void main() {
              float pulse = sin(uTime * 2.1 + uPhase);
              float radialFactor = smoothstep(0.0, 0.35, length(position.xz));
              vec3 pos = position;
              pos.xz *= 1.0 + pulse * 0.14 * radialFactor;
              pos.y *= 1.0 - pulse * 0.09;
              vRim = radialFactor;
              vec4 worldPos = modelMatrix * vec4(pos, 1.0);
              vNormalW = normalize(mat3(modelMatrix) * normal);
              vViewDir = normalize(cameraPosition - worldPos.xyz);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            varying float vRim;
            void main() {
              float ndotv = abs(dot(normalize(vNormalW), normalize(vViewDir)));
              float fresnel = pow(1.0 - ndotv, 1.9);
              vec3 col = mix(uColorB, uColorA, fresnel * 0.75 + vRim * 0.25);
              float alpha = clamp(0.18 + fresnel * 0.8 + vRim * 0.25, 0.0, 0.95);
              gl_FragColor = vec4(col * (0.85 + fresnel), alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        group.add(new THREE.Mesh(this.bellGeo, this.bellMat));

        // 14 Sinuous BufferGeometry Tentacles (updated smoothly in zero-GC loop)
        this.tentacleCount = 14;
        this.segsPerTentacle = 18;
        const totalVerts = this.tentacleCount * (this.segsPerTentacle - 1) * 2;
        this.tentPositions = new Float32Array(totalVerts * 3);
        this.tentGeo = new THREE.BufferGeometry();
        this.tentAttr = new THREE.BufferAttribute(this.tentPositions, 3);
        this.tentGeo.setAttribute('position', this.tentAttr);
        this.tentMat = new THREE.LineBasicMaterial({
          color: this.data.color,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending
        });
        group.add(new THREE.LineSegments(this.tentGeo, this.tentMat));

        this.el.setObject3D('mesh', group);
        this.baseY = this.el.object3D.position.y;
        this.elapsed = this.data.phaseOffset;
        this.updateTentacles();
      },

      updateTentacles: function () {
        const s = this.data.scaleFactor;
        const arr = this.tentPositions;
        let ptr = 0;

        for (let t = 0; t < this.tentacleCount; t++) {
          const az = (t / this.tentacleCount) * Math.PI * 2;
          const rBase = (0.12 + (t % 3) * 0.055) * s;
          const len = (0.88 + (t % 2) * 0.28) * s;

          let prevX = Math.cos(az) * rBase;
          let prevY = 0;
          let prevZ = Math.sin(az) * rBase;

          for (let k = 1; k < this.segsPerTentacle; k++) {
            const frac = k / (this.segsPerTentacle - 1);
            const sway = Math.sin(this.elapsed * 2.1 - frac * 5.2 + t * 0.6) * 0.14 * frac * s;
            const curX = Math.cos(az) * (rBase * (1 - frac * 0.35)) + Math.cos(az + 1.2) * sway;
            const curY = -frac * len;
            const curZ = Math.sin(az) * (rBase * (1 - frac * 0.35)) + Math.sin(az + 1.2) * sway;

            arr[ptr++] = prevX;
            arr[ptr++] = prevY;
            arr[ptr++] = prevZ;
            arr[ptr++] = curX;
            arr[ptr++] = curY;
            arr[ptr++] = curZ;

            prevX = curX;
            prevY = curY;
            prevZ = curZ;
          }
        }
        this.tentAttr.needsUpdate = true;
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.elapsed += dt;
        this.bellMat.uniforms.uTime.value = this.elapsed;
        this.el.object3D.position.y = this.baseY + Math.sin(this.elapsed * 0.9) * 0.14;
        this.el.object3D.rotation.y += 0.12 * dt;
        this.updateTentacles();
      },

      remove: function () {
        this.el.removeObject3D('mesh');
        this.bellGeo?.dispose();
        this.bellMat?.dispose();
        this.tentGeo?.dispose();
        this.tentMat?.dispose();
      }
    });
  }

  /**
   * 5. Swirling Bioluminescent Plankton Trail Cloud (Station 4 Interactive Dark Water)
   */
  if (!AFRAME.components['plankton-swirl-cloud']) {
    AFRAME.registerComponent('plankton-swirl-cloud', {
      schema: { count: { type: 'int', default: 520 } },

      init: function () {
        const count = this.data.count;
        this.positions = new Float32Array(count * 3);
        this.velocities = new Float32Array(count * 3);
        this.colors = new Float32Array(count * 3);
        this.energy = new Float32Array(count);

        for (let i = 0; i < count; i++) {
          this.positions[i * 3] = (Math.random() - 0.5) * 5.2;
          this.positions[i * 3 + 1] = 0.3 + Math.random() * 2.8;
          this.positions[i * 3 + 2] = -1.2 - Math.random() * 4.2;
          this.energy[i] = Math.random() * 0.25;
        }

        this.geo = new THREE.BufferGeometry();
        this.posAttr = new THREE.BufferAttribute(this.positions, 3);
        this.colAttr = new THREE.BufferAttribute(this.colors, 3);
        this.geo.setAttribute('position', this.posAttr);
        this.geo.setAttribute('color', this.colAttr);

        this.tex = createSoftGlowSprite();
        this.mat = new THREE.PointsMaterial({
          size: 0.082,
          map: this.tex,
          vertexColors: true,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        this.el.setObject3D('mesh', new THREE.Points(this.geo, this.mat));

        this.stirOrigin = new THREE.Vector3(0, 1.6, -2.8);
        this.stirActive = 0;
        this.lastPing = 0;

        this.onPointerMove = this.onPointerMove.bind(this);
        window.addEventListener('pointermove', this.onPointerMove);
      },

      onPointerMove: function (e) {
        const w = window.innerWidth || 1280;
        const h = window.innerHeight || 720;
        const nx = (e.clientX / w) * 2 - 1;
        const ny = 1 - (e.clientY / h) * 2;
        this.stirOrigin.set(nx * 2.4, 1.55 + ny * 1.05, -2.8);
        this.stirActive = 1.0;

        const now = performance.now();
        if (now - this.lastPing > 750) {
          this.lastPing = now;
          natureAudio.playAbyssalPing(this.stirOrigin);
        }
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;

        if (this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode')) {
          const rh = document.getElementById('right-hand');
          if (rh?.object3D && rh.object3D.position.lengthSq() > 0.001) {
            rh.object3D.getWorldPosition(this.stirOrigin);
            this.stirActive = 1.0;
          }
        } else {
          this.stirActive = Math.max(0, this.stirActive - dt * 1.4);
        }

        const count = this.data.count;
        const pos = this.positions;
        const vel = this.velocities;
        const col = this.colors;

        for (let i = 0; i < count; i++) {
          const ix = i * 3;
          let x = pos[ix];
          let y = pos[ix + 1];
          let z = pos[ix + 2];

          const dx = x - this.stirOrigin.x;
          const dy = y - this.stirOrigin.y;
          const dz = z - this.stirOrigin.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (this.stirActive > 0.05 && distSq < 1.85) {
            const dist = Math.sqrt(distSq) || 0.01;
            const impulse = (1 - dist / 1.36) * 2.6 * dt;
            // Swirl perpendicular to stir vector
            vel[ix] += (-dy / dist) * impulse + (Math.random() - 0.5) * 0.25 * dt;
            vel[ix + 1] += (dx / dist) * impulse;
            vel[ix + 2] += (Math.random() - 0.5) * 0.3 * dt;
            this.energy[i] = Math.min(1.0, this.energy[i] + impulse * 1.6);
          }

          // Gentle ambient abyssal drift + damping
          vel[ix] = vel[ix] * (1 - 1.6 * dt) + Math.sin(y * 1.5 + i) * 0.03 * dt;
          vel[ix + 1] = vel[ix + 1] * (1 - 1.6 * dt) + 0.015 * dt;
          vel[ix + 2] *= 1 - 1.6 * dt;

          x += vel[ix] * dt;
          y += vel[ix + 1] * dt;
          z += vel[ix + 2] * dt;

          if (y > 3.2) y = 0.3;
          if (x < -2.8) x = 2.8;
          if (x > 2.8) x = -2.8;

          pos[ix] = x;
          pos[ix + 1] = y;
          pos[ix + 2] = z;

          this.energy[i] = Math.max(0.08, this.energy[i] - dt * 0.32);
          const glow = this.energy[i];
          col[ix] = glow * 0.14;
          col[ix + 1] = glow * 0.85;
          col[ix + 2] = glow * 1.0;
        }

        this.posAttr.needsUpdate = true;
        this.colAttr.needsUpdate = true;
      },

      remove: function () {
        window.removeEventListener('pointermove', this.onPointerMove);
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
        this.tex?.dispose();
      }
    });
  }

  /**
   * 6. 16-Fold Islamic Geometric Star Mandala (Station 5 Breath Resonance)
   * Precision D16 (22.5°) nested golden girih filaments responding continuously to breath phase.
   */
  if (!AFRAME.components['islamic-star-mandala']) {
    AFRAME.registerComponent('islamic-star-mandala', {
      schema: { folds: { type: 'int', default: 16 } },

      init: function () {
        this.group = new THREE.Group();
        this.rings = [];
        this.disposables = [];

        const folds = this.data.folds;
        const layers = [
          { rOuter: 0.55, rInner: 0.24, skip: 3, color: '#FDE047', opacity: 0.92, z: 0.12, rotSpeed: 0.12 },
          { rOuter: 0.92, rInner: 0.52, skip: 5, color: '#FBBF24', opacity: 0.86, z: 0.04, rotSpeed: -0.09 },
          { rOuter: 1.32, rInner: 0.84, skip: 5, color: '#38BDF8', opacity: 0.72, z: -0.04, rotSpeed: 0.06 },
          { rOuter: 1.72, rInner: 1.18, skip: 7, color: '#F59E0B', opacity: 0.66, z: -0.12, rotSpeed: -0.04 }
        ];

        layers.forEach((cfg) => {
          const verts = [];
          const count = folds * 2;
          // Star polygon boundary + radial khatam chords
          for (let i = 0; i < count; i++) {
            const a1 = (i / count) * Math.PI * 2;
            const a2 = ((i + 1) / count) * Math.PI * 2;
            const r1 = i % 2 === 0 ? cfg.rOuter : cfg.rInner;
            const r2 = (i + 1) % 2 === 0 ? cfg.rOuter : cfg.rInner;
            verts.push(Math.cos(a1) * r1, Math.sin(a1) * r1, 0, Math.cos(a2) * r2, Math.sin(a2) * r2, 0);

            if (i % 2 === 0) {
              const targetAngle = ((i + cfg.skip * 2) / count) * Math.PI * 2;
              verts.push(
                Math.cos(a1) * cfg.rOuter, Math.sin(a1) * cfg.rOuter, 0,
                Math.cos(targetAngle) * cfg.rOuter, Math.sin(targetAngle) * cfg.rOuter, 0
              );
            }
          }

          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
          const mat = new THREE.LineBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: cfg.opacity,
            blending: THREE.AdditiveBlending
          });
          const lines = new THREE.LineSegments(geo, mat);
          lines.position.z = cfg.z;
          this.group.add(lines);
          this.rings.push({ lines, cfg, baseZ: cfg.z });
          this.disposables.push(geo, mat);
        });

        // Luminous golden heart center
        const heartGeo = new THREE.OctahedronGeometry(0.16, 1);
        const heartMat = new THREE.MeshBasicMaterial({
          color: '#FEF08A',
          wireframe: true,
          transparent: true,
          opacity: 0.85
        });
        this.heartMesh = new THREE.Mesh(heartGeo, heartMat);
        this.group.add(this.heartMesh);
        this.disposables.push(heartGeo, heartMat);

        this.el.setObject3D('mesh', this.group);
        this.elapsed = 0;
        this.breathSmooth = 0.25;
        this.freqData = new Uint8Array(32);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.el.object3D?.visible) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.elapsed += dt;

        const bands = natureAudio?.sampleCymaticBands
          ? natureAudio.sampleCymaticBands()
          : { overall: 0.08, bass: 0.06 };
        const audioLevel = 0.06 + bands.overall * 0.94;

        const targetBreath = typeof window.tabsirahBreathPhase === 'number' ? window.tabsirahBreathPhase : 0.3;
        this.breathSmooth = THREE.MathUtils.damp(this.breathSmooth, targetBreath, 4.5, dt);

        for (let i = 0; i < this.rings.length; i++) {
          const item = this.rings[i];
          const layerExpand = 0.86 + this.breathSmooth * (0.28 + i * 0.08) + audioLevel * 0.14;
          item.lines.scale.setScalar(layerExpand);
          item.lines.rotation.z += item.cfg.rotSpeed * dt * (0.65 + this.breathSmooth + audioLevel * 0.6);
          item.lines.position.z = item.baseZ * (1 + this.breathSmooth * 0.85);
        }

        const cScale = 0.85 + this.breathSmooth * 0.45 + audioLevel * 0.22;
        this.heartMesh.scale.setScalar(cScale);
        this.heartMesh.rotation.y += 0.35 * dt;
        this.heartMesh.rotation.x += 0.2 * dt;
      },

      remove: function () {
        this.el.removeObject3D('mesh');
        this.disposables.forEach((d) => d?.dispose());
      }
    });
  }
}
