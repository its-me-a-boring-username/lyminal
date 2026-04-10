# Lyminal Regression Checklist

Use this before merging to `launch-ready`.

## Core Flows

- [ ] `welcome -> intro -> spheres -> goals -> connections -> results -> chart` runs without dead ends.
- [ ] Focus/action flow creates an active goal and lands in `active`.
- [ ] `progress` renders correctly and can navigate to `goal-picker`.
- [ ] `plan` renders correctly for paid users and keeps left strip at `350px`.
- [ ] `chart-view`, `account`, and `chat` tabs still route correctly.

## Paywall Checks

- [ ] Free users see lock styling on **Download Full Report**.
- [ ] Free users cannot add a second goal from `active`.
- [ ] Free users cannot add a second goal from `progress`.
- [ ] Free users see the Plan paywall screen.
- [ ] Paid users can access Plan and can add goals up to 5 max.
- [ ] Paid users are blocked from adding a 6th goal in both `active` and `progress`.

## Persistence Checks

- [ ] Add/edit/remove action items and refresh: state persists locally.
- [ ] Mark items complete and refresh: completion state persists.
- [ ] Reset chart clears local state and server state (when logged in).
- [ ] Logged-out chart/report prompts still appear at expected checkpoints.

## Chat/Lyme Checks

- [ ] Standard chat flow proposes items and supports **Save & finish**.
- [ ] Tester shortcut works: if user says they are testing and asks for generated action items, Lyme returns final savable format immediately.
- [ ] Saved action items appear back on `active`/`plan` as expected.

## Visual/UX Checks

- [ ] Desktop left strip remains exactly `350px` on screens that use it.
- [ ] Plan strip color follows selected goal sphere color.
- [ ] Mobile bottom nav does not overlap key action controls.
- [ ] No broken glyphs/encoding artifacts in critical CTAs.

## Quick Commands

```bash
npm run dev
# If environment allows:
npm run build
```
