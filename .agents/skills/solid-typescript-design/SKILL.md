---
name: solid-typescript-design
description: >-
  Apply SOLID design principles when writing, refactoring, or reviewing
  TypeScript modules, classes, interfaces, and services. Use when designing
  maintainable architecture, splitting responsibilities, extending behavior
  without modification, fixing inheritance contracts, segregating interfaces,
  injecting dependencies, or addressing code smells in TypeScript.
trigger: >-
  SOLID, SRP, OCP, LSP, ISP, DIP, Single Responsibility, Open Closed,
  Liskov Substitution, Interface Segregation, Dependency Inversion,
  dependency injection, constructor injection, TypeScript design,
  maintainable architecture, code smells, strategy pattern, role interface
---

# SOLID TypeScript Design

Apply these rules when you design, refactor, or review TypeScript types,
classes, interfaces, services, and modules.

Worked before/after snippets: [examples.md](examples.md). Lookup tables and
idioms: [reference.md](reference.md).

Keywords in this document:

| Keyword | Meaning |
| --- | --- |
| **must** | Required. Do not deviate. |
| **must not** | Forbidden. |
| **should** | Strongly preferred unless a reviewer agrees otherwise. |
| **may** | Optional. |

---

## 1. Scope

- Principles target **types, classes, interfaces, and modules**—not only OOP
  class trees.
- Prefer **composition and interfaces** over deep inheritance.
- Do **not** force class hierarchies onto React UI components when a simpler
  module or hook split is enough.
- Treat SOLID as guidelines: apply with judgment when a strict split hurts
  clarity or performance for a tiny, stable unit.
- Use with tests, refactoring, and clear boundaries—not as the only design tool.

---

## 2. S — Single Responsibility Principle (SRP)

**Definition:** A module or class **must** have one reason to change.

**Rules:**

- A type **must** own one cohesive concern (for example user persistence, email
  delivery, or activity logging—not all three).
- When a change request would touch unrelated behaviors in the same type, you
  **must** split those behaviors into separate types or modules.
- A type **should** expose a focused public API that matches that concern.
- A type **must not** mix domain logic with orthogonal side effects (I/O,
  notifications, formatting) when those side effects change for different
  reasons.

**Smell → fix:** God class / mixed create+email+log → extract focused
collaborators and compose them at the call site or via injection.

---

## 3. O — Open/Closed Principle (OCP)

**Definition:** Software entities **should** be open for extension and closed
for modification.

**Rules:**

- New variants of behavior **should** be added as new implementations of an
  interface (or strategy), not by editing a growing `if` / `switch` on type
  strings.
- Shared orchestrators (processors, calculators) **must** depend on an
  abstraction and call it; they **must not** encode every concrete case.
- Existing stable modules **should** stay unchanged when a new case appears,
  aside from wiring the new implementation.
- You **may** modify a module when fixing a bug or changing shared contract
  behavior; OCP does not forbid all edits.

**Smell → fix:** `if (type === "credit") … else if (type === "paypal")` →
`PaymentMethod` interface + per-method classes + one processor.

---

## 4. L — Liskov Substitution Principle (LSP)

**Definition:** Subtypes **must** be substitutable for their base types without
breaking callers that rely on the base contract.

**Rules:**

- A subtype **must** honor the base type’s expectations (inputs accepted,
  outputs promised, errors thrown).
- A subtype **must not** throw “not supported” for inherited operations, weaken
  preconditions, or strengthen postconditions in ways callers cannot rely on.
- When a subtype cannot honestly fulfill the base contract, you **must**
  redesign: narrower base, separate interfaces, or no inheritance.
- Prefer capability-based types (for example `move()` with flying vs walking
  subtypes) over a base that promises behavior only some subtypes can provide.

**Smell → fix:** `Penguin extends Bird` with `fly()` throwing → split flying /
  non-flying capabilities, or use a shared `move()` contract both can meet.

---

## 5. I — Interface Segregation Principle (ISP)

**Definition:** Clients **must not** be forced to depend on methods they do not
use.

**Rules:**

- Prefer **small role interfaces** over one fat interface that every implementer
  must satisfy.
- An implementer **must** only implement roles it actually supports.
- Callers **should** depend on the narrowest interface they need.
- Empty, no-op, or throw-stub implementations of unused methods **must not** be
  used to “satisfy” a fat interface.

**Smell → fix:** `Worker { work(); eat(); }` forced on `Robot` → `Workable` and
`Eatable`; robot implements only `Workable`.

---

## 6. D — Dependency Inversion Principle (DIP)

**Definition:** High-level modules **must not** depend on low-level modules.
Both **must** depend on abstractions.

**Rules:**

- Application / domain services **must** depend on interfaces (or abstract
  types), not concrete infrastructure classes.
- Concrete adapters (databases, HTTP clients, mailers) **must** implement those
  abstractions.
- Dependencies **should** be provided via **constructor injection** (or an
  equivalent explicit injection point), not constructed with `new` inside the
  high-level type.
- Swapping an implementation **should** not require editing the high-level
  consumer—only wiring.

**Smell → fix:** `UserService` does `this.db = new MySQLDatabase()` → inject
`Database`; provide MySQL, Postgres, or in-memory implementations.

---

## 7. Design and review workflow

When designing or reviewing TypeScript structure:

1. **Name the change reasons** for each type. More than one unrelated reason →
   apply SRP.
2. **List upcoming variants.** If new cases will keep editing a switch → apply
   OCP with an interface + implementations.
3. **Check substitution.** For every `extends` / `implements` used polymorphically,
   ask whether every subtype is safe where the base is expected → apply LSP.
4. **Trim interfaces.** If a client mocks or stubs methods it never calls →
   apply ISP.
5. **Invert dependencies.** If a service constructs or imports a concrete
   infrastructure type → apply DIP with an interface and injection.
6. **Verify with tests.** Prefer unit tests against abstractions; swap fakes at
   the injection boundary.

---

## 8. Pre-merge checklist

**SRP**

- [ ] Each new/changed type has one clear reason to change?
- [ ] Side effects (mail, logging, persistence) are not jammed into unrelated
  domain types?

**OCP**

- [ ] New variants added without rewriting a central type-switch?
- [ ] Extension points use interfaces or strategies?

**LSP**

- [ ] No subtype throws or no-ops inherited behavior callers expect?
- [ ] Inheritance only where substitution is honest?

**ISP**

- [ ] Interfaces are role-sized; no fat interface forcing unused methods?
- [ ] Callers depend on the narrowest contract they need?

**DIP**

- [ ] High-level code depends on abstractions?
- [ ] Concretes injected, not constructed inside high-level types?

---

## 9. Cross-references

- Before/after TypeScript for each principle: [examples.md](examples.md).
- Smells, misconceptions, and TypeScript idioms: [reference.md](reference.md).
