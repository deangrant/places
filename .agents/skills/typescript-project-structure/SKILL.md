---
name: typescript-project-structure
description: >-
  Organize React + TypeScript projects with role-based component layers. Use
  when creating or reviewing a React TypeScript folder layout, placing
  components in core, patterns, containers, or layouts, applying
  folder-per-component with CSS Modules, or deciding where pages, hooks,
  contexts, services, stores, routes, types, constants, utils, styles, assets,
  or i18n files belong.
trigger: >-
  React TypeScript project structure, component layers, core, patterns,
  containers, layouts, folder-per-component, CSS Modules, React folder layout,
  pages, hooks, contexts, services, stores, direct imports, component hierarchy
---

# TypeScript Project Structure (React)

Use this skill when you shape a **React + TypeScript** app. Role-based layers
group UI by reuse and composition. A clear folder tree keeps shared code apart
from page code.

Do not use this full layout for a tiny prototype. Use it when the app grows and
many people share the code.

---

## 1. Role-based component layers

This skill uses four UI layers:

| Layer | Role | Examples |
| ----- | ---- | -------- |
| **Core** | Smallest UI unit. No business logic. | `Button`, `Input`, `Label` |
| **Pattern** | Small group of core units. One clear job. | `FormField`, `Card` |
| **Container** | Large UI block. Uses core and patterns. | `Header`, `UserProfile` |
| **Layout** | Page skeleton. Holds containers in layout slots. | `MainLayout`, `AuthLayout` |

**Put each component in the correct layer.**

- Put a leaf UI control in `components/core/`.
- Put a small composed control in `components/patterns/`.
- Put a feature section in `components/containers/`.
- Put a page layout shell in `components/layouts/`.

**Move a component when reuse changes.**

- Promote a page-local component to `components/` when two or more pages use it.
- Demote a shared component to a page folder when only one page uses it.

---

## 2. Folder-per-component (default)

Put each shared component in its own folder. Use these files:

| File | Purpose |
| ---- | ------- |
| `index.tsx` | Component logic and JSX. |
| `index.module.css` | Styles for this component (CSS Modules). |
| `index.types.ts` | TypeScript types for this component. |

Export the component from `index.tsx`. Import styles from `index.module.css`.
Keep types in `index.types.ts`.

Do **not** add a layer barrel (`components/core/index.ts`, and the same for
`patterns/`, `containers/`, `layouts/`). Import each component by its folder
path.

---

## 3. Top-level `src/` layout

| Folder or file | Purpose |
| -------------- | ------- |
| `assets/` | Static files: images, icons, fonts, audio, JSON. |
| `components/` | Shared UI by role-based layer. |
| `constants/` | App-wide constant values. |
| `pages/` | Route pages. Each page may own local components. |
| `contexts/` | React context providers and related types. |
| `hooks/` | Shared custom hooks (`use[Name]`). |
| `routes/` | Route maps and route guard components. |
| `services/` | API calls and external integrations. |
| `stores/` | App state (Redux, Zustand, or similar). |
| `utils/` | Pure helper functions. |
| `styles/` | Global CSS, variables, theme helpers. |
| `types/` | Shared TypeScript types for the whole app. |
| `i18n/` | Locale files and i18n setup. |
| `App.tsx` | Root app component. |
| `index.tsx` | App entry point. |

Put page-only UI in `pages/<PageName>/components/`. Do not put that UI in
`components/` until more than one page needs it.

**Do not create empty unused folders.** Only add `patterns/`, `containers/`,
`routes/`, `services/`, `stores/`, or `i18n/` when the app actually needs them.
This portfolio app currently uses `core` and `layouts` under `components/`, plus
page-local UI — leave the other layers out until reuse demands them.

---

## 4. Imports (no component-layer barrels)

Import shared components by **direct module path**. Do not create or use layer
barrels under `components/`.

```ts
import { Button } from "@/components/core/Button";
import { Input } from "@/components/core/Input";
```

**Why:** Biome `noBarrelFile` and React Doctor `no-barrel-import` reject
component-layer re-export files. Direct paths keep tree-shaking reliable and
avoid circular imports through barrels.

Optional barrels for non-component folders (`hooks/`, `constants/`, `types/`,
`utils/`) are allowed only when they do not trip lint and do not create cycles.
Prefer direct paths there too when in doubt.

---

## 5. Naming conventions

| Item | Rule |
| ---- | ---- |
| Component folder | PascalCase, same as the component name (`Button/`). |
| Component files | `index.tsx`, `index.module.css`, `index.types.ts`. |
| Hook file | `use` + PascalCase remainder (`useAuth.ts`). |
| Constant file | Domain + `.constants.ts` (`api.constants.ts`). |
| Type file (shared) | Domain + `.types.ts` (`api.types.ts`). |
| Service file | Domain + `Service.ts` (`userService.ts`). |
| Store file | Domain + `Store.ts` (`userStore.ts`). |

Use one name for one concept. Do not invent synonyms for the same folder role.

---

## 6. Quick checklist

**Component layer**

- [ ] Is this a leaf control? Put it in `core/`.
- [ ] Is this a small group of core units? Put it in `patterns/`.
- [ ] Is this a large feature block? Put it in `containers/`.
- [ ] Is this a page layout shell? Put it in `layouts/`.

**Shared vs page-local**

- [ ] Does only one page use this UI? Keep it under that page.
- [ ] Do two or more pages use this UI? Move it to `components/`.

**Folder-per-component**

- [ ] Does the folder have `index.tsx`?
- [ ] Does the folder have `index.module.css` when styles are needed?
- [ ] Does the folder have `index.types.ts` when props or local types exist?
- [ ] Are call sites importing this component by direct path (no layer barrel)?

**Cross-cutting code**

- [ ] Shared logic in a hook? Put it in `hooks/`.
- [ ] Global React state via Context? Put it in `contexts/`.
- [ ] HTTP or vendor API? Put it in `services/`.
- [ ] Client store state? Put it in `stores/`.
- [ ] Pure helper with no React API? Put it in `utils/`.
- [ ] App-wide type used in many places? Put it in `types/`.

---

## 7. Cross-references

- Full trees and lookup tables: [reference.md](reference.md).
- Code snippets for components, pages, hooks, and services:
  [examples.md](examples.md).