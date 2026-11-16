/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Custom GLSL Shaders Across All 5 Biomes:
 *  1. atmospheric-sky-dome       (360° horizon panoramas + Rayleigh/Mie scattering + starfield)
 *  2. aurora-curtain-shader      (Biome 1: Dynamic wave + spectral color-shift GLSL Aurora Borealis)
 *  3. createForestCanopySwayMaterial (Biome 2: Subtle swaying vertex animation GLSL shader for L-System canopy)
 *  4. caustic-water-surface      (Biome 3 & Pools: Caustic light refraction & chromatic shimmer shader)
 *  5. desert-heat-shimmer-shader (Biome 4: Golden mirage heat-haze & warm horizon glow GLSL shader)
 *  6. alpine-alpenglow-shader    (Biome 5: High-altitude alpenglow & drifting ridge mist-veil GLSL shader)
 *  7. bioluminescent-spores      (Custom GLSL drifting forest fireflies/spores & underwater plankton)
 *  8. crepuscular-god-rays       (Volumetric slanting canopy sunbeams & underwater light shafts)
 */

import { natureAudio } from './nature-audio.js';

/**
 * Custom GLSL Swaying Vertex Animation Material for L-System Rainforest Canopy
 * Supports both InstancedMesh (#ifdef USE_INSTANCING) and standard Meshes.
 */
export function createForestCanopySwayMaterial(options = {}) {
  const {
    baseColor = '#10B981',
    emissiveColor = '#064E3B',
    windStrength = 0.085
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: windStrength },
      uWetness: { value: 0.0 },
      uBaseColor: { value: new THREE.Color(baseColor) },
      uEmissive: { value: new THREE.Color(emissiveColor) },
      uSunDir: { value: new THREE.Vector3(0.45, 0.82, 0.35).normalize() }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWindStrength;
      uniform float uWetness;
      varying vec3 vWorldNormal;
      varying vec3 vViewPos;
      varying float vFlutter;

      void main() {
        vec3 pos = position;
        #ifdef USE_INSTANCING
          vec4 instOrigin = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mat3 instRot = mat3(instanceMatrix);
          vec3 objNormal = normalize(mat3(modelMatrix) * (instRot * normal));
        #else
          vec4 instOrigin = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vec3 objNormal = normalize(mat3(modelMatrix) * normal);
        #endif

        float phase = instOrigin.x * 1.35 + instOrigin.z * 1.1 + instOrigin.y * 0.8;
        float gust = 1.0 + uWetness * 0.65;
        float swayX = sin(uTime * 1.45 + phase + pos.y * 2.4) * uWindStrength * gust;
        float swayZ = cos(uTime * 1.15 + phase * 1.3 + pos.x * 2.1) * (uWindStrength * 0.72) * gust;
        float leafTipMask = smoothstep(-0.22, 0.32, pos.y);

        pos.x += swayX * (0.45 + leafTipMask * 0.85);
        pos.z += swayZ * (0.45 + leafTipMask * 0.85);
        pos.y += sin(uTime * 2.2 + phase * 2.0) * 0.018 * leafTipMask;

        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(pos, 1.0);
        #else
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        #endif

        vWorldNormal = objNormal;
        vViewPos = (viewMatrix * worldPos).xyz;
        vFlutter = 0.5 + 0.5 * sin(uTime * 1.45 + phase);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uEmissive;
      uniform vec3 uSunDir;
      uniform float uWetness;
      varying vec3 vWorldNormal;
      varying vec3 vViewPos;
      varying float vFlutter;

      void main() {
        vec3 n = normalize(vWorldNormal);
        vec3 v = normalize(-vViewPos);
        float ndl = max(0.18, dot(n, normalize(uSunDir)));
        // Warm translucent foliage subsurface glow + specular raindrop sheen
        float rim = pow(1.0 - max(0.0, dot(n, v)), 2.2);
        vec3 halfVec = normalize(normalize(uSunDir) + v);
        float spec = pow(max(0.0, dot(n, halfVec)), mix(14.0, 48.0, uWetness)) * mix(0.08, 0.62, uWetness);

        vec3 lit = uBaseColor * (0.42 + ndl * 0.75) + uEmissive * (0.55 + vFlutter * 0.25);
        lit += vec3(0.22, 0.88, 0.52) * rim * 0.24;
        lit += vec3(0.85, 0.96, 1.0) * spec;
        gl_FragColor = vec4(lit, 1.0);
      }
    `
  });
}


if (typeof AFRAME !== 'undefined') {
  /**
   * 1. Crisp 360° Seamless Procedural Atmospheric Sky Dome (Rayleigh/Mie Sky + Layered Cumulus Clouds + Sun/Moon + Stars)
   */
  if (!AFRAME.components['atmospheric-sky-dome']) {
    AFRAME.registerComponent('atmospheric-sky-dome', {
      schema: {
        solarElevation: { type: 'number', default: 0.35 },
        underwater: { type: 'boolean', default: false },
        tintColor: { type: 'color', default: '#38BDF8' },
        panoramaUrl: { type: 'string', default: '' }
      },

      init: function () {
        this.geo = new THREE.SphereGeometry(85, 64, 40);

        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uSolarElev: { value: this.data.solarElevation },
            uUnderwater: { value: this.data.underwater ? 1.0 : 0.0 },
            uTint: { value: new THREE.Color(this.data.tintColor) }
          },
          vertexShader: `
            varying vec3 vWorldDir;
            void main() {
              vWorldDir = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uSolarElev;
            uniform float uUnderwater;
            uniform vec3 uTint;
            varying vec3 vWorldDir;

            float hash31(vec3 p) {
              p = fract(p * 0.1031);
              p += dot(p, p.yzx + 33.33);
              return fract((p.x + p.y) * p.z);
            }

            float hash21(vec2 p) {
              p = fract(p * vec2(123.34, 456.21));
              p += dot(p, p + 45.32);
              return fract(p.x * p.y);
            }

            float noise2D(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
                mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
                u.y
              );
            }

            float fbmClouds(vec2 p) {
              float v = 0.0;
              float a = 0.52;
              for (int i = 0; i < 4; i++) {
                v += a * noise2D(p);
                p = p * 2.07 + vec2(1.7, 9.2);
                a *= 0.48;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldDir);
              float h = dir.y;

              if (uUnderwater > 0.5) {
                vec3 abyss = vec3(0.03, 0.34, 0.46);
                vec3 midSea = vec3(0.07, 0.58, 0.74);
                vec3 surfaceGlow = vec3(0.45, 0.94, 1.0);
                vec3 col = mix(abyss, midSea, smoothstep(-0.28, 0.25, h));
                col = mix(col, surfaceGlow, smoothstep(0.32, 0.96, h) * (0.68 + max(0.0, uSolarElev) * 0.4));

                // Sunlit underwater caustic shimmer bands near ocean surface
                float rays = sin(dir.x * 16.0 + uTime * 0.8) * cos(dir.z * 14.0 - uTime * 0.6);
                col += vec3(0.22, 0.75, 0.88) * max(0.0, rays) * smoothstep(0.1, 0.85, h) * 0.22;
                gl_FragColor = vec4(col, 1.0);
                return;
              }

              vec3 sunDir = normalize(vec3(0.28, sin(uSolarElev * 1.35), -0.92));
              float sunDot = max(0.0, dot(dir, sunDir));

              float dayFactor = smoothstep(-0.08, 0.42, uSolarElev);
              float twilightFactor = exp(-pow((uSolarElev - 0.05) * 4.5, 2.0));
              float nightFactor = 1.0 - smoothstep(-0.18, 0.08, uSolarElev);

              vec3 nightZenith = vec3(0.018, 0.042, 0.115);
              vec3 nightHorizon = vec3(0.065, 0.145, 0.285);

              vec3 dayZenith = mix(vec3(0.11, 0.44, 0.86), uTint, 0.08);
              vec3 dayHorizon = vec3(0.68, 0.88, 1.0);

              vec3 twilightZenith = vec3(0.16, 0.19, 0.44);
              vec3 twilightHorizon = vec3(1.0, 0.64, 0.34);

              vec3 zenith = mix(nightZenith, dayZenith, dayFactor);
              zenith = mix(zenith, twilightZenith, twilightFactor * 0.72);

              vec3 horizon = mix(nightHorizon, dayHorizon, dayFactor);
              horizon = mix(horizon, twilightHorizon, twilightFactor * 0.88);

              float upFrac = clamp(h, 0.0, 1.0);
              vec3 sky = mix(horizon, zenith, pow(upFrac, 0.52));

              // Smooth ground-matching lower hemisphere so no harsh white/dark seam ever appears
              vec3 nadir = mix(horizon * 0.72, uTint * 0.38 + horizon * 0.42, 0.45);
              if (h < 0.0) {
                sky = mix(horizon, nadir, clamp(-h * 3.0, 0.0, 1.0));
              }

              // Crisp 360-degree seamless sunlit cumulus clouds (planar sky projection)
              if (h > 0.02) {
                vec2 cloudUv = dir.xz / (h + 0.18) * 1.45 + vec2(uTime * 0.012, uTime * 0.006);
                float cNoise = fbmClouds(cloudUv);
                float cloudMask = smoothstep(0.46, 0.74, cNoise) * smoothstep(0.02, 0.18, h);
                vec3 cloudLit = mix(vec3(0.18, 0.25, 0.42), vec3(1.0, 0.99, 0.97), dayFactor);
                cloudLit = mix(cloudLit, vec3(1.0, 0.76, 0.56), twilightFactor * 0.82);
                // Sun-silver lining on cloud edges facing sun
                cloudLit += vec3(1.0, 0.94, 0.82) * pow(sunDot, 5.0) * 0.32 * dayFactor;
                sky = mix(sky, cloudLit, cloudMask * mix(0.28, 0.78, dayFactor + twilightFactor * 0.5));
              }

              // Horizon rose-gold warmth during golden hour & twilight
              float horizonGlow = exp(-abs(h) * 8.5) * (twilightFactor * 0.65 + (1.0 - nightFactor) * 0.14);
              sky += vec3(1.0, 0.56, 0.42) * horizonGlow * 0.42;

              // Solar disc & Mie aureole
              float sunDisc = smoothstep(0.9982, 0.9994, sunDot);
              float mie = pow(sunDot, 12.0) * 0.46 + pow(sunDot, 110.0) * 1.15;
              vec3 sunCol = mix(vec3(1.0, 0.48, 0.20), vec3(1.0, 0.97, 0.86), dayFactor);
              float sunVis = smoothstep(-0.16, 0.08, uSolarElev);
              sky += sunCol * (mie + sunDisc * 1.65) * sunVis;

              // Milky Way Galactic Band & Twinkling Starfield in night & twilight skies
              if (nightFactor > 0.02 && h > 0.02) {
                float galPlane = abs(dot(dir, normalize(vec3(0.42, 0.62, -0.66))));
                float galBand = exp(-galPlane * galPlane * 14.0) * smoothstep(0.02, 0.28, h);
                float galDust = fbmClouds(dir.xz * 3.8 + vec2(4.2, 1.9));
                vec3 nebulaCol = mix(vec3(0.11, 0.22, 0.44), vec3(0.28, 0.18, 0.46), galDust);
                sky += nebulaCol * galBand * (0.42 + galDust * 0.68) * nightFactor * 0.85;

                // Crisp twinkling stars (slightly denser along galactic arc)
                vec3 grid = floor(dir * 215.0);
                float rnd = hash31(grid);
                float starThreshold = mix(0.991, 0.982, galBand);
                if (rnd > starThreshold) {
                  float twinkle = 0.58 + 0.42 * sin(uTime * 2.8 + rnd * 120.0);
                  vec3 starTint = mix(vec3(0.86, 0.94, 1.0), vec3(1.0, 0.92, 0.78), fract(rnd * 37.0));
                  sky += starTint * twinkle * nightFactor * smoothstep(0.02, 0.24, h) * 1.62;
                }

                // Luminous Crescent Moon (Hilal) glowing peacefully in the upper sky
                vec3 moonDir = normalize(vec3(-0.46, 0.44, -0.77));
                vec3 moonRight = normalize(cross(vec3(0.0, 1.0, 0.0), moonDir));
                vec3 moonUp = cross(moonDir, moonRight);
                vec2 moonUv = vec2(dot(dir, moonRight), dot(dir, moonUp));
                float rOuter = length(moonUv);
                float rInner = length(moonUv - vec2(0.011, 0.0045));
                float crescent = smoothstep(0.029, 0.026, rOuter) * (1.0 - smoothstep(0.026, 0.023, rInner));
                float lunarHalo = exp(-rOuter * 22.0) * 0.24 + exp(-rOuter * 6.5) * 0.06;
                float moonFade = nightFactor * smoothstep(-0.02, 0.22, dir.y);
                sky += vec3(1.0, 0.95, 0.82) * crescent * 1.55 * moonFade;
                sky += vec3(0.68, 0.84, 1.0) * lunarHalo * moonFade;
              }

              gl_FragColor = vec4(sky, 1.0);
            }
          `,
          side: THREE.BackSide,
          depthWrite: false,
          fog: false
        });

        this.el.setObject3D('mesh', new THREE.Mesh(this.geo, this.mat));
        this.elapsed = 0;

        this.onSolar = (evt) => {
          if (typeof evt.detail?.solar === 'number') {
            this.mat.uniforms.uSolarElev.value = evt.detail.solar;
          }
        };
        window.addEventListener('biome-solar-changed', this.onSolar);
      },

      update: function () {
        if (!this.mat) return;
        this.mat.uniforms.uSolarElev.value = this.data.solarElevation;
        this.mat.uniforms.uUnderwater.value = this.data.underwater ? 1.0 : 0.0;
        this.mat.uniforms.uTint.value.set(this.data.tintColor);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        this.elapsed += (Math.min(timeDelta, 50) / 1000) * scale;
        this.mat.uniforms.uTime.value = this.elapsed;
      },

      remove: function () {
        window.removeEventListener('biome-solar-changed', this.onSolar);
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }

  /**
   * 2. Aurora Borealis Multi-Spectral Silk Curtains (Biome 1)
   */
  if (!AFRAME.components['aurora-curtain-shader']) {
    AFRAME.registerComponent('aurora-curtain-shader', {
      schema: {
        width: { type: 'number', default: 14.5 },
        height: { type: 'number', default: 4.4 },
        ribbonIndex: { type: 'number', default: 0 }
      },

      init: function () {
        this.geo = new THREE.PlaneGeometry(this.data.width, this.data.height, 110, 28);
        const pos = this.geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const archZ = -Math.pow(x * 0.22, 2) + Math.sin(x * 0.45 + this.data.ribbonIndex) * 0.72;
          pos.setXYZ(i, x, y, archZ);
        }
        this.geo.computeVertexNormals();

        const mrInit = (typeof window !== 'undefined' && window.tabsirahMrDiorama) || {
          active: false,
          radius: 0,
          center: [0, -1.05]
        };
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uRibbonOffset: { value: this.data.ribbonIndex * 2.1 },
            uRippleX: { value: 0.5 },
            uRippleAge: { value: 10.0 },
            uSolarDim: { value: 1.0 },
            uBurstBoost: { value: 0.0 },
            uDioramaRadius: { value: mrInit.active ? mrInit.radius : 0.0 },
            uDioramaCenter: { value: new THREE.Vector2(mrInit.center?.[0] ?? 0, mrInit.center?.[1] ?? -1.05) }
          },
          vertexShader: `
            uniform float uTime;
            uniform float uRibbonOffset;
            uniform float uRippleX;
            uniform float uRippleAge;
            varying vec2 vUv;
            varying float vWave;
            varying vec3 vWorldPos;
            void main() {
              vUv = uv;
              vec3 pos = position;
              float sway = sin(uv.x * 9.5 + uTime * 0.75 + uRibbonOffset) * 0.46;
              sway += cos(uv.x * 17.0 - uTime * 1.15) * 0.20;
              float distToRipple = abs(uv.x - uRippleX);
              float ripple = sin(distToRipple * 24.0 - uRippleAge * 8.0) * exp(-distToRipple * 5.0) * exp(-uRippleAge * 1.05) * 0.60;
              pos.z += (sway + ripple) * (0.35 + uv.y * 0.65);
              pos.x += cos(uv.x * 5.0 + uTime * 0.45) * 0.24;
              vWave = clamp(0.55 + sway * 0.8 + abs(ripple) * 1.6, 0.0, 1.6);
              vec4 wp = modelMatrix * vec4(pos, 1.0);
              vWorldPos = wp.xyz;
              gl_Position = projectionMatrix * viewMatrix * wp;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uRibbonOffset;
            uniform float uRippleX;
            uniform float uRippleAge;
            uniform float uSolarDim;
            uniform float uBurstBoost;
            uniform float uDioramaRadius;
            uniform vec2 uDioramaCenter;
            varying vec2 vUv;
            varying float vWave;
            varying vec3 vWorldPos;

            float hash11(float p) {
              return fract(sin(p * 127.1) * 43758.5453123);
            }

            float streakNoise(float x) {
              float i = floor(x);
              float f = fract(x);
              float u = f * f * (3.0 - 2.0 * f);
              return mix(hash11(i), hash11(i + 1.0), u);
            }

            void main() {
              if (uDioramaRadius > 0.01 && length(vWorldPos.xz - uDioramaCenter) > uDioramaRadius) {
                discard;
              }
              float rays = streakNoise(vUv.x * 54.0 + uTime * (0.9 + uBurstBoost * 1.4) + uRibbonOffset) * 0.65
                         + streakNoise(vUv.x * 124.0 - uTime * (1.7 + uBurstBoost * 2.2)) * 0.35;
              float curtainProfile = smoothstep(0.0, 0.14, vUv.y) * pow(1.0 - vUv.y, 1.35);
              float edgeFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);

              float distRipple = abs(vUv.x - uRippleX);
              float rippleBoost = exp(-distRipple * 6.5) * exp(-uRippleAge * 1.2) * 1.35;

              // True atmospheric emission lines with subtle geomagnetic spectral shift over time
              float hueWave = 0.5 + 0.5 * sin(uTime * 0.35 + vUv.x * 4.5 + uRibbonOffset);
              vec3 fringeViolet = mix(vec3(0.68, 0.34, 0.98), vec3(0.32, 0.54, 1.0), hueWave * 0.45);
              vec3 emerald = mix(vec3(0.14, 0.98, 0.62), vec3(0.28, 0.96, 0.82), hueWave * 0.35);
              vec3 cyan = vec3(0.22, 0.86, 0.98);
              vec3 crimson = mix(vec3(0.88, 0.24, 0.56), vec3(0.64, 0.28, 0.96), hueWave * 0.4);

              vec3 col = mix(fringeViolet, emerald, smoothstep(0.04, 0.22, vUv.y));
              col = mix(col, cyan, smoothstep(0.35, 0.65, vUv.y));
              col = mix(col, crimson, smoothstep(0.72, 0.96, vUv.y));
              col = mix(col, vec3(0.98, 0.84, 0.42), uBurstBoost * 0.26 * (1.0 - vUv.y));

              float burstMult = 1.0 + uBurstBoost * 1.15;
              float intensity = (curtainProfile * edgeFade * (0.48 + rays * 0.95) * vWave + rippleBoost * curtainProfile) * burstMult;
              gl_FragColor = vec4(col * intensity * 1.42 * uSolarDim, clamp(intensity * 0.84 * uSolarDim, 0.0, 0.96));
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });

        this.el.setObject3D('mesh', new THREE.Mesh(this.geo, this.mat));
        this.elapsed = 0;
        this.lastChime = 0;
        this.burstBoost = 0;

        this.onPointerMove = (e) => {
          const w = window.innerWidth || 1280;
          this.triggerRipple(e.clientX / w, false);
        };
        this.onPulse = () => this.triggerRipple(0.5, true);
        this.onCoronalBurst = () => {
          this.burstBoost = 1.0;
          this.triggerRipple(0.5, false);
        };
        this.onSolar = (evt) => {
          if (typeof evt.detail?.solar === 'number') {
            const dim = THREE.MathUtils.clamp(1.0 - Math.max(0, evt.detail.solar) * 0.72, 0.25, 1.0);
            this.mat.uniforms.uSolarDim.value = dim;
          }
        };
        this.onMrDiorama = (evt) => {
          const d = evt.detail || {};
          this.mat.uniforms.uDioramaRadius.value = d.active ? (d.radius || 0.425) : 0.0;
          if (d.center) this.mat.uniforms.uDioramaCenter.value.set(d.center[0], d.center[1]);
        };

        window.addEventListener('pointermove', this.onPointerMove);
        this.el.sceneEl?.addEventListener('aurora-magnetic-pulse', this.onPulse);
        this.el.sceneEl?.addEventListener('aurora-coronal-burst', this.onCoronalBurst);
        window.addEventListener('biome-solar-changed', this.onSolar);
        window.addEventListener('tabsirah-mr-diorama', this.onMrDiorama);
      },

      triggerRipple: function (normX, playSound) {
        this.mat.uniforms.uRippleX.value = THREE.MathUtils.clamp(normX, 0.05, 0.95);
        this.mat.uniforms.uRippleAge.value = 0.0;
        const now = performance.now();
        if (playSound || (now - this.lastChime > 680 && this.data.ribbonIndex === 0)) {
          this.lastChime = now;
          natureAudio.playIceChime({ x: (normX - 0.5) * 4, y: 2.6, z: -4 });
        }
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.elapsed += dt;
        this.burstBoost = Math.max(0, this.burstBoost - dt * 0.22);
        this.mat.uniforms.uTime.value = this.elapsed;
        this.mat.uniforms.uBurstBoost.value = this.burstBoost;
        this.mat.uniforms.uRippleAge.value = Math.min(12, this.mat.uniforms.uRippleAge.value + dt);
      },

      remove: function () {
        window.removeEventListener('pointermove', this.onPointerMove);
        this.el.sceneEl?.removeEventListener('aurora-magnetic-pulse', this.onPulse);
        this.el.sceneEl?.removeEventListener('aurora-coronal-burst', this.onCoronalBurst);
        window.removeEventListener('biome-solar-changed', this.onSolar);
        window.removeEventListener('tabsirah-mr-diorama', this.onMrDiorama);
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }

  /**
   * 3. Caustic Water Surface (Fjord Mirror, Oasis, River, Underwater Canopy & Seabed)
   */
  if (!AFRAME.components['caustic-water-surface']) {
    AFRAME.registerComponent('caustic-water-surface', {
      schema: {
        width: { type: 'number', default: 12 },
        depth: { type: 'number', default: 10 },
        mode: { type: 'string', default: 'pool' }, // 'pool' | 'underwater-canopy' | 'seabed' | 'fjord-mirror'
        tint: { type: 'color', default: '#0EA5E9' }
      },

      init: function () {
        this.geo = new THREE.PlaneGeometry(this.data.width, this.data.depth, 52, 52);
        this.geo.rotateX(-Math.PI / 2);

        const isCanopy = this.data.mode === 'underwater-canopy';
        const isSeabed = this.data.mode === 'seabed';
        const isFjord = this.data.mode === 'fjord-mirror';

        const mrInit = (typeof window !== 'undefined' && window.tabsirahMrDiorama) || {
          active: false,
          radius: 0,
          center: [0, -1.05]
        };
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uTint: { value: new THREE.Color(this.data.tint) },
            uMode: { value: isFjord ? 3.0 : isSeabed ? 2.0 : isCanopy ? 1.0 : 0.0 },
            uSolarElev: { value: 0.4 },
            uDioramaRadius: { value: mrInit.active ? mrInit.radius : 0.0 },
            uDioramaCenter: { value: new THREE.Vector2(mrInit.center?.[0] ?? 0, mrInit.center?.[1] ?? -1.05) }
          },
          vertexShader: `
            uniform float uTime;
            uniform float uMode;
            varying vec2 vUv;
            varying vec3 vWorldPos;
            void main() {
              vUv = uv;
              vec3 pos = position;
              if (uMode < 1.5 || uMode > 2.5) {
                float amp = uMode > 2.5 ? 0.022 : 0.042;
                pos.y += sin(pos.x * 2.2 + uTime * 1.4) * amp + cos(pos.z * 2.6 - uTime * 1.1) * amp;
              }
              vec4 wp = modelMatrix * vec4(pos, 1.0);
              vWorldPos = wp.xyz;
              gl_Position = projectionMatrix * viewMatrix * wp;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uTint;
            uniform float uMode;
            uniform float uSolarElev;
            uniform float uDioramaRadius;
            uniform vec2 uDioramaCenter;
            varying vec2 vUv;
            varying vec3 vWorldPos;

            float causticPattern(vec2 p, float t) {
              float c = 0.0;
              c += sin(p.x * 3.8 + t * 1.2 + sin(p.y * 3.4 - t * 0.9));
              c += sin(p.y * 4.2 - t * 1.0 + cos(p.x * 3.6 + t * 1.3));
              c += sin((p.x - p.y) * 3.1 + t * 0.7);
              return pow(clamp(abs(c) * 0.34, 0.0, 1.0), 2.4);
            }

            void main() {
              if (uDioramaRadius > 0.01 && length(vWorldPos.xz - uDioramaCenter) > uDioramaRadius) {
                discard;
              }
              vec2 p = vWorldPos.xz;
              float radialFade = smoothstep(1.0, 0.55, length(vUv - 0.5) * 2.0);
              float c = causticPattern(p * 0.85, uTime) * 0.65 + causticPattern(p * 1.4 - 1.2, -uTime * 0.8) * 0.5;

              if (uMode > 2.5) {
                // Arctic glacial fjord lake reflecting aurora emerald & violet ribbons
                float auroraWave = 0.5 + 0.5 * sin(p.x * 1.1 + uTime * 0.7 + sin(p.y * 0.9));
                vec3 iceWater = vec3(0.03, 0.14, 0.28);
                vec3 reflAurora = mix(vec3(0.12, 0.88, 0.58), vec3(0.45, 0.34, 0.92), auroraWave);
                vec3 col = mix(iceWater, reflAurora, c * 0.55 + auroraWave * 0.25);
                gl_FragColor = vec4(col, radialFade * 0.88);
              } else if (uMode > 1.5) {
                // Coral Cathedral seabed with chromatic dispersion caustic light refraction
                float cR = causticPattern(p * 0.85 + vec2(0.03, 0.0), uTime);
                float cG = c;
                float cB = causticPattern(p * 0.85 - vec2(0.03, 0.02), uTime);
                vec3 sand = vec3(0.08, 0.38, 0.48);
                vec3 ray = vec3(0.32 * cR, 0.94 * cG, 1.0 * cB);
                vec3 col = sand + ray * 0.82;
                gl_FragColor = vec4(col, radialFade * 0.96);
              } else if (uMode > 0.5) {
                vec3 deep = vec3(0.04, 0.32, 0.48);
                vec3 crest = vec3(0.45, 0.96, 1.0);
                vec3 col = mix(deep, crest, clamp(c * 1.25, 0.0, 1.0));
                gl_FragColor = vec4(col, radialFade * (0.38 + c * 0.55));
              } else {
                float skyReflect = clamp(0.35 + uSolarElev * 0.55, 0.12, 0.95);
                vec3 waterCol = mix(vec3(0.02, 0.14, 0.22), uTint, skyReflect);
                vec3 shimmer = mix(vec3(0.35, 0.78, 0.98), vec3(1.0, 0.78, 0.42), exp(-pow((uSolarElev - 0.05) * 4.0, 2.0)));
                vec3 col = waterCol + shimmer * c * (0.45 + skyReflect * 0.55);
                gl_FragColor = vec4(col, radialFade * 0.90);
              }
            }
          `,
          transparent: true,
          depthWrite: !isCanopy,
          side: THREE.DoubleSide
        });

        this.el.setObject3D('mesh', new THREE.Mesh(this.geo, this.mat));
        this.elapsed = 0;

        this.onSolar = (evt) => {
          if (typeof evt.detail?.solar === 'number') {
            this.mat.uniforms.uSolarElev.value = evt.detail.solar;
          }
        };
        this.onMrDiorama = (evt) => {
          const d = evt.detail || {};
          this.mat.uniforms.uDioramaRadius.value = d.active ? (d.radius || 0.425) : 0.0;
          if (d.center) this.mat.uniforms.uDioramaCenter.value.set(d.center[0], d.center[1]);
        };
        window.addEventListener('biome-solar-changed', this.onSolar);
        window.addEventListener('tabsirah-mr-diorama', this.onMrDiorama);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        this.elapsed += (Math.min(timeDelta, 50) / 1000) * scale;
        this.mat.uniforms.uTime.value = this.elapsed;
      },

      remove: function () {
        window.removeEventListener('biome-solar-changed', this.onSolar);
        window.removeEventListener('tabsirah-mr-diorama', this.onMrDiorama);
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }

  /**
   * 4. Custom GLSL Bioluminescent Forest Spores & Fireflies
   */
  if (!AFRAME.components['bioluminescent-spores']) {
    AFRAME.registerComponent('bioluminescent-spores', {
      schema: {
        count: { type: 'int', default: 260 },
        colorA: { type: 'color', default: '#34D399' },
        colorB: { type: 'color', default: '#FDE047' },
        radius: { type: 'number', default: 4.5 }
      },

      init: function () {
        const count = this.data.count;
        const positions = new Float32Array(count * 3);
        const seeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() - 0.5) * this.data.radius * 2;
          positions[i * 3 + 1] = 0.25 + Math.random() * 3.1;
          positions[i * 3 + 2] = -0.8 - Math.random() * 5.2;
          seeds[i] = Math.random() * 100.0;
        }

        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColorA: { value: new THREE.Color(this.data.colorA) },
            uColorB: { value: new THREE.Color(this.data.colorB) }
          },
          vertexShader: `
            attribute float aSeed;
            uniform float uTime;
            varying float vPulse;
            varying float vMix;
            void main() {
              vec3 pos = position;
              pos.x += sin(uTime * 0.65 + aSeed) * 0.24;
              pos.y += cos(uTime * 0.55 + aSeed * 1.3) * 0.22;
              pos.z += sin(uTime * 0.45 + aSeed * 0.7) * 0.18;
              vPulse = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.2 + aSeed * 3.1));
              vMix = fract(aSeed * 0.17);
              vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = (24.0 + 18.0 * vPulse) / max(1.0, -mvPos.z);
              gl_Position = projectionMatrix * mvPos;
            }
          `,
          fragmentShader: `
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            varying float vPulse;
            varying float vMix;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float glow = pow(1.0 - d * 2.0, 2.0);
              vec3 col = mix(uColorA, uColorB, vMix);
              gl_FragColor = vec4(col * glow * 1.35, glow * vPulse);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        this.el.setObject3D('mesh', new THREE.Points(this.geo, this.mat));
        this.elapsed = 0;
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        this.elapsed += (Math.min(timeDelta, 50) / 1000) * scale;
        this.mat.uniforms.uTime.value = this.elapsed;
      },

      remove: function () {
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }

  /**
   * 5. Volumetric Crepuscular God-Rays (Rainforest Canopy Sunbeams & Ocean Light Shafts)
   */
  if (!AFRAME.components['crepuscular-god-rays']) {
    AFRAME.registerComponent('crepuscular-god-rays', {
      schema: {
        color: { type: 'color', default: '#FDE68A' },
        opacity: { type: 'number', default: 0.14 },
        height: { type: 'number', default: 5.5 }
      },

      init: function () {
        this.geo = new THREE.CylinderGeometry(0.18, 1.05, this.data.height, 24, 1, true);
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(this.data.color) },
            uOpacity: { value: this.data.opacity }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormalView;
            varying vec3 vViewDir;
            void main() {
              vUv = uv;
              vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
              vNormalView = normalize(normalMatrix * normal);
              vViewDir = normalize(-mvPos.xyz);
              gl_Position = projectionMatrix * mvPos;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uOpacity;
            varying vec2 vUv;
            varying vec3 vNormalView;
            varying vec3 vViewDir;
            void main() {
              float fresnel = pow(abs(dot(normalize(vNormalView), normalize(vViewDir))), 2.2);
              float verticalFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
              float shimmer = 0.72 + 0.28 * sin(uTime * 1.1 + vUv.x * 18.0);
              float alpha = fresnel * verticalFade * shimmer * uOpacity;
              gl_FragColor = vec4(uColor, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });

        this.el.setObject3D('mesh', new THREE.Mesh(this.geo, this.mat));
        this.elapsed = 0;
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        this.elapsed += (Math.min(timeDelta, 50) / 1000) * scale;
        this.mat.uniforms.uTime.value = this.elapsed;
      },

      remove: function () {
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }

  /**
   * 6. Desert Mirage Heat-Shimmer Shader (Biome 4)
   */
  if (!AFRAME.components['desert-heat-shimmer-shader']) {
    AFRAME.registerComponent('desert-heat-shimmer-shader', {
      init: function () {
        this.geo = new THREE.PlaneGeometry(18, 2.4, 36, 8);
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uHeat: { value: 0.45 }
          },
          vertexShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vec3 pos = position;
              pos.y += sin(uv.x * 14.0 + uTime * 2.8) * 0.045 * uv.y;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uHeat;
            varying vec2 vUv;
            void main() {
              float band = sin(vUv.x * 26.0 - uTime * 3.4 + sin(vUv.y * 10.0 + uTime * 2.1)) * 0.5 + 0.5;
              float mask = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
              float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
              vec3 mirage = mix(vec3(0.98, 0.72, 0.28), vec3(1.0, 0.92, 0.65), band);
              float alpha = mask * edge * (0.04 + band * 0.08) * uHeat;
              gl_FragColor = vec4(mirage, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });

        this.el.setObject3D('mesh', new THREE.Mesh(this.geo, this.mat));
        this.elapsed = 0;

        this.onSolar = (evt) => {
          const s = typeof evt.detail?.solar === 'number' ? evt.detail.solar : 0.08;
          this.mat.uniforms.uHeat.value = THREE.MathUtils.clamp((s + 0.1) * 1.4, 0.06, 1.0);
        };
        window.addEventListener('biome-solar-changed', this.onSolar);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        this.elapsed += (Math.min(timeDelta, 50) / 1000) * scale;
        this.mat.uniforms.uTime.value = this.elapsed;
      },

      remove: function () {
        window.removeEventListener('biome-solar-changed', this.onSolar);
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }

  /**
   * 7. Alpine Alpenglow & Mountain Ridge Mist-Veil Shader (Biome 5)
   */
  if (!AFRAME.components['alpine-alpenglow-shader']) {
    AFRAME.registerComponent('alpine-alpenglow-shader', {
      init: function () {
        this.geo = new THREE.PlaneGeometry(16, 3.2, 42, 10);
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uSolarElev: { value: 0.22 }
          },
          vertexShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vec3 pos = position;
              pos.z += sin(uv.x * 6.5 + uTime * 0.55) * 0.25;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uSolarElev;
            varying vec2 vUv;
            void main() {
              float wisp = sin(vUv.x * 11.0 + uTime * 0.42) * 0.5 + 0.5;
              wisp *= cos(vUv.x * 19.0 - uTime * 0.65 + vUv.y * 5.0) * 0.5 + 0.5;
              float vFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.25, vUv.y);
              float hFade = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);

              float goldenGlow = exp(-pow((uSolarElev - 0.12) * 4.2, 2.0));
              vec3 mistCol = mix(vec3(0.68, 0.82, 0.96), vec3(1.0, 0.64, 0.48), goldenGlow * 0.78);
              float alpha = vFade * hFade * (0.06 + wisp * 0.14);
              gl_FragColor = vec4(mistCol, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });

        this.el.setObject3D('mesh', new THREE.Mesh(this.geo, this.mat));
        this.elapsed = 0;

        this.onSolar = (evt) => {
          if (typeof evt.detail?.solar === 'number') {
            this.mat.uniforms.uSolarElev.value = evt.detail.solar;
          }
        };
        window.addEventListener('biome-solar-changed', this.onSolar);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const scale = window.tabsirahTimeScale || 1.0;
        this.elapsed += (Math.min(timeDelta, 50) / 1000) * scale;
        this.mat.uniforms.uTime.value = this.elapsed;
      },

      remove: function () {
        window.removeEventListener('biome-solar-changed', this.onSolar);
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }

  /**
   * 8. Interactive Luminous Wonder Ripple System (Tap/Click Anywhere in 3D World for Harmonic Light Ring + Stardust)
   */
  if (!AFRAME.components['wonder-ripple-system']) {
    const BIOME_RIPPLE_COLORS = {
      aurora: '#34D399',
      rainforest: '#6EE7B7',
      ocean: '#22D3EE',
      desert: '#FBBF24'
    };

    AFRAME.registerComponent('wonder-ripple-system', {
      init: function () {
        this.sceneEl = this.el.sceneEl || this.el;
        this.group = new THREE.Group();
        this.ripples = [];
        this.downPos = null;
        this.raycaster = new THREE.Raycaster();
        this.ndc = new THREE.Vector2();

        this.ringGeo = new THREE.RingGeometry(0.14, 0.19, 32);
        this.starGeo = new THREE.BufferGeometry();
        const starCount = 16;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
          const a = (i / starCount) * Math.PI * 2;
          const r = 0.08 + (i % 3) * 0.06;
          starPos[i * 3] = Math.cos(a) * r;
          starPos[i * 3 + 1] = Math.sin(a) * r;
          starPos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
        }
        this.starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));

        this.sceneEl.object3D.add(this.group);

        this.onPointerDown = (e) => {
          if (e.target !== this.sceneEl.canvas) return;
          this.downPos = { x: e.clientX, y: e.clientY, time: performance.now() };
        };

        this.onPointerUp = (e) => {
          if (!this.downPos || e.target !== this.sceneEl.canvas) {
            this.downPos = null;
            return;
          }
          const dx = e.clientX - this.downPos.x;
          const dy = e.clientY - this.downPos.y;
          const dt = performance.now() - this.downPos.time;
          this.downPos = null;
          if (Math.hypot(dx, dy) > 8 || dt > 450) return;

          const camera = this.sceneEl.camera;
          const canvas = this.sceneEl.canvas;
          if (!camera || !canvas) return;

          const rect = canvas.getBoundingClientRect();
          this.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          this.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          // Avoid spawning if user clicked a 3D interactive discovery beacon directly
          const interactiveEls = Array.from(this.sceneEl.querySelectorAll('.interactive-node, .vr-interactive'));
          const targets = [];
          interactiveEls.forEach((el) => {
            if (el.object3D && el.object3D.visible) targets.push(el.object3D);
          });
          this.raycaster.setFromCamera(this.ndc, camera);
          if (targets.length && this.raycaster.intersectObjects(targets, true).length > 0) {
            return;
          }

          const spawnPos = this.raycaster.ray.origin.clone().addScaledVector(this.raycaster.ray.direction, 4.2);
          spawnPos.y = Math.max(0.25, spawnPos.y);
          this.spawnRipple(spawnPos, camera.quaternion);
        };

        window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
        window.addEventListener('pointerup', this.onPointerUp, { passive: true });
      },

      spawnRipple: function (pos, camQuat) {
        const biomeId = window.tabsirahActiveBiome || 'aurora';
        const col = BIOME_RIPPLE_COLORS[biomeId] || '#FBBF24';

        const ringMat = new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(this.ringGeo, ringMat);

        const starMat = new THREE.PointsMaterial({
          color: '#FEF3C7',
          size: 0.09,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const stars = new THREE.Points(this.starGeo, starMat);

        const holder = new THREE.Group();
        holder.position.copy(pos);
        if (camQuat) holder.quaternion.copy(camQuat);
        holder.add(ring, stars);
        this.group.add(holder);

        this.ripples.push({ holder, ringMat, starMat, age: 0, maxAge: 1.55 });
        natureAudio.unlock();
        natureAudio.playWonderRipple(biomeId, { x: pos.x, y: pos.y, z: pos.z });
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.ripples.length) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        for (let i = this.ripples.length - 1; i >= 0; i--) {
          const r = this.ripples[i];
          r.age += dt;
          const p = r.age / r.maxAge;
          if (p >= 1) {
            this.group.remove(r.holder);
            r.ringMat.dispose();
            r.starMat.dispose();
            this.ripples.splice(i, 1);
            continue;
          }
          const ease = 1 - Math.pow(1 - p, 2);
          r.holder.scale.setScalar(0.55 + ease * 3.2);
          r.holder.position.y += dt * 0.28;
          r.holder.children[1].rotation.z += dt * 1.1;
          r.ringMat.opacity = (1 - p) * 0.78;
          r.starMat.opacity = (1 - p) * 0.92;
        }
      },

      remove: function () {
        window.removeEventListener('pointerdown', this.onPointerDown);
        window.removeEventListener('pointerup', this.onPointerUp);
        this.ripples.forEach((r) => {
          this.group.remove(r.holder);
          r.ringMat.dispose();
          r.starMat.dispose();
        });
        this.ripples = [];
        this.sceneEl.object3D.remove(this.group);
        this.ringGeo?.dispose();
        this.starGeo?.dispose();
      }
    });
  }
}
