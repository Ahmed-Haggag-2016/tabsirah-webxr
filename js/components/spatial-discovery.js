/**
 * Tabsirah: Spatial Discovery Beacon & Hands-First Living Revelation Anchor
 * Reusable A-Frame component creating an interactive, multi-part luminous 3D node
 * in every biome. Responds seamlessly to:
 *  - Desktop mouse hover & click
 *  - Meta Quest VR/MR Laser Pointer
 *  - Meta Quest Bare-Hand Tracking fingertip touch & pinch (pinchstarted)
 */

import { natureAudio } from './nature-audio.js';
import { tactileTouchFX } from './tactile-touch-fx.js';

if (typeof AFRAME !== 'undefined' && !AFRAME.components['spatial-discovery-beacon']) {
  const _handPos = new THREE.Vector3();
  const _nodeWorld = new THREE.Vector3();
  const _touchNormal = new THREE.Vector3();

  AFRAME.registerComponent('spatial-discovery-beacon', {
    schema: {
      biomeId: { type: 'string', default: 'aurora' },
      accentColor: { type: 'color', default: '#34D399' },
      label: { type: 'string', default: 'Discover' }
    },

    init: function () {
      this.disposables = [];
      this.isHovered = false;
      this.pulseBoost = 0;
      this.lastTriggerTime = 0;
      this.specimenKey = `beacon-${this.data.biomeId}`;
      this.isRemembered = tactileTouchFX.isRemembered(this.specimenKey);

      const group = new THREE.Group();
      this.group = group;
      const accent = new THREE.Color(this.data.accentColor);

      // 1. Inner Faceted Crystal Core
      const coreGeo = new THREE.OctahedronGeometry(0.11, 0);
      this.coreMat = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: accent,
        emissiveIntensity: 0.95,
        roughness: 0.14,
        metalness: 0.32,
        transparent: true,
        opacity: 0.94
      });
      this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
      group.add(this.coreMesh);

      // 2. Outer Orbital Halo Ring (gentle visual affordance)
      const ringGeo = new THREE.TorusGeometry(0.19, 0.009, 10, 36);
      this.ringMat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending
      });
      this.ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
      this.ringMesh.rotation.x = Math.PI * 0.35;
      group.add(this.ringMesh);

      // 3. Secondary Equatorial Filament Ring
      const ring2Geo = new THREE.TorusGeometry(0.24, 0.005, 8, 36);
      this.ring2Mat = new THREE.MeshBasicMaterial({
        color: '#E0F2FE',
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending
      });
      this.ring2Mesh = new THREE.Mesh(ring2Geo, this.ring2Mat);
      this.ring2Mesh.rotation.y = Math.PI * 0.25;
      group.add(this.ring2Mesh);

      // 4. Persistent "Memory of Wonder" Bioluminescent Golden-Emerald Rim Aura (Effect 6)
      const afterglowGeo = new THREE.TorusGeometry(0.28, 0.008, 10, 42);
      this.afterglowMat = new THREE.MeshBasicMaterial({
        color: '#FBBF24',
        transparent: true,
        opacity: this.isRemembered ? 0.55 : 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.afterglowRing = new THREE.Mesh(afterglowGeo, this.afterglowMat);
      this.afterglowRing.rotation.x = -Math.PI * 0.28;
      group.add(this.afterglowRing);

      // 5. Expanding Discovery Ripple Wave (plays when triggered)
      const waveGeo = new THREE.RingGeometry(0.16, 0.21, 32);
      this.waveMat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.waveMesh = new THREE.Mesh(waveGeo, this.waveMat);
      group.add(this.waveMesh);

      // 6. Forgiving Invisible Hit Sphere for effortless pointing & pinching
      const hitGeo = new THREE.SphereGeometry(0.32, 12, 10);
      const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      group.add(hitMesh);

      this.disposables.push(
        coreGeo,
        this.coreMat,
        ringGeo,
        this.ringMat,
        ring2Geo,
        this.ring2Mat,
        afterglowGeo,
        this.afterglowMat,
        waveGeo,
        this.waveMat,
        hitGeo,
        hitMat
      );
      this.el.setObject3D('mesh', group);
      this.el.classList.add('interactive-node', 'vr-interactive');
      this.el.dataset.tactileHandled = 'true';
      this.el.dataset.specimenKey = this.specimenKey;

      tactileTouchFX.registerInteractiveSurface(group, {
        biomeId: this.data.biomeId,
        specimenKey: this.specimenKey,
        materials: [this.coreMat],
        proximityTarget: true,
        proximityRadius: 0.35,
        springTarget: group,
        springOptions: { liftAmount: 0.06, recoilAmount: 0.055, squashAmount: 0.14 }
      });

      this.el.sceneEl?.components?.raycaster?.refreshObjects?.();
      document.getElementById('left-controller')?.components?.raycaster?.refreshObjects?.();
      document.getElementById('right-controller')?.components?.raycaster?.refreshObjects?.();

      this.onHoverStart = () => {
        this.isHovered = true;
        document.body.style.cursor = 'pointer';
        this.ringMat.opacity = 1.0;
        this.coreMat.emissiveIntensity = 1.5;
      };
      this.onHoverEnd = () => {
        this.isHovered = false;
        document.body.style.cursor = '';
        this.ringMat.opacity = 0.78;
        this.coreMat.emissiveIntensity = 0.95;
      };
      this.onActivate = (evt) => {
        evt?.stopPropagation?.();
        this.triggerDiscovery('pointer', evt, null);
      };
      this.onPinch = (evt) => {
        evt?.stopPropagation?.();
        const hp = evt?.detail?.handPos
          ? _handPos.set(evt.detail.handPos.x, evt.detail.handPos.y, evt.detail.handPos.z)
          : null;
        this.triggerDiscovery('hand-pinch', evt, hp);
      };

      this.el.addEventListener('mouseenter', this.onHoverStart);
      this.el.addEventListener('mouseleave', this.onHoverEnd);
      this.el.addEventListener('click', this.onActivate);
      this.el.addEventListener('pinchstarted', this.onPinch);
    },

    triggerDiscovery: function (source = 'pointer', evt = null, handPos = null) {
      const now = performance.now();
      if (now - this.lastTriggerTime < 420) return;
      this.lastTriggerTime = now;
      this.pulseBoost = 1.0;
      this.isRemembered = true;

      natureAudio.unlock();
      this.el.object3D.getWorldPosition(_nodeWorld);

      const { worldPoint, worldNormal } = evt
        ? tactileTouchFX.extractIntersection(evt, this.el)
        : { worldPoint: null, worldNormal: null };

      const contactPt = worldPoint || _nodeWorld;
      let contactNormal = worldNormal;
      if (!contactNormal && handPos) {
        contactNormal = _touchNormal.subVectors(handPos, _nodeWorld).normalize();
      }

      tactileTouchFX.trigger({
        el: this.el,
        meshTarget: this.group,
        springTarget: this.group,
        worldPoint: contactPt,
        worldNormal: contactNormal,
        handPos,
        biomeId: this.data.biomeId,
        specimenKey: this.specimenKey,
        materials: [this.coreMat]
      });

      window.dispatchEvent(
        new CustomEvent('tabsirah-discovery-activated', {
          detail: {
            biomeId: this.data.biomeId,
            source
          }
        })
      );
    },

    tick: function (time, timeDelta) {
      if (!timeDelta) return;
      const dt = Math.min(timeDelta, 50) / 1000;
      const t = time * 0.001 * (window.tabsirahTimeScale || 1.0);

      // Gentle breathing hover & orbital rotation
      const targetScale = this.isHovered ? 1.24 : 1.0 + Math.sin(t * 2.2) * 0.06;
      const curScale = THREE.MathUtils.damp(this.coreMesh.scale.x, targetScale, 8.0, dt);
      this.coreMesh.scale.setScalar(curScale);
      this.coreMesh.rotation.y += dt * (this.isHovered ? 1.9 : 0.75);
      this.coreMesh.rotation.x = Math.sin(t * 1.1) * 0.25;

      this.ringMesh.rotation.z += dt * 0.85;
      this.ring2Mesh.rotation.x -= dt * 0.55;
      this.ring2Mesh.rotation.y += dt * 0.45;

      if (this.isRemembered) {
        this.afterglowRing.rotation.z -= dt * 0.65;
        this.afterglowRing.rotation.y += dt * 0.4;
        const glowMix = 0.5 + 0.5 * Math.sin(t * 2.1);
        this.afterglowMat.color.setHex(glowMix > 0.5 ? 0x34d399 : 0xfbbf24);
        this.afterglowMat.opacity = THREE.MathUtils.damp(this.afterglowMat.opacity, 0.42 + glowMix * 0.22, 5.0, dt);
      }

      // Subtle visual wave burst upon interaction
      if (this.pulseBoost > 0.01) {
        this.pulseBoost = Math.max(0, this.pulseBoost - dt * 1.35);
        const expand = 1.0 + (1.0 - this.pulseBoost) * 4.2;
        this.waveMesh.scale.setScalar(expand);
        this.waveMat.opacity = this.pulseBoost * 0.85;
      } else {
        this.waveMat.opacity = 0;
      }

      // Direct Meta Quest Bare-Hand Fingertip Touch Check (no controller needed!)
      if (this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode')) {
        this.el.object3D.getWorldPosition(_nodeWorld);
        const hands = [document.getElementById('left-hand'), document.getElementById('right-hand')];
        for (const handEl of hands) {
          if (!handEl?.object3D) continue;
          handEl.object3D.getWorldPosition(_handPos);
          if (_handPos.lengthSq() > 0.001 && _handPos.distanceTo(_nodeWorld) < 0.34) {
            this.triggerDiscovery('hand-touch', null, _handPos);
            break;
          }
        }
      }
    },

    remove: function () {
      document.body.style.cursor = '';
      tactileTouchFX.unregisterInteractiveSurface(this.group);
      this.el.removeEventListener('mouseenter', this.onHoverStart);
      this.el.removeEventListener('mouseleave', this.onHoverEnd);
      this.el.removeEventListener('click', this.onActivate);
      this.el.removeEventListener('pinchstarted', this.onPinch);
      this.el.removeObject3D('mesh');
      this.disposables?.forEach((d) => d?.dispose());
    }
  });
}
