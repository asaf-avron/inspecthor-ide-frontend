# Inspecthor IDE

### Proof-Driven AI Security Architecture: the IDE

**Write the requirement in English, approve the Dafny contract, and watch the proof pass or fail.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

This is the web IDE for [Inspecthor](https://github.com/asaf-avron/inspecthor-ide-backend), a verification gateway for AI-written code. AI agents write code faster than anyone can review it, and the subtle logic bugs are the ones that slip through. Inspecthor applies **Proof-Driven Development**: an immutable Dafny contract (the Law) is kept separate from AI-generated code (the Worker), and only code that Dafny proves correct gets through.

The IDE is where people do the work that should stay human: stating the intent, closing the gaps the auditor finds, and approving the contract. For the full architecture, the verified components and the roadmap, see the **[backend README](https://github.com/asaf-avron/inspecthor-ide-backend#readme)**.

## What's in the IDE

| Panel | What it does | Component |
|-------|--------------|-----------|
| **Spec editor** | Write requirements in Markdown | [`markdown-editor.tsx`](components/ide/markdown-editor.tsx) |
| **Spec refinement** | Review the gaps the Spec Auditor found and accept fixes, with a diff | [`spec-refinement-view.tsx`](components/ide/spec-refinement-view.tsx) |
| **Dafny editor** | View and edit the generated contract | [`code-editor.tsx`](components/ide/code-editor.tsx) |
| **Verification panel** | Proof obligations and pass or fail results from the Dafny + Z3 verifier | [`verification-panel.tsx`](components/ide/verification-panel.tsx) |
| **Gemini insight panel** | An assistant that explains failed proofs and suggests fixes | [`gemini-insight-panel.tsx`](components/ide/gemini-insight-panel.tsx) |
| **Traceability view** | Links each requirement to its contract clause and its proof | [`traceability-view.tsx`](components/ide/traceability-view.tsx) |
| **Project explorer and terminal** | Files, projects and generation logs | [`project-explorer.tsx`](components/ide/project-explorer.tsx), [`terminal-panel.tsx`](components/ide/terminal-panel.tsx) |
| **Blueprint setup** | Start from an Architect's Canvas template instead of a blank page | [`init-modal.tsx`](components/blueprint/init-modal.tsx) |
| **GitHub** | Sign in, pick a repository, and open a pull request | [`components/github/`](components/github/) |

## Quickstart

### Prerequisites

- Node.js 18 or later, and [pnpm](https://pnpm.io/)
- The [backend](https://github.com/asaf-avron/inspecthor-ide-backend#quickstart) running on `http://localhost:8000`

### Run

```bash
git clone https://github.com/asaf-avron/inspecthor-ide-frontend.git
cd inspecthor-ide-frontend
pnpm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GUARDIAN_API_KEY=<one of ALLOWED_API_KEYS from the backend .env>
```

Then start the dev server:

```bash
pnpm dev
```

Open http://localhost:3000.

`NEXT_PUBLIC_*` variables are bundled into the browser build, so anyone who loads the page can read them. Treat that API key as a client identifier, not a secret, and don't reuse a production backend key here.

### Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Dev server with hot reload |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui on top of Radix UI, and web-tree-sitter for parsing source in the browser. The API routes in [`app/api/`](app/api/) proxy authentication and GitHub calls to the backend, and keep tokens in httpOnly cookies.

## Repositories

| Repo | What's in it |
|------|--------------|
| [inspecthor-ide-frontend](https://github.com/asaf-avron/inspecthor-ide-frontend) (this repo) | Next.js IDE |
| [inspecthor-ide-backend](https://github.com/asaf-avron/inspecthor-ide-backend) | FastAPI gateway, Spec Auditor, Dafny verifier service, verified contracts, roadmap |

## Contributing

Issues and pull requests are welcome. For the architecture and the roadmap, start with the [backend README](https://github.com/asaf-avron/inspecthor-ide-backend#roadmap).

## Deployment note

This project was started with [v0](https://v0.app) and deploys to Vercel. Changes published from v0 are pushed to this repository, and Vercel deploys the latest commit on `main`.

## License

[Apache License 2.0](LICENSE)
