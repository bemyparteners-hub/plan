/**
 * utils.js — Fonctions utilitaires partagées
 */
const Utils = {
  JOURS: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  JOURS_COURT: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  MOIS: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],

  /** "08:30" → minutes depuis minuit */
  heureEnMinutes(h) {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm;
  },

  /** minutes → "08:30" */
  minutesEnHeure(m) {
    return `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
  },

  /** Lundi de la semaine courante (ou de la date fournie) */
  debutSemaine(date = new Date()) {
    const d = new Date(date);
    const j = d.getDay(); // 0=dim
    d.setDate(d.getDate() - (j === 0 ? 6 : j - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /** Date du jour d'index dans la semaine (0=lundi … 6=dim) */
  jourDeSemaine(lundiDate, index) {
    const d = new Date(lundiDate);
    d.setDate(d.getDate() + index);
    return d;
  },

  /** Date → "YYYY-MM-DD" */
  formatISO(date) {
    return date.toISOString().split('T')[0];
  },

  /** "YYYY-MM-DD" → "Lun 14 Avr" */
  formatCourt(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    // getDay() : 0=dim,1=lun…
    const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return `${Utils.JOURS_COURT[idx]} ${d.getDate()} ${Utils.MOIS[d.getMonth()].slice(0,3)}`;
  },

  /** Deux créneaux se chevauchent-ils ? (bornes en minutes) */
  chevauche(d1, f1, d2, f2) {
    return d1 < f2 && d2 < f1;
  },

  /** ID unique léger */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  /** Arrondi à N décimales */
  arrondi(n, dec = 1) {
    return Math.round(n * 10 ** dec) / 10 ** dec;
  },

  /** Somme d'un tableau de nombres */
  somme(arr) {
    return arr.reduce((a, b) => a + b, 0);
  },
};
