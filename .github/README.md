# GitHub Automation & CI/CD

This directory contains GitHub Actions workflows and documentation for automated testing and Claude Code integration.

## 📁 Contents

### Workflows
- **`ci.yml`** - Main CI/CD pipeline (runs on every push/PR)
- **`auto-fix.yml`** - Creates issues when CI fails
- **`claude-fix.yml`** - Manual trigger to invoke Claude Code for fixes

### Documentation
- **`CI_CD_SETUP.md`** - Complete setup guide for all workflows
- **`CLAUDE_AUTO_FIX_GUIDE.md`** - Guide for using Claude to auto-fix issues

## 🚀 Quick Start

### For Developers

**Check if your changes will pass CI:**
```bash
bun run ci
```

**Or run the full CI suite locally:**
```bash
bun run ci:full
```

### For Maintainers

**When CI fails:**
1. Check the auto-created GitHub issue
2. Open Claude Code
3. Say: "Fix issue #XX"
4. Review and merge Claude's PR

## 📋 What Happens Automatically

### On Every Push/PR:
✅ Code builds successfully
✅ Unit tests pass
✅ TypeScript compiles
✅ Code quality checks

### When Tests Fail:
✅ GitHub issue created automatically
✅ Failure logs attached
✅ Reproduction steps provided
✅ Ready for Claude Code to fix

## 🤖 Claude Code Integration

Three ways to use Claude for auto-fixing:

1. **Manual Chat** (Recommended)
   - Open Claude Code
   - Say: "Fix issue #XX"

2. **Manual Trigger**
   - Actions → Claude Code Auto-Fix → Run workflow

3. **Webhook** (Advanced)
   - See `CI_CD_SETUP.md` for setup

## 📚 Learn More

- [CI/CD Setup Guide](./CI_CD_SETUP.md) - Detailed setup instructions
- [Claude Auto-Fix Guide](./CLAUDE_AUTO_FIX_GUIDE.md) - How to use Claude for fixes
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## 🔧 Configuration

### Required Secrets
- `GOOGLE_API_KEY` - For E2E tests (optional)

### Optional Secrets
- `CLAUDE_WEBHOOK_URL` - For webhook integration (advanced)

### Permissions Required
- ✅ Read and write permissions (for creating issues)
- ✅ Workflows enabled

## ✅ Status

**Current Setup:**
- ✅ CI/CD pipeline active
- ✅ Auto-issue creation enabled
- ✅ Manual Claude trigger available
- ⏸️ E2E tests (needs API key)
- ⏸️ Webhook integration (not configured)

## 💡 Tips

**Run CI checks locally before pushing:**
```bash
bun run ci
```

**Watch tests while developing:**
```bash
bun run test:watch
```

**Check what CI will do:**
See `.github/workflows/ci.yml`

## 🐛 Issues?

If CI is failing:
1. Check the Actions tab
2. Review the issue created
3. Run `bun run ci` locally to reproduce
4. Ask Claude Code to help fix

---

**Need help?** Check the guides or open an issue!
