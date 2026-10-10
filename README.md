# InvoiceFlow — AngularJS Conversion

## What This Is

A complete port of your vanilla-JavaScript invoicing app to **AngularJS 1.8.3**, using factories, filters, directives, and controllers to replace your original `main.js` + page-specific `.js` files.

All 9 CSS files are **unchanged** — the AngularJS directives render markup using your exact existing class names, so styling works out of the box.

## Folder Structure

```
invoiceflow-angular/
├── index.html                    ← landing page (nav toggle)
├── landing.html                  ← redirect to index.html (unchanged)
├── login.html                    ← login form
├── signup.html                   ← signup form
├── home.html                     ← dashboard (after login)
├── clients.html                  ← CRUD for clients
├── create-invoice.html           ← invoice builder with live totals
├── invoice-history.html          ← search + filter invoices
├── settings.html                 ← company details, logo, geolocation
├── templates.html                ← template picker
│
├── css/                          (all 9 CSS files — untouched)
│   ├── main.css
│   ├── index.css
│   ├── auth.css
│   ├── home.css
│   ├── clients.css
│   ├── invoice-create.css
│   ├── invoice-history.css
│   ├── settings.css
│   └── templates.css
│
└── js/
    ├── vendor/
    │   └── angular.min.js        ← AngularJS 1.8.3 (local, not CDN)
    │
    ├── core/                     ← shared by all authenticated pages
    │   ├── core.module.js        ← defines ivfCore module
    │   ├── core.factories.js     ← 7 factories (StorageService, AuthService, etc.)
    │   ├── core.filters.js       ← 4 filters (ivfCurrency, initials, etc.)
    │   └── core.directives.js    ← 7 directives (ivfSidebar, ivfModal, etc.)
    │
    └── pages/                    ← one module per page
        ├── index.module.js       ← landing page
        ├── auth.module.js        ← login + signup
        ├── home.module.js
        ├── clients.module.js
        ├── invoiceCreate.module.js
        ├── invoiceHistory.module.js
        ├── settings.module.js
        └── templates.module.js
```

## Setup (First Time)

1. **Extract the zip** to your local machine.
2. **Add your `images/` folder** (if you have one) alongside the HTML files — the pages reference `images/Invoicelogo.png` and `images/undraw_*.svg`.
3. **Start a local server** (Angular needs `http://`, not `file://`):
   ```bash
   # macOS/Linux
   cd path/to/invoiceflow-angular
   python3 -m http.server 8000

   # Windows (PowerShell)
   cd path\to\invoiceflow-angular
   python -m http.server 8000
   ```
4. **Open browser** to `http://localhost:8000` and click `Start free` to sign up.

## What Changed (Vanilla → AngularJS)

| Old File | Replaced By | What It Held |
|----------|-------------|--------------|
| `main.js` | `core/` (4 files) | Factories, filters, directives, shared helpers |
| `auth.js` | `pages/auth.module.js` | LoginCtrl, SignupCtrl |
| `clients.js` | `pages/clients.module.js` | ClientsCtrl + CRUD |
| `home.js` | `pages/home.module.js` | HomeCtrl + dashboard stats |
| `index.js` | `pages/index.module.js` | Mobile nav toggle |
| `invoice-create.js` | `pages/invoiceCreate.module.js` | InvoiceCreateCtrl + line-item math |
| `invoice-history.js` | `pages/invoiceHistory.module.js` | InvoiceHistoryCtrl + search/filter |
| `settings.js` | `pages/settings.module.js` | SettingsCtrl + geolocation |
| `templates.js` | `pages/templates.module.js` | TemplatesCtrl + picker |

**What stayed the same:**
- All 9 CSS files (byte-for-byte identical)
- All HTML class names, IDs, and semantic structure
- All localStorage usage (now wrapped in `StorageService`)
- All business logic (invoice math, client CRUD, etc.)

## Architecture (Patterns)

### Factories
Each factory owns one localStorage key (or a small group):
- `StorageService` — low-level localStorage wrapper + ID generation
- `AuthService` — login, logout, requireAuth guard
- `ToastService` — notification display (shared state)
- `ClientService` — client CRUD
- `InvoiceService` — invoice CRUD + line-item math
- `SettingsService` — company details
- `TemplateService` — template list + active selection

### Filters
- `ivfCurrency` — currency formatting (respects SettingsService's active currency)
- `initials` — name → initials for avatars
- `statusBadgeClass` — status → badge CSS class
- `trustHtml` — mark SVG icons as safe (for `ng-bind-html`)

### Directives
- `ivfSidebar` — main navigation sidebar (replaces `renderSidebar()`)
- `ivfMobileMenuBtn` — mobile menu button listener
- `ivfModal` — open/close modal via two-way binding (replaces repeated class-toggle)
- `ivfSignaturePad` — canvas signature pad (exposes `.clear()`, `.isEmpty()`, `.dataUrl()`)
- `ivfPhone` — phone number validator (native Angular form validation)
- `ivfFileChange` — file input change listener (Angular has no `ng-model` for file inputs)
- `ivfToast` — display toast notifications

### Controllers (controllerAs style)
One per page, all thin — they read/write through factories instead of touching localStorage directly:
- `LoginCtrl` / `SignupCtrl` → call `AuthService.login()`/`.signup()`, redirect
- `HomeCtrl` → read stats from `ClientService`/`InvoiceService`
- `ClientsCtrl` → CRUD via `ClientService`, search via `filter:vm.matchesQuery`
- `InvoiceCreateCtrl` → line items, live totals via `InvoiceService.computeTotals()`, preview/print
- `InvoiceHistoryCtrl` → search + status filter, edit via modal
- `SettingsCtrl` → company details, logo upload, geolocation
- `TemplatesCtrl` → template picker
- `LandingCtrl` → just mobile nav toggle

## Key Differences vs. Original

### Form Validation
**Before:** Hand-rolled `data-validate="required email"` + `attachInlineValidation()` + `validateForm()`

**Now:** Native Angular form validation (`required`, `type="email"`, `ng-minlength`) + custom `ivfPhone` directive. Error messages driven by `form.field.$invalid` / `form.field.$dirty`.

### Live Search / Filtering
**Before:** Manual `renderTable()` rebuild on every keystroke

**Now:** `ng-repeat="item in list | filter:predicateFunction"` — Angular re-runs automatically, no manual DOM rebuild.

### Modal Open/Close
**Before:** Manual class-toggling + backdrop click listeners on each modal

**Now:** `ivf-modal="vm.modalOpen"` — two-way binding drives the `.open` class, backdrop clicks set it to `false`.

### Line-Item Totals
**Before:** `recalc()` function manually walked the DOM, computed totals, wrote HTML

**Now:** `$scope.$watch()` on form data runs `InvoiceService.computeTotals()` on any change; template displays `{{vm.totals.grand | ivfCurrency}}`

### Data Persistence
**Before:** Direct `localStorage.setItem()` / `localStorage.getItem()` calls throughout

**Now:** All go through `StorageService.write()` / `.read()` — one place to change if you ever want to switch backends.

## Testing Locally (Offline)

This project ships with **AngularJS locally vendored** (`js/vendor/angular.min.js`), so it works completely offline — no CDN calls. Just extract and run the local server above.

## Browser Support

AngularJS 1.8.3 works in:
- Chrome 40+
- Firefox 38+
- Safari 9+
- Edge (all versions)

IE 11 is technically supported by AngularJS 1.8.3, but may have quirks. Modern browsers recommended.

## What to Do Next

1. **Test it** — sign up → add clients → create an invoice → check history → adjust settings.
2. **Add your images** — drop the `images/` folder in alongside the HTML files.
3. **Customize** — edit `core.factories.js` to change the demo data seed, adjust `TemplateService.TEMPLATES` colors, etc.
4. **Deploy** — serve the folder over HTTP(S) from any web server (Apache, Nginx, Node, etc.).

## Known Issues / Notes

- The view-invoice modal on the history page shows an illustration image in the close button (should probably be an X icon) — same as the original code. If you want to fix it, replace the `<img>` with an SVG close icon.
- Geolocation on the Settings page uses the OpenStreetMap Nominatim API for reverse geocoding — it's free but rate-limited and may occasionally be slow or fail silently.
- Draft autosave (while creating an invoice) persists to localStorage only; there's no backend sync.

## Questions?

If anything doesn't work or behaves differently from the original, the browser's DevTools console (F12 → Console tab) will show Angular errors. That's your best debugging tool.

---

**Conversion completed:** August 26, 2026  
**Framework:** AngularJS 1.8.3  
**Architecture:** Factories + Filters + Directives + Controllers (no routing, multi-page)  
**Data layer:** localStorage (wrapped in StorageService)
