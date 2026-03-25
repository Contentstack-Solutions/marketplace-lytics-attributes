# Roadmap — Lytics Attributes

## Planned

### Content Type Sidebar — Per-Content-Type Configuration
Add a content type sidebar UI location that allows admins to enable/disable Lytics attribute insertion per content type. This would let teams control which content types support personalization, preventing editors from inserting tokens into content types where the frontend doesn't resolve them.

### Audience-Based Content Variants
Allow editors to create content variants tied to Lytics audience segments. Instead of just inserting attribute values, editors could define "if user is in segment X, show content A; otherwise show content B." This would require a more complex data model and frontend resolver.

### Attribute Preview with Live Profile Data
Requires Lytics entity API access (not currently available with Schema View + User Profile View token permissions). Would show a live preview of what resolved content would look like for a real user profile. Blocked until entity API access is available.

### Rich Formatting UI in RTE ✅
Implemented — the RTE attribute picker and entry sidebar both show formatting options (text transform, number format, default value) with the selected format applied to the token on insert.

## Future Considerations

### Attribute Validation
Warn editors when they use an attribute that doesn't exist in the Lytics schema, or when they apply a number format to a string attribute.

### Personalization Analytics
Track which attributes are used across entries to help teams understand personalization coverage and identify unused or over-used attributes.

### Multi-Language Default Values
Support per-locale default values for attribute tokens, so `{{first_name|visitor}}` in English could have a different default in other locales.

### Server-Side Token Resolution
For SSR/SSG frameworks, provide a server-side resolver that calls the Lytics API to resolve tokens for known users (e.g., logged-in users with email), enabling personalized content without client-side JS.
