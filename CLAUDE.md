# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # dev server (Turbopack) on http://localhost:3000
npm run build   # production build — the real typecheck; run before calling work done
npm run start   # serve the production build
npm run lint    # eslint (flat config; note: bare `eslint`, no path argument)
```

There is no test runner or typecheck script configured yet. For a standalone typecheck use `npx tsc --noEmit`.

## State of the repo

A single-commit `create-next-app` scaffold: `app/layout.tsx`, `app/page.tsx` (the default template page — safe to replace), `app/globals.css`, and `public/*.svg`. No application code has been written yet, so there is no established directory convention beyond the App Router itself.

## Stack specifics that differ from older Next.js

Read the relevant guide under `node_modules/next/dist/docs/` before writing code — this is Next.js 16 with React 19, and both diverge from pre-15 conventions.

- **Route prop types are global and generated.** `app/layout.tsx` uses `LayoutProps<"/">` with no import; the types come from `.next/types/**`, which is in `tsconfig.json`'s `include` and is produced by `next dev`/`next build`. Type errors about missing `LayoutProps`/`PageProps` usually mean the build has not run, not that an import is missing. `params` and `searchParams` are async in this version.
- **Tailwind v4, no config file.** `app/globals.css` does `@import "tailwindcss"` and declares design tokens in an `@theme inline` block wired to CSS custom properties on `:root`, with a `prefers-color-scheme: dark` override. Add theme values there, not in a `tailwind.config.*` (none exists). PostCSS setup is `@tailwindcss/postcss` in `postcss.config.mjs`.
- **App directory is at the repo root** (`app/`, not `src/app/`). The `@/*` TS path alias maps to the repo root.
- **ESLint is flat config** (`eslint.config.mjs`) composing `eslint-config-next/core-web-vitals` and `.../typescript`. React Compiler lint rules apply — in particular, setting state inside an effect is an error; use `useSyncExternalStore` for reading external/browser state.
- **Fonts** are loaded via `next/font/google` in `app/layout.tsx` and exposed as `--font-geist-sans` / `--font-geist-mono` CSS variables consumed by the `@theme` block.

## AGENTS.md

`AGENTS.md` is generated and re-added by `next dev` (see `node_modules/next/dist/server/lib/generate-agent-files.js`). Deleting it from a diff only recreates it as an uncommitted change — commit it alongside your work instead.
