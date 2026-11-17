# Tabṣirah (تَبْصِرَة) — WebXR Living Biomes & Hands-First Contemplation

> **Submission for the [Meta VR Start Developer Competition 2026](https://start-developer-competition-26.devpost.com/)**  
> **Track:** Entertainment | **Build Path:** WebXR / Immersive Web (VR & Mixed Reality Passthrough)  
> *A zero-asset, hands-first WebXR sanctuary across four living biomes uniting custom GLSL shaders, real-time optics and morphogenesis, tactile haptics, and contemplative reflection for Meta Quest 3, 3S, Pro, and 2.*

[![WebXR Compatible](https://img.shields.io/badge/WebXR-Immersive%20VR%20%26%20AR-38BDF8.svg)](https://immersiveweb.dev/)
[![Meta Quest Ready](https://img.shields.io/badge/Meta%20Quest-Hands--First%20%26%20Passthrough-34D399.svg)](https://www.meta.com/quest/)
[![Zero External Assets](https://img.shields.io/badge/Assets-100%25%20Procedural%20Code-FBBF24.svg)](#zero-asset-procedural-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-A78BFA.svg)](./LICENSE)

---

## Overview

**Tabṣirah (تَبْصِرَة)**—an Arabic word meaning *insight that awakens clear vision and deep reflection*—is a browser-native WebXR spatial experience built with A-Frame 1.5.0 and Three.js for standalone VR headsets (**Meta Quest Browser**) and modern desktop browsers.

Every scene is engineered with **100% procedural code and zero external 3D models, texture files, or pre-recorded audio (0 KB external asset payload)**. Terrain geometry, atmospheric scattering, water caustics, living organisms, spatial soundscapes, and tactile shaders are synthesized live in real time so the experience opens instantaneously with locked 60+ FPS ergonomics—seated or standing.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           TABṢIRAH (تَبْصِرَة)                             │
│          Explore  ─▶  Discover  ─▶  Understand  ─▶  Reflect                │
├──────────────────┬──────────────────┬──────────────────┬───────────────────┤
│ 1. Polar Aurora  │ 2. Rainforest    │ 3. Coral Reef    │ 4. Desert Oasis   │
│ Geomagnetic Arcs │ L-System Canopy  │ Wave Caustics    │ Aeolian Sand Dunes│
│ Solar Conductor  │ Droplet Prism    │ Boids & Turing   │ Aquifer & Polaris │
└──────────────────┴──────────────────┴──────────────────┴───────────────────┘
```

---

## Key Features

### 1. Four Scientifically Authentic Living Biomes
1. **Polar Aurora (`aurora` — 69.65°N Tromsø Arctic Circle):** Multi-octave fractional Brownian motion (fBm) auroral curtains (`557.7 nm` oxygen green, `630 nm` red, `427.8 nm` nitrogen violet), drifting Arctic ice floes, fjord mirror caustics, and interactive **Solar Wind Conductor** sweeping gestures that build toward a coronal substorm burst.
2. **Living Rainforest (`rainforest` — 3.46°S Amazon Basin):** Murray-branching L-system ancient trees, crepuscular god rays, cascading waterfall particles, interactive palm-raise **Rain Summoning**, and a zoom-in **Water-Droplet Optical Prism** (`water-prism-optics`) that refracts a live 7-band Snell/Cauchy rainbow spectrum and floor caustics.
3. **Coral Cathedral (`ocean` — 27.25°N Red Sea Reef):** Real-time refractive water caustics (`1.333` seawater IOR), decentralized Boids schooling fish, gliding manta rays and sea turtles, touch-restorative pale coral clusters, and macro-to-micro **Gray-Scott Reaction-Diffusion Turing Coral** and **Geodesic Voronoi** lenses.
4. **Desert Oasis (`desert` — 31.14°N Sahara Erg):** Wind-sculpted aeolian dune ripples, Rayleigh/Mie atmospheric solar scattering from High Sun through Twilight to Starlight, a subterranean **Artesian Oasis Aquifer** reveal, and an interactive **Star Compass** to align Polaris to True North.

### 2. Multi-Sensory Tactile Touch System (`js/components/tactile-touch-fx.js`)
Reaching out with Meta Quest Hand Tracking, pinching an interactive node, or clicking in 3D triggers:
- **Custom GLSL Chromatic Shockwaves:** Expanding spherical rings with split cyan, emerald, and gold dispersion edges.
- **16-Fold Islamic Geometric Lattice:** Interference patterns dissolving into pooled starlight particles with zero per-frame garbage collection.
- **Spatial Haptics & Web Audio Harmonics:** Directional vibration pulses and biome-tuned synthesized chords.

### 3. Hands-First Meta Quest & Controller Support
- **Bare-Hand Tracking:** Direct fingertip contact on beacons and the waist-height **3D Spatial VR/MR Console**, pinch-to-activate nodes, **Two-Hand Spread Zoom** across Macro-to-Micro lenses, left-hand pinch horizontal scrub for Day/Night solar elevation, sky sweeps in Aurora, and upward palm raises in Rainforest.
- **Touch Controllers:** Laser pointer selection, thumbstick X-axis solar scrubbing, thumbstick Y-axis zoom, `A`/`X` Day/Night toggle, and `B`/`Y` biome cycling.

### 4. Mixed Reality Hit-Test Anchoring & Tabletop Portal (`T` Key)
- **WebXR Hit-Test Surface Anchoring:** In Meta Quest Passthrough (`immersive-ar`), a 16-fold geometric landing reticle tracks real tables and floors so you can pinch or trigger to lock the holographic biome diorama onto your actual desk.
- **Desktop Tabletop Portal Showcase (`T` Key):** Frame any biome inside a floating brushed-gold and GLSL **Dimensional Astrolabe Portal Arch** right inside desktop Chrome or a WebXR Emulator—ideal for spatial overview and crisp demo capture.

### 5. Ecological Relic Constellation & Cosmic Convergence (`G` Key)
Activating discovery across the four biomes crystallizes four procedural 3D **Ecological Relics** in an orbital overhead halo. Attuning all four unlocks (or toggles via `G`) the **Cosmic Convergence Finale**—uniting every relic, the **16-Fold Islamic Star Mandala**, cymatic waves, and a layered harmonic chord.

### 6. Stillness Sanctuary (`S`), Live Mic Breath & Wonder Brush (`W`)
- **Live Mic Breath Resonance:** Inside Stillness Sanctuary (`S`), enable **Mic Breath** to expand the 16-fold Star Mandala and swell singing-bowl harmonics with your real breath (blending smoothly with the 14s inhale/hold/exhale pacer).
- **Diegetic 3D Onboarding Cues:** Minimal floating 3D target rings and gesture comet arcs guide your first interaction automatically and fade cleanly once touched.
- **Stardust Wonder Brush (`W` / `Shift + Drag` / XR Pinch):** Paint glowing, zero-GC calligraphic stardust trails pitched to the active biome's musical scale.

---

## Zero-Asset Procedural Engine

- **0 KB External Textures:** Bark, sand ripples, basalt reliefs, glow sprites, and VR console typography are synthesized at runtime via HTML5 Canvas & GPU textures.
- **0 KB External Models:** Fauna, flora, droplets, coral domes, and geometric mandalas are built procedurally in Three.js (`InstancedMesh`, lathes, extrusions, icosahedrons).
- **0 KB External Audio:** Pink-noise wind/water filters, aurora chimes, whale calls, birdsong, oud-inspired desert plucks, and singing-bowl drones are generated live via the Web Audio API alongside Web Speech narration.
- **Zero-GC Frame Loop:** Pre-allocated `THREE.Vector3`, `THREE.Quaternion`, and `THREE.Matrix4` objects keep frame timing smooth for standalone Quest 3/3S performance.

---

## Project Structure

```
/
├── index.html                        # Entry point, WebXR <a-scene>, progressive HUD & overlays
├── LICENSE                           # MIT License
├── README.md                         # Project documentation & setup guide
├── DEVPOST_SUBMISSION.md             # Meta VR Start Developer Competition 2026 submission pack
├── package.json                      # Vite dev/build/lint scripts
└── js/
    ├── config/
    │   └── earth-biomes-data.js      # 4-biome definitions, Qur'anic texts, science & media
    ├── state/
    │   └── biome-manager.js          # Central state machine, HUD bindings, hand gestures & XR mode
    └── components/
        ├── biome-generators.js       # Procedural terrain, flora, fauna, aquifer & compasses
        ├── tactile-touch-fx.js       # Custom GLSL shockwaves, lattice interference & haptics
        ├── nature-shaders.js         # Aurora fBm, atmospheric sky, caustics & wonder ripples
        ├── nature-audio.js           # 100% procedural Web Audio synthesizer & voice narrator
        ├── light-optics.js           # Interactive Water-Droplet Optical Prism (7-band Snell)
        ├── sacred-dynamics.js        # Turing Coral PDE, Geodesic Voronoi & 16-fold Mandala
        ├── zoom-detail-system.js     # Macro-to-Micro living lens LOD layers
        ├── vr-spatial-console.js     # Waist-height 3D VR/MR console & controller shortcuts
        ├── gesture-scale-manager.js  # Two-hand pinch-and-spread diorama scaling
        ├── scientific-telemetry.js   # Real-time WebXR haptic actuator bridge
        ├── wow-mechanics.js          # Autonomous Cinematic Director autopilot
        ├── wow-postprocessing.js     # Selective luminous bloom post-processing
        ├── grand-prize-features.js   # Hit-test portal, Relic Convergence, Diegetic cues, Mic Breath & Wonder Brush
        └── ...                       # Particle weather, cymatics, spatial discovery & PBR utils
```

---

## How to Run & Test

### Prerequisites
- **Node.js** `v18+` and **npm** (or `bun`)
- Modern desktop browser (**Chrome**, **Edge**, or **Firefox**) or **Meta Quest Browser** on Meta Quest 3 / 3S / Pro / 2

### 1. Run Locally on Desktop
```bash
# Install dependencies
npm install

# Start the development server on http://localhost:3000
npm run dev
```
Open `http://localhost:3000` in your browser, click **Begin Exploration** (or **Start Cinematic Tour**), and drag/click to explore in 360°.

### 2. Build & Verify Production Bundle
```bash
# Type-check with TypeScript
npm run lint

# Build production static bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

### 3. Run on Meta Quest Headsets (Quest 3 / 3S / Pro / 2)
> **Important WebXR Requirement:** Meta Quest Browser requires a **secure HTTPS origin** (or `localhost` via USB ADB forwarding) to enable `immersive-vr` and `immersive-ar` Passthrough sessions. Plain `http://<LAN-IP>:3000` addresses are treated as insecure by the browser and will hide WebXR entry.

Choose one of the following methods to test in headset:

- **Option A — Live HTTPS Deployment (Recommended for Judges & Sharing):**  
  Deploy `dist/` (or connect this repo) to any static HTTPS host (e.g., Vercel, Netlify, Cloudflare Pages, GitHub Pages) and open the `https://` URL directly inside **Meta Quest Browser**.
- **Option B — Local HTTPS Tunnel (Quick Wi-Fi Testing):**  
  Run `npm run dev` locally, then expose port `3000` over HTTPS using `ngrok http 3000` or `npx localtunnel --port 3000`, and open the generated `https://` URL in **Meta Quest Browser**.
- **Option C — USB ADB Port Forwarding (Developer Mode):**  
  With your Quest connected via USB and Developer Mode enabled:
  ```bash
  adb reverse tcp:3000 tcp:3000
  ```
  Then visit `http://localhost:3000` inside **Meta Quest Browser** (`localhost` is treated as a secure context).

---

## Controls & Shortcuts

### Desktop (Keyboard & Mouse)

| Input | Action |
| :--- | :--- |
| `1` – `4` | Switch biome (`1`: Polar Aurora, `2`: Living Rainforest, `3`: Coral Cathedral, `4`: Desert Oasis) |
| `Space` / `Shift + Space` | Advance to next biome / previous biome |
| `E` or `Enter` | Trigger primary biome revelation (Magnetic Shield, Summon Rain, Reef Surge, Aquifer) |
| `T` | Toggle **Tabletop Portal** holographic pedestal diorama showcase |
| `G` | Toggle 4-Biome **Cosmic Convergence** finale |
| `W` or `Shift + Drag` | Toggle **Wonder Brush** calligraphic stardust trails pitched to biome scale |
| `S` | Toggle **Stillness Sanctuary** (16-fold star mandala, cymatics & optional **Mic Breath**) |
| `+` / `=` or `PageUp` | Zoom **In** toward Macro-to-Micro living lenses |
| `-` / `_` or `PageDown` | Zoom **Out** toward Aerial panorama |
| `Arrow Keys` | Rotate camera (`Shift + Up/Down` zooms; press `Z` to toggle Arrow Rotate/Zoom mode) |
| `[` / `]` | Lower / Raise Solar Elevation (Starlight ↔ Twilight ↔ Golden Hour ↔ High Sun) |
| `B` | Toggle luminous **Bloom Glow** post-processing |
| `H` | Hide / Show bottom control dock |
| `Esc` | Exit Stillness Sanctuary, close modal, or close controls popover |
| `Mouse Drag / Click` | Look around 360° and click any 3D beacon or surface to trigger tactile shockwaves |

### Meta Quest (Hands-First & Controllers)

| Mode / Input | Action |
| :--- | :--- |
| **Fingertip Reach / Touch** | Directly touch 3D beacons, specimens, or the waist-height 3D Spatial Console buttons |
| **Single-Hand Pinch** | Activate nearest discovery node or interactive lens |
| **Two-Hand Pinch Spread** | Spread / bring hands together to smoothly zoom across Macro-to-Micro scales |
| **Left-Hand Pinch + Horizontal Sweep** | Scrub Day / Night solar elevation continuously |
| **Sky Sweep (Polar Aurora)** | Sweep hand across the sky to conduct geomagnetic arcs toward a substorm burst |
| **Raise Palms (Rainforest)** | Lift hands above `1.65 m` to summon warm tropical rainfall |
| **Controller Thumbsticks** | `Left/Right`: Solar Day/Night scrub · `Up/Down`: Aerial/Close-Up zoom |
| **Controller `A`/`X` · `B`/`Y`** | `A`/`X`: Toggle Daylight/Starlight · `B`/`Y`: Next Biome |

---

## Hackathon Submission Docs

See [DEVPOST_SUBMISSION.md](./DEVPOST_SUBMISSION.md) for the complete **Meta VR Start Developer Competition 2026** copy-paste form fields, track & division rationale, under-3-minute demo storyboard, judging criteria alignment, and judge testing guide.

---

## License

Released under the [MIT License](./LICENSE). Designed and built for the **Meta VR Start Developer Competition 2026**.
