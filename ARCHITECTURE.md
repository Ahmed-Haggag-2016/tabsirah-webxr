# Tabṣirah (تَبْصِرَة) — System Architecture

> **The Living Creation Engine** · A-Frame 1.5.0 · Three.js · WebXR (`immersive-vr` & `immersive-ar`) · Custom GLSL Shaders · Procedural Web Audio · Optional Server-Side Gemini Companion

---

## 1. Core Experience Loop

```text
EXPLORE  ──▶  DISCOVER  ──▶  EXPERIMENT  ──▶  TRANSFORM  ──▶  UNDERSTAND  ──▶  REFLECT
```

Every biome connects directly to shared reactive state, a multi-scale 3D laboratory, and a zero-PII local journal while preserving 100% static/offline WebXR functionality.

---

## 2. Module Map

| Layer | File | Responsibility |
| :--- | :--- | :--- |
| **Entry & Scene** | `index.html` | WebXR `<a-scene>` (`local-floor`, `hand-tracking`, `hit-test`, `bounded-floor`), progressive HUD drawers, Deep Stillness veil, RTL Arabic typography (`Amiri`), and module bootstrap (`js/state/biome-manager.js`). |
| **State & Orchestration** | `js/state/biome-manager.js` | Central `BiomeManager`, `biome-hand-controls` formal gesture state machine (`idle` → `hover-preview` → `active` → `cooldown`), open-palm layer toggle, drawer management, keyboard shortcuts, and XR/MR clipping planes. |
| **Ecosystem Engine** | `js/state/ecosystem-engine.js` | `ecosystemEngine` connecting all 4 biomes via transparent educational cause-and-effect experiments (`seed-rainforest-monsoon`, `restore-coral-symbiosis`, `recharge-desert-aquifer`, `solar-storm-deflection`) and a 3-step **Time Machine** (`previous`, `current`, `future_illustrative`). |
| **Discovery Journal** | `js/state/discovery-journal.js` | Zero-PII `localStorage` persistence (`tabsirah_discovery_journal_v1`) recording explored biomes, completed experiments, attuned relics, inspected lab specimens, and visited time horizons, with instant Reset. |
| **Spatial Lab** | `js/components/spatial-lab.js` | `spatial-scientific-lab` A-Frame component rendering an interactive 3D specimen pedestal extracted from the active biome (`aurora-dipole-cell`, `rainforest-stomata`, `ocean-coral-polyp`, `desert-aquifer-core`) with rotate, scale, extract/return, and Micro Zoom. |
| **Biome Generators** | `js/components/biome-generators.js` | Procedural 3D environments for Polar Aurora, Living Rainforest, Coral Cathedral, and Desert Oasis, wired to `window.tabsirahEcosystemVisuals` and `tabsirah-ecosystem-experiment`. |
| **Grand Prize XR Suite** | `js/components/grand-prize-features.js` | `MicBreathMonitor` (Web Audio `AnalyserNode` RMS + low-mid FFT with 1.5s ambient calibration & manual Guided Pacer fallback), `xr-tabletop-portal` (`XRHitTestSource` + desktop Tabletop `T`), `relic-constellation` (Cosmic Convergence 2.0 orbital ring & two-hand trigger), `diegetic-onboarding`, and `wonder-brush-trails`. |
| **VR & Wrist Consoles** | `js/components/vr-spatial-console.js`<br>`js/components/wrist-flip-quick-menu.js` | Waist-height 3D VR/MR console with fingertip touch, laser raycast, and thumbstick/button shortcuts; Horizon OS left-wrist flip radial menu (`Q` desktop fallback). |
| **Shaders, Optics & PDEs** | `js/components/nature-shaders.js`<br>`js/components/tactile-touch-fx.js`<br>`js/components/light-optics.js`<br>`js/components/sacred-dynamics.js`<br>`js/components/wow-postprocessing.js` | Custom GLSL auroral curtains, Rayleigh/Mie atmospheric sky dome, underwater caustics, chromatic touch shockwaves, Snell/Cauchy 7-band water droplet prism, Gray-Scott reaction-diffusion coral, Geodesic Voronoi, and selective bloom. |
| **Procedural Audio & Voice** | `js/components/nature-audio.js` | Real-time Web Audio synthesis (pink-noise wind/rain, chimes, whale calls, birdsong, oud-inspired desert plucks, singing-bowl resonance) plus Web Speech narration. |
| **Curated Biome & Scripture Data** | `js/config/earth-biomes-data.js` | Authoritative source of authentic RTL Arabic Qur'anic verses, translations, `surahRef`, explanatory commentary, scientific context, and verified documentary media. |
| **Science Companion** | `js/components/nature-companion.js`<br>`server.ts` | Offline-first scientific Q&A client (`askNatureCompanion`) with strict guardrails against scripture generation, paired with an optional Express proxy (`POST /api/companion`, `GET /api/health`) calling `@google/genai` server-side when `GEMINI_API_KEY` is configured. |

---

## 3. Architectural Guardrails & Scientific Transparency

1. **Authoritative Scripture Isolation:** All Qur'anic verses (`dir="rtl" lang="ar"`), translations, `surahRef`, and commentary are loaded exclusively from `js/config/earth-biomes-data.js`. Both `server.ts` and `js/components/nature-companion.js` explicitly reject or redirect requests to generate, quote, or paraphrase scripture/Tafsir.
2. **Educational Model Transparency:** The Ecosystem Butterfly Effect and Time Machine of Creation clearly label all metrics and future scenarios as **simplified educational illustrations**, never predictive climate forecasts.
3. **Privacy & Local-First Processing:**
   - **Mic Breath:** Processed strictly in-memory via `AudioContext` + `AnalyserNode`; audio is never recorded, persisted, or transmitted. Includes a 1.5-second ambient noise calibration, manual sensitivity slider (`0.4x–2.0x`), and instant **Guided Pacer** fallback.
   - **Discovery Journal:** Stored locally in `localStorage` with zero accounts and zero PII.
4. **Static Fallback Parity:** If deployed on GitHub Pages or opened offline without Node/Express or `GEMINI_API_KEY`, `/api/companion` fails over silently within 8s (or immediately on HTTP `503`) to the verified local science guide in `nature-companion.js`.

---

## 4. Device Compatibility Matrix & Verification Status

| Target Environment | Supported Features | Verification Status |
| :--- | :--- | :--- |
| **Desktop WebGL (Chrome / Edge / Firefox)** | Full 3D biomes, Mouse/Keyboard controls (`1`–`4`, `E`, `T`, `G`, `W`, `L`, `S`, `Q`), Ecosystem & Time Machine, Spatial Lab, Journal, Offline/Server Companion, Cinematic Tour | **Verified** via TypeScript lint, Vite + esbuild production build, and live Express HTTP server checks |
| **WebXR Emulator (Desktop)** | `immersive-vr` & `immersive-ar` session entry, VR Spatial Console, Wrist-Flip Quick Menu | **Architecturally Wired** (requires WebXR browser extension for live emulation) |
| **Meta Quest 3 / 3S / Pro / 2 (Standalone Browser)** | `local-floor`, bare `hand-tracking`, `hit-test` MR Passthrough tabletop anchoring, controller laser/thumbsticks/haptics | **Pending Physical Headset Profiling** *(HTTPS or `adb reverse tcp:3000 tcp:3000` required for WebXR permissions)* |

---

## 5. Known Limitations

- Standalone Meta Quest headset framerate and bare-hand tracking ergonomics under `hand-tracking` + `hit-test` Passthrough have not been measured on physical Quest hardware in this build environment.
- YouTube documentary embeds in the Field Media drawer require external internet connectivity and may be blocked in strict sandboxed iframes.
- Live AI answers in the Nature Companion require running `server.ts` with a valid `GEMINI_API_KEY` environment variable; otherwise the curated offline science guide responds automatically.
