/**
 * Tabṣirah: Spatial Console & Grounded Interaction Coordination (`grand-prize-upgrade.js`)
 *  - Preserves `movable-spatial-console` so users can freely reposition the 3D VR Control Console.
 *  - Keeps scene objects grounded in their natural habitat (no grab/toss detachment) so
 *    camera look, hover, tactile ripples, and bare-hand/pointer discovery feel completely natural.
 */

if (typeof AFRAME !== 'undefined') {
  if (!AFRAME.components['spatial-object-grabs']) {
    AFRAME.registerComponent('spatial-object-grabs', {
      schema: {
        enabled: { type: 'boolean', default: false }
      },
      init: function () {},
      remove: function () {}
    });
  }

  /**
   * Movable Spatial Console Coordination (`movable-spatial-console`)
   * Seamlessly coordinates console repositioning with `vr-spatial-console`.
   */
  if (!AFRAME.components['movable-spatial-console']) {
    AFRAME.registerComponent('movable-spatial-console', {
      init: function () {
        this.onReset = () => {
          window.tabsirahResetVRConsole?.();
        };
        window.addEventListener('tabsirah-reset-console-pos', this.onReset);
      },
      remove: function () {
        window.removeEventListener('tabsirah-reset-console-pos', this.onReset);
      }
    });
  }
}
