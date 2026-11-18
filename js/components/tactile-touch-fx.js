/**
 * Tabsirah: Multi-Sensory Tactile Touch Effects System
 * 100% Procedural GPU/Shader/Physics FX for Bare-Hand Tracking, VR Controllers & Desktop Pointer:
 *  1. touch-shockwave-shader  (Custom GLSL 3D Spherical + Planar Chromatic Dispersion & 16-Fold Islamic Lattice)
 *  2. surface-ripple-shader   (Contact-Point Liquid-Light PBR onBeforeCompile Displacement & Bioluminescence)
 *  3. touch-spark-burst       (Pooled 60-Spark Magnetic Tendril Bursts + 0.35m Pre-Touch Proximity Aura)
 *  4. tactile-spring-response (Damped Harmonic Spring Squash, Recoil & Levitation Impulse)
 *  5. Biome-Adaptive Haptics & Procedural Harmonic Audio Signatures
 *  6. Persistent "Memory of Wonder" Golden-Emerald Fresnel Afterglow
 */

import { natureAudio } from './nature-audio.js';

const BIOME_TOUCH_COLORS = {
  aurora: '#34D399',
  rainforest: '#10B981',
  ocean: '#22D3EE',
  desert: '#FBBF24'
};

const BIOME_SECONDARY_COLORS = {
  aurora: '#22D3EE',
  rainforest: '#FBBF24',
  ocean: '#34D399',
  desert: '#F59E0B'
};

function createSparkGlowTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.65, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Effect 2 & Effect 6: Patches any THREE.MeshStandardMaterial cleanly via onBeforeCompile
 * so PBR normal maps & lighting remain intact while adding contact-point liquid-light
 * surface ripples and persistent golden-emerald Fresnel afterglow.
 */
export function applySurfaceRippleMaterial(material, options = {}) {
  if (!material || !material.isMeshStandardMaterial) return material;
  if (material.userData?.touchRippleUniforms) return material;

  const uniforms = {
    uTouchPoint: { value: new THREE.Vector3(0, -999, 0) },
    uTouchAge: { value: 99.0 },
    uTouchColor: { value: new THREE.Color(options.color || '#22D3EE') },
    uAfterglow: { value: options.afterglow ? 1.0 : 0.0 },
    uAfterglowEmerald: { value: new THREE.Color('#34D399') },
    uAfterglowGold: { value: new THREE.Color('#FBBF24') },
    uRippleScale: { value: options.rippleScale || 1.0 },
    uRippleTime: { value: 0.0 }
  };

  material.userData = material.userData || {};
  material.userData.touchRippleUniforms = uniforms;
  material.customProgramCacheKey = () => 'tabsirah-surface-ripple-v1';

  const prevCompile = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (typeof prevCompile === 'function') {
      prevCompile.call(material, shader, renderer);
    }
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uTouchPoint;
         uniform float uTouchAge;
         uniform float uRippleScale;
         varying vec3 vRippleWorldPos;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         #ifdef USE_INSTANCING
           vec4 rippleWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
         #else
           vec4 rippleWorld = modelMatrix * vec4(transformed, 1.0);
         #endif
         if (uTouchAge < 2.6) {
           float dTouch = distance(rippleWorld.xyz, uTouchPoint);
           float waveFront = uTouchAge * 2.85;
           float ringEnv = exp(-abs(dTouch - waveFront) * 2.2) * exp(-dTouch * 0.48) * exp(-uTouchAge * 1.45);
           float microDisp = sin((dTouch - waveFront) * 16.0) * ringEnv * 0.016 * uRippleScale;
           transformed += normalize(objectNormal) * microDisp;
           #ifdef USE_INSTANCING
             rippleWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
           #else
             rippleWorld = modelMatrix * vec4(transformed, 1.0);
           #endif
         }
         vRippleWorldPos = rippleWorld.xyz;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uTouchPoint;
         uniform float uTouchAge;
         uniform vec3 uTouchColor;
         uniform float uAfterglow;
         uniform vec3 uAfterglowEmerald;
         uniform vec3 uAfterglowGold;
         uniform float uRippleTime;
         varying vec3 vRippleWorldPos;`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         if (uTouchAge < 2.6) {
           float distContact = distance(vRippleWorldPos, uTouchPoint);
           float travel = uTouchAge * 2.85;
           float crest = exp(-pow((distContact - travel) * 3.4, 2.0));
           float secondary = exp(-pow((distContact - travel * 0.72) * 5.2, 2.0)) * 0.55;
           float halo = exp(-distContact * 1.15) * 0.35;
           float fade = exp(-uTouchAge * 1.35) * exp(-distContact * 0.24);
           vec3 liquidTint = mix(uTouchColor, uAfterglowGold, clamp(secondary * 1.4, 0.0, 1.0));
           totalEmissiveRadiance += liquidTint * (crest * 1.35 + secondary + halo) * fade;
         }
         if (uAfterglow > 0.005) {
           vec3 rimN = normalize(normal);
           vec3 rimV = normalize(vViewPosition);
           float fresnelRim = pow(1.0 - clamp(abs(dot(rimN, rimV)), 0.0, 1.0), 2.35);
           float pulseWave = 0.5 + 0.5 * sin(uRippleTime * 1.85 + vRippleWorldPos.y * 2.4);
           vec3 wonderCol = mix(uAfterglowEmerald, uAfterglowGold, pulseWave * 0.65);
           totalEmissiveRadiance += wonderCol * fresnelRim * 0.52 * uAfterglow;
         }`
      );
  };

  material.needsUpdate = true;
  return material;
}

class TactileTouchFXController {
  constructor() {
    this.surfaces = [];
    this.proximityTargets = [];
    this.springTargets = new Map();
    this.activeSprings = [];
    this.rememberedKeys = new Set();

    this.sceneEl = null;
    this.fxGroup = null;
    this.shockwavePool = [];
    this.sparkPool = [];
    this.proximityLine = null;
    this.proximityPositions = null;
    this.proximityColors = null;
    this.disposables = [];

    this.elapsed = 0;
    this.lastAudioTime = 0;
    this.lastTouchTime = 0;
    this.hoverCursorWorld = new THREE.Vector3();
    this.hasHoverCursor = false;

    this._v1 = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._v3 = new THREE.Vector3();
    this._v4 = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this._zAxis = new THREE.Vector3(0, 0, 1);
    this._quat = new THREE.Quaternion();
    this._colorA = new THREE.Color();
    this._colorB = new THREE.Color();
    this._raycaster = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();
    this._normalMatrix = new THREE.Matrix3();
  }

  attachScene(sceneEl) {
    if (this.sceneEl === sceneEl && this.fxGroup) return;
    this.dispose();
    this.sceneEl = sceneEl;
    this.fxGroup = new THREE.Group();
    this.fxGroup.name = 'tabsirah-tactile-touch-fx';
    sceneEl.object3D.add(this.fxGroup);

    this._buildShockwavePool();
    this._buildSparkBurstPool();
    this._buildProximityAura();
  }

  _buildShockwavePool() {
    const sphereGeo = new THREE.SphereGeometry(0.18, 28, 20);
    const planeGeo = new THREE.PlaneGeometry(0.88, 0.88);
    this.disposables.push(sphereGeo, planeGeo);

    const sphereVert = `
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;
      void main() {
        vUv = uv;
        vLocalPos = position;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalV = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const sphereFrag = `
      uniform float uProgress;
      uniform vec3 uCyan;
      uniform vec3 uEmerald;
      uniform vec3 uGold;
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        float fresnel = pow(1.0 - clamp(abs(dot(normalize(vNormalV), normalize(vViewDir))), 0.0, 1.0), 1.75);
        float theta = atan(vLocalPos.z, vLocalPos.x);
        float phi = acos(clamp(normalize(vLocalPos).y, -1.0, 1.0));
        // 16-fold Islamic geometric star interference lattice
        float g1 = cos(theta * 8.0 + uProgress * 4.0) * cos(phi * 8.0 - uProgress * 3.0);
        float g2 = sin(theta * 16.0 - phi * 8.0);
        float lattice = smoothstep(0.45, 0.92, abs(g1) * 0.72 + abs(g2) * 0.28);

        // Chromatic dispersion split across sphere shell edge
        float rBand = smoothstep(0.15, 0.85, fresnel + 0.08 * sin(uProgress * 6.28));
        float gBand = smoothstep(0.18, 0.88, fresnel);
        float bBand = smoothstep(0.12, 0.82, fresnel - 0.06);

        vec3 dispCol = uCyan * bBand + uEmerald * gBand * 0.85 + uGold * rBand * 0.75;
        vec3 col = mix(dispCol, mix(uGold, uCyan, 0.45), lattice * 0.62);

        float dust = step(0.86, hash21(floor(vUv * 42.0) + floor(uProgress * 12.0))) * uProgress;
        float env = sin(clamp(uProgress, 0.0, 1.0) * 3.14159) * (1.0 - uProgress * 0.65);
        float alpha = (fresnel * 0.82 + lattice * 0.34 + dust * 0.45) * env;
        gl_FragColor = vec4(col * 1.35, clamp(alpha, 0.0, 0.92));
      }
    `;

    const planeVert = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const planeFrag = `
      uniform float uProgress;
      uniform vec3 uCyan;
      uniform vec3 uEmerald;
      uniform vec3 uGold;
      varying vec2 vUv;

      float hash21(vec2 p) {
        p = fract(p * vec2(234.12, 567.89));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        if (r > 1.0) discard;
        float ang = atan(p.y, p.x);

        float radius = 0.08 + uProgress * 0.84;
        // Razor-sharp chromatic dispersion ring splitting cyan, emerald, and gold edges
        float ringCyan = exp(-pow((r - (radius - 0.024)) * 28.0, 2.0));
        float ringEmerald = exp(-pow((r - radius) * 30.0, 2.0));
        float ringGold = exp(-pow((r - (radius + 0.024)) * 28.0, 2.0));

        // 16-fold Islamic geometric girih rosette interference
        float rosette16 = abs(cos(ang * 8.0)) * abs(cos(ang * 8.0 + 1.57079));
        float radialHarmonic = sin(r * 22.0 - uProgress * 14.0) * 0.5 + 0.5;
        float starWeb = smoothstep(0.18, 0.82, rosette16 * 1.4) * radialHarmonic * exp(-abs(r - radius) * 5.2);

        // Stardust dissolve near end of lifecycle
        float dustMask = smoothstep(0.35, 1.0, uProgress);
        float stardust = step(0.84, hash21(floor(vUv * 54.0))) * exp(-abs(r - radius) * 7.5) * dustMask;

        vec3 col = uCyan * ringCyan * 1.25
                 + uEmerald * ringEmerald * 1.2
                 + uGold * (ringGold * 1.3 + starWeb * 0.95 + stardust * 1.4);

        float fade = (1.0 - smoothstep(0.55, 1.0, uProgress)) * smoothstep(1.0, 0.82, r);
        float alpha = (ringCyan + ringEmerald + ringGold) * 0.65 + starWeb * 0.45 + stardust * 0.7;
        gl_FragColor = vec4(col, clamp(alpha * fade, 0.0, 0.95));
      }
    `;

    for (let i = 0; i < 6; i++) {
      const holder = new THREE.Group();
      holder.visible = false;

      const sphereMat = new THREE.ShaderMaterial({
        uniforms: {
          uProgress: { value: 0 },
          uCyan: { value: new THREE.Color('#22D3EE') },
          uEmerald: { value: new THREE.Color('#34D399') },
          uGold: { value: new THREE.Color('#FBBF24') }
        },
        vertexShader: sphereVert,
        fragmentShader: sphereFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      const planeMat = new THREE.ShaderMaterial({
        uniforms: {
          uProgress: { value: 0 },
          uCyan: { value: new THREE.Color('#22D3EE') },
          uEmerald: { value: new THREE.Color('#34D399') },
          uGold: { value: new THREE.Color('#FBBF24') }
        },
        vertexShader: planeVert,
        fragmentShader: planeFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      const planeMesh = new THREE.Mesh(planeGeo, planeMat);
      holder.add(sphereMesh, planeMesh);
      this.fxGroup.add(holder);
      this.disposables.push(sphereMat, planeMat);

      this.shockwavePool.push({
        holder,
        sphereMesh,
        sphereMat,
        planeMesh,
        planeMat,
        active: false,
        age: 0,
        duration: 1.1
      });
    }
  }

  _buildSparkBurstPool() {
    const glowTex = createSparkGlowTexture();
    this.disposables.push(glowTex);
    const count = 60;

    for (let s = 0; s < 4; s++) {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const seeds = new Float32Array(count);

      const geo = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(positions, 3);
      const colAttr = new THREE.BufferAttribute(colors, 3);
      geo.setAttribute('position', posAttr);
      geo.setAttribute('color', colAttr);

      const mat = new THREE.PointsMaterial({
        size: 0.085,
        map: glowTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      points.visible = false;
      this.fxGroup.add(points);
      this.disposables.push(geo, mat);

      this.sparkPool.push({
        points,
        mat,
        posAttr,
        colAttr,
        positions,
        colors,
        velocities,
        seeds,
        origin: new THREE.Vector3(),
        attractTarget: new THREE.Vector3(),
        hasAttractTarget: false,
        count,
        active: false,
        age: 0,
        duration: 1.35
      });
    }
  }

  _buildProximityAura() {
    const filamentCount = 12;
    const segsPerFilament = 4;
    const totalVerts = filamentCount * segsPerFilament * 2;
    this.proximityFilamentCount = filamentCount;
    this.proximitySegs = segsPerFilament;

    this.proximityPositions = new Float32Array(totalVerts * 3);
    this.proximityColors = new Float32Array(totalVerts * 3);

    const geo = new THREE.BufferGeometry();
    this.proximityPosAttr = new THREE.BufferAttribute(this.proximityPositions, 3);
    this.proximityColAttr = new THREE.BufferAttribute(this.proximityColors, 3);
    geo.setAttribute('position', this.proximityPosAttr);
    geo.setAttribute('color', this.proximityColAttr);

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.proximityLine = new THREE.LineSegments(geo, mat);
    this.proximityLine.frustumCulled = false;
    this.proximityLine.visible = false;
    this.fxGroup.add(this.proximityLine);
    this.disposables.push(geo, mat);
  }

  registerInteractiveSurface(object3D, options = {}) {
    if (!object3D) return;
    this.unregisterInteractiveSurface(object3D);

    const materials = [];
    const collectMat = (m) => {
      if (!m) return;
      if (Array.isArray(m)) m.forEach(collectMat);
      else if (m.isMeshStandardMaterial && !materials.includes(m)) {
        applySurfaceRippleMaterial(m, {
          color: options.color || BIOME_TOUCH_COLORS[options.biomeId] || '#22D3EE',
          rippleScale: options.rippleScale || 1.0,
          afterglow: options.specimenKey ? this.rememberedKeys.has(options.specimenKey) : false
        });
        materials.push(m);
      }
    };

    if (options.materials) {
      options.materials.forEach(collectMat);
    } else if (object3D.isMesh || object3D.isInstancedMesh) {
      collectMat(object3D.material);
    } else {
      object3D.traverse?.((child) => {
        if (child.material) collectMat(child.material);
      });
    }

    const entry = {
      obj: object3D,
      materials,
      biomeId: options.biomeId || window.tabsirahActiveBiome || 'aurora',
      specimenKey: options.specimenKey || null,
      proximityCenter: options.proximityCenter ? options.proximityCenter.clone() : null,
      proximityRadius: options.proximityRadius || 0.35,
      isProximityTarget: Boolean(options.proximityTarget),
      springTarget: options.springTarget || null,
      springOptions: options.springOptions || null
    };

    this.surfaces.push(entry);
    if (entry.isProximityTarget) {
      this.proximityTargets.push(entry);
    }
    if (entry.springTarget) {
      this.registerSpringTarget(entry.springTarget, entry.springOptions || {});
    }
  }

  unregisterInteractiveSurface(object3D) {
    if (!object3D) return;
    this.surfaces = this.surfaces.filter((s) => s.obj !== object3D);
    this.proximityTargets = this.proximityTargets.filter((s) => s.obj !== object3D);
    this.unregisterSpringTarget(object3D);
  }

  registerSpringTarget(object3D, options = {}) {
    if (!object3D) return;
    this.springTargets.set(object3D, {
      obj: object3D,
      basePos: object3D.position.clone(),
      baseScale: object3D.scale.clone(),
      liftAmount: options.liftAmount ?? 0.055,
      recoilAmount: options.recoilAmount ?? 0.065,
      squashAmount: options.squashAmount ?? 0.11
    });
  }

  unregisterSpringTarget(object3D) {
    if (!object3D) return;
    this.springTargets.delete(object3D);
    this.activeSprings = this.activeSprings.filter((slot) => slot.obj !== object3D);
  }

  markRemembered(specimenKey, materials = null) {
    if (specimenKey) this.rememberedKeys.add(specimenKey);
    if (materials) {
      materials.forEach((m) => {
        if (m?.userData?.touchRippleUniforms) {
          m.userData.touchRippleUniforms.uAfterglow.value = 1.0;
        }
      });
    }
    this.surfaces.forEach((s) => {
      if (specimenKey && s.specimenKey === specimenKey) {
        s.materials.forEach((m) => {
          if (m?.userData?.touchRippleUniforms) {
            m.userData.touchRippleUniforms.uAfterglow.value = 1.0;
          }
        });
      }
    });
  }

  isRemembered(specimenKey) {
    return Boolean(specimenKey && this.rememberedKeys.has(specimenKey));
  }

  _spawnShockwave(worldPoint, worldNormal, biomeId) {
    // Pick free slot or oldest active slot
    let slot = this.shockwavePool.find((s) => !s.active);
    if (!slot) {
      slot = this.shockwavePool.reduce((oldest, curr) => (curr.age > oldest.age ? curr : oldest), this.shockwavePool[0]);
    }

    slot.active = true;
    slot.age = 0;
    slot.holder.visible = true;
    slot.holder.position.copy(worldPoint);
    slot.holder.scale.setScalar(0.32);

    // Align planar disc to surface contact normal (defaults to upward facing if flat/sky)
    if (worldNormal && worldNormal.lengthSq() > 0.001) {
      this._v1.copy(worldNormal).normalize();
      this._quat.setFromUnitVectors(this._zAxis, this._v1);
      slot.planeMesh.quaternion.copy(this._quat);
    } else {
      slot.planeMesh.rotation.set(-Math.PI / 2, 0, 0);
    }

    const accentHex = BIOME_TOUCH_COLORS[biomeId] || '#34D399';
    const secHex = BIOME_SECONDARY_COLORS[biomeId] || '#22D3EE';
    slot.sphereMat.uniforms.uProgress.value = 0;
    slot.sphereMat.uniforms.uEmerald.value.set(accentHex);
    slot.sphereMat.uniforms.uCyan.value.set(secHex);
    slot.planeMat.uniforms.uProgress.value = 0;
    slot.planeMat.uniforms.uEmerald.value.set(accentHex);
    slot.planeMat.uniforms.uCyan.value.set(secHex);
  }

  _spawnSparkBurst(worldPoint, handPos, biomeId) {
    let slot = this.sparkPool.find((s) => !s.active);
    if (!slot) {
      slot = this.sparkPool.reduce((oldest, curr) => (curr.age > oldest.age ? curr : oldest), this.sparkPool[0]);
    }

    slot.active = true;
    slot.age = 0;
    slot.points.visible = true;
    slot.mat.opacity = 0.96;
    slot.origin.copy(worldPoint);
    if (handPos && handPos.lengthSq() > 0.0001) {
      slot.attractTarget.copy(handPos);
      slot.hasAttractTarget = true;
    } else {
      slot.hasAttractTarget = false;
    }

    const colPrimary = this._colorA.set(BIOME_TOUCH_COLORS[biomeId] || '#34D399');
    const colGold = this._colorB.set('#FBBF24');

    for (let i = 0; i < slot.count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r0 = 0.02 + Math.random() * 0.06;

      slot.positions[i3] = worldPoint.x + Math.sin(phi) * Math.cos(theta) * r0;
      slot.positions[i3 + 1] = worldPoint.y + Math.cos(phi) * r0;
      slot.positions[i3 + 2] = worldPoint.z + Math.sin(phi) * Math.sin(theta) * r0;

      const speed = 0.55 + Math.random() * 0.95;
      slot.velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      slot.velocities[i3 + 1] = 0.35 + Math.abs(Math.cos(phi)) * speed * 0.8;
      slot.velocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

      slot.seeds[i] = Math.random() * 6.283;

      const mixT = (i % 5) / 4;
      slot.colors[i3] = THREE.MathUtils.lerp(colPrimary.r, colGold.r, mixT);
      slot.colors[i3 + 1] = THREE.MathUtils.lerp(colPrimary.g, colGold.g, mixT);
      slot.colors[i3 + 2] = THREE.MathUtils.lerp(colPrimary.b, colGold.b, mixT);
    }

    slot.posAttr.needsUpdate = true;
    slot.colAttr.needsUpdate = true;
  }

  _triggerSurfaceRipples(worldPoint, targetObj, biomeId) {
    const tint = BIOME_TOUCH_COLORS[biomeId] || '#22D3EE';
    let hitAny = false;

    for (let i = 0; i < this.surfaces.length; i++) {
      const s = this.surfaces[i];
      if (s.biomeId && s.biomeId !== biomeId) continue;

      const isTargetMatch =
        targetObj &&
        (s.obj === targetObj ||
          (typeof targetObj.getObjectById === 'function' && s.obj.parent === targetObj));

      if (!targetObj || isTargetMatch || !s.isProximityTarget) {
        for (let m = 0; m < s.materials.length; m++) {
          const u = s.materials[m]?.userData?.touchRippleUniforms;
          if (!u) continue;
          u.uTouchPoint.value.copy(worldPoint);
          u.uTouchAge.value = 0.0;
          u.uTouchColor.value.set(tint);
          if (isTargetMatch && s.specimenKey) {
            this.rememberedKeys.add(s.specimenKey);
            u.uAfterglow.value = 1.0;
          }
          hitAny = true;
        }
      }
    }

    if (!hitAny && targetObj) {
      targetObj.traverse?.((child) => {
        const u = child.material?.userData?.touchRippleUniforms;
        if (u) {
          u.uTouchPoint.value.copy(worldPoint);
          u.uTouchAge.value = 0.0;
          u.uTouchColor.value.set(tint);
        }
      });
    }
  }

  _triggerSpringImpulse(springObj, worldNormal) {
    if (!springObj) return;
    let reg = this.springTargets.get(springObj);
    if (!reg) {
      this.registerSpringTarget(springObj);
      reg = this.springTargets.get(springObj);
    }
    if (!reg) return;

    let slot = this.activeSprings.find((s) => s.obj === springObj);
    if (!slot) {
      if (this.activeSprings.length >= 12) {
        const oldest = this.activeSprings.shift();
        oldest.obj.position.copy(oldest.basePos);
        oldest.obj.scale.copy(oldest.baseScale);
      }
      slot = {
        obj: springObj,
        basePos: reg.basePos.clone(),
        baseScale: reg.baseScale.clone(),
        disp: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        scaleDisp: 0,
        scaleVel: 0
      };
      this.activeSprings.push(slot);
    }

    // Recoil inward along surface normal + gentle upward levitation lift + squash impulse
    const n = worldNormal && worldNormal.lengthSq() > 0.001 ? this._v1.copy(worldNormal).normalize() : this._v1.set(0, 1, 0);
    slot.vel.addScaledVector(n, -reg.recoilAmount * 14.0);
    slot.vel.y += reg.liftAmount * 18.0;
    slot.scaleVel -= reg.squashAmount * 18.0;
  }

  _triggerBiomeHapticsAndAudio(biomeId, worldPoint) {
    const now = performance.now();
    if (now - this.lastAudioTime > 85) {
      this.lastAudioTime = now;
      natureAudio.playTactileSignature(biomeId, worldPoint);
    }

    if (window.tabsirahHaptics) {
      window.tabsirahHaptics.playPattern('beacon-touch', { biomeId });
      return;
    }

    if (biomeId === 'aurora') {
      window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.55, duration: 28 } }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.45, duration: 24 } }));
      }, 75);
    } else if (biomeId === 'rainforest') {
      window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.32, duration: 55 } }));
    } else if (biomeId === 'ocean') {
      window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.42, duration: 72 } }));
    } else if (biomeId === 'desert') {
      window.dispatchEvent(new CustomEvent('trigger-haptic', { detail: { intensity: 0.38, duration: 46 } }));
    }
  }

  trigger(detail = {}) {
    if (!this.sceneEl || !this.fxGroup) return;
    const now = performance.now();
    if (now - this.lastTouchTime < 45 && !detail.force) return;
    this.lastTouchTime = now;

    const biomeId = detail.biomeId || window.tabsirahActiveBiome || 'aurora';
    const el = detail.el || null;
    const obj = detail.meshTarget || el?.object3D || null;

    const worldPoint = this._v2;
    if (detail.worldPoint) {
      worldPoint.copy(detail.worldPoint);
    } else if (obj) {
      obj.getWorldPosition(worldPoint);
    } else {
      worldPoint.set(0, 1.3, -2.5);
    }

    const worldNormal = this._v3;
    if (detail.worldNormal) {
      worldNormal.copy(detail.worldNormal).normalize();
    } else {
      worldNormal.set(0, 1, 0);
    }

    const handPos = detail.handPos || (this.hasHoverCursor ? this.hoverCursorWorld : null);

    // Effect 1: Custom GLSL Energy Shockwave & Chromatic Fresnel Ripple
    this._spawnShockwave(worldPoint, worldNormal, biomeId);

    // Effect 2: Contact-Point Liquid-Light Surface Displacement
    this._triggerSurfaceRipples(worldPoint, obj, biomeId);

    // Effect 3: Magnetic Fingertip Particle Tendrils & Bioluminescent Sparks
    this._spawnSparkBurst(worldPoint, handPos, biomeId);

    // Effect 4: Elastic Spring-Physics Squash, Recoil & Levitation
    const springObj = detail.springTarget || (obj && this.springTargets.has(obj) ? obj : null);
    if (springObj) {
      this._triggerSpringImpulse(springObj, worldNormal);
    }

    // Effect 5: Biome-Adaptive Haptic & Harmonic Audio Signatures
    if (!detail.silent) {
      this._triggerBiomeHapticsAndAudio(biomeId, worldPoint);
    }

    // Effect 6: Persistent "Memory of Wonder" Bioluminescent Afterglow
    if (detail.specimenKey) {
      this.markRemembered(detail.specimenKey, detail.materials || null);
      window.dispatchEvent(
        new CustomEvent('tabsirah-specimen-remembered', {
          detail: { key: detail.specimenKey, biomeId }
        })
      );
    }
  }

  _updateProximityAura(t) {
    if (!this.proximityLine || !this.proximityTargets.length) {
      if (this.proximityLine) this.proximityLine.visible = false;
      return;
    }

    // Find active hand position in XR, or hovered desktop raycast point
    let sourcePos = null;
    const isXR = this.sceneEl?.is('vr-mode') || this.sceneEl?.is('ar-mode');
    if (isXR) {
      if (!this._cachedHands) {
        this._cachedHands = [document.getElementById('right-hand'), document.getElementById('left-hand')];
      }
      let bestDistSq = 999;
      for (let h = 0; h < this._cachedHands.length; h++) {
        const hEl = this._cachedHands[h];
        if (!hEl?.isConnected || !hEl?.object3D) continue;
        hEl.object3D.getWorldPosition(this._v1);
        if (this._v1.lengthSq() < 0.0005) continue;
        for (let i = 0; i < this.proximityTargets.length; i++) {
          const tgt = this.proximityTargets[i];
          if (!tgt.obj.visible) continue;
          if (tgt.proximityCenter) this._v2.copy(tgt.proximityCenter);
          else tgt.obj.getWorldPosition(this._v2);
          const dSq = this._v1.distanceToSquared(this._v2);
          if (dSq < bestDistSq) {
            bestDistSq = dSq;
            this._v4.copy(this._v1);
            sourcePos = this._v4;
          }
        }
      }
    } else if (this.hasHoverCursor) {
      sourcePos = this.hoverCursorWorld;
    }

    if (!sourcePos) {
      this.proximityLine.visible = false;
      return;
    }

    let nearestTargetPos = null;
    let nearestDist = 0.35;
    let nearestBiome = window.tabsirahActiveBiome || 'aurora';

    for (let i = 0; i < this.proximityTargets.length; i++) {
      const tgt = this.proximityTargets[i];
      if (!tgt.obj.visible) continue;
      if (tgt.proximityCenter) {
        this._v2.copy(tgt.proximityCenter);
      } else {
        tgt.obj.getWorldPosition(this._v2);
      }
      const d = sourcePos.distanceTo(this._v2);
      if (d <= (tgt.proximityRadius || 0.35) && d < nearestDist) {
        nearestDist = d;
        this._v3.copy(this._v2);
        nearestTargetPos = this._v3;
        nearestBiome = tgt.biomeId || nearestBiome;
      }
    }

    if (!nearestTargetPos) {
      this.proximityLine.visible = false;
      return;
    }

    this.proximityLine.visible = true;
    const strength = THREE.MathUtils.clamp(1.0 - nearestDist / 0.35, 0.2, 1.0);
    this.proximityLine.material.opacity = 0.42 + strength * 0.48;

    const cA = this._colorA.set(BIOME_TOUCH_COLORS[nearestBiome] || '#22D3EE');
    const cB = this._colorB.set('#FBBF24');

    let ptr = 0;
    const filCount = this.proximityFilamentCount;
    const segs = this.proximitySegs;
    for (let f = 0; f < filCount; f++) {
      const ang = (f / filCount) * Math.PI * 2 + t * 2.1;
      const arcSpread = 0.045 + Math.sin(t * 4.5 + f) * 0.018;
      for (let s = 0; s < segs; s++) {
        const u0 = s / segs;
        const u1 = (s + 1) / segs;
        const arch0 = Math.sin(u0 * Math.PI) * arcSpread;
        const arch1 = Math.sin(u1 * Math.PI) * arcSpread;

        const x0 = THREE.MathUtils.lerp(sourcePos.x, nearestTargetPos.x, u0) + Math.cos(ang + u0 * 2.4) * arch0;
        const y0 = THREE.MathUtils.lerp(sourcePos.y, nearestTargetPos.y, u0) + Math.sin(ang * 1.3 + u0 * 2.4) * arch0;
        const z0 = THREE.MathUtils.lerp(sourcePos.z, nearestTargetPos.z, u0) + Math.sin(ang - u0 * 2.0) * arch0;

        const x1 = THREE.MathUtils.lerp(sourcePos.x, nearestTargetPos.x, u1) + Math.cos(ang + u1 * 2.4) * arch1;
        const y1 = THREE.MathUtils.lerp(sourcePos.y, nearestTargetPos.y, u1) + Math.sin(ang * 1.3 + u1 * 2.4) * arch1;
        const z1 = THREE.MathUtils.lerp(sourcePos.z, nearestTargetPos.z, u1) + Math.sin(ang - u1 * 2.0) * arch1;

        this.proximityPositions[ptr] = x0;
        this.proximityPositions[ptr + 1] = y0;
        this.proximityPositions[ptr + 2] = z0;
        this.proximityPositions[ptr + 3] = x1;
        this.proximityPositions[ptr + 4] = y1;
        this.proximityPositions[ptr + 5] = z1;

        const mixT = u0;
        const r = THREE.MathUtils.lerp(cA.r, cB.r, mixT);
        const g = THREE.MathUtils.lerp(cA.g, cB.g, mixT);
        const b = THREE.MathUtils.lerp(cA.b, cB.b, mixT);
        this.proximityColors[ptr] = r;
        this.proximityColors[ptr + 1] = g;
        this.proximityColors[ptr + 2] = b;
        this.proximityColors[ptr + 3] = r;
        this.proximityColors[ptr + 4] = g;
        this.proximityColors[ptr + 5] = b;
        ptr += 6;
      }
    }

    this.proximityPosAttr.needsUpdate = true;
    this.proximityColAttr.needsUpdate = true;
  }

  tick(timeDelta) {
    if (!timeDelta || !this.fxGroup) return;
    const dt = Math.min(timeDelta, 50) / 1000;
    this.elapsed += dt;

    // 1. Update Shockwave Pool
    for (let i = 0; i < this.shockwavePool.length; i++) {
      const sw = this.shockwavePool[i];
      if (!sw.active) continue;
      sw.age += dt;
      const p = sw.age / sw.duration;
      if (p >= 1.0) {
        sw.active = false;
        sw.holder.visible = false;
        continue;
      }
      const easeOut = 1.0 - Math.pow(1.0 - p, 2.2);
      sw.holder.scale.setScalar(0.32 + easeOut * 1.65);
      sw.sphereMat.uniforms.uProgress.value = p;
      sw.planeMat.uniforms.uProgress.value = p;
    }

    // 2. Advance Surface Ripple Material Ages
    for (let i = 0; i < this.surfaces.length; i++) {
      const mats = this.surfaces[i].materials;
      for (let m = 0; m < mats.length; m++) {
        const u = mats[m]?.userData?.touchRippleUniforms;
        if (!u) continue;
        u.uRippleTime.value = this.elapsed;
        if (u.uTouchAge.value < 5.0) {
          u.uTouchAge.value += dt;
        }
      }
    }

    // 3. Update Pooled Spark Bursts (Curl-like swirl + initial magnetic fingertip arc)
    for (let s = 0; s < this.sparkPool.length; s++) {
      const burst = this.sparkPool[s];
      if (!burst.active) continue;
      burst.age += dt;
      const p = burst.age / burst.duration;
      if (p >= 1.0) {
        burst.active = false;
        burst.points.visible = false;
        continue;
      }

      burst.mat.opacity = Math.sin(p * Math.PI) * (1.0 - p * 0.45);
      const magStrength = burst.hasAttractTarget && p < 0.28 ? (1.0 - p / 0.28) * 3.8 : 0.0;

      for (let i = 0; i < burst.count; i++) {
        const i3 = i * 3;
        const seed = burst.seeds[i];

        if (magStrength > 0.01) {
          burst.velocities[i3] += (burst.attractTarget.x - burst.positions[i3]) * magStrength * dt;
          burst.velocities[i3 + 1] += (burst.attractTarget.y - burst.positions[i3 + 1]) * magStrength * dt;
          burst.velocities[i3 + 2] += (burst.attractTarget.z - burst.positions[i3 + 2]) * magStrength * dt;
        }

        // Helical curl-noise drift + buoyant upward float
        const swirlX = Math.cos(this.elapsed * 4.2 + seed) * 0.65;
        const swirlZ = Math.sin(this.elapsed * 3.9 + seed * 1.3) * 0.65;
        burst.velocities[i3] = (burst.velocities[i3] + swirlX * dt) * (1.0 - dt * 1.4);
        burst.velocities[i3 + 1] = burst.velocities[i3 + 1] * (1.0 - dt * 0.9) + 0.55 * dt;
        burst.velocities[i3 + 2] = (burst.velocities[i3 + 2] + swirlZ * dt) * (1.0 - dt * 1.4);

        burst.positions[i3] += burst.velocities[i3] * dt;
        burst.positions[i3 + 1] += burst.velocities[i3 + 1] * dt;
        burst.positions[i3 + 2] += burst.velocities[i3 + 2] * dt;
      }
      burst.posAttr.needsUpdate = true;
    }

    // 4. Damped Harmonic Spring Physics (stiffness: 180, damping: 12)
    const stiffness = 180.0;
    const damping = 12.0;
    for (let i = this.activeSprings.length - 1; i >= 0; i--) {
      const slot = this.activeSprings[i];
      if (!slot.obj?.parent) {
        this.activeSprings.splice(i, 1);
        continue;
      }
      const ax = -stiffness * slot.disp.x - damping * slot.vel.x;
      const ay = -stiffness * slot.disp.y - damping * slot.vel.y;
      const az = -stiffness * slot.disp.z - damping * slot.vel.z;

      slot.vel.x += ax * dt;
      slot.vel.y += ay * dt;
      slot.vel.z += az * dt;
      slot.disp.addScaledVector(slot.vel, dt);

      const as = -stiffness * slot.scaleDisp - damping * slot.scaleVel;
      slot.scaleVel += as * dt;
      slot.scaleDisp += slot.scaleVel * dt;

      slot.obj.position.copy(slot.basePos).add(slot.disp);
      const sy = Math.max(0.75, 1.0 + slot.scaleDisp);
      const sxz = Math.max(0.85, 1.0 - slot.scaleDisp * 0.55);
      slot.obj.scale.set(
        slot.baseScale.x * sxz,
        slot.baseScale.y * sy,
        slot.baseScale.z * sxz
      );

      if (
        slot.disp.lengthSq() < 0.000001 &&
        slot.vel.lengthSq() < 0.00001 &&
        Math.abs(slot.scaleDisp) < 0.0005 &&
        Math.abs(slot.scaleVel) < 0.002
      ) {
        slot.obj.position.copy(slot.basePos);
        slot.obj.scale.copy(slot.baseScale);
        this.activeSprings.splice(i, 1);
      }
    }

    // 5. Proximity Pre-Touch Aura
    this._updateProximityAura(this.elapsed);
  }

  extractIntersection(evt, fallbackEl) {
    let worldPoint = null;
    let worldNormal = null;

    const inter =
      evt?.detail?.intersection ||
      this.sceneEl?.components?.raycaster?.getIntersection?.(fallbackEl) ||
      document.getElementById('right-controller')?.components?.raycaster?.getIntersection?.(fallbackEl) ||
      document.getElementById('left-controller')?.components?.raycaster?.getIntersection?.(fallbackEl);

    if (inter?.point) {
      worldPoint = inter.point.clone();
      if (inter.face?.normal && inter.object) {
        this._normalMatrix.getNormalMatrix(inter.object.matrixWorld);
        worldNormal = inter.face.normal.clone().applyMatrix3(this._normalMatrix).normalize();
      }
    }
    return { worldPoint, worldNormal };
  }

  dispose() {
    this.surfaces = [];
    this.proximityTargets = [];
    this.springTargets.clear();
    this.activeSprings = [];
    if (this.fxGroup?.parent) {
      this.fxGroup.parent.remove(this.fxGroup);
    }
    this.disposables.forEach((d) => d?.dispose?.());
    this.disposables = [];
    this.shockwavePool = [];
    this.sparkPool = [];
    this.fxGroup = null;
  }
}

export const tactileTouchFX = new TactileTouchFXController();
if (typeof window !== 'undefined') {
  window.tabsirahTouchFX = tactileTouchFX;
}

if (typeof AFRAME !== 'undefined' && !AFRAME.components['tactile-touch-fx']) {
  AFRAME.registerComponent('tactile-touch-fx', {
    init: function () {
      const sceneEl = this.el.sceneEl || this.el;
      tactileTouchFX.attachScene(sceneEl);

      this.onCustomTouch = (evt) => {
        tactileTouchFX.trigger(evt.detail || {});
      };

      // Catch clicks/pinches on interactive nodes (e.g. Prism, Turing Sphere, Voronoi Mesh)
      // while deferring to elements with data-tactile-handled="true" that emit rich custom FX
      this.onSceneClick = (evt) => {
        const targetEl = evt.target;
        if (!targetEl || !targetEl.classList?.contains('interactive-node')) return;
        if (targetEl.dataset?.tactileHandled === 'true') return;
        const { worldPoint, worldNormal } = tactileTouchFX.extractIntersection(evt, targetEl);
        tactileTouchFX.trigger({
          el: targetEl,
          worldPoint,
          worldNormal,
          biomeId: window.tabsirahActiveBiome,
          specimenKey: targetEl.dataset?.specimenKey || targetEl.id || null
        });
      };

      this.onScenePinch = (evt) => {
        const targetEl = evt.target;
        if (!targetEl || !targetEl.classList?.contains('interactive-node')) return;
        if (targetEl.dataset?.tactileHandled === 'true') return;
        let handPos = null;
        if (evt.detail?.hand) {
          const hEl = document.getElementById(evt.detail.hand);
          if (hEl?.object3D) {
            handPos = new THREE.Vector3();
            hEl.object3D.getWorldPosition(handPos);
          }
        }
        tactileTouchFX.trigger({
          el: targetEl,
          handPos,
          biomeId: window.tabsirahActiveBiome,
          specimenKey: targetEl.dataset?.specimenKey || targetEl.id || null
        });
      };

      this.downPos = null;
      this.onCanvasPointerDown = (e) => {
        if (e.target !== sceneEl.canvas) return;
        this.downPos = { x: e.clientX, y: e.clientY, time: performance.now() };
      };

      // Catch desktop terrain / seabed / sand / glacier surface taps for Liquid Light ripples
      this.onCanvasPointerUp = (e) => {
        if (!this.downPos || e.target !== sceneEl.canvas) {
          this.downPos = null;
          return;
        }
        const dragDist = Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y);
        const dragTime = performance.now() - this.downPos.time;
        this.downPos = null;
        if (dragDist > 8 || dragTime > 450) return;

        const camera = sceneEl.camera;
        const canvas = sceneEl.canvas;
        if (!camera || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        tactileTouchFX._ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        tactileTouchFX._ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        tactileTouchFX._raycaster.setFromCamera(tactileTouchFX._ndc, camera);

        const container = document.getElementById('biome-container');
        if (!container?.object3D) return;
        const hits = tactileTouchFX._raycaster.intersectObjects(container.object3D.children, true);
        const visibleHit = hits.find((h) => {
          const m = h.object?.material;
          return h.object?.visible && (!m || m.opacity === undefined || m.opacity > 0.05);
        });
        if (visibleHit && visibleHit.distance < 32) {
          tactileTouchFX._normalMatrix.getNormalMatrix(visibleHit.object.matrixWorld);
          const n = visibleHit.face?.normal
            ? visibleHit.face.normal.clone().applyMatrix3(tactileTouchFX._normalMatrix).normalize()
            : new THREE.Vector3(0, 1, 0);
          tactileTouchFX.trigger({
            meshTarget: visibleHit.object,
            worldPoint: visibleHit.point,
            worldNormal: n,
            biomeId: window.tabsirahActiveBiome,
            silent: true
          });
        }
      };

      // Desktop cursor proximity tracking for 0.35m Pre-Touch Aura
      this.onPointerMove = (e) => {
        if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;
        const camera = sceneEl.camera;
        const canvas = sceneEl.canvas;
        if (!camera || !canvas || !tactileTouchFX.proximityTargets.length) {
          tactileTouchFX.hasHoverCursor = false;
          return;
        }
        const rect = canvas.getBoundingClientRect();
        tactileTouchFX._ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        tactileTouchFX._ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        tactileTouchFX._raycaster.setFromCamera(tactileTouchFX._ndc, camera);

        let bestDist = 999;
        let bestTarget = null;
        for (let i = 0; i < tactileTouchFX.proximityTargets.length; i++) {
          const tgt = tactileTouchFX.proximityTargets[i];
          if (!tgt.obj.visible) continue;
          if (tgt.proximityCenter) tactileTouchFX._v1.copy(tgt.proximityCenter);
          else tgt.obj.getWorldPosition(tactileTouchFX._v1);
          const rayDist = tactileTouchFX._raycaster.ray.distanceToPoint(tactileTouchFX._v1);
          if (rayDist < (tgt.proximityRadius || 0.35) && rayDist < bestDist) {
            bestDist = rayDist;
            bestTarget = tgt;
            tactileTouchFX._raycaster.ray.closestPointToPoint(tactileTouchFX._v1, tactileTouchFX.hoverCursorWorld);
          }
        }
        tactileTouchFX.hasHoverCursor = Boolean(bestTarget);
      };

      window.addEventListener('tabsirah-tactile-touch', this.onCustomTouch);
      sceneEl.addEventListener('tabsirah-tactile-touch', this.onCustomTouch);
      sceneEl.addEventListener('click', this.onSceneClick, true);
      sceneEl.addEventListener('pinchstarted', this.onScenePinch, true);
      window.addEventListener('pointerdown', this.onCanvasPointerDown, { passive: true });
      window.addEventListener('pointerup', this.onCanvasPointerUp, { passive: true });
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    },

    tick: function (time, timeDelta) {
      tactileTouchFX.tick(timeDelta);
    },

    remove: function () {
      const sceneEl = this.el.sceneEl || this.el;
      window.removeEventListener('tabsirah-tactile-touch', this.onCustomTouch);
      sceneEl.removeEventListener('tabsirah-tactile-touch', this.onCustomTouch);
      sceneEl.removeEventListener('click', this.onSceneClick, true);
      sceneEl.removeEventListener('pinchstarted', this.onScenePinch, true);
      window.removeEventListener('pointerdown', this.onCanvasPointerDown);
      window.removeEventListener('pointerup', this.onCanvasPointerUp);
      window.removeEventListener('pointermove', this.onPointerMove);
      tactileTouchFX.dispose();
    }
  });
}
