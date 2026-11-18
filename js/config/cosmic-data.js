/**
 * Tabsirah: The Architecture of Light & Order (تَبْصِرَة)
 * Pure Data Layer — 5 Contemplation Stations
 * Verified scientific constants, authentic Arabic Quranic verses (dir="rtl"),
 * accurate English translations & concise Tafsir, and English narration scripts.
 */

export const SCENE_ORDER = ['light', 'morphogenesis', 'gravity', 'abyss', 'resonance'];

export const COSMIC_DATA = {
  light: {
    id: 'light',
    orderIndex: 0,
    navLabel: '1. Light & Dispersion',
    title: 'The Physics of Light & Dispersion',
    subtitle: 'Snell Refraction, Internal Reflection & Spectral Caustics',
    domainTag: 'Optics & Color · λ = 380–750 nm',
    scientificConstant: 'n(water, 589 nm) = 1.333 · Rainbow primary deviation ≈ 42.0° (red) to 40.3° (violet)',
    skyColor: '#040713',
    accentColor: '#38BDF8',
    arabicVerse: '﴿اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ كَمِصْبَاحٍ فِيهَا مِصْبَاحٌ﴾',
    englishTafsir:
      'Allah is the Light of the heavens and the earth. The parable of His light is like a niche within which is a lamp. (An-Nur 24:35) — Classical Tafsir highlights how physical light unveils form, color, and proportion, serving as a sign pointing toward the Source of all illumination and guidance.',
    fullNarration:
      'Contemplate a single beam of pure white light meeting a suspended droplet of clear water. Though seemingly uniform, white light conceals the entire visible spectrum from three hundred eighty to seven hundred fifty nanometers. As photons cross from air into water, each wavelength slows differently according to Cauchy’s dispersion law, reflects internally off the curved crystal boundary, and emerges split into seven luminous bands near forty-two degrees. Tilt the crystal prism before you and watch order unfold from light itself.',
    interactionHint:
      'Drag the suspended Crystal Droplet (or move cursor/hand across the beam) to tilt incidence and sweep the 7-band rainbow and floor caustics.',
    nodeInsight: {
      title: 'Descartes-Snell Rainbow Angle',
      metric: '42.0° Red (656 nm) · 40.3° Violet (405 nm) · n ≈ 1.333',
      detail:
        'A single internal reflection inside a spherical water droplet concentrates refracted rays near the minimum-deviation caustic angle of ~42°, turning countless microscopic raindrops into a coherent arch of color.'
    }
  },

  morphogenesis: {
    id: 'morphogenesis',
    orderIndex: 1,
    navLabel: '2. Morphogenesis',
    title: 'Turing Morphogenesis & Voronoi Tessellation',
    subtitle: 'Gray-Scott Reaction-Diffusion & Geodesic Cellular Order',
    domainTag: 'Mathematical Biology · Feed f = 0.037, Kill k = 0.060',
    scientificConstant: 'Alan Turing (1952) Reaction-Diffusion PDE · Optimal 120° Voronoi surface energy partitioning',
    skyColor: '#050B14',
    accentColor: '#34D399',
    arabicVerse: '﴿قَالَ رَبُّنَا الَّذِي أَعْطَىٰ كُلَّ شَيْءٍ خَلْقَهُ ثُمَّ هَدَىٰ﴾',
    englishTafsir:
      'He said, "Our Lord is He who gave each thing its form and then guided it." (Ta-Ha 20:50) — Commentators note that every creature receives both its distinct structural blueprint and the innate laws governing its growth and harmony.',
    fullNarration:
      'Across dragonfly wings, reef corals, leaves, and desert dunes, nature repeats silent geometric laws. On your left, a geodesic Voronoi tessellation partitions curved space into optimal polygonal cells—the same efficiency principle shaping honeycombs and turtle shells. On your right, a live Gray-Scott reaction-diffusion simulation computes two interacting morphogens in real time, turning uniform chemistry into labyrinthine coral ridges and spots. Touch or click either structure to inject a morphogen pulse and watch living mathematics reorganize itself.',
    interactionHint:
      'Click or pinch the Voronoi Mesh or Turing Coral Sphere to inject a live morphogen wave and shift spots into labyrinth ridges.',
    nodeInsight: {
      title: 'Gray-Scott Reaction-Diffusion & Voronoi Metric',
      metric: '∂u/∂t = Dᵤ∇²u − uv² + f(1−u) · ∂v/∂t = Dᵥ∇²v + uv² − (f+k)v',
      detail:
        'When an activator diffuses slowly and an inhibitor diffuses faster, microscopic fluctuations amplify spontaneously into stable biological patterns without any external template.'
    }
  },

  gravity: {
    id: 'gravity',
    orderIndex: 2,
    navLabel: '3. Gravity & Orbits',
    title: 'Sculptable Gravity Wells & Orbital Harmony',
    subtitle: 'Curved Spacetime Metric, Keplerian Orbits & Solar MHD Loops',
    domainTag: 'Celestial Mechanics · v = √(GM / r) · G = 6.674 × 10⁻¹¹',
    scientificConstant: 'Earth orbital speed = 29.78 km/s · Solar coronal magnetic loops reach 10⁵–10⁶ K',
    skyColor: '#030612',
    accentColor: '#FBBF24',
    arabicVerse: '﴿وَالشَّمْسُ تَجْرِي لِمُسْتَقَرٍّ لَّهَا ۚ ذَٰلِكَ تَقْدِيرُ الْعَزِيزِ الْعَلِيمِ﴾',
    englishTafsir:
      'And the sun runs on course toward its appointed term. That is the precise determination of the Exalted in Might, the Knowing. (Ya-Sin 36:38) — Tafsir emphasizes "taqdir" (exact mathematical measure), linking cosmic stability to finely balanced trajectories.',
    fullNarration:
      'Nothing in the heavens drifts without measure. Here, a central star crowns glowing magnetohydrodynamic coronal loops while bending the surrounding spacetime fabric downward into a gravitational well. Luminous test-planets glide along that curvature; move a fraction too slowly and gravity pulls them inward, too fast and they escape into the void. Click or pinch anywhere across the spacetime grid to sculpt temporary mass nodes, bend the fabric live, and watch orbital trajectories respond.',
    interactionHint:
      'Click or pinch anywhere on the Spacetime Grid to place temporary Mass Nodes (max 5) and watch orbits bend in real time. Double-click or press Reset Wells to clear.',
    nodeInsight: {
      title: 'Spacetime Curvature & MHD Solar Loops',
      metric: 'v_circ = √(GM/r) · Escape speed v_esc = √2 · v_circ',
      detail:
        'Mass tells spacetime how to curve, and curved spacetime tells planets how to move—while twisting magnetic flux tubes above the solar photosphere channel blazing plasma arches.'
    }
  },

  abyss: {
    id: 'abyss',
    orderIndex: 3,
    navLabel: '4. Deep-Sea Abyss',
    title: 'Deep-Sea Bioluminescence & Abyssal Order',
    subtitle: 'Hadopelagic Darkness, Fresnel Jellyfish & Luciferin Trails',
    domainTag: 'Abyssal Oceanography · Depth 1,000–4,000 m · λ ≈ 475 nm',
    scientificConstant: 'Bathypelagic zone receives 0% sunlight below 1,000 m · ~76% of deep-sea organisms bioluminesce',
    skyColor: '#010308',
    accentColor: '#22D3EE',
    arabicVerse: '﴿أَوْ كَظُلُمَاتٍ فِي بَحْرٍ لُّجِّيٍّ يَغْشَاهُ مَوْجٌ مِّن فَوْقِهِ مَوْجٌ مِّن فَوْقِهِ سَحَابٌ﴾',
    englishTafsir:
      'Or they are like darknesses within an unfathomable deep sea which is covered by waves, upon which are waves, over which are clouds. (An-Nur 24:40) — Scholars marvel at the Qur’an’s vivid depiction of layered darkness in deep ocean waters miles beneath surface waves.',
    fullNarration:
      'Descend more than a thousand meters below the sunlit surface, beyond internal deep-water waves into total abyssal darkness. Not a single solar photon reaches this pressure-bound realm—yet life flourishes in quiet perfection. More than three quarters of deep-sea creatures synthesize luciferin and luciferase to emit cold blue-cyan light near four hundred seventy-five nanometers. Sweep your cursor or hands through the dark current to awaken swirling bioluminescent plankton and reveal translucent jellyfish and siphonophores pulsing in the deep.',
    interactionHint:
      'Sweep your cursor or move your hands through the dark water to stir glowing bioluminescent plankton trails around pulsing jellyfish.',
    nodeInsight: {
      title: 'Cold Chemical Light in the Bathypelagic Zone',
      metric: '~475 nm Deep-Ocean Cyan Emission · Near 100% Chemical-to-Light Efficiency',
      detail:
        'Unlike incandescent heat, luciferin oxidation releases almost zero thermal waste—allowing fragile abyssal organisms to communicate, attract prey, and illuminate total darkness.'
    }
  },

  resonance: {
    id: 'resonance',
    orderIndex: 4,
    navLabel: '5. Breath Resonance',
    title: 'Breath-Synchronized Cosmic Resonance',
    subtitle: '16-Fold Islamic Star Mandala & Embodied Stillness',
    domainTag: 'Sacred Geometry & Physiology · 0.1 Hz Coherent Breathing',
    scientificConstant: '16-fold dihedral symmetry (D₁₆, 22.5° rosette intervals) · ~6 breaths/min vagal resonance',
    skyColor: '#060714',
    accentColor: '#FDE047',
    arabicVerse: '﴿الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾',
    englishTafsir:
      'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured. (Ar-Ra’d 13:28) — Reflects how steady, mindful remembrance brings physiological and spiritual equilibrium.',
    fullNarration:
      'Arrive at stillness. Before you floats a sixteen-fold Islamic geometric star mandala woven from golden filaments—symmetry born from dividing a single circle by compass and straightedge. Synchronize this living geometry with your own breath: toggle Microphone Breath Detection or rest with the rhythmic Guided Breath cycle. As you inhale, the nested star rings expand smoothly outward and warm harmonies swell; as you exhale, the geometry settles back into luminous, centered peace.',
    interactionHint:
      'Enable Mic Breath Sync (or use the automatic Guided Breath rhythm) to expand the 16-fold golden mandala with each inhale and settle on exhale.',
    nodeInsight: {
      title: '16-Fold Girih Rosette & Respiratory Resonance',
      metric: '22.5° Angular Sectoring · 0.1 Hz (10s) Heart-Breath Coherence',
      detail:
        'Slow rhythmic breathing near six cycles per minute synchronizes heart-rate variability and autonomic calm, mirrored visually by concentric polygonal expansion.'
    }
  }
};
