/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Procedural Weather & Bioluminescence Particle System (`biome-particle-system`)
 * Supports falling snow, directional rain streaks, light-glimmering fireflies,
 * cascading waterfall spray, alpine mist clouds, and wind-blown desert sand drift
 * using a single GPU-accelerated custom GLSL ShaderMaterial with zero external assets.
 */

if (typeof AFRAME !== 'undefined' && !AFRAME.components['biome-particle-system']) {
  const MODE_MAP = {
    snow: 0,
    rain: 1,
    fireflies: 2,
    waterfall: 3,
    mist: 4,
    'sand-drift': 5
  };

  AFRAME.registerComponent('biome-particle-system', {
    schema: {
      type: { type: 'string', default: 'snow' }, // 'snow' | 'rain' | 'fireflies' | 'waterfall' | 'mist' | 'sand-drift'
      count: { type: 'int', default: 300 },
      active: { type: 'boolean', default: true },
      intensity: { type: 'number', default: 1.0 },
      colorA: { type: 'color', default: '#E2E8F0' },
      colorB: { type: 'color', default: '#7DD3FC' },
      areaWidth: { type: 'number', default: 12.0 },
      areaHeight: { type: 'number', default: 4.8 },
      areaDepth: { type: 'number', default: 8.0 }
    },

    init: function () {
      this.elapsed = 0;
      this.currentOpacity = this.data.active ? this.data.intensity : 0.0;
      this.targetOpacity = this.data.active ? this.data.intensity : 0.0;

      this.buildSystem();

      this.onWeatherUpdate = (evt) => {
        const d = evt.detail || {};
        if (d.targetId && d.targetId !== this.el.id) return;
        if (typeof d.active === 'boolean') {
          this.el.setAttribute('biome-particle-system', 'active', d.active);
        }
        if (typeof d.intensity === 'number') {
          this.el.setAttribute('biome-particle-system', 'intensity', d.intensity);
        }
      };
      this.el.sceneEl?.addEventListener('biome-weather-update', this.onWeatherUpdate);
    },

    buildSystem: function () {
      this.disposeSystem();

      const c = Math.max(10, this.data.count);
      const mode = MODE_MAP[this.data.type] ?? 0;
      const w = this.data.areaWidth;
      const h = this.data.areaHeight;
      const d = this.data.areaDepth;

      this.positions = new Float32Array(c * 3);
      this.speeds = new Float32Array(c);
      this.seeds = new Float32Array(c);
      this.sizes = new Float32Array(c);

      for (let i = 0; i < c; i++) {
        if (mode === 3) {
          // Waterfall column
          this.positions[i * 3] = (Math.random() - 0.5) * 1.15;
          this.positions[i * 3 + 1] = Math.random() * 3.6;
          this.positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          this.speeds[i] = 2.4 + Math.random() * 1.3;
          this.sizes[i] = 16.0 + Math.random() * 14.0;
        } else if (mode === 4) {
          // Delicate valley mist wisps (never giant blurry blobs)
          this.positions[i * 3] = (Math.random() - 0.5) * (w + 6);
          this.positions[i * 3 + 1] = (Math.random() - 0.5) * 0.35;
          this.positions[i * 3 + 2] = -2.2 - Math.random() * (d + 4);
          this.speeds[i] = 0.25 + Math.random() * 0.35;
          this.sizes[i] = 28.0 + Math.random() * 24.0;
        } else if (mode === 5) {
          // Sand drift
          this.positions[i * 3] = (Math.random() - 0.5) * (w + 2);
          this.positions[i * 3 + 1] = 0.08 + Math.random() * 1.35;
          this.positions[i * 3 + 2] = -0.6 - Math.random() * d;
          this.speeds[i] = 1.15 + Math.random() * 1.4;
          this.sizes[i] = 10.0 + Math.random() * 10.0;
        } else if (mode === 2) {
          // Light-glimmering fireflies
          this.positions[i * 3] = (Math.random() - 0.5) * w;
          this.positions[i * 3 + 1] = 0.28 + Math.random() * (h * 0.72);
          this.positions[i * 3 + 2] = -0.7 - Math.random() * (d * 0.8);
          this.speeds[i] = 0.45 + Math.random() * 0.55;
          this.sizes[i] = 22.0 + Math.random() * 20.0;
        } else if (mode === 1) {
          // Falling rain
          this.positions[i * 3] = (Math.random() - 0.5) * w;
          this.positions[i * 3 + 1] = Math.random() * h;
          this.positions[i * 3 + 2] = -0.5 - Math.random() * d;
          this.speeds[i] = 4.2 + Math.random() * 1.8;
          this.sizes[i] = 18.0 + Math.random() * 12.0;
        } else {
          // Falling snow
          this.positions[i * 3] = (Math.random() - 0.5) * w;
          this.positions[i * 3 + 1] = Math.random() * h;
          this.positions[i * 3 + 2] = -0.5 - Math.random() * d;
          this.speeds[i] = 0.42 + Math.random() * 0.48;
          this.sizes[i] = 13.0 + Math.random() * 12.0;
        }
        this.seeds[i] = Math.random() * 100.0;
      }

      this.geo = new THREE.BufferGeometry();
      this.posAttr = new THREE.BufferAttribute(this.positions, 3);
      this.geo.setAttribute('position', this.posAttr);
      this.geo.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));
      this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));

      this.mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMode: { value: mode },
          uOpacity: { value: this.currentOpacity },
          uColorA: { value: new THREE.Color(this.data.colorA) },
          uColorB: { value: new THREE.Color(this.data.colorB) }
        },
        vertexShader: `
          attribute float aSeed;
          attribute float aSize;
          uniform float uTime;
          uniform float uMode;
          varying float vSeed;
          varying float vGlimmer;

          void main() {
            vSeed = aSeed;
            vec3 pos = position;

            // Firefly organic Lissajous hover + glimmer wave
            if (uMode > 1.5 && uMode < 2.5) {
              pos.x += sin(uTime * 0.72 + aSeed) * 0.28;
              pos.y += cos(uTime * 0.58 + aSeed * 1.37) * 0.24;
              pos.z += sin(uTime * 0.48 + aSeed * 0.83) * 0.22;
              vGlimmer = 0.28 + 0.72 * pow(0.5 + 0.5 * sin(uTime * 2.4 + aSeed * 4.1), 2.2);
            } else if (uMode < 0.5) {
              // Gentle snow flutter & sparkle
              pos.x += sin(uTime * 0.8 + aSeed) * 0.08;
              vGlimmer = 0.65 + 0.35 * sin(uTime * 3.0 + aSeed * 5.0);
            } else {
              vGlimmer = 1.0;
            }

            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = (aSize * (0.85 + 0.3 * vGlimmer)) / max(1.0, -mvPos.z);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform float uMode;
          uniform float uOpacity;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying float vSeed;
          varying float vGlimmer;

          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float alpha = 0.0;

            if (uMode > 0.5 && uMode < 1.5) {
              // Directional rain streak (thin horizontal width, elongated vertical tail)
              vec2 rUv = vec2(uv.x * 4.8, uv.y * 1.0);
              float d = length(rUv);
              if (d > 0.5) discard;
              alpha = pow(1.0 - d * 2.0, 1.6) * 0.75;
            } else if (uMode > 3.5 && uMode < 4.5) {
              // Delicate translucent mist wisp
              float d = length(uv);
              if (d > 0.5) discard;
              alpha = pow(1.0 - d * 2.0, 2.8) * 0.08;
            } else if (uMode > 1.5 && uMode < 2.5) {
              // Crisp hot core + soft bioluminescent halo for fireflies
              float d = length(uv);
              if (d > 0.5) discard;
              float halo = pow(1.0 - d * 2.0, 2.2);
              float core = smoothstep(0.14, 0.0, d);
              alpha = (halo * 0.85 + core * 0.65) * vGlimmer;
            } else {
              // Snow crystal, waterfall droplet, or sand grain
              float d = length(uv);
              if (d > 0.5) discard;
              alpha = pow(1.0 - d * 2.0, 1.9) * 0.88 * vGlimmer;
            }

            vec3 col = mix(uColorA, uColorB, fract(vSeed * 0.19));
            gl_FragColor = vec4(col, alpha * uOpacity);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      this.points = new THREE.Points(this.geo, this.mat);
      this.points.frustumCulled = false;
      this.el.setObject3D('mesh', this.points);
    },

    update: function (oldData) {
      if (!this.mat) return;
      if (
        oldData.type !== this.data.type ||
        oldData.count !== this.data.count ||
        oldData.areaWidth !== this.data.areaWidth
      ) {
        this.buildSystem();
      }
      this.targetOpacity = this.data.active ? this.data.intensity : 0.0;
      this.mat.uniforms.uColorA.value.set(this.data.colorA);
      this.mat.uniforms.uColorB.value.set(this.data.colorB);
    },

    tick: function (time, timeDelta) {
      if (!timeDelta || !this.mat) return;
      const scale = window.tabsirahTimeScale || 1.0;
      const dt = (Math.min(timeDelta, 50) / 1000) * scale;

      this.currentOpacity = THREE.MathUtils.damp(this.currentOpacity, this.targetOpacity, 4.2, dt);
      this.mat.uniforms.uOpacity.value = this.currentOpacity;
      if (this.currentOpacity < 0.005) return;

      this.elapsed += dt;
      this.mat.uniforms.uTime.value = this.elapsed;

      const mode = MODE_MAP[this.data.type] ?? 0;
      // Fireflies animate purely on GPU vertex shader — zero CPU loop needed!
      if (mode === 2) return;

      const c = this.positions.length / 3;
      const pos = this.positions;
      const halfW = (this.data.areaWidth + 2) * 0.5;
      const topH = mode === 3 ? 3.6 : this.data.areaHeight;

      for (let i = 0; i < c; i++) {
        if (mode === 4 || mode === 5) {
          // Mist or sand-drift horizontal flow
          pos[i * 3] += this.speeds[i] * dt;
          if (mode === 5) {
            pos[i * 3 + 1] += Math.sin(this.elapsed * 2.0 + i) * 0.14 * dt;
          }
          if (pos[i * 3] > halfW) pos[i * 3] = -halfW;
        } else {
          // Snow, rain, or waterfall descent
          pos[i * 3 + 1] -= this.speeds[i] * dt;
          if (mode === 0) {
            pos[i * 3] += Math.sin(this.elapsed * 0.9 + i) * 0.18 * dt;
          } else if (mode === 1) {
            pos[i * 3] += 0.25 * dt; // subtle wind slant on rain
          }
          if (pos[i * 3 + 1] < 0) {
            pos[i * 3 + 1] = topH;
            if (mode === 1 && pos[i * 3] > halfW) pos[i * 3] = -halfW;
          }
        }
      }
      this.posAttr.needsUpdate = true;
    },

    disposeSystem: function () {
      this.el.removeObject3D('mesh');
      this.geo?.dispose();
      this.mat?.dispose();
      this.geo = null;
      this.mat = null;
    },

    remove: function () {
      this.el.sceneEl?.removeEventListener('biome-weather-update', this.onWeatherUpdate);
      this.disposeSystem();
    }
  });
}
