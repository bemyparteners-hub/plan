/**
 * app.js — Contrôleur principal, initialisation et événements
 */
const App = {
  etat: null,
  semaine: null, // Date (lundi)

  init() {
    this.etat    = Storage.charger();
    this.semaine = Utils.debutSemaine();
    this._bindNav();
    this._bindActions();
    this._mettreAJourSemaine();
    this.rafraichir();
    UI.afficherSection('dashboard');
  },

  // ── Semaine courante ─────────────────────────────────────────────────────

  _mettreAJourSemaine() {
    const fin = Utils.jourDeSemaine(this.semaine, 6);
    document.getElementById('semaine-label').textContent =
      `Semaine du ${this.semaine.getDate()} ${Utils.MOIS[this.semaine.getMonth()]} — ${fin.getDate()} ${Utils.MOIS[fin.getMonth()]} ${fin.getFullYear()}`;
  },

  // ── Rafraîchissement global ───────────────────────────────────────────────

  rafraichir() {
    const passages = this.etat.planning ? this.etat.planning.passages : [];
    UI.afficherDashboard(this.etat);
    UI.afficherIntervenantes(this.etat.intervenantes);
    UI.afficherBeneficiaires(this.etat.beneficiaires, passages);
    UI.afficherPlanning(this.etat, this.semaine);
    UI.afficherAlertes(this.etat.planning ? this.etat.planning.alertes : []);
  },

  // ── Navigation ────────────────────────────────────────────────────────────

  _bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => UI.afficherSection(btn.dataset.section));
    });
  },

  // ── Événements globaux ────────────────────────────────────────────────────

  _bindActions() {
    // Semaine précédente / suivante
    document.getElementById('btn-sem-prec').addEventListener('click', () => {
      this.semaine = Utils.jourDeSemaine(this.semaine, -7);
      this._mettreAJourSemaine();
      UI.afficherPlanning(this.etat, this.semaine);
    });
    document.getElementById('btn-sem-suiv').addEventListener('click', () => {
      this.semaine = Utils.jourDeSemaine(this.semaine, 7);
      this._mettreAJourSemaine();
      UI.afficherPlanning(this.etat, this.semaine);
    });

    // Générer planning
    document.getElementById('btn-generer').addEventListener('click', () => this.genererPlanning());

    // Réinitialiser données
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Réinitialiser toutes les données avec les exemples ? Cette action est irréversible.')) {
        this.etat = Storage.reinitialiser();
        this.rafraichir();
        UI.toast('Données réinitialisées avec les exemples de démonstration.');
      }
    });

    // Nouvelle intervenante
    document.getElementById('btn-nouvelle-iv').addEventListener('click', () => {
      UI.remplirFormulaireIntervenante(null);
      UI.ouvrirModal('modal-intervenante');
    });

    // Nouveau bénéficiaire
    document.getElementById('btn-nouveau-bn').addEventListener('click', () => {
      UI.remplirFormulaireBeneficiaire(null);
      UI.ouvrirModal('modal-beneficiaire');
    });

    // Fermeture modals
    document.querySelectorAll('.modal-close, .btn-annuler').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
      });
    });

    // Fermeture modal en cliquant l'overlay
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    // Formulaire intervenante
    document.getElementById('form-intervenante').addEventListener('submit', e => {
      e.preventDefault();
      this.sauvegarderIntervenante();
    });

    // Formulaire bénéficiaire
    document.getElementById('form-beneficiaire').addEventListener('submit', e => {
      e.preventDefault();
      this.sauvegarderBeneficiaire();
    });
  },

  // ── Planning ──────────────────────────────────────────────────────────────

  genererPlanning() {
    const btn = document.getElementById('btn-generer');
    btn.disabled = true;
    btn.textContent = '⏳ Génération…';

    // Léger délai pour laisser l'UI se mettre à jour
    setTimeout(() => {
      try {
        const résultat = Planner.generer(this.etat, this.semaine);
        const alertesCharge = Planner.alertesCharge(this.etat, résultat.passages);

        this.etat.planning = {
          semaine: Utils.formatISO(this.semaine),
          passages: résultat.passages,
          alertes:  [...résultat.alertes, ...alertesCharge],
        };

        Storage.sauvegarder(this.etat);
        this.rafraichir();

        const nb = résultat.passages.length;
        const al = this.etat.planning.alertes.length;
        UI.toast(`Planning généré : ${nb} passage(s), ${al} alerte(s).`, al > 0 ? 'warn' : 'success');
        UI.afficherSection('planning');
      } catch (err) {
        console.error(err);
        UI.toast('Erreur lors de la génération du planning.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '⚡ Générer le planning';
      }
    }, 50);
  },

  // ── CRUD intervenantes ────────────────────────────────────────────────────

  editerIntervenante(id) {
    const iv = this.etat.intervenantes.find(i => i.id === id);
    if (!iv) return;
    UI.remplirFormulaireIntervenante(iv);
    UI.ouvrirModal('modal-intervenante');
  },

  sauvegarderIntervenante() {
    const données = UI.lireFormulaireIntervenante();
    if (!données.prenom || !données.nom) {
      UI.toast('Prénom et nom obligatoires.', 'error');
      return;
    }
    const idx = this.etat.intervenantes.findIndex(i => i.id === données.id);
    if (idx >= 0) {
      // Conserver absences/refus existants
      données.absences = this.etat.intervenantes[idx].absences;
      données.refus    = this.etat.intervenantes[idx].refus;
      this.etat.intervenantes[idx] = données;
      UI.toast(`${données.prenom} ${données.nom} mise à jour.`);
    } else {
      this.etat.intervenantes.push(données);
      UI.toast(`${données.prenom} ${données.nom} ajoutée.`);
    }
    Storage.sauvegarder(this.etat);
    UI.fermerModal('modal-intervenante');
    this.rafraichir();
  },

  supprimerIntervenante(id) {
    const iv = this.etat.intervenantes.find(i => i.id === id);
    if (!iv) return;
    if (!confirm(`Supprimer ${iv.prenom} ${iv.nom} ? Cette action supprimera aussi ses passages dans le planning.`)) return;
    this.etat.intervenantes = this.etat.intervenantes.filter(i => i.id !== id);
    if (this.etat.planning) {
      this.etat.planning.passages = this.etat.planning.passages.filter(p => p.intervenante_id !== id);
    }
    Storage.sauvegarder(this.etat);
    this.rafraichir();
    UI.toast(`${iv.prenom} ${iv.nom} supprimée.`, 'warn');
  },

  // ── CRUD bénéficiaires ────────────────────────────────────────────────────

  editerBeneficiaire(id) {
    const b = this.etat.beneficiaires.find(x => x.id === id);
    if (!b) return;
    UI.remplirFormulaireBeneficiaire(b);
    UI.ouvrirModal('modal-beneficiaire');
  },

  sauvegarderBeneficiaire() {
    const données = UI.lireFormulaireBeneficiaire();
    if (!données.prenom || !données.nom) {
      UI.toast('Prénom et nom obligatoires.', 'error');
      return;
    }
    const idx = this.etat.beneficiaires.findIndex(b => b.id === données.id);
    if (idx >= 0) {
      this.etat.beneficiaires[idx] = données;
      UI.toast(`${données.prenom} ${données.nom} mis à jour.`);
    } else {
      this.etat.beneficiaires.push(données);
      UI.toast(`${données.prenom} ${données.nom} ajouté.`);
    }
    Storage.sauvegarder(this.etat);
    UI.fermerModal('modal-beneficiaire');
    this.rafraichir();
  },

  supprimerBeneficiaire(id) {
    const b = this.etat.beneficiaires.find(x => x.id === id);
    if (!b) return;
    if (!confirm(`Supprimer ${b.prenom} ${b.nom} ? Ses passages seront retirés du planning.`)) return;
    this.etat.beneficiaires = this.etat.beneficiaires.filter(x => x.id !== id);
    if (this.etat.planning) {
      this.etat.planning.passages = this.etat.planning.passages.filter(p => p.beneficiaire_id !== id);
    }
    Storage.sauvegarder(this.etat);
    this.rafraichir();
    UI.toast(`${b.prenom} ${b.nom} supprimé.`, 'warn');
  },
};

// Démarrage
document.addEventListener('DOMContentLoaded', () => App.init());
