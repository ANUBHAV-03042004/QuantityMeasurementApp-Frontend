# 🐲 Quantra — Quantity Measurement Frontend

> A dragon-themed measurement studio — compare, convert, and perform arithmetic on physical quantities across length, weight, volume, and temperature.

**Live Deployments**
- 🌐 Angular (Vercel): [quantity-measurement-app-frontend-tawny.vercel.app](https://quantity-measurement-app-frontend-tawny.vercel.app)
- 📄 HTML/CSS/JS (GitHub Pages): [anubhav-03042004.github.io/QuantityMeasurementApp-Frontend](https://anubhav-03042004.github.io/QuantityMeasurementApp-Frontend)

**Backend API**: `https://dpvh78pj77mvc.cloudfront.net/api/v1`

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Branch Structure](#-branch-structure)
- [Branch Details](#-branch-details)
  - [main](#1-main)
  - [feature/QM-with-typescript-and-angular](#2-featureqm-with-typescript-and-angular)
  - [feature/QM-with-html-css-js](#3-featureqm-with-html-css-js)
  - [dev](#4-dev)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Pages & Routes](#-pages--routes)
- [Authentication Flow](#-authentication-flow)

---

## 🏰 Project Overview

Quantra is a full-stack measurement application with two complete frontend implementations — one built with **Angular 18** (TypeScript) and one with **vanilla HTML/CSS/JavaScript**. Both frontends communicate with the same Spring Boot backend API deployed on AWS Elastic Beanstalk behind CloudFront.

---

## 🌿 Branch Structure

```
QuantityMeasurementApp-Frontend
│
├── main                               ← Production-ready Angular app (100 commits)
├── feature/QM-with-typescript-and-angular  ← Angular feature branch (71 commits)
├── feature/QM-with-html-css-js        ← Vanilla HTML/CSS/JS implementation (30 commits)
└── dev                                ← Development/scratch branch (11 commits)
```

---

## 🔍 Branch Details

### 1. `main`

> **Production branch** — the most up-to-date Angular application deployed to Vercel.

**Commits:** 100

This branch contains the fully polished Angular 18 frontend with all bug fixes and production-level features applied on top of the feature branch, including:

#### Authentication & Session Management
- **JWT-based login** with email and password
- **Google OAuth2** login via `/api/v1/auth/oauth2-start?frontend=angular`
- **Auto-logout after 1 hour of inactivity** — listens to `mousemove`, `keydown`, `click`, `scroll`, `touchstart` events; resets a 1-hour timeout on every activity
- **Absolute session expiry** — `qm_session_expiry` key stores the expiry timestamp in `localStorage`; checked on every page load via `checkExpiredOnInit()`
- **Tab-close handling** — `beforeunload` saves `qm_last_active` timestamp so reopening the tab within 1 hour keeps the user logged in; reopening after 1 hour logs them out silently
- **`forceLogout()`** — silent logout called from the constructor (no navigation side-effects); auth guard redirects to login on next route access
- **Auth interceptor** — automatically attaches `Authorization: Bearer <token>` to every outgoing HTTP request

#### Password Reset Flow
- **Forgot password** — sends `POST /auth/forgot-password` with `X-Frontend-Origin: window.location.origin` header so the backend builds the reset email link pointing back to the correct frontend deployment (Vercel preview URL, Vercel prod, or GitHub Pages)
- **Reset password** — reads token from URL query params, validates via `GET /auth/reset-password/validate?token=...`, submits new password via `POST /auth/reset-password`
- **Token validation** — shows a loading state while validating; shows "SCROLL EXPIRED" UI on invalid/expired tokens; redirects to login after successful reset

#### Operations (Spells)
- **Compare** — checks equality between two quantities of the same dimension
- **Convert** — transforms a quantity to a different unit (second value input hidden)
- **Add** — sums two quantities with automatic unit reconciliation
- **Subtract** — subtracts one quantity from another
- **Divide** — returns a dimensionless ratio between two quantities
- **Dimension selector** — switch between Length, Weight, Volume, Temperature; unit dropdowns update automatically
- **Result card** — animated reveal showing oracle's answer with value, unit, and operation metadata
- **Paginated spell history** — 10 records per page with smart ellipsis pagination; filterable by operation type or ERRORED; refreshes after each operation

#### Dashboard (The Keep)
- **Stat cards** — Total Spells, Compares, Converts, Cursed (errors); animated counter roll-up on load
- **Bar chart** — visual spell breakdown across all 5 operation types
- **Donut chart** — SVG-based realm distribution (Length / Weight / Volume / Temperature) with offset stroke-dasharray arcs
- **Recent scrolls** — last 6 operations across all types, sorted by ID
- **Auth gate** — non-authenticated users see a dragon-guarded gate with login/register CTAs

#### Profile (Knight's Scroll)
- Fetches `/users/me` for full profile data (first name, last name, email, auth provider, role)
- GSAP-animated stat counters for Total Spells, Successful, and Cursed
- Logout button

#### Navbar
- Reactive — uses Angular signals (`isAuth`, `user`) to show logged-in user email + avatar initials or guest login/register links
- Active route highlighting via `routerLinkActive`

#### Shared / UI
- **Custom dragon cursor** — GSAP-animated `🐲` cursor with flame trail, click sparks, and hover scale effects
- **Page loader** — dragon boot screen with animated fire progress bar, auto-hides after 1.4s
- **Toast notifications** — signal-based toast service with success/error/info types
- **World background** — animated sky gradient, SVG mountain silhouettes, flying dragons, phoenixes, castle towers, floating islands, wyverns, magic orbs, cloud drift, and ember particles — all injected dynamically via `CursorComponent`

---

### 2. `feature/QM-with-typescript-and-angular`

> **Angular feature development branch** — the initial Angular implementation before production fixes were applied.

**Commits:** 71

This branch contains the same Angular 18 application structure as `main`. It diverges from `main` only in `src/styles.scss` (the theme file header comment was updated in `main`). All core features are identical:

#### What's implemented
- All 9 pages: Home, Login, Register, Operations, Dashboard, Profile, Forgot Password, Reset Password, OAuth Callback
- Lazy-loaded standalone Angular components with `loadComponent`
- `AuthService` with Angular signals, `computed()` for `isAuth`, inactivity timer, and `NgZone.runOutsideAngular()` for performance
- `AuthGuard` protecting the `/profile` route
- `ApiService` wrapper around `HttpClient` for `GET`/`POST` to the backend
- `AuthInterceptor` for automatic JWT header injection
- Same operations, dashboard, and profile implementations as `main`

#### Key difference from `main`
- Does **not** include the `X-Frontend-Origin` header fix in the forgot-password component (added later in `main`)
- `styles.scss` is missing the theme header comment block present in `main`

---

### 3. `feature/QM-with-html-css-js`

> **Vanilla frontend** — a complete HTML/CSS/JavaScript implementation of the same app, deployed to GitHub Pages.

**Commits:** 30

This is a multi-page static website with no build step, no framework, and no TypeScript. Each page is a standalone `.html` file that imports shared `js/app.js`.

#### Pages
| File | Description |
|---|---|
| `index.html` | Home / landing page |
| `login.html` | Email + password login, Google OAuth |
| `register.html` | New account registration |
| `operations.html` | Spell casting interface |
| `dashboard.html` | Stats, charts, and history |
| `profile.html` | User profile and legend stats |
| `forgot-password.html` | Request password reset email |
| `reset-password.html` | Set new password via token link |
| `oauth2-callback.html` | OAuth2 redirect landing page |

#### Implemented Functions

**`js/app.js`** — shared across all pages
- `isAuthed()` — checks `localStorage` for JWT token
- `authHeaders()` — builds `Authorization` + `Content-Type` headers
- `api(method, path, body)` — generic fetch wrapper with error handling
- `doLogout()` — clears token, stops inactivity timer, redirects to `index.html`
- `updateNavUser()` — dynamically renders logged-in user avatar + email or guest login/register buttons
- `setActiveTab()` — highlights the current page's nav tab
- `toast(msg, type)` — GSAP-animated toast notifications
- `initCursor()` — custom cursor with hover effects and click sparks (event delegation for dynamically injected elements)
- `initNavScroll()` — navbar shrink animation on scroll via ScrollTrigger
- `checkSessionExpiry()` — checks `qm_last_active` on page load; silently logs out and redirects if 1 hour has elapsed
- `startInactivityTimer()` / `stopInactivityTimer()` / `resetInactivityTimer()` — 1-hour inactivity auto-logout listening to mouse/keyboard/scroll events
- `beforeunload` listener — clears all auth keys from `localStorage` on tab close

**`js/auth.js`** — login and registration
- `loginWithGoogle()` — redirects to backend OAuth2 start endpoint
- `doLogin()` — `POST /auth/login`, saves token + user + `qm_last_active`, starts inactivity timer
- `doRegister()` — `POST /auth/register`, same post-login flow
- `showError()` / `clearErrors()` — inline form validation helpers

**`js/operations.js`** — spell casting
- `selectOp(el, op)` — switches active operation and updates UI labels/symbols
- `selectFilter(f)` — switches history filter (ALL / operation type / ERRORED)
- `updateUnits()` — repopulates unit dropdowns when dimension realm changes
- `runOperation()` — builds payload and `POST`s to the appropriate `/quantities/*` endpoint; shows result card
- `loadHistory()` — fetches and renders paginated spell history table
- `goToPage(n)` — pagination navigation
- `renderHistorySection()` — conditionally shows auth gate or history table
- `formatResult(r)` — formats result value + unit for table display

**`js/dashboard.js`** — stats and charts
- `initDashboard()` — orchestrates all dashboard data fetching
- `animCount(id, target)` — counter roll-up animation
- `renderBarChart(bars)` — builds pixel-art style SVG/div bar chart
- `renderDonut(data)` — builds SVG donut chart with stroke-dasharray arcs
- `renderRecentHistory()` — fetches and renders last 6 operations
- `showDashGate()` — renders auth gate for unauthenticated users

**`js/profile.js`** — user profile
- `initProfile()` — fetches `/users/me`, renders profile card and badges
- `animStat(id, target)` — GSAP counter animation for spell stats
- `loadStats()` — fetches spell counts and error history for stat display

**`forgot-password.html` inline script**
- `doForgotPassword()` — `POST /auth/forgot-password` with `X-Frontend-Origin: window.location.origin` header so the backend sends the reset link pointing to the correct frontend
- Shows success state with the email address on completion

**`reset-password.html` inline script**
- Reads `?token=` from URL on load
- `GET /auth/reset-password/validate?token=...` — validates token; shows form or "link expired" UI
- Network errors show the form optimistically (rather than false "expired" message)
- `doResetPassword()` — `POST /auth/reset-password` with token and new password; redirects to login on success

**`js/pw-toggle.js`** — show/hide password toggle for all password inputs

---

### 4. `dev`

> **Scratch / transition branch** — used as an intermediate branch during development; currently empty.

**Commits:** 11

This branch started as a copy of `feature/QM-with-html-css-js` (its first commit added all the HTML/CSS/JS files). All subsequent commits are file deletions, leaving the branch with no files. It was used as a staging area while transitioning from the HTML implementation to the Angular implementation.

---

## ✨ Features

| Feature | HTML Branch | Angular Branch |
|---|:---:|:---:|
| Email/Password Login | ✅ | ✅ |
| Google OAuth2 | ✅ | ✅ |
| Register | ✅ | ✅ |
| Forgot Password | ✅ | ✅ |
| Reset Password | ✅ | ✅ |
| Compare Quantities | ✅ | ✅ |
| Convert Units | ✅ | ✅ |
| Add Quantities | ✅ | ✅ |
| Subtract Quantities | ✅ | ✅ |
| Divide Quantities | ✅ | ✅ |
| Spell History + Filter | ✅ | ✅ |
| Paginated History | ✅ | ✅ |
| Dashboard Stats | ✅ | ✅ |
| Bar Chart | ✅ | ✅ |
| Donut Chart | ✅ | ✅ |
| Profile Page | ✅ | ✅ |
| Auth Guard | ❌ | ✅ |
| JWT Interceptor | ❌ | ✅ |
| Inactivity Auto-Logout | ✅ | ✅ |
| Tab-Close Logout | ✅ | ✅ |
| Absolute Session Expiry | ❌ | ✅ |
| X-Frontend-Origin Header | ✅ | ✅ (`main` only) |
| Custom Dragon Cursor | ✅ | ✅ |
| GSAP Animations | ✅ | ✅ |
| Responsive Design | ✅ | ✅ |

---

## 🛠 Tech Stack

### Angular Frontend (`main` / `feature/QM-with-typescript-and-angular`)
| Technology | Version |
|---|---|
| Angular | 18.2.x |
| TypeScript | ~5.5.2 |
| RxJS | ~7.8.0 |
| GSAP | ^3.14.2 |
| @vercel/analytics | ^2.0.1 |
| @vercel/speed-insights | ^2.0.0 |

### HTML/CSS/JS Frontend (`feature/QM-with-html-css-js`)
| Technology | Details |
|---|---|
| HTML5 | Multi-page static site |
| CSS3 | Custom properties, pixel-art aesthetic |
| Vanilla JavaScript | ES2020+, async/await |
| GSAP 3.12.5 | ScrollTrigger, CustomEase, animations |
| Google Fonts | Press Start 2P, VT323 |

---

## 🚀 Getting Started

### Angular App

```bash
# Clone and install
git clone https://github.com/ANUBHAV-03042004/QuantityMeasurementApp-Frontend
cd QuantityMeasurementApp-Frontend
npm install

# Run dev server
ng serve
# → http://localhost:4200

# Build for production
ng build
```

### HTML/CSS/JS App

```bash
git checkout feature/QM-with-html-css-js

# No build step needed — open directly in browser
open index.html

# Or serve with any static server
npx serve .
# → http://localhost:3000
```

---

## 📄 Pages & Routes

### Angular Routes
| Route | Component | Auth Required |
|---|---|:---:|
| `/` | HomeComponent | ❌ |
| `/login` | LoginComponent | ❌ |
| `/register` | RegisterComponent | ❌ |
| `/operations` | OperationsComponent | ❌ |
| `/dashboard` | DashboardComponent | ❌ |
| `/profile` | ProfileComponent | ✅ |
| `/forgot-password` | ForgotPasswordComponent | ❌ |
| `/reset-password` | ResetPasswordComponent | ❌ |
| `/oauth2-callback` | OauthCallbackComponent | ❌ |
| `/**` | → redirects to `/` | — |

### HTML Pages
`index.html` · `login.html` · `register.html` · `operations.html` · `dashboard.html` · `profile.html` · `forgot-password.html` · `reset-password.html` · `oauth2-callback.html`

---

## 🔐 Authentication Flow

```
User clicks Login
      │
      ├─── Email/Password ──→ POST /auth/login ──→ JWT token
      │
      └─── Google OAuth ───→ GET /api/v1/auth/oauth2-start?frontend=angular
                                    │
                                    └──→ Google consent screen
                                               │
                                               └──→ /oauth2-callback?token=<JWT>
                                                          │
                                                          └──→ Parse JWT payload
                                                                     │
                                                                     └──→ setAuth() → /operations
```

**Session lifecycle:**
1. On login → `qm_token`, `qm_user`, `qm_last_active`, `qm_session_expiry` written to `localStorage`
2. On every user activity → `qm_last_active` and `qm_session_expiry` extended by 1 hour
3. On tab close → `qm_last_active` saved (Angular); all keys cleared (HTML)
4. On page load → `checkExpiredOnInit()` / `checkSessionExpiry()` reads timestamps and forces logout if expired
5. After 1 hour of inactivity → timer fires → `logout()` → redirect to home/login

---

## 📦 Supported Measurement Units

| Dimension | Units |
|---|---|
| 📏 Length | FEET, INCHES, YARDS, CENTIMETERS |
| ⚖️ Weight | MILLIGRAM, GRAM, KILOGRAM, POUND, TONNE |
| 🫙 Volume | LITRE, MILLILITRE, GALLON |
| 🌡️ Temperature | CELSIUS, FAHRENHEIT, KELVIN |

---

## 👤 Author

**Anubhav Kumar Srivastava** — [@ANUBHAV-03042004](https://github.com/ANUBHAV-03042004)
