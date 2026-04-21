# Lyminal Default Theme Spec (Lock Baseline)

This spec defines the default visual system we preserve while migrating to semantic tokens.
Source baseline is the current `warm_earth` aesthetic.

## 1) Base Tokens (Raw Palette)

These are not used directly in components once migration is complete.

- `--ly-base-bg-page`: `#faf8f5`
- `--ly-base-ink-strong`: `#1c1410`
- `--ly-base-ink`: `#4a3828`
- `--ly-base-ink-muted`: `#5c4e40`
- `--ly-base-ink-faint`: `#6e5c4a`
- `--ly-base-ink-subtle`: `#8a7455`
- `--ly-base-accent`: `#b5472a`
- `--ly-base-accent-rgb`: `181,71,42`
- `--ly-base-accent-2`: `#4a7a72`
- `--ly-base-danger`: `#9b2a2a`
- `--ly-base-white`: `#ffffff`

## 2) Semantic Tokens (Component-facing)

These are the tokens components should consume.

### Page and surfaces

- `--ly-surface-page`: `#faf8f5`
- `--ly-surface-panel`: `#ffffff`
- `--ly-surface-panel-muted`: `#faf8f5`
- `--ly-surface-overlay`: `rgba(28,20,16,0.5)`
- `--ly-surface-header-tint`: `rgba(var(--ly-base-accent-rgb), 0.07)`

### Text

- `--ly-text-primary`: `#1c1410`
- `--ly-text-secondary`: `#4a3828`
- `--ly-text-muted`: `#5c4e40`
- `--ly-text-subtle`: `#6e5c4a`
- `--ly-text-faint`: `#8a7455`
- `--ly-text-inverse`: `#ffffff`
- `--ly-text-accent`: `#b5472a`
- `--ly-text-danger`: `#9b2a2a`

### Borders and dividers

- `--ly-border-default`: `#e8e0d5`
- `--ly-border-soft`: `#f0ebe3`
- `--ly-border-input`: `#d4c9bb`
- `--ly-border-danger`: `#e8aaaa`
- `--ly-border-accent-soft`: `rgba(var(--ly-base-accent-rgb), 0.12)`
- `--ly-border-accent-mid`: `rgba(var(--ly-base-accent-rgb), 0.18)`
- `--ly-border-accent-strong`: `rgba(var(--ly-base-accent-rgb), 0.40)`

### Interactive / buttons

- `--ly-btn-primary-bg`: `#b5472a`
- `--ly-btn-primary-fg`: `#ffffff`
- `--ly-btn-secondary-fg`: `#5c4e40`
- `--ly-btn-secondary-border`: `#d4c9bb`
- `--ly-btn-tertiary-fg`: `#8a7455`
- `--ly-btn-danger-bg`: `#9b2a2a`
- `--ly-btn-danger-fg`: `#ffffff`

### Status / type chips

- `--ly-status-forward-fg`: `#8a5a44`
- `--ly-status-forward-bg`: `#f7f0ec`
- `--ly-status-forward-border`: `#d4a890`
- `--ly-status-schedule-fg`: `#4a7a72`
- `--ly-status-schedule-bg`: `#edf4f1`
- `--ly-status-schedule-border`: `#9fd4c4`
- `--ly-status-find-fg`: `#5c6f9b`
- `--ly-status-find-bg`: `#eef0f6`
- `--ly-status-find-border`: `#b0bcd8`
- `--ly-status-none-fg`: `#6e5c4a`
- `--ly-status-none-bg`: `#f5f2ee`
- `--ly-status-none-border`: `#d4c9bb`

## 3) Current Global Theme System vs Target

Current implementation defines only:

- `--ly-bg`
- `--ly-ink`
- `--ly-accent`
- `--ly-accent-rgb`
- `--ly-accent2`

Target implementation should:

- Keep existing 5 vars for compatibility
- Add semantic vars above
- Have each theme map every semantic var (or inherit from default map)

## 4) Migration Priority (No Visual Change Pass)

Migrate these first to semantic tokens:

1. `src/components/PlanScreen.jsx`
2. `src/components/ChartView.jsx`
3. `src/components/ActiveScreen.jsx`
4. `src/components/ResultsFlow.jsx`
5. `src/components/FlowScreens.jsx`
6. `src/components/IntroScreens.jsx`
7. `src/components/WelcomeScreen.jsx`
8. `src/components/AccountScreen.jsx`
9. `src/components/Nav.jsx`

## 5) Lock Rule (Safety)

During the migration pass:

- Do not alter spacing, sizes, layout, or behavior.
- Replace only color literals with semantic vars.
- Any missing token must fall back to this default spec value.

