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
          opacity: 0.24,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(this.geo, this.mat);
        this.el.setObject3D('mesh', this.mesh);
        this.elapsed = 0;
        this.posAttr = this.geo.attributes.position;
        this.baseHeights = new Float32Array(this.posAttr.count);

        for (let i = 0; i < this.posAttr.count; i++) {
          this.baseHeights[i] = this.posAttr.getY(i);
        }

        this.freqData = new Uint8Array(64);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.posAttr || !this.el.object3D?.visible) return;
        const scale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * scale;
        this.elapsed += dt;

        // Fetch frequency data from natureAudio if initialized
        let avgFreq = 0.15;
        if (natureAudio && natureAudio.analyser && natureAudio.isInitialized) {
          natureAudio.analyser.getByteFrequencyData(this.freqData);
          let sum = 0;
          for (let i = 0; i < 16; i++) sum += this.freqData[i];
          avgFreq = (sum / 16) / 255.0;
        } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
          avgFreq = 0.65;
        }

        const t = this.elapsed;
        const count = this.posAttr.count;
        for (let i = 0; i < count; i++) {
          const x = this.posAttr.getX(i);
          const z = this.posAttr.getZ(i);
          const r = Math.hypot(x, z);
          const standingWave = Math.sin(r * 4.5 - t * 3.5) * Math.cos(x * 3.2 + t * 2.1);
          const amp = (0.04 + avgFreq * 0.34) * Math.max(0, 1.0 - r * 0.35);
          const newY = this.baseHeights[i] + standingWave * amp;
          this.posAttr.setY(i, newY);
        }
        this.posAttr.needsUpdate = true;
        this.geo.computeVertexNormals();
      },

      remove: function () {
        this.el.removeObject3D('mesh');
        this.geo?.dispose();
        this.mat?.dispose();
      }
    });
  }
}
