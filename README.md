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
- [x] **Import CSV** des intervenantes et bénéficiaires
- [x] **Import Excel (.xlsx)** via SheetJS (nécessite internet)
- [x] Prévisualisation avant import + choix ajouter/remplacer
- [x] Téléchargement de modèles CSV et Excel
- [x] **Génération masse** : 60 intervenantes (INTER-1…60) + 200 bénéficiaires (BENE-1…200)
- [x] Données entièrement fictives (noms techniques, adresses et téléphones fictifs)
- [x] Interface 100 % en français
- [x] Design responsive (mobile, tablette, desktop)

---

## Import de données

### Formats acceptés

| Format | Extension | Séparateur | Encodage |
|--------|-----------|------------|----------|
| CSV    | `.csv`    | `;` (point-virgule, auto-détecté) | UTF-8 (avec ou sans BOM) |
| Excel  | `.xlsx`   | — (première feuille) | — (nécessite internet pour SheetJS) |

### Colonnes intervenantes

| Colonne | Obligatoire | Description | Exemple |
|---------|-------------|-------------|---------|
| `nom` | ✅ | Identifiant ou nom affiché | `INTER-1` |
| `prenom` | — | Prénom (peut être vide) | `` |
| `telephone` | — | Téléphone fictif | `0600000001` |
| `contrat_heures` | — | Heures contractuelles par semaine | `35` |
| `competences` | — | Liste séparée par `\|` | `aide_toilette\|aide_repas\|menage` |
| `disponibilites` | — | Format `jour:debut-fin\|…` (jour 0=lundi) | `0:07:30-17:00\|1:07:30-17:00` |
| `couleur` | — | Couleur hexadécimale | `#2196F3` |

**Valeurs valides pour `competences`** :
`aide_toilette`, `aide_repas`, `menage`, `compagnie`, `soins_infirmiers`, `courses`

### Colonnes bénéficiaires

| Colonne | Obligatoire | Description | Exemple |
|---------|-------------|-------------|---------|
| `nom` | ✅ | Identifiant ou nom affiché | `BENE-1` |
| `prenom` | — | Prénom (peut être vide) | `` |
| `telephone` | — | Téléphone fictif | `0100000001` |
| `adresse` | — | Adresse fictive | `1 rue des Lilas Secteur Nord` |
| `competences_requises` | — | Liste séparée par `\|` | `aide_repas\|menage` |
| `heures_semaine` | — | Volume horaire hebdomadaire | `10` |
| `passages_par_semaine` | — | Nombre de passages par semaine | `5` |
| `duree_passage` | — | Durée d'un passage en minutes | `120` |
| `jours_preferes` | — | Jours préférés (0=lun…6=dim) séparés par `,` | `0,1,2,3,4` |
| `creneau_debut` | — | Heure début créneau préféré | `08:00` |
| `creneau_fin` | — | Heure fin créneau préféré | `10:00` |
| `notes` | — | Texte libre | `Passage matin uniquement` |

### Exemple CSV intervenantes

```csv
nom;prenom;telephone;contrat_heures;competences;disponibilites;couleur
INTER-1;;0600000001;35;aide_toilette|aide_repas|menage;0:07:30-17:00|1:07:30-17:00|2:07:30-17:00|3:07:30-17:00|4:07:30-17:00;#2196F3
INTER-2;;0600000002;30;aide_repas|menage|compagnie;0:09:00-18:00|1:09:00-18:00|2:09:00-18:00|3:09:00-18:00|4:09:00-18:00;#E91E63
```

### Exemple CSV bénéficiaires

```csv
nom;prenom;telephone;adresse;competences_requises;heures_semaine;passages_par_semaine;duree_passage;jours_preferes;creneau_debut;creneau_fin;notes
BENE-1;;0100000001;1 rue des Lilas Secteur Nord;aide_repas|menage;10;5;120;0,1,2,3,4;08:00;10:00;Passage matin uniquement
BENE-2;;0100000002;2 rue de la Paix Secteur Sud;aide_toilette|soins_infirmiers;7;7;60;0,1,2,3,4,5,6;07:30;09:00;Soins quotidiens
```

### Comportement à l'import

1. Sélection du fichier (`.csv` ou `.xlsx`)
2. Parsing + transformation automatique en objets internes
3. **Prévisualisation** : aperçu des 10 premiers enregistrements + alertes
4. Choix du mode : **Ajouter** (fusionner) ou **Remplacer** (écraser)
5. Confirmation → insertion dans localStorage

---

## Génération de données fictives en masse

Accessible depuis le tableau de bord → bouton **📦 Générer 60 + 200 données fictives**.

| | Intervenantes | Bénéficiaires |
|---|---|---|
| Nombre | 60 | 200 |
| Convention | `INTER-1` à `INTER-60` | `BENE-1` à `BENE-200` |
| Téléphone | `06XXXXXXXX` (fictif) | `01XXXXXXXX` (fictif) |
| Adresse | `N rue X, Secteur Y` (fictive) | `N rue X, Secteur Y` (fictive) |
| Profils | 5 rotations de compétences + horaires | 7 rotations de besoins + créneaux |
| Données réelles | ❌ Aucune | ❌ Aucune |

**Note** : avec 60 intervenantes et 200 bénéficiaires, la génération du planning peut prendre quelques secondes. C'est normal — l'algorithme greedy est O(bénéficiaires × créneaux × intervenantes).

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
