---
allowed-tools: Bash(git add*), Bash(git commit*), Bash(git status*), Bash(git diff*)
argument-hint: "[message]"
description: Create git commit without Claude credits
---

## Context
- Current git status: !`git status`
- Current branch: !`git branch --show-current`

## Your task
Create a git commit with all staged changes.

The commit message format should be:
```
<tipo>: <descripción>
```

Tipos: feat, fix, refactor, docs, chore, style, test

**IMPORTANT**: Do NOT include:
- "Generated with Claude Code"
- "Co-Authored-By Claude"
- Any AI or Claude attribution

Use $ARGUMENTS as the commit message if provided, otherwise generate an appropriate one based on the changes.
