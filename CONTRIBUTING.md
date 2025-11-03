# Contributing Guide

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Use Prettier (runs on save)
- **Linting**: ESLint configured for Next.js
- **Components**: Follow shadcn/ui patterns
- **Naming**: 
  - Components: PascalCase
  - Files: kebab-case
  - Functions: camelCase

## Component Structure

```tsx
// components/feature/component-name.tsx
'use client' // Only if needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ComponentName() {
  // Component logic
  return (
    // JSX
  )
}
```

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

Example: `feat: add CSV export to analytics`

## Pull Request Process

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes and commit
3. Push to your fork
4. Create pull request
5. Wait for review

## Testing

- Test all features manually
- Check mobile responsiveness
- Verify database operations
- Test AI responses in sandbox

## Questions?

Open an issue or contact the maintainers.
