/**
 * app.js — Contrôleur principal, initialisation et événements
 */
const App = {
  etat: null,
  semaine: null,

  _filtreIV: '',
  _filtreBN: '',
  _ficheEnCours: null,
  _importEnCours: { type: null, objets: [] },

  init() {
    this.etat    = Storage.charger();
    this._migrerDonnees(); // compatibilité ascendante
    this.semaine = Utils.debutSemaine();
    this._bindNav();
    this._bindActions();
    this._mettreAJourSemaine();
    this.rafraichir();
    UI.afficherSection('dashboard');
  },

  // ── Migration données localStorage (compatibilité ascendante) ────────────

  _migrerDonnees() {
    this.etat.intervenantes.forEach(iv => {
      if (!iv.email)                iv.email = '';
      if (!iv.adresse)              iv.adresse = '';
      if (!iv.contrat_type)         iv.contrat_type = 'CDI';
      if (iv.vehicule === undefined) iv.vehicule = false;
      if (iv.actif === undefined)   iv.actif = true;
      if (!iv.beneficiaires_habituels) iv.beneficiaires_habituels = [];
    });
    this.etat.beneficiaires.forEach(b => {
      if (!b.email)                       b.email = '';
      if (!b.personnel_refuse)            b.personnel_refuse = [];
      if (!b.personnel_prefere)           b.personnel_prefere = [];
      if (!b.intervenantes_habituelles)   b.intervenantes_habituelles = [];
      if (b.intervenante_favorite === undefined) b.intervenante_favorite = null;
      if (!b.max_intervenantes)           b.max_intervenantes = 2;
      if (!b.priorite)                    b.priorite = 2;
      if (b.souplesse_horaire === undefined) b.souplesse_horaire = false;
    });
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
    UI.afficherIntervenantes(this.etat.intervenantes, passages, this._filtreIV);
    UI.afficherBeneficiaires(this.etat.beneficiaires, passages, this._filtreBN);
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
    // Navigation semaine
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

    // ↺ Démo — recharge les 4 IV + 5 BN d'origine
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Réinitialiser avec les données de démonstration (4 intervenantes + 5 bénéficiaires) ? Les données actuelles seront perdues.')) {
        this.etat = Storage.reinitialiser();
        this.rafraichir();
        UI.toast('Données de démonstration rechargées.');
      }
    });

    // 📦 Générer masse (60 IV + 200 BN)
    document.getElementById('btn-generer-masse').addEventListener('click', () => this.genererDonneesMasse());

    // 🗑️ Vider les données
    document.getElementById('btn-reset-test').addEventListener('click', () => {
      if (confirm('Vider toutes les données (intervenantes, bénéficiaires, planning) ?')) {
        this.etat = { intervenantes: [], beneficiaires: [], planning: null };
        Storage.sauvegarder(this.etat);
        this.rafraichir();
        UI.toast('Données vidées.', 'warn');
      }
    });

    // Recherche intervenantes
    document.getElementById('filtre-iv').addEventListener('input', e => {
      this._filtreIV = e.target.value.trim();
      const passages = this.etat.planning ? this.etat.planning.passages : [];
      UI.afficherIntervenantes(this.etat.intervenantes, passages, this._filtreIV);
    });

    // Recherche bénéficiaires
    document.getElementById('filtre-bn').addEventListener('input', e => {
      this._filtreBN = e.target.value.trim();
      const passages = this.etat.planning ? this.etat.planning.passages : [];
      UI.afficherBeneficiaires(this.etat.beneficiaires, passages, this._filtreBN);
    });

    // Formulaires CRUD
    document.getElementById('btn-nouvelle-iv').addEventListener('click', () => {
      UI.remplirFormulaireIntervenante(null);
      UI.ouvrirModal('modal-intervenante');
    });
    document.getElementById('btn-nouveau-bn').addEventListener('click', () => {
      UI.remplirFormulaireBeneficiaire(null);
      UI.ouvrirModal('modal-beneficiaire');
    });

    // Fermeture modals (×, Annuler, overlay)
    document.querySelectorAll('.modal-close, .btn-annuler').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
      });
    });
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    document.getElementById('form-intervenante').addEventListener('submit', e => {
      e.preventDefault();
      this.sauvegarderIntervenante();
    });
    document.getElementById('form-beneficiaire').addEventListener('submit', e => {
      e.preventDefault();
      this.sauvegarderBeneficiaire();
    });

    // ── Import intervenantes ──────────────────────────────────────────────
    document.getElementById('btn-import-iv').addEventListener('click', () => {
      document.getElementById('file-iv').value = '';
      document.getElementById('file-iv').click();
    });
    document.getElementById('file-iv').addEventListener('change', e => {
      const f = e.target.files[0];
      if (f) this._lireFichier(f, 'iv');
    });
    document.getElementById('btn-modele-csv-iv').addEventListener('click', () => {
      Importer.telecharger('modele_intervenantes.csv', Importer.modeleCSVIntervenantes());
      UI.toast('Modèle CSV intervenantes téléchargé.');
    });
    document.getElementById('btn-modele-xlsx-iv').addEventListener('click', () => {
      Importer.telechargerModeleExcel('iv');
    });

    // ── Import bénéficiaires ──────────────────────────────────────────────
    document.getElementById('btn-import-bn').addEventListener('click', () => {
      document.getElementById('file-bn').value = '';
      document.getElementById('file-bn').click();
    });
    document.getElementById('file-bn').addEventListener('change', e => {
      const f = e.target.files[0];
      if (f) this._lireFichier(f, 'bn');
    });
    document.getElementById('btn-modele-csv-bn').addEventListener('click', () => {
      Importer.telecharger('modele_beneficiaires.csv', Importer.modeleCSVBeneficiaires());
      UI.toast('Modèle CSV bénéficiaires téléchargé.');
    });
    document.getElementById('btn-modele-xlsx-bn').addEventListener('click', () => {
      Importer.telechargerModeleExcel('bn');
    });

    // ── Confirmer import ──────────────────────────────────────────────────
    document.getElementById('btn-confirmer-import').addEventListener('click', () => {
      this._confirmerImport();
    });
  },

  // ── Lecture et analyse du fichier ─────────────────────────────────────────

  _lireFichier(fichier, type) {
    const ext = fichier.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = e => this._traiterContenu(e.target.result, 'csv', type);
      reader.onerror = () => UI.toast('Impossible de lire le fichier.', 'error');
      reader.readAsText(fichier, 'UTF-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
      if (!Importer.xlsxDispo()) {
        UI.toast('Import Excel indisponible (SheetJS non chargé — vérifiez votre connexion internet).', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = e => this._traiterContenu(e.target.result, 'xlsx', type);
      reader.onerror = () => UI.toast('Impossible de lire le fichier.', 'error');
      reader.readAsArrayBuffer(fichier);
    } else {
      UI.toast('Format non supporté. Utilisez un fichier .csv ou .xlsx.', 'error');
    }
  },

  _traiterContenu(contenu, format, type) {
    // 1. Parsing
    let résultat;
    if (format === 'csv') {
      résultat = Importer.parseCSV(contenu);
    } else {
      résultat = Importer.parseExcel(contenu);
    }

    if (résultat.erreurs && résultat.erreurs.length && !résultat.rows.length) {
      UI.toast(résultat.erreurs[0], 'error');
      return;
    }

    const { rows, entetes } = résultat;

    // 2. Validation des colonnes
    let erreursCol = [];
    if (entetes) {
      erreursCol = type === 'iv'
        ? Importer.validerColonnesIV(entetes)
        : Importer.validerColonnesBN(entetes);
    }

    if (erreursCol.length) {
      UI.toast(`Import impossible : ${erreursCol[0]}`, 'error');
      return;
    }

    // 3. Transformation
    const objets = rows.map((row, i) =>
      type === 'iv'
        ? Importer.transformerIntervenante(row, i)
        : Importer.transformerBeneficiaire(row, i)
    );

    // 4. Stocker pour confirmation
    this._importEnCours = { type, objets };

    // 5. Afficher prévisualisation
    const colonnesPreview = type === 'iv'
      ? ['nom', 'prenom', 'telephone', 'contrat_heures', 'competences']
      : ['nom', 'prenom', 'telephone', 'adresse', 'competences_requises'];

    // Préparer les objets pour l'aperçu (aplatir certains champs)
    const objetsApercu = objets.map(o => {
      if (type === 'iv') {
        return {
          nom: o.nom, prenom: o.prenom, telephone: o.telephone,
          contrat_heures: o.contrat_heures,
          competences: o.competences.join(', '),
        };
      } else {
        return {
          nom: o.nom, prenom: o.prenom, telephone: o.telephone,
          adresse: o.adresse,
          competences_requises: o.competences_requises.join(', '),
        };
      }
    });

    UI.afficherApercuImport({
      titre: type === 'iv' ? 'Import intervenantes' : 'Import bénéficiaires',
      objets: objetsApercu,
      erreurs: [...(résultat.erreurs || []), ...erreursCol],
      colonnes: colonnesPreview,
      total: objets.length,
    });
  },

  _confirmerImport() {
    const { type, objets } = this._importEnCours;
    if (!objets || !objets.length) return;

    const mode = UI.lireModeImport();

    if (type === 'iv') {
      if (mode === 'remplacer') {
        this.etat.intervenantes = objets;
      } else {
        // Ajouter, éviter doublons sur l'id
        const existants = new Set(this.etat.intervenantes.map(i => i.id));
        objets.forEach(o => {
          if (existants.has(o.id)) {
            // Mettre à jour
            const idx = this.etat.intervenantes.findIndex(i => i.id === o.id);
            this.etat.intervenantes[idx] = o;
          } else {
            this.etat.intervenantes.push(o);
          }
        });
      }
      UI.toast(`${objets.length} intervenante(s) importée(s) (mode : ${mode}).`);
    } else {
      if (mode === 'remplacer') {
        this.etat.beneficiaires = objets;
      } else {
        const existants = new Set(this.etat.beneficiaires.map(b => b.id));
        objets.forEach(o => {
          if (existants.has(o.id)) {
            const idx = this.etat.beneficiaires.findIndex(b => b.id === o.id);
            this.etat.beneficiaires[idx] = o;
          } else {
            this.etat.beneficiaires.push(o);
          }
        });
      }
      UI.toast(`${objets.length} bénéficiaire(s) importé(s) (mode : ${mode}).`);
    }

    // Invalider le planning si données changées
    if (mode === 'remplacer') this.etat.planning = null;

    Storage.sauvegarder(this.etat);
    UI.fermerModal('modal-import');
    this.rafraichir();
    this._importEnCours = { type: null, objets: [] };
  },

  // ── Génération données en masse ───────────────────────────────────────────

  genererDonneesMasse() {
    const NB_IV = 60;
    const NB_BN = 200;

    if (!confirm(`Générer ${NB_IV} intervenantes (INTER-1…${NB_IV}) et ${NB_BN} bénéficiaires (BENE-1…${NB_BN}) ?\n\nCela remplacera les données actuelles.`)) return;

    const btn = document.getElementById('btn-generer-masse');
    btn.disabled = true;
    btn.textContent = '⏳ Génération…';

    setTimeout(() => {
      try {
        this.etat.intervenantes = DataGenerator.genererIntervenantes(NB_IV);
        this.etat.beneficiaires = DataGenerator.genererBeneficiaires(NB_BN);
        this.etat.planning      = null;
        Storage.sauvegarder(this.etat);
        this.rafraichir();
        UI.toast(`${NB_IV} intervenantes + ${NB_BN} bénéficiaires générés. Cliquez « Générer le planning » pour tester.`);
      } catch (err) {
        console.error(err);
        UI.toast('Erreur lors de la génération des données.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '📦 Générer 60 + 200 données fictives';
      }
    }, 50);
  },

  // ── Planning ──────────────────────────────────────────────────────────────

  genererPlanning() {
    if (!this.etat.intervenantes.length || !this.etat.beneficiaires.length) {
      UI.toast('Ajoutez au moins une intervenante et un bénéficiaire avant de générer.', 'warn');
      return;
    }

    const btn = document.getElementById('btn-generer');
    btn.disabled = true;
    btn.textContent = '⏳ Génération…';

    setTimeout(() => {
      try {
        const résultat      = Planner.generer(this.etat, this.semaine);
        const alertesCharge = Planner.alertesCharge(this.etat, résultat.passages);

        this.etat.planning = {
          semaine:  Utils.formatISO(this.semaine),
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

  // ── Fiches détaillées ─────────────────────────────────────────────────────

  voirFicheIntervenante(id) {
    const iv = this.etat.intervenantes.find(i => i.id === id);
    if (!iv) return;
    const passages = this.etat.planning
      ? this.etat.planning.passages.filter(p => p.intervenante_id === id) : [];
    this._ficheEnCours = { type: 'iv', id };
    document.getElementById('fiche-btn-editer').onclick = () => {
      UI.fermerModal('modal-fiche');
      this.editerIntervenante(id);
    };
    UI.afficherFicheIntervenante(iv, passages, this.etat.beneficiaires);
    UI.ouvrirModal('modal-fiche');
  },

  voirFicheBeneficiaire(id) {
    const bn = this.etat.beneficiaires.find(b => b.id === id);
    if (!bn) return;
    const passages = this.etat.planning
      ? this.etat.planning.passages.filter(p => p.beneficiaire_id === id) : [];
    this._ficheEnCours = { type: 'bn', id };
    document.getElementById('fiche-btn-editer').onclick = () => {
      UI.fermerModal('modal-fiche');
      this.editerBeneficiaire(id);
    };
    UI.afficherFicheBeneficiaire(bn, passages, this.etat.intervenantes);
    UI.ouvrirModal('modal-fiche');
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
    if (!données.nom) {
      UI.toast('Le nom est obligatoire.', 'error');
      return;
    }
    const idx = this.etat.intervenantes.findIndex(i => i.id === données.id);
    if (idx >= 0) {
      const ancien = this.etat.intervenantes[idx];
      // Préserver les champs non exposés dans le formulaire
      données.absences             = ancien.absences;
      données.refus                = ancien.refus;
      données.email                = ancien.email || données.email;
      données.adresse              = ancien.adresse || données.adresse;
      données.contrat_type         = ancien.contrat_type || données.contrat_type;
      données.vehicule             = ancien.vehicule !== undefined ? ancien.vehicule : données.vehicule;
      données.actif                = ancien.actif !== undefined ? ancien.actif : données.actif;
      données.beneficiaires_habituels = ancien.beneficiaires_habituels || [];
      données.secteur              = ancien.secteur || '';
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
    if (!confirm(`Supprimer ${iv.prenom} ${iv.nom} ? Ses passages seront retirés du planning.`)) return;
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
    if (!données.nom) {
      UI.toast('Le nom est obligatoire.', 'error');
      return;
    }
    const idx = this.etat.beneficiaires.findIndex(b => b.id === données.id);
    if (idx >= 0) {
      const ancien = this.etat.beneficiaires[idx];
      // Préserver les champs non exposés dans le formulaire
      données.email                  = ancien.email || '';
      données.intervenante_favorite  = ancien.intervenante_favorite || null;
      données.personnel_prefere      = ancien.personnel_prefere || [];
      données.personnel_refuse       = ancien.personnel_refuse || [];
      données.max_intervenantes      = ancien.max_intervenantes || 2;
      données.priorite               = ancien.priorite || 2;
      données.souplesse_horaire      = ancien.souplesse_horaire || false;
      données.intervenantes_habituelles = ancien.intervenantes_habituelles || [];
      données.secteur                = ancien.secteur || '';
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
