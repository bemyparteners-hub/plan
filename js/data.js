/**
 * data.js — Données mock de démonstration + constantes métier
 */

const COMPETENCES = {
  aide_toilette:   { label: 'Aide à la toilette',   icon: '🚿' },
  aide_repas:      { label: 'Aide aux repas',        icon: '🍽️' },
  menage:          { label: 'Ménage / entretien',    icon: '🧹' },
  compagnie:       { label: 'Compagnie / stimulation', icon: '💬' },
  soins_infirmiers:{ label: 'Soins infirmiers',      icon: '💊' },
  courses:         { label: 'Courses / accompagnement', icon: '🛒' },
};

const PRIORITES = { 1: 'Haute', 2: 'Normale', 3: 'Basse' };
const CONTRAT_TYPES = ['CDI', 'CDD', 'Temps partiel', 'Libéral'];

/** Amplitude max autorisée par jour (en minutes) */
const AMPLITUDE_MAX = 10 * 60;

/** Données par défaut chargées au premier lancement */
const DONNEES_INITIALES = {
  intervenantes: [
    {
      id: 'iv1',
      prenom: 'Marie',
      nom: 'Dupont',
      telephone: '06 11 22 33 44',
      email: 'marie.dupont@homecare.fr',
      adresse: '12 rue des Acacias, Paris 15e',
      contrat_type: 'CDI',
      vehicule: true,
      actif: true,
      competences: ['aide_toilette', 'aide_repas', 'menage'],
      disponibilites: [
        { jour: 0, debut: '07:30', fin: '17:00' },
        { jour: 1, debut: '07:30', fin: '17:00' },
        { jour: 2, debut: '07:30', fin: '17:00' },
        { jour: 3, debut: '07:30', fin: '17:00' },
        { jour: 4, debut: '07:30', fin: '17:00' },
      ],
      absences: [],
      contrat_heures: 35,
      refus: [],
      beneficiaires_habituels: ['bn1', 'bn4'],
      couleur: '#2196F3',
    },
    {
      id: 'iv2',
      prenom: 'Sophie',
      nom: 'Martin',
      telephone: '06 22 33 44 55',
      email: 'sophie.martin@homecare.fr',
      adresse: '5 rue Pasteur, Paris 14e',
      contrat_type: 'CDI',
      vehicule: false,
      actif: true,
      competences: ['aide_toilette', 'aide_repas', 'menage', 'soins_infirmiers'],
      disponibilites: [
        { jour: 0, debut: '06:30', fin: '14:00' },
        { jour: 1, debut: '06:30', fin: '14:00' },
        { jour: 2, debut: '06:30', fin: '14:00' },
        { jour: 3, debut: '06:30', fin: '14:00' },
        { jour: 4, debut: '06:30', fin: '14:00' },
        { jour: 5, debut: '07:00', fin: '13:00' },
      ],
      absences: [],
      contrat_heures: 30,
      refus: [],
      beneficiaires_habituels: ['bn3'],
      couleur: '#E91E63',
    },
    {
      id: 'iv3',
      prenom: 'Isabelle',
      nom: 'Bernard',
      telephone: '06 33 44 55 66',
      email: 'isabelle.bernard@homecare.fr',
      adresse: '8 allée des Roses, Paris 15e',
      contrat_type: 'CDD',
      vehicule: false,
      actif: true,
      competences: ['aide_repas', 'menage', 'compagnie', 'courses'],
      disponibilites: [
        { jour: 1, debut: '09:00', fin: '19:00' },
        { jour: 2, debut: '09:00', fin: '19:00' },
        { jour: 3, debut: '09:00', fin: '19:00' },
        { jour: 4, debut: '09:00', fin: '19:00' },
        { jour: 5, debut: '09:00', fin: '17:00' },
        { jour: 6, debut: '09:00', fin: '17:00' },
      ],
      absences: [],
      contrat_heures: 20,
      refus: [],
      beneficiaires_habituels: ['bn2', 'bn5'],
      couleur: '#FF9800',
    },
    {
      id: 'iv4',
      prenom: 'Christine',
      nom: 'Moreau',
      telephone: '06 44 55 66 77',
      email: 'christine.moreau@homecare.fr',
      adresse: '22 rue Gambetta, Paris 16e',
      contrat_type: 'CDI',
      vehicule: true,
      actif: true,
      competences: ['aide_toilette', 'aide_repas', 'menage', 'soins_infirmiers', 'compagnie'],
      disponibilites: [
        { jour: 0, debut: '14:00', fin: '20:00' },
        { jour: 1, debut: '14:00', fin: '20:00' },
        { jour: 2, debut: '14:00', fin: '20:00' },
        { jour: 3, debut: '14:00', fin: '20:00' },
        { jour: 4, debut: '14:00', fin: '20:00' },
        { jour: 5, debut: '09:00', fin: '18:00' },
      ],
      absences: [],
      contrat_heures: 25,
      refus: [],
      beneficiaires_habituels: ['bn4'],
      couleur: '#9C27B0',
    },
  ],

  beneficiaires: [
    {
      id: 'bn1',
      prenom: 'Pierre',
      nom: 'Leroy',
      adresse: '12 rue des Lilas, Paris 15e',
      telephone: '01 23 45 67 89',
      email: 'pierre.leroy@homecare.fr',
      competences_requises: ['aide_toilette', 'aide_repas'],
      intervenante_favorite: 'iv1',
      personnel_prefere: ['iv1', 'iv2'],
      personnel_refuse: [],
      max_intervenantes: 2,
      priorite: 1,
      souplesse_horaire: false,
      intervenantes_habituelles: ['iv1'],
      besoins: {
        heures_semaine: 10,
        passages_par_semaine: 5,
        duree_passage: 120,
        jours_preferes: [0, 1, 2, 3, 4],
        creneaux_preferes: [{ debut: '08:00', fin: '10:00' }],
      },
      notes: 'Lever difficile le matin. Préfère toujours la même intervenante.',
    },
    {
      id: 'bn2',
      prenom: 'Marguerite',
      nom: 'Petit',
      adresse: '5 allée des Roses, Paris 14e',
      telephone: '01 34 56 78 90',
      email: 'marguerite.petit@homecare.fr',
      competences_requises: ['aide_repas', 'menage'],
      intervenante_favorite: null,
      personnel_prefere: ['iv3'],
      personnel_refuse: [],
      max_intervenantes: 3,
      priorite: 2,
      souplesse_horaire: true,
      intervenantes_habituelles: ['iv3'],
      besoins: {
        heures_semaine: 14,
        passages_par_semaine: 7,
        duree_passage: 120,
        jours_preferes: [0, 1, 2, 3, 4, 5, 6],
        creneaux_preferes: [{ debut: '11:00', fin: '13:00' }],
      },
      notes: 'Passage midi tous les jours. Ménage approfondi le mercredi.',
    },
    {
      id: 'bn3',
      prenom: 'Robert',
      nom: 'Durand',
      adresse: '8 square Victor Hugo, Paris 16e',
      telephone: '01 45 67 89 01',
      email: 'robert.durand@homecare.fr',
      competences_requises: ['aide_toilette', 'soins_infirmiers'],
      intervenante_favorite: 'iv2',
      personnel_prefere: ['iv2'],
      personnel_refuse: [],
      max_intervenantes: 1,
      priorite: 1,
      souplesse_horaire: false,
      intervenantes_habituelles: ['iv2'],
      besoins: {
        heures_semaine: 7,
        passages_par_semaine: 7,
        duree_passage: 60,
        jours_preferes: [0, 1, 2, 3, 4, 5, 6],
        creneaux_preferes: [{ debut: '07:00', fin: '09:00' }],
      },
      notes: 'Passage matinal obligatoire. Soins infirmiers requis.',
    },
    {
      id: 'bn4',
      prenom: 'Jeanne',
      nom: 'Simon',
      adresse: '22 boulevard Pasteur, Paris 15e',
      telephone: '01 56 78 90 12',
      email: 'jeanne.simon@homecare.fr',
      competences_requises: ['aide_repas', 'compagnie'],
      intervenante_favorite: null,
      personnel_prefere: ['iv1', 'iv4'],
      personnel_refuse: [],
      max_intervenantes: 2,
      priorite: 2,
      souplesse_horaire: true,
      intervenantes_habituelles: ['iv1', 'iv4'],
      besoins: {
        heures_semaine: 15,
        passages_par_semaine: 5,
        duree_passage: 180,
        jours_preferes: [0, 1, 2, 3, 4],
        creneaux_preferes: [
          { debut: '12:00', fin: '15:00' },
          { debut: '17:00', fin: '20:00' },
        ],
      },
      notes: 'Veuve, très isolée. La compagnie est prioritaire.',
    },
    {
      id: 'bn5',
      prenom: 'Georges',
      nom: 'Lambert',
      adresse: '3 rue du Moulin, Montrouge',
      telephone: '01 67 89 01 23',
      email: 'georges.lambert@homecare.fr',
      competences_requises: ['menage', 'courses'],
      intervenante_favorite: null,
      personnel_prefere: [],
      personnel_refuse: [],
      max_intervenantes: 2,
      priorite: 3,
      souplesse_horaire: true,
      intervenantes_habituelles: ['iv3'],
      besoins: {
        heures_semaine: 4,
        passages_par_semaine: 2,
        duree_passage: 120,
        jours_preferes: [1, 3],
        creneaux_preferes: [{ debut: '10:00', fin: '12:00' }],
      },
      notes: 'Autonome, besoin uniquement aide ménage et courses.',
    },
  ],

  planning: null,
};

// ── Générateur de données fictives volumineuses ───────────────────────────────

const DataGenerator = {

  SECTEURS: ['Nord', 'Sud', 'Est', 'Ouest', 'Centre'],

  RUES: [
    'des Lilas', 'Victor Hugo', 'de la Paix', 'du Moulin', 'des Roses',
    'Pasteur', 'Gambetta', 'Jaurès', 'Voltaire', 'Danton',
    'de la République', 'du Général de Gaulle', 'Lafayette', 'Carnot', 'Foch',
  ],

  VILLES: [
    'Secteur Nord', 'Secteur Sud', 'Secteur Est', 'Secteur Ouest', 'Secteur Centre',
  ],

  PALETTE: [
    '#2196F3','#E91E63','#FF9800','#9C27B0','#00897B',
    '#F44336','#3F51B5','#009688','#795548','#607D8B',
    '#1976D2','#C2185B','#F57C00','#7B1FA2','#00796B',
    '#D32F2F','#303F9F','#00695C','#4E342E','#455A64',
  ],

  PROFILS_IV: [
    { comp: ['aide_toilette', 'aide_repas', 'menage'],        contrat: 35, dispos: [0,1,2,3,4].map(j => ({ jour: j, debut: '07:30', fin: '16:30' })) },
    { comp: ['aide_repas', 'menage', 'compagnie'],            contrat: 20, dispos: [0,1,2,3,4].map(j => ({ jour: j, debut: '09:00', fin: '18:00' })) },
    { comp: ['aide_toilette', 'soins_infirmiers', 'aide_repas'], contrat: 30, dispos: [0,1,2,3,4,5].map((j,i) => ({ jour: j, debut: '06:30', fin: i<5?'14:00':'12:00' })) },
    { comp: ['menage', 'courses', 'compagnie'],               contrat: 20, dispos: [1,2,3,4,5,6].map(j => ({ jour: j, debut: '08:30', fin: '18:30' })) },
    { comp: ['aide_toilette', 'aide_repas', 'compagnie', 'menage'], contrat: 25, dispos: [0,1,2,3,4,5].map((j,i) => ({ jour: j, debut: i<5?'14:00':'09:00', fin: i<5?'20:00':'17:00' })) },
  ],

  PROFILS_BN: [
    { comp: ['aide_toilette', 'aide_repas'], h: 10, p: 5, d: 120, cDebut: '08:00', cFin: '10:00', jours: [0,1,2,3,4] },
    { comp: ['aide_repas', 'menage'],        h: 14, p: 7, d: 120, cDebut: '11:30', cFin: '13:30', jours: [0,1,2,3,4,5,6] },
    { comp: ['aide_toilette', 'soins_infirmiers'], h: 7, p: 7, d: 60, cDebut: '07:30', cFin: '09:00', jours: [0,1,2,3,4,5,6] },
    { comp: ['aide_repas', 'compagnie'],     h: 15, p: 5, d: 180, cDebut: '12:00', cFin: '15:00', jours: [0,1,2,3,4] },
    { comp: ['menage', 'courses'],           h: 4,  p: 2, d: 120, cDebut: '10:00', cFin: '12:00', jours: [1,3] },
    { comp: ['aide_repas', 'menage', 'compagnie'], h: 21, p: 7, d: 180, cDebut: '17:00', cFin: '20:00', jours: [0,1,2,3,4,5,6] },
    { comp: ['aide_toilette'],               h: 5,  p: 5, d: 60,  cDebut: '07:00', cFin: '08:30', jours: [0,1,2,3,4] },
  ],

  genererIntervenantes(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
      const num     = i + 1;
      const profil  = this.PROFILS_IV[i % this.PROFILS_IV.length];
      const secteur = this.SECTEURS[i % this.SECTEURS.length];
      const rue     = this.RUES[i % this.RUES.length];
      const ville   = this.VILLES[i % this.VILLES.length];
      const contratType = CONTRAT_TYPES[i % 3]; // CDI, CDD, Temps partiel
      // Bénéficiaires habituels : formule déterministe
      const bnHab = [num, num + n, num + 2 * n].filter(x => x <= 200).map(x => `bn_gen_${x}`);
      result.push({
        id:             `iv_gen_${num}`,
        prenom:         '',
        nom:            `INTER-${num}`,
        telephone:      `06${String(num).padStart(8, '0')}`,
        email:          `inter-${num}@homecare.fr`,
        adresse:        `${(i % 99) + 1} rue ${rue}, ${ville}`,
        contrat_type:   contratType,
        vehicule:       i % 3 !== 0,
        actif:          true,
        competences:    [...profil.comp],
        disponibilites: profil.dispos.map(d => ({ ...d })),
        absences:       [],
        contrat_heures: profil.contrat,
        refus:          [],
        beneficiaires_habituels: bnHab,
        couleur:        this.PALETTE[i % this.PALETTE.length],
        secteur,
      });
    }
    return result;
  },

  genererBeneficiaires(n) {
    const NB_IV = 60;
    const result = [];
    for (let i = 0; i < n; i++) {
      const num     = i + 1;
      const profil  = this.PROFILS_BN[i % this.PROFILS_BN.length];
      const secteur = this.SECTEURS[i % this.SECTEURS.length];
      const rue     = this.RUES[i % this.RUES.length];
      const ville   = this.VILLES[i % this.VILLES.length];
      // Intervenante favorite = IV basée sur index cyclique
      const ivFavNum = (i % NB_IV) + 1;
      const ivFavId  = `iv_gen_${ivFavNum}`;
      // Personnel préféré : IV favorite + suivante
      const ivPref2  = `iv_gen_${(ivFavNum % NB_IV) + 1}`;
      result.push({
        id:       `bn_gen_${num}`,
        prenom:   '',
        nom:      `BENE-${num}`,
        telephone: `01${String(num).padStart(8, '0')}`,
        email:    `bene-${num}@homecare.fr`,
        adresse:  `${(i % 99) + 1} rue ${rue}, ${ville}`,
        notes:    '',
        competences_requises:   [...profil.comp],
        intervenante_favorite:  ivFavId,
        personnel_prefere:      [ivFavId, ivPref2],
        personnel_refuse:       [],
        max_intervenantes:      (i % 3 === 0) ? 1 : (i % 3 === 1) ? 2 : 3,
        priorite:               (i % 3) + 1,
        souplesse_horaire:      i % 2 === 0,
        intervenantes_habituelles: [ivFavId],
        secteur,
        besoins: {
          heures_semaine:       profil.h,
          passages_par_semaine: profil.p,
          duree_passage:        profil.d,
          jours_preferes:       [...profil.jours],
          creneaux_preferes:    [{ debut: profil.cDebut, fin: profil.cFin }],
        },
      });
    }
    return result;
  },
};
