# CI/CD Pipeline & Claude Code Auto-Fix Setup

## 📋 Overview

This repository has three automated workflows:

1. **`ci.yml`** - Main CI/CD pipeline (tests, builds, type checks)
2. **`auto-fix.yml`** - Automatically creates GitHub issues when tests fail
3. **`claude-fix.yml`** - Triggers Claude Code to automatically fix issues

---

## 🚀 Quick Start

### Prerequisites

- GitHub repository with Actions enabled
- Bun installed (for local testing)
- Google Gemini API key (for E2E tests)

### Setup Steps

1. **Configure GitHub Secrets**
   - Go to: `Settings` → `Secrets and variables` → `Actions`
   - Add secret: `GOOGLE_API_KEY` (your Gemini API key)
   - Optional: `CLAUDE_WEBHOOK_URL` (for webhook integration)

2. **Enable GitHub Actions**
   - The workflows will run automatically on push and PR

3. **Test the Setup**
   ```bash
   git push origin your-branch
   # Check Actions tab on GitHub
   ```

---

## 🔧 Workflow Details

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to any branch
- Pull request to any branch
- Manual trigger via `workflow_dispatch`

**Jobs:**
- ✅ **Build & Test**: Installs dependencies, builds, runs unit tests
- ✅ **Type Check**: Runs TypeScript type checking
- ✅ **Code Quality**: Checks for console.logs, TODOs
- ✅ **Dependency Check**: Checks for outdated packages
- ✅ **Summary**: Creates test summary in PR

**E2E Tests:**
- Run only if `GOOGLE_API_KEY` secret is configured
- Starts dev server automatically
- Runs Stagehand browser automation tests

**Example Run:**
```bash
# Locally replicate what CI does
bun install
bun run build
bun run test:unit
bunx tsc --noEmit
```

---

### 2. Auto-Fix Issue Creation (`auto-fix.yml`)

**Triggers:**
- When CI/CD pipeline fails

**What it does:**
1. ✅ Detects CI/CD failure
2. ✅ Checks if issue already exists (avoids duplicates)
3. ✅ Creates GitHub issue with failure details
4. ✅ Adds labels: `automated-fix`, `ci-failure`, `bug`
5. ✅ Comments with logs and reproduction steps

**Example Issue Created:**
```markdown
## 🔴 CI/CD Pipeline Failed on feature-branch

**Details:**
- Workflow Run: #123
- Commit: abc123
- Branch: feature-branch

**Action Items:**
- [ ] Review test failures
- [ ] Fix failing tests
- [ ] Push fixes

### 🤖 Auto-Fix with Claude Code
...
```

---

### 3. Claude Code Auto-Fix (`claude-fix.yml`)

**Triggers:**
- Manual trigger via GitHub Actions UI

**Inputs:**
- `issue_number`: Issue number to fix
- `branch_name`: Optional custom branch name

**What it does:**
1. ✅ Fetches issue details
2. ✅ Generates fix branch name (e.g., `claude/auto-fix-issue-42-1234567890`)
3. ✅ Creates instructions for Claude Code
4. ✅ Comments on issue with status
5. ✅ Optionally triggers webhook (if configured)

**How to trigger:**
1. Go to: `Actions` → `Claude Code Auto-Fix`
2. Click `Run workflow`
3. Enter issue number
4. Click `Run workflow`

---

## 🤖 Integrating with Claude Code

There are **three ways** to use Claude Code for auto-fixing:

### Option 1: Manual (Recommended for now)

**When tests fail:**
1. Check the GitHub issue created automatically
2. Open this repo in Claude Code
3. In chat, say:
   ```
   Please fix issue #42
   ```
4. Claude will:
   - Read the issue
   - Analyze the failure logs
   - Identify the problem
   - Fix the code
   - Run tests
   - Commit and push

**Advantages:**
- ✅ Full control over fixes
- ✅ Review changes before committing
- ✅ No additional setup required

---

### Option 2: GitHub Actions Manual Trigger

**When tests fail:**
1. Go to `Actions` → `Claude Code Auto-Fix`
2. Click `Run workflow`
3. Enter the issue number
4. Open Claude Code and reference the branch
5. Claude fixes the issue on the specified branch

**Advantages:**
- ✅ Creates dedicated fix branch
- ✅ Structured process
- ✅ Easy to track

**Workflow:**
```
CI Fails → Issue Created → Manual Trigger → Claude Fixes → PR Created
```

---

### Option 3: Webhook Integration (Advanced)

**Fully automated:** CI fails → Issue created → Claude automatically fixes

**Setup Required:**

1. **Create a webhook endpoint** that:
   - Receives GitHub webhook events
   - Triggers Claude Code API
   - Monitors fix progress

2. **Configure webhook in GitHub:**
   - Go to: `Settings` → `Webhooks`
   - Add webhook URL
   - Select events: `Issues`, `Workflow runs`

3. **Add webhook secret to GitHub:**
   - `Settings` → `Secrets` → `CLAUDE_WEBHOOK_URL`

4. **Example webhook payload:**
   ```json
   {
     "event": "auto-fix-requested",
     "repository": "user/repo",
     "issue_number": 42,
     "branch": "claude/auto-fix-issue-42",
     "issue_title": "CI/CD Pipeline Failed"
   }
   ```

**Webhook endpoint requirements:**
- Must be publicly accessible (HTTPS)
- Should authenticate requests
- Should trigger Claude Code API
- Should report progress back to GitHub

**Note:** This requires additional infrastructure setup.

---

## 📊 Monitoring & Status

### View CI/CD Status

**In GitHub:**
- Go to `Actions` tab
- See all workflow runs
- Check status badges (if added to README)

**In Pull Requests:**
- CI checks appear automatically
- Green ✅ = All tests pass
- Red ❌ = Tests failed (issue will be created)

### Status Badge (Optional)

Add to `README.md`:
```markdown
[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/ProcessXY/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ProcessXY/actions/workflows/ci.yml)
```

---

## 🔍 Troubleshooting

### Tests Failing in CI but Pass Locally

**Common causes:**
1. Missing environment variables
   - Solution: Add to GitHub Secrets

2. Different Bun versions
   - Solution: Lock Bun version in workflow

3. Cached dependencies
   - Solution: Clear cache or reinstall

**Debug steps:**
```bash
# Replicate CI environment locally
rm -rf node_modules bun.lockb
bun install
bun run build
bun run test:unit
```

### E2E Tests Timing Out

**Causes:**
- Server takes too long to start
- Network issues
- Stagehand timeout

**Solutions:**
1. Increase timeout in `ci.yml`:
   ```yaml
   timeout 60 bash -c '...'  # Increase from 30 to 60
   ```

2. Skip E2E in CI (run locally only):
   - Remove `GOOGLE_API_KEY` secret

### Issue Not Created on Failure

**Check:**
1. Workflow permissions
   - `Settings` → `Actions` → `General`
   - Enable: `Read and write permissions`

2. Workflow file syntax
   - Use YAML validator

3. Event triggers
   - Ensure `workflow_run` is configured correctly

---

## 🛠️ Customization

### Add More Checks

Edit `.github/workflows/ci.yml`:

```yaml
- name: Custom check
  run: |
    # Your custom command
    bun run custom-script
```

### Change Test Timeout

```yaml
- name: Run E2E tests
  timeout-minutes: 10  # Increase from default 5
  run: bun run test:e2e
```

### Add Slack Notifications

1. Create Slack webhook
2. Add to GitHub Secrets: `SLACK_WEBHOOK_URL`
3. Add step to workflow:

```yaml
- name: Notify Slack
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"Tests failed on ${{ github.ref }}"}'
```

### Add Deploy Step (After Tests Pass)

```yaml
deploy:
  needs: build-and-test
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to production
      run: |
        # Your deployment script
```

---

## 📈 Best Practices

### For CI/CD

1. **Keep tests fast**
   - Unit tests < 30 seconds
   - E2E tests < 5 minutes

2. **Cache dependencies**
   - Bun automatically caches

3. **Run tests in parallel**
   - Already configured in workflows

4. **Use meaningful commit messages**
   - CI status shows in commits

### For Auto-Fix Integration

1. **Review Claude's fixes before merging**
   - Always check the PR diff

2. **Test locally first**
   - Run `bun test` before pushing

3. **Close issues promptly**
   - After merging fix PR

4. **Monitor auto-fix success rate**
   - Track which issues Claude fixes successfully

---

## 🚦 Current Status

**Implemented:**
- ✅ CI/CD pipeline with unit tests
- ✅ Build verification
- ✅ Type checking
- ✅ Auto issue creation on failure
- ✅ Manual Claude Code trigger workflow
- ✅ Test summaries in PRs

**Optional (Not Implemented):**
- ⏸️ E2E tests (requires API key)
- ⏸️ Webhook integration (requires infrastructure)
- ⏸️ Deployment pipeline (requires hosting)
- ⏸️ Slack/Discord notifications

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Bun Test Runner](https://bun.sh/docs/cli/test)
- [Stagehand Testing](https://docs.stagehand.dev)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)

---

## 💡 Example Workflow

**Scenario:** You push code with a bug

```
1. Push code to GitHub
   ↓
2. CI/CD runs automatically
   ↓
3. Tests fail ❌
   ↓
4. Issue #42 created automatically
   ↓
5. You get notification
   ↓
6. Option A: Fix manually
   - Fix code
   - Push
   - CI runs again
   - Tests pass ✅
   - Issue auto-closes

7. Option B: Use Claude Code
   - Open Claude Code
   - Say: "Fix issue #42"
   - Claude analyzes and fixes
   - Claude commits and pushes
   - CI runs again
   - Tests pass ✅
   - Claude creates PR
   - You review and merge
   - Issue auto-closes
```

---

**Questions?** Open an issue or check the workflow files for more details!
