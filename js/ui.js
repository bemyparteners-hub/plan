/**
 * ui.js — Rendu de l'interface utilisateur
 */
const UI = {

  // ── Navigation ────────────────────────────────────────────────────────────

  afficherSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelector(`.nav-btn[data-section="${id}"]`).classList.add('active');
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────

  afficherDashboard(etat) {
    const { intervenantes, beneficiaires, planning } = etat;
    const passages = planning ? planning.passages : [];
    const alertes  = planning ? planning.alertes  : [];

    const totalH = beneficiaires.reduce((s, b) => s + b.besoins.heures_semaine, 0);
    const couverts = Utils.arrondi(passages.reduce((s, p) => s + p.duree, 0) / 60);
    const tauxCouverture = totalH > 0 ? Math.round(couverts / totalH * 100) : 0;

    document.getElementById('stat-intervenantes').textContent = intervenantes.length;
    document.getElementById('stat-beneficiaires').textContent = beneficiaires.length;
    document.getElementById('stat-heures').textContent = `${couverts}h / ${totalH}h`;
    document.getElementById('stat-couverture').textContent = `${tauxCouverture}%`;

    // Jauge couverture
    const jauge = document.getElementById('jauge-couverture');
    jauge.style.width = `${tauxCouverture}%`;
    jauge.className = 'jauge-fill ' + (tauxCouverture >= 80 ? 'ok' : tauxCouverture >= 50 ? 'warn' : 'err');

    // Alertes récentes
    this._afficherAlertesDashboard(alertes);

    // Mini-résumé intervenantes
    this._afficherChargesIntervenantes(intervenantes, passages);
  },

  _afficherAlertesDashboard(alertes) {
    const el = document.getElementById('alertes-dashboard');
    if (!alertes.length) {
      el.innerHTML = '<p class="vide">Aucune alerte — planning non généré ou complet.</p>';
      return;
    }
    el.innerHTML = alertes.map(a => `
      <div class="alerte alerte-${a.sévérité || 'warning'}">
        <span class="alerte-ico">${a.sévérité === 'info' ? 'ℹ️' : '⚠️'}</span>
        ${a.message}
      </div>
    `).join('');
  },

  _afficherChargesIntervenantes(intervenantes, passages) {
    const el = document.getElementById('charges-intervenantes');
    el.innerHTML = intervenantes.map(iv => {
      const min = passages.filter(p => p.intervenante_id === iv.id).reduce((s,p)=>s+p.duree,0);
      const h   = Utils.arrondi(min / 60);
      const pct = Math.min(100, Math.round(h / iv.contrat_heures * 100));
      return `
        <div class="charge-item">
          <div class="charge-header">
            <span class="badge" style="background:${iv.couleur}">${iv.prenom[0]}${iv.nom[0]}</span>
            <span>${iv.prenom} ${iv.nom}</span>
            <span class="charge-val">${h}h / ${iv.contrat_heures}h</span>
          </div>
          <div class="jauge-bg">
            <div class="jauge-fill ${pct>100?'err':pct>80?'ok':'warn'}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');
  },

  // ── Liste des intervenantes ───────────────────────────────────────────────

  afficherIntervenantes(intervenantes) {
    const el = document.getElementById('liste-intervenantes');
    if (!intervenantes.length) {
      el.innerHTML = '<p class="vide">Aucune intervenante enregistrée.</p>';
      return;
    }
    el.innerHTML = intervenantes.map(iv => `
      <div class="card" data-id="${iv.id}">
        <div class="card-header">
          <span class="badge" style="background:${iv.couleur}">${iv.prenom[0]}${iv.nom[0]}</span>
          <div>
            <strong>${iv.prenom} ${iv.nom}</strong>
            <div class="sous-titre">${iv.telephone} · ${iv.contrat_heures}h/sem.</div>
          </div>
          <div class="card-actions">
            <button class="btn-icon" onclick="App.editerIntervenante('${iv.id}')" title="Modifier">✏️</button>
            <button class="btn-icon danger" onclick="App.supprimerIntervenante('${iv.id}')" title="Supprimer">🗑️</button>
          </div>
        </div>
        <div class="card-body">
          <div class="competences">
            ${iv.competences.map(c => `<span class="tag">${COMPETENCES[c]?.label || c}</span>`).join('')}
          </div>
          <div class="dispos">
            ${this._resumeDispos(iv.disponibilites)}
          </div>
          ${iv.absences.length ? `<div class="absences">🚫 ${iv.absences.length} absence(s) cette semaine</div>` : ''}
        </div>
      </div>
    `).join('');
  },

  _resumeDispos(dispos) {
    if (!dispos.length) return '<span class="sous-titre">Aucune disponibilité</span>';
    return dispos.map(d =>
      `<span class="dispo-tag">${Utils.JOURS_COURT[d.jour]} ${d.debut}–${d.fin}</span>`
    ).join('');
  },

  // ── Liste des bénéficiaires ───────────────────────────────────────────────

  afficherBeneficiaires(beneficiaires, passages) {
    const el = document.getElementById('liste-beneficiaires');
    if (!beneficiaires.length) {
      el.innerHTML = '<p class="vide">Aucun bénéficiaire enregistré.</p>';
      return;
    }
    el.innerHTML = beneficiaires.map(b => {
      const passagesB = passages.filter(p => p.beneficiaire_id === b.id);
      const hCouvertes = Utils.arrondi(passagesB.reduce((s,p)=>s+p.duree,0) / 60);
      const taux = b.besoins.heures_semaine > 0
        ? Math.round(hCouvertes / b.besoins.heures_semaine * 100) : 0;
      return `
        <div class="card" data-id="${b.id}">
          <div class="card-header">
            <span class="badge benef">${b.prenom[0]}${b.nom[0]}</span>
            <div>
              <strong>${b.prenom} ${b.nom}</strong>
              <div class="sous-titre">${b.adresse}</div>
            </div>
            <div class="card-actions">
              <button class="btn-icon" onclick="App.editerBeneficiaire('${b.id}')" title="Modifier">✏️</button>
              <button class="btn-icon danger" onclick="App.supprimerBeneficiaire('${b.id}')" title="Supprimer">🗑️</button>
            </div>
          </div>
          <div class="card-body">
            <div class="besoins-row">
              <span>🕐 ${b.besoins.heures_semaine}h/sem. · ${b.besoins.passages_par_semaine} passages · ${b.besoins.duree_passage}min</span>
              <span class="couverture ${taux>=100?'ok':taux>0?'warn':'err'}">${taux}% couvert</span>
            </div>
            <div class="competences">
              ${b.competences_requises.map(c => `<span class="tag requis">${COMPETENCES[c]?.label || c}</span>`).join('')}
            </div>
            ${b.notes ? `<div class="notes">📝 ${b.notes}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  },

  // ── Planning hebdomadaire ─────────────────────────────────────────────────

  afficherPlanning(etat, lundi) {
    const { intervenantes, beneficiaires, planning } = etat;
    const passages = planning ? planning.passages : [];

    // En-têtes colonnes
    const enTetes = document.getElementById('planning-entetes');
    enTetes.innerHTML = '<div class="cel-heure"></div>' +
      Utils.JOURS_COURT.map((j, i) => {
        const d = Utils.jourDeSemaine(lundi, i);
        return `<div class="cel-jour"><span class="jour-nom">${j}</span><span class="jour-date">${d.getDate()} ${Utils.MOIS[d.getMonth()].slice(0,3)}</span></div>`;
      }).join('');

    // Grille horaire 7h–21h par pas de 30 min
    const grille = document.getElementById('planning-grille');
    grille.innerHTML = '';

    const DEBUT_H = 7 * 60;
    const FIN_H   = 21 * 60;
    const PAS     = 60; // 1h

    // Construire les blocs par colonne
    const colonnes = Array.from({ length: 7 }, () => []);
    passages.forEach(p => {
      if (p.jour >= 0 && p.jour <= 6) colonnes[p.jour].push(p);
    });

    // Ligne de temps
    for (let t = DEBUT_H; t < FIN_H; t += PAS) {
      const ligne = document.createElement('div');
      ligne.className = 'ligne-heure';

      const celH = document.createElement('div');
      celH.className = 'cel-heure';
      celH.textContent = Utils.minutesEnHeure(t);
      ligne.appendChild(celH);

      for (let j = 0; j < 7; j++) {
        const cel = document.createElement('div');
        cel.className = 'cel-planning';

        // Passages qui commencent dans ce créneau horaire
        const passagesCel = colonnes[j].filter(p => {
          const d = Utils.heureEnMinutes(p.debut);
          return d >= t && d < t + PAS;
        });

        passagesCel.forEach(p => {
          const iv    = intervenantes.find(i => i.id === p.intervenante_id);
          const benef = beneficiaires.find(b => b.id === p.beneficiaire_id);
          if (!iv || !benef) return;

          const bloc = document.createElement('div');
          bloc.className = 'bloc-passage';
          bloc.style.borderLeftColor = iv.couleur;
          bloc.style.background = iv.couleur + '22';
          // Hauteur proportionnelle (1h = 56px)
          const hauteur = Math.round(p.duree / 60 * 56);
          bloc.style.minHeight = hauteur + 'px';
          bloc.innerHTML = `
            <span class="bloc-benef">${benef.prenom} ${benef.nom[0]}.</span>
            <span class="bloc-iv" style="color:${iv.couleur}">${iv.prenom[0]}. ${iv.nom}</span>
            <span class="bloc-heure">${p.debut}–${p.fin}</span>`;
          cel.appendChild(bloc);
        });

        ligne.appendChild(cel);
      }
      grille.appendChild(ligne);
    }

    if (!passages.length) {
      const msg = document.createElement('p');
      msg.className = 'vide planning-vide';
      msg.textContent = 'Aucun planning généré. Cliquez sur « Générer le planning ».';
      grille.appendChild(msg);
    }
  },

  // ── Alertes dédiées ───────────────────────────────────────────────────────

  afficherAlertes(alertes) {
    const el = document.getElementById('liste-alertes');
    if (!alertes || !alertes.length) {
      el.innerHTML = '<p class="vide">Aucune alerte. Générez d\'abord un planning.</p>';
      return;
    }
    const groupes = { err: [], warning: [], info: [] };
    alertes.forEach(a => {
      const sev = a.sévérité || 'warning';
      (groupes[sev] || groupes.warning).push(a);
    });

    const icones = { err: '🔴', warning: '🟡', info: '🔵' };
    const titres = { err: 'Critique', warning: 'Avertissement', info: 'Information' };

    el.innerHTML = Object.entries(groupes).map(([sev, items]) => {
      if (!items.length) return '';
      return `
        <div class="alerte-groupe">
          <h3>${icones[sev]} ${titres[sev]} (${items.length})</h3>
          ${items.map(a => `<div class="alerte alerte-${sev}">${a.message}</div>`).join('')}
        </div>`;
    }).join('');
  },

  // ── Modals formulaires ────────────────────────────────────────────────────

  ouvrirModal(id) {
    document.getElementById(id).classList.add('open');
  },

  fermerModal(id) {
    document.getElementById(id).classList.remove('open');
  },

  remplirFormulaireIntervenante(iv) {
    const f = document.getElementById('form-intervenante');
    f.elements['iv-id'].value     = iv ? iv.id : '';
    f.elements['iv-prenom'].value = iv ? iv.prenom : '';
    f.elements['iv-nom'].value    = iv ? iv.nom : '';
    f.elements['iv-tel'].value    = iv ? iv.telephone : '';
    f.elements['iv-contrat'].value= iv ? iv.contrat_heures : 35;
    f.elements['iv-couleur'].value= iv ? iv.couleur : '#4CAF50';

    // Compétences
    document.querySelectorAll('#form-intervenante .chk-competence').forEach(chk => {
      chk.checked = iv ? iv.competences.includes(chk.value) : false;
    });

    // Disponibilités (cases à cocher jours + plages)
    document.querySelectorAll('#form-intervenante .chk-jour').forEach(chk => {
      const jourIdx = parseInt(chk.value);
      const dispo = iv ? iv.disponibilites.find(d => d.jour === jourIdx) : null;
      chk.checked = !!dispo;
      const row = chk.closest('.dispo-row');
      if (row) {
        row.querySelector('.dispo-debut').value = dispo ? dispo.debut : '08:00';
        row.querySelector('.dispo-fin').value   = dispo ? dispo.fin   : '18:00';
      }
    });

    document.getElementById('modal-titre-iv').textContent = iv ? 'Modifier intervenante' : 'Nouvelle intervenante';
  },

  lireFormulaireIntervenante() {
    const f = document.getElementById('form-intervenante');
    const competences = [...document.querySelectorAll('#form-intervenante .chk-competence:checked')]
      .map(c => c.value);

    const disponibilites = [];
    document.querySelectorAll('#form-intervenante .chk-jour:checked').forEach(chk => {
      const row = chk.closest('.dispo-row');
      disponibilites.push({
        jour: parseInt(chk.value),
        debut: row.querySelector('.dispo-debut').value,
        fin:   row.querySelector('.dispo-fin').value,
      });
    });

    return {
      id:             f.elements['iv-id'].value || Utils.uid(),
      prenom:         f.elements['iv-prenom'].value.trim(),
      nom:            f.elements['iv-nom'].value.trim(),
      telephone:      f.elements['iv-tel'].value.trim(),
      contrat_heures: parseInt(f.elements['iv-contrat'].value),
      couleur:        f.elements['iv-couleur'].value,
      competences,
      disponibilites,
      absences:       [],
      refus:          [],
    };
  },

  remplirFormulaireBeneficiaire(b) {
    const f = document.getElementById('form-beneficiaire');
    f.elements['bn-id'].value        = b ? b.id : '';
    f.elements['bn-prenom'].value    = b ? b.prenom : '';
    f.elements['bn-nom'].value       = b ? b.nom : '';
    f.elements['bn-adresse'].value   = b ? b.adresse : '';
    f.elements['bn-tel'].value       = b ? b.telephone : '';
    f.elements['bn-notes'].value     = b ? b.notes : '';
    f.elements['bn-heures'].value    = b ? b.besoins.heures_semaine : 7;
    f.elements['bn-passages'].value  = b ? b.besoins.passages_par_semaine : 3;
    f.elements['bn-duree'].value     = b ? b.besoins.duree_passage : 60;
    f.elements['bn-creneau-debut'].value = b ? (b.besoins.creneaux_preferes[0]?.debut || '09:00') : '09:00';
    f.elements['bn-creneau-fin'].value   = b ? (b.besoins.creneaux_preferes[0]?.fin  || '11:00') : '11:00';

    document.querySelectorAll('#form-beneficiaire .chk-comp-requis').forEach(chk => {
      chk.checked = b ? b.competences_requises.includes(chk.value) : false;
    });

    document.querySelectorAll('#form-beneficiaire .chk-jour-pref').forEach(chk => {
      chk.checked = b ? b.besoins.jours_preferes.includes(parseInt(chk.value)) : false;
    });

    document.getElementById('modal-titre-bn').textContent = b ? 'Modifier bénéficiaire' : 'Nouveau bénéficiaire';
  },

  lireFormulaireBeneficiaire() {
    const f = document.getElementById('form-beneficiaire');
    const competences_requises = [...document.querySelectorAll('#form-beneficiaire .chk-comp-requis:checked')]
      .map(c => c.value);
    const jours_preferes = [...document.querySelectorAll('#form-beneficiaire .chk-jour-pref:checked')]
      .map(c => parseInt(c.value));

    return {
      id:      f.elements['bn-id'].value || Utils.uid(),
      prenom:  f.elements['bn-prenom'].value.trim(),
      nom:     f.elements['bn-nom'].value.trim(),
      adresse: f.elements['bn-adresse'].value.trim(),
      telephone: f.elements['bn-tel'].value.trim(),
      notes:   f.elements['bn-notes'].value.trim(),
      competences_requises,
      besoins: {
        heures_semaine:       parseInt(f.elements['bn-heures'].value),
        passages_par_semaine: parseInt(f.elements['bn-passages'].value),
        duree_passage:        parseInt(f.elements['bn-duree'].value),
        jours_preferes:       jours_preferes.length ? jours_preferes : [0,1,2,3,4],
        creneaux_preferes: [{
          debut: f.elements['bn-creneau-debut'].value,
          fin:   f.elements['bn-creneau-fin'].value,
        }],
      },
    };
  },

  // ── Toast notifications ───────────────────────────────────────────────────

  toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },
};
