/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Cymatic Visualizer Component:
 * Uses the AnalyserNode from the Web Audio API to drive a dynamic THREE.PlaneGeometry
 * mesh, creating standing-wave Chladni cymatic patterns that ripple in real-time
 * based on the voice narrator's frequency data.
 */

import { natureAudio } from './nature-audio.js';

if (typeof AFRAME !== 'undefined') {
  if (!AFRAME.components['cymatic-visualizer']) {
    AFRAME.registerComponent('cymatic-visualizer', {
      schema: {
        width: { type: 'number', default: 3.5 },
        height: { type: 'number', default: 3.5 },
        segments: { type: 'int', default: 48 }
      },

      init: function () {
        const segs = this.data.segments;
        this.geo = new THREE.PlaneGeometry(this.data.width, this.data.height, segs, segs);
        this.geo.rotateX(-Math.PI / 2);

        this.mat = new THREE.MeshStandardMaterial({
          color: '#38BDF8',
          emissive: '#0EA5E9',
          emissiveIntensity: 0.65,
          roughness: 0.25,
          metalness: 0.2,
          wireframe: true,
          transparent: true,
          opacity: 0.26,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(this.geo, this.mat);
        this.el.setObject3D('mesh', this.mesh);
        this.elapsed = 0;
        this.smoothOverall = 0.14;
        this.smoothBass = 0.12;
        this.smoothMid = 0.12;
        this.smoothHigh = 0.1;
        this._baseColor = new THREE.Color('#0EA5E9');
        this._warmColor = new THREE.Color('#FBBF24');

        this.posAttr = this.geo.attributes.position;
        this.baseHeights = new Float32Array(this.posAttr.count);

        for (let i = 0; i < this.posAttr.count; i++) {
          this.baseHeights[i] = this.posAttr.getY(i);
        }
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.posAttr || !this.el.object3D?.visible) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.elapsed += dt;

        const bands = natureAudio?.sampleCymaticBands
          ? natureAudio.sampleCymaticBands()
          : { bass: 0.12, mid: 0.12, high: 0.1, overall: 0.14 };

        this.smoothBass = THREE.MathUtils.damp(this.smoothBass, bands.bass, 6.0, dt);
        this.smoothMid = THREE.MathUtils.damp(this.smoothMid, bands.mid, 6.5, dt);
        this.smoothHigh = THREE.MathUtils.damp(this.smoothHigh, bands.high, 7.5, dt);
        this.smoothOverall = THREE.MathUtils.damp(this.smoothOverall, bands.overall, 5.5, dt);

        const t = this.elapsed;
        const count = this.posAttr.count;
        const halfW = Math.max(0.5, this.data.width * 0.5);
        const bassWeight = 0.03 + this.smoothBass * 0.24;
        const midWeight = 0.02 + this.smoothMid * 0.18;
        const highWeight = 0.01 + this.smoothHigh * 0.11;

        for (let i = 0; i < count; i++) {
          const x = this.posAttr.getX(i);
          const z = this.posAttr.getZ(i);
          const nx = (x / halfW) * Math.PI;
          const nz = (z / halfW) * Math.PI;
          const r = Math.hypot(x, z);
          const radialMask = Math.max(0, 1.0 - r / (halfW * 1.08));

          const radial = Math.sin(r * 4.2 - t * 3.1) * bassWeight;
          const chladniMid =
            (Math.cos(3.0 * nx + t * 0.4) * Math.cos(5.0 * nz) -
              Math.cos(5.0 * nx) * Math.cos(3.0 * nz - t * 0.4)) *
            midWeight;
          const chladniHigh =
            Math.sin(6.0 * nx - t * 1.4) * Math.cos(8.0 * nz + t * 1.1) * highWeight;

          const newY = this.baseHeights[i] + (radial + chladniMid + chladniHigh) * radialMask;
          this.posAttr.setY(i, newY);
        }
        this.posAttr.needsUpdate = true;

        this.mat.emissiveIntensity = 0.55 + this.smoothOverall * 1.45;
        this.mat.opacity = Math.min(0.68, 0.20 + this.smoothOverall * 0.44);
        const warmMix = THREE.MathUtils.clamp(this.smoothBass * 1.35 - this.smoothHigh * 0.45, 0, 1);
        this.mat.emissive.copy(this._baseColor).lerp(this._warmColor, warmMix);
      },

      remove: function () {
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }
}
