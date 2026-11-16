/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Gesture Scale Manager Component:
 * Listens for two-hand pinch-and-spread events from Meta Quest hand tracking
 * or pinch controllers to dynamically scale the #biome-container entity.
 */

if (typeof AFRAME !== 'undefined') {
  if (!AFRAME.components['gesture-scale-manager']) {
    AFRAME.registerComponent('gesture-scale-manager', {
      schema: {
        minScale: { type: 'number', default: 0.5 },
        maxScale: { type: 'number', default: 3.5 }
      },

      init: function () {
        this.containerEl = document.getElementById('biome-container');
        this.initialDist = null;
        this.initialScale = 1.0;
        this.leftHand = document.getElementById('left-hand');
        this.rightHand = document.getElementById('right-hand');
        this._posL = new THREE.Vector3();
        this._posR = new THREE.Vector3();

        this.onPinchStarted = (e) => {
          if (this.leftHand && this.rightHand) {
            this.leftHand.object3D.getWorldPosition(this._posL);
            this.rightHand.object3D.getWorldPosition(this._posR);
            this.initialDist = this._posL.distanceTo(this._posR);
            if (this.containerEl && this.containerEl.object3D) {
              this.initialScale = this.containerEl.object3D.scale.x;
            }
          }
        };

        this.onPinchEnded = () => {
          this.initialDist = null;
        };

        window.addEventListener('flex-pinch-start', this.onPinchStarted);
        window.addEventListener('flex-pinch-end', this.onPinchEnded);
      },

      tick: function () {
        if (!this.containerEl || !this.leftHand || !this.rightHand) return;
        if (this.initialDist === null) return;

        this.leftHand.object3D.getWorldPosition(this._posL);
        this.rightHand.object3D.getWorldPosition(this._posR);
        const currentDist = this._posL.distanceTo(this._posR);

        if (currentDist > 0.05 && this.initialDist > 0.05) {
          const ratio = currentDist / this.initialDist;
          const newScale = THREE.MathUtils.clamp(
            this.initialScale * ratio,
            this.data.minScale,
            this.data.maxScale
          );
          this.containerEl.object3D.scale.setScalar(newScale);
          window.tabsirahCurrentScale = newScale;
        }
      },

      remove: function () {
        window.removeEventListener('flex-pinch-start', this.onPinchStarted);
        window.removeEventListener('flex-pinch-end', this.onPinchEnded);
      }
    });
  }
}
