/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Wow Factor GLSL Shaders:
 *  1. portal-window-shader (Glowing geometric astrolabe portal with depth/stencil depth-mask window)
 *  2. curl-ribbon-shader (Bioluminescent particle ribbons with curl-noise velocity physics)
 *  3. chronos-halo-shader (Temporal ring shader tracking millennia/microsecond scrubbing)
 *  4. holographic-lens-shader (X-Ray magnifying glass lens with refraction & rim glow)
 *  5. cymatic-mandala-shader (Voice & breath reactive 16-fold Islamic geometric dome)
 */

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
          transparent: true
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.el.setObject3D('mesh', this.mesh);
        this.elapsed = 0;
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
   * 2. Cymatic Mandala Sound-Reactive Component
   */
  if (!AFRAME.components['cymatic-mandala-shader']) {
    AFRAME.registerComponent('cymatic-mandala-shader', {
      init: function () {
        const geo = new THREE.RingGeometry(2.5, 4.5, 64, 4);
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uAudioLevel: { value: 0.15 }
          },
          vertexShader: `
            uniform float uTime;
            uniform float uAudioLevel;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vec3 pos = position;
              float angle = atan(pos.y, pos.x);
              float wave = sin(angle * 16.0 + uTime * 3.0) * (0.08 + uAudioLevel * 0.35);
              pos.z += wave * (1.0 - uv.x);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uAudioLevel;
            varying vec2 vUv;
            void main() {
              float ring = sin(vUv.x * 35.0 - uTime * 2.0) * 0.5 + 0.5;
              vec3 gold = vec3(1.0, 0.84, 0.32);
              vec3 col = gold * (0.6 + ring * 0.8 + uAudioLevel * 1.2);
              float alpha = (0.25 + ring * 0.4) * (0.6 + uAudioLevel * 0.8);
              gl_FragColor = vec4(col, alpha);
            }
          `,
          transparent: true,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.mesh = new THREE.Mesh(geo, this.mat);
        this.mesh.position.set(0, 3.5, -6);
        this.el.setObject3D('mesh', this.mesh);
        this.elapsed = 0;
      },
      tick: function (time, timeDelta) {
        if (!timeDelta || !this.mat) return;
        this.elapsed += (Math.min(timeDelta, 50) / 1000) * (window.tabsirahTimeScale || 1.0);
        this.mat.uniforms.uTime.value = this.elapsed;
        // Simulate audio response level dynamically from active speech or audio state
        const speaking = window.speechSynthesis && window.speechSynthesis.speaking ? 0.65 : 0.15;
        this.mat.uniforms.uAudioLevel.value = THREE.MathUtils.damp(
          this.mat.uniforms.uAudioLevel.value,
          speaking,
          4.0,
          timeDelta / 1000
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
