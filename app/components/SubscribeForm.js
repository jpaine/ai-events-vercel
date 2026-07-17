'use client'

import { useState } from 'react'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setState('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setState('success')
      setEmail('')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="subscribe-success">
        <span className="subscribe-check">✓</span>
        You&apos;re subscribed — we&apos;ll email you when new events are added.
      </div>
    )
  }

  return (
    <form className="subscribe-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="subscribe-input"
        required
        disabled={state === 'loading'}
      />
      <button type="submit" className="subscribe-btn" disabled={state === 'loading'}>
        {state === 'loading' ? 'Subscribing…' : 'Get notified'}
      </button>
      {state === 'error' && (
        <span className="subscribe-error">Something went wrong — try again.</span>
      )}
      <style jsx>{`
        .subscribe-form {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .subscribe-input {
          background: #161b22;
          border: 1px solid #30363d;
          color: #c9d1d9;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          width: 220px;
          outline: none;
          transition: border-color 0.15s;
        }
        .subscribe-input::placeholder { color: #484f58; }
        .subscribe-input:focus { border-color: #58a6ff; }
        .subscribe-btn {
          background: #21262d;
          color: #c9d1d9;
          border: 1px solid #30363d;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .subscribe-btn:hover:not(:disabled) {
          border-color: #58a6ff;
          color: #f0f6fc;
        }
        .subscribe-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .subscribe-error {
          font-size: 12px;
          color: #f85149;
          width: 100%;
        }
        .subscribe-success {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #3fb950;
        }
        .subscribe-check {
          font-size: 15px;
        }
        :global([data-theme="light"]) .subscribe-input {
          background: #ffffff;
          border-color: #d0d7de;
          color: #24292f;
        }
        :global([data-theme="light"]) .subscribe-input::placeholder { color: #8c959f; }
        :global([data-theme="light"]) .subscribe-input:focus { border-color: #0969da; }
        :global([data-theme="light"]) .subscribe-btn {
          background: #f6f8fa;
          color: #24292f;
          border-color: #d0d7de;
        }
        :global([data-theme="light"]) .subscribe-btn:hover:not(:disabled) {
          border-color: #0969da;
          color: #0969da;
        }
        :global([data-theme="light"]) .subscribe-success { color: #2da44e; }
      `}</style>
    </form>
  )
}
