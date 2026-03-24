# Lytics Attributes — Contentstack Marketplace App

## What This Is

A Contentstack marketplace app that lets content editors use Lytics profile attributes as personalization tokens in content. Tokens use the syntax `{{attribute_name}}` or `{{attribute_name|default_value}}`.

## UI Locations

| Location | Path | Purpose |
|----------|------|---------|
| Custom Field | `/custom-field` | Free-text field with attribute token syntax highlighting and optional picker |
| App Configuration | `/app-configuration` | Admin screen: Lytics API token, global default value |
| Entry Sidebar | `/entry-sidebar` | Browse/search attributes, copy tokens to clipboard |
| JSON RTE Plugin | `/json-rte.js` | Toolbar button to insert inline attribute placeholder elements |

## Architecture

This follows the same patterns as the other Contentstack marketplace apps (brand-colors-tool, react-icons):

- **Vite + React 18 + TypeScript** — SPA with react-router-dom
- **Two build targets**: main app (SPA) + RTE plugin (SystemJS bundle via `vite.config.rte.ts`)
- **Express server** (`server.js`) — serves built app with CORS for RTE plugin
- **@contentstack/app-sdk** — SDK init in `MarketplaceAppProvider`, token verification via jsrsasign
- **Provider/Context pattern** — `MarketplaceAppProvider` wraps all routes, `CustomFieldExtensionProvider` wraps custom field

## Key Files

- `src/common/hooks/useLyticsAttributes.ts` — Fetches attributes from `GET https://api.lytics.io/api/schema/_user`
- `src/common/utils/functions.ts` — Token parsing/building utilities (`ATTRIBUTE_TOKEN_REGEX`, `parseAttributeToken`, `buildAttributeToken`)
- `src/components/AttributePicker.tsx` — Shared attribute selection UI (used by custom field, sidebar, and RTE modal)
- `src/rte-plugin.tsx` — RTE plugin entry; inserts `lytics-attribute` void inline elements

## Token Syntax

- `{{attribute_name}}` — replaced with the attribute value at render time
- `{{attribute_name|default}}` — uses `default` if the attribute has no value

## Data Storage

- **Custom Field**: Stores `{ text: "..." }` as JSON (the full text with tokens)
- **RTE Plugin**: Inserts Slate void inline nodes with `attrs: { "lytics-slug": "...", "lytics-default": "..." }`
- **App Config**: Stores `{ lyticsApiToken: "...", defaultValue: "..." }` via `installation.setInstallationData()`

## Lytics API

- Endpoint: `GET https://api.lytics.io/api/schema/_user`
- Auth: `Authorization: <token>` header
- The API token is optional — without it, users can still manually type attribute slugs

## Build & Run

```bash
npm install
npm run dev          # Dev server on :3000
npm run build        # Production build (app + RTE plugin)
npm start            # Production server
```

## Conventions

- All RTE plugin UI uses inline styles (no CSS imports — cross-origin constraint)
- The main app can use CSS files freely
- Shared components used by both the main app and RTE plugin must use inline styles
- Platform persistence: config is saved when Contentstack's Save button is clicked; we call `installation.setValidity(true)` and `installation.setInstallationData()` to sync
