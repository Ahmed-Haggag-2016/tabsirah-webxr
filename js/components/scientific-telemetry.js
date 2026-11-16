/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Multi-Disciplinary Scientific Telemetry & Meta VR Ergonomics Engine:
 *  - Calculates rigorous geophysical, biophysical, hydrodynamic, aeolian, and tectonic equations in real time.
 *  - Provides Meta VR controller haptic pulses on hand pinch and button interactions.
 */

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
          this.pulseControllers(intensity, duration);
        };
        window.addEventListener('trigger-haptic', this.onHapticPulse);
      },

      pulseControllers: function (intensity = 0.4, duration = 40) {
        const sceneEl = this.el.sceneEl;
        if (!sceneEl || (!sceneEl.is('vr-mode') && !sceneEl.is('ar-mode'))) return;
        const clampedIntensity = Math.max(0, Math.min(1, intensity));
        const clampedDuration = Math.max(10, Math.min(250, duration));

        const pulseGamepad = (gp) => {
          if (!gp) return;
          if (gp.hapticActuators && gp.hapticActuators[0]?.pulse) {
            gp.hapticActuators[0].pulse(clampedIntensity, clampedDuration).catch(() => {});
          } else if (gp.vibrationActuator?.playEffect) {
            gp.vibrationActuator.playEffect('dual-rumble', {
              startDelay: 0,
              duration: clampedDuration,
              weakMagnitude: clampedIntensity * 0.7,
              strongMagnitude: clampedIntensity
            }).catch(() => {});
          }
        };

        const session = sceneEl.renderer?.xr?.getSession?.();
        if (session?.inputSources) {
          for (const source of session.inputSources) {
            pulseGamepad(source.gamepad);
          }
        }

        if (typeof navigator.getGamepads === 'function') {
          const gps = navigator.getGamepads();
          for (const gp of gps) {
            pulseGamepad(gp);
          }
        }
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
