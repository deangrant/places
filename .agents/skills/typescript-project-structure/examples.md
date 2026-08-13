# TypeScript Project Structure — Examples

Concrete snippets for the React + TypeScript layout. See [SKILL.md](SKILL.md)
for rules. See [reference.md](reference.md) for trees and tables.

---

## Example 1: Core — `Button`

Folder: `src/components/core/Button/`

**`index.types.ts`**

```ts
export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
}
```

**`index.module.css`**

```css
.root {
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.primary {
  background: #2563eb;
  color: #fff;
}

.secondary {
  background: #e5e7eb;
  color: #111;
}
```

**`index.tsx`**

```tsx
import styles from "./index.module.css";
import type { ButtonProps } from "./index.types";

export function Button({
  label,
  variant = "primary",
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.root} ${styles[variant]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

**Tie-back:** A core unit is a leaf control. Keep types and CSS Modules in the
same folder.

---

## Example 2: Pattern — `FormField`

Folder: `src/components/patterns/FormField/`

**`index.types.ts`**

```ts
export interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
```

**`index.module.css`**

```css
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error {
  color: #b91c1c;
  font-size: 0.875rem;
}
```

**`index.tsx`**

```tsx
import { Input } from "@/components/core/Input";
import styles from "./index.module.css";
import type { FormFieldProps } from "./index.types";

export function FormField({
  id,
  label,
  value,
  onChange,
  error,
}: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
```

**Tie-back:** A pattern groups core units for one job. Import core units by
direct component path.

---

## Example 3: Direct component imports

**Call site**

```ts
import { Button } from "@/components/core/Button";
import { Input } from "@/components/core/Input";
```

**Tie-back:** Do not add `components/core/index.ts` (or other layer barrels).
Import each public component from its folder.

---

## Example 4: Page with local component

Folder: `src/pages/Home/`

**`components/HeroSection/index.types.ts`**

```ts
export interface HeroSectionProps {
  title: string;
  subtitle: string;
}
```

**`components/HeroSection/index.module.css`**

```css
.hero {
  padding: 2rem;
}
```

**`components/HeroSection/index.tsx`**

```tsx
import styles from "./index.module.css";
import type { HeroSectionProps } from "./index.types";

export function HeroSection({ title, subtitle }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </section>
  );
}
```

**`index.tsx`**

```tsx
import { MainLayout } from "@/components/layouts/MainLayout";
import { HeroSection } from "./components/HeroSection";

export function HomePage() {
  return (
    <MainLayout>
      <HeroSection
        title="Welcome"
        subtitle="Build clear React + TypeScript apps."
      />
    </MainLayout>
  );
}
```

**Tie-back:** Keep page-only UI under the page. Use a shared layout for the
shell.

---

## Example 5: Hook and service

**`src/hooks/useAuth.ts`**

```ts
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must run inside AuthContext.");
  }
  return value;
}
```

**`src/services/api/api.types.ts`**

```ts
export interface UserDto {
  id: string;
  displayName: string;
}
```

**`src/services/api/userService.ts`**

```ts
import type { UserDto } from "./api.types";

export async function fetchUser(id: string): Promise<UserDto> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error("Failed to load user.");
  }
  return response.json() as Promise<UserDto>;
}
```

**Tie-back:** Put shared React logic in `hooks/`. Put HTTP calls in `services/`.
Keep response types next to the service or in `types/` when many modules share
them.

---

## Quick navigation

- Narrative guide: [SKILL.md](SKILL.md)
- Trees and tables: [reference.md](reference.md)