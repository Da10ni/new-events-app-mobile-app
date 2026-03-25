---
name: Mobile-first development
description: User is building a mobile app - prioritize mobile/native solutions, not web
type: feedback
---

Focus on mobile (React Native / Expo) when implementing features. Do not spend time on web-specific solutions unless explicitly asked.

**Why:** User is building a mobile app, not a web app. Web is just used for quick development preview but not the target platform.

**How to apply:** When implementing features, prioritize native mobile solutions. Don't add web fallbacks, web-specific imports, or web polyfills unless the user specifically requests web support.
