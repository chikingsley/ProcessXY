# 🤖 Claude Code Auto-Fix Guide

## How to Get Claude to Automatically Come Back and Fix Issues

This guide explains how to set up Claude Code to automatically detect and fix issues in your codebase.

---

## 🎯 Three Methods (Easiest to Most Advanced)

### Method 1: Manual Chat (Easiest - Available Now!)

**When CI fails and creates an issue:**

1. **Open Claude Code in this repository**
2. **In the chat, simply say:**
   ```
   Please analyze and fix issue #42
   ```
   or
   ```
   The CI pipeline failed. Can you check what went wrong and fix it?
   ```

**What Claude will do:**
1. ✅ Read the GitHub issue
2. ✅ Analyze the failure logs
3. ✅ Identify the root cause
4. ✅ Fix the code
5. ✅ Run tests to verify
6. ✅ Commit the changes
7. ✅ Push to the branch
8. ✅ Create a pull request

**Advantages:**
- ✅ Works immediately (no setup)
- ✅ Full control and visibility
- ✅ Can ask follow-up questions
- ✅ Review before committing

**Example conversation:**
```
You: "Tests are failing on branch feature-xyz. Can you fix it?"

Claude: "I'll analyze the test failures and fix them. Let me:
1. Check the failing tests
2. Identify the issue
3. Fix the code
4. Verify the fix
..."

[Claude analyzes, fixes, and commits]

Claude: "I've fixed the issue. The problem was X, and I've:
- Fixed file.ts
- Updated the tests
- Verified all tests pass
- Committed and pushed to feature-xyz
Ready to merge!"
```

---

### Method 2: GitHub Actions Manual Trigger (Structured Approach)

**When an issue is created:**

1. **Go to GitHub Actions tab**
2. **Click "Claude Code Auto-Fix" workflow**
3. **Click "Run workflow"**
4. **Enter issue number**
5. **Click "Run workflow"**

**What happens:**
1. ✅ Workflow creates a dedicated fix branch
2. ✅ Adds detailed instructions to the issue
3. ✅ You open Claude Code and reference the branch
4. ✅ Claude fixes on that specific branch
5. ✅ Creates PR automatically

**Advantages:**
- ✅ Organized (dedicated branch per fix)
- ✅ Easy to track
- ✅ Clear audit trail

---

### Method 3: Fully Automated Webhook (Advanced - Requires Setup)

**Fully hands-off:** CI fails → Issue created → Claude automatically fixes → PR created

**This requires:**
1. A webhook server to receive GitHub events
2. Claude API integration
3. Custom orchestration logic

**Architecture:**
```
GitHub CI Fails
    ↓
Auto-creates Issue
    ↓
Webhook triggers
    ↓
Webhook server calls Claude API
    ↓
Claude analyzes and fixes
    ↓
Commits to fix branch
    ↓
Creates PR
    ↓
You review and merge
```

**Setup Guide:** (See "Advanced Webhook Setup" section below)

---

## 🚀 Recommended Workflow (Method 1)

For most teams, **Method 1 (Manual Chat)** is the best approach because:

1. **It's available immediately** - No additional setup
2. **You maintain control** - Review changes before they're committed
3. **It's flexible** - Can handle any type of issue
4. **It's interactive** - Ask follow-up questions

### Daily Workflow with Claude

**Morning routine:**
```bash
# Check for any CI failures
gh issue list --label "ci-failure"

# If issues exist, open Claude Code
# In chat:
"Can you review and fix all open CI failure issues?"
```

**Claude will:**
- Review all open issues
- Prioritize based on severity
- Fix each one systematically
- Report progress
- Create PRs for each fix

### Setting Up Notifications

**Get notified when tests fail:**

1. **GitHub email notifications:**
   - Already enabled by default
   - You'll get emails when Actions fail

2. **GitHub mobile app:**
   - Install GitHub app
   - Enable push notifications
   - Get instant alerts

3. **Watch the repository:**
   - Go to repo page → Click "Watch" → "All Activity"

4. **Slack/Discord (optional):**
   - Add webhook to `.github/workflows/ci.yml`
   - Get notifications in team chat

---

## 💬 Common Claude Code Commands

### For Fixing Issues

```
"Fix issue #42"
"Analyze the test failures and fix them"
"The CI pipeline failed on branch X, please fix"
"Review the latest failing test and correct the code"
```

### For Preventive Maintenance

```
"Run all tests and fix any that fail"
"Check for any TypeScript errors and fix them"
"Review the code quality and suggest improvements"
"Update outdated dependencies and fix breaking changes"
```

### For Investigation

```
"Why did the tests fail?"
"What's causing the build error?"
"Analyze the error logs from the CI run"
"Compare the working branch with the failing branch"
```

---

## 🔧 Advanced Webhook Setup (Method 3)

**Warning:** This is complex and requires infrastructure setup.

### Architecture Components

1. **Webhook Server** (Node.js/Bun)
2. **Claude API Integration**
3. **GitHub API Client**
4. **Queue System** (optional, for multiple concurrent fixes)

### Step 1: Create Webhook Server

```typescript
// webhook-server.ts
import { serve } from "bun";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

serve({
  port: 3001,
  async fetch(req) {
    if (req.method === "POST" && new URL(req.url).pathname === "/webhook") {
      const payload = await req.json();

      // Verify GitHub signature (important!)
      const signature = req.headers.get("x-hub-signature-256");
      if (!verifyGitHubSignature(signature, payload)) {
        return new Response("Unauthorized", { status: 401 });
      }

      // Handle issue creation event
      if (payload.action === "opened" && payload.issue?.labels?.some(l => l.name === "ci-failure")) {
        await triggerClaudeFix(payload.issue);
      }

      return new Response("OK");
    }
    return new Response("Not Found", { status: 404 });
  }
});

async function triggerClaudeFix(issue) {
  // Implementation details...
  // This would use Claude API to analyze and fix the issue
}
```

### Step 2: Deploy Webhook Server

**Options:**
1. **Fly.io** (Recommended)
   ```bash
   flyctl launch
   flyctl deploy
   ```

2. **Railway**
3. **Vercel** (serverless)
4. **AWS Lambda**

### Step 3: Configure GitHub Webhook

1. Go to repo `Settings` → `Webhooks`
2. Add webhook URL: `https://your-server.com/webhook`
3. Select events: `Issues`, `Workflow runs`
4. Add secret for verification

### Step 4: Implement Claude Integration

```typescript
async function fixIssueWithClaude(issue) {
  const prompt = `
  A CI/CD pipeline has failed with the following issue:

  Title: ${issue.title}
  Body: ${issue.body}

  Please:
  1. Analyze the failure
  2. Identify the root cause
  3. Provide the fix as code changes
  4. Explain what was wrong

  Return a JSON with:
  {
    "analysis": "...",
    "files_to_change": [
      {"path": "...", "content": "..."}
    ],
    "explanation": "..."
  }
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4.5-20250929",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }]
  });

  // Parse response and apply changes
  // Commit and push
  // Create PR
}
```

**Note:** This is a simplified example. Real implementation needs:
- Error handling
- Retry logic
- Progress tracking
- Security considerations
- Testing

---

## 📊 Comparison of Methods

| Feature | Method 1 (Manual) | Method 2 (Triggered) | Method 3 (Webhook) |
|---------|------------------|---------------------|-------------------|
| Setup Time | 0 minutes | 5 minutes | 2-4 hours |
| Control | Full | Full | Partial |
| Speed | On-demand | On-demand | Automatic |
| Cost | Free | Free | Server costs |
| Reliability | High | High | Medium |
| Flexibility | Highest | High | Medium |
| **Recommended** | ✅ **Yes** | ⚠️ Optional | ⏸️ Advanced only |

---

## 🎯 Best Practices

### When Using Claude to Fix Issues

1. **Always review the changes** before merging
2. **Test locally** if the fix seems complex
3. **Ask Claude to explain** what was wrong
4. **Check for side effects** in related code
5. **Update tests** if behavior changed

### When to Use Each Method

**Use Manual (Method 1) when:**
- Learning the codebase
- Complex issues requiring discussion
- Security-sensitive changes
- You want to understand the fix

**Use Triggered (Method 2) when:**
- Multiple issues to fix
- Team collaboration needed
- Clear issue separation wanted
- Audit trail important

**Use Webhook (Method 3) when:**
- High volume of issues
- Quick turnaround critical
- Team has DevOps expertise
- Budget for infrastructure

---

## 🐛 Troubleshooting

### Claude Can't Access Issue

**Problem:** Claude says "I can't access that issue"

**Solutions:**
1. Make sure the issue is public
2. Provide the full issue URL
3. Copy the issue content directly to chat

### Claude's Fix Doesn't Work

**Problem:** Tests still fail after Claude's fix

**Solutions:**
1. Ask Claude to review the test output
2. Run tests locally and share results
3. Ask Claude to try a different approach
4. Break the problem into smaller parts

### Too Many Issues

**Problem:** Overwhelmed by CI failure issues

**Solutions:**
1. Ask Claude: "Prioritize and fix the most critical issues first"
2. Focus on one branch at a time
3. Consider temporarily disabling some checks
4. Improve test reliability

---

## 📚 Example Scenarios

### Scenario 1: Type Error

**Issue:** TypeScript compilation fails

**You:**
```
The build is failing with a TypeScript error. Can you fix it?
```

**Claude:**
```
I'll check the TypeScript errors and fix them.
[Analyzes error]
The issue is in src/components/CustomNode.tsx - there's a type mismatch.
[Fixes the code]
[Runs tsc --noEmit]
Fixed! All type errors resolved.
```

### Scenario 2: Test Failures

**Issue:** Unit tests fail after refactoring

**You:**
```
Several unit tests are failing after my refactoring. Can you update them?
```

**Claude:**
```
I'll review the failing tests and update them to match the refactored code.
[Analyzes tests]
The tests are expecting the old API. I'll update them.
[Updates tests]
[Runs bun test]
All tests passing now!
```

### Scenario 3: Dependency Issue

**Issue:** Build fails after updating dependencies

**You:**
```
The build broke after I updated React. Can you fix the breaking changes?
```

**Claude:**
```
I'll identify the breaking changes and update the code accordingly.
[Analyzes changes]
React 19 changed how refs work. I'll update the affected components.
[Fixes components]
[Tests build]
Build successful!
```

---

## 🎉 Success Stories

**What teams are doing:**

1. **Morning Fix Sessions**
   - Developer opens Claude Code
   - "Fix all CI failures from overnight"
   - Claude systematically fixes all issues
   - Developer reviews and merges PRs

2. **Pre-Merge Checks**
   - Before merging, ask Claude: "Review this PR for issues"
   - Claude catches problems before they hit CI
   - Saves CI runtime and resources

3. **Refactoring Assistance**
   - Major refactoring breaks tests
   - Claude updates all affected tests
   - Speeds up refactoring by 10x

---

## 🚀 Getting Started Today

**Right now, you can:**

1. **Open Claude Code in this repository**
2. **Try it out:**
   ```
   "Run the unit tests and tell me if anything fails"
   ```
3. **If something fails:**
   ```
   "Fix the failing tests"
   ```
4. **Done!**

No setup required. Just start chatting with Claude!

---

**Questions?** Just ask Claude: "How do I set up auto-fix for my CI pipeline?"
