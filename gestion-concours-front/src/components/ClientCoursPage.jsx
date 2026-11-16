import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  fetchStudentActivityCompletionMap,
  getStudentActivityStatusKey,
  recordStudentActivity,
  recordStudentActivityDuration,
  saveStudentMistakesManually,
  setStudentActivityCompleted
} from '../studentProgress';
import { toBackendResourceUrl } from '../backendResourceUrl';
import cardMascot from '../assets/logo-mascot.png';
import './ClientCoursPage.css';
import { demoContentClass, DemoAccessBadge, guardDemoContent, isDemoFree, isDemoMode } from '../demoAccess';

const API = '';

/* ─────────────────────────────────────────────
   CONFIGURATION VISUELLE DES 5 MATIÈRES
   ───────────────────────────────────────────── */
const MATIERES = [
  {
    id: 'Mathématiques',
    nom: 'Mathématiques',
    tag: 'MATH',
    subtitle: '',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    formulas: '∑  f(x)  ≡  ∫dx'
  },
  {
    id: 'Physique',
    nom: 'Physique - Chimie',
    tag: 'PHYSIQUE',
    subtitle: 'Ondes, noyaux, électricité...',
    color: '#4338ca',
    gradient: 'linear-gradient(135deg, #3730a3 0%, #6366f1 100%)',
    formulas: 'Ω ~  U=RI  ⚗️  F=ma'
  },
  {
    id: 'SVT',
    nom: 'Sciences de la Vie et de la Terre',
    tag: 'SVT',
    subtitle: 'Génétique, métabolisme, géologie...',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    formulas: 'ADN  ATP  CO₂  🧬'
  },
  {
    id: 'Philosophie',
    nom: 'Philosophie',
    tag: 'PHILO',
    subtitle: 'Problèmes, plan, arguments...',
    color: '#701a75',
    gradient: 'linear-gradient(135deg, #701a75 0%, #a21caf 100%)',
    formulas: '💡  Logos  ⚖️  Platon'
  },
  {
    id: 'Anglais',
    nom: 'Anglais',
    tag: 'ENGLISH',
    subtitle: 'Grammaire, vocabulaire, expression...',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
    formulas: 'Aa  Hello  💬  Grammar'
  }
];

export const AVAILABLE_FILIERES = [
  'Sciences Mathématiques A',
  'Sciences Mathématiques B',
  'Sciences Physiques (PC)',
  'Sciences de la Vie et de la Terre (SVT)',
  'Sciences Économiques & Gestion'
];

/* ─────────────────────────────────────────────
   HELPERS : matching filière & matière
   ───────────────────────────────────────────── */
const matchFiliere = (itemFiliere, targetFiliere) => {
  if (!targetFiliere) return true;
  if (!itemFiliere) return true;
  const item = itemFiliere.trim().toLowerCase();
  const target = targetFiliere.trim().toLowerCase();
  if (item === target) return true;
  if (item.includes('toutes') || target.includes('toutes')) return true;

  const isSmA = (s) => (s.includes('sm') && s.includes('a')) || s.includes('mathématiques a') || s.includes('maths a');
  const isSmB = (s) => (s.includes('sm') && s.includes('b')) || s.includes('mathématiques b') || s.includes('maths b');
  const isPc = (s) => s.includes('pc') || s.includes('physique');
  const isSvt = (s) => s.includes('svt') || s.includes('vie') || s.includes('terre');
  const isEco = (s) => s.includes('eco') || s.includes('économie') || s.includes('gestion');

  if (isSmA(target) && isSmA(item)) return true;
  if (isSmB(target) && isSmB(item)) return true;
  if (isPc(target) && isPc(item)) return true;
  if (isSvt(target) && isSvt(item)) return true;
  if (isEco(target) && isEco(item)) return true;

  return item.includes(target) || target.includes(item);
};

const matchMatiere = (value, configId) => {
  if (!value || !configId) return false;
  const v = value.toLowerCase().trim();
  const c = configId.toLowerCase().trim();
  if (c.includes('math')) return v.includes('math');
  if (c.includes('phys')) return v.includes('phys') || v.includes('chimie') || v === 'pc';
  if (c.includes('svt')) return v.includes('svt') || v.includes('vie') || v.includes('terre');
  if (c.includes('philo')) return v.includes('philo');
  if (c.includes('ang') || c.includes('eng')) return v.includes('ang') || v.includes('eng');
  return v.includes(c) || c.includes(v);
};

/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL
   ───────────────────────────────────────────── */
export default function ClientCoursPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filiereFromUrl = searchParams.get('filiere') || '';

  const [selectedFiliere, setSelectedFiliere] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return filiereFromUrl || user.filiere || 'Sciences Mathématiques A';
    } catch {
      return filiereFromUrl || 'Sciences Mathématiques A';
    }
  });

  // Navigation : 'matieres' = grille de cartes, 'reader' = lecture d'un cours HTML
  const [step, setStep] = useState('matieres');
  const [filterPill, setFilterPill] = useState('Toutes');

  // Reader state
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [selectedChapitre, setSelectedChapitre] = useState(null);
  const [activeCours, setActiveCours] = useState(null);
  const [isCoursMenuOpen, setIsCoursMenuOpen] = useState(false);

  // Données en base
  const [coursBacList, setCoursBacList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionStatuses, setCompletionStatuses] = useState({});
  const [completingActivityKey, setCompletingActivityKey] = useState('');
  const [completionErrorKey, setCompletionErrorKey] = useState('');

  // Iframe states
  const [iframeLoading, setIframeLoading] = useState(true);
  const iframeRef = useRef(null);
  const [courseHtml, setCourseHtml] = useState('');
  const [courseFrameHeight, setCourseFrameHeight] = useState(800);

  const activeCourseStatusKey = activeCours?.id && activeCours.id !== 'placeholder'
    ? getStudentActivityStatusKey('Cours', activeCours.id)
    : '';
  const activeCourseCompleted = completionStatuses[activeCourseStatusKey] === true;

  /* ── Fetch des cours depuis la table cours_bac ── */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/api/cours-bac`);
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data?.value || data?.cours || (data ? [data] : []));
        setCoursBacList(list);
      } catch (err) {
        if (!isMounted) return;
        console.error('Erreur chargement cours_bac:', err);
        setError("Impossible de charger les cours du bac.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  /* ── Completion statuses ── */
  useEffect(() => {
    let isMounted = true;
    fetchStudentActivityCompletionMap()
      .then((statuses) => { if (isMounted) setCompletionStatuses(statuses); })
      .catch(() => { });
    return () => { isMounted = false; };
  }, []);

  /* ── Filière URL sync ── */
  useEffect(() => {
    const f = searchParams.get('filiere');
    if (f) setSelectedFiliere(f);
  }, [searchParams]);

  /* ── Durée d'apprentissage ── */
  useEffect(() => {
    if (!activeCours?.id || activeCours.id === 'placeholder' || !activeCours.htmlUrl || step !== 'reader') return undefined;
    const activityId = `Cours:${activeCours.id}`;
    let visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
    const flushVisibleTime = () => {
      if (visibleSince === null) return;
      const now = Date.now();
      const elapsed = Math.floor((now - visibleSince) / 1000);
      if (elapsed > 0) recordStudentActivityDuration(activityId, elapsed, new Date(now));
      visibleSince = now;
    };
    const handleVis = () => {
      if (document.visibilityState === 'hidden') { flushVisibleTime(); visibleSince = null; }
      else if (visibleSince === null) { visibleSince = Date.now(); }
    };
    const interval = window.setInterval(flushVisibleTime, 15000);
    document.addEventListener('visibilitychange', handleVis);
    return () => { flushVisibleTime(); window.clearInterval(interval); document.removeEventListener('visibilitychange', handleVis); };
  }, [activeCours?.id, activeCours?.htmlUrl, step]);

  /* ── Helpers d'URL ── */
  const getFullUrl = (url) => {
    if (!url) return '';
    const n = toBackendResourceUrl(url);
    if (n.startsWith('http://') || n.startsWith('https://')) return n;
    return `/${n.startsWith('/') ? n.substring(1) : n}`;
  };

  /* ── Chargement HTML du cours actif ── */
  useEffect(() => {
    if (!activeCours?.htmlUrl) { setCourseHtml(''); setCourseFrameHeight(800); return undefined; }
    let cancelled = false;
    setIframeLoading(true);
    axios.get(getFullUrl(activeCours.htmlUrl), { responseType: 'text' })
      .then(({ data }) => {
        if (cancelled) return;
        const base = `<base href="${getFullUrl(activeCours.htmlUrl)}">`;
        const resizeScript = `<script>(function(){var send=function(){var d=document.documentElement,b=document.body;parent.postMessage({type:'course-html-height',height:Math.max(d?d.scrollHeight:0,b?b.scrollHeight:0,d?d.offsetHeight:0,b?b.offsetHeight:0)},'*')};window.addEventListener('load',send);window.addEventListener('resize',send);new ResizeObserver(send).observe(document.documentElement);if(document.body)new ResizeObserver(send).observe(document.body);setInterval(send,700);send()})()<\/script>`;
        const mistakeScript = `<script>(function(){var cn='econcourse-save-course-mistake';var pending=new Map();var textOf=function(n){return String(n&&n.innerText||'').replace(/ +/g,' ').trim().slice(0,5000)};var scan=function(){document.querySelectorAll('.corr.ko').forEach(function(card){if(card.querySelector('.'+cn))return;var btn=document.createElement('button');btn.type='button';btn.className=cn;btn.textContent='Sauvegarder cette erreur';btn.style.cssText='margin-top:10px;padding:6px 12px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;color:#1d4ed8;font:700 12px inherit;cursor:pointer;';btn.addEventListener('click',function(){var head=card.querySelector('.qhead');var qtext=card.querySelector('.qtext,.question-text,.statement,.enonce');var wrong=card.querySelector('.copt.bad,.copt.wrong,.wrong-answer');var good=card.querySelector('.copt.good,.copt.correct,.correct-answer');var note=card.querySelector('.note');var expl=card.querySelector('.expl,.explanation,.correction-explanation');var root=card.closest('[data-question-id],.question,.qblock,.exercise-question')||card.parentElement||card;var question=root.querySelector('.qtext,.question-text,.statement,.enonce')||qtext;var numText=(textOf(head).match(/[0-9]+/)||[])[0];var rId=Date.now().toString(36)+Math.random().toString(36).slice(2,8);var srcType=card.closest('[data-exercise],.exercise,.exercice')?'Exercice':'Cours';var selLabel=wrong&&(wrong.getAttribute('data-choice-label')||wrong.getAttribute('data-label')||textOf(wrong.querySelector('.k')))||'';var corLabel=good&&(good.getAttribute('data-choice-label')||good.getAttribute('data-label')||textOf(good.querySelector('.k')))||'';btn.disabled=true;btn.textContent='Enregistrement…';pending.set(rId,btn);parent.postMessage({type:'econcourse-save-course-mistake',requestId:rId,sourceType:srcType,mistake:{questionId:(card.getAttribute('data-question-id')||numText||textOf(question)),questionNumber:numText?Number(numText):null,questionText:textOf(question)||textOf(head),selectedChoiceLabel:selLabel,selectedChoiceText:textOf(wrong&&wrong.querySelector('.v'))||textOf(wrong)||textOf(note),correctChoiceLabel:corLabel,correctChoiceText:textOf(good&&good.querySelector('.v'))||textOf(good),explanation:textOf(expl)}},'*');});card.appendChild(btn);})};window.addEventListener('message',function(e){var d=e.data||{};if(d.type!=='econcourse-course-save-ack')return;var b=pending.get(d.requestId);if(!b)return;pending.delete(d.requestId);b.textContent=d.success?'Erreur sauvegardée':(d.message||'Réessayer');b.disabled=!!d.success;});var start=function(){scan();if(document.body)new MutationObserver(scan).observe(document.body,{childList:true,subtree:true})};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})()</script>`;
        let html = String(data || '');
        if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
        else html = `${base}${html}`;
        if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${resizeScript}</body>`);
        else html += resizeScript;
        const bc = html.toLowerCase().lastIndexOf('</body>');
        if (bc >= 0) html = `${html.slice(0, bc)}${mistakeScript}${html.slice(bc)}`;
        else html += mistakeScript;
        setCourseHtml(html);
      })
      .catch(() => { if (!cancelled) setCourseHtml(''); })
      .finally(() => { if (!cancelled) setIframeLoading(false); });
    return () => { cancelled = true; };
  }, [activeCours?.htmlUrl]);

  /* ── Iframe message handler ── */
  useEffect(() => {
    const handler = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'course-html-height') {
        const h = Number(event.data.height);
        if (Number.isFinite(h) && h > 0) setCourseFrameHeight(Math.min(Math.max(h, 320), 100000));
        return;
      }
      if (event.data?.type !== 'econcourse-save-course-mistake' || !event.data?.mistake || !activeCours?.id) return;
      const sourceType = event.data.sourceType === 'Exercice' || /exercice/i.test(`${activeCours.titre || ''} ${activeCours.type || ''}`) ? 'Exercice' : 'Cours';
      saveStudentMistakesManually({
        sourceType,
        resourceId: String(activeCours.id),
        resourceTitle: activeCours.titre || selectedChapitre || 'Cours',
        subject: activeCours.matiere || selectedMatiere?.nom || '',
        chapter: activeCours.chapitre || selectedChapitre || '',
        year: activeCours.annee || activeCours.year || null,
        mistakes: [{ ...event.data.mistake, sourceType }]
      }).then(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'econcourse-course-save-ack', requestId: event.data.requestId, success: true }, '*');
      }).catch((err) => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'econcourse-course-save-ack', requestId: event.data.requestId, success: false, message: err.message || 'Sauvegarde impossible' }, '*');
      });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [activeCours, selectedChapitre, selectedMatiere]);

  /* ── Complétion d'un cours ── */
  const handleCompleteCourse = async (event, course) => {
    event?.stopPropagation();
    if (!course?.id) return;
    const statusKey = getStudentActivityStatusKey('Cours', course.id);
    if (completionStatuses[statusKey] === true || completingActivityKey === statusKey) return;
    setCompletingActivityKey(statusKey);
    setCompletionErrorKey('');
    try {
      const saved = await setStudentActivityCompleted(`Cours:${course.id}`, true);
      if (!saved) throw new Error('Impossible d\'enregistrer.');
      setCompletionStatuses((cur) => ({ ...cur, [statusKey]: true }));
    } catch (err) {
      console.error('Erreur complétion:', err);
      setCompletionErrorKey(statusKey);
    } finally {
      setCompletingActivityKey('');
    }
  };

  /* ── Filtrage ── */
  const coursForCurrentFiliere = useMemo(() => {
    return selectedFiliere
      ? coursBacList.filter(c => matchFiliere(c.filiere, selectedFiliere))
      : coursBacList;
  }, [coursBacList, selectedFiliere]);

  const coursForMatiere = (mat) => coursForCurrentFiliere.filter(c => matchMatiere(c.matiere, mat.id));

  const coursForChapitre = (mat, chapNom) => {
    return coursForCurrentFiliere.filter(c => {
      if (!matchMatiere(c.matiere, mat.id)) return false;
      const ch = (c.chapitre || '').trim();
      if (chapNom === 'Général') return !ch;
      return ch.toLowerCase() === chapNom.toLowerCase();
    });
  };

  /*
   * Construire les chapitres DYNAMIQUEMENT depuis les cours en base.
   * Aucun chapitre statique : seuls les chapitres ayant au moins un cours
   * ajouté par l'admin apparaissent.
   */
  const chapitresForMatiere = (mat) => {
    const dbCours = coursForMatiere(mat);
    if (dbCours.length === 0) return [];

    const map = new Map();

    dbCours.forEach(c => {
      const ch = (c.chapitre || '').trim();
      const key = ch ? ch.toLowerCase() : 'général';
      const label = ch || 'Général';
      if (!map.has(key)) {
        map.set(key, { nom: label, cours: [] });
      }
      map.get(key).cours.push(c);
    });

    return Array.from(map.values()).map(entry => ({
      nom: entry.nom,
      count: entry.cours.length,
      cours: entry.cours
    }));
  };

  /* ── Statut dynamique d'une carte (basé sur les données réelles) ── */
  const getChapterCardData = (chapitre) => {
    const courses = chapitre.cours || [];
    if (courses.length === 0) {
      return { statusLabel: 'Nouveau', statusClass: 'status-new', pct: 0, pctLabel: '0%', btnLabel: 'Commencer', btnClass: 'btn-primary', isCompleted: false };
    }

    const completedCount = courses.filter(c => {
      const key = getStudentActivityStatusKey('Cours', c.id);
      return completionStatuses[key] === true;
    }).length;

    if (completedCount === courses.length) {
      return { statusLabel: 'Terminé', statusClass: 'status-completed', pct: 100, pctLabel: '100%', btnLabel: '✓ Terminé', btnClass: 'btn-completed', isCompleted: true };
    }

    if (completedCount > 0) {
      const pct = Math.round((completedCount / courses.length) * 100);
      return { statusLabel: 'En cours', statusClass: 'status-in-progress', pct, pctLabel: `${pct}%`, btnLabel: 'Continuer', btnClass: 'btn-primary', isCompleted: false };
    }

    return { statusLabel: 'Nouveau', statusClass: 'status-new', pct: 0, pctLabel: '0%', btnLabel: 'Commencer', btnClass: 'btn-primary', isCompleted: false };
  };

  /* ── Ouverture du lecteur de cours ── */
  const openReader = (matiere, chapNom, specificCours = null) => {
    setSelectedMatiere(matiere);
    setSelectedChapitre(chapNom);
    setIsCoursMenuOpen(false);
    const list = coursForChapitre(matiere, chapNom);
    const target = specificCours || (isDemoMode() ? list.find(isDemoFree) : null) || (list.length > 0 ? list[0] : null);

    if (isDemoMode() && target && !isDemoFree(target)) {
      window.dispatchEvent(new CustomEvent('econcours-demo-paywall'));
      return;
    }

    if (target) {
      setActiveCours(target);
      setStep('reader');
      recordStudentActivity({
        type: 'Cours', resourceId: target.id,
        title: target.titre || `Cours — ${chapNom}`,
        subject: target.matiere || matiere.nom,
        chapter: target.chapitre || chapNom
      });
    } else {
      setActiveCours({ id: 'placeholder', titre: `Cours — ${chapNom}`, matiere: matiere.nom, chapitre: chapNom, htmlUrl: null });
      setStep('reader');
    }
    setIframeLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Pilules de filtrage ── */
  const handleFilterPillClick = (label) => {
    setFilterPill(label);
  };

  /* ── Matières filtrées selon la pilule sélectionnée ── */
  const displayedMatieres = useMemo(() => {
    if (filterPill === 'Toutes') return MATIERES;
    return MATIERES.filter(m => {
      const p = filterPill.toLowerCase();
      const n = m.nom.toLowerCase();
      return n.includes(p) || p.includes(n);
    });
  }, [filterPill]);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="client-cours-container">

      {/* ══════════════════════════════════════
          VUE MATIÈRES : cartes directes, sans cadre
          ══════════════════════════════════════ */}
      {step === 'matieres' && (
        <>
          {/* Pilules de filtrage */}
          <div className="client-cours-pills-row" role="tablist" aria-label="Filtre des matières">
            {['Toutes', 'Mathématiques', 'Physique - Chimie', 'Sciences de la Vie et de la Terre', 'Philosophie', 'Anglais'].map((pillLabel) => (
              <button
                key={pillLabel}
                type="button"
                className={`client-cours-pill ${filterPill === pillLabel ? 'is-active' : ''}`}
                onClick={() => handleFilterPillClick(pillLabel)}
                role="tab"
                aria-selected={filterPill === pillLabel}
              >
                {pillLabel}
              </button>
            ))}
          </div>

          {/* Contenu principal */}
          {loading ? (
            <div className="client-cours-empty-state">Chargement des matières et de vos cours...</div>
          ) : error ? (
            <div className="client-cours-empty-state" style={{ color: '#dc2626' }}>{error}</div>
          ) : (
            <>
              {displayedMatieres.map((matiere) => {
                const chapitres = chapitresForMatiere(matiere);
                // Si aucun cours n'a été ajouté par l'admin pour cette matière, ne pas l'afficher
                if (chapitres.length === 0) return null;

                return (
                  <div key={matiere.id}>
                    {/* Titre de la matière — pas de cadre, juste un titre */}
                    <div className="client-cours-matiere-heading">
                      <div className="client-cours-matiere-indicator" style={{ backgroundColor: matiere.color }} />
                      <h2 className="client-cours-matiere-title">{matiere.tag === 'MATH' ? 'Math' : matiere.nom}</h2>
                    </div>
                    <p className="client-cours-matiere-subtitle">{matiere.subtitle}</p>

                    {/* Grille de cartes directement dans la page */}
                    <div className="client-cours-cards-grid">
                      {chapitres.map((chapitre) => {
                        const cardData = getChapterCardData(chapitre);
                        const chapterCourses = coursForChapitre(matiere, chapitre.nom);
                        const accessItem = chapterCourses.find(isDemoFree) || chapterCourses[0];

                        return (
                          <article key={chapitre.nom} className={`client-chapter-card ${demoContentClass(accessItem)}`}>
                            <DemoAccessBadge item={accessItem} />
                            {/* Bannière de matière avec formules et mascotte officielle */}
                            <div className="client-card-banner" style={{ background: matiere.gradient }}>
                              <div className="client-banner-formulas">{matiere.formulas}</div>
                              <div className="client-banner-middle">
                                <h3 className="client-banner-title">{matiere.tag}</h3>
                              </div>
                              {/* Mascotte bleue officielle, intégrée dans la bannière */}
                              <div className="client-banner-mascot-wrap">
                                <img src={cardMascot} alt="" aria-hidden="true" />
                              </div>
                            </div>

                            {/* Corps de la carte */}
                            <div className="client-card-body">
                              <h4 className="client-card-chapitre-title" title={chapitre.nom}>
                                {chapitre.nom}
                              </h4>

                              <div className="client-card-progress-track">
                                <div
                                  className={`client-card-progress-fill ${cardData.isCompleted ? 'fill-completed' : ''}`}
                                  style={{ width: `${cardData.pct}%` }}
                                />
                              </div>

                              <div className="client-card-progress-row">
                                <span className={`client-card-status-text ${cardData.statusClass}`}>
                                  {cardData.statusLabel}
                                </span>
                                <span className="client-card-pct-text">{cardData.pctLabel}</span>
                              </div>

                              <button
                                type="button"
                                className={`client-card-action-btn ${cardData.btnClass}`}
                                onClick={guardDemoContent(accessItem, () => openReader(matiere, chapitre.nom))}
                                aria-label={`${cardData.btnLabel} — ${chapitre.nom}`}
                              >
                                {cardData.btnLabel}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Si aucune matière n'a de cours */}
              {displayedMatieres.every(m => chapitresForMatiere(m).length === 0) && (
                <div className="client-cours-empty-state">
                  <div style={{ fontSize: '42px', marginBottom: '12px' }}>📚</div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                    Aucun cours disponible pour le moment
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)', fontSize: '14px' }}>
                    Les cours seront ajoutés prochainement par l'administration.
                  </p>
                </div>
              )}

            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          VUE LECTEUR DU COURS HTML
          ══════════════════════════════════════ */}
      {step === 'reader' && activeCours && selectedMatiere && (
        <div className="client-cours-reader-wrap">
          <div className="client-cours-reader-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="client-reader-back-btn"
                onClick={() => { setStep('matieres'); setActiveCours(null); setSelectedChapitre(null); }}
              >
                ← Retour aux cours
              </button>
              <div className="client-reader-top-info">
                {String(activeCours.titre || selectedChapitre || '').trim().toUpperCase() !== selectedMatiere.tag && (
                  <h2 className="client-reader-title">{activeCours.titre || selectedChapitre}</h2>
                )}
              </div>
            </div>

            <div className="client-reader-top-actions">
              {coursForChapitre(selectedMatiere, selectedChapitre).length > 1 && (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    aria-label="Changer de cours"
                    aria-haspopup="menu"
                    aria-expanded={isCoursMenuOpen}
                    onClick={() => setIsCoursMenuOpen(o => !o)}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--surface, #ffffff)', color: 'var(--text, #334155)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Autres cours</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  {isCoursMenuOpen && (
                    <div role="menu" style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', right: 0, minWidth: '220px', padding: '6px', background: 'var(--surface, #ffffff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(15,23,42,0.14)' }}>
                      {coursForChapitre(selectedMatiere, selectedChapitre).map((cours, i) => (
                        <button
                          key={cours.id || i}
                          type="button"
                          role="menuitem"
                          onClick={guardDemoContent(cours, () => { setIsCoursMenuOpen(false); setActiveCours(cours); })}
                          style={{ width: '100%', display: 'block', padding: '9px 12px', border: 0, borderRadius: '8px', background: String(activeCours.id) === String(cours.id) ? '#eff6ff' : 'transparent', color: String(activeCours.id) === String(cours.id) ? '#1d4ed8' : 'var(--text, #334155)', cursor: 'pointer', textAlign: 'left', fontSize: '12.5px', fontWeight: 700 }}
                        >
                          {cours.titre || `Cours #${i + 1}`}{isDemoMode() && !isDemoFree(cours) ? ' 🔒' : ''}{isDemoMode() && isDemoFree(cours) ? ' · Gratuit' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeCours.id !== 'placeholder' && (
                <button
                  type="button"
                  disabled={activeCourseCompleted || completingActivityKey === activeCourseStatusKey}
                  onClick={(e) => handleCompleteCourse(e, activeCours)}
                  className={`client-reader-complete-btn ${activeCourseCompleted ? 'is-completed' : ''}`}
                >
                  {activeCourseCompleted ? '✓ Terminé' : completingActivityKey === activeCourseStatusKey ? 'Enregistrement…' : 'Terminer'}
                </button>
              )}
            </div>
          </div>

          {completionErrorKey === activeCourseStatusKey && (
            <div style={{ color: '#b91c1c', fontSize: '12px', marginBottom: '10px', textAlign: 'right' }}>
              Enregistrement impossible. Veuillez réessayer.
            </div>
          )}

          <div className="client-reader-frame-container">
            {activeCours.htmlUrl ? (
              <iframe
                ref={iframeRef}
                key={activeCours.id || activeCours.htmlUrl}
                srcDoc={courseHtml}
                title={activeCours.titre || selectedChapitre}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                scrolling="no"
                style={{ width: '100%', height: `${courseFrameHeight}px`, border: 'none', display: 'block', background: 'transparent', overflow: 'hidden' }}
              />
            ) : (
              <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px' }}>📄</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                  Contenu en cours de préparation
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)', fontSize: '14px', maxWidth: '420px' }}>
                  L'administrateur prépare actuellement la fiche pédagogique pour ce chapitre.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
