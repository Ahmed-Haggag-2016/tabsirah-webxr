/**
 * Tabṣirah — Offline-First Nature Science Companion
 * Attempts server-side /api/companion when available, and gracefully falls back
 * to a curated offline scientific knowledge base so static deployments & offline Quest sessions work 100%.
 * Strictly scientific: never generates or modifies Qur'anic verses or Tafsir.
 */

import { EARTH_BIOMES_DATA } from '../config/earth-biomes-data.js';

export const COMPANION_QUICK_PROMPTS = {
  aurora: [
    'Why does the polar aurora glow emerald green?',
    'How does Earth’s dipole magnetic field protect us?',
    'What triggers a coronal geomagnetic substorm?'
  ],
  rainforest: [
    'How does canopy rainfall connect to distant ecosystems?',
    'What role do microscopic leaf stomata play?',
    'Why do river basins help coastal coral reefs stay clear?'
  ],
  ocean: [
    'How does coral-zooxanthellae symbiosis work?',
    'Why do thermal spikes stress reefs in the future scenario?',
    'How do schooling fish sustain reef health?'
  ],
  desert: [
    'How can fresh water rise in the middle of an arid desert?',
    'Why do desert palms thrive near confined aquifers?',
    'How did traditional navigators use Polaris?'
  ]
};

const OFFLINE_QA_BASE = [
  {
    keywords: ['green', 'emerald', '557', 'oxygen', 'glow', 'color', 'aurora'],
    biome: 'aurora',
    answer:
      'Polar auroras glow emerald green (~557.7 nm wavelength) around 100–250 km altitude when energetic electrons guided along polar magnetic field lines collide with atomic oxygen, exciting electrons that emit green photons as they relax. Higher-altitude red emissions (~630 nm) occur above 250 km.'
  },
  {
    keywords: ['dipole', 'magnetic', 'shield', 'protect', 'solar', 'wind', 'substorm'],
    biome: 'aurora',
    answer:
      'Earth’s dipolar magnetosphere acts as an invisible electromagnetic deflector against charged solar-wind plasma. While deflecting most particles around the planet, magnetic reconnection channels bursts along polar field lines into northern and southern auroral ovals.'
  },
  {
    keywords: ['rain', 'water', 'connect', 'distant', 'hydrology', 'cloud', 'moisture'],
    biome: 'rainforest',
    answer:
      'Intact rainforests pump tremendous water vapor skyward through transpiration, forming regional atmospheric moisture rivers. In Tabṣirah’s simplified Butterfly Effect model, canopy rainfall stabilizes soil (reducing coastal silt runoff) and supports regional hydrological recharge.'
  },
  {
    keywords: ['stomata', 'leaf', 'pore', 'evapotranspiration', 'guard'],
    biome: 'rainforest',
    answer:
      'Stomata are microscopic leaf pores flanked by twin guard cells. When hydrated, guard cells bow open to take in CO₂ for photosynthesis while releasing water vapor that cools the leaf surface and sustains forest humidity.'
  },
  {
    keywords: ['coral', 'symbiosis', 'zooxanthellae', 'algae', 'bleach', 'polyp'],
    biome: 'ocean',
    answer:
      'Stony corals live in mutualism with microscopic photosynthetic algae called zooxanthellae inside their tissues. The algae share sugars produced from sunlight, while the coral polyp offers shelter and nutrients. Prolonged thermal stress disrupts this partnership, leaving pale calcium skeletons until conditions recover.'
  },
  {
    keywords: ['fish', 'reef', 'biodiversity', 'turbulence', 'clarity'],
    biome: 'ocean',
    answer:
      'Healthy coral architecture shelters roughly a quarter of known marine species despite covering under 1% of the seafloor. Grazing reef fish keep macroalgae balanced so young coral polyps can settle on sunlit limestone.'
  },
  {
    keywords: ['aquifer', 'artesian', 'desert', 'oasis', 'spring', 'water', 'groundwater'],
    biome: 'desert',
    answer:
      'An oasis forms where ancient rainwater trapped beneath a confining clay/shale cap within porous sandstone rises under natural hydrostatic pressure through a fault or basin depression—allowing date palms and reeds to flourish beneath desert dunes.'
  },
  {
    keywords: ['polaris', 'north', 'star', 'compass', 'navigate'],
    biome: 'desert',
    answer:
      'Polaris lies within 1 degree of Earth’s northern celestial pole, remaining almost stationary above the northern horizon all night while surrounding constellations appear to wheel around it—offering a reliable directional reference across featureless dunes.'
  }
];

function findOfflineAnswer(question, biomeId) {
  const q = question.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const entry of OFFLINE_QA_BASE) {
    let score = entry.biome === biomeId ? 1.5 : 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore >= 2) {
    return `${best.answer}\n\n(Verified offline scientific summary — not a climate forecast. Consult the Reflection panel for curated scriptural passages.)`;
  }

  const data = EARTH_BIOMES_DATA[biomeId] || EARTH_BIOMES_DATA.aurora;
  return `${data.scientificContext}\n\n(Curated offline scientific guide for ${data.shortTitle}. You can also open the Spatial Scientific Lab to inspect the 3D specimen model.)`;
}

export async function askNatureCompanion({
  question,
  biomeId = 'aurora',
  scienceContext = '',
  experimentState = {},
  journalSummary = {}
}) {
  const trimmed = String(question || '').trim();
  if (!trimmed) {
    return {
      mode: 'offline',
      answer: 'Ask a scientific question about the active biome, ecosystem connections, or 3D lab specimen.'
    };
  }

  // Guardrail against religious/scripture generation requests even before hitting network
  const lower = trimmed.toLowerCase();
  if (/(quran|qur'an|ayah|ayat|surah|tafsir|hadith|fatwa|verse)/i.test(lower)) {
    return {
      mode: 'offline',
      answer:
        'Tabṣirah’s Companion answers scientific questions only and never generates or modifies scripture or Tafsir. Open "Reflect & Science" (or Stillness mode) to read the curated, verified Arabic verse and commentary for this biome.'
    };
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    const res = await fetch('/api/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        question: trimmed,
        biomeId,
        scienceContext,
        experimentState,
        journalSummary
      })
    });
    window.clearTimeout(timer);

    if (res.ok) {
      const payload = await res.json();
      if (payload?.available && payload?.answer) {
        return { mode: 'ai', answer: payload.answer };
      }
    }
  } catch {
    // Graceful offline / static fallback
  }

  return {
    mode: 'offline',
    answer: findOfflineAnswer(trimmed, biomeId)
  };
}
