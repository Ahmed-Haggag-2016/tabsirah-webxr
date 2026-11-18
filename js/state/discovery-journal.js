/**
 * Tabṣirah — Discovery Journal (Zero-PII Local Persistence)
 * Tracks discovered biomes, completed ecological experiments, attuned relics,
 * inspected microscopic specimens, and visited timeline horizons in localStorage.
 */

const STORAGE_KEY = 'tabsirah_discovery_journal_v1';

function createDefaultState() {
  return {
    discoveredBiomes: ['aurora'],
    completedExperiments: [],
    unlockedRelics: [],
    inspectedSpecimens: [],
    inspectedWonders: [],
    discoveredQuadrants: [],
    visitedHorizons: ['current'],
    updatedAt: null
  };
}

class DiscoveryJournalStore {
  constructor() {
    this.state = this.load();
    this.listeners = new Set();
    this.bindWindowEvents();
  }

  load() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createDefaultState();
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      const base = createDefaultState();
      return {
        discoveredBiomes: Array.isArray(parsed.discoveredBiomes) ? Array.from(new Set(parsed.discoveredBiomes)) : base.discoveredBiomes,
        completedExperiments: Array.isArray(parsed.completedExperiments) ? Array.from(new Set(parsed.completedExperiments)) : [],
        unlockedRelics: Array.isArray(parsed.unlockedRelics) ? Array.from(new Set(parsed.unlockedRelics)) : [],
        inspectedSpecimens: Array.isArray(parsed.inspectedSpecimens) ? Array.from(new Set(parsed.inspectedSpecimens)) : [],
        inspectedWonders: Array.isArray(parsed.inspectedWonders) ? Array.from(new Set(parsed.inspectedWonders)) : [],
        discoveredQuadrants: Array.isArray(parsed.discoveredQuadrants) ? Array.from(new Set(parsed.discoveredQuadrants)) : [],
        visitedHorizons: Array.isArray(parsed.visitedHorizons) ? Array.from(new Set(parsed.visitedHorizons)) : ['current'],
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null
      };
    } catch {
      return createDefaultState();
    }
  }

  save() {
    this.state.updatedAt = new Date().toISOString();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Ignore quota/private-browsing errors cleanly
      }
    }
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tabsirah-journal-updated', { detail: snap }));
    }
  }

  addUnique(listKey, value) {
    if (!value || !Array.isArray(this.state[listKey])) return false;
    if (this.state[listKey].includes(value)) return false;
    this.state[listKey].push(value);
    this.save();
    return true;
  }

  recordBiome(biomeId) {
    return this.addUnique('discoveredBiomes', biomeId);
  }

  recordExperiment(experimentId) {
    return this.addUnique('completedExperiments', experimentId);
  }

  recordRelic(biomeId) {
    return this.addUnique('unlockedRelics', biomeId);
  }

  recordSpecimen(specimenId) {
    return this.addUnique('inspectedSpecimens', specimenId);
  }

  recordWonder(propType) {
    return this.addUnique('inspectedWonders', propType);
  }

  recordQuadrant(biomeId, dir) {
    if (!biomeId || !dir) return false;
    return this.addUnique('discoveredQuadrants', `${biomeId}:${dir}`);
  }

  recordHorizon(horizonId) {
    return this.addUnique('visitedHorizons', horizonId);
  }

  reset() {
    this.state = createDefaultState();
    this.save();
  }

  getSnapshot() {
    return {
      discoveredBiomes: [...this.state.discoveredBiomes],
      completedExperiments: [...this.state.completedExperiments],
      unlockedRelics: [...this.state.unlockedRelics],
      inspectedSpecimens: [...this.state.inspectedSpecimens],
      inspectedWonders: [...this.state.inspectedWonders],
      discoveredQuadrants: [...this.state.discoveredQuadrants],
      visitedHorizons: [...this.state.visitedHorizons],
      updatedAt: this.state.updatedAt
    };
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  bindWindowEvents() {
    if (typeof window === 'undefined') return;
    window.addEventListener('tabsirah-biome-changed', (e) => {
      if (e.detail?.biomeId) this.recordBiome(e.detail.biomeId);
    });
    window.addEventListener('tabsirah-discovery-activated', (e) => {
      if (e.detail?.biomeId) {
        this.recordBiome(e.detail.biomeId);
        this.recordRelic(e.detail.biomeId);
        this.recordQuadrant(e.detail.biomeId, 'N');
      }
    });
    window.addEventListener('tabsirah-relic-attuned', (e) => {
      if (e.detail?.biomeId) {
        this.recordRelic(e.detail.biomeId);
        this.recordQuadrant(e.detail.biomeId, 'N');
      }
    });
    window.addEventListener('tabsirah-quadrant-discovered', (e) => {
      if (e.detail?.biomeId && e.detail?.dir) {
        this.recordQuadrant(e.detail.biomeId, e.detail.dir);
      }
    });
    window.addEventListener('tabsirah-ecosystem-experiment', (e) => {
      if (e.detail?.experimentId && e.detail.experimentId !== 'reset-baseline') {
        this.recordExperiment(e.detail.experimentId);
      }
    });
    window.addEventListener('tabsirah-timeline-changed', (e) => {
      if (e.detail?.horizon) this.recordHorizon(e.detail.horizon);
    });
    window.addEventListener('tabsirah-specimen-inspected', (e) => {
      if (e.detail?.specimenId) this.recordSpecimen(e.detail.specimenId);
    });
    window.addEventListener('tabsirah-wonder-interacted', (e) => {
      if (e.detail?.propType) this.recordWonder(e.detail.propType);
    });
  }
}

export const discoveryJournal = new DiscoveryJournalStore();
if (typeof window !== 'undefined') {
  window.tabsirahJournal = discoveryJournal;
}
