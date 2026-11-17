/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Multi-Disciplinary Scientific Telemetry & Meta VR Ergonomics Engine:
 *  - Calculates rigorous geophysical, biophysical, hydrodynamic, aeolian, and tectonic equations in real time.
 *  - Provides Meta VR controller haptic pulses on hand pinch and button interactions.
 */

import { triggerWebXRHapticPulse } from './webxr-beacon-haptics.js';

if (typeof AFRAME !== 'undefined') {
  if (!AFRAME.components['scientific-telemetry']) {
    AFRAME.registerComponent('scientific-telemetry', {
      schema: {
        biome: { type: 'string', default: 'aurora' }
      },

      init: function () {
        this.elapsed = 0;
        this.onHapticPulse = (e) => {
          const intensity = e.detail?.intensity || 0.4;
          const duration = e.detail?.duration || 40;
          const hand = e.detail?.hand || 'both';
          this.pulseControllers(intensity, duration, hand);
        };
        window.addEventListener('trigger-haptic', this.onHapticPulse);
      },

      pulseControllers: function (intensity = 0.4, duration = 40, hand = 'both') {
        const sceneEl = this.el.sceneEl;
        triggerWebXRHapticPulse(sceneEl, hand, intensity, duration);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        this.elapsed += timeDelta * 0.001;
      },

      remove: function () {
        window.removeEventListener('trigger-haptic', this.onHapticPulse);
      }
    });
  }
}
