# Session Handoff Documentation

Use this command to document your current session state for passing work to another role.

## Instructions

Please provide the following information to create a handoff document:

### 1. Current Role
What role were you working as? (ai, strategist, frontend, backend, fullstack, qa, devops)

### 2. Work Summary
What did you accomplish in this session?
- List completed tasks
- List files modified

### 3. Current State
- **Completed**: What's done and working?
- **In Progress**: What's partially done?
- **Blocked**: What couldn't be completed and why?

### 4. Files Changed
List all files that were added, modified, or deleted:
```
Modified: src/path/to/file.ts
Added: src/new/file.ts
Deleted: src/old/file.ts
```

### 5. Git Status
- Last commit message
- Pushed to main? (yes/no)
- Any uncommitted changes?

### 6. Open Questions
Any decisions that need to be made or questions for the user?

### 7. Recommended Next Role
Which role should pick up this work? Why?

### 8. Next Steps
What should the next session focus on?

---

## Handoff Template

Copy and fill out:

```markdown
# Handoff: [Brief Description]

**From Role:** [role name]
**Date:** [date]
**Recommended Next Role:** [role name]

## Completed
- [task 1]
- [task 2]

## In Progress
- [task]: [current state]

## Blocked
- [task]: [reason]

## Files Changed
- Modified: [file]
- Added: [file]

## Git Status
- Last commit: "[message]"
- Pushed: yes/no

## Open Questions
1. [question]

## Next Steps
1. [step]
2. [step]

## Notes for Next Session
[Any context, gotchas, or tips]
```

---

When you're ready to create your handoff, fill out the template above with your session details.
