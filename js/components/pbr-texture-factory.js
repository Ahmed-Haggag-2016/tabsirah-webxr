/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * High-Resolution Procedural PBR Texture Factory (512x512):
 * Generates ultra-crisp Normal Maps, Roughness Maps, and Detail Albedo
 * for photorealistic rock, sand, coral, snow crust, and bark materials.
 */

const textureCache = new Map();

function hash2D(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function tileableNoise(u, v, period) {
  const x = u * period;
  const y = v * period;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y1 = (y0 + 1) % period;
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const n00 = hash2D(x0, y0);
  const n10 = hash2D(x1, y0);
  const n01 = hash2D(x0, y1);
  const n11 = hash2D(x1, y1);
  return (n00 * (1 - sx) + n10 * sx) * (1 - sy) + (n01 * (1 - sx) + n11 * sx) * sy;
}

function sampleMaterialHeight(kind, u, v) {
  const n1 = tileableNoise(u, v, 12);
  const n2 = tileableNoise(u, v, 24) * 0.5;
  const n3 = tileableNoise(u, v, 48) * 0.25;
  const n4 = tileableNoise(u * 2, v * 2, 96) * 0.125;

  if (kind === 'sand') {
    const ripple = Math.sin((u * 28 + n1 * 1.8) * Math.PI * 2) * 0.45 + 0.5;
    return ripple * 0.62 + n2 * 0.25 + n3 * 0.15;
  }
  if (kind === 'bark') {
    const furrow = Math.sin((u * 20 + n1 * 1.2) * Math.PI * 2) * 0.5 + 0.5;
    const verticalGrain = tileableNoise(u * 3, v * 0.4, 24);
    return furrow * 0.58 + verticalGrain * 0.32 + n3 * 0.1;
  }
  if (kind === 'basalt') {
    const crack = Math.abs(n1 - 0.5) * 2.0;
    return Math.pow(crack, 0.65) * 0.52 + n2 * 0.38 + n3 * 0.18;
  }
  if (kind === 'coral') {
    const ridge = Math.sin(u * 55 + Math.cos(v * 42) * 2.8) * Math.cos(v * 55 + Math.sin(u * 42) * 2.8);
    return (ridge * 0.5 + 0.5) * 0.68 + n3 * 0.22 + n4 * 0.1;
  }
  if (kind === 'ice') {
    const facet = Math.abs(n1 - n2);
    return facet * 0.62 + n3 * 0.28 + n4 * 0.1;
  }
  return n1 * 0.45 + n2 * 0.32 + n3 * 0.15 + n4 * 0.08;
}

export function getBiomePBRTextures(kind = 'basalt', repeatX = 8, repeatY = 8) {
  const key = `${kind}_${repeatX}_${repeatY}_hd`;
  if (textureCache.has(key)) return textureCache.get(key);

  const size = 512;
  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      heights[y * size + x] = sampleMaterialHeight(kind, x / size, y / size);
    }
  }

  const normCanvas = document.createElement('canvas');
  normCanvas.width = size;
  normCanvas.height = size;
  const nCtx = normCanvas.getContext('2d');
  const nImg = nCtx.createImageData(size, size);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');
  const rImg = rCtx.createImageData(size, size);

  const strength = kind === 'sand' ? 3.0 : kind === 'basalt' ? 4.2 : kind === 'bark' ? 4.5 : 2.8;

  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size;
    const yNext = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;

      const hL = heights[y * size + xPrev];
      const hR = heights[y * size + xNext];
      const hD = heights[yPrev * size + x];
      const hU = heights[yNext * size + x];

      let dx = (hL - hR) * strength;
      let dy = (hD - hU) * strength;
      let dz = 1.0;
      const len = Math.hypot(dx, dy, dz);
      dx /= len;
      dy /= len;
      dz /= len;

      const idx = (y * size + x) * 4;
      nImg.data[idx] = Math.round((dx * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round((dy * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round((dz * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;

      const hVal = heights[y * size + x];
      const shade = Math.round(150 + hVal * 105);
      rImg.data[idx] = shade;
      rImg.data[idx + 1] = shade;
      rImg.data[idx + 2] = shade;
      rImg.data[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(normCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeatX, repeatY);

  const detailMap = new THREE.CanvasTexture(roughCanvas);
  detailMap.wrapS = THREE.RepeatWrapping;
  detailMap.wrapT = THREE.RepeatWrapping;
  detailMap.repeat.set(repeatX, repeatY);
  detailMap.colorSpace = THREE.SRGBColorSpace;

  const pack = { normalMap, detailMap };
  textureCache.set(key, pack);
  return pack;
}
