import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ResultsBar from '../components/ResultsBar.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Poll() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const [poll, setPoll] = useState(null)
  const [results, setResults] = useState(null)
  const [alreadyVoted, setAlreadyVoted] = useState(null)
  const [expired, setExpired] = useState(false)

  const secret = search.get('secret')

  const fetchPoll = async () => {
    const res = await fetch(`${API}/polls/${id}`, { credentials: 'include' })
    if (!res.ok) { alert('Poll not found'); return }
    const data = await res.json()
    setPoll(data)
  }

  const fetchResults = async () => {
    const res = await fetch(`${API}/polls/${id}/results`, { credentials: 'include' })
    const data = await res.json()
    setResults(data)
    setAlreadyVoted(data.already_voted_option_id)
    setExpired(data.expired)
  }

  useEffect(() => {
    fetchPoll()
    fetchResults()
    // SSE
    const es = new EventSource(`${API}/polls/${id}/sse`)
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload && payload.poll_id) {
          // refetch results to include insight computation
          fetchResults()
        }
      } catch {}
    }
    es.onerror = () => { /* ignore */ }
    return () => es.close()
  }, [id])

  const vote = async (option_id) => {
    const res = await fetch(`${API}/polls/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option_id, idempotency_key: crypto.randomUUID() }),
      credentials: 'include'
    })
    if (!res.ok) {
      alert('Vote failed')
      return
    }
    const data = await res.json()
    setResults(data)
    setAlreadyVoted(data.already_voted_option_id)
    setExpired(data.expired)
  }

  const total = results?.total_votes || 0
  const canSeeResults = useMemo(() => {
    if (!poll) return false
    if (!poll.hide_until_vote_secret) return true
    // if creator shared secret link, always show
    if (secret && secret === poll.hide_until_vote_secret) return true
    // otherwise, only after voted
    return !!alreadyVoted
  }, [poll, alreadyVoted, secret])

  if (!poll) return <div className="card">Loading...</div>

  return (
    <div className="card">
      <h2>{poll.question}</h2>
      <p className="muted">Expires at: {new Date(poll.expires_at).toLocaleString()}</p>

      {!expired && alreadyVoted == null && (
        <div className="options">
          {poll.options.map(opt => (
            <button key={opt.id} onClick={() => vote(opt.id)}>{opt.text}</button>
          ))}
        </div>
      )}
      {alreadyVoted != null && <p>You’ve already voted.</p>}
      {expired && <p className="muted">Poll expired.</p>}

      {canSeeResults ? (
        <div className="results">
          <h3>Results ({total} votes)</h3>
          {poll.options.map(opt => {
            const o = results?.results?.find(r => r.id === opt.id) || { votes: 0 }
            const pct = total ? Math.round((o.votes / total) * 100) : 0
            return <ResultsBar key={opt.id} label={opt.text} value={pct} votes={o.votes} />
          })}
          {results?.insight && <div className="insight">🧠 {results.insight}</div>}
        </div>
      ) : (
        <div className="muted">Results are hidden until you vote.</div>
      )}
    </div>
  )
}
