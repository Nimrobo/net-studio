# CLAUDE.md

## Nimrobo Net Studio

Net Studio is the web UI for the Nimrobo match network. It provides a human-friendly interface for organizations and individuals to interact with the Net module - managing organizations, job posts, applications, and channels.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Development

```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # Run linter
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── lib/           # Utilities and API clients
└── types/         # TypeScript type definitions
```

## Project Tracking

- `to-do.md` - Task tracking across sessions
- `features.md` - Complete feature list by section

## Related Documentation

- `../net/docs/` - API documentation (post-api, org-api, user-api, channel-api)
- `../cli/docs/net-commands.md` - Net commands reference
- `../cli/docs/workflow.md` - Common workflow patterns

## Net Module Overview

The Net module is a professional matching network with:
- **Organizations** - Company profiles and team management
- **Posts** - Job listings and opportunity postings
- **Applications** - Candidate submissions and tracking
- **Channels** - Direct messaging between parties

Net integrates with the Screen module for voice-based interviews as part of hiring pipelines.
