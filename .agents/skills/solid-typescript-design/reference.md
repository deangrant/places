# SOLID TypeScript Design — Reference

Quick lookup for SOLID in TypeScript. See [SKILL.md](SKILL.md) for rules. See
[examples.md](examples.md) for before/after code.

---

## Principle lookup

| Principle | Intent | TypeScript lever | Typical smell |
| --- | --- | --- | --- |
| **SRP** | One reason to change per type/module | Split classes/modules; compose | God class; create + email + log in one type |
| **OCP** | Extend without editing stable code | Interfaces, strategy, polymorphism | Growing `if`/`switch` on type strings |
| **LSP** | Subtypes safe wherever the base is used | Honest contracts; capability split | Subtype throws “not supported”; square/rectangle setters |
| **ISP** | Clients depend only on what they use | Small role interfaces | Fat interface; no-op / throw stubs |
| **DIP** | Depend on abstractions, not concretes | Interfaces + constructor injection | `new ConcreteDb()` inside a service |

---

## Smell → principle → fix

| Smell | Likely principle | Fix |
| --- | --- | --- |
| Class changes for many unrelated tickets | SRP | Extract one type per change reason |
| New feature requires editing a central switch | OCP | Add implementer of a shared interface |
| Tests break when substituting a subtype | LSP | Redesign hierarchy or drop inheritance |
| Mock implements methods the test never calls | ISP | Narrow the interface the client needs |
| Cannot unit-test without a real DB/API | DIP | Inject an interface; provide a fake |

---

## Common misconceptions

| Misconception | Reality |
| --- | --- |
| SRP means “one method per class” | SRP means one **cohesive reason to change**, not one function |
| OCP means “never edit a file” | Bugfixes and shared-contract changes are fine; avoid reopening for every new variant |
| ISP means “always one method per interface” | Prefer small **roles**; a cohesive multi-method role is fine |
| DIP requires a DI container | Constructor (or explicit) injection is enough; a container is optional |
| SOLID only applies to classes | Apply to modules, functions as units, and interfaces in any paradigm |
| Always follow SOLID strictly | Guidelines: skip ceremony for tiny, stable code when clarity suffers |

---

## TypeScript idioms

**Contracts**

- Prefer `interface` for dependency and role contracts.
- Use `abstract class` when you need shared implementation plus a required
  override; otherwise prefer interfaces + composition.
- Export the abstraction from the consumer’s domain side when practical so
  infrastructure depends inward.

**Injection**

- Inject dependencies through the constructor (`constructor(private readonly db: Database)`).
- Wire concretes at the composition root (app bootstrap, route factory, test
  setup)—not inside domain types.
- Prefer `readonly` injected fields so collaborators are not swapped mid-lifetime.

**Composition over inheritance**

- Default to “has-a” (compose services) over deep “is-a” trees.
- Use inheritance only when substitution (LSP) is intentional and tested.

**Modules**

- A file/module can be the SRP unit: one export surface, one reason to change.
- Keep React components thin: push multi-reason logic into hooks or services that
  follow the same SOLID rules.

---

## Decision prompts

Ask these when reviewing a design:

1. **SRP:** If product asks for two unrelated changes tomorrow, would both edit
   this same type?
2. **OCP:** Can I add a new variant by adding a file and wiring it, without
   editing the orchestrator’s branching logic?
3. **LSP:** If I pass every subtype into a function typed as the base, do all
   still meet documented behavior?
4. **ISP:** Does any implementer leave methods empty, no-op, or throwing only to
   satisfy the type checker?
5. **DIP:** Would swapping this concrete dependency require editing the
   high-level consumer, or only the composition root?

If the answer signals a problem, apply the matching principle before merging.
