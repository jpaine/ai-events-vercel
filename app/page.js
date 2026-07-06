import { readFileSync } from 'fs'
import NavBar from './components/NavBar'
import EventsTable from './components/EventsTable'
import SubscribeForm from './components/SubscribeForm'

const MONTHS = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 }

function parseSortKey(dates) {
  const s = dates.toLowerCase().replace(/[–—]/g, '-')
  if (/tbd|tba/.test(s)) return { sortMonth: 99, sortDay: 1 }
  const m = s.match(/([a-z]{3})\s+(\d+)/)
  if (m) return { sortMonth: MONTHS[m[1]] || 99, sortDay: parseInt(m[2]) || 1 }
  const mo = s.match(/([a-z]{3})\s+\d{4}/)
  if (mo) return { sortMonth: MONTHS[mo[1]] || 99, sortDay: 1 }
  return { sortMonth: 99, sortDay: 1 }
}

function parseMarkdown(markdown) {
  const lines = markdown.split('\n')
  const events = []
  let section = null
  let lastUpdated = ''

  for (const line of lines) {
    if (line.includes('Last updated:')) {
      const m = line.match(/\d{4}-\d{2}-\d{2}/)
      if (m) lastUpdated = m[0]
    }
    if (line.includes('Academic & Research')) { section = 'academic'; continue }
    if (line.includes('Industry & Practitioner')) { section = 'industry'; continue }
    if (line.includes('2027 Conferences')) { section = '2027'; continue }
    if (line.includes('Change Log')) break

    if (!section || !line.trim().startsWith('|')) continue
    if (line.includes('|-') || line.includes('| Event |')) continue

    const cells = line.split('|').slice(1, -1).map(c => c.trim())
    if (cells.length < 5) continue
    const [name, dates, location, category, url] = cells
    if (!name || name === 'Event') continue

    events.push({ name, dates, location, category, url, section, ...parseSortKey(dates) })
  }

  events.sort((a, b) => a.sortMonth - b.sortMonth || a.sortDay - b.sortDay)
  return { events, lastUpdated }
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

export default function Home() {
  const markdown = readFileSync(process.cwd() + '/public/ai-events-2026.md', 'utf-8')
  const { events, lastUpdated } = parseMarkdown(markdown)

  const events2026 = events.filter(e => e.section !== '2027')
  const academicCount = events.filter(e => e.section === 'academic').length
  const industryCount = events.filter(e => e.section === 'industry').length
  const countries = new Set(
    events2026
      .map(e => e.location.split(',').pop().trim())
      .filter(c => !/tbd|tba/i.test(c))
  )

  const icsUrl = 'https://ai-events-vercel.vercel.app/ai-events-2026.ics'
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(icsUrl.replace(/^https/, 'webcal'))}`

  return (
    <>
      <NavBar
        lastUpdated={lastUpdated}
        googleCalendarUrl={googleCalendarUrl}
        icsUrl={icsUrl}
      />
      <main>
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-eyebrow">
              <span className="hero-pulse" />
              Updated daily
            </div>
            <h1 className="hero-title">
              AI, ML &amp; Robotics<br />
              <span className="hero-accent">Conferences 2026</span>
            </h1>
            <p className="hero-desc">
              {events2026.length} curated events — academic research and industry practice.
              Automatically refreshed every day.
            </p>
            <div className="hero-ctas">
              <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="cta-primary">
                Add to Google Calendar
              </a>
              <a href={icsUrl} className="cta-outline">
                Download ICS
              </a>
            </div>
            <div className="hero-subscribe">
              <div className="hero-subscribe-label">Get emailed when new events are added</div>
              <SubscribeForm />
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="stat-num">{events2026.length}</div>
                <div className="stat-lbl">2026 events</div>
              </div>
              <div className="stat-div" />
              <div className="hero-stat">
                <div className="stat-num">{academicCount}</div>
                <div className="stat-lbl">Academic</div>
              </div>
              <div className="stat-div" />
              <div className="hero-stat">
                <div className="stat-num">{industryCount}</div>
                <div className="stat-lbl">Industry</div>
              </div>
              <div className="stat-div" />
              <div className="hero-stat">
                <div className="stat-num">{countries.size}</div>
                <div className="stat-lbl">Countries</div>
              </div>
            </div>
          </div>
        </section>
        <EventsTable events={events} />
      </main>
    </>
  )
}
