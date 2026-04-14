/**
 * storage.js — Persistance via localStorage
 */
const Storage = {
  CLE: 'homecare_v1',

  /** Charge les données depuis localStorage (ou données mock au premier lancement) */
  charger() {
    try {
      const raw = localStorage.getItem(this.CLE);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('localStorage illisible, données mock chargées.', e);
    }
    // Premier lancement : cloner les données initiales
    const initial = JSON.parse(JSON.stringify(DONNEES_INITIALES));
    this.sauvegarder(initial);
    return initial;
  },

  /** Sauvegarde l'état complet */
  sauvegarder(etat) {
    try {
      localStorage.setItem(this.CLE, JSON.stringify(etat));
    } catch (e) {
      console.error('Impossible de sauvegarder dans localStorage.', e);
    }
  },

  /** Réinitialise avec les données mock */
  reinitialiser() {
    const initial = JSON.parse(JSON.stringify(DONNEES_INITIALES));
    this.sauvegarder(initial);
    return initial;
  },
};
