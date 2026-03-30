# Frontend Integration Guide — Lytics Attributes

This guide explains how to resolve Lytics profile attribute tokens on the frontend. The Contentstack marketplace app handles inserting tokens into content; this guide covers rendering them with real profile data.

## Setup

Add the Lytics JavaScript tag to your site. The tag must load before you attempt to resolve tokens.

```html
<!-- Get the exact tag URL from your Lytics account settings -->
<script src="https://c.lytics.io/api/tag/<YOUR_ACCOUNT_ID>/latest.min.js"></script>
```

> **Note:** The exact script filename may vary by account. Check your Lytics account's JavaScript tag settings for the correct URL.

## Token Syntax

### Text Fields (Single-line, Multi-line)

Tokens are inserted via the entry sidebar and appear as plain text. The format supports optional formatting modifiers and a default value, separated by `|`:

```
{{slug}}
{{slug|default}}
{{slug|transform|default}}
{{slug|transform|numberFormat|default}}
```

**Examples:**

| Token | Output |
|---|---|
| `{{first_name}}` | `Todd` |
| `{{first_name\|visitor}}` | `Todd` (or `visitor` if empty) |
| `{{first_name\|uppercase}}` | `TODD` |
| `{{first_name\|capitalize\|visitor}}` | `Todd` (or `Visitor` if empty) |
| `{{score_consistency\|number}}` | `1,234` |
| `{{cart_value_total\|currency}}` | `$1,234.00` |
| `{{score_propensity\|percent}}` | `62%` |

**Available modifiers:**

| Modifier | Type | Effect |
|---|---|---|
| `lowercase` | text | all lowercase |
| `uppercase` | text | ALL UPPERCASE |
| `capitalize` | text | First letter capitalized |
| `titlecase` | text | Each Word Capitalized |
| `number` | number | Comma-separated (1,234) |
| `currency` | number | Dollar format ($1,234.00) |
| `decimal2` | number | Two decimal places (1234.00) |
| `percent` | number | Percentage (85%) |

### JSON RTE Fields

In JSON RTE content, tokens are stored as inline Slate nodes with structured attributes:

```json
{
  "type": "lytics-attribute",
  "attrs": {
    "lytics-slug": "first_name",
    "lytics-transform": "uppercase",
    "lytics-format": "",
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

### Applying Transforms

```js
function applyTransform(value, transform) {
  if (value == null) return value;
  const str = String(value);
  switch (transform) {
    case 'lowercase': return str.toLowerCase();
    case 'uppercase': return str.toUpperCase();
    case 'capitalize': return str.charAt(0).toUpperCase() + str.slice(1);
    case 'titlecase': return str.replace(/\b\w/g, c => c.toUpperCase());
    default: return str;
  }
}

function applyNumberFormat(value, format) {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  switch (format) {
    case 'number': return num.toLocaleString();
    case 'currency': return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    case 'decimal2': return num.toFixed(2);
    case 'percent': return `${num}%`;
    default: return String(value);
  }
}
```

### Resolving Text Tokens

```js
function resolveTextTokens(text, profile) {
  if (!text || !profile) return text;
  return text.replace(
    /\{\{([a-zA-Z_][\w.]*?)(?:\|([^}]*))?\}\}/g,
    (match, slug, modifiers) => {
      const value = profile[slug];

      // Parse modifiers: could be "transform|format|default" in any combination
      const parts = modifiers ? modifiers.split('|') : [];
      const transforms = ['lowercase', 'uppercase', 'capitalize', 'titlecase'];
      const formats = ['number', 'currency', 'decimal2', 'percent'];

      let transform = '';
      let format = '';
      let fallback = '';

      for (const part of parts) {
        if (transforms.includes(part)) transform = part;
        else if (formats.includes(part)) format = part;
        else fallback = part; // anything else is the default value
      }

      if (value == null || value === '') return fallback;

      let result = value;
      if (format) result = applyNumberFormat(result, format);
      if (transform) result = applyTransform(result, transform);
      else result = String(result);

      return result;
    }
  );
}
```

**Usage:**

```js
const profile = await getLyticsProfile();
const resolved = resolveTextTokens(entry.excerpt, profile);
// "Welcome back, TODD! You have 1,234 visits."
```

### Resolving JSON RTE Nodes

When rendering JSON RTE content, check for `lytics-attribute` nodes. These have explicit attributes for each option:

```js
function resolveLyticsNode(node, profile) {
  if (node.type !== 'lytics-attribute') return null;

  const slug = node.attrs?.['lytics-slug'];
  const transform = node.attrs?.['lytics-transform'] || '';
  const format = node.attrs?.['lytics-format'] || '';
  const fallback = node.attrs?.['lytics-default'] || '';

  if (!slug) return fallback;
  if (!profile) return fallback;

  const value = profile[slug];
  if (value == null || value === '') return fallback;

  let result = value;
  if (format) result = applyNumberFormat(result, format);
  if (transform) result = applyTransform(result, transform);
  else result = String(result);

  return result;
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
import { resolveTextTokens } from './lyticsResolver'; // the function from above

export function PersonalizedText({ children }: { children: string }) {
  const profile = useLyticsProfile();
  return <>{resolveTextTokens(children, profile)}</>;
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
import { resolveLyticsNode } from './lyticsResolver'; // the function from above

export function LyticsAttributeNode({ node }: { node: any }) {
  const profile = useLyticsProfile();
  return <>{resolveLyticsNode(node, profile)}</>;
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

- Tokens render the **fallback value** (or empty string) until the Lytics profile loads. Consider hiding personalized content until the profile is available, or using skeleton placeholders.
- Profile data is only available client-side. Server-rendered pages (SSG/SSR) will always render fallbacks. Use `'use client'` components for personalized sections.
- The `applyTransform` and `applyNumberFormat` functions above handle all modifiers that the marketplace app UI offers. You can extend them if needed.
