# Devpost Submission Package: Tabsirah (تَبْصِرَة)

**Competition:** [Meta Quest Start Developer Competition 2026](https://start-developer-competition-26.devpost.com/)  
**Project Name:** Tabsirah (تَبْصِرَة) — WebXR Cosmic Contemplation, Procedural Biomes & Hands-First Reflection  
**Target Platform:** Meta Quest 3, Meta Quest 3S, Meta Quest Pro, Meta Quest 2 (via Meta Quest Browser) & Desktop Chrome/Edge/Firefox (WebXR Compatible)  
**Built With:** WebXR, Three.js, A-Frame, Custom GLSL Shaders, Web Audio API (100% Procedural Synthesis), HTML5 Canvas, Meta Quest Hand Tracking API, Mixed Reality Passthrough (WebXR Immersive AR).  

---

## 1. Submission Form Fields Quick-Fill

| Field | Content |
| :--- | :--- |
| **Project Title** | **Tabsirah (تَبْصِرَة) — WebXR Living Biomes & Hands-First Cosmic Reflection** |
| **Tagline (under 200 chars)** | A zero-asset WebXR sanctuary across 5 living biomes uniting custom GLSL shaders, hands-first tactile physics, and contemplative science for Meta Quest. |
| **Track / Category** | **Immersive Worlds & Entertainment** / **Hands-First Interaction** / **WebXR Innovation** |
| **Repository URL** | [Attached Project Workspace Repository] |
| **WebXR Live Demo URL** | Dev Server Port 3000 / AI Studio Live Preview |
| **Demo Video URL** | *(Insert 3-minute video link based on the script below)* |

---

## 2. Elevator Pitch (2-Minute Read)

> *"In the creation of the heavens and the earth, and the alternation of night and day, are signs for those of understanding."*

**Tabsirah (تَبْصِرَة)**—meaning *"an enlightening insight that opens the eyes and heart"*—is a groundbreaking WebXR spatial sanctuary designed specifically for the Meta Quest ecosystem. Built with **100% procedural code and zero external assets (0KB models, 0KB textures, 0KB audio files)**, Tabsirah immerses users into five breathtaking, scientifically authentic biomes:
1. **Polar Aurora**: Geomagnetic dipole arcs, solar wind conductor physics, and coronal substorms.
2. **Living Rainforest**: Dynamic Rayleigh canopy light, interactive water-droplet optical prisms, and rain-summoning gestures.
3. **Coral Cathedral**: Real-time wave caustics, decentralized Boids fish schooling, and Gray-Scott reaction-diffusion coral morphogenesis.
4. **Desert Oasis**: Aeolian ripple dunes, twilight atmospheric scattering, and deep subterranean artesian aquifers.
5. **Alpine Peaks**: Glaciated pyramidal horns with knife-edge arêtes, turquoise glacial tarns, cascading waterfalls, agile Alpine Ibex and sentry marmots, and deep tectonic peg roots ("الأوتاد") balancing Airy isostasy.

Tabsirah features a flagship **Multi-Sensory Tactile Touch Effects System (`js/components/tactile-touch-fx.js`)**: touching, pinching, or pointing at any surface unleashes custom GLSL chromatic dispersion shockwaves, 16-fold Islamic geometric lattices, spatial haptic pulses, and procedural harmonic chords. Users can toggle between **Full VR Immersion**, **Mixed Reality Passthrough Diorama Mode**, or an autonomous **Cinematic Director Mode** that automatically curates a cinematic journey through all five biomes.

---

## 3. Project Story & Inspiration

### The Spark of Inspiration
Modern digital life is dominated by sensory noise, high-frequency notifications, and transactional interactions. Virtual reality has immense potential for entertainment and action, but rarely is it utilized as a sacred medium for **Tafakkur (تَفَكُّر)**—the ancient practice of deep, contemplative reflection upon the subtle design, balance, and interconnectedness of our living universe.

We asked ourselves:
- *What if WebXR could bring users face-to-face with the breathtaking precision of Earth's ecosystems?*
- *What if the same physical laws that govern high-altitude snowmelt, geomagnetic solar winds, and coral morphogenesis could be experienced tactually with our own two hands?*
- *What if this entire universe could load instantly in a browser with zero download barriers, zero external assets, and locked 60+ FPS performance on Meta Quest?*

This vision birthed **Tabsirah**.

### What It Does
Tabsirah is a multi-dimensional spatial experience that bridges empirical scientific telemetry and deep contemplative reflection:
- **Five Living Procedural Biomes**: Each biome is rendered completely in real time using custom GLSL shaders, procedural geometries, and mathematical field simulations.
- **Hands-First Spatial Interactions**: Built natively for Meta Quest Hand Tracking (`immersive-vr` / `immersive-ar`). Sweep your hands across the sky to bend geomagnetic field lines; raise your palms upward to summon rainfall; tilt a suspended water droplet to refract a 7-band rainbow; or balance deep crustal roots to achieve tectonic isostasy.
- **Seamless "Macro-to-Micro" Living Lenses**: Zooming in smoothly transitions from macro landscape panoramas into interactive scientific micro-wonders:
  - *Rainforest:* Suspended Water-Droplet Optical Prism (`water-prism-optics`) refracting live caustic rings.
  - *Ocean:* Live Gray-Scott Reaction-Diffusion Turing Coral Sphere (`turing-coral-sphere`) and Geodesic Voronoi Mesh responding to touch.
  - *Stillness Sanctuary:* A 16-Fold Islamic Geometric Star Mandala (`islamic-star-mandala`) overhead, pulsing in real time with guided breath pacing and a 3D cymatic visualizer.
- **Autonomous Cinematic Camera Director**: A one-touch automated cinematic mode that guides the user on an aerial-and-closeup pilgrimage across all five biomes with smooth Bezier camera splines and synchronized nature narration.
- **Mixed Reality (MR) Passthrough Diorama**: With one click or controller trigger, dissolve the virtual sky dome and project a floating, circular holographic biome diorama right into your physical living room.

---

## 4. Technical Architecture & Engineering Marvel

### 1. 100% Procedural Zero-Asset Engine (0 KB External Assets)
In an era where VR titles require 20GB to 50GB downloads, Tabsirah contains **zero external `.glb`, `.gltf`, `.png`, `.jpg`, or `.mp3` files**.
- **Procedural PBR Textures**: All normal maps, basalt fracture grids, sand ripple reliefs, bark roughness, and caustics are synthesized at runtime into GPU `CanvasTexture` / `DataTexture` instances with 16× anisotropic filtering.
- **Composite Procedural Geometries**: Every animal (Alpine Ibex, Golden Eagle, Camel, Manta Ray, Sea Turtle, Marmot) is constructed as an articulated 3–12 part `THREE.Group` utilizing mathematical extrusions, lathes, and parametric cones.
- **Zero-GC Frame Budget**: All animation variables, vectors (`_vec3`), matrices, and quaternions are pre-allocated outside the render loop, guaranteeing 60+ FPS with zero garbage collection stutter on Meta Quest Browser.

### 2. Custom GLSL Shaders
- **Volumetric Aurora Borealis Shader**: Multi-octave fractional Brownian motion (fBm) raymarching inside an atmospheric dome, generating shimmering emerald, violet, and magenta curtain folds.
- **Atmospheric Sky Dome & Rayleigh/Mie Scattering**: Physically calculated solar angles simulating dawn, noon, twilight, and starlight with dynamic wavelength-dependent blue light attenuation.
- **Dynamic Optical Water Caustics**: GPU-calculated moving voronoi intersection networks refracting sunlight onto seabed corals and pool floors.
- **Tactile Shockwave & Chromatic Dispersion Shader**: Spawns localized 3D expanding rings with split cyan-gold chromatic edges and 16-fold Islamic geometric lattice interference patterns upon fingertip contact.

### 3. 100% Procedural Web Audio Synthesizer (`nature-audio.js`)
No audio files are bundled or streamed. The soundscape is synthesized live via the Web Audio API:
- **Atmospheric Wind & Ocean Waves**: Multi-stage biquad-filtered pink noise modulated by low-frequency oscillators (LFOs).
- **Fauna Audio Cues**: Piercing Golden Eagle downward frequency chirps (sawtooth swept from 2600Hz to 1420Hz), high-frequency Alpine Marmot sentinel whistles (3200Hz dual chirps), whale songs, and tropical birds.
- **Tactile Resonance**: Biome-adaptive harmonic frequencies (ice chimes, ocean sonar pings, desert oud-inspired plucked chords, tectonic sub-bass hums).
- **Calm English Voice Narrator**: Real-time Web Speech Synthesis offering contemplative commentary and Tafsir reflections.

### 4. Geological & Geomorphological Realism
- **Alpine Glaciated Horns & Knife-Edge Arêtes**: Modeled after Matterhorn geomorphology with faceted faces, cirque amphitheaters, and talus scree fans.
- **Slope-Based Strata Shading**: Surface normals dictate snow accumulation. Vertical cliff faces (>46° slope) shed snow to expose dark granitic/basalt strata, while gentle high cirques hold deep firn ice.
- **Airy Isostasy Crustal Roots ("الأوتاد" - Mountains as Pegs)**: Demonstrates the geophysical truth of Surah An-Naba (78:7) and Sir George Airy's isostasy—towering mountains possess buoyant crustal roots plunging 4.5× deeper into the mantle than their surface elevation.

---

## 5. Challenges & Solutions

| Challenge | Solution |
| :--- | :--- |
| **Mobile WebXR Performance on Standalone Quest** | Avoided heavy external meshes; utilized pooled `InstancedMesh` for 60+ pines, 65+ wildflowers, and thousands of particle drops. Optimized draw calls and capped pixel ratio dynamically. |
| **Garbage Collection Freezing in VR** | Zero object allocations inside `tick(time, timeDelta)`. Pre-allocated shared vectors and reused buffer attributes with `.needsUpdate = true`. |
| **Realistic Terrain Without Heightmap Images** | Engineered multi-octave ridged noise combining smoothstep valley masks, facet arête multipliers, and tarn depressions in pure mathematical code. |
| **Natural Hands-First Ergonomics** | Designed dual interaction paths: users can reach out and touch 3D specimens directly via Quest hand tracking, or utilize the unified glassmorphic bottom dock on desktop. |

---

## 6. Three-Minute Video Demonstration Script & Storyboard

### Scene 1: Opening & The Polar Aurora (0:00 – 0:35)
- **Visual:** Camera slowly rises into the shimmering emerald and violet curtains of the Polar Aurora. Ice floes drift across the Arctic sea.
- **Action:** User raises Quest tracked hands into the sky. Sweeping motions bend the geomagnetic dipole arcs; the sky responds with harmonic crystalline chimes before erupting in a coronal substorm burst.
- **Voiceover:** *"Welcome to Tabsirah—a WebXR journey across Earth's living biomes, designed to awaken wonder and contemplative insight. Built with zero external assets, every particle, wave, and light ray is generated in real time."*

### Scene 2: Living Rainforest & Optical Prism (0:35 – 1:10)
- **Visual:** Transition into the emerald canopy of the Amazon. Shafts of sunlight pierce through towering Kapok trees.
- **Action:** User pinches to zoom in, summoning the suspended Water-Droplet Optical Prism. By tilting the droplet with hand tracking, a live 7-band rainbow and floor caustics refract in real time. User raises palms to summon a warm tropical rain shower.
- **Voiceover:** *"In the Rainforest, light and water dance in divine precision. Zooming inward reveals the micro-optics of a single suspended raindrop, refracting daylight into pure spectral harmony."*

### Scene 3: Coral Cathedral & Morphogenesis (1:10 – 1:45)
- **Visual:** Submerged beneath sunlit ocean waves. Schools of reef fish weave past swaying kelp and brain corals.
- **Action:** User touches a pale coral formation. A glowing shockwave ripples outward with chromatic dispersion; the Gray-Scott Reaction-Diffusion sphere activates, generating live morphogen patterns.
- **Voiceover:** *"Beneath the waves, the Coral Cathedral demonstrates decentralized intelligence—hundreds of schooling fish coordinating through simple proximity, while coral polyps bloom through reaction-diffusion morphogenesis."*

### Scene 4: Desert Oasis & Twilight Scattering (1:45 – 2:15)
- **Visual:** Golden sand dunes of the Sahara stretch to the horizon beside a tranquil palm-fringed oasis.
- **Action:** User adjusts the Solar slider to twilight. Golden Rayleigh scattering shifts to violet starlight; user unlocks the subterranean artesian aquifer, watching groundwater rise to feed the palms.
- **Voiceover:** *"In the desert, stillness reveals the hidden architecture of water. Subsurface aquifers sustain life beneath arid sands, while the evening sky scatters daylight into celestial constellations."*

### Scene 5: Alpine Peaks & Tectonic Peg Roots (2:15 – 2:45)
- **Visual:** Glaciated Matterhorn horn peaks with razor-sharp arêtes, cascading waterfalls tumbling into a turquoise glacial tarn, with Alpine Ibex and sentry marmots perched on rocks.
- **Action:** User toggles X-Ray Mode. The mountains become translucent, revealing massive peg-like crustal roots plunging 4.5× deeper into the glowing magma mantle. User balances the Airy Isostasy slider to achieve hydrostatic equilibrium.
- **Voiceover:** *"Rising to alpine heights, glaciated horns feed continental watersheds. And deep underground, we witness the scientific reality described centuries ago: mountains as deep anchoring pegs balancing Earth's tectonic crust."*

### Scene 6: Stillness Sanctuary, MR Passthrough & Conclusion (2:45 – 3:00)
- **Visual:** User activates Stillness Sanctuary. A 16-fold Islamic star mandala pulses overhead to guided breathing; user toggles MR Passthrough, placing the living biome diorama right on their living room coffee table.
- **Voiceover:** *"Tabsirah is more than technology—it is an invitation to see the world with open eyes. Experience Tabsirah today on Meta Quest."*

---

## 7. Step-by-Step Testing Guide for Hackathon Judges

### Testing on Meta Quest Headsets (Quest 3, 3S, Pro, 2)
1. Launch **Meta Quest Browser** inside your headset.
2. Navigate to the application URL (or your local IP address on port 3000).
3. Put down your controllers to automatically engage **Meta Quest Hand Tracking**.
4. Click or air-tap **"Enter VR"** (or **"MR Passthrough"** for mixed reality).
5. **Interactive Gestures to Try:**
   - **Touch Any Object:** Reach out your index fingertip to touch any rock, beacon, water surface, or animal. Observe the GLSL chromatic shockwave, haptic pulse, and spatial audio tone.
   - **Pinch Zoom:** Pinch your thumb and index finger together and move toward/away from your chest, or spread both hands apart to enter the **Macro-to-Micro Living Lens**.
   - **Rainforest:** Raise both open palms upward to summon rainfall; pinch the suspended water prism to tilt its rainbow.
   - **Aurora:** Sweep your hand across the sky to conduct geomagnetic solar wind arcs.
   - **Mountains:** Touch the mountain beacon to enter X-Ray mode and reveal the subterranean peg roots; adjust the Airy isostasy balance.
   - **Stillness Sanctuary:** Press the **Stillness Sanctuary** button to engage the breathing mandala and cymatics.

### Testing on Desktop (Chrome, Edge, Firefox)
1. Open the project URL in any modern browser.
2. Click **"Enter Experience"** on the opening splash card.
3. **Keyboard Controls:**
   - `1` – `5`: Instant switch between all 5 biomes (Polar Aurora, Rainforest, Ocean, Desert, Alpine Peaks).
   - `Space`: Step forward to next biome (or `Shift + Space` for previous).
   - `C`: Toggle autonomous **Cinematic Mode**.
   - `S`: Toggle **Stillness Sanctuary** (breathing mandala + cymatics).
   - `X`: Toggle **X-Ray Subterranean View** (aquifer in desert, tectonic peg roots in mountains).
   - `+` / `-`: Zoom in / Zoom out across Macro-to-Micro lenses.
   - `H`: Hide/Show the bottom control dock for clean full-screen viewing.
   - `Arrow Keys`: Pan and rotate camera vantage.
   - `Mouse Drag / Click`: Look around in 360° and click any surface to trigger the tactile touch ripple.

---

## 8. Summary of Track Alignment
- **Meta Quest Hands-First Award:** Direct fingertip contact, pinching, two-hand spread zoom, sky conduction, and rain summoning.
- **Immersive Worlds & Entertainment Award:** 5 living, breathing biomes rendered with photorealistic atmospheric lighting, dynamic fauna, and zero-asset procedural brilliance.
- **WebXR Innovation Award:** Proves that high-end VR experiences can run instantly in the browser without friction, downloads, or asset bloat.
