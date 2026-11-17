/**
 * Tabsirah: WebXR Beacon Haptics Component (`webxr-beacon-haptics`)
 * Triggers handedness-targeted WebXR controller haptic pulses (left-hand / right-hand)
 * whenever the user hovers, approaches, pinches, or activates `.interactive-node` beacons.
 */

const _handWorldPos = new THREE.Vector3();
const _beaconWorldPos = new THREE.Vector3();

function resolveHandSide(handProp, elId) {
  if (handProp === 'left' || handProp === 'right') return handProp;
  if (typeof elId === 'string') {
    if (elId.includes('left')) return 'left';
    if (elId.includes('right')) return 'right';
  }
  return 'both';
}

function pulseGamepadActuator(gp, intensity, duration) {
  if (!gp) return false;
  if (gp.hapticActuators && gp.hapticActuators[0]?.pulse) {
    gp.hapticActuators[0].pulse(intensity, duration).catch(() => {});
    return true;
  }
  if (gp.vibrationActuator?.playEffect) {
    gp.vibrationActuator
      .playEffect('dual-rumble', {
        startDelay: 0,
        duration,
        weakMagnitude: intensity * 0.68,
        strongMagnitude: intensity
      })
      .catch(() => {});
    return true;
  }
  return false;
}

export function triggerWebXRHapticPulse(sceneEl, hand = 'both', intensity = 0.5, duration = 40) {
  if (!sceneEl || (!sceneEl.is('vr-mode') && !sceneEl.is('ar-mode'))) return false;
  const clampedIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
  const clampedDuration = Math.max(10, Math.min(250, Number(duration) || 40));
  if (clampedIntensity <= 0.001) return false;

  let pulsed = false;
  const session = sceneEl.renderer?.xr?.getSession?.();
  if (session?.inputSources) {
    for (const source of session.inputSources) {
      if (hand === 'left' || hand === 'right') {
        if (source.handedness && source.handedness !== hand) continue;
      }
      if (pulseGamepadActuator(source.gamepad, clampedIntensity, clampedDuration)) {
        pulsed = true;
      }
    }
  }

  if (!pulsed && typeof navigator.getGamepads === 'function') {
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (!gp) continue;
      if ((hand === 'left' || hand === 'right') && gp.hand && gp.hand !== hand) continue;
      if (pulseGamepadActuator(gp, clampedIntensity, clampedDuration)) {
        pulsed = true;
      }
    }
  }

  return pulsed;
}

if (typeof AFRAME !== 'undefined' && !AFRAME.components['webxr-beacon-haptics']) {
  AFRAME.registerComponent('webxr-beacon-haptics', {
    schema: {
      hand: { type: 'string', default: 'auto' }, // 'auto' | 'left' | 'right'
      hoverIntensity: { type: 'number', default: 0.22 },
      hoverDuration: { type: 'number', default: 16 },
      proximityIntensity: { type: 'number', default: 0.16 },
      proximityDuration: { type: 'number', default: 18 },
      interactIntensity: { type: 'number', default: 0.72 },
      interactDuration: { type: 'number', default: 46 },
      proximityRadius: { type: 'number', default: 0.36 }
    },

    init: function () {
      this.sceneEl = this.el.sceneEl || document.querySelector('a-scene');
      this.handSide = resolveHandSide(this.data.hand, this.el.id);
      this.hoveredBeaconEl = null;
      this.proximityBeaconEl = null;
      this.cachedBeacons = [];
      this.proxCheckAcc = 0;
      this.refreshAcc = 0;
      this.lastHoverTime = 0;
      this.lastInteractTime = 0;
      this.lastProxTime = 0;
      this.pendingTimers = new Set();

      this.refreshBeacons = () => {
        if (!this.sceneEl) return;
        this.cachedBeacons = Array.from(this.sceneEl.querySelectorAll('.interactive-node'));
      };

      this.findInteractiveNode = (el) => {
        let cur = el;
        while (cur && cur !== this.sceneEl) {
          if (cur.classList?.contains('interactive-node')) return cur;
          cur = cur.parentElement;
        }
        return null;
      };

      this.onRaycasterIntersection = (evt) => {
        const els = evt.detail?.els;
        if (!els?.length) return;
        let beacon = null;
        for (let i = 0; i < els.length; i++) {
          beacon = this.findInteractiveNode(els[i]);
          if (beacon) break;
        }
        if (!beacon) {
          this.hoveredBeaconEl = null;
          return;
        }
        if (beacon !== this.hoveredBeaconEl) {
          this.hoveredBeaconEl = beacon;
          const now = performance.now();
          if (now - this.lastHoverTime > 90) {
            this.lastHoverTime = now;
            this.pulse(this.data.hoverIntensity, this.data.hoverDuration);
          }
        }
      };

      this.onRaycasterCleared = () => {
        const intersected = this.el.components?.raycaster?.intersectedEls;
        if (!intersected?.length) {
          this.hoveredBeaconEl = null;
          return;
        }
        let stillHovering = false;
        for (let i = 0; i < intersected.length; i++) {
          if (this.findInteractiveNode(intersected[i])) {
            stillHovering = true;
            break;
          }
        }
        if (!stillHovering) this.hoveredBeaconEl = null;
      };

      this.onControllerTrigger = () => {
        if (this.hoveredBeaconEl) {
          this.triggerBeaconSignature('trigger');
          return;
        }
        const intersected = this.el.components?.raycaster?.intersectedEls;
        if (intersected?.length) {
          for (let i = 0; i < intersected.length; i++) {
            if (this.findInteractiveNode(intersected[i])) {
              this.triggerBeaconSignature('trigger');
              return;
            }
          }
        }
      };

      this.onSceneBeaconClick = (evt) => {
        const beacon = this.findInteractiveNode(evt.target);
        if (!beacon) return;
        const cursorEl = evt.detail?.cursorEl;
        if (cursorEl && cursorEl !== this.el) return;
        if (!cursorEl && this.hoveredBeaconEl !== beacon) return;
        this.triggerBeaconSignature('click');
      };

      this.onSceneBeaconPinch = (evt) => {
        const beacon = this.findInteractiveNode(evt.target);
        if (!beacon) return;
        const handId = evt.detail?.hand || '';
        const eventSide = handId.includes('left') ? 'left' : (handId.includes('right') ? 'right' : '');
        if (eventSide && eventSide !== this.handSide) return;
        if (!eventSide && this.el.id !== 'right-hand') return;
        this.triggerBeaconSignature('pinch');
      };

      this.onDiscoveryActivated = (evt) => {
        const detail = evt.detail || {};
        const handId = detail.handId || '';
        if (handId) {
          const targetSide = handId.includes('left') ? 'left' : (handId.includes('right') ? 'right' : '');
          if (targetSide && targetSide !== this.handSide) return;
          this.triggerBeaconSignature('discovery');
        } else if (detail.source === 'hand-touch' && this.proximityBeaconEl) {
          this.triggerBeaconSignature('discovery');
        }
      };

      this.el.addEventListener('raycaster-intersection', this.onRaycasterIntersection);
      this.el.addEventListener('raycaster-intersection-cleared', this.onRaycasterCleared);
      this.el.addEventListener('triggerdown', this.onControllerTrigger);
      this.el.addEventListener('selectstart', this.onControllerTrigger);

      if (this.sceneEl) {
        this.sceneEl.addEventListener('click', this.onSceneBeaconClick);
        this.sceneEl.addEventListener('pinchstarted', this.onSceneBeaconPinch);
        this.sceneEl.addEventListener('enter-vr', this.refreshBeacons);
      }
      window.addEventListener('tabsirah-discovery-activated', this.onDiscoveryActivated);
      window.addEventListener('tabsirah-biome-changed', this.refreshBeacons);
      this.refreshBeacons();
    },

    update: function () {
      this.handSide = resolveHandSide(this.data.hand, this.el.id);
    },

    pulse: function (intensity, duration) {
      return triggerWebXRHapticPulse(this.sceneEl, this.handSide, intensity, duration);
    },

    scheduleFollowUpPulse: function (delayMs, intensity, duration) {
      const id = window.setTimeout(() => {
        this.pendingTimers.delete(id);
        this.pulse(intensity, duration);
      }, delayMs);
      this.pendingTimers.add(id);
    },

    triggerBeaconSignature: function (kind = 'interact') {
      const now = performance.now();
      if (now - this.lastInteractTime < 180) return;
      this.lastInteractTime = now;

      if (kind === 'discovery') {
        // Ascending celebratory confirmation pulse
        this.pulse(0.58, 36);
        this.scheduleFollowUpPulse(65, 0.86, 58);
        return;
      }

      const biome = window.tabsirahActiveBiome || 'aurora';
      if (biome === 'aurora') {
        this.pulse(this.data.interactIntensity, 34);
        this.scheduleFollowUpPulse(68, this.data.interactIntensity * 0.56, 26);
      } else if (biome === 'ocean') {
        this.pulse(this.data.interactIntensity * 0.78, 58);
        this.scheduleFollowUpPulse(84, this.data.interactIntensity * 0.42, 42);
      } else if (biome === 'desert') {
        this.pulse(this.data.interactIntensity * 0.85, 42);
        this.scheduleFollowUpPulse(60, this.data.interactIntensity * 0.48, 28);
      } else {
        this.pulse(this.data.interactIntensity, this.data.interactDuration);
        this.scheduleFollowUpPulse(72, this.data.interactIntensity * 0.52, 30);
      }
    },

    tick: function (time, timeDelta) {
      if (!timeDelta || !this.sceneEl) return;
      if (!this.sceneEl.is('vr-mode') && !this.sceneEl.is('ar-mode')) return;

      const dt = Math.min(timeDelta, 50) / 1000;
      this.refreshAcc += dt;
      if (this.refreshAcc >= 1.2) {
        this.refreshAcc = 0;
        this.refreshBeacons();
      }

      this.proxCheckAcc += dt;
      if (this.proxCheckAcc < 0.08) return;
      this.proxCheckAcc = 0;

      if (!this.el.object3D || !this.cachedBeacons.length) return;
      this.el.object3D.getWorldPosition(_handWorldPos);
      if (_handWorldPos.lengthSq() < 0.0005) return;

      const proxRadius = this.data.proximityRadius;
      const exitRadius = proxRadius + 0.09;
      let nearestBeacon = null;
      let nearestDist = exitRadius;

      for (let i = 0; i < this.cachedBeacons.length; i++) {
        const beacon = this.cachedBeacons[i];
        if (!beacon?.isConnected || !beacon.object3D) continue;
        beacon.object3D.getWorldPosition(_beaconWorldPos);
        const dist = _handWorldPos.distanceTo(_beaconWorldPos);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestBeacon = beacon;
        }
      }

      if (nearestBeacon && nearestDist < proxRadius) {
        if (this.proximityBeaconEl !== nearestBeacon) {
          this.proximityBeaconEl = nearestBeacon;
          const now = performance.now();
          if (now - this.lastProxTime > 220) {
            this.lastProxTime = now;
            this.pulse(this.data.proximityIntensity, this.data.proximityDuration);
          }
        }
      } else if (!nearestBeacon) {
        this.proximityBeaconEl = null;
      }
    },

    remove: function () {
      this.pendingTimers.forEach((id) => window.clearTimeout(id));
      this.pendingTimers.clear();
      this.el.removeEventListener('raycaster-intersection', this.onRaycasterIntersection);
      this.el.removeEventListener('raycaster-intersection-cleared', this.onRaycasterCleared);
      this.el.removeEventListener('triggerdown', this.onControllerTrigger);
      this.el.removeEventListener('selectstart', this.onControllerTrigger);
      if (this.sceneEl) {
        this.sceneEl.removeEventListener('click', this.onSceneBeaconClick);
        this.sceneEl.removeEventListener('pinchstarted', this.onSceneBeaconPinch);
        this.sceneEl.removeEventListener('enter-vr', this.refreshBeacons);
      }
      window.removeEventListener('tabsirah-discovery-activated', this.onDiscoveryActivated);
      window.removeEventListener('tabsirah-biome-changed', this.refreshBeacons);
    }
  });
}
