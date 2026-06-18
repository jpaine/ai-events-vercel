'use client'

export default function CalendarSubscribe() {
  const icsUrl = "https://ai-events-vercel.vercel.app/ai-events-2026.ics"
  const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?url=${encodeURIComponent(icsUrl)}`

  return (
    <div className="calendar-subscribe">
      <div className="calendar-content">
        <div className="calendar-icon">
          📅
        </div>
        <div className="calendar-text">
          <h3>📅 Subscribe to Calendar</h3>
          <p>Add all AI events directly to your calendar and get automatic updates!</p>
          <div className="calendar-buttons">
            <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="calendar-btn google-btn">
              Google Calendar
            </a>
            <a href={icsUrl} className="calendar-btn download-btn">
              Download ICS File
            </a>
          </div>
          <p className="calendar-info">
            Works with: Google Calendar, Apple Calendar, Outlook, and most calendar apps
          </p>
        </div>
      </div>
      <style jsx>{`
        .calendar-subscribe {
          background: linear-gradient(135deg, rgba(50, 150, 200, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%);
          border: 2px solid #00ff88;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 2rem 0;
          position: relative;
          overflow: hidden;
        }

        .calendar-subscribe::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #00ff88, #00d4ff);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .calendar-content {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .calendar-icon {
          flex-shrink: 0;
          font-size: 2.5rem;
        }

        .calendar-text {
          flex: 1;
        }

        .calendar-text h3 {
          color: #00ff88;
          margin: 0 0 0.5rem 0;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .calendar-text p {
          color: #d0d0d0;
          margin: 0;
          font-size: 0.95rem;
        }

        .calendar-buttons {
          display: flex;
          gap: 0.75rem;
          margin: 1rem 0;
          flex-wrap: wrap;
        }

        .calendar-btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .google-btn {
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          color: #000;
          border-color: #00ff88;
        }

        .google-btn:hover {
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
          transform: translateY(-2px);
        }

        .download-btn {
          background: transparent;
          color: #00d4ff;
          border-color: #00d4ff;
        }

        .download-btn:hover {
          background: rgba(0, 212, 255, 0.1);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
          transform: translateY(-2px);
        }

        .calendar-info {
          font-size: 0.85rem;
          color: #888;
          margin-top: 1rem !important;
        }

        @media (max-width: 768px) {
          .calendar-content {
            flex-direction: column;
            gap: 1rem;
          }

          .calendar-buttons {
            flex-direction: column;
            gap: 0.5rem;
          }

          .calendar-btn {
            width: 100%;
            text-align: center;
          }

          .calendar-text h3 {
            font-size: 1.1rem;
          }

          .calendar-text p {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  )
}
