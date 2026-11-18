/**
 * Tabsirah: Earth's Biomes & Ecological Precision
 * Pure Data Layer — 4 Immersive Earth Biomes
 * Cleanly separates authentic Arabic Qur'anic verses (dir="rtl"), reliable English translations,
 * explanatory reflections (Tafsir context), accurate scientific context (explicitly marking
 * educational models), and structured Discover-Understand-Reflect progression payloads.
 */

export const BIOME_ORDER = ['aurora', 'rainforest', 'ocean', 'desert'];

export const EARTH_BIOMES_DATA = {
  aurora: {
    id: 'aurora',
    orderIndex: 0,
    navLabel: '1. Polar Aurora',
    shortTitle: 'Polar Aurora',
    title: 'The Polar Aurora & Magnetic Sky',
    coordinates: '69.65°N, 18.96°E · Tromsø Arctic Circle',
    subtitle: 'Geomagnetic Shielding, Solar Wind & 557.7 nm Emission',
    ecologicalMetric: '69.65°N Arctic Circle · Oxygen 557.7 nm green · Altitude 90–300 km',
    skyColor: '#0A1E36',
    accentColor: '#34D399',
    defaultSolar: -0.14,
    panoramaUrl: './assets/biomes/aurora_fjord.jpg',
    arabicVerse: '﴿وَلَقَدْ جَعَلْنَا فِي السَّمَاءِ بُرُوجًا وَزَيَّنَّاهَا لِلنَّاظِرِينَ﴾',
    surahRef: 'Surah Al-Hijr (15:16)',
    quranTranslation:
      'And We have placed within the heaven great constellations and have beautified it for the observers.',
    explanatoryReflection:
      'Classical commentators reflect on how the heavens pair ordered structure and protective boundaries with luminous beauty that invites thoughtful observation.',
    englishTafsir:
      'And We have placed within the heaven great constellations and have beautified it for the observers. (Al-Hijr 15:16) — Classical reflection highlights cosmic order paired with beauty for contemplative minds.',
    scientificContext:
      'Educational model: Earth’s dipole magnetic field deflects charged solar wind particles away from the equator and channels a fraction toward the polar ovals. Collisions with upper-atmospheric oxygen (~557.7 nm green, ~630 nm red) and nitrogen (~427.8 nm violet) release the glowing curtains seen here.',
    discovery: {
      objectName: 'Geomagnetic Aurora Beacon',
      conciseSummary:
        'A solar-wind pulse just traced Earth’s protective magnetic field lines, funneling charged particles into glowing polar oxygen ribbons.',
      modelNote: 'Interactive educational model of Earth’s magnetosphere',
      revelationLabel: 'Reveal Magnetic Shield',
      activeLabel: 'Shield Revealed',
      beaconPos: '0 2.05 -5.4',
      beaconType: 'magnetosphere'
    },
    fullNarration:
      'Stand beside a quiet Arctic fjord beneath the starry northern sky. Far above, charged particles from the Sun encounter Earth’s magnetic field. Deflected along curving field lines toward the poles, they excite upper-atmospheric oxygen and nitrogen atoms, releasing luminous ribbons of emerald and violet light. Tap the glowing beacon or choose Reveal Magnetic Shield to visualize the protective dipole arcs.',
    interactionHint:
      'Sweep the aurora sky to conduct solar wind toward a coronal substorm, or reveal Earth’s magnetic shield.',
    actionLabel: 'Reveal Magnetic Shield',
    insight: {
      title: 'Geomagnetic Auroral Fluorescence (Educational Model)',
      metric: '557.7 nm Oxygen Green · 630.0 nm High-Altitude Red · 427.8 nm Nitrogen Violet',
      detail:
        'Earth’s magnetosphere deflects energetic solar plasma around the planet and channels polar streams safely into the upper atmosphere, turning cosmic radiation into silent sky light.'
    },
    realMedia: {
      youtubeId: 'Et2t-UcB1jY',
      videoTitle: 'The Complete Aurora Experience — 4K Real-Time Northern Lights (Lapland & Arctic)',
      photos: [
        {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Aurora_Borealis_Norway_2013.jpg/1280px-Aurora_Borealis_Norway_2013.jpg',
          caption: 'Aurora Borealis arching over snow-covered fjords in Djupvik, Troms, Norway.',
          credit: 'Wikimedia Commons · Real Arctic Field Photography'
        },
        {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Aurora_Borealis_Troms%C3%B8_Norway.jpg/1280px-Aurora_Borealis_Troms%C3%B8_Norway.jpg',
          caption: '557.7 nm emerald aurora curtain glowing above coastal mountains in Tromsø.',
          credit: 'Wikimedia Commons · Andi Gentsch'
        }
      ]
    }
  },

  rainforest: {
    id: 'rainforest',
    orderIndex: 1,
    navLabel: '2. Living Rainforest',
    shortTitle: 'Living Rainforest',
    title: 'The Living Rainforest & Hydrological Revival',
    coordinates: '3.46°S, 62.21°W · Amazon River Basin',
    subtitle: 'Canopy Architecture, Transpiration & Nutrient Revival',
    ecologicalMetric: '3.46°S Amazon Basin · Layered canopies & self-recycling atmospheric moisture',
    skyColor: '#071712',
    accentColor: '#34D399',
    defaultSolar: 0.55,
    panoramaUrl: './assets/biomes/rainforest_canopy.jpg',
    arabicVerse: '﴿وَهُوَ الَّذِي أَنزَلَ مِنَ السَّمَاءِ مَاءً فَأَخْرَجْنَا بِهِ نَبَاتَ كُلِّ شَيْءٍ﴾',
    surahRef: 'Surah Al-An‘am (6:99)',
    quranTranslation:
      'And it is He who sends down rain from the sky, and We produce thereby the growth of all things.',
    explanatoryReflection:
      'Invites reflection on how rainwater descends evenly across varied soils and ecosystems, awakening dormant seeds, leaves, and blossoms in balanced measure.',
    englishTafsir:
      'And it is He who sends down rain from the sky, and We produce thereby the growth of all things. (Al-An‘am 6:99) — Highlights the precision of the hydrological cycle sustaining diverse botanical life.',
    scientificContext:
      'Tropical rainforest trees follow branching proportions that distribute water and sunlight efficiently across canopy tiers. Through evapotranspiration, forests release water vapor back into the air—recycling regional moisture and sustaining understory ferns, orchids, and pollinators.',
    discovery: {
      objectName: 'Canopy Rain & Revival Node',
      conciseSummary:
        'Rainfall coats the canopy leaves, ripples across the river pool, and awakens dormant understory ferns and tropical blossoms.',
      modelNote: 'Hydrological canopy & understory response model',
      revelationLabel: 'Summon Rain',
      activeLabel: 'Clear Shower',
      beaconPos: '-0.35 1.85 -5.0',
      beaconType: 'rain'
    },
    fullNarration:
      'Step beneath towering rainforest canopies beside a sunlit river and cascading waterfall. Notice how every trunk and branch divides upward to gather light and channel rainwater gently down toward mossy roots. Summon Rain—or touch the glowing mist crystal ahead—to watch water droplets glisten across the leaves, ripple across the pool, and awaken orchids and ferns across the forest floor.',
    interactionHint:
      'Sweep upward to seed warm rain and summon butterflies, or touch the Water-Droplet Optical Prism.',
    actionLabel: 'Summon Rain',
    insight: {
      title: 'Canopy Hydraulics & Atmospheric Moisture Recycling',
      metric: 'Murray-style branching · Transpiration sustains cloud formation & understory life',
      detail:
        'Dense rainforest canopies intercept rainfall gently to prevent soil erosion while returning vast amounts of moisture to the sky through leaf transpiration.'
    },
    realMedia: {
      youtubeId: 'VLAW44DUxIg',
      videoTitle: 'Amazon Jungle 4K — Canopy, Winding Rivers & Authentic Rainforest Sounds',
      photos: [
        {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Amazon_rainforest_manaus_APA_Margem_Esquerda_do_Rio_Negro_-_panoramio.jpg/1280px-Amazon_rainforest_manaus_APA_Margem_Esquerda_do_Rio_Negro_-_panoramio.jpg',
          caption: 'Layered tropical rainforest canopy bordering the Rio Negro basin near Manaus, Brazil.',
          credit: 'Wikimedia Commons · Amazon Basin Archive'
        },
        {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Amazon_Rainforest_%28Rio_Negro%29_Black_River_in_Manaus_City_-_panoramio.jpg/1280px-Amazon_Rainforest_%28Rio_Negro%29_Black_River_in_Manaus_City_-_panoramio.jpg',
          caption: 'Dense equatorial forest river ecosystem sustained by convective rainfall cycles.',
          credit: 'Wikimedia Commons · Rio Negro Conservation'
        }
      ]
    }
  },

  ocean: {
    id: 'ocean',
    orderIndex: 2,
    navLabel: '3. Coral Cathedral',
    shortTitle: 'Coral Cathedral',
    title: 'The Sunlit Coral Cathedral',
    coordinates: '27.25°N, 33.85°E · Red Sea & Coral Triangle',
    subtitle: 'Coral Symbiosis, Optical Caustics & Schooling Harmony',
    ecologicalMetric: '27.25°N Red Sea Reef · Symbiotic algae & light refraction',
    skyColor: '#031E2E',
    accentColor: '#22D3EE',
    defaultSolar: 0.72,
    panoramaUrl: './assets/biomes/coral_reef.jpg',
    arabicVerse: '﴿وَهُوَ الَّذِي سَخَّرَ الْبَحْرَ لِتَأْكُلُوا مِنْهُ لَحْمًا طَرِيًّا وَتَسْتَخْرِجُوا مِنْهُ حِلْيَةً تَلْبَسُونَهَا﴾',
    surahRef: 'Surah An-Nahl (16:14)',
    quranTranslation:
      'And it is He who subjected the sea for you to eat from it tender meat and to extract from it ornaments which you wear.',
    explanatoryReflection:
      'Draws attention to the living abundance and quiet order hidden beneath ocean surfaces—nourishment, luminous pearls, and interconnected reef habitats.',
    englishTafsir:
      'And it is He who subjected the sea for you to eat from it tender meat and to extract from it ornaments which you wear. (An-Nahl 16:14) — Reflects on marine ecosystems, pearls, and balanced ocean currents.',
    scientificContext:
      'Sunlight refracts through surface ripples (water refractive index ~1.333) into moving caustic bands that energize shallow reefs. Stony corals house microscopic photosynthetic algae (zooxanthellae) inside their tissues—a delicate symbiosis sensitive to ocean warming that shelters roughly a quarter of known marine species.',
    discovery: {
      objectName: 'Living Coral Symbiosis Reef',
      conciseSummary:
        'Your touch sent oxygenating bubbles rising through the reef and revealed the symbiotic partnership between coral polyps, algae, and schooling fish.',
      modelNote: 'Interactive marine symbiosis & boids schooling model',
      revelationLabel: 'Discover Coral Symbiosis',
      activeLabel: 'Reef Energized',
      beaconPos: '0.35 1.65 -5.2',
      beaconType: 'coral'
    },
    fullNarration:
      'Submerge beneath sunlit turquoise waves where surface ripples focus daylight into shimmering caustics across brain corals, branching staghorn reefs, and swaying kelp. Notice a manta ray and sea turtles gliding beside schooling reef fish. Touch a glowing coral formation or trigger Discover Coral Symbiosis to release swirling bubbles and illuminate the delicate mutualism sustaining the reef.',
    interactionHint:
      'Touch all 3 pale coral clusters to restore reef symbiosis, or touch the live Turing & Voronoi lenses.',
    actionLabel: 'Discover Coral Symbiosis',
    insight: {
      title: 'Optical Caustics, Symbiosis & Decentralized Schooling',
      metric: '1.333 Seawater Refractive Index · Coral–Algae Mutualism · 3 Local Boids Rules',
      detail:
        'Wave crests act like moving lenses focusing light onto photosynthetic coral symbionts, while reef fish coordinate fluidly using simple local alignment and separation cues.'
    },
    realMedia: {
      youtubeId: 'yycGjhPumeM',
      videoTitle: 'Coral Reef Underwater World — Marine Biodiversity Nature Documentary',
      photos: [
        {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Chromis_reef_fish_and_staghorn_coral_underwater_scenic.jpg/1280px-Chromis_reef_fish_and_staghorn_coral_underwater_scenic.jpg',
          caption: 'Chromis reef fish schooling directly above sunlit staghorn coral formations.',
          credit: 'Wikimedia Commons · Marine Photography'
        },
        {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Underwater_photo_of_coral_reef.jpg/1280px-Underwater_photo_of_coral_reef.jpg',
          caption: 'Sunlit underwater coral shelf teeming with symbiotic reef organisms.',
          credit: 'Wikimedia Commons · Ocean Survey'
        }
      ]
    }
  },

  desert: {
    id: 'desert',
    orderIndex: 3,
    navLabel: '4. Desert Oasis',
    shortTitle: 'Desert Oasis',
    title: 'Sculpted Desert Dunes & Artesian Oasis',
    coordinates: '31.14°N, 3.97°W · Erg Chebbi & Dakhla Sahara',
    subtitle: 'Subsurface Aquifers, Aeolian Dunes & Twilight Scattering',
    ecologicalMetric: '31.14°N Sahara Erg · Hidden groundwater feeding desert palm life',
    skyColor: '#38BDF8',
    accentColor: '#FBBF24',
    defaultSolar: 0.26,
    panoramaUrl: './assets/biomes/sahara_dunes.jpg',
    arabicVerse: '﴿أَفَلَا يَنظُرُونَ إِلَى الْإِبِلِ كَيْفَ خُلِقَتْ ۝ وَإِلَى السَّمَاءِ كَيْفَ رُفِعَتْ ۝ وَإِلَى الْجِبَالِ كَيْفَ نُصِبَتْ ۝ وَإِلَى الْأَرْضِ كَيْفَ سُطِحَتْ﴾',
    surahRef: 'Surah Al-Ghashiyah (88:17–20)',
    quranTranslation:
      'Then do they not look at the camels—how they are created? And at the sky—how it is raised? And at the mountains—how they are erected? And at the earth—how it is spread out?',
    explanatoryReflection:
      'Calls desert travelers to pause and notice how resilience, water, wildlife, and expansive skies coexist even in Earth’s driest landscapes.',
    englishTafsir:
      'Then do they not look at the camels—how they are created? And at the sky—how it is raised? And at the mountains—how they are erected? And at the earth—how it is spread out? (Al-Ghashiyah 88:17–20)',
    scientificContext:
      'Educational model: Desert oases thrive where deep geological aquifers meet natural basin depressions or fault fractures, allowing ancient groundwater to surface as cool springs. Above ground, wind shapes sand grains into ripple ridges while lowering sun angles lengthen atmospheric light paths into warm amber before revealing desert constellations.',
    discovery: {
      objectName: 'Artesian Oasis Spring',
      conciseSummary:
        'Pressurized aquifer water wells upward across the oasis pool, rippling across turquoise water and blooming wildflowers along the desert shore.',
      modelNote: 'Artesian oasis spring & Rayleigh scattering model',
      revelationLabel: 'Awaken Oasis Spring',
      activeLabel: 'Calm Oasis Spring',
      beaconPos: '0 1.45 -5.4',
      beaconType: 'aquifer'
    },
    fullNarration:
      'Witness the quiet geometry of the desert across wind-carved dunes and a tranquil oasis pool beside swaying date palms, camels, and Arabian oryx. Deep sandstone aquifers sustain this living sanctuary. Select the Oasis Spring beacon—or press Awaken Oasis Spring—to watch pressurized freshwater ripple upward and bloom desert wildflowers, or touch the camels and oryx across the dunes.',
    interactionHint:
      'Awaken the Oasis Spring, touch the camels or oryx, or switch to Starlight and align Polaris to True North.',
    actionLabel: 'Awaken Oasis Spring',
    insight: {
      title: 'Artesian Oasis Springs & Atmospheric Scattering (Model)',
      metric: 'Artesian Spring Upwelling · λ⁻⁴ Rayleigh Blue Scattering · Aeolian Dunes',
      detail:
        'Impermeable rock layers trap ancient groundwater beneath desert sands until basin pressure forces fresh water upward to sustain oasis palms, wildflowers, and desert wildlife.'
    },
    realMedia: {
      youtubeId: '1FANIjfPbfo',
      videoTitle: 'Africa & The Sahara 4K — Scenic Desert Dunes & Oasis Horizon Film',
      photos: [
        {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Sand_dunes%2C_Libyan_Desert%2C_Dakhla_Oasis%2C_Egypt.jpg/1280px-Sand_dunes%2C_Libyan_Desert%2C_Dakhla_Oasis%2C_Egypt.jpg',
          caption: 'Wind-sculpted golden sand dunes beside Dakhla Oasis in the Western Sahara, Egypt.',
          credit: 'Wikimedia Commons · Desert Geology Archive'
        },
        {
          url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Sand_dunes_in_the_desert%2C_Sahara_Desert%2C_Dakhla_Oasis%2C_Egypt.jpg/1280px-Sand_dunes_in_the_desert%2C_Sahara_Desert%2C_Dakhla_Oasis%2C_Egypt.jpg',
          caption: 'Sweeping barchan dune ridges carved by steady Saharan trade winds.',
          credit: 'Wikimedia Commons · Sahara Survey'
        }
      ]
    }
  }
};

