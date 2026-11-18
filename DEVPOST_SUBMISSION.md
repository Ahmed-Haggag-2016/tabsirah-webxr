# Devpost Submission Package: Tabṣirah (تَبْصِرَة) — The Living Creation Engine

**Competition:** [Meta VR Start Developer Competition 2026](https://start-developer-competition-26.devpost.com/)  
**Submission Window:** September 24 – November 18, 2026 (12:00 PM PST)  
**Selected Track:** **Entertainment**  
**Recommended Division:** **New Experience** *(or Adapted / Significantly Updated Experience if an earlier public build shipped prior to Sept 24, 2026)*  
**Build Path:** **Immersive Web / WebXR** (Meta Quest Browser + Desktop WebXR)  
**Target Devices:** Meta Quest 3, Meta Quest 3S, Meta Quest Pro, Meta Quest 2 (comfortable seated or standing, hands-first)

---

## 1. Devpost Submission Form Quick-Fill

| Devpost Form Field | Ready-to-Paste Content |
| :--- | :--- |
| **Project Title** | **Tabṣirah (تَبْصِرَة) — The Living Creation Engine** |
| **Tagline** *(133 / 140 chars)* | `Procedural WebXR sanctuary uniting 4 interconnected biomes, a 3D scientific lab, ecological experiments, and Mixed Reality portals.` |
| **Track** | **Entertainment** |
| **Division** | **New Experience** *(or Adapted if an earlier build shipped before Sept 24, 2026)* |
| **Build Path / SDK** | **Immersive Web (WebXR · A-Frame 1.5.0 · Three.js · Custom GLSL · Web Audio API)** |
| **Horizon OS Capabilities** | `Hand Tracking (Hands-First)`, `Mixed Reality Passthrough & Hit-Test Anchoring (immersive-ar)`, `Spatial Audio`, `Controller Haptics` |
| **Live WebXR Demo URL** | `https://ahmed-haggag-2016.github.io/tabsirah-webxr/` |
| **Repository URL** | `https://github.com/Ahmed-Haggag-2016/tabsirah-webxr` |

---

## 2. Written Project Story (Copy-Paste Ready)

### Inspiration
Most VR entertainment chases sensory overload, yet spatial computing is uniquely suited for quiet discovery—letting people explore nature, test how ecosystems depend on one another, inspect microscopic structures in 3D, and pause to reflect. **Tabṣirah (تَبْصِرَة)**—meaning *insight that awakens clear vision*—transforms WebXR into **The Living Creation Engine**: `Explore → Discover → Experiment → Transform → Understand → Reflect`.

### What It Does
Tabṣirah connects four procedural WebXR biomes through a shared ecological engine, multi-scale 3D science lab, and contemplative sanctuary:
1. **Polar Aurora (`aurora`):** Multi-octave GLSL auroral curtains (`557.7 nm` oxygen green & `427.8 nm` nitrogen violet), conductive sky sweeps, and an extractable 3D **Dipole Magnetosphere Cell**.
2. **Living Rainforest (`rainforest`):** Murray-branching L-system trees, raised-hand rainfall summoning, a refractive **7-Band Water-Droplet Optical Prism**, and an extractable **Leaf Stomata Evapotranspiration Chamber**.
3. **Coral Cathedral (`ocean`):** Seawater caustics (`1.333` IOR), Boids fish schooling, Gray-Scott Turing coral & Geodesic Voronoi lenses, and an extractable **Coral Polyp & Zooxanthellae Symbiosis Cup**.
4. **Desert Oasis (`desert`):** Aeolian dunes, Rayleigh/Mie twilight scattering, an **Artesian Aquifer** reveal, a **Polaris Star Compass**, and a **Porous Sandstone Aquifer Core**.

Across every scene, users can open **Eco & Time** to run cause-and-effect Butterfly Effect experiments and scrub a 3-step educational **Time Machine** (*Past Reference*, *Current*, *Future Illustrative Scenario*), examine specimens in the **Spatial Scientific Lab (`L`)**, track milestones in a zero-PII **Discovery Journal**, ask science questions to the offline-first **Nature Companion**, place the diorama on a real desk via **MR Hit-Test Passthrough (`T`)**, paint musical trails with **Wonder Brush (`W`)**, or unite all four relics in **Cosmic Convergence 2.0 (`G`)**.

### How We Built It
- **Zero-Asset Procedural WebXR Pipeline:** Built with A-Frame 1.5.0, Three.js, custom GLSL shaders, procedural Web Audio synthesis, and pooled GPU particle buffers with pre-allocated math vectors outside `tick()` loops.
- **Hands-First Interaction & Horizon OS Wrist Menu:** Features a formal proximity hand-tracking state machine (`idle` → `hover-preview` → `active` → `cooldown`), open-palm layer toggles, waist-height 3D VR/MR console, and a left-wrist flip radial menu (`Q` fallback).
- **Responsible Transparency & Offline Parity:** Curated RTL Arabic verses and commentary remain strictly authored in local data (`earth-biomes-data.js`); the optional server-side `/api/companion` Gemini proxy only answers scientific questions and falls back seamlessly to an offline scientific guide in static deployments.

---

## 3. Alignment with Devpost Judging Criteria

| Judging Criterion (25% Each) | How Tabṣirah Delivers |
| :--- | :--- |
| **1. Innovation & Creativity** | Replaces isolated static scenes with an interconnected **Ecosystem Butterfly Effect**, extractable **Spatial Scientific Lab** specimens, **Hit-Test Tabletop Portals**, calibrated **Mic Breath** resonance, and **Cosmic Convergence 2.0**. |
| **2. Experience Design** | Hands-first interactions paired with **diegetic 3D gesture cues**, collapsible side drawers, desktop/XR parity, and a calm **Deep Stillness Sanctuary (`S`)** with a 14-second **Guided Breath Pacer**. |
| **3. Technical Implementation** | Custom GLSL shaders, Web Audio `AnalyserNode` ambient noise-floor calibration (`1.5 s`), `XRHitTestSource` real-surface anchoring, zero-GC `tick()` loops, WebXR controller haptics, and clean Three.js disposal. |
| **4. Polish & Presentation** | Cohesive sky-emerald-gold palette, RTL `Amiri` typography, transparent educational model disclaimers, zero-PII local **Discovery Journal**, and an autonomous **Cinematic Mode**. |

---

## 4. Demo Video Script & Storyboard (< 3 Minutes · Recommended 2:50)

- **0:00 – 0:25 | Hook & Mixed Reality Tabletop Portal:** Open with the glowing **Polar Aurora** diorama hovering inside the **Tabletop Portal / MR Passthrough**, reach out to trigger a chromatic GLSL shockwave, and introduce *Tabṣirah — The Living Creation Engine*.
- **0:25 – 0:55 | Ecosystem Butterfly Effect & Time Machine:** Open **Eco & Time**, trigger *Trigger Canopy Rainfall* and *Restore Coral Symbiosis*, and step across *Past Reference → Current → Future Illustrative Scenario* to show living visual and metric feedback across biomes.
- **0:55 – 1:30 | Spatial Scientific Lab (`L`) & Optical Prism:** Extract the **Leaf Stomata** and **Coral Polyp** specimens onto the 3D lab pedestal, rotate, scale, and toggle **Micro Zoom**, alongside the **Water-Droplet 7-Band Prism** in the rainforest.
- **1:30 – 2:05 | Hands-First XR Console, Wrist-Flip Menu (`Q`) & Desert Polaris:** Show the waist-height 3D VR console, left-wrist flip quick menu, subterranean **Artesian Aquifer**, and **Polaris Star Compass**.
- **2:05 – 2:30 | Stillness Sanctuary (`S`), Calibrated Mic Breath & Nature Companion:** Show the `1.5 s` ambient noise calibration / Guided Pacer toggle in Stillness mode, plus a quick science answer in the **Nature Companion** and **Discovery Journal** progress.
- **2:30 – 2:50 | Cosmic Convergence 2.0 (`G`) Finale:** Unite all four biome relics in the clean orbital halo with perimeter filaments and harmonic chord, closing on title, live URL, and repository link.

---

## 5. Testing Guide & Honest Verification Notes

- **Desktop & Browser Testing:** Run `npm install && npm run dev` (`http://localhost:3000`). Test `1`–`4` biome switching, `Eco & Time` experiments, `L` Spatial Lab, `T` Tabletop Portal, `G` Cosmic Convergence 2.0, `W` Wonder Brush, `Q` Wrist Menu, `S` Stillness Sanctuary, `Journal`, and `Companion`.
- **Meta Quest Testing:** Serve over HTTPS (or `adb reverse tcp:3000 tcp:3000`) to enable `immersive-vr` and `immersive-ar` Passthrough sessions. Note that physical Meta Quest headset profiling remains pending hardware access; desktop WebGL and production server builds have been verified directly.
