#!/usr/bin/env node

/**
 * Generate ICS (iCalendar) file from markdown event data
 * Usage: node scripts/generate-ics.js
 */

const fs = require('fs')
const path = require('path')

// Parse markdown and extract events
function parseMarkdown(content) {
  const events = []

  // Split by table sections
  const lines = content.split('\n')
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Check for section headers
    if (line.startsWith('## ')) {
      inTable = false
      continue
    }

    // Skip headers and separators
    if (line.startsWith('|') && (line.includes('---') || line.includes('Event') || line.includes('-|-'))) {
      inTable = true
      continue
    }

    // Parse table rows
    if (inTable && line.startsWith('|') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p)

      // Format: Event | Dates | Location | Category | URL
      if (parts.length >= 5) {
        const event = {
          title: parts[0].replace(/^[⭐*]+\s*NEW\s*/i, '').trim(),
          dates: parts[1],
          location: parts[2],
          category: parts[3],
          url: parts[4]
        }

        // Parse dates
        const dateRange = parseDateRange(event.dates)
        if (dateRange) {
          event.startDate = dateRange.start
          event.endDate = dateRange.end
          events.push(event)
        }
      }
    }
  }

  return events
}

// Parse date strings like "Jan 20-27", "Jun 1-5, 2026", "Jul 2026", "Nov-Dec 2026"
function parseDateRange(dateStr) {
  if (!dateStr || /tbd|tba/i.test(dateStr)) return null

  const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  }
  const lastDay = { '01':31,'02':28,'03':31,'04':30,'05':31,'06':30,'07':31,'08':31,'09':30,'10':31,'11':30,'12':31 }

  let year = '2026'
  const yearMatch = dateStr.match(/(\d{4})/)
  if (yearMatch) year = yearMatch[1]

  // Cross-month range with no days: "Nov-Dec 2026", "Sep-Oct 2026"
  const monthRange = dateStr.match(/([A-Za-z]{3})-([A-Za-z]{3})/)
  if (monthRange && monthMap[monthRange[1]] && monthMap[monthRange[2]]) {
    const sm = monthMap[monthRange[1]]
    const em = monthMap[monthRange[2]]
    return { start: `${year}${sm}01`, end: `${year}${em}${lastDay[em]}` }
  }

  // Same-month day range: "Jan 20-27"
  const sameDayRange = dateStr.match(/([A-Za-z]{3})\s+(\d{1,2})-(\d{1,2})/)
  if (sameDayRange && monthMap[sameDayRange[1]]) {
    const m = monthMap[sameDayRange[1]]
    return {
      start: `${year}${m}${sameDayRange[2].padStart(2, '0')}`,
      end: `${year}${m}${sameDayRange[3].padStart(2, '0')}`
    }
  }

  // Cross-month day range: "Sep 27-Oct 1"
  const crossDayRange = dateStr.match(/([A-Za-z]{3})\s+(\d{1,2})-([A-Za-z]{3})\s+(\d{1,2})/)
  if (crossDayRange && monthMap[crossDayRange[1]] && monthMap[crossDayRange[3]]) {
    return {
      start: `${year}${monthMap[crossDayRange[1]]}${crossDayRange[2].padStart(2, '0')}`,
      end: `${year}${monthMap[crossDayRange[3]]}${crossDayRange[4].padStart(2, '0')}`
    }
  }

  // Single day: "Jun 4"
  const singleDay = dateStr.match(/([A-Za-z]{3})\s+(\d{1,2})(?!\d)/)
  if (singleDay && monthMap[singleDay[1]]) {
    const m = monthMap[singleDay[1]]
    const d = singleDay[2].padStart(2, '0')
    return { start: `${year}${m}${d}`, end: `${year}${m}${d}` }
  }

  // Month only: "Jul 2026", "Mar 2026"
  const monthOnly = dateStr.match(/([A-Za-z]{3})\s+\d{4}/)
  if (monthOnly && monthMap[monthOnly[1]]) {
    const m = monthMap[monthOnly[1]]
    return { start: `${year}${m}01`, end: `${year}${m}${lastDay[m]}` }
  }

  return null
}

// Generate ICS file content
function generateICS(events) {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Events 2026//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:AI Events 2026
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Upcoming AI, ML, and Robotics Events and Conferences
REFRESH-INTERVAL;VALUE=DURATION:P1D
`

  // Add events
  for (const event of events) {
    const uid = `event-${event.title.replace(/\s+/g, '-').toLowerCase()}@ai-events-2026`
    const summary = event.title
    const description = `${event.category}\\n\\nLocation: ${event.location}\\n\\nURL: ${event.url}`
    const location = event.location

    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${event.startDate}
DTEND;VALUE=DATE:${event.endDate}
SUMMARY:${escapeText(summary)}
DESCRIPTION:${escapeText(description)}
LOCATION:${escapeText(location)}
URL:${event.url}
CATEGORIES:${event.category}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`
  }

  ics += `END:VCALENDAR`
  return ics
}

// Escape special characters for ICS format
function escapeText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\;')
}

// Main
function main() {
  try {
    const markdownPath = path.join(__dirname, '../public/ai-events-2026.md')
    const icsPath = path.join(__dirname, '../public/ai-events-2026.ics')

    const markdown = fs.readFileSync(markdownPath, 'utf-8')
    const events = parseMarkdown(markdown)

    if (events.length === 0) {
      console.error('No events found')
      process.exit(1)
    }

    const icsContent = generateICS(events)
    fs.writeFileSync(icsPath, icsContent, 'utf-8')

    console.log(`Generated ICS file with ${events.length} events`)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
