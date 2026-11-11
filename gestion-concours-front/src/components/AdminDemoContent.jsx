import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './AdminDemoContent.css'

const CONTENT_TYPES = [
  { id: 'cours-bac', label: 'Cours', endpoint: '/api/cours-bac', group: (item) => item.matiere },
  { id: 'resumes', label: 'Résumés', endpoint: '/api/resumes', group: (item) => item.matiere },
  { id: 'examens-nationaux', label: 'Examens', endpoint: '/api/examens-nationaux', group: (item) => item.ecole || item.optionBac || item.matiere },
  { id: 'concours', label: 'Concours', endpoint: '/api/concours', group: (item) => item.ecole },
  { id: 'concours-blancs', label: 'Concours blancs', endpoint: '/api/concours-blancs', group: (item) => item.matiere },
]

export default function AdminDemoContent() {
  const navigate = useNavigate()
  const [typeId, setTypeId] = useState(CONTENT_TYPES[0].id)
  const [itemsByType, setItemsByType] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const currentType = CONTENT_TYPES.find((type) => type.id === typeId) || CONTENT_TYPES[0]

  const loadContent = useCallback(async () => {
    setLoading(true)
    setError('')
    const responses = await Promise.allSettled(CONTENT_TYPES.map((type) => axios.get(type.endpoint)))
    const next = {}
    responses.forEach((result, index) => {
      if (result.status === 'fulfilled') next[CONTENT_TYPES[index].id] = Array.isArray(result.value.data) ? result.value.data : []
      else next[CONTENT_TYPES[index].id] = []
    })
    setItemsByType(next)
    if (responses.every((result) => result.status === 'rejected')) setError('Impossible de charger les contenus. Vérifiez votre session administrateur.')
    setLoading(false)
  }, [])

  useEffect(() => { loadContent() }, [loadContent])

  const groupedItems = useMemo(() => {
    const items = itemsByType[typeId] || []
    return [...items].sort((a, b) => String(currentType.group(a) || '').localeCompare(String(currentType.group(b) || ''), 'fr'))
  }, [itemsByType, typeId, currentType])

  const toggleFree = async (item) => {
    setBusyId(item.id)
    setError('')
    setNotice('')
    try {
      await axios.patch(`/api/admin/demo-content/${typeId}/${item.id}/free`, { isFree: !(item.isFree === true || item.is_free === true) })
      setNotice('Accès démo mis à jour.')
      await loadContent()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'La mise à jour a échoué. Vérifiez votre session administrateur.')
    } finally {
      setBusyId(null)
    }
  }

  return <main className="admin-demo-page">
    <header className="admin-demo-header">
      <div>
        <p className="admin-demo-eyebrow">Administration</p>
        <h1>Accès gratuit en démo</h1>
        <p>Choisissez un seul contenu gratuit par matière ou par école. Le contenu reste visible dans la démo, mais son accès est verrouillé.</p>
      </div>
      <button type="button" className="admin-demo-back" onClick={() => navigate('/admin-dashboard')}>← Tableau de bord</button>
    </header>

    <section className="admin-demo-panel">
      <label htmlFor="admin-demo-type">Type de contenu</label>
      <select id="admin-demo-type" value={typeId} onChange={(event) => setTypeId(event.target.value)}>
        {CONTENT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
      </select>
      {typeId === 'examens-nationaux' && <p className="admin-demo-hint">Pour les anciens examens sans école renseignée, le groupe repose sur l’option du bac.</p>}
      {error && <p className="admin-demo-message is-error" role="alert">{error}</p>}
      {notice && <p className="admin-demo-message is-success" role="status">{notice}</p>}

      {loading ? <p className="admin-demo-empty">Chargement des contenus…</p> : groupedItems.length === 0 ? <p className="admin-demo-empty">Aucun contenu disponible pour ce type.</p> : <div className="admin-demo-list">
        {groupedItems.map((item) => {
          const isFree = item.isFree === true || item.is_free === true
          return <article key={item.id} className="admin-demo-item">
            <div className="admin-demo-item-copy">
              <strong>{item.titre || item.title || `${currentType.label} #${item.id}`}</strong>
              <span>{currentType.group(item) || 'Sans groupe'}{item.chapitre ? ` · ${item.chapitre}` : ''}{item.annee ? ` · ${item.annee}` : ''}</span>
            </div>
            <button type="button" className={`admin-demo-toggle ${isFree ? 'is-free' : ''}`} onClick={() => toggleFree(item)} disabled={busyId === item.id}>
              {busyId === item.id ? 'Mise à jour…' : isFree ? '✓ Gratuit en démo' : 'Rendre gratuit'}
            </button>
          </article>
        })}
      </div>}
    </section>
  </main>
}
