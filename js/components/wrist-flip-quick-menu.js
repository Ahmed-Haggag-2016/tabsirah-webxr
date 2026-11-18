/**
 * Tabsirah: Horizon OS Wrist-Flip Quick Menu Component (`wrist-flip-quick-menu`)
 * Detects left-wrist orientation (palm-up / wrist-flip gesture) in WebXR to smoothly
 * spawn a floating radial 4-button spatial action ring (Wonder Brush, Cosmic Convergence,
 * Mic Breath, and Stillness Sanctuary), with desktop keyboard (`Q`) and click fallbacks.
 */

import { natureAudio } from './nature-audio.js';
import { micBreathMonitor } from './grand-prize-features.js';

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function makeWristButtonTexture(label, active = false, accent = '#38BDF8') {
  const width = 192;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);
  drawRoundedRect(ctx, 4, 4, width - 8, height - 8, 14);
  ctx.fillStyle = active ? 'rgba(56, 189, 248, 0.92)' : 'rgba(8, 17, 33, 0.92)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = active ? '#FFFFFF' : accent;
  ctx.stroke();

  ctx.fillStyle = active ? '#030712' : '#F8FAFC';
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, canvas, ctx };
}

function redrawWristButtonTexture(entry, label, active = false, accent = '#38BDF8') {
  const { tex, canvas, ctx } = entry;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  drawRoundedRect(ctx, 4, 4, width - 8, height - 8, 14);
  ctx.fillStyle = active ? 'rgba(56, 189, 248, 0.92)' : 'rgba(8, 17, 33, 0.92)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = active ? '#FFFFFF' : accent;
  ctx.stroke();

  ctx.fillStyle = active ? '#030712' : '#F8FAFC';
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2);
  tex.needsUpdate = true;
}

if (typeof AFRAME !== 'undefined' && !AFRAME.components['wrist-flip-quick-menu']) {
  const _handQuat = new THREE.Quaternion();
  const _localRay = new THREE.Vector3(0, 1, 0);

  AFRAME.registerComponent('wrist-flip-quick-menu', {
    schema: {
      enabled: { type: 'boolean', default: true }
    },

    init: function () {
      this.disposables = [];
      this.isOpen = false;
      this.menuScale = 0;
      this.elapsed = 0;
      this.lastToggleTime = 0;
      this.autoOpenedByWrist = false;

      // Root A-Frame positioning floating slightly above left wrist / forearm
      this.containerEl = document.createElement('a-entity');
      this.containerEl.setAttribute('position', '0.08 0.14 -0.04');
      this.containerEl.setAttribute('scale', '0 0 0');
      this.containerEl.setAttribute('visible', 'false');
      this.el.appendChild(this.containerEl);

      // Background glowing ring entity
      const ringEl = document.createElement('a-entity');
      const ringGeo = new THREE.RingGeometry(0.18, 0.22, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: '#38BDF8',
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringEl.setObject3D('mesh', ringMesh);
      this.containerEl.appendChild(ringEl);
      this.disposables.push(ringGeo, ringMat);

      this.buttons = {};
      const specs = [
        { id: 'wonder-brush', label: 'Brush', angle: 0, accent: '#F472B6' },
        { id: 'wide-view', label: 'Wide View', angle: Math.PI * 0.4, accent: '#38BDF8' },
        { id: 'convergence', label: 'Converge', angle: Math.PI * 0.8, accent: '#FBBF24' },
        { id: 'mic-breath', label: 'Mic Breath', angle: Math.PI * 1.2, accent: '#34D399' },
        { id: 'stillness', label: 'Stillness', angle: Math.PI * 1.6, accent: '#A78BFA' }
      ];

      specs.forEach((s) => {
        const btnEl = document.createElement('a-entity');
        const dist = 0.28;
        const bx = Math.cos(s.angle) * dist;
        const bz = Math.sin(s.angle) * dist;
        btnEl.setAttribute('position', `${bx.toFixed(3)} 0.02 ${bz.toFixed(3)}`);
        btnEl.classList.add('vr-interactive');
        btnEl.dataset.wristAction = s.id;

        const geo = new THREE.PlaneGeometry(0.18, 0.06);
        const texEntry = makeWristButtonTexture(s.label, false, s.accent);
        const mat = new THREE.MeshBasicMaterial({
          map: texEntry.tex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(geo, mat);
        btnEl.setObject3D('mesh', mesh);
        this.containerEl.appendChild(btnEl);
        this.disposables.push(geo, mat, texEntry.tex);

        btnEl.addEventListener('click', (e) => {
          e?.stopPropagation?.();
          this.triggerAction(s.id);
        });

        this.buttons[s.id] = { id: s.id, label: s.label, el: btnEl, texEntry, accent: s.accent };
      });

      this.sceneEl = this.el.sceneEl;
      this.sceneEl?.components?.raycaster?.refreshObjects?.();

      // Desktop keyboard toggle (`Q` key) regardless of canvas/button focus (ignoring text inputs)
      this.onKeyDown = (e) => {
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (e.code === 'KeyQ' && !e.repeat) {
          this.autoOpenedByWrist = false;
          this.setOpen(!this.isOpen);
        }
      };

      this.onBrushState = (e) => {
        const b = this.buttons['wonder-brush'];
        if (b) redrawWristButtonTexture(b.texEntry, b.label, Boolean(e.detail?.active), b.accent);
      };
      this.onConvergenceState = (e) => {
        const b = this.buttons['convergence'];
        if (b) redrawWristButtonTexture(b.texEntry, b.label, Boolean(e.detail?.convergenceActive ?? e.detail?.active), b.accent);
      };
      this.onMicBreathState = (e) => {
        const b = this.buttons['mic-breath'];
        if (b) redrawWristButtonTexture(b.texEntry, b.label, Boolean(e.detail?.active), b.accent);
      };
      this.onStillnessState = (e) => {
        const b = this.buttons['stillness'];
        if (b) redrawWristButtonTexture(b.texEntry, b.label, Boolean(e.detail?.active), b.accent);
      };

      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('tabsirah-wonder-brush-state', this.onBrushState);
      window.addEventListener('tabsirah-relics-updated', this.onConvergenceState);
      window.addEventListener('tabsirah-mic-breath-state', this.onMicBreathState);
      window.addEventListener('tabsirah-stillness-state', this.onStillnessState);
    },

    setOpen: function (open) {
      const now = performance.now();
      if (now - this.lastToggleTime < 280) return;
      this.lastToggleTime = now;
      this.isOpen = Boolean(open);
      this.containerEl.setAttribute('visible', 'true');
      const stillnessBtn = this.buttons['stillness'];
      if (stillnessBtn && window.tabsirahBiomeManager) {
        redrawWristButtonTexture(
          stillnessBtn.texEntry,
          stillnessBtn.label,
          Boolean(window.tabsirahBiomeManager.isStillness),
          stillnessBtn.accent
        );
      }
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.28, duration: 25 } }));
      window.dispatchEvent(
        new CustomEvent('tabsirah-wonder-progress', {
          detail: { message: this.isOpen ? 'Horizon OS Wrist Menu opened' : 'Wrist Menu closed' }
        })
      );
    },

    triggerAction: function (id) {
      natureAudio.unlock();
      window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.55, duration: 42 } }));

      if (id === 'wonder-brush') {
        window.dispatchEvent(new CustomEvent('tabsirah-wonder-brush-toggle'));
      } else if (id === 'wide-view') {
        window.tabsirahBiomeManager?.toggleWideView?.();
      } else if (id === 'convergence') {
        window.dispatchEvent(new CustomEvent('tabsirah-convergence-toggle'));
      } else if (id === 'mic-breath') {
        micBreathMonitor.toggle().catch(() => {});
      } else if (id === 'stillness') {
        const mgr = window.tabsirahBiomeManager;
        if (mgr) mgr.setStillnessMode(!mgr.isStillness);
      }
      this.autoOpenedByWrist = false;
      this.setOpen(false);
    },

    tick: function (time, timeDelta) {
      if (!timeDelta || !this.data.enabled) return;
      const dt = Math.min(timeDelta, 50) / 1000;
      this.elapsed += dt;

      const inXR = Boolean(this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode'));

      // Automatic wrist-flip orientation detection in WebXR with hysteresis
      if (inXR && this.el.object3D) {
        this.el.object3D.getWorldQuaternion(_handQuat);
        _localRay.set(0, 1, 0).applyQuaternion(_handQuat);
        if (_localRay.y > 0.65 && !this.isOpen && this.elapsed > 2.0) {
          this.autoOpenedByWrist = true;
          this.setOpen(true);
        } else if (_localRay.y < 0.22 && this.isOpen && this.autoOpenedByWrist) {
          this.autoOpenedByWrist = false;
          this.setOpen(false);
        }
      }

      const targetScale = this.isOpen ? 1.0 : 0.0;
      this.menuScale = THREE.MathUtils.damp(this.menuScale, targetScale, 12.0, dt);
      this.containerEl.setAttribute('scale', `${this.menuScale} ${this.menuScale} ${this.menuScale}`);
      if (this.menuScale < 0.01 && !this.isOpen) {
        this.containerEl.setAttribute('visible', 'false');
      }
    },

    remove: function () {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('tabsirah-wonder-brush-state', this.onBrushState);
      window.removeEventListener('tabsirah-relics-updated', this.onConvergenceState);
      window.removeEventListener('tabsirah-mic-breath-state', this.onMicBreathState);
      window.removeEventListener('tabsirah-stillness-state', this.onStillnessState);
      if (this.containerEl?.parentNode) this.el.removeChild(this.containerEl);
      this.disposables.forEach((d) => d?.dispose());
    }
  });
}
