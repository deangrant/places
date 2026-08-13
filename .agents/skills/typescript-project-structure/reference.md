# TypeScript Project Structure — Reference

Quick lookup for the React + TypeScript layout. See [SKILL.md](SKILL.md) for
rules. See [examples.md](examples.md) for code.

---

## Full `src/` tree

```text
src/
├── assets/
│   ├── images/
│   │   ├── index.ts
│   │   └── logo.svg
│   ├── icons/
│   │   ├── index.ts
│   │   └── icon1.svg
│   ├── fonts/
│   │   ├── index.ts
│   │   └── OpenSans-Regular.ttf
│   ├── json/
│   │   ├── index.ts
│   │   └── lottie.json
│   └── audio/
│       ├── index.ts
│       └── notification.mp3
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
│   ├── app.constants.ts
│   ├── theme.constants.ts
│   ├── messages.constants.ts
│   └── index.ts
├── pages/
│   ├── Home/
│   │   ├── components/
│   │   │   ├── HeroSection/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── index.module.css
│   │   │   │   └── index.types.ts
│   │   │   └── FeatureList/
│   │   │       ├── index.tsx
│   │   │       ├── index.module.css
│   │   │       └── index.types.ts
│   │   ├── index.tsx
│   │   ├── index.module.css
│   │   └── index.types.ts
│   ├── About/
│   │   ├── components/
│   │   │   └── TeamList/
│   │   │       ├── index.tsx
│   │   │       ├── index.module.css
│   │   │       └── index.types.ts
│   │   └── index.tsx
│   └── index.ts
├── contexts/
│   ├── ThemeContext/
│   │   ├── index.tsx
│   │   └── index.types.ts
│   ├── AuthContext/
│   │   ├── index.tsx
│   │   └── index.types.ts
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useTheme.ts
│   ├── useFetchData.ts
│   └── index.ts
├── routes/
│   ├── index.ts
│   ├── AppRoutes.tsx
│   ├── PrivateRoutes.tsx
│   └── PublicRoutes.tsx
├── services/
│   ├── api/
│   │   ├── index.ts
│   │   ├── userService.ts
│   │   ├── authService.ts
│   │   └── api.types.ts
│   └── firebaseService.ts
├── stores/
│   ├── index.ts
│   ├── userStore.ts
│   ├── themeStore.ts
│   └── store.types.ts
├── utils/
│   ├── index.ts
│   ├── formatters.ts
│   └── validators.ts
├── styles/
│   ├── index.ts
│   ├── global.css
│   ├── variables.css
│   ├── theme.ts
│   └── mixins.ts
├── types/
│   ├── common.types.ts
│   ├── env.types.ts
│   ├── api.types.ts
│   ├── store.types.ts
│   └── index.ts
├── i18n/
│   ├── index.ts
│   ├── en.json
│   ├── es.json
│   └── fr.json
├── App.tsx
└── index.tsx
```

---

## Per-folder purpose

| Folder | Put here | Do not put here |
| ------ | -------- | --------------- |
| `assets/` | Images, icons, fonts, audio, static JSON. | Component logic or styles. |
| `components/` | Shared UI by core, pattern, container, layout. | Page-only UI used once. |
| `constants/` | Route paths, API paths, theme tokens, fixed messages. | Runtime state or API calls. |
| `pages/` | Route page roots and page-local components. | Shared UI used by many pages. |
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
| Large block. Uses core and patterns. | Container | Put under `components/containers/`. |
| Layout shell for a page family. | Layout | Put under `components/layouts/`. |
| Used by only one page. | Page-local | Put under `pages/<Page>/components/`. |
| Used by two or more pages. | Shared | Put under `components/` at the right level. |

---

## Naming conventions

| Kind | Pattern | Example |
| ---- | ------- | ------- |
| Component folder | PascalCase | `FormField/` |
| Component entry | `index.tsx` | `Button/index.tsx` |
| Component styles | `index.module.css` | `Button/index.module.css` |
| Component types | `index.types.ts` | `Button/index.types.ts` |
| Component import | Direct folder path | `core/Button` |
| Hook | `use` + Name | `useAuth.ts` |
| Constants | `*.constants.ts` | `api.constants.ts` |
| Shared types | `*.types.ts` | `common.types.ts` |
| Service | `*Service.ts` | `userService.ts` |
| Store | `*Store.ts` | `userStore.ts` |

---

## Import rules

1. Do **not** add layer barrels under `components/core`, `patterns`, `containers`, or `layouts`.
2. Import each shared component by its folder path (for example `components/core/Button`).
3. Optional barrels for `hooks/`, `constants/`, `types/`, and `utils/` are allowed only when lint stays clean and no cycles form.
4. Prefer a direct path when a barrel breaks tree-shaking or creates a cycle.

---

## Quick navigation

- Narrative guide: [SKILL.md](SKILL.md)
- Code snippets: [examples.md](examples.md)