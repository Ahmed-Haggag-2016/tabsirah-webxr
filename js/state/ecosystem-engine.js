/**
 * Tabṣirah — Ecosystem Butterfly Effect & Time Machine of Creation
 * Unified lightweight reactive ecological state connecting Polar Aurora,
 * Living Rainforest, Coral Cathedral, and Desert Oasis with transparent,
 * simplified educational models and non-predictive illustrative scenarios.
 */

export const ECOSYSTEM_MODEL_DISCLAIMER =
  'Simplified educational simulation illustrating ecological relationships — not a predictive climate or Earth-system forecast.';

export const TIME_HORIZONS = {
  previous: {
    id: 'previous',
    label: 'Past Reference State',
    shortLabel: 'Past Reference',
    note: 'Educational baseline representing lower thermal/drawdown stress and abundant canopy-reef equilibrium.',
    metricsDelta: {
      aurora: { solarActivity: 0.36, geomagneticShield: 0.92, upperAirExcitation: 0.48 },
      rainforest: { canopyMoisture: 0.86, transpirationRate: 0.84, biodiversityIndex: 0.88 },
      ocean: { coralHealth: 0.88, waterClarity: 0.86, reefBiodiversity: 0.87 },
      desert: { groundwaterLevel: 0.78, oasisHydration: 0.80, duneStability: 0.76 }
    }
  },
  current: {
    id: 'current',
    label: 'Current Living State',
    shortLabel: 'Current',
    note: 'Present-day observable educational state with delicate seasonal and symbiotic balances.',
    metricsDelta: {
      aurora: { solarActivity: 0.52, geomagneticShield: 0.85, upperAirExcitation: 0.64 },
      rainforest: { canopyMoisture: 0.72, transpirationRate: 0.70, biodiversityIndex: 0.76 },
      ocean: { coralHealth: 0.68, waterClarity: 0.74, reefBiodiversity: 0.72 },
      desert: { groundwaterLevel: 0.54, oasisHydration: 0.62, duneStability: 0.66 }
    }
  },
  future_illustrative: {
    id: 'future_illustrative',
    label: 'Future Illustrative Scenario',
    shortLabel: 'Future (Illustrative)',
    note: 'Illustrative educational scenario (not a forecast) contrasting how unstewarded warming/drawdown stresses reefs and aquifers versus restoration.',
    metricsDelta: {
      aurora: { solarActivity: 0.76, geomagneticShield: 0.84, upperAirExcitation: 0.82 },
      rainforest: { canopyMoisture: 0.50, transpirationRate: 0.48, biodiversityIndex: 0.54 },
      ocean: { coralHealth: 0.42, waterClarity: 0.52, reefBiodiversity: 0.46 },
      desert: { groundwaterLevel: 0.34, oasisHydration: 0.38, duneStability: 0.48 }
    }
  }
};

export const ECOSYSTEM_RELATIONSHIPS = [
  {
    id: 'rainforest-hydrology',
    from: 'rainforest',
    to: 'desert',
    title: 'Canopy Evapotranspiration → Atmospheric Moisture Transport',
    summary:
      'Rainforest leaves recycle water vapor into regional air currents; watershed integrity sustains distant groundwater and oasis recharge patterns over seasonal cycles.'
  },
  {
    id: 'rainforest-ocean',
    from: 'rainforest',
    to: 'ocean',
    title: 'Watershed Stability → Coastal Water Clarity',
    summary:
      'Intact forest roots anchor soil and reduce heavy sediment runoff, helping coastal waters remain clear enough for sunlight to reach photosynthetic reef algae.'
  },
  {
    id: 'ocean-symbiosis',
    from: 'ocean',
    to: 'rainforest',
    title: 'Marine Carbon & Thermal Buffering ↔ Atmospheric Balance',
    summary:
      'Healthy coral-algal ecosystems and ocean currents participate in planetary heat and gas exchange alongside terrestrial forests.'
  },
  {
    id: 'aurora-shield',
    from: 'aurora',
    to: 'ocean',
    title: 'Geomagnetic Dipole Shielding ↔ Upper Atmosphere Protection',
    summary:
      'Earth’s dipole magnetic field deflects charged solar-wind plasma toward polar ovals, preserving upper-atmospheric stability above oceans and continents.'
  }
];

export const ECOSYSTEM_EXPERIMENTS = [
  {
    id: 'seed-rainforest-monsoon',
    biomeId: 'rainforest',
    label: 'Trigger Canopy Rainfall',
    shortLabel: 'Canopy Rain',
    consequenceSummary:
      'Increased rainfall saturates canopy leaves, boosts transpiration vapor, steadies watershed soil, and clears downstream coastal turbidity.',
    butterflyEffects: [
      'Rainforest: Canopy Moisture +18%, Transpiration +16%',
      'Coral Cathedral: Coastal Water Clarity +8%',
      'Desert Oasis: Hydrological Recharge +6%'
    ]
  },
  {
    id: 'restore-coral-symbiosis',
    biomeId: 'ocean',
    label: 'Restore Coral Symbiosis',
    shortLabel: 'Restore Reef',
    consequenceSummary:
      'Healthy zooxanthellae recolonize polyp tissues, lifting reef oxygen bubbles, fish schooling activity, and coastal biodiversity.',
    butterflyEffects: [
      'Coral Cathedral: Coral Health +22%, Reef Biodiversity +18%',
      'Living Rainforest: Marine-Atmospheric Exchange +5%'
    ]
  },
  {
    id: 'recharge-desert-aquifer',
    biomeId: 'desert',
    label: 'Awaken Oasis Spring',
    shortLabel: 'Oasis Spring',
    consequenceSummary:
      'Confined sandstone pressure feeds cool artesian spring ripples across the oasis pool, blooming desert wildflowers and nourishing palms and wildlife.',
    butterflyEffects: [
      'Desert Oasis: Groundwater +24%, Oasis Hydration +20%',
      'Soil Microclimate: Surface Cooling & Wildflower Bloom +10%'
    ]
  },
  {
    id: 'solar-storm-deflection',
    biomeId: 'aurora',
    label: 'Channel Solar Wind',
    shortLabel: 'Solar Deflection',
    consequenceSummary:
      'Incoming solar plasma streams spiral safely along polar dipole arcs, intensifying 557.7 nm oxygen fluorescence while shielding lower latitudes.',
    butterflyEffects: [
      'Polar Aurora: Upper-Air Excitation +24%, Shield Active',
      'Lower Latitudes: Atmospheric Ionization Deflected'
    ]
  }
];

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

class EcosystemButterflyEngine {
  constructor() {
    this.timeHorizon = 'current';
    this.activeExperiments = new Set();
    this.lastChain = [
      'All four living biomes start in observable current equilibrium.',
      'Activate an experiment or shift the Time Machine to inspect cause-and-effect chains.'
    ];
    this.biomes = this.cloneHorizonMetrics('current');
    this.syncGlobalVisuals();
  }

  cloneHorizonMetrics(horizonId) {
    const src = (TIME_HORIZONS[horizonId] || TIME_HORIZONS.current).metricsDelta;
    return {
      aurora: { ...src.aurora },
      rainforest: { ...src.rainforest },
      ocean: { ...src.ocean },
      desert: { ...src.desert }
    };
  }

  setTimeHorizon(horizonId) {
    if (!TIME_HORIZONS[horizonId]) return;
    this.timeHorizon = horizonId;
    this.biomes = this.cloneHorizonMetrics(horizonId);

    // Reapply any active restorative experiments on top of the selected horizon
    const activeList = Array.from(this.activeExperiments);
    this.activeExperiments.clear();
    activeList.forEach((expId) => this.applyExperimentDeltas(expId, false));

    const hData = TIME_HORIZONS[horizonId];
    this.lastChain = [
      `Time Machine set to: ${hData.label}.`,
      hData.note
    ];

    this.syncGlobalVisuals();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tabsirah-timeline-changed', {
          detail: { horizon: horizonId, meta: hData, state: this.getState() }
        })
      );
      window.dispatchEvent(
        new CustomEvent('tabsirah-ecosystem-updated', { detail: this.getState() })
      );
      window.dispatchEvent(
        new CustomEvent('tabsirah-wonder-progress', {
          detail: { message: `Time Machine: ${hData.label} (illustrative model)` }
        })
      );
    }
  }

  applyExperimentDeltas(expId, emitSceneFX = true) {
    if (expId === 'seed-rainforest-monsoon') {
      this.activeExperiments.add(expId);
      this.biomes.rainforest.canopyMoisture = clamp01(this.biomes.rainforest.canopyMoisture + 0.18);
      this.biomes.rainforest.transpirationRate = clamp01(this.biomes.rainforest.transpirationRate + 0.16);
      this.biomes.rainforest.biodiversityIndex = clamp01(this.biomes.rainforest.biodiversityIndex + 0.10);
      this.biomes.ocean.waterClarity = clamp01(this.biomes.ocean.waterClarity + 0.08);
      this.biomes.desert.groundwaterLevel = clamp01(this.biomes.desert.groundwaterLevel + 0.06);
      if (emitSceneFX && typeof window !== 'undefined') {
        const mgr = window.tabsirahBiomeManager;
        if (mgr && mgr.currentBiomeId === 'rainforest' && !mgr.rainActive) {
          mgr.setRainState(true);
        }
      }
    } else if (expId === 'restore-coral-symbiosis') {
      this.activeExperiments.add(expId);
      this.biomes.ocean.coralHealth = clamp01(this.biomes.ocean.coralHealth + 0.22);
      this.biomes.ocean.reefBiodiversity = clamp01(this.biomes.ocean.reefBiodiversity + 0.18);
      this.biomes.rainforest.biodiversityIndex = clamp01(this.biomes.rainforest.biodiversityIndex + 0.05);
      if (emitSceneFX && typeof window !== 'undefined') {
        const mgr = window.tabsirahBiomeManager;
        mgr?.sceneEl?.emit('ocean-bubble-surge', {}, false);
      }
    } else if (expId === 'recharge-desert-aquifer') {
      this.activeExperiments.add(expId);
      this.biomes.desert.groundwaterLevel = clamp01(this.biomes.desert.groundwaterLevel + 0.24);
      this.biomes.desert.oasisHydration = clamp01(this.biomes.desert.oasisHydration + 0.20);
      this.biomes.desert.duneStability = clamp01(this.biomes.desert.duneStability + 0.10);
      if (emitSceneFX && typeof window !== 'undefined') {
        const mgr = window.tabsirahBiomeManager;
        if (mgr && mgr.currentBiomeId === 'desert' && !mgr.desertAquiferActive) {
          mgr.setDesertAquiferState(true);
        }
      }
    } else if (expId === 'solar-storm-deflection') {
      this.activeExperiments.add(expId);
      this.biomes.aurora.solarActivity = clamp01(this.biomes.aurora.solarActivity + 0.20);
      this.biomes.aurora.upperAirExcitation = clamp01(this.biomes.aurora.upperAirExcitation + 0.24);
      this.biomes.aurora.geomagneticShield = clamp01(this.biomes.aurora.geomagneticShield + 0.06);
      if (emitSceneFX && typeof window !== 'undefined') {
        const mgr = window.tabsirahBiomeManager;
        if (mgr && mgr.currentBiomeId === 'aurora' && !mgr.auroraShieldActive) {
          mgr.setAuroraShieldState(true);
        }
      }
    }
  }

  triggerExperiment(expId) {
    if (expId === 'reset-baseline') {
      this.activeExperiments.clear();
      this.setTimeHorizon('current');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('tabsirah-ecosystem-experiment', {
            detail: { experimentId: 'reset-baseline', state: this.getState() }
          })
        );
      }
      return;
    }

    const exp = ECOSYSTEM_EXPERIMENTS.find((item) => item.id === expId);
    if (!exp) return;

    this.applyExperimentDeltas(expId, true);
    this.lastChain = [exp.consequenceSummary, ...exp.butterflyEffects];
    this.syncGlobalVisuals();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tabsirah-ecosystem-experiment', {
          detail: { experimentId: expId, experiment: exp, state: this.getState() }
        })
      );
      window.dispatchEvent(
        new CustomEvent('tabsirah-ecosystem-updated', { detail: this.getState() })
      );
      window.dispatchEvent(
        new CustomEvent('tabsirah-wonder-progress', {
          detail: { message: `${exp.shortLabel}: ${exp.butterflyEffects[0]}` }
        })
      );
    }
  }

  syncGlobalVisuals() {
    if (typeof window === 'undefined') return;
    window.tabsirahEcosystemVisuals = {
      horizon: this.timeHorizon,
      coralHealth: this.biomes.ocean.coralHealth,
      reefBiodiversity: this.biomes.ocean.reefBiodiversity,
      rainforestMoisture: this.biomes.rainforest.canopyMoisture,
      desertHydration: this.biomes.desert.oasisHydration,
      auroraExcitation: this.biomes.aurora.upperAirExcitation
    };
  }

  getState() {
    return {
      timeHorizon: this.timeHorizon,
      horizonMeta: TIME_HORIZONS[this.timeHorizon],
      activeExperiments: Array.from(this.activeExperiments),
      biomes: {
        aurora: { ...this.biomes.aurora },
        rainforest: { ...this.biomes.rainforest },
        ocean: { ...this.biomes.ocean },
        desert: { ...this.biomes.desert }
      },
      lastChain: [...this.lastChain],
      disclaimer: ECOSYSTEM_MODEL_DISCLAIMER
    };
  }
}

export const ecosystemEngine = new EcosystemButterflyEngine();
if (typeof window !== 'undefined') {
  window.tabsirahEcosystem = ecosystemEngine;
}
