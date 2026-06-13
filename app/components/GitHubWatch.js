'use client'

export default function GitHubWatch() {
  const repoUrl = "https://github.com/jpaine/ai-events-vercel"

  return (
    <div className="github-watch">
      <div className="github-content">
        <div className="github-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <div className="github-text">
          <h3>👀 Get Notified on GitHub</h3>
          <p>Watch the repository to get notified whenever new events are added!</p>
          <div className="github-steps">
            <ol>
              <li>Go to the <a href={repoUrl} target="_blank" rel="noopener noreferrer">GitHub repository</a></li>
              <li>Click the <strong>Watch</strong> button (top right)</li>
              <li>Select <strong>Custom</strong> → Check <strong>Pushes</strong></li>
              <li>Done! You'll get notifications for all updates</li>
            </ol>
          </div>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="github-button">
            Watch on GitHub →
          </a>
        </div>
      </div>
      <style jsx>{`
        .github-watch {
          background: linear-gradient(135deg, rgba(30, 30, 30, 0.5) 0%, rgba(0, 212, 255, 0.05) 100%);
          border: 2px solid #00d4ff;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 2rem 0;
          position: relative;
          overflow: hidden;
        }

        .github-watch::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #00d4ff, #00ff88);
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .github-content {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .github-icon {
          flex-shrink: 0;
          color: #00d4ff;
          font-size: 2.5rem;
        }

        .github-text {
          flex: 1;
        }

        .github-text h3 {
          color: #00d4ff;
          margin: 0 0 0.5rem 0;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .github-text p {
          color: #d0d0d0;
          margin: 0 0 1rem 0;
          font-size: 0.95rem;
        }

        .github-steps {
          background: rgba(0, 212, 255, 0.05);
          border-left: 3px solid #00d4ff;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 4px;
        }

        .github-steps ol {
          margin: 0;
          padding-left: 1.5rem;
          color: #d0d0d0;
          font-size: 0.9rem;
        }

        .github-steps li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .github-steps a {
          color: #00d4ff;
          text-decoration: none;
          border-bottom: 1px solid #00d4ff;
        }

        .github-steps a:hover {
          color: #00ff88;
          border-bottom-color: #00ff88;
        }

        .github-steps strong {
          color: #00ff88;
          font-weight: 600;
        }

        .github-button {
          display: inline-block;
          background: linear-gradient(135deg, #00d4ff, #00ff88);
          color: #000;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
        }

        .github-button:hover {
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .github-content {
            flex-direction: column;
            gap: 1rem;
          }

          .github-icon {
            font-size: 2rem;
          }

          .github-text h3 {
            font-size: 1.1rem;
          }

          .github-text p {
            font-size: 0.9rem;
          }

          .github-steps {
            padding: 0.75rem;
          }

          .github-steps ol {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  )
}
