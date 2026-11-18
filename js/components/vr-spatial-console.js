/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * 3D Spatial VR/MR Control Console & Hand/Controller Gestures:
 *  - Renders an angled, waist-height translucent spatial console inside WebXR (`vr-mode` / `ar-mode`)
 *    with one-tap Day/Night toggle, interactive draggable 3D Solar/Sky slider, biome switcher,
 *    Aerial/Eye/Close-Up vantage presets, biome action, and audio/narration controls.
 *  - Supports VR laser controllers, thumbstick Day/Night & Zoom scrubbing, A/X Day-Night button,
 *    B/Y Biome switch, direct fingertip touch/pinch on 3D buttons, and two-hand pinch zoom.
 */

import { natureAudio } from './nature-audio.js';
import { EARTH_BIOMES_DATA } from '../config/earth-biomes-data.js';
import { micBreathMonitor } from './grand-prize-features.js';

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  let curY = y;
  let count = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      curY += lineHeight;
      count++;
      line = words[i];
      if (count >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
  return curY + lineHeight;
}

function makeReflectCardTexture(biomeId) {
  const data = EARTH_BIOMES_DATA[biomeId] || EARTH_BIOMES_DATA.aurora;
  const width = 1024;
  const height = 560;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  drawRoundedRect(ctx, 8, 8, width - 16, height - 16, 26);
  ctx.fillStyle = 'rgba(6, 13, 26, 0.94)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = data.accentColor || '#38BDF8';
  ctx.stroke();

  // Header & Coordinates
  ctx.fillStyle = '#38BDF8';
  ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${data.shortTitle || data.title}  ·  ${data.surahRef || ''}`, 42, 34);

  // Authentic Arabic Verse (RTL rendered right-aligned)
  ctx.save();
  ctx.direction = 'rtl';
  ctx.fillStyle = '#FEF3C7';
  ctx.font = '700 34px "Amiri", serif';
  ctx.textAlign = 'right';
  ctx.fillText(data.arabicVerse || '', width - 42, 82);
  ctx.restore();

  // English Translation
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '500 23px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  let y = drawWrappedText(ctx, `"${data.quranTranslation || ''}"`, 42, 152, width - 84, 30, 3);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(42, y + 10);
  ctx.lineTo(width - 42, y + 10);
  ctx.stroke();

  // Scientific Context
  ctx.fillStyle = '#34D399';
  ctx.font = '700 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('SCIENTIFIC CONTEXT', 42, y + 26);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '400 21px "Plus Jakarta Sans", system-ui, sans-serif';
  drawWrappedText(ctx, data.scientificContext || '', 42, y + 58, width - 84, 28, 5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, canvas, ctx };
}

function redrawReflectCard(entry, biomeId) {
  const fresh = makeReflectCardTexture(biomeId);
  entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
  entry.ctx.drawImage(fresh.canvas, 0, 0);
  entry.tex.needsUpdate = true;
  fresh.tex.dispose();
}

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

function makeButtonTexture(label, options = {}) {
  const {
    width = 256,
    height = 84,
    active = false,
    accent = '#38BDF8',
    bg = 'rgba(8, 17, 33, 0.92)',
    activeBg = 'rgba(56, 189, 248, 0.92)',
    fontSize = 28,
    sublabel = ''
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);
  drawRoundedRect(ctx, 4, 4, width - 8, height - 8, 16);
  ctx.fillStyle = active ? activeBg : bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = active ? '#E0F2FE' : accent;
  ctx.stroke();

  ctx.fillStyle = active ? '#030712' : '#F8FAFC';
  ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = sublabel ? 'alphabetic' : 'middle';
  ctx.fillText(label, width / 2, sublabel ? height * 0.52 : height / 2);

  if (sublabel) {
    ctx.fillStyle = active ? '#0F172A' : '#FBBF24';
    ctx.font = `600 ${Math.round(fontSize * 0.65)}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(sublabel, width / 2, height * 0.58);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, canvas, ctx };
}

function redrawButtonTexture(entry, label, options = {}) {
  const { canvas, ctx, tex } = entry;
  const width = canvas.width;
  const height = canvas.height;
  const {
    active = false,
    accent = '#38BDF8',
    bg = 'rgba(8, 17, 33, 0.92)',
    activeBg = 'rgba(56, 189, 248, 0.92)',
    fontSize = 28,
    sublabel = ''
  } = options;

  ctx.clearRect(0, 0, width, height);
  drawRoundedRect(ctx, 4, 4, width - 8, height - 8, 16);
  ctx.fillStyle = active ? activeBg : bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = active ? '#E0F2FE' : accent;
  ctx.stroke();

  ctx.fillStyle = active ? '#030712' : '#F8FAFC';
  ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = sublabel ? 'alphabetic' : 'middle';
  ctx.fillText(label, width / 2, sublabel ? height * 0.52 : height / 2);

  if (sublabel) {
    ctx.fillStyle = active ? '#0F172A' : '#FBBF24';
    ctx.font = `600 ${Math.round(fontSize * 0.65)}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(sublabel, width / 2, height * 0.58);
  }

  tex.needsUpdate = true;
}

if (typeof AFRAME !== 'undefined') {
  const _wPos = new THREE.Vector3();
  const _lPos = new THREE.Vector3();

  /**
   * 1. 3D Spatial VR/MR Console (Mounted comfortably inside #rig, visible only in VR/MR)
   */
  if (!AFRAME.components['vr-spatial-console']) {
    AFRAME.registerComponent('vr-spatial-console', {
      init: function () {
        this.disposables = [];
        this.buttons = [];
        this.isMinimized = false;
        this.reflectVisible = false;
        this.currentBiomeId = 'aurora';
        this.currentSolar = -0.22;
        this.lastTouchTime = 0;

        // Spatial Console Repositioning & Anchoring State
        this.defaultPos = new THREE.Vector3(0, 0.92, -0.92);
        this.defaultRot = new THREE.Euler(THREE.MathUtils.degToRad(-30), 0, 0);
        this.isConsoleDragging = false;
        this.dragController = null;
        this.dragHand = null;
        this.isMouseDraggingConsole = false;
        this.mouseStartX = 0;
        this.mouseStartY = 0;
        this.consoleStartPos = new THREE.Vector3();
        this.isResettingPos = false;
        this.resetStartTime = 0;
        this.resetStartPos = new THREE.Vector3();
        this.resetStartRot = new THREE.Euler();

        this.root = document.createElement('a-entity');
        this.root.setAttribute('id', 'vr-spatial-console-root');
        this.root.setAttribute('position', '0 0.92 -0.92');
        this.root.setAttribute('rotation', '-30 0 0');
        this.el.appendChild(this.root);

        // Floating Spatial Verse & Science Reflection Card inside XR (toggled by Reflect button)
        this.reflectRoot = document.createElement('a-entity');
        this.reflectRoot.setAttribute('position', '0 1.48 -1.32');
        this.reflectRoot.setAttribute('visible', false);
        const refGeo = new THREE.PlaneGeometry(1.12, 0.61);
        this.reflectTexEntry = makeReflectCardTexture('aurora');
        const refMat = new THREE.MeshBasicMaterial({
          map: this.reflectTexEntry.tex,
          transparent: true,
          side: THREE.DoubleSide
        });
        this.reflectRoot.setObject3D('mesh', new THREE.Mesh(refGeo, refMat));
        this.el.appendChild(this.reflectRoot);
        this.disposables.push(refGeo, refMat, this.reflectTexEntry.tex);

        // Main panel container (toggled by Minimize button)
        this.panel = document.createElement('a-entity');
        this.root.appendChild(this.panel);

        // Backing board (extended to 0.59m height to comfortably host the 3D Grab & Reposition Bar)
        const boardGeo = new THREE.PlaneGeometry(0.98, 0.59);
        const boardMat = new THREE.MeshBasicMaterial({
          color: '#060D1A',
          transparent: true,
          opacity: 0.88,
          side: THREE.DoubleSide
        });
        const boardMesh = new THREE.Mesh(boardGeo, boardMat);
        boardMesh.position.set(0, 0.045, -0.008);
        this.panel.object3D.add(boardMesh);
        this.disposables.push(boardGeo, boardMat);

        // Subtle top border bar
        const rimGeo = new THREE.PlaneGeometry(0.98, 0.006);
        const rimMat = new THREE.MeshBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.85 });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.position.set(0, 0.34, -0.005);
        this.panel.object3D.add(rimMesh);
        this.disposables.push(rimGeo, rimMat);

        // Subtle divider between Grab Bar and Biome Switcher Row
        const dividerGeo = new THREE.PlaneGeometry(0.98, 0.002);
        const dividerMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.16 });
        const dividerMesh = new THREE.Mesh(dividerGeo, dividerMat);
        dividerMesh.position.set(0, 0.235, -0.005);
        this.panel.object3D.add(dividerMesh);
        this.disposables.push(dividerGeo, dividerMat);

        // Helper to create an interactive 3D button
        const createBtn = (id, label, x, y, w, h, opts = {}) => {
          const btnEl = document.createElement('a-entity');
          btnEl.setAttribute('position', `${x} ${y} 0.004`);
          btnEl.classList.add('vr-interactive');
          btnEl.dataset.vrAction = id;

          const geo = new THREE.PlaneGeometry(w, h);
          const texEntry = makeButtonTexture(label, opts);
          const mat = new THREE.MeshBasicMaterial({
            map: texEntry.tex,
            transparent: true,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geo, mat);
          btnEl.setObject3D('mesh', mesh);
          (opts.parent || this.panel).appendChild(btnEl);
          this.disposables.push(geo, mat, texEntry.tex);

          const record = { id, el: btnEl, texEntry, opts, w, h, lastLabel: label };
          this.buttons.push(record);

          btnEl.addEventListener('click', () => this.handleButtonAction(id));
          return record;
        };

        // ROW 0 (Topmost): Dedicated 3D Grab Handle Bar + Reset Position Button
        this.btnDragHandle = createBtn('drag-console', '⠿  DRAG TO REPOSITION CONSOLE  ⠿', -0.11, 0.285, 0.68, 0.054, {
          accent: '#38BDF8',
          bg: 'rgba(14, 30, 56, 0.92)',
          activeBg: 'rgba(56, 189, 248, 0.95)',
          fontSize: 22
        });
        this.btnDragHandle.el.setAttribute('id', 'vr-console-drag-handle');

        this.btnResetPos = createBtn('reset-console-pos', '↺ Reset', 0.35, 0.285, 0.20, 0.054, {
          accent: '#94A3B8',
          bg: 'rgba(15, 23, 42, 0.90)',
          activeBg: 'rgba(148, 163, 184, 0.92)',
          fontSize: 22
        });

        // ROW 1: Biome Switcher + Title Banner + Minimize
        this.btnPrev = createBtn('prev-biome', '‹ Prev', -0.37, 0.178, 0.18, 0.066, { fontSize: 28 });
        this.titleBanner = createBtn('noop', 'Polar Aurora', -0.04, 0.178, 0.44, 0.066, {
          accent: 'rgba(255,255,255,0.2)',
          bg: 'rgba(15, 23, 42, 0.85)',
          fontSize: 25,
          sublabel: 'Starlight'
        });
        this.btnNext = createBtn('next-biome', 'Next ›', 0.28, 0.178, 0.17, 0.066, { fontSize: 28 });
        this.btnHide = createBtn('toggle-minimize', 'Hide', 0.425, 0.178, 0.1, 0.066, {
          accent: '#94A3B8',
          fontSize: 24
        });

        // ROW 2 (Center Highlight — Day/Night + Solar Slider)
        this.btnDayNight = createBtn('toggle-day-night', 'Switch to Day', -0.32, 0.075, 0.28, 0.082, {
          accent: '#FBBF24',
          bg: 'rgba(120, 53, 15, 0.42)',
          activeBg: 'rgba(251, 191, 36, 0.92)',
          fontSize: 26
        });

        // Interactive 3D Solar/Sky Track Bar
        this.solarTrackWidth = 0.54;
        this.solarTrackCenterX = 0.15;
        this.solarTrackEl = document.createElement('a-entity');
        this.solarTrackEl.setAttribute('position', `${this.solarTrackCenterX} 0.075 0.005`);
        this.solarTrackEl.classList.add('vr-interactive');
        this.solarTrackEl.dataset.vrSlider = 'solar';

        // Invisible larger hit target plane so pointing/touching the slider is super forgiving in VR/MR
        const hitGeo = new THREE.PlaneGeometry(this.solarTrackWidth + 0.06, 0.095);
        const hitMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.01 });
        this.solarTrackEl.setObject3D('mesh', new THREE.Mesh(hitGeo, hitMat));

        // Visible track groove
        const trackGeo = new THREE.PlaneGeometry(this.solarTrackWidth, 0.024);
        const trackMat = new THREE.MeshBasicMaterial({ color: '#1E293B' });
        const trackMesh = new THREE.Mesh(trackGeo, trackMat);
        trackMesh.position.z = 0.002;
        this.solarTrackEl.object3D.add(trackMesh);

        // Glowing progress fill
        const fillGeo = new THREE.PlaneGeometry(1, 0.024);
        const fillMat = new THREE.MeshBasicMaterial({ color: '#FBBF24' });
        this.solarFillMesh = new THREE.Mesh(fillGeo, fillMat);
        this.solarFillMesh.position.z = 0.004;
        this.solarTrackEl.object3D.add(this.solarFillMesh);

        // Tactile glowing sun knob sphere
        const knobGeo = new THREE.SphereGeometry(0.026, 14, 14);
        const knobMat = new THREE.MeshBasicMaterial({ color: '#FDE047' });
        this.solarKnobMesh = new THREE.Mesh(knobGeo, knobMat);
        this.solarKnobMesh.position.z = 0.01;
        this.solarTrackEl.object3D.add(this.solarKnobMesh);

        this.panel.appendChild(this.solarTrackEl);
        this.disposables.push(hitGeo, hitMat, trackGeo, trackMat, fillGeo, fillMat, knobGeo, knobMat);

        this.solarTrackEl.addEventListener('click', (evt) => {
          const intersection = evt.detail?.intersection;
          if (!intersection) return;
          _lPos.copy(intersection.point);
          this.solarTrackEl.object3D.worldToLocal(_lPos);
          const norm = THREE.MathUtils.clamp((_lPos.x / this.solarTrackWidth) + 0.5, 0, 1);
          const targetSolar = -0.25 + norm * 1.1; // -0.25 .. +0.85
          window.tabsirahBiomeManager?.setSolarElevation(targetSolar);
        });

        // ROW 3: Vantage Presets + Reflect + MR + Action + Narrate + Audio
        this.btnAerial = createBtn('zoom-aerial', 'Aerial', -0.43, -0.055, 0.11, 0.070, { fontSize: 22 });
        this.btnVista = createBtn('zoom-vista', 'Vista', -0.31, -0.055, 0.10, 0.070, { fontSize: 21 });
        this.btnEye = createBtn('zoom-eye', 'Eye', -0.19, -0.055, 0.11, 0.070, { active: true, fontSize: 21 });
        this.btnReflect = createBtn('toggle-reflect', 'Reflect', -0.055, -0.055, 0.135, 0.070, { accent: '#FBBF24', fontSize: 22 });
        this.btnPassthrough = createBtn('toggle-passthrough', 'MR', 0.065, -0.055, 0.085, 0.070, { accent: '#38BDF8', fontSize: 22 });
        this.btnAction = createBtn('biome-action', 'Action', 0.195, -0.055, 0.15, 0.070, { accent: '#34D399', fontSize: 21 });
        this.btnNarrate = createBtn('narrate', 'Voice', 0.33, -0.055, 0.10, 0.070, { accent: '#34D399', fontSize: 21 });
        this.btnAudio = createBtn('audio', 'Audio', 0.435, -0.055, 0.085, 0.070, { active: true, fontSize: 19 });

        // ROW 4 (Bottom): Spatial Innovation Controls — Wonder Brush, Cosmic Convergence, Mic Breath & MR Re-Anchor
        this.btnWonderBrush = createBtn('wonder-brush', 'Brush', -0.36, -0.175, 0.22, 0.068, {
          accent: '#F472B6',
          activeBg: 'rgba(244, 114, 182, 0.92)',
          fontSize: 23
        });
        this.btnConvergence = createBtn('convergence', 'Converge', -0.12, -0.175, 0.23, 0.068, {
          accent: '#FBBF24',
          activeBg: 'rgba(251, 191, 36, 0.92)',
          fontSize: 23
        });
        this.btnMicBreath = createBtn('mic-breath', 'Mic Breath', 0.13, -0.175, 0.24, 0.068, {
          accent: '#34D399',
          activeBg: 'rgba(52, 211, 153, 0.92)',
          fontSize: 23
        });
        this.btnReanchor = createBtn('reanchor-mr', 'Re-Anchor', 0.375, -0.175, 0.21, 0.068, {
          accent: '#38BDF8',
          activeBg: 'rgba(56, 189, 248, 0.92)',
          fontSize: 22
        });

        // Floating Mini Re-open Pill when minimized
        this.miniBtn = createBtn('toggle-minimize', 'Show VR Controls', 0, -0.22, 0.3, 0.064, {
          parent: this.root,
          accent: '#38BDF8',
          fontSize: 24
        });
        this.miniBtn.el.setAttribute('visible', false);

        // Visibility synced strictly with VR/MR mode
        const syncVisibility = () => {
          const inXR = Boolean(this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode'));
          const isAR = Boolean(this.el.sceneEl?.is('ar-mode'));
          this.root.setAttribute('visible', inXR);
          this.reflectRoot.setAttribute('visible', inXR && this.reflectVisible);
          if (this.btnReanchor) {
            const label = isAR ? 'Re-Anchor' : 'Portal';
            this.btnReanchor.lastLabel = label;
            redrawButtonTexture(this.btnReanchor.texEntry, label, {
              ...this.btnReanchor.opts,
              active: !isAR && Boolean(this.el.sceneEl?.components?.['xr-tabletop-portal']?.isTabletopMode)
            });
          }
        };
        this.onEnterVR = () => syncVisibility();
        this.onExitVR = () => syncVisibility();
        this.el.sceneEl?.addEventListener('enter-vr', this.onEnterVR);
        this.el.sceneEl?.addEventListener('exit-vr', this.onExitVR);
        syncVisibility();

        // Sync with Solar, Zoom, Biome, Narrator, and Grand Prize Spatial States
        this.onSolarChanged = (evt) => {
          const s = typeof evt.detail?.solar === 'number' ? evt.detail.solar : -0.22;
          this.syncSolarUI(s);
        };
        this.onZoomChanged = (evt) => {
          this.syncZoomUI(evt.detail?.zoom ?? 0);
        };
        this.onStateChanged = (evt) => {
          this.syncStateUI(evt.detail || {});
        };
        this.onWonderBrushState = (evt) => {
          const active = Boolean(evt.detail?.active);
          redrawButtonTexture(this.btnWonderBrush.texEntry, active ? 'Brush On' : 'Brush', {
            ...this.btnWonderBrush.opts,
            active
          });
        };
        this.onConvergenceState = (evt) => {
          const active = Boolean(evt.detail?.convergenceActive ?? evt.detail?.active);
          redrawButtonTexture(this.btnConvergence.texEntry, active ? 'Converged' : 'Converge', {
            ...this.btnConvergence.opts,
            active
          });
        };
        this.onMicBreathState = (evt) => {
          const active = Boolean(evt.detail?.active);
          const err = evt.detail?.error;
          redrawButtonTexture(this.btnMicBreath.texEntry, active ? 'Mic Live' : (err ? 'No Mic' : 'Mic Breath'), {
            ...this.btnMicBreath.opts,
            active
          });
        };
        this.onTabletopState = (evt) => {
          const isAR = Boolean(this.el.sceneEl?.is('ar-mode'));
          if (!isAR && this.btnReanchor) {
            const active = Boolean(evt.detail?.active);
            redrawButtonTexture(this.btnReanchor.texEntry, 'Portal', {
              ...this.btnReanchor.opts,
              active
            });
          }
        };

        this.leftHandEl = document.getElementById('left-hand');
        this.rightHandEl = document.getElementById('right-hand');
        this._cachedHands = [this.leftHandEl, this.rightHandEl];

        this.leftControllerEl = document.getElementById('left-controller');
        this.rightControllerEl = document.getElementById('right-controller');
        this._cachedControllers = [this.leftControllerEl, this.rightControllerEl];

        // Controller trigger/grip grab listeners for repositioning the console
        this.onControllerGripDown = (evt) => {
          const ctrl = evt.currentTarget || evt.target;
          const raycaster = ctrl?.components?.raycaster;
          const intersected = raycaster?.intersectedEls || [];
          if (intersected.includes(this.btnDragHandle?.el) || intersected.includes(this.panel)) {
            this.startControllerDrag(ctrl);
          }
        };
        this.onControllerGripUp = (evt) => {
          const ctrl = evt.currentTarget || evt.target;
          if (this.isConsoleDragging && this.dragController === ctrl) {
            this.stopConsoleDrag();
          }
        };

        [this.leftControllerEl, this.rightControllerEl].forEach((ctrl) => {
          if (!ctrl) return;
          ctrl.addEventListener('triggerdown', this.onControllerGripDown);
          ctrl.addEventListener('gripdown', this.onControllerGripDown);
          ctrl.addEventListener('triggerup', this.onControllerGripUp);
          ctrl.addEventListener('gripup', this.onControllerGripUp);
        });

        // Desktop Pointer/Mouse Drag on Grab Handle
        if (this.btnDragHandle?.el) {
          this.btnDragHandle.el.addEventListener('mousedown', (e) => {
            if (this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode')) return;
            this.isMouseDraggingConsole = true;
            this.mouseStartX = e.clientX;
            this.mouseStartY = e.clientY;
            this.consoleStartPos.copy(this.root.object3D.position);
            redrawButtonTexture(this.btnDragHandle.texEntry, '⠿ REPOSITIONING CONSOLE... ⠿', {
              ...this.btnDragHandle.opts,
              active: true
            });
            natureAudio.playTone(440, 0.25, 'sine', 0.025);
            window.tabsirahHaptics?.playPattern('ui-tap', { hand: 'both' });
          });
        }

        this.onWindowMouseMove = (e) => {
          if (!this.isMouseDraggingConsole) return;
          const dx = (e.clientX - this.mouseStartX) * 0.0022;
          const dy = (this.mouseStartY - e.clientY) * 0.0022;
          this.root.object3D.position.x = THREE.MathUtils.clamp(this.consoleStartPos.x + dx, -1.8, 1.8);
          this.root.object3D.position.y = THREE.MathUtils.clamp(this.consoleStartPos.y + dy, 0.35, 1.85);
        };
        this.onWindowMouseUp = () => {
          if (this.isMouseDraggingConsole) {
            this.isMouseDraggingConsole = false;
            redrawButtonTexture(this.btnDragHandle.texEntry, '⠿  DRAG TO REPOSITION CONSOLE  ⠿', {
              ...this.btnDragHandle.opts,
              active: false
            });
            natureAudio.playTone(523.25, 0.3, 'sine', 0.03);
          }
        };
        this.onConsoleWheel = (e) => {
          if (!this.isMouseDraggingConsole) return;
          this.root.object3D.position.z = THREE.MathUtils.clamp(
            this.root.object3D.position.z - e.deltaY * 0.0012,
            -2.1,
            -0.45
          );
        };

        window.addEventListener('mousemove', this.onWindowMouseMove);
        window.addEventListener('mouseup', this.onWindowMouseUp);
        window.addEventListener('wheel', this.onConsoleWheel, { passive: true });

        // Expose global handles for convenience & testing
        window.tabsirahResetVRConsole = () => this.resetConsolePosition();
        window.tabsirahRepositionVRConsole = (x, y, z) => {
          this.root.object3D.position.set(x, y, z);
        };

        window.addEventListener('biome-solar-changed', this.onSolarChanged);
        window.addEventListener('biome-zoom-changed', this.onZoomChanged);
        window.addEventListener('biome-state-changed', this.onStateChanged);
        window.addEventListener('tabsirah-wonder-brush-state', this.onWonderBrushState);
        window.addEventListener('tabsirah-convergence-state', this.onConvergenceState);
        window.addEventListener('tabsirah-relics-updated', this.onConvergenceState);
        window.addEventListener('tabsirah-mic-breath-state', this.onMicBreathState);
        window.addEventListener('tabsirah-tabletop-state', this.onTabletopState);

        this.syncSolarUI(window.tabsirahBiomeManager?.solarElevation ?? -0.22);
      },

      startControllerDrag: function (ctrlEl) {
        this.isConsoleDragging = true;
        this.dragController = ctrlEl;
        this.dragHand = null;
        this.isResettingPos = false;
        redrawButtonTexture(this.btnDragHandle.texEntry, '⠿ REPOSITIONING CONSOLE... ⠿', {
          ...this.btnDragHandle.opts,
          active: true
        });
        natureAudio.playTone(523.25, 0.28, 'sine', 0.03, 0);
        window.tabsirahHaptics?.playPattern('tabletop-anchor', { hand: 'both' });
        window.dispatchEvent(
          new CustomEvent('tabsirah-wonder-progress', {
            detail: { message: 'Repositioning control console in room space.' }
          })
        );
      },

      startHandDrag: function (handEl) {
        this.isConsoleDragging = true;
        this.dragHand = handEl;
        this.dragController = null;
        this.isResettingPos = false;
        redrawButtonTexture(this.btnDragHandle.texEntry, '⠿ REPOSITIONING CONSOLE... ⠿', {
          ...this.btnDragHandle.opts,
          active: true
        });
        natureAudio.playTone(587.33, 0.28, 'sine', 0.03, 0);
        window.tabsirahHaptics?.playPattern('tabletop-anchor', { hand: 'both' });
      },

      stopConsoleDrag: function () {
        if (!this.isConsoleDragging) return;
        this.isConsoleDragging = false;
        this.dragController = null;
        this.dragHand = null;
        redrawButtonTexture(this.btnDragHandle.texEntry, '⠿  DRAG TO REPOSITION CONSOLE  ⠿', {
          ...this.btnDragHandle.opts,
          active: false
        });
        natureAudio.playTone(392.0, 0.3, 'sine', 0.035, 0);
        natureAudio.playTone(493.88, 0.35, 'triangle', 0.02, 0.05);
        window.tabsirahHaptics?.playPattern('ui-tap', { hand: 'both' });
        window.dispatchEvent(
          new CustomEvent('tabsirah-wonder-progress', {
            detail: { message: 'Spatial Control Console anchored in place.' }
          })
        );
      },

      resetConsolePosition: function () {
        this.isResettingPos = true;
        this.resetStartTime = performance.now();
        this.resetStartPos.copy(this.root.object3D.position);
        this.resetStartRot.copy(this.root.object3D.rotation);
        natureAudio.playTone(392.0, 0.35, 'sine', 0.035, 0);
        natureAudio.playTone(587.33, 0.45, 'triangle', 0.02, 0.06);
        window.tabsirahHaptics?.playPattern('ui-tap', { hand: 'both' });
        window.dispatchEvent(
          new CustomEvent('tabsirah-wonder-progress', {
            detail: { message: 'Spatial Control Console reset to center.' }
          })
        );
      },

      syncSolarUI: function (solar) {
        this.currentSolar = solar;
        const norm = THREE.MathUtils.clamp((solar + 0.25) / 1.1, 0, 1);
        const w = Math.max(0.01, this.solarTrackWidth * norm);
        this.solarFillMesh.scale.x = w;
        this.solarFillMesh.position.x = -this.solarTrackWidth * 0.5 + w * 0.5;
        this.solarKnobMesh.position.x = -this.solarTrackWidth * 0.5 + this.solarTrackWidth * norm;

        const isNight = solar < 0.12;
        const label = isNight ? 'Switch to Day' : 'Switch to Night';
        if (this.btnDayNight.lastLabel !== label) {
          this.btnDayNight.lastLabel = label;
          redrawButtonTexture(this.btnDayNight.texEntry, label, {
            ...this.btnDayNight.opts,
            active: !isNight
          });
        }

        const mgr = window.tabsirahBiomeManager;
        const phase = mgr ? mgr.formatSolarLabel(solar) : isNight ? 'Starlight' : 'Daylight';
        const title = this.currentBiomeShortTitle || 'Polar Aurora';
        redrawButtonTexture(this.titleBanner.texEntry, title, {
          ...this.titleBanner.opts,
          sublabel: phase
        });
      },

      syncZoomUI: function (z) {
        const isAerial = z < -0.58;
        const isVista = !isAerial && z < -0.16;
        const isEye = !isAerial && !isVista;
        redrawButtonTexture(this.btnAerial.texEntry, 'Aerial', { ...this.btnAerial.opts, active: isAerial });
        redrawButtonTexture(this.btnVista.texEntry, 'Vista', { ...this.btnVista.opts, active: isVista });
        redrawButtonTexture(this.btnEye.texEntry, 'Eye Level', { ...this.btnEye.opts, active: isEye });
      },

      syncStateUI: function (detail) {
        if (detail.biomeId && detail.biomeId !== this.currentBiomeId) {
          this.currentBiomeId = detail.biomeId;
          redrawReflectCard(this.reflectTexEntry, detail.biomeId);
        }
        if (detail.shortTitle) {
          this.currentBiomeShortTitle = detail.shortTitle;
        }
        if (typeof detail.actionLabel === 'string') {
          redrawButtonTexture(this.btnAction.texEntry, detail.actionLabel, {
            ...this.btnAction.opts,
            active: Boolean(detail.actionActive)
          });
        }
        if (typeof detail.narrateLabel === 'string') {
          redrawButtonTexture(this.btnNarrate.texEntry, detail.narrateLabel, {
            ...this.btnNarrate.opts,
            active: detail.narrateLabel !== 'Narrate'
          });
        }
        if (typeof detail.muted === 'boolean') {
          redrawButtonTexture(this.btnAudio.texEntry, detail.muted ? 'Muted' : 'Audio On', {
            ...this.btnAudio.opts,
            active: !detail.muted
          });
        }
        this.syncSolarUI(this.currentSolar);
      },

      handleButtonAction: function (id) {
        const now = performance.now();
        if (now - this.lastTouchTime < 180) return;
        this.lastTouchTime = now;
        natureAudio.unlock();
        window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.32, duration: 22 } }));

        if (id === 'reset-console-pos') {
          this.resetConsolePosition();
          return;
        }
        if (id === 'drag-console') {
          if (this.isConsoleDragging) this.stopConsoleDrag();
          return;
        }

        const mgr = window.tabsirahBiomeManager;
        if (id === 'prev-biome') mgr?.stepBiome(-1);
        else if (id === 'next-biome') mgr?.stepBiome(1);
        else if (id === 'toggle-day-night') {
          const target = this.currentSolar < 0.12 ? 0.56 : -0.22;
          mgr?.animateSolarTo(target);
        } else if (id === 'zoom-aerial') {
          window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: -0.82 } }));
        } else if (id === 'zoom-vista') {
          window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: -0.38 } }));
        } else if (id === 'zoom-eye') {
          window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { zoom: 0 } }));
        } else if (id === 'toggle-reflect') {
          this.reflectVisible = !this.reflectVisible;
          const inXR = Boolean(this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode'));
          this.reflectRoot.setAttribute('visible', inXR && this.reflectVisible);
          redrawButtonTexture(this.btnReflect.texEntry, 'Reflect', {
            ...this.btnReflect.opts,
            active: this.reflectVisible
          });
        } else if (id === 'toggle-passthrough') {
          const sceneEl = this.el.sceneEl;
          if (sceneEl) {
            if (sceneEl.is('ar-mode')) Promise.resolve(sceneEl.exitVR?.()).catch(() => {});
            else if (typeof sceneEl.enterAR === 'function') Promise.resolve(sceneEl.enterAR()).catch(() => {});
          }
        } else if (id === 'biome-action') {
          mgr?.triggerBiomeAction();
        } else if (id === 'narrate') {
          document.getElementById('btn-narrate-toggle')?.click();
        } else if (id === 'audio') {
          document.getElementById('btn-audio-toggle')?.click();
        } else if (id === 'wonder-brush') {
          window.dispatchEvent(new CustomEvent('tabsirah-wonder-brush-toggle'));
        } else if (id === 'convergence') {
          window.dispatchEvent(new CustomEvent('tabsirah-convergence-toggle'));
        } else if (id === 'mic-breath') {
          micBreathMonitor.toggle().catch(() => {});
        } else if (id === 'reanchor-mr') {
          if (this.el.sceneEl?.is('ar-mode')) {
            window.dispatchEvent(new CustomEvent('tabsirah-reanchor-tabletop'));
          } else {
            window.dispatchEvent(new CustomEvent('tabsirah-tabletop-toggle'));
          }
        } else if (id === 'toggle-minimize') {
          this.isMinimized = !this.isMinimized;
          this.panel.setAttribute('visible', !this.isMinimized);
          this.miniBtn.el.setAttribute('visible', this.isMinimized);
        }
      },

      // Direct Hand-Tracking Fingertip / Pinch Touch Detection for Bare-Hand XR + Repositioning
      tick: function (time, timeDelta) {
        if (!this.root.getAttribute('visible')) return;

        // 1. Smooth Reset Ease-out Animation
        if (this.isResettingPos) {
          const elapsed = performance.now() - this.resetStartTime;
          const t = Math.min(1, elapsed / 360);
          const ease = 1 - Math.pow(1 - t, 3);
          this.root.object3D.position.lerpVectors(this.resetStartPos, this.defaultPos, ease);
          this.root.object3D.rotation.x = THREE.MathUtils.lerp(this.resetStartRot.x, this.defaultRot.x, ease);
          this.root.object3D.rotation.y = THREE.MathUtils.lerp(this.resetStartRot.y, this.defaultRot.y, ease);
          this.root.object3D.rotation.z = THREE.MathUtils.lerp(this.resetStartRot.z, this.defaultRot.z, ease);
          if (t >= 1) {
            this.isResettingPos = false;
          }
          return;
        }

        // 2. Controller Ray Repositioning Drag
        if (this.isConsoleDragging && this.dragController?.object3D) {
          const ctrlObj = this.dragController.object3D;
          _wPos.setFromMatrixPosition(ctrlObj.matrixWorld);
          const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(ctrlObj.getWorldQuaternion(new THREE.Quaternion()));
          const targetWorld = _wPos.clone().addScaledVector(dir, 0.88);
          this.el.object3D.worldToLocal(targetWorld);
          targetWorld.x = THREE.MathUtils.clamp(targetWorld.x, -1.8, 1.8);
          targetWorld.y = THREE.MathUtils.clamp(targetWorld.y, 0.35, 1.75);
          targetWorld.z = THREE.MathUtils.clamp(targetWorld.z, -2.1, -0.45);
          this.root.object3D.position.lerp(targetWorld, 0.28);

          // Gentle billboard facing user camera
          const cam = this.el.sceneEl?.camera;
          if (cam) {
            const camPos = new THREE.Vector3();
            cam.getWorldPosition(camPos);
            const consoleWorld = new THREE.Vector3();
            this.root.object3D.getWorldPosition(consoleWorld);
            const toCam = camPos.clone().sub(consoleWorld);
            this.root.object3D.rotation.y = Math.atan2(toCam.x, toCam.z);
            this.root.object3D.rotation.x = THREE.MathUtils.degToRad(-30);
          }
        }

        // 3. Cache Hands
        if (!this.leftHandEl || !this.leftHandEl.isConnected) {
          this.leftHandEl = document.getElementById('left-hand');
          this._cachedHands[0] = this.leftHandEl;
        }
        if (!this.rightHandEl || !this.rightHandEl.isConnected) {
          this.rightHandEl = document.getElementById('right-hand');
          this._cachedHands[1] = this.rightHandEl;
        }

        // 4. Hand Proximity & Touch Detection
        for (let i = 0; i < this._cachedHands.length; i++) {
          const handEl = this._cachedHands[i];
          if (!handEl?.object3D) continue;
          handEl.object3D.getWorldPosition(_wPos);
          if (_wPos.lengthSq() < 0.001) continue;

          // Check direct touch / proximity on the 3D Grab Handle
          if (this.btnDragHandle?.el) {
            _lPos.copy(_wPos);
            this.btnDragHandle.el.object3D.worldToLocal(_lPos);
            const nearHandle =
              Math.abs(_lPos.z) < 0.075 &&
              Math.abs(_lPos.x) < this.btnDragHandle.w * 0.52 &&
              Math.abs(_lPos.y) < this.btnDragHandle.h * 0.52;

            if (nearHandle && !this.isConsoleDragging) {
              this.startHandDrag(handEl);
            }

            if (this.isConsoleDragging && this.dragHand === handEl) {
              const targetWorld = _wPos.clone();
              targetWorld.y -= 0.12;
              targetWorld.z -= 0.12;
              this.el.object3D.worldToLocal(targetWorld);
              targetWorld.x = THREE.MathUtils.clamp(targetWorld.x, -1.8, 1.8);
              targetWorld.y = THREE.MathUtils.clamp(targetWorld.y, 0.35, 1.75);
              targetWorld.z = THREE.MathUtils.clamp(targetWorld.z, -2.1, -0.45);
              this.root.object3D.position.lerp(targetWorld, 0.32);

              if (!nearHandle && _lPos.length() > 0.32) {
                this.stopConsoleDrag();
              }
            }
          }

          if (this.isMinimized) {
            _lPos.copy(_wPos);
            this.miniBtn.el.object3D.worldToLocal(_lPos);
            if (
              Math.abs(_lPos.z) < 0.05 &&
              Math.abs(_lPos.x) < this.miniBtn.w * 0.48 &&
              Math.abs(_lPos.y) < this.miniBtn.h * 0.48
            ) {
              this.handleButtonAction('toggle-minimize');
              return;
            }
            continue;
          }

          // Check direct touch / pinch on the 3D Solar Track Bar
          _lPos.copy(_wPos);
          this.solarTrackEl.object3D.worldToLocal(_lPos);
          if (
            Math.abs(_lPos.z) < 0.065 &&
            Math.abs(_lPos.y) < 0.065 &&
            Math.abs(_lPos.x) <= this.solarTrackWidth * 0.52
          ) {
            const norm = THREE.MathUtils.clamp(_lPos.x / this.solarTrackWidth + 0.5, 0, 1);
            window.tabsirahBiomeManager?.setSolarElevation(-0.25 + norm * 1.1);
          }

          // Check direct fingertip press on each 3D button
          for (const btn of this.buttons) {
            if (btn.id === 'noop' || btn.el === this.miniBtn.el || btn.id === 'drag-console') continue;
            _lPos.copy(_wPos);
            btn.el.object3D.worldToLocal(_lPos);
            if (
              Math.abs(_lPos.z) < 0.048 &&
              Math.abs(_lPos.x) < btn.w * 0.46 &&
              Math.abs(_lPos.y) < btn.h * 0.46
            ) {
              this.handleButtonAction(btn.id);
              return;
            }
          }
        }
      },

      remove: function () {
        this.el.sceneEl?.removeEventListener('enter-vr', this.onEnterVR);
        this.el.sceneEl?.removeEventListener('exit-vr', this.onExitVR);
        window.removeEventListener('biome-solar-changed', this.onSolarChanged);
        window.removeEventListener('biome-zoom-changed', this.onZoomChanged);
        window.removeEventListener('biome-state-changed', this.onStateChanged);
        window.removeEventListener('tabsirah-wonder-brush-state', this.onWonderBrushState);
        window.removeEventListener('tabsirah-convergence-state', this.onConvergenceState);
        window.removeEventListener('tabsirah-relics-updated', this.onConvergenceState);
        window.removeEventListener('tabsirah-mic-breath-state', this.onMicBreathState);
        window.removeEventListener('tabsirah-tabletop-state', this.onTabletopState);
        window.removeEventListener('mousemove', this.onWindowMouseMove);
        window.removeEventListener('mouseup', this.onWindowMouseUp);
        window.removeEventListener('wheel', this.onConsoleWheel);
        [this.leftControllerEl, this.rightControllerEl].forEach((ctrl) => {
          if (!ctrl) return;
          ctrl.removeEventListener('triggerdown', this.onControllerGripDown);
          ctrl.removeEventListener('gripdown', this.onControllerGripDown);
          ctrl.removeEventListener('triggerup', this.onControllerGripUp);
          ctrl.removeEventListener('gripup', this.onControllerGripUp);
        });
        this.disposables.forEach((d) => d?.dispose());
      }
    });
  }

  /**
   * 2. VR Controller Thumbstick & Button Shortcuts (Instant Day/Night, Solar Scrub, Zoom, & Biome Switch)
   */
  if (!AFRAME.components['vr-controller-shortcuts']) {
    AFRAME.registerComponent('vr-controller-shortcuts', {
      init: function () {
        this.axisX = 0;
        this.axisY = 0;

        this.onThumbstick = (evt) => {
          this.axisX = evt.detail?.x || 0;
          this.axisY = evt.detail?.y || 0;
        };
        this.onToggleDayNight = () => {
          natureAudio.unlock();
          const mgr = window.tabsirahBiomeManager;
          if (!mgr) return;
          mgr.animateSolarTo(mgr.solarElevation < 0.12 ? 0.56 : -0.22);
        };
        this.onNextBiome = () => {
          natureAudio.unlock();
          window.tabsirahBiomeManager?.stepBiome(1);
        };

        this.el.addEventListener('thumbstickmoved', this.onThumbstick);
        this.el.addEventListener('abuttondown', this.onToggleDayNight);
        this.el.addEventListener('xbuttondown', this.onToggleDayNight);
        this.el.addEventListener('bbuttondown', this.onNextBiome);
        this.el.addEventListener('ybuttondown', this.onNextBiome);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta) return;
        const dt = Math.min(timeDelta, 50) / 1000;
        if (Math.abs(this.axisX) > 0.2) {
          const mgr = window.tabsirahBiomeManager;
          if (mgr) mgr.setSolarElevation(mgr.solarElevation + this.axisX * 0.75 * dt);
        }
        if (Math.abs(this.axisY) > 0.25) {
          window.dispatchEvent(new CustomEvent('biome-zoom-command', { detail: { delta: -this.axisY * 1.15 * dt } }));
        }
      },

      remove: function () {
        this.el.removeEventListener('thumbstickmoved', this.onThumbstick);
        this.el.removeEventListener('abuttondown', this.onToggleDayNight);
        this.el.removeEventListener('xbuttondown', this.onToggleDayNight);
        this.el.removeEventListener('bbuttondown', this.onNextBiome);
        this.el.removeEventListener('ybuttondown', this.onNextBiome);
      }
    });
  }
}
