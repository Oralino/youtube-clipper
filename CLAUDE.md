# CLAUDE.md
Permanent instructions for Claude Code in this repository: a Firefox + Chrome extension that clips part
of a YouTube video and saves it as an MP4. Personal project, solo.

## Documents
Project knowledge lives in `brain/`, one folder per question: `product/` (what it does and says),
`design/` (how it looks), `engineering/` (how it works), `work/` (what's being done). Only `CLAUDE.md`
and `README.md` stay in the root, where Claude Code and GitHub look for them.

| File | Owns | Maintained by |
|---|---|---|
| `CLAUDE.md` | Rules, commands, workflow | main session |
| `brain/product/REQUIREMENTS.md` | Goal, features, owner decisions, scope, acceptance criteria | main session |
| `brain/engineering/ARCHITECTURE.md` | Components, data flow, YouTube facts, dev quirks, known limits | main session |
| `brain/design/DESIGN.md` | How it looks | design-advisor (owner approves) |
| `brain/product/CONTENT.md` | All UI copy (mirrored into `lib/strings.ts`) | main session + owner |
| `brain/work/TASKS.md` | Current, next, launch work and bugs | main session |
| `brain/work/HANDOFF.md` | Session handoff, only when one is written (local, never committed) | main session |
| `README.md` | Public: what it is, install, build | main session |

One fact lives in one file; link instead of repeating. Update the docs when the code changes, and flag
contradictions between docs and code instead of guessing.

## Commands
```bash
npm install            # runs `wxt prepare`; after `npm install <pkg>` run `npx wxt prepare` yourself
npm run dev            # Firefox with the extension and hot reload (refresh the YouTube tab after changes)
npm run dev:chrome     # the same in Chrome
npm run check          # typecheck, lint, format:check, test, build, lint:addon — must pass before every commit
npm run build          # Firefox build into .output/   (build:chrome for Chrome)
npm run zip            # Firefox zip + source zip for addons.mozilla.org   (zip:chrome for the GitHub release)
npm test               # vitest run      · npm run typecheck · npm run lint · npm run format
npm run lint:addon     # Mozilla's linter; exactly 2 UNSAFE_VAR_ASSIGNMENT (ReactDOM) warnings are expected
```
- Also run `npm run build:chrome` when the manifest, background or build setup changes.
- **Windows:** stopping `npm run dev` can leave `node …wxt\bin\wxt.mjs` running. Before starting a dev
  server, stop every such process (check ports 3000+). If Firefox is already open, the git-ignored
  `web-ext.config.ts` needs `firefoxArgs: ["-new-instance"]`.
- If a dev tab looks stale, press Alt+R in the dev Firefox, then refresh.

## Conventions
- TypeScript strict; ESLint + Prettier (semicolons, double quotes; Markdown isn't formatted).
- Relative imports include the extension (`./time.ts`). One React component per file, default-exported
  and named after the file. Comment only what isn't obvious.
- Pure logic in `lib/` with tests next to it (`*.test.ts`); browser-only media code in `media/`.
- UI text only from `lib/strings.ts`, mirrored from `CONTENT.md`; change `CONTENT.md` first.
- Never `innerHTML` and friends (YouTube enforces Trusted Types; see `ARCHITECTURE.md`). CSS that lands
  in YouTube's page uses the `clip-ext-` prefix.
- Cross-browser: use WXT's `browser`; Firefox-only manifest keys only in the Firefox build; comment
  anything Firefox-specific.
- Only the permissions in `ARCHITECTURE.md`; add a dependency only with a clear reason.
- Accessibility: WCAG AA, keyboard use, visible focus, `prefers-reduced-motion`.
- Never invent features, metrics or results. Nothing personal in public files.

## Models and agents
- **Opus (the main session)** writes and approves all production code, and makes architecture
  decisions, debugs hard problems and does refactors.
- Project agents in `.claude/agents/` (they override the general ones in `~/.claude/agents/`):
  - `code-reviewer` (Sonnet, read-only): correctness, races and lifecycle, cross-browser,
    maintainability, accessibility, performance.
  - `qa-checker` (Haiku, Bash for checks only): `npm run check`, the Chrome build, zip and manifest
    checks, mechanical searches.
  - `design-advisor` (Opus, edits only `DESIGN.md`): new visual patterns and design deviations.
- Reviewer and QA **only report**; the main session judges their findings and makes the changes.
  Never two agents writing the same file. Give each agent only the files its job needs, and run agents
  in parallel only when their work is independent.

## When to use agents
Before a task, classify it and state the recommended effort in one line (the owner sets effort; switch
only at task boundaries, and if a "small" task grows, stop and say so):

| Tier | Examples | Agents | Effort |
|---|---|---|---|
| Small | Text, CSS tweak, rename, one config value, one-file fix | none; `npm run check` | low/medium |
| Medium | New component or feature, behaviour or state change, multi-file refactor | code-reviewer | medium |
| Large / high-risk | Recording or conversion changes, permissions, manifest, build system, many files | code-reviewer + qa-checker | high |
| Milestone / release | Before a version or store upload | code-reviewer + qa-checker | high |

design-advisor runs only for new visual patterns. After page-affecting changes, do the manual check in
`REQUIREMENTS.md` (acceptance criteria) in the dev Firefox.

## Secrets and privacy
- No API keys are needed, and extension code can never hold a secret. Never commit `.env` or keys
  (`.gitignore` covers `.env`, `.env.*`, `private/`).
- Before any push: `git grep --cached -nE 'AIza|mongodb(\+srv)?://|sk-|gh[pousr]_'`.
- Commit identity for this repo is `Oralino` with the GitHub no-reply address (local git config).
  Never use the owner's real name or personal email.

## Git and releases
- Commit to `main` after each completed task, once its tier's checks have passed (`npm run check`,
  plus reviewer and/or QA per the tier table), not before. Only the main session commits; agents never
  commit or push.
- One logical change per commit (a task can end in several commits), with plain imperative messages.
- Never commit secrets or credentials. If the working tree has unrelated changes, ask before committing.
- Never push or force-push without asking first.
- Repo: github.com/Oralino/youtube-clipper (public, MIT).
- Release: bump `version` in `package.json`, then `npm run check`, `npm run zip` and
  `npm run zip:chrome`. Upload the Firefox zip and source zip to addons.mozilla.org, and create a
  GitHub release with the Chrome zip plus the Mozilla-signed `.xpi` once it's approved. Install steps
  live in `README.md`.
