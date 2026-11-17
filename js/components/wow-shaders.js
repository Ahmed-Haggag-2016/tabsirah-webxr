/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Wow Factor GLSL Shaders:
 *  1. portal-window-shader (Glowing geometric astrolabe portal with depth/stencil depth-mask window)
 *  2. curl-ribbon-shader (Bioluminescent particle ribbons with curl-noise velocity physics)
 *  3. chronos-halo-shader (Temporal ring shader tracking millennia/microsecond scrubbing)
 *  4. holographic-lens-shader (X-Ray magnifying glass lens with refraction & rim glow)
 *  5. cymatic-mandala-shader (Voice & breath reactive 16-fold Islamic geometric dome)
 */

import { natureAudio } from './nature-audio.js';

if (typeof AFRAME !== 'undefined') {
  /**
   * 1. Portal Window Shader
   */
  if (!AFRAME.components['portal-window-shader']) {
    AFRAME.registerComponent('portal-window-shader', {
      schema: { color: { type: 'color', default: '#38BDF8' } },
      init: function () {
        const geo = new THREE.TorusGeometry(1.2, 0.08, 16, 48);
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(this.data.color) }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
              float pulse = 0.75 + 0.25 * sin(uTime * 3.0);
              vec3 col = uColor * (1.2 + pulse * 0.5);
              gl_FragColor = vec4(col, 0.92);
            }
          `,
          transparent: true,
          depthTest: true,
          depthWrite: true
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.renderOrder = -20;
        this.el.setObject3D('mesh', this.mesh);
        this.elapsed = 0;
      },
      update: function (oldData) {
        if (this.mesh?.material?.uniforms?.uColor && oldData.color !== this.data.color) {
          this.mesh.material.uniforms.uColor.value.set(this.data.color);
        }
      },
      tick: function (time, timeDelta) {
        if (!timeDelta || !this.mesh) return;
        this.elapsed += (Math.min(timeDelta, 50) / 1000) * (window.tabsirahTimeScale || 1.0);
        this.mesh.material.uniforms.uTime.value = this.elapsed;
        this.mesh.rotation.z = this.elapsed * 0.15;
      },
      remove: function () {
        this.el.removeObject3D('mesh');
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
      }
    });
  }

  /**
   * 1b. MR Portal Depth-Test & Occlusion Shader (`portal-occlusion-shader`)
   * Writes depth-only occlusion masks (outer surface apron + sunken portal well)
   * before biome geometry renders so the MR doorway cleanly occludes against
   * real-world surfaces without altering passthrough alpha/color.
   */
  if (!AFRAME.components['portal-occlusion-shader']) {
    AFRAME.registerComponent('portal-occlusion-shader', {
      schema: {
        innerRadius: { type: 'number', default: 1.18 },
        outerRadius: { type: 'number', default: 4.5 },
        wellDepth: { type: 'number', default: 2.2 },
        color: { type: 'color', default: '#38BDF8' },
        activeInDesktop: { type: 'boolean', default: false }
      },
      init: function () {
        this.occlusionGroup = new THREE.Group();
        this.elapsed = 0;

        // 1. Depth-Only Table/Floor Occlusion Apron (outside the portal aperture)
        this.apronGeo = new THREE.RingGeometry(this.data.innerRadius, this.data.outerRadius, 64, 1);
        this.apronMat = new THREE.ShaderMaterial({
          uniforms: {
            uInnerRadius: { value: this.data.innerRadius }
          },
          vertexShader: `
            varying vec2 vLocalXY;
            void main() {
              vLocalXY = position.xy;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uInnerRadius;
            varying vec2 vLocalXY;
            void main() {
              if (length(vLocalXY) < uInnerRadius) discard;
              gl_FragColor = vec4(0.0);
            }
          `,
          colorWrite: false,
          depthTest: true,
          depthWrite: true,
          side: THREE.DoubleSide
        });
        this.apronMesh = new THREE.Mesh(this.apronGeo, this.apronMat);
        // Flip front normal to local -Z (world +Y when entity rotation is 90 0 0)
        this.apronMesh.rotation.x = Math.PI;
        this.apronMesh.position.z = 0.015;
        this.apronMesh.renderOrder = -25;
        this.occlusionGroup.add(this.apronMesh);

        // 2. Depth-Only Cylindrical Portal Well (occludes diorama sides/underside from outside)
        this.wellGeo = new THREE.CylinderGeometry(
          this.data.innerRadius * 1.01,
          this.data.innerRadius * 1.01,
          this.data.wellDepth,
          64,
          1,
          true
        );
        this.wellMat = new THREE.ShaderMaterial({
          vertexShader: `
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            void main() {
              gl_FragColor = vec4(0.0);
            }
          `,
          colorWrite: false,
          depthTest: true,
          depthWrite: true,
          side: THREE.FrontSide
        });
        this.wellMesh = new THREE.Mesh(this.wellGeo, this.wellMat);
        this.wellMesh.rotation.x = Math.PI / 2;
        this.wellMesh.position.z = this.data.wellDepth * 0.5 + 0.02;
        this.wellMesh.renderOrder = -25;
        this.occlusionGroup.add(this.wellMesh);

        // 3. Depth-Tested Portal Threshold Rim Glow (softly grounds aperture to real surface)
        this.horizonGeo = new THREE.RingGeometry(
          this.data.innerRadius * 0.86,
          this.data.innerRadius * 1.04,
          64,
          1
        );
        this.horizonMat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(this.data.color) },
            uInner: { value: this.data.innerRadius * 0.86 },
            uOuter: { value: this.data.innerRadius * 1.04 }
          },
          vertexShader: `
            varying vec2 vLocalXY;
            void main() {
              vLocalXY = position.xy;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uInner;
            uniform float uOuter;
            varying vec2 vLocalXY;
            void main() {
              float r = length(vLocalXY);
              float t = clamp((r - uInner) / max(0.0001, uOuter - uInner), 0.0, 1.0);
              float angle = atan(vLocalXY.y, vLocalXY.x);
              float shimmer = 0.78 + 0.22 * sin(angle * 16.0 - uTime * 2.4);
              float edge = smoothstep(0.0, 0.72, t) * (1.0 - smoothstep(0.84, 1.0, t));
              gl_FragColor = vec4(uColor * (1.1 + shimmer * 0.35), edge * 0.42);
            }
          `,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        this.horizonMesh = new THREE.Mesh(this.horizonGeo, this.horizonMat);
        this.horizonMesh.rotation.x = Math.PI;
        this.horizonMesh.position.z = -0.008;
        this.horizonMesh.renderOrder = -24;
        this.occlusionGroup.add(this.horizonMesh);

        this.el.setObject3D('occlusion-mask', this.occlusionGroup);
      },
      update: function (oldData) {
        if (this.horizonMat?.uniforms?.uColor && oldData.color !== this.data.color) {
          this.horizonMat.uniforms.uColor.value.set(this.data.color);
        }
        if (this.apronMat?.uniforms?.uInnerRadius && oldData.innerRadius !== this.data.innerRadius) {
          this.apronMat.uniforms.uInnerRadius.value = this.data.innerRadius;
        }
      },
      tick: function (time, timeDelta) {
        if (!timeDelta || !this.horizonMat) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        this.elapsed += dt * (window.tabsirahTimeScale || 1.0);
        this.horizonMat.uniforms.uTime.value = this.elapsed;

        const isAR = Boolean(this.el.sceneEl?.is('ar-mode'));
        if (this.apronMesh) {
          this.apronMesh.visible = isAR || this.data.activeInDesktop;
        }
      },
      remove: function () {
        this.el.removeObject3D('occlusion-mask');
        this.apronGeo?.dispose();
        this.apronMat?.dispose();
        this.wellGeo?.dispose();
        this.wellMat?.dispose();
        this.horizonGeo?.dispose();
        this.horizonMat?.dispose();
      }
    });
  }

  /**
   * 2. Cymatic Mandala Sound-Reactive Component
   */
  if (!AFRAME.components['cymatic-mandala-shader']) {
    AFRAME.registerComponent('cymatic-mandala-shader', {
      init: function () {
        const geo = new THREE.RingGeometry(1.45, 2.35, 72, 6);
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uAudioLevel: { value: 0.14 },
            uBass: { value: 0.12 },
            uHarmonic: { value: 0.1 }
          },
          vertexShader: `
            uniform float uTime;
            uniform float uAudioLevel;
            uniform float uBass;
            uniform float uHarmonic;
            varying vec2 vUv;
            varying float vWave;
            void main() {
              vUv = uv;
              vec3 pos = position;
              float angle = atan(pos.y, pos.x);
              float radial = length(pos.xy);
              float petal = sin(angle * 16.0 + uTime * 2.6) * (0.04 + uHarmonic * 0.24);
              float ringPulse = sin(radial * 7.5 - uTime * 3.4) * (0.03 + uBass * 0.22);
              float disp = (petal + ringPulse) * (1.0 - uv.x * 0.45);
              pos.z += disp;
              vWave = disp;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uAudioLevel;
            uniform float uBass;
            uniform float uHarmonic;
            varying vec2 vUv;
            varying float vWave;
            void main() {
              float ring = sin(vUv.x * 32.0 - uTime * (1.8 + uBass * 2.2)) * 0.5 + 0.5;
              vec3 gold = vec3(1.0, 0.84, 0.32);
              vec3 sky = vec3(0.22, 0.74, 0.97);
              vec3 baseCol = mix(gold, sky, clamp(uHarmonic * 0.95, 0.0, 0.75));
              vec3 col = baseCol * (0.55 + ring * 0.75 + uAudioLevel * 1.35 + abs(vWave) * 1.5);
              float radialFade = smoothstep(0.0, 0.25, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x));
              float alpha = radialFade * (0.18 + ring * 0.34) * (0.55 + uAudioLevel * 1.15);
              gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
            }
          `,
          transparent: true,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.mesh = new THREE.Mesh(geo, this.mat);
        this.el.setObject3D('mesh', this.mesh);
        this.elapsed = 0;
      },
      tick: function (time, timeDelta) {
        if (!timeDelta || !this.mat) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        const scale = window.tabsirahTimeScale || 1.0;
        this.elapsed += dt * scale;
        this.mat.uniforms.uTime.value = this.elapsed;

        const bands = natureAudio?.sampleCymaticBands
          ? natureAudio.sampleCymaticBands()
          : { bass: 0.1, mid: 0.1, high: 0.08, overall: 0.12 };

        this.mat.uniforms.uAudioLevel.value = THREE.MathUtils.damp(
          this.mat.uniforms.uAudioLevel.value,
          0.08 + bands.overall * 0.92,
          6.0,
          dt
        );
        this.mat.uniforms.uBass.value = THREE.MathUtils.damp(
          this.mat.uniforms.uBass.value,
          bands.bass,
          6.5,
          dt
        );
        this.mat.uniforms.uHarmonic.value = THREE.MathUtils.damp(
          this.mat.uniforms.uHarmonic.value,
          bands.mid * 0.55 + bands.high * 0.45,
          7.0,
          dt
        );
      },
      remove: function () {
        this.el.removeObject3D('mesh');
        this.mesh.geometry.dispose();
        this.mat.dispose();
      }
    });
  }
}
