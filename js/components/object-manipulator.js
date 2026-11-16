/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * 3D Object Manipulation & Grab-and-Move Component:
 * Allows users to click & drag or grab/move interactive 3D specimens, crystals,
 * lanterns, and botanical elements naturally in 3D space with smooth inertia.
 */

if (typeof AFRAME !== 'undefined') {
  const _raycaster = new THREE.Raycaster();
  const _mouse = new THREE.Vector2();
  const _intersectPoint = new THREE.Vector3();
  const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  if (!AFRAME.components['object-manipulator']) {
    AFRAME.registerComponent('object-manipulator', {
      schema: {
        enabled: { type: 'boolean', default: true }
      },

      init: function () {
        this.isDragging = false;
        this.dragObject = null;
        this.offset = new THREE.Vector3();
        this.worldPos = new THREE.Vector3();

        this.onPointerDown = (e) => {
          if (!this.data.enabled) return;
          const sceneEl = this.el.sceneEl;
          if (!sceneEl || sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;

          const camera = sceneEl.camera;
          if (!camera) return;

          const w = window.innerWidth || 1280;
          const h = window.innerHeight || 720;
          _mouse.x = (e.clientX / w) * 2 - 1;
          _mouse.y = -(e.clientY / h) * 2 + 1;

          _raycaster.setFromCamera(_mouse, camera);
          const interactiveNodes = sceneEl.querySelectorAll('[data-draggable]');
          if (!interactiveNodes.length) return;
          const intersects = _raycaster.intersectObjects(
            Array.from(interactiveNodes).map((n) => n.object3D).filter(Boolean),
            true
          );

          if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit.parent && !hit.el?.hasAttribute?.('data-draggable') && hit.parent.type === 'Group') {
              hit = hit.parent;
            }
            this.dragObject = hit.el || hit;
            this.isDragging = true;

            // Setup drag plane facing camera
            _plane.setFromNormalAndCoplanarPoint(
              camera.getWorldDirection(new THREE.Vector3()).negate(),
              intersects[0].point
            );
          }
        };

        this.onPointerMove = (e) => {
          if (!this.isDragging || !this.dragObject) return;
          const sceneEl = this.el.sceneEl;
          const camera = sceneEl?.camera;
          if (!camera) return;

          const w = window.innerWidth || 1280;
          const h = window.innerHeight || 720;
          _mouse.x = (e.clientX / w) * 2 - 1;
          _mouse.y = -(e.clientY / h) * 2 + 1;

          _raycaster.setFromCamera(_mouse, camera);
          if (_raycaster.ray.intersectPlane(_plane, _intersectPoint)) {
            const obj3d = this.dragObject.object3D || this.dragObject;
            obj3d.position.copy(_intersectPoint);
          }
        };

        this.onPointerUp = () => {
          this.isDragging = false;
          this.dragObject = null;
        };

        const canvas = this.el.sceneEl?.canvas;
        if (canvas) {
          canvas.addEventListener('pointerdown', this.onPointerDown);
          window.addEventListener('pointermove', this.onPointerMove);
          window.addEventListener('pointerup', this.onPointerUp);
        }
      },

      remove: function () {
        const canvas = this.el.sceneEl?.canvas;
        if (canvas) {
          canvas.removeEventListener('pointerdown', this.onPointerDown);
          window.removeEventListener('pointermove', this.onPointerMove);
          window.removeEventListener('pointerup', this.onPointerUp);
        }
      }
    });
  }
}
