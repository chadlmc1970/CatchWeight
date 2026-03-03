# Development Workflow

## Branch Strategy

- `main` - Production branch (auto-deploys to Render)
- `develop` - Development branch (staging for features)
- `feature/*` - Feature branches (for individual changes)

## PR-Based Development Workflow

### 1. Start New Feature

```bash
# Make sure you're on main with latest changes
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes & Commit

```bash
# Make your code changes...

# Stage and commit
git add .
git commit -m "Description of changes"
```

### 3. Push Feature Branch

```bash
# Push to origin
git push origin feature/your-feature-name
```

### 4. Create Pull Request

```bash
# Using GitHub CLI
gh pr create --base main --head feature/your-feature-name \
  --title "Feature: Description" \
  --body "## Changes
- Change 1
- Change 2

## Testing
- Tested scenarios"
```

Or create PR via web:
- **SAP Repo**: https://github.tools.sap/I870089/CatchWeight/compare
- **Public Repo**: https://github.com/chadlmc1970/CatchWeight/compare

### 5. Review & Merge

1. Review the PR on GitHub
2. Check CI/CD status (if configured)
3. Merge PR when ready
4. Render will auto-deploy from `main`

### 6. Cleanup

```bash
# After PR is merged, delete the feature branch
git checkout main
git pull origin main
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Quick Commands Reference

```bash
# Check current branch
git branch

# List all branches
git branch -a

# Switch branches
git checkout <branch-name>

# View PR status
gh pr status

# List open PRs
gh pr list

# View specific PR
gh pr view <number>

# Merge PR from CLI
gh pr merge <number> --merge --delete-branch
```

## Deployment

- **Production URL**: https://catchweight-dashboard.onrender.com
- **Auto-deploy**: Merges to `main` trigger automatic Render deployment
- **Build time**: ~2-5 minutes

## Best Practices

1. ✅ Always work in feature branches
2. ✅ Write descriptive commit messages
3. ✅ Keep PRs focused and small
4. ✅ Test locally before pushing
5. ✅ Delete merged branches
6. ❌ Never push directly to `main` (use PRs instead)
