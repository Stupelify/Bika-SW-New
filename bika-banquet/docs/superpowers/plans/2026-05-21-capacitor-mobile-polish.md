# Capacitor iOS + Android Mobile Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix iOS and Android Capacitor shell polish (safe areas, scroll, keyboard, system bars, back button, tap feedback) with automated mobile UI tests before merge.

**Architecture:** Shared `CapacitorNativeShell` client component + `lib/capacitor/nativeShell.ts` sync system chrome per theme/platform. CSS uses `html.capacitor-native` / `.capacitor-ios` / `.capacitor-android` — one scroll owner (`.dashboard-main`). Playwright simulates native classes on mobile viewports.

**Tech Stack:** Next.js 14, Capacitor 8, @capacitor/status-bar, keyboard, app, haptics, Playwright mobile-chrome + mobile-safari

**Subagents:** `.cursor/agents/capacitor-ios-polish.md`, `capacitor-android-polish.md`, `capacitor-mobile-qa.md`

---

## Pre-flight (QA agent runs first)

- [ ] Run `npm run test:e2e:capacitor` in `client/` — baseline failures documented
- [ ] Manual: Safari Web Inspector on iOS device + Chrome remote debug on Android (post-implementation)

---

### Task 1: Native shell + plugins

**Files:**
- Create: `client/src/lib/capacitor/nativeShell.ts`
- Create: `client/src/components/CapacitorNativeShell.tsx`
- Modify: `client/src/app/layout.tsx`
- Modify: `client/package.json` (deps added)
- Modify: `client/capacitor.config.ts`

- [ ] Install `@capacitor/status-bar`, `keyboard`, `app`, `haptics`
- [ ] `CapacitorNativeShell` adds `capacitor-native`, `capacitor-ios`/`capacitor-android` on `<html>`
- [ ] Theme observer → `syncSystemChrome(theme, platform)`
- [ ] Android: hardware back closes overlay (modal/sidebar) via `data-capacitor-overlay`
- [ ] Keyboard plugin sets `--keyboard-offset` CSS var

---

### Task 2: Scroll architecture + CSS

**Files:**
- Modify: `client/src/app/mobile.css`
- Modify: `client/src/app/globals.css`
- Modify: `client/src/components/IonicProvider.tsx`
- Modify: `client/src/components/FormPromptModal.tsx`

- [ ] Native: `html/body` overflow hidden; scroll only `.dashboard-main`
- [ ] Native mobile: fixed `.dashboard-header` + top padding on `.content-wrapper`
- [ ] `.capacitor-native .input` font-size 16px (all widths)
- [ ] Modal: remove `transform-gpu`, add scroll-touch class, `data-capacitor-overlay="open"`
- [ ] Press feedback: `.capacitor-native .btn:active`, nav items

---

### Task 3: Viewport + config

**Files:**
- Modify: `client/src/app/layout.tsx` (viewport `interactiveWidget`)
- Modify: `client/capacitor.config.ts` (`android`, `Keyboard` plugin)

---

### Task 4: Playwright mobile UI tests (QA gate)

**Files:**
- Create: `client/e2e/capacitor-mobile/native-shell.spec.ts`
- Create: `client/e2e/capacitor-mobile/_helpers.ts`
- Create: `client/playwright.capacitor.config.ts`
- Modify: `client/package.json` script `test:e2e:capacitor`

- [ ] Tests inject `capacitor-native` + platform class
- [ ] Assert header safe padding, input 16px, body scroll lock, modal overlay attr
- [ ] Projects: mobile-chrome (Android sim), mobile-safari (iOS sim)

---

### Task 5: Native sync (human)

- [ ] `npx cap sync ios` and `npx cap sync android`
- [ ] Rebuild in Xcode / Android Studio
- [ ] Verify 10-issue checklist from brainstorm on real devices

---

## Issue → fix map

| Issue | iOS | Android | Fix |
|-------|-----|---------|-----|
| Under notch | ✓ | ✓ | safe-top + fixed header |
| Status bar invisible | ✓ | ✓ | StatusBar plugin + theme sync |
| Header jump | ✓ | ✓ | fixed header, single scroll |
| No momentum | ✓ | ✓ | `-webkit-overflow-scrolling` on main |
| Modal scroll | ✓ | ✓ | modal CSS + keyboard offset |
| Keyboard covers field | ✓ | ✓ | Keyboard plugin + resize body |
| No tap feedback | ✓ | ✓ | :active + haptics |
| Input zoom | ✓ | rare | 16px on `.capacitor-native` |
| Back button | — | ✓ | App backButton listener |
| Nav bar contrast | — | ✓ | StatusBar bg on Android |
