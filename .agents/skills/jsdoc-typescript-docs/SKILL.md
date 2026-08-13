---
name: jsdoc-typescript-docs
description: Enforce TypeScript comment and JSDoc conventions across the codebase. Use when writing, reviewing, or refactoring comments, JSDoc, doc blocks, @param/@returns tags, or class/method/parameter documentation in TypeScript.
---

# Comments and Documentation Style

This document defines the required style for comments and JSDoc in TypeScript source files. Apply these rules when you write, change, or review documentation in the codebase.

For full worked examples of functions, classes, and interfaces, see [reference.md](reference.md).

## 1. Scope and enforcement

- New TypeScript files **must** follow this document.
- When you add code to an existing file, match the comment style already used in that file. Do not violate this document.
- Prefer reformatting of an existing file when you make a large change to that file.
- Keep comment-style changes in a separate change when they are not the primary goal of the work.

Keywords in this document:

| Keyword | Meaning |
| --- | --- |
| **must** | Required. Do not deviate. |
| **must not** | Forbidden. |
| **should** | Strongly preferred unless a reviewer agrees otherwise. |
| **may** | Optional. |

## 2. JSDoc versus comments

There are two types of comments: JSDoc (`/** ... */`) and ordinary comments (`// ...` or `/* ... */`).

- Use `/** JSDoc */` comments for documentation. These comments are for a user of the code.
- Use `//` line comments for implementation comments. These comments describe only the implementation.

Tools (editors and documentation generators) read JSDoc. Ordinary comments are for humans only.

## 3. Multi-line comments

Indent multi-line comments at the same level as the surrounding code. Multi-line comments **must** use multiple `//` line comments. Do not use block comment style (`/* */`).

**Correct:**

```ts
// This is
// fine
```

**Incorrect:**

```ts
/*
 * This should
 * use multiple
 * single-line comments
 */

/* This should use // */
```

Do not enclose comments in boxes drawn with asterisks or other characters.

## 4. What to document and what to skip

Use `/** JSDoc */` comments to give information to users of the code. Do not restate only the property or parameter name.

You **should** also document all properties and methods (exported or not) when the purpose is not clear from the name, as judged by the reviewer.

**Document these elements:**

- Public functions and methods (full JSDoc)
- Public classes (class-level documentation)
- Public interfaces and types (purpose of the type)
- Exported constants (what they control)
- Complex logic (why, not what)
- Non-obvious decisions (explain the reason)

**Skip documentation for:**

- Private trivial helpers (self-evident)
- Single-line getters (obvious from the name)
- Standard patterns (well-known idioms)
- Test files (tests are documentation)

**Exception:** Symbols that you export only for tooling (for example, `@NgModule` classes) do not require comments.

## 5. JSDoc general form

Use this multi-line form:

```ts
/**
 * Multiple lines of JSDoc text are written here,
 * wrapped normally.
 * @param arg A number to do something to.
 */
function doSomething(arg: number) { … }
```

Use this single-line form when the text fits on one line:

```ts
/** This short jsdoc describes the function. */
function doSomething(arg: number) { … }
```

If a single-line JSDoc comment grows into multiple lines, it **must** use the multi-line JSDoc style with `/**` and `*/` on their own lines.

JSDoc comments **must** be well-formed. Tools extract metadata from these comments for validation and optimization.

## 6. Markdown in JSDoc

Write JSDoc in Markdown. You **may** include HTML when necessary.

Do not rely on plain-text indentation for lists. Tools ignore that formatting.

**Incorrect:**

```ts
/**
 * Computes weight based on three factors:
 *   items sent
 *   items received
 *   last timestamp
 */
```

That text renders as one line:

```text
Computes weight based on three factors: items sent items received last timestamp
```

**Correct:**

```ts
/**
 * Computes weight based on three factors:
 *
 * - items sent
 * - items received
 * - last timestamp
 */
```

## 7. Approved JSDoc tags

Most tags **must** occupy their own line. Put the tag at the beginning of the line. Do not combine tags on one line.

**Correct:**

```ts
/**
 * The "param" tag must occupy its own line and may not be combined.
 * @param left A description of the left param.
 * @param right A description of the right param.
 */
function add(left: number, right: number) { ... }
```

**Incorrect:**

```ts
/**
 * The "param" tag must occupy its own line and may not be combined.
 * @param left @param right
 */
function add(left: number, right: number) { ... }
```

Use these approved tags:

| Tag | Purpose |
| --- | --- |
| `@description` | Extra detail beyond the first summary line |
| `@param` | Parameter meaning and constraints |
| `@returns` | Return value meaning and constraints |
| `@throws` | Exception that the symbol can raise |
| `@example` | Usage example |
| `@type` | Type note when TypeScript cannot express it |
| `@typeparam` | Type parameter meaning |
| `@class` | Class-level documentation marker |
| `@constructor` | Constructor documentation marker |
| `@property` | Field or member documentation |
| `@interface` | Interface-level documentation marker |

## 8. Line wrapping

Indent line-wrapped block tags by four spaces. You **may** align wrapped description text with the description on previous lines, but do not prefer that alignment.

```ts
/**
 * Illustrates line wrapping for long param/returns descriptions.
 * @param foo This is a param with a particularly long description that just
 *     doesn't fit on one line.
 * @returns This returns something that has a lengthy description too long to fit
 *     in one line.
 */
exports.method = function(foo) {
  return 5;
};
```

Do not indent when you wrap a `@desc` or `@fileoverview` description.

## 9. Function and method documentation

You **may** omit method, parameter, and return descriptions when they are clear from the rest of the method JSDoc, or from the method name and type signature.

Start method descriptions with a verb phrase that states what the method does. Do not write an imperative sentence. Write the phrase in the third person, as if the text starts with an implied "This method ...".

**Example verb phrases:** "Computes the total weight.", "Returns the active session.", "Posts the brew request."

Document parameters, return values, and exceptions when they add information. Add `@example` when usage is not obvious.

See [reference.md](reference.md#function-documentation) for a full function example.

## 10. Class documentation

Write class JSDoc so the reader knows how and when to use the class. Include any extra details that are necessary for correct use.

You **may** omit a textual description on the constructor. Document public methods and public properties.

See [reference.md](reference.md#class-documentation) for a full class example.

## 11. Interface and type documentation

Describe the purpose of each public interface or type. Document each property. Note valid values for enums and union types.

See [reference.md](reference.md#interface-and-type-documentation) for a full interface example.

## 12. Parameter property comments

A parameter property is a constructor parameter with a `private`, `protected`, `public`, or `readonly` modifier. The parameter property declares a parameter and an instance property, and assigns the parameter into that property.

Document these fields with the `@param` tag. Editors show the description on constructor calls and on property access.

**Correct (parameter properties):**

```ts
/** This class demonstrates how parameter properties are documented. */
class ParamProps {
  /**
   * @param percolator The percolator used for brewing.
   * @param beans The beans to brew.
   */
  constructor(
    private readonly percolator: Percolator,
    private readonly beans: CoffeeBean[]) {}
}
```

**Correct (ordinary fields):**

```ts
/** This class demonstrates how ordinary fields are documented. */
class OrdinaryClass {
  /** The bean that will be used in the next call to brew(). */
  nextBean: CoffeeBean;

  constructor(initialBean: CoffeeBean) {
    this.nextBean = initialBean;
  }
}
```

## 13. Type information in tags

Do not declare TypeScript types in `@param` or `@returns` blocks when the signature already shows the type. Add description and constraints only.

You **may** use structural tags such as `@class`, `@interface`, `@property`, `@constructor`, `@typeparam`, and `@type` when they help generated documentation.

Keep documentation in sync with code changes. Stale documentation is worse than no documentation.

## 14. Comments that add information

For non-exported symbols, the name and type are sometimes enough. Prefer documentation that adds real information beyond the variable names.

Do not write comments that only restate the parameter name and type.

**Incorrect:**

```ts
/** @param fooBarService The Bar service for the Foo application. */
```

`@param` and `@returns` lines are required only when they add information. You **may** omit them otherwise.

**Correct:**

```ts
/**
 * POSTs the request to start coffee brewing.
 * @param amountLitres The amount to brew. Must fit the pot size!
 */
brew(amountLitres: number, logger: Logger) {
  // ...
}
```

## 15. Inline implementation comments

Use `//` comments for complex algorithms and non-obvious logic. Explain why the code exists. Do not explain what the code does when the code is clear.

**Incorrect (explains what):**

```ts
// Increment counter by 1
counter++;
```

**Correct (explains why):**

```ts
// Retry count starts at 1 because the initial attempt does not count
counter++;
```

Link to context when a decision depends on an external rule or issue:

```ts
// Per RFC 7519, JWT expiry is in seconds since epoch
const exp = Math.floor(Date.now() / 1000) + ttlSeconds;

// See issue #234 for why we cannot use the simpler approach
const result = complexWorkaround();
```

## 16. Parameter-name comments at call sites

Use a parameter-name comment when the method name and the parameter value do not make the meaning of the parameter clear.

Before you add these comments, prefer a refactor that accepts an interface and destructures it. That change improves call-site readability.

Put the parameter-name comment before the parameter value. Include the parameter name and a `=` suffix.

**Correct:**

```ts
someFunction(obviousParam, /* shouldRender= */ true, /* name= */ 'hello');
```

Existing code **may** use a legacy style that places the comment after the parameter value and omits the `=`. You **may** keep that style in the same file for consistency.

```ts
someFunction(obviousParam, true /* shouldRender */, 'hello' /* name */);
```

## 17. Place documentation before decorators

When a class, method, or property has both a decorator (for example `@Component`) and JSDoc, write the JSDoc before the decorator.

**Incorrect:**

```ts
@Component({
  selector: 'foo',
  template: 'bar',
})
/** Component that prints "bar". */
export class FooComponent {}
```

**Correct:**

```ts
/** Component that prints "bar". */
@Component({
  selector: 'foo',
  template: 'bar',
})
export class FooComponent {}
```

## 18. Anti-patterns

Avoid these patterns:

- No documentation on public APIs
- Stale documentation that does not match the code
- Obvious comments that only restate the code
- Missing examples for complex APIs
- Copy-paste documentation that is not specific to the symbol

## 19. Enforcement checklist

Use this checklist when you write or review TypeScript comments:

- [ ] JSDoc (`/** */`) is used for documentation; `//` is used for implementation notes
- [ ] Multi-line ordinary comments use repeated `//`, not `/* */`
- [ ] JSDoc is well-formed (single-line or multi-line form as required)
- [ ] JSDoc lists use Markdown (`- item`), not plain-text indentation
- [ ] Each JSDoc tag is on its own line
- [ ] Wrapped block tags are indented four spaces
- [ ] Public APIs and unclear symbols have JSDoc; skip-list items are not over-documented
- [ ] Class JSDoc states how and when to use the class
- [ ] Method descriptions start with a third-person verb phrase
- [ ] Parameters, returns, and throws are documented when they add information
- [ ] Examples are provided for non-obvious APIs
- [ ] Parameter properties use `@param` on the constructor
- [ ] JSDoc does not duplicate TypeScript types in `@param` / `@returns`
- [ ] Comments add information; redundant `@param` / `@returns` are omitted
- [ ] Inline comments explain why, not what
- [ ] Documentation matches the current code
- [ ] Call-site parameter comments use `/* name= */` before the value (or match file legacy style)
- [ ] JSDoc appears before decorators