# Net Studio - To-Do

Track work across sessions. Update status as tasks progress.

## Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[-]` Blocked/Deferred

---

## Current Sprint

### Setup
- [x] Project scaffolding (Next.js + TypeScript + Tailwind)
- [x] API client setup
- [x] Auth integration (reads from ~/.nimrobo/config.json)
- [x] Theme system (light/dark mode via theme.css)
- [x] Left sidebar navigation layout

### User
- [x] Profile view page
- [x] Profile edit form
- [x] My applications list
- [x] Activity summary dashboard (on home page)

### Organization
- [x] Org list/search page
- [x] Org detail page
- [x] Org create form
- [x] Org settings/edit page
- [x] Member management UI
- [x] Invite management UI
- [x] Join request handling

### Post
- [x] Post list/search page
- [x] Post detail page
- [x] Post create form
- [x] Post edit form
- [x] Application submission flow
- [x] Applications review UI (for post owners)

### Messages
- [x] Channel list page
- [x] Channel/conversation view
- [x] Message compose
- [x] Read status indicators

---

## Backlog

- [ ] Batch application actions UI
- [ ] Advanced post filters UI
- [ ] Notification system
- [ ] Mobile responsive polish

---

## Notes

### Session 2025-01-31
- Completed initial implementation of all core features
- UI uses left sidebar navigation
- Light/dark theme support via CSS variables (theme.css)
- API token loaded from ~/.nimrobo/config.json (same as CLI)
- Build passes successfully
