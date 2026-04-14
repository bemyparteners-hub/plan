# HomeCare Planner — V1

Plateforme de planification pour l'aide à domicile.  
Fonctionne entièrement dans le navigateur, sans backend, sans dépendance externe.

---

## Démarrage rapide

```bash
# Ouvrir directement dans le navigateur
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

Ou via un serveur local (recommandé pour éviter les restrictions CORS) :

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Ensuite ouvrir `http://localhost:8080`.

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Interface | HTML5 + CSS3 (responsive, pas de framework) |
| Logique | JavaScript vanilla modulaire (ES5 compatible) |
| Persistance | `localStorage` (données mock au premier lancement) |
| Moteur | Algorithme greedy maison (`js/planner.js`) |

---

## Architecture

```
/
├── index.html          Interface principale (structure + modals)
├── style.css           Styles (variables CSS, responsive)
└── js/
    ├── utils.js        Utilitaires (temps, dates, IDs)
    ├── data.js         Données mock + constantes métier
    ├── storage.js      Persistance localStorage
    ├── planner.js      Moteur de génération du planning
    ├── ui.js           Rendu des composants (dashboard, planning, listes…)
    └── app.js          Contrôleur principal, initialisation, événements
```

### Séparation des responsabilités

- **`data.js`** — Données statiques (mock) et constantes (`COMPETENCES`, `AMPLITUDE_MAX`).  
  Ne contient aucune logique métier ni accès UI.
- **`storage.js`** — Unique point d'accès à `localStorage`.  
  Expose `charger()`, `sauvegarder()`, `reinitialiser()`.
- **`planner.js`** — Moteur pur : prend `{ intervenantes, beneficiaires }` + une date lundi,  
  retourne `{ passages, alertes }`. Aucun effet de bord.
- **`ui.js`** — Génère et injecte le HTML. Ne modifie jamais l'état.
- **`app.js`** — Orchestre : lit l'état, appelle le moteur, met à jour le stockage, déclenche le rendu.
- **`utils.js`** — Fonctions pures partagées (pas d'import de modules applicatifs).

---

## Modèle de données

### Intervenante

```json
{
  "id": "iv1",
  "prenom": "Marie", "nom": "Dupont",
  "telephone": "06 11 22 33 44",
  "competences": ["aide_toilette", "aide_repas", "menage"],
  "disponibilites": [
    { "jour": 0, "debut": "07:30", "fin": "17:00" }
  ],
  "absences": ["2025-04-15"],
  "contrat_heures": 35,
  "refus": [],
  "couleur": "#2196F3"
}
```

### Bénéficiaire

```json
{
  "id": "bn1",
  "prenom": "Pierre", "nom": "Leroy",
  "adresse": "12 rue des Lilas, Paris 15e",
  "competences_requises": ["aide_toilette", "aide_repas"],
  "besoins": {
    "heures_semaine": 10,
    "passages_par_semaine": 5,
    "duree_passage": 120,
    "jours_preferes": [0, 1, 2, 3, 4],
    "creneaux_preferes": [{ "debut": "08:00", "fin": "10:00" }]
  },
  "notes": "Lever difficile le matin."
}
```

### Passage (généré)

```json
{
  "id": "abc123",
  "beneficiaire_id": "bn1",
  "intervenante_id": "iv1",
  "jour": 0,
  "debut": "08:00", "fin": "10:00",
  "duree": 120,
  "score": 35
}
```

---

## Moteur de planning V1

### Algorithme

1. Trier les bénéficiaires par volume horaire décroissant (priorité aux plus lourds)
2. Pour chaque bénéficiaire : générer les créneaux candidats (jours + horaires préférés en priorité)
3. Pour chaque créneau candidat :
   - Filtrer les intervenantes selon les **contraintes dures**
   - Scorer les éligibles selon les **contraintes souples**
   - Assigner la meilleure, ou émettre une alerte si aucune n'est disponible

### Contraintes dures (bloquantes)

| Contrainte | Implémentation |
|-----------|----------------|
| Compétences requises | `every(c => iv.competences.includes(c))` |
| Refus | `iv.refus.includes(benef.id)` |
| Absence | `iv.absences.includes(dateJour)` |
| Disponibilité | plage de disponibilité couvre le créneau |
| Chevauchement | détection d'overlap avec passages existants |
| Amplitude max | cumul journalier ≤ 10h |

### Contraintes souples (scoring)

| Contrainte | Points |
|-----------|--------|
| Continuité (déjà affectée ce bénéficiaire) | +20 |
| Créneau préféré | +10 |
| Charge équilibrée (moins chargée) | 0→+10 |
| Passage adjacent dans la journée | +5 |
| Dépassement contrat | −15 |

---

## Fonctionnalités V1

- [x] Tableau de bord avec statistiques et jauge de couverture
- [x] Gestion CRUD des intervenantes (compétences, disponibilités, contrat)
- [x] Gestion CRUD des bénéficiaires (besoins, créneaux préférés)
- [x] Génération automatique du planning (bouton branché)
- [x] Affichage planning hebdomadaire (grille jours/heures, blocs colorés)
- [x] Navigation semaine précédente / suivante
- [x] Alertes : passages non couverts, dépassement contrat, sous-charge
- [x] Persistance localStorage (données conservées entre sessions)
- [x] Réinitialisation avec données de démonstration (bouton ↺ Démo)
- [x] Interface 100 % en français
- [x] Design responsive (mobile, tablette, desktop)

---

## Périmètre V2 (hors scope V1)

| Fonctionnalité | Complexité estimée |
|---|---|
| Gestion des remplacements / absences de dernière minute | Moyenne |
| Import/export CSV ou Excel | Faible |
| Moteur d'optimisation (ILP ou branch-and-bound) | Élevée |
| Gestion multi-semaines et récurrence | Moyenne |
| Contrainte de trajet / géolocalisation | Élevée |
| Validation des compétences par certification | Faible |
| Historique et audit des modifications | Moyenne |
| Notifications (email, SMS) | Élevée (backend requis) |
| Multi-utilisateurs / authentification | Élevée (backend requis) |
| Synchronisation temps réel | Élevée (backend requis) |
| Gestion des doublons de bénéficiaires | Faible |
| Rapport PDF de la semaine | Moyenne |

---

## Données de démonstration

Au premier lancement (ou après ↺ Démo), 4 intervenantes et 5 bénéficiaires sont chargés :

**Intervenantes**
- Marie Dupont — Lun–Ven 7h30–17h, 35h contrat
- Sophie Martin — Lun–Sam 6h30–14h, 30h contrat
- Isabelle Bernard — Mar–Dim 9h–19h, 20h contrat
- Christine Moreau — Lun–Sam après-midi/soir, 25h contrat

**Bénéficiaires**
- Pierre Leroy — 10h/sem., aide toilette + repas
- Marguerite Petit — 14h/sem., aide repas + ménage (tous les jours)
- Robert Durand — 7h/sem., soins infirmiers (matins)
- Jeanne Simon — 15h/sem., repas + compagnie
- Georges Lambert — 4h/sem., ménage + courses

---

## Limitations connues de la V1

- Le moteur est greedy (premier-assigné) : il n'est pas optimal.
- Les absences ne sont modifiables que directement dans `localStorage` (pas d'interface dédiée).
- Un seul créneau préféré par bénéficiaire est pris en compte dans le formulaire.
- La navigation par semaine affiche la grille mais ne régénère pas automatiquement le planning.
- Pas de gestion de la géographie/trajets.

---

*Projet V1 — Testé localement dans Chrome/Firefox/Safari sans dépendance externe.*
