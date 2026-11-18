# Tabṣirah (تَبْصِرَة) — The Living Creation Engine

> **Submission for the [Meta VR Start Developer Competition 2026](https://start-developer-competition-26.devpost.com/)**  
> **Track:** Entertainment | **Build Path:** WebXR / Immersive Web (VR & Mixed Reality Passthrough)  
> *A zero-asset, hands-first WebXR sanctuary across four interconnected living biomes uniting custom GLSL shaders, ecological cause-and-effect experiments, multi-scale 3D science labs, and contemplative reflection.*

[![WebXR Compatible](https://img.shields.io/badge/WebXR-Immersive%20VR%20%26%20AR-38BDF8.svg)](https://immersiveweb.dev/)
[![Meta Quest Ready](https://img.shields.io/badge/Meta%20Quest-Hands--First%20%26%20Passthrough-34D399.svg)](https://www.meta.com/quest/)
[![Zero External Assets](https://img.shields.io/badge/Assets-100%25%20Procedural%20Code-FBBF24.svg)](#zero-asset-procedural-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-A78BFA.svg)](./LICENSE)

---

## Overview

**Tabṣirah (تَبْصِرَة)**—an Arabic word meaning *insight that awakens clear vision and deep reflection*—is a browser-native WebXR experience built with A-Frame 1.5.0 and Three.js for standalone headsets (**Meta Quest Browser**) and modern desktop browsers.

Every biome is engineered with **procedural code and zero external 3D model, texture, or audio downloads**, unified around **The Living Creation Engine** journey:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                   TABṢIRAH (تَبْصِرَة) — THE LIVING CREATION ENGINE        │
│   Explore  ─▶  Discover  ─▶  Experiment  ─▶  Transform  ─▶  Understand  ─▶  Reflect   │
├──────────────────┬──────────────────┬──────────────────┬───────────────────┤
│ 1. Polar Aurora  │ 2. Rainforest    │ 3. Coral Reef    │ 4. Desert Oasis   │
│ Geomagnetic Arcs │ L-System Canopy  │ Wave Caustics    │ Aeolian Sand Dunes│
│ Dipole Lab Cell  │ Stomata Lab Pore │ Turing & Polyp   │ Aquifer & Polaris │
└──────────────────┴──────────────────┴──────────────────┴───────────────────┘
```

---

## Key Features

### 1. Four Interconnected Living Biomes
1. **Polar Aurora (`aurora` — 69.65°N Tromsø Arctic Circle):** Multi-octave fBm auroral curtains (`557.7 nm` oxygen green, `630 nm` red, `427.8 nm` nitrogen violet), drifting ice floes, fjord mirror caustics, and **Solar Wind Conductor** sweeping gestures.
2. **Living Rainforest (`rainforest` — 3.46°S Amazon Basin):** Murray-branching L-system canopy trees, crepuscular god rays, waterfall particles, raised-hand **Rain Summoning**, and a **Water-Droplet Optical Prism** (`water-prism-optics`) refracting a 7-band Snell/Cauchy rainbow.
3. **Coral Cathedral (`ocean` — 27.25°N Red Sea Reef):** Real-time water caustics (`1.333` seawater IOR), Boids schooling fish, gliding manta rays and sea turtles, touch-restorative pale coral clusters, and macro-to-micro **Gray-Scott Reaction-Diffusion** and **Geodesic Voronoi** lenses.
4. **Desert Oasis (`desert` — 31.14°N Sahara Erg):** Wind-sculpted aeolian dune ripples, Rayleigh/Mie solar scattering from High Sun through Twilight to Starlight, a subterranean **Artesian Oasis Aquifer** reveal, and an interactive **Polaris Star Compass**.

### 2. Ecosystem Butterfly Effect & Time Machine of Creation (`Eco & Time`)
- **Shared Reactive Ecological State (`js/state/ecosystem-engine.js`):** Connects all four biomes through transparent educational experiments (*Trigger Canopy Rainfall*, *Restore Coral Symbiosis*, *Recharge Oasis Aquifer*, *Channel Solar Wind*) that update 3D flora/coral/aquifer/aurora visuals and display cause-and-effect chains.
- **Time Machine of Creation:** Compare **Past Reference State**, **Current Living State**, and an **Illustrative Future Scenario** (explicitly labeled as a simplified educational model, not a climate forecast).

### 3. Spatial Scientific Lab (`Sci Lab` / `L` Key)
Extract an interactive 3D specimen from the active biome onto a glowing pedestal (`js/components/spatial-lab.js`) with drag/button rotation, scaling (`0.55x–2.35x`), and **Micro Zoom**:
- **Aurora:** Dipole Magnetosphere & `557.7 nm` Excitation Cell
- **Rainforest:** Leaf Cuticle & Stomata Evapotranspiration Chamber
- **Coral Cathedral:** Stony Coral Polyp & Zooxanthellae Symbiosis Cup
- **Desert Oasis:** Porous Sandstone & Confined Oasis Aquifer Core

### 4. Hands-First WebXR State Machine, Waist Console & Horizon OS Wrist Menu
- **Formal Hand-Tracking State Machine (`biome-hand-controls`):** Proximity `idle` → `hover-preview` → `active` → `cooldown` with hysteresis, direct fingertip touch on the waist-height **3D Spatial VR/MR Console**, **Open-Palm steady hold** to toggle biome layers, **Overhead Hand Raise**, **Two-Hand Spread Zoom**, and left-hand pinch solar scrubbing.
- **Horizon OS Wrist-Flip Quick Menu (`wrist-flip-quick-menu.js` / `Q` Key):** Flip your left palm upward in WebXR to fan out a radial menu for Wonder Brush, Cosmic Convergence, Mic Breath, and Stillness Sanctuary.
- **Touch Controllers:** Laser pointer selection, thumbstick solar scrub/zoom, `A`/`X` Day/Night toggle, `B`/`Y` biome cycling, and WebXR haptic actuator pulses (`webxr-beacon-haptics`).

### 5. Mixed Reality Hit-Test Anchoring & Cosmic Convergence 2.0 (`T` & `G`)
- **WebXR Hit-Test Surface Anchoring (`xr-tabletop-portal`):** Lock the holographic biome diorama onto physical desks or floors in Meta Quest Passthrough (`immersive-ar`), or press `T` on desktop for the **Tabletop Portal**.
- **Cosmic Convergence 2.0 (`G` or Two-Hand Bring-Together in XR):** Clean solid-translucent 3D biome relics, perimeter inter-biome filament beams, orbital halo, harmonic chord, and an exploration summary overlay.

### 6. Stillness Sanctuary (`S`), Calibrated Mic Breath & Discovery Journal
- **Calibrated Mic Breath + Guided Pacer:** Local in-memory `AnalyserNode` (RMS + low-mid FFT) with `1.5 s` ambient noise calibration, manual sensitivity slider (`0.4x–2.0x`), wave counter, and instant fallback to a **14-second Guided Breath Pacer**.
- **Discovery Journal & Offline-First Nature Companion:** Local zero-PII progress persistence (`localStorage`), plus an interactive **Nature Science Companion** (`js/components/nature-companion.js`) that works 100% offline/static and optionally upgrades via server-side `/api/companion` (`server.ts`) when `GEMINI_API_KEY` is configured. Authoritative RTL Arabic scripture (`dir="rtl" lang="ar"`) and commentary remain strictly curated in `js/config/earth-biomes-data.js`.

---

## Project Structure

```text
/
├── index.html                        # WebXR <a-scene>, progressive HUD & Living Creation Engine drawers
├── server.ts                         # Express + Vite server with optional /api/companion Gemini proxy
├── ARCHITECTURE.md                   # System architecture, guardrails, compatibility matrix & limitations
├── DEVPOST_SUBMISSION.md             # Meta VR Start Developer Competition 2026 submission guide
├── package.json                      # Dev, production build, start & lint scripts
├── .env.example                      # Optional server-side GEMINI_API_KEY & PORT template
└── js/
    ├── config/
    │   └── earth-biomes-data.js      # Authoritative biome data, RTL Arabic verses, science & documentary media
    ├── state/
    │   ├── biome-manager.js          # Central state machine, hand gesture state machine, drawers & XR mode
    │   ├── ecosystem-engine.js       # Inter-biome Butterfly Effect experiments & 3-step Time Machine
    │   └── discovery-journal.js      # Zero-PII localStorage persistence for biomes, experiments, relics & specimens
    └── components/
        ├── biome-generators.js       # Procedural 3D biomes reactive to ecosystemEngine state
        ├── spatial-lab.js            # Multi-scale 3D scientific specimen laboratory pedestal
        ├── nature-companion.js       # Offline-first science Q&A client with /api/companion integration
        ├── grand-prize-features.js   # Hit-test portal, Convergence 2.0, calibrated Mic Breath, Wonder Brush
        ├── vr-spatial-console.js     # Waist-height 3D VR/MR control console & controller shortcuts
        ├── wrist-flip-quick-menu.js  # Left-wrist flip radial menu (Q fallback)
        ├── tactile-touch-fx.js       # Custom GLSL chromatic touch shockwaves & lattice interference
        ├── nature-shaders.js         # Aurora fBm, Rayleigh/Mie sky dome, caustics & wonder ripples
        ├── nature-audio.js           # Procedural Web Audio synthesizer & Web Speech narrator
        ├── light-optics.js           # 7-band Snell/Cauchy Water-Droplet Optical Prism
        ├── sacred-dynamics.js        # Gray-Scott Turing Coral PDE, Geodesic Voronoi & cymatics
        └── ...                       # Zoom LOD, particles, telemetry, haptics & Cinematic Director
```

---

## How to Run & Test

### Prerequisites
- **Node.js** `v18+` and **npm**
- Modern desktop browser (**Chrome**, **Edge**, or **Firefox**) or **Meta Quest Browser**

### 1. Run Locally (Development Server)
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. *(Optional: copy `.env.example` to `.env` and add `GEMINI_API_KEY` if you want live Gemini responses in the Nature Companion; without it, the curated offline scientific guide runs automatically.)*

The project uses one compatible Vite/esbuild toolchain in `package.json` and an npm lockfile, so a normal `npm install` is supported without peer-dependency flags.

### 2. Build, Lint & Run Production Bundle
```bash
npm run lint
npm run build
npm run start
```

### 3. Run on Meta Quest Headsets
Meta Quest Browser requires an **HTTPS origin** (or `localhost` via USB ADB forwarding) for `immersive-vr` and `immersive-ar` Passthrough permissions:
- **Static HTTPS Deployment:** Deploy `dist/` to GitHub Pages, Vercel, Netlify, or Cloudflare Pages (all core WebXR, Lab, Ecosystem, Journal, and Offline Companion features run client-side).
- **USB ADB Forwarding:** Run `adb reverse tcp:3000 tcp:3000` and open `http://localhost:3000` inside Meta Quest Browser.

---

## Controls & Shortcuts

| Input | Action |
| :--- | :--- |
| `1` – `4` / `Space` | Switch biome (`1`: Aurora, `2`: Rainforest, `3`: Coral Cathedral, `4`: Desert Oasis) / Next biome |
| `E` or `Enter` | Trigger active biome revelation |
| `L` | Toggle **Spatial Scientific Lab** 3D specimen pedestal |
| `T` | Toggle **Tabletop Portal** diorama showcase |
| `G` | Toggle 4-Biome **Cosmic Convergence 2.0** |
| `W` or `Shift + Drag` | Toggle **Wonder Brush** musical stardust trails |
| `Q` | Toggle **Horizon OS Wrist-Flip Quick Menu** |
| `S` | Toggle **Stillness Sanctuary** (with calibrated **Mic Breath** & **Guided Pacer**) |
| `+` / `-` or `Arrow Keys` | Zoom across Macro-to-Micro lenses / Rotate camera (`Z` swaps Arrow mode) |
| `[` / `]` | Lower / Raise Solar Elevation (Starlight ↔ Twilight ↔ Golden Hour ↔ High Sun) |
| `B` / `H` / `Esc` | Toggle Bloom / Hide HUD dock / Close active modal or drawer |

---

## License

Released under the [MIT License](./LICENSE).
