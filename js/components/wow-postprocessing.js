/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Wow Factor Procedural Bloom Post-Processing Component:
 *
 * Implements a 100% procedural, multi-pass bloom effect directly inside Three.js / A-Frame
 * with zero external textures, npm packages, or heavy asset downloads:
 *  1. Base Scene Capture: Renders standard A-Frame 3D scene into full-res WebGLRenderTarget.
 *  2. Soft-Knee Luminance Threshold: Isolates bright bioluminescent spores, aurora ribbons,
 *     starlight, and caustic highlights into a downsampled half-res buffer.
 *  3. Dual-Octave Hardware-Bilinear Gaussian Blur: High-efficiency 5-tap texture offset kernel
 *     (equivalent to 9 taps) ping-ponged horizontally and vertically for silky, wide aura spread.
 *  4. Filmic Tone-Mapped Composite: Combines base scene with bloom radiance using ACES-approximation
 *     shoulder compression so highlights glow richly without hard white clipping.
 *  5. WebXR & Headset Safety: Gracefully passes through to native XRWebGLLayer when entering VR/MR,
 *     preventing black-screen issues or frame drops on Meta Quest headsets.
 */

if (typeof AFRAME !== 'undefined') {
  if (!AFRAME.components['wow-postprocessing']) {
    AFRAME.registerComponent('wow-postprocessing', {
      schema: {
        enabled: { type: 'boolean', default: true },
        strength: { type: 'number', default: 1.25 },
        radius: { type: 'number', default: 0.65 },
        threshold: { type: 'number', default: 0.72 },
        knee: { type: 'number', default: 0.12 },
        downsample: { type: 'int', default: 2 },
        toneMapping: { type: 'boolean', default: true }
      },

      init: function () {
        this.sceneEl = this.el;
        this.isHooked = false;
        this.originalRender = null;
        this.lastWidth = 0;
        this.lastHeight = 0;

        // Isolated orthographic screen quad for post-processing passes
        this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.quadScene = new THREE.Scene();
        this.quadGeo = new THREE.PlaneGeometry(2, 2);
        this.quadMesh = new THREE.Mesh(this.quadGeo);
        this.quadScene.add(this.quadMesh);

        this.initShaders();

        this.onToggleBloom = () => {
          this.el.setAttribute('wow-postprocessing', 'enabled', !this.data.enabled);
          const btn = document.getElementById('btn-bloom-toggle');
          if (btn) {
            btn.classList.toggle('is-active', this.data.enabled);
            btn.setAttribute('aria-pressed', String(this.data.enabled));
            btn.textContent = this.data.enabled ? 'Bloom Glow' : 'Bloom Off';
          }
        };

        this.onSetBloom = (evt) => {
          const detail = evt.detail || {};
          if (typeof detail.enabled === 'boolean') this.el.setAttribute('wow-postprocessing', 'enabled', detail.enabled);
          if (typeof detail.strength === 'number') this.el.setAttribute('wow-postprocessing', 'strength', detail.strength);
          if (typeof detail.radius === 'number') this.el.setAttribute('wow-postprocessing', 'radius', detail.radius);
          if (typeof detail.threshold === 'number') this.el.setAttribute('wow-postprocessing', 'threshold', detail.threshold);
        };

        window.addEventListener('toggle-wow-bloom', this.onToggleBloom);
        window.addEventListener('set-wow-bloom', this.onSetBloom);

        const setup = () => {
          if (this.isHooked || !this.sceneEl.renderer) return;
          this.hookRenderer();
        };

        if (this.sceneEl.renderer) {
          setup();
        } else {
          this.sceneEl.addEventListener('render-target-loaded', setup, { once: true });
          this.sceneEl.addEventListener('loaded', setup, { once: true });
        }
      },

      initShaders: function () {
        // 1. Soft-Knee Luminance Threshold Shader
        this.brightMat = new THREE.ShaderMaterial({
          uniforms: {
            tDiffuse: { value: null },
            uThreshold: { value: this.data.threshold },
            uKnee: { value: this.data.knee }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy, 0.0, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uThreshold;
            uniform float uKnee;
            varying vec2 vUv;
            void main() {
              vec4 col = texture2D(tDiffuse, vUv);
              // Rec. 709 Luminance
              float lum = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
              float soft = clamp((lum - uThreshold + uKnee) / (2.0 * uKnee + 1e-4), 0.0, 1.0);
              float kneeWeight = soft * soft;
              float factor = max(lum - uThreshold, 0.0) / max(lum, 1e-4);
              vec3 bright = col.rgb * max(factor, kneeWeight * 0.45);
              gl_FragColor = vec4(bright, 1.0);
            }
          `,
          depthTest: false,
          depthWrite: false
        });

        // 2. High-Efficiency 5-Tap Bilinear Gaussian Blur Shader
        this.blurMat = new THREE.ShaderMaterial({
          uniforms: {
            tDiffuse: { value: null },
            uDirection: { value: new THREE.Vector2(0.001, 0.0) },
            uRadius: { value: this.data.radius }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy, 0.0, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform vec2 uDirection;
            uniform float uRadius;
            varying vec2 vUv;
            void main() {
              vec2 offset = uDirection * uRadius;
              // 5-tap bilinear filter sampling 9 texels
              vec4 sum = texture2D(tDiffuse, vUv) * 0.227027;
              sum += texture2D(tDiffuse, vUv + offset * 1.38461538) * 0.316216216;
              sum += texture2D(tDiffuse, vUv - offset * 1.38461538) * 0.316216216;
              sum += texture2D(tDiffuse, vUv + offset * 3.23076923) * 0.07027027;
              sum += texture2D(tDiffuse, vUv - offset * 3.23076923) * 0.07027027;
              gl_FragColor = sum;
            }
          `,
          depthTest: false,
          depthWrite: false
        });

        // 3. Filmic Tone-Mapped Bloom Composite Shader
        this.compositeMat = new THREE.ShaderMaterial({
          uniforms: {
            tBase: { value: null },
            tBloom: { value: null },
            uStrength: { value: this.data.strength },
            uToneMapping: { value: this.data.toneMapping }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy, 0.0, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D tBase;
            uniform sampler2D tBloom;
            uniform float uStrength;
            uniform bool uToneMapping;
            varying vec2 vUv;

            vec3 acesToneMapping(vec3 x) {
              const float a = 2.51;
              const float b = 0.03;
              const float c = 2.43;
              const float d = 0.59;
              const float e = 0.14;
              return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
            }

            void main() {
              vec4 baseCol = texture2D(tBase, vUv);
              vec4 bloomCol = texture2D(tBloom, vUv);
              vec3 result = baseCol.rgb + bloomCol.rgb * uStrength;

              if (uToneMapping) {
                result = acesToneMapping(result);
              }

              gl_FragColor = vec4(result, baseCol.a);
            }
          `,
          depthTest: false,
          depthWrite: false
        });
      },

      ensureRenderTargets: function (width, height) {
        if (width === this.lastWidth && height === this.lastHeight && this.baseTarget) {
          return;
        }

        this.disposeTargets();

        this.lastWidth = width;
        this.lastHeight = height;

        const ds = Math.max(1, this.data.downsample);
        const bw = Math.max(1, Math.floor(width / ds));
        const bh = Math.max(1, Math.floor(height / ds));
        this.blurW = bw;
        this.blurH = bh;

        const isWebGL2 = Boolean(this.sceneEl.renderer?.capabilities?.isWebGL2);
        const textureType = isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType;

        const baseOpts = {
          type: textureType,
          format: THREE.RGBAFormat,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          generateMipmaps: false,
          depthBuffer: true,
          stencilBuffer: false
        };

        const blurOpts = {
          type: textureType,
          format: THREE.RGBAFormat,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          generateMipmaps: false,
          depthBuffer: false,
          stencilBuffer: false
        };

        this.baseTarget = new THREE.WebGLRenderTarget(width, height, baseOpts);
        this.brightTarget = new THREE.WebGLRenderTarget(bw, bh, blurOpts);
        this.blurTargetA = new THREE.WebGLRenderTarget(bw, bh, blurOpts);
        this.blurTargetB = new THREE.WebGLRenderTarget(bw, bh, blurOpts);

        if (this.sceneEl.renderer?.outputColorSpace) {
          this.baseTarget.texture.colorSpace = this.sceneEl.renderer.outputColorSpace;
          this.brightTarget.texture.colorSpace = this.sceneEl.renderer.outputColorSpace;
          this.blurTargetA.texture.colorSpace = this.sceneEl.renderer.outputColorSpace;
          this.blurTargetB.texture.colorSpace = this.sceneEl.renderer.outputColorSpace;
        }
      },

      hookRenderer: function () {
        if (this.isHooked || !this.sceneEl.render) return;
        this.isHooked = true;
        this.originalRender = this.sceneEl.render.bind(this.sceneEl);

        const sizeVec = new THREE.Vector2();

        this.sceneEl.render = () => {
          const renderer = this.sceneEl.renderer;
          const camera = this.sceneEl.camera;
          if (!renderer || !camera) return;

          // 1. Direct pass-through in WebXR (VR/MR) or if disabled
          if (!this.data.enabled || (renderer.xr && renderer.xr.isPresenting)) {
            this.originalRender();
            return;
          }

          // 2. Sync dimensions with viewport
          renderer.getSize(sizeVec);
          const pr = renderer.getPixelRatio() || 1;
          const targetW = Math.max(1, Math.floor(sizeVec.x * pr));
          const targetH = Math.max(1, Math.floor(sizeVec.y * pr));
          this.ensureRenderTargets(targetW, targetH);

          // 3. Render 3D scene into baseTarget
          renderer.setRenderTarget(this.baseTarget);
          this.originalRender();

          // 4. Bright Pass: Extract high-energy bioluminescent & aurora pixels
          this.quadMesh.material = this.brightMat;
          this.brightMat.uniforms.tDiffuse.value = this.baseTarget.texture;
          this.brightMat.uniforms.uThreshold.value = this.data.threshold;
          this.brightMat.uniforms.uKnee.value = this.data.knee;
          renderer.setRenderTarget(this.brightTarget);
          renderer.render(this.quadScene, this.quadCamera);

          // 5. Blur Octave 1 - Horizontal
          this.quadMesh.material = this.blurMat;
          this.blurMat.uniforms.tDiffuse.value = this.brightTarget.texture;
          this.blurMat.uniforms.uDirection.value.set(1.0 / this.blurW, 0.0);
          this.blurMat.uniforms.uRadius.value = this.data.radius;
          renderer.setRenderTarget(this.blurTargetA);
          renderer.render(this.quadScene, this.quadCamera);

          // 6. Blur Octave 1 - Vertical
          this.blurMat.uniforms.tDiffuse.value = this.blurTargetA.texture;
          this.blurMat.uniforms.uDirection.value.set(0.0, 1.0 / this.blurH);
          this.blurMat.uniforms.uRadius.value = this.data.radius;
          renderer.setRenderTarget(this.blurTargetB);
          renderer.render(this.quadScene, this.quadCamera);

          // 7. Blur Octave 2 - Wide soft aura spread
          this.blurMat.uniforms.tDiffuse.value = this.blurTargetB.texture;
          this.blurMat.uniforms.uDirection.value.set(1.0 / this.blurW, 1.0 / this.blurH);
          this.blurMat.uniforms.uRadius.value = this.data.radius * 1.85;
          renderer.setRenderTarget(this.blurTargetA);
          renderer.render(this.quadScene, this.quadCamera);

          // 8. Filmic Tone-Mapped Composite to Screen
          this.quadMesh.material = this.compositeMat;
          this.compositeMat.uniforms.tBase.value = this.baseTarget.texture;
          this.compositeMat.uniforms.tBloom.value = this.blurTargetA.texture;
          this.compositeMat.uniforms.uStrength.value = this.data.strength;
          this.compositeMat.uniforms.uToneMapping.value = this.data.toneMapping;
          renderer.setRenderTarget(null);
          renderer.render(this.quadScene, this.quadCamera);
        };
      },

      update: function (oldData) {
        if (!oldData) return;
        if (this.compositeMat) {
          this.compositeMat.uniforms.uStrength.value = this.data.strength;
          this.compositeMat.uniforms.uToneMapping.value = this.data.toneMapping;
        }
        if (this.brightMat) {
          this.brightMat.uniforms.uThreshold.value = this.data.threshold;
          this.brightMat.uniforms.uKnee.value = this.data.knee;
        }
        if (this.blurMat) {
          this.blurMat.uniforms.uRadius.value = this.data.radius;
        }
        if (oldData.downsample !== this.data.downsample) {
          this.lastWidth = 0; // Trigger re-allocation on next frame
        }
      },

      disposeTargets: function () {
        if (this.baseTarget) {
          this.baseTarget.dispose();
          this.baseTarget = null;
        }
        if (this.brightTarget) {
          this.brightTarget.dispose();
          this.brightTarget = null;
        }
        if (this.blurTargetA) {
          this.blurTargetA.dispose();
          this.blurTargetA = null;
        }
        if (this.blurTargetB) {
          this.blurTargetB.dispose();
          this.blurTargetB = null;
        }
      },

      remove: function () {
        window.removeEventListener('toggle-wow-bloom', this.onToggleBloom);
        window.removeEventListener('set-wow-bloom', this.onSetBloom);

        if (this.isHooked && this.originalRender) {
          this.sceneEl.render = this.originalRender;
          this.isHooked = false;
        }

        this.disposeTargets();

        if (this.quadGeo) this.quadGeo.dispose();
        if (this.brightMat) this.brightMat.dispose();
        if (this.blurMat) this.blurMat.dispose();
        if (this.compositeMat) this.compositeMat.dispose();
      }
    });
  }
}
