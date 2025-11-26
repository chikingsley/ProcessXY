# Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Run E2E tests (requires dev server running)
bun run test:e2e

# Build for production
bun run build
```

## 🧪 Testing

### Unit Tests

```bash
bun run test:unit
```

- 11 unit tests covering core functionality
- Tests API endpoints, graph updates, node operations
- Uses Bun's built-in test runner

### E2E Tests

```bash
# Start dev server first
bun run dev

# In another terminal
bun run test:e2e
```

- 5 E2E tests using Playwright
- Tests full user workflows in real browser
- No API keys required
- See [tests/README.md](../tests/README.md) for details

### CI/CD Pipeline

GitHub Actions automatically runs on every push:

**Jobs:**

1. **Build & Test** - Install, build, unit tests, E2E tests
2. **Type Check** - TypeScript validation (warning only)
3. **Code Quality** - Check for console.logs, TODOs
4. **Dependency Check** - Security scan

**Workflow Files:**

- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/auto-fix.yml` - Creates issues on failures
- `.github/workflows/claude-fix.yml` - Manual fix trigger

### Running CI Locally

```bash
# Full CI suite
bun run ci:full

# Quick check (no E2E)
bun run ci
```

## 🏗️ Architecture

### Tech Stack

- **Runtime:** Bun (Node.js alternative)
- **Frontend:** React 19 + TypeScript
- **UI Components:** Radix UI + Tailwind CSS
- **Process Visualization:** XyFlow (React Flow)
- **AI:** Google Gemini API
- **Testing:** Bun Test + Playwright
- **Build:** Bun's built-in bundler

### Project Structure

```test
src/
├── components/          # React components
│   ├── ChatInterface.tsx
│   ├── ProcessMap.tsx
│   └── CustomNode.tsx
├── types/              # TypeScript types
├── index.ts            # Server + API
└── index.css           # Global styles

tests/
├── unit.test.ts        # Unit tests
└── phase1.test.ts      # E2E tests

.github/workflows/      # CI/CD automation
```

### Key Design Decisions

**Why Bun?**

- 3x faster than Node.js
- Built-in test runner, bundler, TypeScript support
- Single runtime for everything

**Why Playwright over Stagehand?**

- No API keys required
- Faster and more reliable
- Better debugging tools
- Industry standard

**Why XyFlow?**

- Best React flow library
- Highly customizable
- Great performance
- Active community

## 🔧 Development Tips

### Hot Reload

The dev server uses `--hot` flag for instant updates on file changes.

### Environment Variables

Create a `.env` file:

```env
GOOGLE_API_KEY=your-key-here
```

Bun automatically loads `.env` files - no dotenv needed!

### Debugging Tests

```bash
# Run specific test
bun test --test-name-pattern="should load"

# Watch mode
bun test --watch

# See Playwright UI
bunx playwright test --ui
```

### Type Checking

```bash
# Check types
bun run typecheck

# Strict mode
bun run typecheck:strict
```

## 📦 Building & Deployment

### Production Build

```bash
bun run build
```

Creates optimized bundle in `dist/`:

- Minified JavaScript
- Extracted CSS
- Source maps

### Running Production Build

```bash
bun run start
```

### Deployment

Deploy `dist/` folder to any static host:

- Vercel
- Netlify
- Cloudflare Pages
- Your own server with `bun src/index.ts`

## 🤝 Contributing

### Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Run tests: `bun test`
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Create PR to `main`

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactor
- `chore:` Maintenance

### Before Committing

```bash
# Make sure everything passes
bun run ci:full
```

## 🐛 Troubleshooting

### Tests failing?

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Rebuild
bun run build
```

### Playwright not working?

```bash
# Install browsers
bunx playwright install chromium
```

### Dev server not starting?

- Check if port 3000 is available
- Kill any process using port 3000: `lsof -ti:3000 | xargs kill`

## 📚 Resources

- [Bun Documentation](https://bun.sh/docs)
- [React Documentation](https://react.dev)
- [XyFlow Docs](https://xyflow.com)
- [Playwright Docs](https://playwright.dev)
- [Tailwind CSS](https://tailwindcss.com)
