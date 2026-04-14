/**
 * planner.js — Moteur de génération du planning V1
 *
 * Algorithme : greedy par bénéficiaire (priorité : plus d'heures d'abord)
 * Contraintes dures bloquantes, contraintes souples via scoring.
 */
const Planner = {

  /**
   * Point d'entrée principal.
   * @param {object} etat  - { intervenantes, beneficiaires }
   * @param {Date}   lundi - Premier jour de la semaine à planifier
   * @returns {{ passages: Passage[], alertes: Alerte[] }}
   */
  generer(etat, lundi) {
    const passages = [];
    const alertes  = [];

    // Charge de travail courante par intervenante : { id: minutesTotales }
    const charge = {};
    etat.intervenantes.forEach(iv => { charge[iv.id] = 0; });

    // Trier les bénéficiaires par volume horaire décroissant (priorité)
    const benefTriés = [...etat.beneficiaires]
      .sort((a, b) => b.besoins.heures_semaine - a.besoins.heures_semaine);

    for (const benef of benefTriés) {
      const résultat = this._planifierBeneficiaire(benef, etat, lundi, passages, charge, alertes);
      passages.push(...résultat.nouveaux);
      résultat.alertes.forEach(a => alertes.push(a));
    }

    return { passages, alertes };
  },

  // ── Planification d'un bénéficiaire ──────────────────────────────────────

  _planifierBeneficiaire(benef, etat, lundi, passagesExistants, charge, alertes) {
    const nouveaux = [];
    const résAlertes = [];
    const b = benef.besoins;
    const duree = b.duree_passage; // minutes

    // Créneaux candidats à tester pour ce bénéficiaire
    const candidats = this._genererCandidats(benef, lundi);

    let couverts = 0;
    const cible  = b.passages_par_semaine;

    for (const creneau of candidats) {
      if (couverts >= cible) break;

      // Trouver la meilleure intervenante pour ce créneau
      const { intervenante, score } = this._choisirIntervenante(
        benef, creneau, duree, etat, passagesExistants.concat(nouveaux), charge, lundi
      );

      if (!intervenante) {
        résAlertes.push({
          type: 'non_couvert',
          message: `Aucune intervenante disponible pour ${benef.prenom} ${benef.nom} le ${Utils.JOURS[creneau.jour]} ${creneau.debut}`,
          beneficiaire_id: benef.id,
          jour: creneau.jour,
          debut: creneau.debut,
        });
        continue;
      }

      const passage = {
        id: Utils.uid(),
        beneficiaire_id: benef.id,
        intervenante_id: intervenante.id,
        jour: creneau.jour,
        debut: creneau.debut,
        fin: Utils.minutesEnHeure(Utils.heureEnMinutes(creneau.debut) + duree),
        duree,
        score,
      };

      nouveaux.push(passage);
      charge[intervenante.id] = (charge[intervenante.id] || 0) + duree;
      couverts++;
    }

    // Alerter si le nombre de passages prévu n'est pas atteint
    if (couverts < cible) {
      const manquants = cible - couverts;
      résAlertes.push({
        type: 'insuffisant',
        message: `${benef.prenom} ${benef.nom} : ${couverts}/${cible} passages couverts (−${manquants})`,
        beneficiaire_id: benef.id,
        sévérité: 'warning',
      });
    }

    return { nouveaux, alertes: résAlertes };
  },

  // ── Génération des créneaux candidats ────────────────────────────────────

  _genererCandidats(benef, lundi) {
    const b = benef.besoins;
    const candidats = [];

    for (const jour of b.jours_preferes) {
      for (const créneau of b.creneaux_preferes) {
        candidats.push({ jour, debut: créneau.debut, prefere: true });
      }
    }

    // Créneaux alternatifs (hors préférés) pour compléter si besoin
    const joursAlternatifs = [0,1,2,3,4,5,6].filter(j => !b.jours_preferes.includes(j));
    for (const jour of joursAlternatifs) {
      for (const créneau of b.creneaux_preferes) {
        candidats.push({ jour, debut: créneau.debut, prefere: false });
      }
    }

    return candidats;
  },

  // ── Sélection de la meilleure intervenante ────────────────────────────────

  _choisirIntervenante(benef, creneau, duree, etat, passagesExistants, charge, lundi) {
    const dateJour = Utils.formatISO(Utils.jourDeSemaine(lundi, creneau.jour));
    const debutMin = Utils.heureEnMinutes(creneau.debut);
    const finMin   = debutMin + duree;

    let meilleure = null;
    let meilleureScore = -Infinity;

    for (const iv of etat.intervenantes) {
      // ── Contraintes DURES ──────────────────────────────────────────────────

      // Compétences requises
      if (!benef.competences_requises.every(c => iv.competences.includes(c))) continue;

      // Refus intervenante → bénéficiaire
      if (iv.refus.includes(benef.id)) continue;

      // Refus bénéficiaire → intervenante
      if (benef.personnel_refuse && benef.personnel_refuse.includes(iv.id)) continue;

      // Absence ce jour
      if (iv.absences.includes(dateJour)) continue;

      // Disponibilité ce jour
      const dispo = iv.disponibilites.find(d => d.jour === creneau.jour);
      if (!dispo) continue;
      const dispoDebut = Utils.heureEnMinutes(dispo.debut);
      const dispoFin   = Utils.heureEnMinutes(dispo.fin);
      if (debutMin < dispoDebut || finMin > dispoFin) continue;

      // Chevauchement avec passages existants
      const passCeJour = passagesExistants.filter(
        p => p.intervenante_id === iv.id && p.jour === creneau.jour
      );
      const chevauche = passCeJour.some(p =>
        Utils.chevauche(debutMin, finMin,
          Utils.heureEnMinutes(p.debut), Utils.heureEnMinutes(p.fin))
      );
      if (chevauche) continue;

      // Amplitude max
      const minutesCeJour = passCeJour.reduce((s, p) => s + p.duree, 0);
      if (minutesCeJour + duree > AMPLITUDE_MAX) continue;

      // ── Contraintes SOUPLES (score) ────────────────────────────────────────
      let score = 0;

      // Continuité : déjà affectée à ce bénéficiaire cette semaine
      if (passagesExistants.some(p => p.intervenante_id === iv.id && p.beneficiaire_id === benef.id)) {
        score += 20;
      }

      // Intervenante favorite du bénéficiaire
      if (benef.intervenante_favorite && benef.intervenante_favorite === iv.id) score += 15;

      // Dans la liste des préférées
      if (benef.personnel_prefere && benef.personnel_prefere.includes(iv.id)) score += 8;

      // Créneau préféré du bénéficiaire
      if (creneau.prefere) score += 10;

      // Charge équilibrée (moins chargée = mieux)
      const chargeActuelle = (charge[iv.id] || 0) / 60; // en heures
      score += Math.max(0, 10 - chargeActuelle);

      // Respect du contrat : si déjà au-dessus du contrat, pénalité
      if (chargeActuelle >= iv.contrat_heures) score -= 15;

      // Limitation des trous : bonus si passage adjacent dans la journée
      const passesCeJour2 = passagesExistants.filter(
        p => p.intervenante_id === iv.id && p.jour === creneau.jour
      );
      const adjacent = passesCeJour2.some(p => {
        const pFin  = Utils.heureEnMinutes(p.fin);
        const pDeb  = Utils.heureEnMinutes(p.debut);
        return Math.abs(pFin - debutMin) <= 60 || Math.abs(pDeb - finMin) <= 60;
      });
      if (adjacent) score += 5;

      if (score > meilleureScore) {
        meilleureScore = score;
        meilleure = iv;
      }
    }

    return { intervenante: meilleure, score: meilleureScore };
  },

  // ── Alertes complémentaires post-génération ───────────────────────────────

  /**
   * Génère des alertes sur le dépassement de contrat ou la sous-charge.
   */
  alertesCharge(etat, passages) {
    const alertes = [];
    for (const iv of etat.intervenantes) {
      const minutesAssignées = passages
        .filter(p => p.intervenante_id === iv.id)
        .reduce((s, p) => s + p.duree, 0);
      const heuresAssignées = Utils.arrondi(minutesAssignées / 60);

      if (heuresAssignées > iv.contrat_heures) {
        alertes.push({
          type: 'depassement_contrat',
          message: `${iv.prenom} ${iv.nom} : ${heuresAssignées}h assignées / ${iv.contrat_heures}h contrat`,
          intervenante_id: iv.id,
          sévérité: 'warning',
        });
      } else if (heuresAssignées < iv.contrat_heures * 0.5) {
        alertes.push({
          type: 'sous_charge',
          message: `${iv.prenom} ${iv.nom} : seulement ${heuresAssignées}h sur ${iv.contrat_heures}h contractuelles`,
          intervenante_id: iv.id,
          sévérité: 'info',
        });
      }
    }
    return alertes;
  },
};
