# Tabsirah (تَبْصِرَة) — WebXR Cosmic Contemplation & Living Biomes

> **Winner-Ready Submission for the [Meta Quest Start Developer Competition 2026](https://start-developer-competition-26.devpost.com/)**  
> *An immersive, hands-first WebXR sanctuary across five living biomes uniting procedural GLSL shaders, real-time physics, tactile haptics, and contemplative reflection for Meta Quest 3, 3S, Pro, and 2.*

[![WebXR Compatible](https://img.shields.io/badge/WebXR-Immersive%20VR%20%26%20AR-38BDF8.svg)](https://immersiveweb.dev/)
[![Meta Quest Ready](https://img.shields.io/badge/Meta%20Quest-Hand%20Tracking%20%26%20Passthrough-34D399.svg)](https://www.meta.com/quest/)
[![Zero External Assets](https://img.shields.io/badge/Assets-100%25%20Procedural%20Code-FBBF24.svg)](#zero-asset-procedural-engine)
[![Framework](https://img.shields.io/badge/A--Frame-1.5.0-EB5424.svg)](https://aframe.io/)
[![Three.js](https://img.shields.io/badge/Three.js-r160+-000000.svg)](https://threejs.org/)

---

## 🌟 Overview

**Tabsirah (تَبْصِرَة)**—an Arabic word signifying *insight that awakens clear vision and deep reflection*—is an innovative WebXR application engineered specifically for standalone VR headsets (Meta Quest Browser) and desktop WebXR runtimes. 

Tabsirah contains **zero external 3D models, textures, or audio recordings (0 KB external payload)**. Every landscape, organism, atmospheric scattering ray, water caustic, and sound effect is generated in real-time procedural code.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                 TABSIRAH (تَبْصِرَة)                               │
│                      WebXR Spatial Sanctuary & Contemplation                      │
├─────────────────┬─────────────────┬──────────────────┬────────────────┬───────────┤
│ 1. Polar Aurora │ 2. Rainforest   │ 3. Coral Reef    │ 4. Desert      │ 5. Alpine │
│ Geomagnetic     │ Water-Droplet   │ Turing Morphogen │ Subsurface     │ Peg Roots │
│ Solar Arcs      │ Optical Prism   │ Boids Schooling  │ Artesian Spring│ Isostasy  │
└─────────────────┴─────────────────┴──────────────────┴────────────────┴───────────┘
```

---

## 🚀 Key Features

### 1. Five Scientifically Authentic Living Biomes
- **1. Polar Aurora (`aurora`):** Geomagnetic dipole arcs, volumetric GLSL auroral raymarching, Arctic ice floes, and solar wind conductor mechanics.
- **2. Living Rainforest (`rainforest`):** Dynamic canopy light, interactive water-droplet optical prism, and hand-gesture tropical rain summoning.
- **3. Coral Cathedral (`ocean`):** Real-time moving optical caustics, decentralized Boids fish schooling, and Gray-Scott reaction-diffusion coral morphogenesis.
- **4. Desert Oasis (`desert`):** Aeolian ripple sand dunes, Rayleigh/Mie twilight atmospheric scattering, and deep artesian groundwater aquifers.
- **5. Alpine Peaks (`mountains`):** Glaciated Matterhorn horn peaks with razor-sharp arêtes, turquoise glacial tarn, cascading waterfalls with spray mist, agile Alpine Ibex and sentry marmots, and subterranean peg roots (*"الأوتاد"*) demonstrating Airy isostasy.

### 2. Multi-Sensory Tactile Touch System (`js/components/tactile-touch-fx.js`)
Touching, pinching, or pointing at any surface unleashes:
- **Custom GLSL Shockwave:** 3D spherical expanding ring with razor-sharp chromatic dispersion (cyan, emerald, gold edges).
- **16-Fold Islamic Lattice:** Interference pattern dissolving into sparkling starlight embers.
- **Spatial Haptics:** Directional vibration pulses transmitted to Meta Quest controllers and hand actuators.
- **Procedural Audio Signatures:** Biome-adaptive harmonic chords synthesized in real-time Web Audio API.

### 3. Hands-First Meta Quest Experience
- **Direct Fingertip Proximity & Touch:** Seamless contact with 3D surfaces.
- **Two-Hand Spread Zoom:** Smooth transition into macro-to-micro living lenses.
- **Solar Wind Conductor:** Sky-sweeping motions bend geomagnetic dipole arcs.
- **Rain-Summoning Palms:** Raising open palms triggers rainfall and lightning.

### 4. Mixed Reality (MR) Passthrough Diorama Mode
With one tap, the virtual sky dome dissolves into your physical room, casting a circular holographic biome diorama right onto your tabletop or floor.

### 5. Autonomous Cinematic Director Mode
Press `C` or tap the **Cinematic Mode** button to relax while an intelligent virtual cinematographer guides you through aerial vistas and macro close-ups across all five biomes.

### 6. Stillness Sanctuary (`S` key)
Spawn a 16-fold Islamic geometric star mandala overhead pulsing in real time to guided 4-7-8 breathing cycles and 3D cymatic audio frequencies.

---

## 🛠️ Technical Architecture

```
/
├── index.html                  # WebXR entry point, UI overlay, and A-Frame scene
├── js/
│   ├── components/
│   │   ├── biome-generators.js    # Procedural terrain, fauna, flora & geology
│   │   ├── tactile-touch-fx.js    # Flagship GLSL touch shockwaves & haptics
│   │   ├── nature-shaders.js      # GLSL aurora, sky dome, caustics, and water
│   │   ├── nature-audio.js        # 100% procedural Web Audio synthesizer
│   │   ├── light-optics.js        # Water-droplet prism & Turing morphogen
│   │   ├── sacred-dynamics.js     # 16-fold star mandala & breathing physics
│   │   ├── scientific-telemetry.js# Real-time WebXR telemetry & haptics
│   │   ├── zoom-detail-system.js  # Macro-to-micro living lens controller
│   │   └── wow-mechanics.js       # Solar wind conductor & rain gesture
│   ├── config/
│   │   └── earth-biomes-data.js   # Biome metadata, scientific context & Tafsir
│   └── state/
│       └── biome-manager.js       # Central orchestrator & event bus
└── DEVPOST_SUBMISSION.md       # Turnkey Devpost Hackathon submission package
```

### Zero-Asset Procedural Engine
- **0 KB external textures:** All albedo and normal maps are synthesized at runtime via HTML5 2D Canvas and `DataTexture`.
- **0 KB external 3D models:** All fauna (Alpine Ibex, Golden Eagles, Camels, Manta Rays, Sheep, Marmots) are constructed using composite 3–12 part `THREE.Group` meshes.
- **0 KB external audio files:** Pink-noise filters, bird songs, eagle screeches, marmot whistles, and singing bowls are synthesized live in Web Audio API.
- **Zero Garbage Collection:** Zero vector allocations inside the per-frame `tick()` loop.

---

## ⌨️ Controls & Keyboard Shortcuts

| Key / Gesture | Action |
| :--- | :--- |
| `1` – `5` | Switch between biomes (1: Aurora, 2: Rainforest, 3: Ocean, 4: Desert, 5: Alpine) |
| `Space` | Advance to next biome (`Shift + Space` for previous) |
| `C` | Toggle autonomous **Cinematic Mode** |
| `S` | Toggle **Stillness Sanctuary** (breathing mandala + cymatics) |
| `X` | Toggle **X-Ray Subterranean Mode** (aquifer / tectonic peg roots) |
| `+` / `-` | Zoom in / Zoom out across Macro-to-Micro living lenses |
| `H` | Hide / Show bottom control dock (Zen Mode) |
| `Arrow Keys` | Rotate camera vantage or zoom |
| **Quest Pinch** | Direct pinch interaction with specimens and living lenses |
| **Quest Reach** | Direct fingertip contact triggers tactile shockwaves and haptics |

---

## 💻 Local Development & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd tabsirah-webxr

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in desktop Chrome/Edge or open it inside the **Meta Quest Browser** on your headset.

---

## 📜 Devpost Competition Documents
For full submission pitch, video demonstration storyboard, judges' testing guide, and track alignment, consult [DEVPOST_SUBMISSION.md](./DEVPOST_SUBMISSION.md).

---

## 📄 License
Released under the MIT License. Designed and built with pride for the **Meta Quest Start Developer Competition 2026**.
