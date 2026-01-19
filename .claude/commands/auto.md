---
description: Auto-detect the appropriate role based on your task description
---

# Auto-Detect Role

This command triggers automatic role detection based on your next message.

## How It Works

1. Describe what you want to do
2. The system analyzes your request
3. The appropriate role is selected and activated
4. Work proceeds with auto-handover when complete

## Detection Keywords

| Keywords | Role |
|----------|------|
| UI, page, component, dashboard, design, CSS, responsive | **Frontend** |
| API, database, endpoint, Supabase, query, integration | **Backend** |
| Prompt, Claude, Gemini, AI, hooks, voice, content quality | **AI** |
| Brand voice, platform rules, engagement, content strategy | **Strategist** |
| Test, verify, merge, deploy, ship, broken, bug | **QA** |
| CI/CD, GitHub Actions, deployment, environment | **DevOps** |
| End-to-end, full feature, both UI and API | **Full Stack** |

## Example Usage

```
You: "Build the calendar page that shows scheduled posts"

System:
→ Detected: Full Stack (spans UI + API)
→ Adopting role...
→ [Work proceeds]
→ [Auto-hands to QA when complete]
```

## Parallel Sessions

When running multiple sessions:
- Each session auto-detects its role
- Each works on its own branch
- Say "ship it" or "merge everything" to trigger QA merge

## What's Next?

Just describe what you want to build or fix, and the system will handle the rest.
