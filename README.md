# Guardian Gateway IDE

**Frontend IDE for Formal Specification Verification**

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/asaf-avrons-projects/v0-guardian-gateway-ide)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/kwM4rwjnaFa)

## Overview

Guardian Gateway IDE is the frontend Next.js application for creating and managing formally verified Dafny specifications. It provides a modern IDE experience with:

- **Markdown Editor**: Write English requirements
- **Dafny Code Editor**: View and edit generated Dafny specifications
- **Verification Panel**: Real-time proof obligation checking
- **AI Assistant**: Gemini-powered debugging for verification failures
- **Project Management**: Organize specifications and traceability

## Architecture

This repository contains **only the frontend IDE**. The backend API and verification services are in a separate repository:

**Backend Repository:** [`guardian-gateway`](https://github.com/asaf-avron/guardian-gateway)

The backend includes:
- FastAPI REST API
- Docker-based Dafny verification service (no local installation required)
- **7 formally verified Dafny specifications** documented in [`docs/formally-verified/`](https://github.com/asaf-avron/guardian-gateway/tree/main/docs/formally-verified)

## Formally Verified Components

The backend repository contains formally verified Dafny specifications for:
- Database model and state invariants
- File operations (create, update, delete)
- Project management with cascade deletion
- Anonymous → authenticated project migration
- Cryptographic token encryption/decryption
- Spec generation (partial)
- Traceability links (partial)

See the [backend documentation](https://github.com/asaf-avron/guardian-gateway/tree/main/docs/formally-verified) for complete specifications.

## Deployment

Your project is live at:

**[https://vercel.com/asaf-avrons-projects/v0-guardian-gateway-ide](https://vercel.com/asaf-avrons-projects/v0-guardian-gateway-ide)**

## Development

### Prerequisites
- Node.js 18+ and pnpm
- Backend API running (see [backend README](https://github.com/asaf-avron/guardian-gateway#quick-start-docker-recommended))

### Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Access at http://localhost:3000
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GUARDIAN_API_KEY=your_api_key_here
```

## Build your app

Continue building your app on:

**[https://v0.app/chat/kwM4rwjnaFa](https://v0.app/chat/kwM4rwjnaFa)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Related Repositories

- **Backend API**: [`guardian-gateway`](https://github.com/asaf-avron/guardian-gateway) - FastAPI backend with Docker-based verification service
