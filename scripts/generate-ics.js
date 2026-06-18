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
          title: parts[0],
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

// Parse date strings like "Jan 20-27" or "Jun 1-5, 2026"
function parseDateRange(dateStr) {
  if (!dateStr || dateStr.includes('TBD') || dateStr.includes('(TBD)')) {
    return null
  }

  const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  }

  let year = '2026'
  const yearMatch = dateStr.match(/(\d{4})/)
  if (yearMatch) {
    year = yearMatch[1]
  }

  // Match: "Jan 20-27" or "Sep 27-Oct 1"
  const rangeMatch = dateStr.match(/(\w+)\s+(\d+)-(\d+)/) ||
                     dateStr.match(/(\w+)\s+(\d+)-(\w+)\s+(\d+)/)

  if (!rangeMatch) {
    // Try single date: "Jun 4"
    const singleMatch = dateStr.match(/(\w+)\s+(\d+)/)
    if (singleMatch) {
      const month = monthMap[singleMatch[1]]
      const day = singleMatch[2].padStart(2, '0')
      const dateStr_iso = `${year}${month}${day}`
      return { start: dateStr_iso, end: dateStr_iso }
    }
    return null
  }

  if (rangeMatch.length === 4) {
    // Same month: "Jan 20-27"
    const month = monthMap[rangeMatch[1]]
    const startDay = rangeMatch[2].padStart(2, '0')
    const endDay = rangeMatch[3].padStart(2, '0')
    return {
      start: `${year}${month}${startDay}`,
      end: `${year}${month}${endDay}`
    }
  } else if (rangeMatch.length === 5) {
    // Different months: "Sep 27-Oct 1"
    const startMonth = monthMap[rangeMatch[1]]
    const startDay = rangeMatch[2].padStart(2, '0')
    const endMonth = monthMap[rangeMatch[3]]
    const endDay = rangeMatch[4].padStart(2, '0')
    return {
      start: `${year}${startMonth}${startDay}`,
      end: `${year}${endMonth}${endDay}`
    }
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
