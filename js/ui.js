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
    // Limiter à 20 pour le dashboard (60+ IV serait illisible)
    const liste = intervenantes.slice(0, 20);
    el.innerHTML = liste.map(iv => {
      const min = passages.filter(p => p.intervenante_id === iv.id).reduce((s,p)=>s+p.duree,0);
      const h   = Utils.arrondi(min / 60);
      const pct = Math.min(100, Math.round(h / iv.contrat_heures * 100));
      const initiales = (iv.prenom ? iv.prenom[0] : '') + iv.nom[0];
      return `
        <div class="charge-item">
          <div class="charge-header">
            <span class="badge" style="background:${iv.couleur};font-size:11px">${initiales}</span>
            <span>${iv.prenom ? iv.prenom + ' ' : ''}${iv.nom}</span>
            <span class="charge-val">${h}h / ${iv.contrat_heures}h</span>
          </div>
          <div class="jauge-bg">
            <div class="jauge-fill ${pct>100?'err':pct>=70?'ok':'warn'}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('') + (intervenantes.length > 20
      ? `<p class="sous-titre" style="text-align:center;margin-top:6px">… et ${intervenantes.length - 20} intervenante(s) supplémentaires</p>`
      : '');
  },

  // ── Tableau intervenantes ─────────────────────────────────────────────────

  afficherIntervenantes(intervenantes, passages, filtre) {
    filtre = (filtre || '').toLowerCase();
    const liste = filtre
      ? intervenantes.filter(iv =>
          (iv.nom + ' ' + (iv.prenom || '') + ' ' + (iv.telephone || '') +
           ' ' + (iv.email || '') + ' ' + (iv.secteur || '')).toLowerCase().includes(filtre))
      : intervenantes;

    const countEl = document.getElementById('count-iv');
    if (countEl) countEl.textContent = `${liste.length} / ${intervenantes.length} intervenante(s)`;

    const corps = document.getElementById('corps-intervenantes');
    if (!liste.length) {
      corps.innerHTML = `<tr><td colspan="9" class="vide">${filtre ? 'Aucun résultat pour « ' + filtre + ' ».' : 'Aucune intervenante enregistrée.'}</td></tr>`;
      return;
    }

    corps.innerHTML = liste.map(iv => {
      const min = passages ? passages.filter(p => p.intervenante_id === iv.id).reduce((s,p)=>s+p.duree,0) : 0;
      const h   = Utils.arrondi(min / 60);
      const pct = Math.min(100, Math.round(h / iv.contrat_heures * 100));
      const initiales = (iv.prenom ? iv.prenom[0] : '') + iv.nom[0];
      // Afficher max 3 compétences
      const compTags = iv.competences.slice(0, 3).map(c =>
        `<span class="tag-comp">${COMPETENCES[c]?.label.split('/')[0].trim() || c}</span>`
      ).join('') + (iv.competences.length > 3 ? `<span class="tag-comp">+${iv.competences.length-3}</span>` : '');
      const statutActif = iv.actif !== false
        ? '<span style="color:var(--ok);font-weight:700;">●</span>'
        : '<span style="color:var(--sub);">○</span>';

      return `<tr>
        <td class="td-badge"><span class="badge" style="background:${iv.couleur};font-size:11px">${initiales}</span></td>
        <td class="td-nom">${iv.prenom ? iv.prenom + ' ' : ''}${iv.nom}</td>
        <td class="td-sub">${iv.telephone || '—'}</td>
        <td class="td-sub">${iv.email || '—'}</td>
        <td>${iv.contrat_type || 'CDI'} · ${iv.contrat_heures}h</td>
        <td class="td-sub">${iv.secteur || '—'}</td>
        <td>${compTags}</td>
        <td><span class="charge-inline ${pct>100?'err':pct>=70?'ok':'warn'}">${h}h / ${iv.contrat_heures}h</span></td>
        <td class="td-actions">
          <button class="btn btn-sm btn-outline" onclick="App.voirFicheIntervenante('${iv.id}')">Fiche</button>
          <button class="btn-icon" onclick="App.editerIntervenante('${iv.id}')" title="Modifier">✏️</button>
          <button class="btn-icon danger" onclick="App.supprimerIntervenante('${iv.id}')" title="Supprimer">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  },

  _resumeDispos(dispos) {
    if (!dispos || !dispos.length) return '<span class="sous-titre">Aucune disponibilité</span>';
    return dispos.map(d =>
      `<span class="dispo-tag">${Utils.JOURS_COURT[d.jour]} ${d.debut}–${d.fin}</span>`
    ).join('');
  },

  // ── Tableau bénéficiaires ─────────────────────────────────────────────────

  afficherBeneficiaires(beneficiaires, passages, filtre) {
    filtre = (filtre || '').toLowerCase();
    const liste = filtre
      ? beneficiaires.filter(b =>
          (b.nom + ' ' + (b.prenom || '') + ' ' + (b.adresse || '') +
           ' ' + (b.telephone || '') + ' ' + (b.secteur || '')).toLowerCase().includes(filtre))
      : beneficiaires;

    const countEl = document.getElementById('count-bn');
    if (countEl) countEl.textContent = `${liste.length} / ${beneficiaires.length} bénéficiaire(s)`;

    const corps = document.getElementById('corps-beneficiaires');
    if (!liste.length) {
      corps.innerHTML = `<tr><td colspan="9" class="vide">${filtre ? 'Aucun résultat pour « ' + filtre + ' ».' : 'Aucun bénéficiaire enregistré.'}</td></tr>`;
      return;
    }

    corps.innerHTML = liste.map(b => {
      const passagesB  = passages ? passages.filter(p => p.beneficiaire_id === b.id) : [];
      const hCouvertes = Utils.arrondi(passagesB.reduce((s,p)=>s+p.duree,0) / 60);
      const taux       = b.besoins.heures_semaine > 0 ? Math.round(hCouvertes / b.besoins.heures_semaine * 100) : 0;
      const prio       = b.priorite || 2;
      const adr        = (b.adresse || '—').length > 32 ? b.adresse.slice(0, 30) + '…' : (b.adresse || '—');

      return `<tr>
        <td class="td-nom">${b.prenom ? b.prenom + ' ' : ''}${b.nom}</td>
        <td class="td-sub" title="${b.adresse || ''}">${adr}</td>
        <td class="td-sub">${b.telephone || '—'}</td>
        <td><strong>${b.besoins.heures_semaine}h</strong></td>
        <td class="td-sub">${b.besoins.passages_par_semaine} × ${b.besoins.duree_passage}min</td>
        <td><span class="prio prio-${prio}">${PRIORITES[prio] || prio}</span></td>
        <td class="td-sub">${b.secteur || '—'}</td>
        <td><span class="couv-inline ${taux>=100?'ok':taux>0?'warn':'err'}">${taux}%</span></td>
        <td class="td-actions">
          <button class="btn btn-sm btn-outline" onclick="App.voirFicheBeneficiaire('${b.id}')">Fiche</button>
          <button class="btn-icon" onclick="App.editerBeneficiaire('${b.id}')" title="Modifier">✏️</button>
          <button class="btn-icon danger" onclick="App.supprimerBeneficiaire('${b.id}')" title="Supprimer">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  },

  // ── Fiches détaillées ─────────────────────────────────────────────────────

  afficherFicheIntervenante(iv, passages, beneficiaires) {
    const min = passages.reduce((s,p) => s+p.duree, 0);
    const h   = Utils.arrondi(min / 60);
    const pct = iv.contrat_heures > 0 ? Math.round(h / iv.contrat_heures * 100) : 0;

    // Bénéficiaires assignés dans le planning courant
    const bnIds   = [...new Set(passages.map(p => p.beneficiaire_id))];
    const bnAssignes = bnIds.map(id => beneficiaires.find(b => b.id === id)).filter(Boolean);

    // Bénéficiaires habituels (hors planning courant)
    const bnHabituels = (iv.beneficiaires_habituels || [])
      .map(id => beneficiaires.find(b => b.id === id)).filter(Boolean);

    // Refus
    const bnRefus = (iv.refus || [])
      .map(id => beneficiaires.find(b => b.id === id)).filter(Boolean);

    document.getElementById('fiche-titre').textContent =
      `${iv.prenom ? iv.prenom + ' ' : ''}${iv.nom}`;

    const lienBN = arr => arr.length
      ? arr.map(b => `<span class="lien-bn" onclick="App.voirFicheBeneficiaire('${b.id}');UI.fermerModal('modal-fiche')">${b.nom}</span>`).join('')
      : '<span class="sous-titre">—</span>';

    const passageTri = [...passages].sort((a,b) => a.jour - b.jour || Utils.heureEnMinutes(a.debut) - Utils.heureEnMinutes(b.debut));

    document.getElementById('fiche-corps').innerHTML = `
      <div class="fiche-corps">

        <div class="fiche-section">
          <div class="fiche-section-titre">Identité & Contrat</div>
          <div class="fiche-grid">
            <div class="fiche-field"><span class="fiche-label">ID</span><span class="fiche-val">${iv.id}</span></div>
            <div class="fiche-field"><span class="fiche-label">Statut</span><span class="fiche-val">${iv.actif !== false ? '● Actif' : '○ Inactif'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Téléphone</span><span class="fiche-val">${iv.telephone || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Email</span><span class="fiche-val">${iv.email || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Adresse</span><span class="fiche-val">${iv.adresse || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Secteur</span><span class="fiche-val">${iv.secteur || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Type de contrat</span><span class="fiche-val">${iv.contrat_type || 'CDI'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Heures contractuelles</span><span class="fiche-val em">${iv.contrat_heures}h / semaine</span></div>
            <div class="fiche-field"><span class="fiche-label">Heures planifiées</span><span class="fiche-val">${h}h (${pct}%)</span></div>
            <div class="fiche-field"><span class="fiche-label">Véhicule</span><span class="fiche-val">${iv.vehicule ? '✓ Oui' : '✗ Non'}</span></div>
          </div>
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Compétences</div>
          <div class="competences" style="padding:10px 14px">
            ${iv.competences.map(c => `<span class="tag">${COMPETENCES[c]?.label || c}</span>`).join('') || '<span class="sous-titre">—</span>'}
          </div>
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Disponibilités</div>
          <div class="dispos-liste">
            ${iv.disponibilites.map(d => `<span class="dispo-tag">${Utils.JOURS[d.jour]} ${d.debut}–${d.fin}</span>`).join('') || '<span class="sous-titre">—</span>'}
          </div>
          ${iv.absences && iv.absences.length ? `<div style="padding:0 14px 10px;font-size:12px;color:var(--err)">🚫 Absences : ${iv.absences.join(', ')}</div>` : ''}
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Planning de la semaine (${passages.length} passage(s))</div>
          <div class="passes-liste">
            ${passageTri.length ? passageTri.map(p => {
              const bn = beneficiaires.find(b => b.id === p.beneficiaire_id);
              return `<div class="pass-item">
                <span class="pass-dot" style="background:${iv.couleur}"></span>
                <strong>${Utils.JOURS_COURT[p.jour]}</strong>
                <span>${p.debut}–${p.fin}</span>
                <span class="td-sub">→ ${bn ? bn.nom : p.beneficiaire_id}</span>
              </div>`;
            }).join('') : '<span class="vide" style="padding:0">Aucun passage planifié cette semaine.</span>'}
          </div>
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Affinités & Continuité</div>
          <div class="fiche-grid">
            <div class="fiche-field"><span class="fiche-label">Intervient chez (planning)</span><div class="fiche-val">${lienBN(bnAssignes)}</div></div>
            <div class="fiche-field"><span class="fiche-label">Bénéficiaires habituels</span><div class="fiche-val">${lienBN(bnHabituels)}</div></div>
            <div class="fiche-field"><span class="fiche-label">Refus de prise en charge</span><div class="fiche-val">${lienBN(bnRefus)}</div></div>
          </div>
        </div>

      </div>`;
  },

  afficherFicheBeneficiaire(bn, passages, intervenantes) {
    const passagesB  = passages;
    const hCouvertes = Utils.arrondi(passagesB.reduce((s,p)=>s+p.duree,0) / 60);
    const taux       = bn.besoins.heures_semaine > 0 ? Math.round(hCouvertes / bn.besoins.heures_semaine * 100) : 0;
    const prio       = bn.priorite || 2;

    // Intervenantes assignées cette semaine
    const ivIds = [...new Set(passagesB.map(p => p.intervenante_id))];
    const ivAssignees = ivIds.map(id => intervenantes.find(iv => iv.id === id)).filter(Boolean);

    const nomIV = id => {
      const iv = intervenantes.find(i => i.id === id);
      return iv ? iv.nom : id;
    };

    const lienIV = arr => arr.length
      ? arr.map(iv => `<span class="lien-iv" onclick="App.voirFicheIntervenante('${iv.id}');UI.fermerModal('modal-fiche')">${iv.nom}</span>`).join('')
      : '<span class="sous-titre">—</span>';

    const lienIVIds = ids => {
      if (!ids || !ids.length) return '<span class="sous-titre">—</span>';
      return ids.map(id => {
        const iv = intervenantes.find(i => i.id === id);
        return iv
          ? `<span class="lien-iv" onclick="App.voirFicheIntervenante('${id}');UI.fermerModal('modal-fiche')">${iv.nom}</span>`
          : `<span class="lien-iv">${id}</span>`;
      }).join('');
    };

    const joursLabel = (bn.besoins.jours_preferes || []).map(j => Utils.JOURS_COURT[j]).join(', ') || '—';
    const creneaux   = (bn.besoins.creneaux_preferes || []).map(c => `${c.debut}–${c.fin}`).join(', ') || '—';

    const passageTri = [...passagesB].sort((a,b) => a.jour - b.jour || Utils.heureEnMinutes(a.debut) - Utils.heureEnMinutes(b.debut));

    document.getElementById('fiche-titre').textContent =
      `${bn.prenom ? bn.prenom + ' ' : ''}${bn.nom}`;

    document.getElementById('fiche-corps').innerHTML = `
      <div class="fiche-corps">

        <div class="fiche-section">
          <div class="fiche-section-titre">Identité & Contact</div>
          <div class="fiche-grid">
            <div class="fiche-field"><span class="fiche-label">ID</span><span class="fiche-val">${bn.id}</span></div>
            <div class="fiche-field"><span class="fiche-label">Priorité</span><span class="fiche-val"><span class="prio prio-${prio}">${PRIORITES[prio]}</span></span></div>
            <div class="fiche-field"><span class="fiche-label">Téléphone</span><span class="fiche-val">${bn.telephone || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Email</span><span class="fiche-val">${bn.email || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Adresse</span><span class="fiche-val">${bn.adresse || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Secteur</span><span class="fiche-val">${bn.secteur || '—'}</span></div>
          </div>
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Besoins d'intervention</div>
          <div class="fiche-grid">
            <div class="fiche-field"><span class="fiche-label">Volume hebdomadaire</span><span class="fiche-val em">${bn.besoins.heures_semaine}h / semaine</span></div>
            <div class="fiche-field"><span class="fiche-label">Couverture actuelle</span><span class="fiche-val">${hCouvertes}h (${taux}%)</span></div>
            <div class="fiche-field"><span class="fiche-label">Passages</span><span class="fiche-val">${bn.besoins.passages_par_semaine} × ${bn.besoins.duree_passage} min</span></div>
            <div class="fiche-field"><span class="fiche-label">Max intervenantes</span><span class="fiche-val">${bn.max_intervenantes || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Jours préférés</span><span class="fiche-val">${joursLabel}</span></div>
            <div class="fiche-field"><span class="fiche-label">Créneau préféré</span><span class="fiche-val">${creneaux}</span></div>
            <div class="fiche-field"><span class="fiche-label">Souplesse horaire</span><span class="fiche-val">${bn.souplesse_horaire ? 'Oui' : 'Non'}</span></div>
          </div>
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Prestations requises</div>
          <div class="competences" style="padding:10px 14px">
            ${(bn.competences_requises || []).map(c => `<span class="tag requis">${COMPETENCES[c]?.label || c}</span>`).join('') || '<span class="sous-titre">—</span>'}
          </div>
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Préférences de personnel</div>
          <div class="fiche-grid">
            <div class="fiche-field"><span class="fiche-label">Intervenante favorite</span><div class="fiche-val">${bn.intervenante_favorite ? lienIVIds([bn.intervenante_favorite]) : '<span class="sous-titre">—</span>'}</div></div>
            <div class="fiche-field"><span class="fiche-label">Max intervenantes différentes</span><span class="fiche-val">${bn.max_intervenantes || '—'}</span></div>
            <div class="fiche-field"><span class="fiche-label">Personnel préféré</span><div class="fiche-val">${lienIVIds(bn.personnel_prefere)}</div></div>
            <div class="fiche-field"><span class="fiche-label">Personnel refusé</span><div class="fiche-val">${lienIVIds(bn.personnel_refuse)}</div></div>
          </div>
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Planning semaine (${passagesB.length} passage(s))</div>
          <div class="passes-liste">
            ${passageTri.length ? passageTri.map(p => {
              const iv = intervenantes.find(i => i.id === p.intervenante_id);
              return `<div class="pass-item">
                <span class="pass-dot" style="background:${iv ? iv.couleur : '#aaa'}"></span>
                <strong>${Utils.JOURS_COURT[p.jour]}</strong>
                <span>${p.debut}–${p.fin}</span>
                <span class="lien-iv" onclick="App.voirFicheIntervenante('${p.intervenante_id}');UI.fermerModal('modal-fiche')">${iv ? iv.nom : p.intervenante_id}</span>
              </div>`;
            }).join('') : '<span class="vide" style="padding:0">Aucun passage planifié cette semaine.</span>'}
          </div>
        </div>

        <div class="fiche-section">
          <div class="fiche-section-titre">Continuité & Habitudes</div>
          <div class="fiche-grid">
            <div class="fiche-field"><span class="fiche-label">Intervenantes assignées (semaine)</span><div class="fiche-val">${lienIV(ivAssignees)}</div></div>
            <div class="fiche-field"><span class="fiche-label">Intervenantes habituelles</span><div class="fiche-val">${lienIVIds(bn.intervenantes_habituelles)}</div></div>
          </div>
          ${bn.notes ? `<div class="fiche-full"><span class="fiche-label">Notes</span><div class="fiche-val">${bn.notes}</div></div>` : ''}
        </div>

      </div>`;
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
      // Champs étendus — valeurs par défaut (conservés par app.js lors d'une mise à jour)
      email:         '',
      adresse:       '',
      contrat_type:  'CDI',
      vehicule:      false,
      actif:         true,
      beneficiaires_habituels: [],
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
      // Champs étendus — valeurs par défaut (conservés par app.js lors d'une mise à jour)
      email:                  '',
      intervenante_favorite:  null,
      personnel_prefere:      [],
      personnel_refuse:       [],
      max_intervenantes:      2,
      priorite:               2,
      souplesse_horaire:      false,
      intervenantes_habituelles: [],
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

  // ── Prévisualisation import ───────────────────────────────────────────────

  /**
   * Affiche la modal de prévisualisation avant import.
   * @param {object} opts
   *   - titre    : string
   *   - objets   : tableau d'objets transformés
   *   - erreurs  : tableau de strings (erreurs de validation)
   *   - colonnes : colonnes à afficher dans le tableau
   *   - total    : nb total de lignes dans le fichier
   */
  afficherApercuImport({ titre, objets, erreurs, colonnes, total }) {
    document.getElementById('modal-import-titre').textContent = titre;

    const aErreurs = erreurs && erreurs.length > 0;
    const MAX_ROWS = 10;
    const apercu   = objets.slice(0, MAX_ROWS);

    let html = '';

    // Résumé
    html += '<div class="preview-summary">';
    html += `<span class="preview-badge ok">✔ ${total} enregistrement(s) trouvé(s)</span>`;
    html += `<span class="preview-badge ${aErreurs ? 'warn' : 'ok'}">${aErreurs ? '⚠ ' + erreurs.length + ' avertissement(s)' : '✔ Aucune erreur'}</span>`;
    html += '</div>';

    // Erreurs
    if (aErreurs) {
      html += '<div class="preview-errors"><strong>Avertissements :</strong><ul>';
      erreurs.forEach(e => { html += `<li>${e}</li>`; });
      html += '</ul></div>';
    }

    // Mode d'import (remplacer ou ajouter)
    html += `<div class="import-mode-row">
      <strong>Mode :</strong>
      <label><input type="radio" name="import-mode" value="ajouter" checked /> Ajouter aux données existantes</label>
      <label><input type="radio" name="import-mode" value="remplacer" /> Remplacer toutes les données</label>
    </div>`;

    // Table prévisualisation
    if (apercu.length) {
      html += '<div class="preview-table-wrap"><table class="preview-table"><thead><tr>';
      colonnes.forEach(c => { html += `<th>${c}</th>`; });
      html += '</tr></thead><tbody>';
      apercu.forEach(obj => {
        html += '<tr>';
        colonnes.forEach(c => {
          let val = obj[c];
          if (Array.isArray(val)) val = val.join(', ');
          else if (val && typeof val === 'object') val = JSON.stringify(val).slice(0, 40);
          html += `<td title="${String(val || '').replace(/"/g, '&quot;')}">${val !== undefined && val !== null ? val : '<span style="color:var(--sub)">—</span>'}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      if (total > MAX_ROWS) {
        html += `<div class="preview-more">… et ${total - MAX_ROWS} enregistrement(s) supplémentaire(s) non affichés</div>`;
      }
      html += '</div>';
    } else if (!aErreurs) {
      html += '<p class="vide">Aucun enregistrement valide trouvé.</p>';
    }

    document.getElementById('modal-import-body').innerHTML = html;

    // Désactiver le bouton confirmer si erreurs bloquantes
    document.getElementById('btn-confirmer-import').disabled = objets.length === 0;

    this.ouvrirModal('modal-import');
  },

  /** Lit le mode d'import sélectionné dans la modal */
  lireModeImport() {
    const radio = document.querySelector('input[name="import-mode"]:checked');
    return radio ? radio.value : 'ajouter';
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
