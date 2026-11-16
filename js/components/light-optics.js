/**
 * Tabsirah: The Architecture of Light & Order
 * Station 1 Engine — Real-Time Optical Physics, Water-Droplet Prism,
 * Snell/Cauchy 7-Band Dispersion Rays & Caustic Projection Shader.
 */

import { natureAudio } from './nature-audio.js';
import { tactileTouchFX } from './tactile-touch-fx.js';

const SPECTRUM_BANDS = [
  { name: 'Red', nm: 656, ior: 1.3311, color: '#FF3B30' },
  { name: 'Orange', nm: 610, ior: 1.3326, color: '#FF9500' },
  { name: 'Yellow', nm: 580, ior: 1.3338, color: '#FFCC00' },
  { name: 'Green', nm: 532, ior: 1.3358, color: '#34C759' },
  { name: 'Cyan', nm: 492, ior: 1.3379, color: '#32ADE6' },
  { name: 'Blue', nm: 455, ior: 1.3402, color: '#007AFF' },
  { name: 'Violet', nm: 405, ior: 1.3435, color: '#AF52DE' }
];

function createDropletGeometry() {
  const pts = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0 = bottom bulb, 1 = upper tip
    const angle = t * Math.PI;
    // Asymmetric teardrop profile (smooth rounded lower bulb tapering to crisp optical apex)
    const r = Math.sin(angle) * Math.pow(1 - t * 0.58, 0.55) * 0.44;
    const y = (t - 0.38) * 1.15;
    pts.push(new THREE.Vector2(Math.max(0.0001, r), y));
  }
  const geo = new THREE.LatheGeometry(pts, 40);
  geo.computeVertexNormals();
  return geo;
}

function createPhotonSpriteTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(224,242,254,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

if (typeof AFRAME !== 'undefined') {
  const _dir = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0);
  const _quat = new THREE.Quaternion();
  const _rayOrigin = new THREE.Vector3();
  const _rayEnd = new THREE.Vector3();
  const _mid = new THREE.Vector3();
  const _worldPos = new THREE.Vector3();
  const _baseExitDir = new THREE.Vector3();
  const _handPos = new THREE.Vector3();

  if (!AFRAME.components['water-prism-optics']) {
    AFRAME.registerComponent('water-prism-optics', {
      schema: {
        beamLength: { type: 'number', default: 2.9 }
      },

      init: function () {
        this.group = new THREE.Group();
        this.tiltPitch = 0.18;
        this.tiltYaw = 0.25;
        this.targetPitch = 0.18;
        this.targetYaw = 0.25;
        this.isDragging = false;
        this.lastPointerX = 0;
        this.lastPointerY = 0;
        this.lastChimeTime = 0;
        this.elapsed = 0;

        // 1. Suspended Crystal Water Droplet (Outer Fresnel Dielectric + Inner Specular Core)
        this.dropletGroup = new THREE.Group();
        this.dropletGroup.position.set(0, 0.38, 0);

        this.dropletGeo = createDropletGeometry();
        this.dropletMat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uTilt: { value: new THREE.Vector2(0.18, 0.25) }
          },
          vertexShader: `
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            varying vec3 vLocalPos;
            void main() {
              vLocalPos = position;
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vNormalW = normalize(mat3(modelMatrix) * normal);
              vViewDir = normalize(cameraPosition - worldPos.xyz);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec2 uTilt;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            varying vec3 vLocalPos;
            void main() {
              float ndotv = clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0);
              float fresnel = pow(1.0 - ndotv, 2.4);
              // Thin-film chromatic iridescence across crystal droplet rim
              float phase = vLocalPos.y * 4.5 + uTilt.y * 3.0 + uTime * 0.6;
              vec3 rainbowRim = 0.5 + 0.5 * cos(phase + vec3(0.0, 2.09, 4.18));
              vec3 waterTint = mix(vec3(0.75, 0.92, 1.0), rainbowRim, fresnel * 0.65);
              float spec = pow(max(0.0, dot(reflect(-normalize(vec3(-0.7, 0.4, 0.6)), normalize(vNormalW)), normalize(vViewDir))), 28.0);
              vec3 finalCol = waterTint * (0.28 + fresnel * 1.1) + vec3(1.0) * spec * 1.35;
              float alpha = clamp(0.24 + fresnel * 0.72 + spec * 0.5, 0.0, 0.96);
              gl_FragColor = vec4(finalCol, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        this.dropletMesh = new THREE.Mesh(this.dropletGeo, this.dropletMat);
        this.dropletGroup.add(this.dropletMesh);

        // Subtle inner refraction core
        this.coreGeo = new THREE.OctahedronGeometry(0.14, 2);
        this.coreMat = new THREE.MeshBasicMaterial({
          color: '#E0F2FE',
          transparent: true,
          opacity: 0.25,
          wireframe: true
        });
        this.dropletGroup.add(new THREE.Mesh(this.coreGeo, this.coreMat));
        this.group.add(this.dropletGroup);

        // 2. Incident Pure White Beam + Internal Bounce Ray
        this.beamGeo = new THREE.CylinderGeometry(0.018, 0.032, 1, 12, 1, true);
        this.whiteBeamMat = new THREE.MeshBasicMaterial({
          color: '#FFFFFF',
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        this.incidentBeam = new THREE.Mesh(this.beamGeo, this.whiteBeamMat);
        this.group.add(this.incidentBeam);

        this.internalMat = new THREE.MeshBasicMaterial({
          color: '#E0F2FE',
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.internalRay = new THREE.Mesh(this.beamGeo, this.internalMat);
        this.group.add(this.internalRay);

        // White Source Halo Orb (Left emitter)
        this.sourcePos = new THREE.Vector3(-2.35, 0.78, -0.2);
        this.sourceGeo = new THREE.SphereGeometry(0.095, 16, 12);
        this.sourceMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
        this.sourceOrb = new THREE.Mesh(this.sourceGeo, this.sourceMat);
        this.sourceOrb.position.copy(this.sourcePos);
        this.group.add(this.sourceOrb);

        // Incident Photon Particles flowing along the white beam
        this.photonCount = 48;
        this.photonPositions = new Float32Array(this.photonCount * 3);
        this.photonPhase = new Float32Array(this.photonCount);
        for (let i = 0; i < this.photonCount; i++) {
          this.photonPhase[i] = i / this.photonCount;
        }
        this.photonGeo = new THREE.BufferGeometry();
        this.photonAttr = new THREE.BufferAttribute(this.photonPositions, 3);
        this.photonGeo.setAttribute('position', this.photonAttr);
        this.photonTex = createPhotonSpriteTexture();
        this.photonMat = new THREE.PointsMaterial({
          size: 0.085,
          map: this.photonTex,
          color: '#FFFFFF',
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.group.add(new THREE.Points(this.photonGeo, this.photonMat));

        // 3. 7-Band Volumetric Spectral Dispersion Cones
        this.bandGeo = new THREE.CylinderGeometry(0.012, 0.088, 1, 10, 1, true);
        this.bandMeshes = SPECTRUM_BANDS.map((band) => {
          const mat = new THREE.MeshBasicMaterial({
            color: band.color,
            transparent: true,
            opacity: 0.62,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(this.bandGeo, mat);
          this.group.add(mesh);
          return { mesh, mat, band };
        });

        // 4. Shimmering Floor Caustics Projection Disc (Custom GLSL Interference Shader)
        this.causticGeo = new THREE.CircleGeometry(2.35, 64);
        this.causticGeo.rotateX(-Math.PI / 2);
        this.causticMat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uFocusOffset: { value: new THREE.Vector2(0.8, 0.0) },
            uSweepAngle: { value: 0.25 }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vPos;
            void main() {
              vUv = uv;
              vPos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec2 uFocusOffset;
            uniform float uSweepAngle;
            varying vec2 vUv;
            varying vec3 vPos;

            float causticWave(vec2 p, float t) {
              float v = 0.0;
              v += sin(p.x * 5.2 + t * 1.4 + sin(p.y * 4.1 - t * 0.9));
              v += sin(p.y * 6.0 - t * 1.1 + cos(p.x * 4.8 + t * 1.2));
              v += sin((p.x + p.y) * 4.4 + t * 0.8);
              return pow(clamp(abs(v) * 0.34, 0.0, 1.0), 2.3);
            }

            void main() {
              vec2 p = vPos.xz;
              float radial = length(p);
              float edgeFade = smoothstep(2.32, 0.4, radial);

              // Caustic hot-zone projected where the rainbow hits the floor
              vec2 toSpot = p - uFocusOffset;
              float spotDist = length(toSpot);
              float angle = atan(toSpot.y, toSpot.x);
              float arc = smoothstep(1.35, 0.0, spotDist);

              float c1 = causticWave(p * 1.45, uTime);
              float c2 = causticWave(p * 2.15 + 1.3, -uTime * 0.85);
              float caustic = clamp(c1 * 0.7 + c2 * 0.55, 0.0, 1.0);

              float bandT = clamp((p.y + 1.2) * 0.4 + sin(angle - uSweepAngle) * 0.25, 0.0, 1.0);
              vec3 specCol = 0.55 + 0.45 * cos(bandT * 6.283 + vec3(0.0, 2.1, 4.2));
              vec3 baseWater = vec3(0.12, 0.42, 0.72);
              vec3 col = mix(baseWater, specCol, 0.35 + arc * 0.65) * (0.35 + caustic * 1.45);

              float alpha = edgeFade * (0.14 + caustic * 0.45 + arc * caustic * 0.42);
              gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.85));
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.causticFloor = new THREE.Mesh(this.causticGeo, this.causticMat);
        this.causticFloor.position.set(0.35, -0.98, 0);
        this.group.add(this.causticFloor);

        // 5. Forgiving invisible hit sphere for easy clicking & XR pinching
        this.hitGeo = new THREE.SphereGeometry(0.65, 12, 10);
        this.hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false });
        const hitMesh = new THREE.Mesh(this.hitGeo, this.hitMat);
        hitMesh.position.copy(this.dropletGroup.position);
        this.group.add(hitMesh);

        this.el.setObject3D('mesh', this.group);

        // Bind pointer drag & cursor tilt responsiveness + XR pinch tilt
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onTiltCycle = this.onTiltCycle.bind(this);

        window.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        this.el.addEventListener('click', this.onTiltCycle);
        this.el.addEventListener('pinchstarted', this.onTiltCycle);
        this.el.sceneEl?.addEventListener('light-tilt-cycle', this.onTiltCycle);
        tactileTouchFX.registerInteractiveSurface(this.el.object3D, {
          biomeId: 'rainforest',
          specimenKey: 'rainforest-prism-lens',
          proximityTarget: true,
          proximityRadius: 0.45,
          springTarget: this.el.object3D,
          springOptions: { liftAmount: 0.055, recoilAmount: 0.04, squashAmount: 0.1 }
        });

        this.updateOpticsGeometry();
      },

      onPointerDown: function (e) {
        if (!this.el.object3D?.visible) return;
        if (e.target?.closest?.('.hud-topbar, .hud-bottom-stack, .inspector-card')) return;
        this.isDragging = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      },

      onPointerMove: function (e) {
        if (!this.el.object3D?.visible) return;
        const w = window.innerWidth || 1280;
        const h = window.innerHeight || 720;
        if (this.isDragging) {
          const dx = (e.clientX - this.lastPointerX) / w;
          const dy = (e.clientY - this.lastPointerY) / h;
          this.lastPointerX = e.clientX;
          this.lastPointerY = e.clientY;
          this.targetYaw = THREE.MathUtils.clamp(this.targetYaw + dx * 2.2, -0.65, 0.85);
          this.targetPitch = THREE.MathUtils.clamp(this.targetPitch + dy * 1.8, -0.45, 0.65);
        } else {
          // Subtle responsive beam follow when cursor moves across viewport
          const nx = (e.clientX / w) * 2 - 1;
          const ny = (e.clientY / h) * 2 - 1;
          this.targetYaw = THREE.MathUtils.clamp(0.2 + nx * 0.45, -0.55, 0.85);
          this.targetPitch = THREE.MathUtils.clamp(0.16 + ny * 0.32, -0.42, 0.6);
        }

        const now = performance.now();
        if (now - this.lastChimeTime > 520 && this.isDragging) {
          this.lastChimeTime = now;
          this.el.object3D.getWorldPosition(_worldPos);
          natureAudio.playPrismShimmer((this.targetYaw + 0.65) / 1.5, _worldPos);
        }
      },

      onPointerUp: function () {
        this.isDragging = false;
      },

      onTiltCycle: function (evt) {
        if (!this.el.object3D?.visible) return;
        evt?.stopPropagation?.();
        natureAudio.unlock();
        this.targetYaw = this.targetYaw > 0.35 ? -0.32 : 0.62;
        this.targetPitch = this.targetPitch > 0.25 ? -0.22 : 0.38;
        this.el.object3D.getWorldPosition(_worldPos);
        natureAudio.playPrismShimmer(0.65, _worldPos);
        window.dispatchEvent(
          new CustomEvent('tabsirah-wonder-progress', {
            detail: {
              biomeId: 'rainforest',
              message: 'Raindrop Optical Prism tilted — refracting 7-band Snell/Cauchy spectrum & caustics.'
            }
          })
        );
      },

      positionCylinderBetween: function (mesh, a, b) {
        _mid.addVectors(a, b).multiplyScalar(0.5);
        _dir.subVectors(b, a);
        const len = Math.max(0.001, _dir.length());
        _dir.divideScalar(len);
        _quat.setFromUnitVectors(_up, _dir);
        mesh.position.copy(_mid);
        mesh.quaternion.copy(_quat);
        mesh.scale.set(1, len, 1);
      },

      updateOpticsGeometry: function () {
        this.dropletGroup.rotation.set(this.tiltPitch, this.tiltYaw, -0.14);

        const dropletCenter = this.dropletGroup.position;
        const entryPt = _rayOrigin.set(
          dropletCenter.x - 0.14,
          dropletCenter.y + 0.04,
          dropletCenter.z - 0.04
        );

        // 1. White Incident Beam: source -> droplet entry
        this.positionCylinderBetween(this.incidentBeam, this.sourcePos, entryPt);

        // 2. Internal Reflection Bounce inside back wall of droplet
        const backWall = _rayEnd.set(
          dropletCenter.x + 0.22,
          dropletCenter.y + 0.12 - this.tiltPitch * 0.25,
          dropletCenter.z + Math.sin(this.tiltYaw) * 0.16
        );
        this.positionCylinderBetween(this.internalRay, entryPt, backWall);

        // 3. Snell Dispersion Rays exiting the lower-front face into 7 spectral bands
        _baseExitDir.set(
          Math.cos(this.tiltYaw * 0.85) * 0.92,
          -0.46 - this.tiltPitch * 0.65,
          Math.sin(this.tiltYaw * 0.95) * 0.68
        ).normalize();

        for (let i = 0; i < this.bandMeshes.length; i++) {
          const item = this.bandMeshes[i];
          // Dispersion fan calculated from Cauchy refractive index delta relative to water
          const nDelta = (item.band.ior - 1.3311) * 28.0; // spreads 0.0 -> ~0.35 rad
          const spreadY = -nDelta * 0.85;
          const spreadZ = (i - 3) * 0.055;

          _dir.copy(_baseExitDir);
          _dir.y += spreadY;
          _dir.z += spreadZ;
          _dir.normalize();

          _rayEnd.copy(dropletCenter).addScaledVector(_dir, this.data.beamLength);
          this.positionCylinderBetween(item.mesh, dropletCenter, _rayEnd);
        }

        // Sync floor caustic spotlight position with exit direction
        const tFloor = Math.max(0.4, (-0.98 - dropletCenter.y) / Math.min(-0.2, _baseExitDir.y));
        const fx = THREE.MathUtils.clamp(dropletCenter.x + _baseExitDir.x * tFloor - 0.35, -1.6, 1.6);
        const fz = THREE.MathUtils.clamp(dropletCenter.z + _baseExitDir.z * tFloor, -1.4, 1.4);
        this.causticMat.uniforms.uFocusOffset.value.set(fx, fz);
        this.causticMat.uniforms.uSweepAngle.value = this.tiltYaw;
        this.dropletMat.uniforms.uTilt.value.set(this.tiltPitch, this.tiltYaw);
      },

      tick: function (time, timeDelta) {
        if (!timeDelta || !this.el.object3D?.visible) return;
        const tScale = window.tabsirahTimeScale || 1.0;
        const dt = (Math.min(timeDelta, 50) / 1000) * tScale;
        this.elapsed += dt;

        // XR hand proximity tilt when inside VR/MR headset
        if (this.el.sceneEl?.is('vr-mode') || this.el.sceneEl?.is('ar-mode')) {
          const rh = document.getElementById('right-hand');
          if (rh?.object3D && rh.object3D.position.lengthSq() > 0.001) {
            rh.object3D.getWorldPosition(_handPos);
            this.targetYaw = THREE.MathUtils.clamp(_handPos.x * 1.4, -0.65, 0.85);
            this.targetPitch = THREE.MathUtils.clamp((_handPos.y - 1.3) * 1.1, -0.45, 0.65);
          }
        }

        this.tiltPitch = THREE.MathUtils.damp(this.tiltPitch, this.targetPitch, 6.5, dt);
        this.tiltYaw = THREE.MathUtils.damp(this.tiltYaw, this.targetYaw, 6.5, dt);

        this.dropletGroup.position.y = 0.38 + Math.sin(this.elapsed * 1.4) * 0.035;
        this.dropletMat.uniforms.uTime.value = this.elapsed;
        this.causticMat.uniforms.uTime.value = this.elapsed;
        this.updateOpticsGeometry();

        // Advance photons flowing along the incident white beam
        const entry = this.dropletGroup.position;
        for (let i = 0; i < this.photonCount; i++) {
          this.photonPhase[i] = (this.photonPhase[i] + dt * 0.72) % 1;
          const p = this.photonPhase[i];
          this.photonPositions[i * 3] = this.sourcePos.x + (entry.x - 0.14 - this.sourcePos.x) * p;
          this.photonPositions[i * 3 + 1] = this.sourcePos.y + (entry.y + 0.04 - this.sourcePos.y) * p;
          this.photonPositions[i * 3 + 2] = this.sourcePos.z + (entry.z - 0.04 - this.sourcePos.z) * p;
        }
        this.photonAttr.needsUpdate = true;
      },

      remove: function () {
        window.removeEventListener('pointerdown', this.onPointerDown);
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        tactileTouchFX.unregisterInteractiveSurface(this.el.object3D);
        this.el.removeEventListener('click', this.onTiltCycle);
        this.el.removeEventListener('pinchstarted', this.onTiltCycle);
        this.el.sceneEl?.removeEventListener('light-tilt-cycle', this.onTiltCycle);
        this.el.removeObject3D('mesh');
        this.dropletGeo?.dispose();
        this.dropletMat?.dispose();
        this.coreGeo?.dispose();
        this.coreMat?.dispose();
        this.beamGeo?.dispose();
        this.whiteBeamMat?.dispose();
        this.internalMat?.dispose();
        this.sourceGeo?.dispose();
        this.sourceMat?.dispose();
        this.photonGeo?.dispose();
        this.photonMat?.dispose();
        this.photonTex?.dispose();
        this.bandGeo?.dispose();
        this.bandMeshes?.forEach((b) => b.mat.dispose());
        this.causticGeo?.dispose();
        this.causticMat?.dispose();
        this.hitGeo?.dispose();
        this.hitMat?.dispose();
      }
    });
  }
}
