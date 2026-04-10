# Lyminal Development Guardrails

These are lightweight constraints to keep shipping velocity high while avoiding regressions.

## 1) Keep Feature Work Modular

- Prefer adding/updating files in `src/components` and `src/utils`.
- Treat `src/App.jsx` as orchestration only (routing/state wiring).
- Avoid adding feature logic directly in `App.jsx` unless unavoidable.
- If a component needs shared behavior, move it to `src/utils` instead of deep prop threading.

## 2) Minimize Risky Surface Area

- Touch the smallest number of files needed for the task.
- Keep diffs narrow: one behavior change per patch when possible.
- Preserve established layout invariants (especially desktop left strip width `350px`).
- Preserve existing paywall decision points unless explicitly changing product rules.

## 3) Hotspot Rules

- For chat parsing, support both `\n` and `\r\n` line endings in formatted payloads.
- For goal-selection UIs, always guard index access against array length changes.
- For route-level changes, verify all nav tabs and flow steps still resolve.

## 4) Done Criteria for Each Change

- Behavior works in the target screen.
- No obvious regression in adjacent screens.
- Relevant items in `docs/REGRESSION_CHECKLIST.md` are checked.
- `git status` includes only intentional files.
