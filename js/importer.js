/**
 * importer.js — Import CSV / Excel + génération de données fictives volumineuses
 *
 * Séparateur CSV : point-virgule (;) — compatible avec les exports Excel français.
 * Le séparateur virgule (,) est aussi détecté automatiquement.
 * Excel nécessite SheetJS chargé depuis CDN (voir index.html).
 */
const Importer = {

  // ── Colonnes attendues ────────────────────────────────────────────────────

  COLONNES_IV: [
    'nom', 'prenom', 'telephone', 'contrat_heures',
    'competences', 'disponibilites', 'couleur',
  ],

  COLONNES_BN: [
    'nom', 'prenom', 'telephone', 'adresse',
    'competences_requises', 'heures_semaine', 'passages_par_semaine',
    'duree_passage', 'jours_preferes', 'creneau_debut', 'creneau_fin', 'notes',
  ],

  COMPETENCES_VALIDES: ['aide_toilette', 'aide_repas', 'menage', 'compagnie', 'soins_infirmiers', 'courses'],

  // ── CSV ───────────────────────────────────────────────────────────────────

  /** Détecte le séparateur dominant (;  ou ,) */
  _detecterSep(ligne) {
    const sc = (ligne.match(/;/g) || []).length;
    const cm = (ligne.match(/,/g) || []).length;
    return sc >= cm ? ';' : ',';
  },

  /** Parse un fichier CSV → tableau d'objets { colonne: valeur } */
  parseCSV(texte) {
    const lignes = texte.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    if (lignes.length < 2) return { rows: [], erreurs: ['Fichier vide ou sans données.'] };

    const sep = this._detecterSep(lignes[0]);
    const entetes = this._splitLigne(lignes[0], sep).map(h => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lignes.length; i++) {
      const ligne = lignes[i].trim();
      if (!ligne) continue;
      const vals = this._splitLigne(ligne, sep);
      const row = {};
      entetes.forEach((h, idx) => { row[h] = (vals[idx] || '').trim(); });
      rows.push(row);
    }

    return { rows, entetes, erreurs: [] };
  },

  /** Découpe une ligne CSV en respectant les guillemets */
  _splitLigne(ligne, sep) {
    const result = [];
    let courant = '';
    let guillemets = false;
    for (let i = 0; i < ligne.length; i++) {
      const c = ligne[i];
      if (c === '"') {
        guillemets = !guillemets;
      } else if (c === sep && !guillemets) {
        result.push(courant);
        courant = '';
      } else {
        courant += c;
      }
    }
    result.push(courant);
    return result;
  },

  // ── Excel (SheetJS) ───────────────────────────────────────────────────────

  xlsxDispo() {
    return typeof XLSX !== 'undefined';
  },

  /** Parse un ArrayBuffer Excel → même format que parseCSV */
  parseExcel(buffer) {
    if (!this.xlsxDispo()) {
      return { rows: [], erreurs: ['SheetJS non disponible. Vérifiez votre connexion internet pour charger la bibliothèque Excel.'] };
    }
    try {
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!data || data.length < 2) return { rows: [], erreurs: ['Feuille Excel vide.'] };

      const entetes = data[0].map(h => String(h).trim().toLowerCase());
      const rows = data.slice(1)
        .filter(r => r.some(c => String(c).trim() !== ''))
        .map(r => {
          const row = {};
          entetes.forEach((h, i) => { row[h] = String(r[i] === undefined ? '' : r[i]).trim(); });
          return row;
        });

      return { rows, entetes, erreurs: [] };
    } catch (e) {
      return { rows: [], erreurs: [`Erreur lecture Excel : ${e.message}`] };
    }
  },

  // ── Validation ────────────────────────────────────────────────────────────

  validerColonnesIV(entetes) {
    const manquantes = ['nom'].filter(c => !entetes.includes(c));
    return manquantes.map(c => `Colonne obligatoire manquante : « ${c} »`);
  },

  validerColonnesBN(entetes) {
    const manquantes = ['nom'].filter(c => !entetes.includes(c));
    return manquantes.map(c => `Colonne obligatoire manquante : « ${c} »`);
  },

  // ── Transformation ────────────────────────────────────────────────────────

  /** Convertit une ligne brute en objet Intervenante */
  transformerIntervenante(row, index) {
    const PALETTE = ['#2196F3','#E91E63','#FF9800','#9C27B0','#00897B',
                     '#F44336','#3F51B5','#009688','#795548','#607D8B'];

    const competences = row.competences
      ? row.competences.split('|').map(c => c.trim()).filter(c => this.COMPETENCES_VALIDES.includes(c))
      : [];

    return {
      id:             row.id || Utils.uid(),
      prenom:         row.prenom || '',
      nom:            row.nom || `INTER-${index + 1}`,
      telephone:      row.telephone || `06${String(index + 1).padStart(8, '0')}`,
      contrat_heures: Math.max(1, parseInt(row.contrat_heures) || 35),
      competences:    competences.length ? competences : ['aide_repas'],
      disponibilites: this._parseDispos(row.disponibilites),
      absences:       [],
      refus:          [],
      couleur:        row.couleur || PALETTE[index % PALETTE.length],
    };
  },

  /** Convertit une ligne brute en objet Bénéficiaire */
  transformerBeneficiaire(row, index) {
    const jours = row.jours_preferes
      ? row.jours_preferes.split(',')
          .map(j => parseInt(j.trim()))
          .filter(j => !isNaN(j) && j >= 0 && j <= 6)
      : [0, 1, 2, 3, 4];

    const competences = row.competences_requises
      ? row.competences_requises.split('|').map(c => c.trim()).filter(c => this.COMPETENCES_VALIDES.includes(c))
      : [];

    return {
      id:       row.id || Utils.uid(),
      prenom:   row.prenom || '',
      nom:      row.nom || `BENE-${index + 1}`,
      telephone: row.telephone || `01${String(index + 1).padStart(8, '0')}`,
      adresse:  row.adresse || `${(index % 99) + 1} rue de Test`,
      notes:    row.notes || '',
      competences_requises: competences.length ? competences : ['aide_repas'],
      besoins: {
        heures_semaine:       Math.max(1, parseInt(row.heures_semaine) || 7),
        passages_par_semaine: Math.max(1, parseInt(row.passages_par_semaine) || 3),
        duree_passage:        Math.max(30, parseInt(row.duree_passage) || 60),
        jours_preferes:       jours.length ? jours : [0, 1, 2, 3, 4],
        creneaux_preferes: [{
          debut: row.creneau_debut || '09:00',
          fin:   row.creneau_fin   || '11:00',
        }],
      },
    };
  },

  /** Parse le champ disponibilites : "0:07:30-17:00|1:07:30-17:00" */
  _parseDispos(str) {
    if (!str || !str.trim()) return this._dispoDefaut();
    const dispos = str.split('|').map(s => {
      const parts = s.trim().split(':');
      if (parts.length < 2) return null;
      const jour = parseInt(parts[0]);
      const plage = parts.slice(1).join(':'); // "07:30-17:00"
      const [debut, fin] = plage.split('-');
      if (isNaN(jour) || jour < 0 || jour > 6 || !debut || !fin) return null;
      return { jour, debut: debut.trim(), fin: fin.trim() };
    }).filter(Boolean);
    return dispos.length ? dispos : this._dispoDefaut();
  },

  _dispoDefaut() {
    return [0, 1, 2, 3, 4].map(j => ({ jour: j, debut: '08:00', fin: '17:00' }));
  },

  // ── Modèles CSV (téléchargement) ──────────────────────────────────────────

  modeleCSVIntervenantes() {
    const h = 'nom;prenom;telephone;contrat_heures;competences;disponibilites;couleur';
    const ex = [
      'INTER-1;;0600000001;35;aide_toilette|aide_repas|menage;0:07:30-17:00|1:07:30-17:00|2:07:30-17:00|3:07:30-17:00|4:07:30-17:00;#2196F3',
      'INTER-2;;0600000002;30;aide_repas|menage|compagnie;0:09:00-18:00|1:09:00-18:00|2:09:00-18:00|3:09:00-18:00|4:09:00-18:00;#E91E63',
    ];
    return [h, ...ex, ''].join('\n');
  },

  modeleCSVBeneficiaires() {
    const h = 'nom;prenom;telephone;adresse;competences_requises;heures_semaine;passages_par_semaine;duree_passage;jours_preferes;creneau_debut;creneau_fin;notes';
    const ex = [
      'BENE-1;;0100000001;1 rue des Lilas Secteur Nord;aide_repas|menage;10;5;120;0,1,2,3,4;08:00;10:00;Passage matin uniquement',
      'BENE-2;;0100000002;2 rue de la Paix Secteur Sud;aide_toilette|soins_infirmiers;7;7;60;0,1,2,3,4,5,6;07:30;09:00;Soins quotidiens',
    ];
    return [h, ...ex, ''].join('\n');
  },

  /** Déclenche le téléchargement d'un fichier texte */
  telecharger(nom, contenu, mime = 'text/csv;charset=utf-8;') {
    const blob = new Blob(['\uFEFF' + contenu], { type: mime }); // BOM pour Excel
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = nom;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  /** Télécharge le modèle Excel si SheetJS disponible */
  telechargerModeleExcel(type) {
    if (!this.xlsxDispo()) {
      alert('SheetJS non disponible — vérifiez votre connexion internet puis réessayez.');
      return;
    }
    const entetes = type === 'iv' ? this.COLONNES_IV : this.COLONNES_BN;
    const exemple = type === 'iv'
      ? [['INTER-1', '', '0600000001', '35', 'aide_toilette|aide_repas', '0:07:30-17:00|1:07:30-17:00', '#2196F3']]
      : [['BENE-1', '', '0100000001', '1 rue de Test Secteur Nord', 'aide_repas|menage', '10', '5', '120', '0,1,2,3,4', '08:00', '10:00', '']];

    const ws = XLSX.utils.aoa_to_sheet([entetes, ...exemple]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = type === 'iv' ? 'modele_intervenantes.xlsx' : 'modele_beneficiaires.xlsx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
