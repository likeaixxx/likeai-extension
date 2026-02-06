# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all Raycast command entry points (`*.tsx`) and shared helpers in `src/helper/`.
- `assets/` stores icons and other static resources referenced by commands.
- `eslint.config.js` and `tsconfig.json` define linting and TypeScript project settings.
- `readme.md` is minimal; keep short, user-facing notes there if needed.

## Build, Test, and Development Commands
- `npm run dev`: starts Raycast development mode for local testing.
- `npm run build`: builds the extension to `dist/`.
- `npm run lint`: runs Raycast linting rules.
- `npm run fix-lint`: auto-fixes lint issues where possible.
- `npm run publish`: publishes to the Raycast Store (uses latest API).

## Coding Style & Naming Conventions
- Language: TypeScript + React (`*.tsx`) for all commands.
- Indentation: 2 spaces (match existing files).
- Naming: command files use kebab-case (e.g., `convert-ddl2-java.tsx`); helpers are lower-case with hyphens or simple names (e.g., `lyrics-api.ts`).
- Formatting: use Prettier and the Raycast ESLint config (`eslint.config.js`).

## Testing Guidelines
- No automated tests are currently configured.
- If you add tests, document the framework and command here, and keep test files near the related module (e.g., `src/__tests__/`).

## Commit & Pull Request Guidelines
- Recent commits use short, informal messages (e.g., “upgrade”, “fix some”).
- Keep commit messages concise and descriptive; use imperative verbs when possible.
- PRs should describe what changed, why, and include screenshots or screen recordings for UI-affecting changes.
- Link related issues or Raycast Store review notes if applicable.

## Configuration & Environment
- Extension metadata and user preferences live in `package.json`.
- Preferences include `lyrics_api` and `weather_location`; keep defaults sensible and document new ones in this file.
