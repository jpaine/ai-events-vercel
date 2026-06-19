'use client'

import { useState, useMemo, Fragment } from 'react'

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'academic', label: 'Academic' },
  { id: 'industry', label: 'Industry' },
  { id: '2027', label: '2027' },
  { id: 'robotics', label: 'Robotics' },
  { id: 'nlp', label: 'NLP' },
  { id: 'vision', label: 'Vision' },
  { id: 'ml', label: 'ML' },
  { id: 'llm', label: 'LLM / Agents' },
]

function matchesFilter(event, filterId) {
  if (filterId === 'all') return true
  if (filterId === 'academic') return event.section === 'academic'
  if (filterId === 'industry') return event.section === 'industry'
  if (filterId === '2027') return event.section === '2027'
  const cat = event.category.toLowerCase()
  if (filterId === 'robotics') return cat.includes('robotics')
  if (filterId === 'nlp') return cat.includes('nlp')
  if (filterId === 'vision') return cat.includes('computer vision') || cat.includes('signal processing') || cat.includes('medical ai') || cat.includes('computer graphics')
  if (filterId === 'ml') return /\bml\b|deep learning|data mining|machine learning|ml systems/.test(cat)
  if (filterId === 'llm') return cat.includes('llm') || cat.includes('generative ai') || cat.includes('agentic ai') || cat.includes('ai agent')
  return true
}

function getCategoryVariant(category) {
  const cat = category.toLowerCase()
  if (cat.includes('robotics')) return 'robotics'
  if (cat.includes('nlp')) return 'nlp'
  if (cat.includes('computer vision') || cat.includes('signal processing') || cat.includes('medical ai') || cat.includes('computer graphics')) return 'vision'
  if (/\bml\b|deep learning|data mining|machine learning/.test(cat)) return 'ml'
  if (cat.includes('llm') || cat.includes('generative ai') || cat.includes('agentic ai') || cat.includes('ai agent')) return 'llm'
  if (cat.includes('ai engineering')) return 'eng'
  return 'general'
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return '' }
}

function formatDates(dates) {
  const stripped = dates.replace(/,?\s*20\d\d(\s*\(.*?\))?$/, '').trim()
  return stripped || dates
}

function getShortLocation(location) {
  const parts = location.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length <= 2) return parts[parts.length - 1] || location
  const country = parts[parts.length - 1]
  const secondLast = parts[parts.length - 2]
  if (secondLast.length <= 3) {
    const city = parts[parts.length - 3]
    return city ? `${city}, ${country}` : `${secondLast}, ${country}`
  }
  return `${secondLast}, ${country}`
}

export default function EventsTable({ events }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (!matchesFilter(e, filter)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          e.name.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [events, filter, search])

  const sections = useMemo(() => {
    const groupByMonth = (evts) => {
      const map = {}
      for (const e of evts) {
        const k = e.sortMonth
        if (!map[k]) map[k] = []
        map[k].push(e)
      }
      return Object.entries(map)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([month, evts]) => ({ month: Number(month), events: evts }))
    }

    const academic = filtered.filter(e => e.section === 'academic')
    const industry = filtered.filter(e => e.section === 'industry')
    const y2027 = filtered.filter(e => e.section === '2027')

    return [
      { id: 'academic', title: 'Academic & Research', groups: groupByMonth(academic) },
      { id: 'industry', title: 'Industry & Practitioner', groups: groupByMonth(industry) },
      { id: '2027', title: '2027 — Early Announcements', groups: groupByMonth(y2027) },
    ].filter(s => s.groups.length > 0)
  }, [filtered])

  const isPast = (month, sectionId) =>
    sectionId !== '2027' && (currentYear > 2026 || (currentYear === 2026 && month < currentMonth && month !== 99))

  const isCurrent = (month, sectionId) =>
    sectionId !== '2027' && currentYear === 2026 && month === currentMonth

  return (
    <div className="et-root">
      <div className="et-filterbar">
        <div className="et-chips">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`et-chip${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="et-search-wrap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="et-search-icon">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="et-search"
          />
          {search && (
            <button className="et-search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
      </div>

      {(filter !== 'all' || search) && (
        <div className="et-results-meta">
          {filtered.length} of {events.length} events
          {(filter !== 'all' || search) && (
            <button className="et-reset" onClick={() => { setFilter('all'); setSearch('') }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="et-content">
        {sections.map(section => {
          const count = section.groups.reduce((n, g) => n + g.events.length, 0)
          return (
            <div key={section.id} className="et-section">
              <div className="et-section-head">
                <h2 className="et-section-title">{section.title}</h2>
                <span className="et-section-count">{count}</span>
              </div>
              <table className="et-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Dates</th>
                    <th>Location</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {section.groups.map(({ month, events: groupEvents }) => (
                    <Fragment key={month}>
                      <tr className="et-month-row">
                        <td colSpan={4}>
                          <span className={`et-month-label${isCurrent(month, section.id) ? ' current' : ''}${isPast(month, section.id) ? ' past' : ''}`}>
                            {isCurrent(month, section.id) && <span className="et-pulse" />}
                            {month === 99
                              ? 'TBD / TBA'
                              : `${MONTH_NAMES[month] || month} ${section.id === '2027' ? '2027' : '2026'}`}
                            {isCurrent(month, section.id) && ' · Upcoming'}
                          </span>
                        </td>
                      </tr>
                      {groupEvents.map((e, i) => (
                        <tr key={i} className={isPast(e.sortMonth, section.id) ? 'et-row-past' : ''}>
                          <td className="et-cell-name">
                            <div className="et-name">{e.name}</div>
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="et-domain"
                            >
                              {getDomain(e.url)} ↗
                            </a>
                          </td>
                          <td className="et-cell-date">
                            <span className="et-date-badge">{formatDates(e.dates)}</span>
                          </td>
                          <td className="et-cell-loc">
                            <span className="et-loc" title={e.location}>{getShortLocation(e.location)}</span>
                          </td>
                          <td className="et-cell-cat">
                            <span className={`et-cat et-cat-${getCategoryVariant(e.category)}`}>
                              {e.category.split('/')[0].trim()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="et-empty">No events match your search.</div>
        )}
      </div>

      <style jsx>{`
        .et-root {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 40px 80px;
        }

        /* Filter bar */
        .et-filterbar {
          position: sticky;
          top: 57px;
          z-index: 90;
          background: #0d1117;
          border-bottom: 1px solid #21262d;
          padding: 12px 0;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 0 -40px;
          padding-left: 40px;
          padding-right: 40px;
        }

        .et-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          flex: 1;
        }

        .et-chip {
          background: transparent;
          border: 1px solid #30363d;
          color: #8b949e;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          white-space: nowrap;
        }

        .et-chip:hover {
          border-color: #58a6ff;
          color: #c9d1d9;
        }

        .et-chip.active {
          background: rgba(88, 166, 255, 0.15);
          border-color: #58a6ff;
          color: #58a6ff;
          font-weight: 500;
        }

        .et-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .et-search-icon {
          position: absolute;
          left: 10px;
          color: #484f58;
          pointer-events: none;
        }

        .et-search {
          background: #161b22;
          border: 1px solid #30363d;
          color: #c9d1d9;
          padding: 6px 30px 6px 30px;
          border-radius: 6px;
          font-size: 13px;
          width: 200px;
          font-family: inherit;
          transition: border-color 0.15s;
          outline: none;
        }

        .et-search::placeholder { color: #484f58; }
        .et-search:focus { border-color: #58a6ff; }

        .et-search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #484f58;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0;
          font-family: inherit;
        }

        .et-search-clear:hover { color: #8b949e; }

        /* Results meta */
        .et-results-meta {
          padding: 12px 0 0;
          font-size: 12px;
          color: #484f58;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .et-reset {
          background: none;
          border: none;
          color: #58a6ff;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }
        .et-reset:hover { color: #79c0ff; }

        /* Content */
        .et-content { padding-top: 32px; }

        /* Section */
        .et-section { margin-bottom: 56px; }

        .et-section-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .et-section-title {
          font-size: 15px;
          font-weight: 700;
          color: #f0f6fc;
          letter-spacing: -0.3px;
        }

        .et-section-count {
          background: #21262d;
          color: #8b949e;
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 20px;
        }

        /* Table */
        .et-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #21262d;
          border-radius: 6px;
          overflow: hidden;
          font-size: 13px;
        }

        .et-table th {
          background: #0d1117;
          color: #484f58;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 10px 16px;
          text-align: left;
          border-bottom: 1px solid #21262d;
        }

        .et-table td {
          padding: 11px 16px;
          border-bottom: 1px solid #161b22;
          vertical-align: middle;
        }

        .et-table tbody tr:last-child td { border-bottom: none; }

        .et-table tbody tr:hover td { background: rgba(88, 166, 255, 0.03); }

        /* Month rows */
        .et-month-row td {
          background: #0a0d13;
          padding: 7px 16px;
          border-bottom: 1px solid #161b22;
        }

        .et-month-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #484f58;
        }

        .et-month-label.current {
          color: #3fb950;
        }

        .et-month-label.past {
          color: #30363d;
        }

        .et-pulse {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3fb950;
          animation: pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Row states */
        .et-row-past td { opacity: 0.45; }

        /* Cell: name */
        .et-name {
          font-weight: 500;
          color: #e6edf3;
          font-size: 13px;
          margin-bottom: 3px;
        }

        .et-domain {
          font-size: 11px;
          color: #484f58;
          text-decoration: none;
          transition: color 0.15s;
        }
        .et-domain:hover { color: #58a6ff; }

        /* Cell: dates */
        .et-date-badge {
          background: #161b22;
          border: 1px solid #21262d;
          color: #8b949e;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        /* Cell: location */
        .et-loc {
          color: #8b949e;
          font-size: 12px;
        }

        /* Cell: category badges */
        .et-cat {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .et-cat-general {
          background: rgba(88, 166, 255, 0.08);
          border-color: rgba(88, 166, 255, 0.2);
          color: #79c0ff;
        }

        .et-cat-ml {
          background: rgba(63, 185, 80, 0.08);
          border-color: rgba(63, 185, 80, 0.2);
          color: #3fb950;
        }

        .et-cat-robotics {
          background: rgba(210, 153, 34, 0.1);
          border-color: rgba(210, 153, 34, 0.25);
          color: #d09030;
        }

        .et-cat-nlp {
          background: rgba(188, 140, 255, 0.08);
          border-color: rgba(188, 140, 255, 0.2);
          color: #bc8cff;
        }

        .et-cat-vision {
          background: rgba(88, 166, 255, 0.08);
          border-color: rgba(88, 166, 255, 0.2);
          color: #58a6ff;
        }

        .et-cat-llm {
          background: rgba(255, 166, 87, 0.08);
          border-color: rgba(255, 166, 87, 0.2);
          color: #e3a04a;
        }

        .et-cat-eng {
          background: rgba(56, 189, 189, 0.08);
          border-color: rgba(56, 189, 189, 0.2);
          color: #38bdbd;
        }

        /* Empty state */
        .et-empty {
          padding: 64px 0;
          text-align: center;
          color: #484f58;
          font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .et-root {
            padding: 0 16px 60px;
          }

          .et-filterbar {
            margin: 0 -16px;
            padding-left: 16px;
            padding-right: 16px;
            top: 52px;
            gap: 8px;
          }

          .et-search { width: 140px; }

          .et-table th:nth-child(3),
          .et-table td:nth-child(3) { display: none; }

          .et-table th,
          .et-table td { padding: 10px 12px; }
        }
      `}</style>
    </div>
  )
}
