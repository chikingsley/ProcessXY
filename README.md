# ProcessXY

**AI-powered process mapping assistant** - Create and edit business process diagrams using natural language.

## ✨ Features

- 🎯 **Multi-Node Selection** - Select single or multiple nodes with visual feedback
- 🤖 **AI-Aware Context** - AI understands which nodes you're referring to ("make this red")
- 💬 **Natural Language** - Describe processes in plain English, get instant diagrams
- 🎨 **Status Indicators** - Mark nodes as bottlenecks, issues, or complete
- ⚡ **Real-Time Updates** - Changes appear instantly on the canvas
- 🧪 **Fully Tested** - 16/16 tests passing (11 unit + 5 E2E)

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Add your Google API key
echo "GOOGLE_API_KEY=your-key-here" > .env

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

- **[Development Guide](docs/development.md)** - Setup, testing, CI/CD, architecture
- **[Features & History](docs/features.md)** - Detailed feature documentation
- **[Testing Guide](tests/README.md)** - How to write and run tests
- **[Changelog](CHANGELOG.md)** - Version history and updates

## 🛠️ Tech Stack

- **Runtime:** [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- **Frontend:** React 19 + TypeScript
- **UI:** Tailwind CSS + Radix UI
- **Visualization:** [XyFlow](https://xyflow.com/) (React Flow)
- **AI:** Google Gemini API
- **Testing:** Bun Test + [Playwright](https://playwright.dev/)

## 📝 Usage Examples

### Create a Process
```
Type: "Create a customer onboarding process"
→ AI generates nodes and edges
```

### Select and Modify
```
1. Click a node (see green glow)
2. Type: "Make this red"
→ Selected node turns red
```

### Multi-Node Operations
```
1. Shift+Click multiple nodes
2. Type: "Mark these as bottlenecks"
→ All selected nodes get red border + indicator
```

### Find by Name
```
Type: "Mark the approval step as complete"
→ AI finds "approval" node, marks it green
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Unit tests only
bun run test:unit

# E2E tests (requires dev server)
bun run test:e2e

# Full CI suite
bun run ci:full
```

**Test Results:** 16/16 passing ✅
- 11 unit tests
- 5 E2E tests

## 🏗️ Project Structure

```
ProcessXY/
├── src/
│   ├── components/       # React components
│   ├── types/           # TypeScript definitions
│   ├── index.ts         # Server + API
│   └── index.css        # Global styles
├── tests/               # Unit & E2E tests
├── docs/                # Documentation
└── .github/workflows/   # CI/CD
```

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test: `bun test`
4. Commit: `git commit -m "feat: add amazing feature"`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

See [Development Guide](docs/development.md) for details.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built with:
- [Bun](https://bun.sh) - JavaScript runtime
- [React](https://react.dev) - UI framework
- [XyFlow](https://xyflow.com) - Flow visualization
- [Playwright](https://playwright.dev) - E2E testing
- [Google Gemini](https://ai.google.dev) - AI capabilities

---

**Status:** ✅ Phase 1 Complete | **Version:** 0.1.0 | **Tests:** 16/16 Passing
