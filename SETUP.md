# Contentstack Marketplace Setup Guide — Lytics Attributes

This guide walks through deploying the app and configuring it in the Contentstack Developer Hub.

## 1. Deploy to Contentstack Launch

### Upload the App

1. Go to **Contentstack Launch** and create a new project
2. Upload the project zip file (or connect the GitHub repo)
3. Configure deployment settings:

| Setting | Value |
|---|---|
| **Framework Preset** | Other |
| **Output Directory** | `./` |
| **Build Command** | `npm run build` |
| **Server Command** | `npm run start` |

4. Click **Deploy**

> **Important:** The Server Command (`npm run start`) is required. It runs an Express server that handles SPA routing and proxies Lytics API calls to avoid browser CORS restrictions.

### Note the Deploy URL

After deployment, note the URL (e.g. `https://marketplace-lytics-attributes.contentstackapps.com`). You'll need this for the next step.

## 2. Create the App in Developer Hub

1. Go to **Contentstack Developer Hub** → **Manage Apps** → **+ New App**
2. Set the app name to **Lytics Attributes** (or your preferred name)
3. Set **App Type** to **Stack**

### Hosting Settings

1. Select **Custom Hosting**
2. Enter your Launch deploy URL as the **App URL**

> **Critical:** The App URL must **NOT** have a trailing slash. Use `https://marketplace-lytics-attributes.contentstackapps.com` — not `https://marketplace-lytics-attributes.contentstackapps.com/`
>
> A trailing slash causes double-slash URLs (`//app-configuration`) which break routing.

## 3. Configure UI Locations

Add the following three UI locations:

### App Configuration

| Setting | Value |
|---|---|
| **Path** | `/app-configuration` |
| **Signed** | Off |
| **Enabled** | On |

This is the admin screen where you configure the Lytics API token, default formatting, and allowed attributes.

### Entry Sidebar

| Setting | Value |
|---|---|
| **Name** | Insert Lytics Attributes |
| **Path** | `/entry-sidebar` |
| **Signed** | Off |
| **Enabled** | On |
| **Description** | Select Lytics profile attribute to insert into supported fields |

This adds a sidebar panel to the entry editor where editors can browse, search, and click attributes to copy personalization tokens to their clipboard.

### JSON RTE

| Setting | Value |
|---|---|
| **Name** | Insert Lytics Attributes |
| **Path** | `/json-rte.js` |
| **Signed** | Off |
| **Enabled** | On |

This adds a toolbar button to JSON Rich Text Editor fields. Clicking it opens an attribute picker that inserts a personalization token inline at the cursor position.

## 4. Install the App

1. Save the app configuration in Developer Hub
2. Go to **Marketplace** in your stack
3. Find **Lytics Attributes** and click **Install**
4. Once installed, click the **Configuration** tab
5. Enter your **Lytics API Token** (get this from your Lytics account settings)
6. Configure **Default Formatting** (text transform and number format)
7. Optionally enable **Restrict Attributes** to limit which attributes editors can use
8. Click **Save**

## 5. Enable JSON RTE Plugin on Fields

The JSON RTE toolbar plugin must be enabled per-field:

1. Go to your **Content Type** settings
2. Edit the JSON RTE field you want to enable personalization on
3. In the field properties, find the **Plugins** section
4. Enable **Insert Lytics Attributes**
5. Save the content type

## 6. Frontend Integration

Attribute tokens are stored as text (`{{slug|format|default}}`) or as structured JSON RTE nodes. Your frontend must resolve these tokens using the Lytics JavaScript tag.

See [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) for complete integration code including React/Next.js components.

> **This step is required.** Without frontend integration, tokens will appear as raw text (e.g. `{{first_name}}`) to visitors.

## Architecture Overview

```
Contentstack Entry Editor
├── Entry Sidebar → Browse attributes, copy {{token}} to clipboard
├── JSON RTE → Toolbar button inserts inline attribute node at cursor
└── App Configuration → Lytics API token, formatting defaults, allowed attributes

Your Server (Launch)
├── Express server (SPA fallback + static files)
└── /api/lytics/schema → Proxies Lytics API (avoids browser CORS)

Your Frontend
├── Lytics JS tag → Loads visitor profile
└── Token resolver → Replaces {{tokens}} with profile values
```
