# Frontend Integration Guide — Lytics Attributes

This guide explains how to resolve Lytics profile attribute tokens on the frontend. The Contentstack marketplace app handles inserting tokens into content; this guide covers rendering them with real profile data.

## Setup

Add the Lytics JavaScript tag to your site. The tag must load before you attempt to resolve tokens.

```html
<script src="https://c.lytics.io/api/tag/<YOUR_ACCOUNT_ID>/lio.js"></script>
```

## How Tokens Work

### Text Fields (Single-line, Multi-line)

Tokens appear as plain text in the format:

```
Welcome back, {{first_name|visitor}}! You have {{num_visits}} visits.
```

- `{{slug}}` — replaced with the profile attribute value
- `{{slug|default}}` — uses `default` if the attribute is empty

### JSON RTE Fields

In JSON RTE content, tokens are stored as inline Slate nodes:

```json
{
  "type": "lytics-attribute",
  "attrs": {
    "lytics-slug": "first_name",
    "lytics-default": "visitor"
  },
  "children": [{ "text": "" }]
}
```

## Resolving Tokens

### Getting the Lytics Profile

```js
function getLyticsProfile() {
  return new Promise((resolve) => {
    if (typeof window.jstag === 'undefined') {
      resolve(null);
      return;
    }
    window.jstag.getEntity({}, (entity) => {
      resolve(entity?.data?.user || null);
    });
  });
}
```

> **Important:** Profile data is at `entity.data.user`, not `entity.data`.

### Resolving Text Tokens

```js
function resolveTextTokens(text, profile) {
  if (!text || !profile) return text;
  return text.replace(
    /\{\{([a-zA-Z_][\w.]*?)(?:\|([^}]*))?\}\}/g,
    (_, slug, fallback) => {
      const value = profile[slug];
      if (value == null || value === '') return fallback || '';
      return String(value);
    }
  );
}
```

**Usage:**

```js
const profile = await getLyticsProfile();
const resolved = resolveTextTokens(entry.excerpt, profile);
// "Welcome back, Todd! You have 42 visits."
```

### Resolving JSON RTE Nodes

When rendering JSON RTE content, check for `lytics-attribute` nodes and replace them with profile values.

**For `contentstack-utils` or custom renderers:**

```js
function resolveLyticsNode(node, profile) {
  if (node.type !== 'lytics-attribute') return null;

  const slug = node.attrs?.['lytics-slug'];
  const fallback = node.attrs?.['lytics-default'] || '';

  if (!slug) return fallback;
  if (!profile) return fallback;

  const value = profile[slug];
  if (value == null || value === '') return fallback;
  return String(value);
}
```

## React / Next.js Integration

### Hook

```tsx
'use client';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    jstag?: {
      getEntity: (opts: object, cb: (entity: any) => void) => void;
      send: (data: object) => void;
    };
  }
}

export function useLyticsProfile() {
  const [profile, setProfile] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (typeof window.jstag === 'undefined') return;
    window.jstag.getEntity({}, (entity) => {
      if (entity?.data?.user) setProfile(entity.data.user);
    });
  }, []);

  return profile;
}
```

### Text Component

```tsx
'use client';
import { useLyticsProfile } from './useLyticsProfile';

function resolveTokens(text: string, profile: Record<string, any> | null): string {
  if (!text || !profile) return text || '';
  return text.replace(
    /\{\{([a-zA-Z_][\w.]*?)(?:\|([^}]*))?\}\}/g,
    (_, slug, fallback) => {
      const value = profile[slug];
      if (value == null || value === '') return fallback || '';
      return String(value);
    }
  );
}

export function PersonalizedText({ children }: { children: string }) {
  const profile = useLyticsProfile();
  return <>{resolveTokens(children, profile)}</>;
}
```

**Usage:**

```tsx
<p><PersonalizedText>{entry.tagline}</PersonalizedText></p>
```

### JSON RTE Renderer

If using `@contentstack/utils` for JSON RTE rendering, add a custom node renderer:

```tsx
'use client';
import { useLyticsProfile } from './useLyticsProfile';

export function LyticsAttributeNode({ node }: { node: any }) {
  const profile = useLyticsProfile();

  const slug = node.attrs?.['lytics-slug'];
  const fallback = node.attrs?.['lytics-default'] || '';

  if (!slug) return <>{fallback}</>;
  if (!profile) return <>{fallback}</>;

  const value = profile[slug];
  if (value == null || value === '') return <>{fallback}</>;
  return <>{String(value)}</>;
}
```

Register it in your RTE renderer for the `lytics-attribute` node type.

## Testing

Open the browser console on a page with the Lytics tag loaded:

```js
// Check if Lytics is loaded
typeof window.jstag

// View your full profile
jstag.getEntity({}, function(e) { console.log(e.data.user); });

// Check a specific attribute
jstag.getEntity({}, function(e) { console.log(e.data.user.first_name); });

// Send a test identity
jstag.send({ email: "test@example.com" });
```

## Notes

- Tokens render the **fallback value** (or empty string) until the Lytics profile loads. This means there is a brief flash on first render. Consider hiding personalized content until the profile is available, or using skeleton placeholders.
- Profile data is only available client-side. Server-rendered pages (SSG/SSR) will always render fallbacks. Use `'use client'` components for personalized sections.
- The `{{slug|default}}` syntax in text fields is a convention — the frontend code above enforces it. If you need more complex formatting (currency, case transforms), handle that in the resolver function per your needs.
