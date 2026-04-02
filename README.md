# Lytics Attributes — Contentstack Marketplace App

A Contentstack marketplace app that lets content editors use Lytics profile attributes as personalization tokens in content. Tokens use the syntax `{{attribute_name}}` or `{{attribute_name|default_value}}`.

## Getting Started

### 1. Set Up the App in Contentstack

Follow the [Setup Guide](SETUP.md) to register the app in Developer Hub and configure UI locations.

> **Shortcut:** You can skip Step 1 (Deploy to Contentstack Launch) and use the already-deployed instance at `https://marketplace-lytics-attributes.contentstackapps.com`. Start directly at Step 2 and use that URL as your App URL.

### 2. Integrate on Your Frontend

The app handles inserting tokens into content. Your frontend must resolve them using the Lytics JavaScript tag.

See the [Frontend Integration Guide](FRONTEND_INTEGRATION.md) for complete code including React/Next.js components.

## How It Works

| UI Location | What It Does |
|---|---|
| **App Configuration** | Admin screen: Lytics API token, default formatting, allowed attributes |
| **Entry Sidebar** | Browse/search attributes, copy `{{token}}` to clipboard |
| **JSON RTE Plugin** | Toolbar button inserts inline attribute node at cursor |

## Token Syntax

```
{{slug}}                          — replaced with attribute value
{{slug|default}}                  — uses default if attribute is empty
{{slug|transform|default}}        — applies text transform (uppercase, lowercase, etc.)
{{slug|transform|format|default}} — applies text transform + number format
```

## Development

```bash
npm install
npm run dev          # Dev server on :3000
npm run build        # Production build (app + RTE plugin)
npm start            # Production server
```
