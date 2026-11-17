# Devpost Submission Package: Tabṣirah (تَبْصِرَة)

**Competition:** [Meta VR Start Developer Competition 2026](https://start-developer-competition-26.devpost.com/)  
**Submission Window:** September 24 – November 18, 2026 (12:00 PM PST)  
**Selected Track:** **Entertainment**  
**Recommended Division:** **New Experience** *(See Division Note below)*  
**Build Path:** **Immersive Web / WebXR** (Meta Quest Browser + Desktop WebXR)  
**Target Devices:** Meta Quest 3, Meta Quest 3S, Meta Quest Pro, Meta Quest 2 (comfortable seated or standing, hands-first)

> **Division Guidance:** Choose **New Experience** if Tabṣirah was built for this competition and was not previously published to the Meta Horizon Store prior to September 24, 2026. Choose **Adapted / Significantly Updated Experience** only if an earlier public release existed before September 24, 2026 and this 4-biome WebXR + Tactile Touch FX + Mixed Reality Diorama build is its major competition update.

---

## 1. Devpost Submission Form Quick-Fill

| Devpost Form Field | Ready-to-Paste Content |
| :--- | :--- |
| **Project Title** | **Tabṣirah (تَبْصِرَة) — WebXR Living Biomes & Tactile Contemplation** |
| **Tagline** *(~130 / 140 chars)* | `Zero-asset WebXR sanctuary across 4 living biomes uniting GLSL shaders, hands-first tactile physics & Mixed Reality for Meta Quest.` |
| **Track** | **Entertainment** |
| **Division** | **New Experience** *(or Adapted if an earlier build shipped before Sept 24, 2026)* |
| **Build Path / SDK** | **Immersive Web (WebXR · A-Frame 1.5.0 · Three.js · Custom GLSL · Web Audio API)** |
| **Horizon OS Capabilities** | `Hand Tracking (Hands-First)`, `Mixed Reality Passthrough (immersive-ar)`, `Spatial Audio`, `Controller Haptics` |
| **Live WebXR Demo URL** | *Insert your stable HTTPS URL (keep active through December 11, 2026 winner announcement)* |
| **Demo Video URL** | *Insert public YouTube or Vimeo link (< 3 minutes — see Section 4 storyboard)* |
| **Repository URL** | *Insert public GitHub repository URL* |

---

## 2. Written Project Story (~475 Words — Copy-Paste Ready)

### Inspiration
Most VR entertainment chases constant speed and sensory overload, yet standalone headsets are uniquely suited for quiet wonder—spaces that slow time and let you examine Earth's hidden geometry up close. **Tabṣirah (تَبْصِرَة)**—an Arabic word meaning *insight that awakens clear vision*—unites real-time physics, hands-first spatial interaction, and contemplative reflection across four living biomes, all loaded instantaneously in Meta Quest Browser with **zero external 3D models, image textures, or audio files**.

### What It Does
Tabṣirah places you inside four scientifically grounded environments connected by a four-stage **Explore → Discover → Understand → Reflect** progression:
1. **Polar Aurora (`aurora`):** Multi-octave GLSL auroral curtains (`557.7 nm` oxygen green & `427.8 nm` nitrogen violet) over an Arctic fjord. Sweep your hands across the sky to conduct geomagnetic dipole arcs toward a coronal substorm burst.
2. **Living Rainforest (`rainforest`):** Murray-branching L-system canopy trees, cascading waterfall particles, and crepuscular god rays. Raise your palms to summon tropical rainfall, or zoom in to tilt a suspended **Water-Droplet Optical Prism** refracting a 7-band rainbow.
3. **Coral Cathedral (`ocean`):** Refractive wave caustics (`1.333` seawater IOR), decentralized Boids fish schooling, gliding manta rays, and touch-restorative corals alongside live **Gray-Scott Reaction-Diffusion** and **Geodesic Voronoi** lenses.
4. **Desert Oasis (`desert`):** Wind-carved aeolian dunes, Rayleigh/Mie solar scattering from High Sun to Starlight, a subterranean **Artesian Aquifer** reveal, and an interactive **Polaris Star Compass**.

At any moment, toggle **MR Passthrough** to shrink the biome into a clipped `0.85 m` circular hologram on your living-room table, engage **Cinematic Mode** for an autonomous narrated tour, or open the **Stillness Sanctuary (`S`)** with a breathing **16-fold Islamic Geometric Star Mandala** and 3D cymatic visualizer.

### How We Built It
We engineered a **0 KB external asset pipeline** in WebXR (`A-Frame 1.5.0` + `Three.js`):
- **Custom GLSL Shaders (`tactile-touch-fx.js`, `nature-shaders.js`, `wow-postprocessing.js`):** Chromatic-dispersion touch shockwaves with 16-fold geometric lattice interference, volumetric aurora raymarching, moving underwater caustics, Rayleigh sky domes, and selective bloom.
- **Procedural Web Audio (`nature-audio.js`):** Synthesizes filtered pink-noise wind and rain, ice chimes, whale calls, birdsong, oud-inspired desert plucks, and singing bowls live in-browser.
- **Hands-First Ergonomics (`biome-hand-controls`, `vr-spatial-console.js`):** Supports bare-hand fingertip touch on a waist-height 3D console, single-hand pinches, two-hand spread zoom, and seated/standing comfort alongside Touch controller shortcuts.

### Challenges & Performance Engineering
Achieving **60+ FPS** on standalone Quest hardware without asset downloads meant eliminating per-frame heap allocations. We pre-allocated shared vectors/quaternions outside every `tick()` loop, pooled particle buffers and `InstancedMesh` foliage, and replaced flat skybox backdrops with real-time math.

### What's Next
We plan to publish a packaged Horizon OS Progressive Web App / competition release channel build, expand tactile micro-optics modules, and add customizable spatial meditation timers.

---

## 3. Alignment with Devpost Judging Criteria (4 Equal Weights)

| Judging Criterion (25% Each) | How Tabṣirah Delivers |
| :--- | :--- |
| **1. Innovation & Creativity** | Replaces static skyboxes and multi-gigabyte downloads with a **0 KB procedural universe** combining scientific simulations (Rayleigh scattering, Snell dispersion, Gray-Scott PDEs, Boids) with tactile 16-fold geometric shaders and Mixed Reality tabletop dioramas. |
| **2. Experience Design** | Zero-friction **hands-first** onboarding works immediately while **seated or standing**: reach out to touch beacons, sweep the aurora sky, raise palms for rain, or tap the waist-height 3D console without text walls or complex menus. |
| **3. Technical Implementation** | Custom WebGL/GLSL shaders, procedural Web Audio synthesis, zero-GC `tick()` loops targeting **60+ FPS on Meta Quest 3 / 3S**, full `immersive-vr` and `immersive-ar` passthrough clipping planes, and haptic actuator feedback. |
| **4. Polish & Presentation** | Cohesive sky-emerald-gold visual palette, smooth 420 ms biome transitions, progressive 4-stage UI disclosure, spoken voice narration, real-world documentary photos/video verification, and an autonomous **Cinematic Mode**. |

---

## 4. Demo Video Script & Storyboard (< 3 Minutes)

> **Devpost Rule Tip:** Put your strongest Meta Quest Mixed Reality + Hands-First moments in the first 30 seconds. Keep total runtime under **3:00** (recommended **2:45**).

- **0:00 – 0:25 | Hook & Mixed Reality Passthrough Diorama:**  
  Open directly in Meta Quest 3 **MR Passthrough** showing a glowing circular **Polar Aurora** diorama hovering over a real-world table. Reach out with bare hands—a GLSL chromatic shockwave ripples across the fjord.  
  *VO:* *"This entire living WebXR world weighs zero kilobytes of external models, textures, or audio. Welcome to Tabṣirah—built for Meta Quest."*
- **0:25 – 0:55 | Polar Aurora & Hands-First Solar Wind Conduction:**  
  Switch to full VR immersion. Sweep bare hands across the starry sky to bend geomagnetic arcs until a coronal substorm illuminates the fjord. Tap **Reveal Magnetic Shield** on the 3D waist console.
- **0:55 – 1:30 | Living Rainforest & Water-Droplet Optical Prism:**  
  Raise both open palms to summon warm tropical rainfall over L-system canopy trees. Two-hand spread zoom inward to summon the suspended **Water-Droplet Prism**, tilting it by hand to split daylight into a live 7-band rainbow on the forest floor.
- **1:30 – 2:05 | Coral Cathedral & Turing Morphogenesis:**  
  Descend beneath sunlit caustics as Boids reef fish swim past a gliding manta ray. Touch pale coral nodes to restore reef luminescence and inspect the live Gray-Scott reaction-diffusion sphere and Geodesic Voronoi lens.
- **2:05 – 2:30 | Desert Oasis, Twilight Scattering & Polaris Alignment:**  
  Scrub the 3D Solar slider from Golden Hour to Starlight. Reveal the subterranean **Artesian Aquifer** feeding oasis palms and rotate the Star Compass to align Polaris North.
- **2:30 – 2:45 | Stillness Sanctuary & Closing:**  
  Press **Stillness (`S`)** to reveal the 16-fold Islamic geometric star mandala pulsing overhead with the 14-second breath pacer and live URL/repo title card.

---

## 5. Step-by-Step Testing Guide for Judges

### A. Testing on Meta Quest (Quest 3, 3S, Pro, 2)
1. Put on your headset (comfortable **seated or standing**) and open **Meta Quest Browser**.
2. Navigate to the submitted **HTTPS Live Demo URL** *(Note: HTTPS is required for Quest WebXR & Passthrough permissions)*.
3. Tap **Begin Exploration**, then choose **Enter VR / MR** (or **MR Passthrough** for tabletop diorama mode).
4. **Hands-First Gestures to Test (Controllers Optional):**
   - **Touch Any Beacon / Surface:** Reach out your fingertip to touch glowing discovery beacons or floating waist-console buttons; observe the chromatic GLSL shockwave and spatial audio chime.
   - **Two-Hand Spread Zoom:** Pinch both hands and spread them apart to zoom into **Macro-to-Micro living lenses** (or pinch together to zoom out to aerial view).
   - **Aurora Sky Sweep:** Move your hand briskly through the Polar Aurora sky to bend geomagnetic arcs toward a coronal substorm.
   - **Rainforest Palm Raise:** Lift your hand overhead (`> 1.65 m`) to summon warm rain, then zoom in (`+` on console) to tilt the Water-Droplet Optical Prism.
   - **Left-Hand Solar Scrub:** Pinch with your left hand and sweep horizontally to transition smoothly between Starlight and Daylight.

### B. Testing on Desktop (Chrome / Edge / Firefox)
1. Run `npm install && npm run dev` and open `http://localhost:3000` (or open the live HTTPS URL).
2. Click **Begin Exploration** (or **Start Cinematic Tour** for hands-off autopilot).
3. Use `1`–`4` or `Space` to switch biomes, `E` to trigger each biome's primary revelation, `S` for Stillness Sanctuary, `+`/`-` to zoom into micro-lenses, `[`/`]` to scrub Day/Night solar elevation, and click anywhere in 3D to trigger tactile touch shockwaves.

---

## 6. Final Pre-Submission Checklist

- [ ] Active member of the **Meta VR Start Program** & Meta Developer Account verified.
- [ ] Live WebXR **HTTPS URL** verified on Meta Quest Browser (accessible through **December 11, 2026**).
- [ ] Public **YouTube / Vimeo Demo Video** uploaded and under **3 minutes**.
- [ ] **Track** set to `Entertainment`, **Division** set to `New Experience` *(unless previously shipped prior to Sept 24, 2026)*.
- [ ] Root `LICENSE` (**MIT**) and `README.md` verified up to date.
