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
      competences: ['aide_toilette', 'aide_repas', 'menage'],
      disponibilites: [
        { jour: 0, debut: '07:30', fin: '17:00' },
        { jour: 1, debut: '07:30', fin: '17:00' },
        { jour: 2, debut: '07:30', fin: '17:00' },
        { jour: 3, debut: '07:30', fin: '17:00' },
        { jour: 4, debut: '07:30', fin: '17:00' },
      ],
      absences: [],      // ["YYYY-MM-DD", ...]
      contrat_heures: 35,
      refus: [],         // IDs bénéficiaires refusés
      couleur: '#2196F3',
    },
    {
      id: 'iv2',
      prenom: 'Sophie',
      nom: 'Martin',
      telephone: '06 22 33 44 55',
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
      couleur: '#E91E63',
    },
    {
      id: 'iv3',
      prenom: 'Isabelle',
      nom: 'Bernard',
      telephone: '06 33 44 55 66',
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
      couleur: '#FF9800',
    },
    {
      id: 'iv4',
      prenom: 'Christine',
      nom: 'Moreau',
      telephone: '06 44 55 66 77',
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
      competences_requises: ['aide_toilette', 'aide_repas'],
      besoins: {
        heures_semaine: 10,
        passages_par_semaine: 5,
        duree_passage: 120, // minutes
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
      competences_requises: ['aide_repas', 'menage'],
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
      competences_requises: ['aide_toilette', 'soins_infirmiers'],
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
      competences_requises: ['aide_repas', 'compagnie'],
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
      competences_requises: ['menage', 'courses'],
      besoins: {
        heures_semaine: 4,
        passages_par_semaine: 2,
        duree_passage: 120,
        jours_preferes: [1, 3], // mardi, jeudi
        creneaux_preferes: [{ debut: '10:00', fin: '12:00' }],
      },
      notes: 'Autonome, besoin uniquement aide ménage et courses.',
    },
  ],

  planning: null, // généré par le moteur
};
