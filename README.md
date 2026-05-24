# AI Events 2026

A Next.js website that renders markdown content as a styled webpage.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
├── app/
│   ├── layout.js           # Root layout component
│   ├── page.js             # Main page that renders markdown
│   ├── globals.css         # Global styles
│   └── markdown.css        # Markdown-specific styles
├── public/
│   └── ai-events-2026.md   # Your markdown content
├── package.json            # Project dependencies
├── next.config.js          # Next.js configuration
├── vercel.json             # Vercel deployment config
└── README.md
```

## Customizing Content

To use your own markdown content:

1. Replace the content in `public/ai-events-2026.md` with your own markdown
2. The file will automatically be rendered on the homepage

## Customizing Styles

The styling is split across two CSS files:

- **`app/globals.css`** - Global page styles and layout
- **`app/markdown.css`** - Specific styles for rendered markdown elements

Edit these files to customize colors, fonts, spacing, and responsive behavior.

## Building for Production

```bash
npm run build
npm start
```

## Deploying to Vercel

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Using GitHub

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import the GitHub repository
4. Vercel will automatically detect the Next.js project and deploy it

The `vercel.json` file is already configured with the correct build settings.

### Option 3: Using Vercel Dashboard

1. Visit [https://vercel.com/new](https://vercel.com/new)
2. Select your repository
3. Vercel will detect Next.js and use the configuration from `vercel.json`
4. Click Deploy

## Features

✅ Server-side markdown rendering
✅ Clean, responsive design
✅ Mobile-friendly layout
✅ Professional styling for markdown
✅ Ready for Vercel deployment
✅ Fast page loads with Next.js

## Development Tips

- Edit markdown content in `public/ai-events-2026.md` and save - changes will auto-refresh
- Modify CSS files for styling changes - hot reload enabled
- The page uses async server components for fast rendering
- No database required - just markdown files

## Dependencies

- **Next.js** - React framework for production
- **Marked** - Markdown parser and compiler

## License

Open source - feel free to modify and use as needed.
