# TypeScript Project Structure — Reference

Quick lookup for the React + TypeScript layout. See [SKILL.md](SKILL.md) for
rules. See [examples.md](examples.md) for code.

---

## Places app `src/` tree (current)

Single-page Places explorer: shared `core` + `patterns` only; layout and
feature blocks stay under the page until a second page reuses them.

```text
src/
├── components/
│   ├── core/
│   │   ├── Badge/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   └── Spinner/
│   └── patterns/
│       ├── Autocomplete/
│       └── FormField/
├── constants/
├── contexts/
│   ├── PlacesContext/
│   └── ServicesContext/
├── pages/
│   └── Places/
│       ├── PlacesLayout/
│       │   ├── index.tsx
│       │   └── index.module.css
│       ├── components/
│       │   ├── MapView/
│       │   ├── PlaceDetail/
│       │   ├── ResultsList/
│       │   └── SearchFilters/
│       └── index.tsx
├── services/
├── styles/
├── types/
├── utils/
├── app.tsx
└── index.tsx
```

Optional later (only when ≥2 pages share UI):

```text
src/components/
├── containers/    # promoted page feature blocks
└── layouts/       # promoted shared page shells
```

---

## Full multi-page `src/` tree (after promotion)

Use this shape when containers and layouts are shared across pages.

```text
src/
├── assets/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   ├── json/
│   └── audio/
├── components/
│   ├── core/
│   │   ├── Button/
│   │   │   ├── index.tsx
│   │   │   ├── index.module.css
│   │   │   └── index.types.ts
│   │   └── Input/
│   │       ├── index.tsx
│   │       ├── index.module.css
│   │       └── index.types.ts
│   ├── patterns/
│   │   ├── Card/
│   │   │   ├── index.tsx
│   │   │   ├── index.module.css
│   │   │   └── index.types.ts
│   │   └── FormField/
│   │       ├── index.tsx
│   │       ├── index.module.css
│   │       └── index.types.ts
│   ├── containers/
│   │   ├── Header/
│   │   │   ├── index.tsx
│   │   │   ├── index.module.css
│   │   │   └── index.types.ts
│   │   └── UserProfile/
│   │       ├── index.tsx
│   │       ├── index.module.css
│   │       └── index.types.ts
│   └── layouts/
│       ├── MainLayout/
│       │   ├── index.tsx
│       │   ├── index.module.css
│       │   └── index.types.ts
│       └── AuthLayout/
│           ├── index.tsx
│           ├── index.module.css
│           └── index.types.ts
├── constants/
│   ├── api.constants.ts
│   └── app.constants.ts
├── pages/
│   ├── Home/
│   │   ├── components/
│   │   │   └── HeroSection/
│   │   └── index.tsx
│   └── About/
│       ├── components/
│       │   └── TeamList/
│       └── index.tsx
├── contexts/
├── hooks/
├── routes/
├── services/
│   └── places/
│       └── place-search-service.ts
├── stores/
├── utils/
├── styles/
│   └── global.css
├── types/
├── i18n/
├── app.tsx
└── index.tsx
```

---

## Per-folder purpose

| Folder | Put here | Do not put here |
| ------ | -------- | --------------- |
| `assets/` | Images, icons, fonts, audio, static JSON. | Component logic or styles. |
| `components/` | Shared UI (core, patterns; containers/layouts after promotion). | Page-only UI used once. |
| `constants/` | Route paths, API paths, theme tokens, fixed messages. | Runtime state or API calls. |
| `pages/` | Route page roots, page-local layouts, and page-local components. | Shared UI used by many pages. |
| `contexts/` | Context providers and context types. | Low-level fetch helpers. |
| `hooks/` | Shared `use[Name]` hooks. | One-off logic used in a single file. |
| `routes/` | Route tables and auth route guards. | Page body UI. |
| `services/` | HTTP clients and vendor SDK wrappers. | React components. |
| `stores/` | Client app state modules. | Server-only secrets. |
| `utils/` | Pure helpers (format, validate). | Hooks or components. |
| `styles/` | Global CSS, CSS variables, theme helpers. | Per-component CSS Modules. |
| `types/` | Shared types used in many folders. | Types that belong to one component. |
| `i18n/` | Locale JSON and i18n setup. | Hard-coded UI strings in many files. |

---

## Layer decision

| Signal | Level | Action |
| ------ | ----- | ------ |
| Single control. No composed children. | Core | Put under `components/core/`. |
| Small group of core units. One job. | Pattern | Put under `components/patterns/`. |
| Large block. Uses core and patterns. One page. | Container | Put under `pages/<Page>/components/`. |
| Large block reused by ≥2 pages. | Container | Promote to `components/containers/`. |
| Layout shell for one page. | Layout | Put under `pages/<Page>/<LayoutName>/`. |
| Layout shell reused by ≥2 pages. | Layout | Promote to `components/layouts/`. |
| Used by only one page. | Page-local | Keep under `pages/<Page>/`. |
| Used by two or more pages. | Shared | Put under `components/` at the right level. |

---

## Naming conventions

| Kind | Pattern | Example |
| ---- | ------- | ------- |
| Component folder | PascalCase | `FormField/` |
| Component entry | `index.tsx` | `Button/index.tsx` |
| Component styles | `index.module.css` | `Button/index.module.css` |
| Component types | `index.types.ts` | `Button/index.types.ts` |
| Component import | Direct folder path | `core/Button` or `pages/Places/components/MapView` |
| Hook | `use` + Name | `useAuth.ts` |
| Constants | `*.constants.ts` | `api.constants.ts` |
| Shared types | `*.types.ts` | `common.types.ts` |
| Service (this repo) | kebab `*-service.ts` | `place-search-service.ts` |
| Store (this repo) | kebab `*-store.ts` | `user-store.ts` |
| Root app file | kebab `app.tsx` | `src/app.tsx` |

---

## Import rules

1. Do **not** add layer barrels under `components/core`, `patterns`, `containers`, or `layouts`.
2. Import each shared component by its folder path (for example `components/core/Button`).
3. Import page-local layout/containers from `pages/<Page>/…`.
4. Optional barrels for `hooks/`, `constants/`, `types/`, and `utils/` are allowed only when lint stays clean and no cycles form.
5. Prefer a direct path when a barrel breaks tree-shaking or creates a cycle.

---

## Quick navigation

- Narrative guide: [SKILL.md](SKILL.md)
- Code snippets: [examples.md](examples.md)
