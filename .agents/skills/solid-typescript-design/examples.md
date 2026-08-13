# SOLID TypeScript Design — Examples

Concrete before/after TypeScript for each SOLID principle. See [SKILL.md](SKILL.md)
for rules. See [reference.md](reference.md) for lookup tables.

---

## Example 1: SRP — split a fat user service

**Violating:** one class creates users, sends email, and logs activity.

```ts
class UserService {
  createUser(email: string, password: string): void {
    // persist user
    console.log(`Created user ${email}`);
    // send welcome email
    console.log(`Email sent to ${email}`);
    // log activity
    console.log(`Activity: createUser for ${email}`);
  }
}
```

**Correct:** one responsibility per type; compose at the call site.

```ts
class UserService {
  createUser(email: string, password: string): { id: string; email: string } {
    const user = { id: crypto.randomUUID(), email };
    // persist user
    return user;
  }
}

class EmailService {
  sendWelcome(email: string): void {
    console.log(`Email sent to ${email}`);
  }
}

class ActivityLogger {
  log(username: string, activity: string): void {
    console.log(`Activity logged: ${activity} for ${username}`);
  }
}

const users = new UserService();
const mail = new EmailService();
const activity = new ActivityLogger();

const user = users.createUser("john@example.com", "secret");
mail.sendWelcome(user.email);
activity.log(user.email, "createUser");
```

**Why it matters:** profile persistence, email templates, and audit policy change
for different reasons. Splitting keeps each change local.

---

## Example 2: OCP — payment methods without editing the processor

**Violating:** adding a method means editing `PaymentProcessor`.

```ts
class PaymentProcessor {
  processPayment(type: string, amount: number): void {
    if (type === "credit") {
      console.log(`Paid ${amount} with credit card`);
    } else if (type === "paypal") {
      console.log(`Paid ${amount} with PayPal`);
    } else {
      throw new Error(`Unsupported payment type: ${type}`);
    }
  }
}
```

**Correct:** strategy interface; new methods are new classes.

```ts
interface PaymentMethod {
  pay(amount: number): void;
}

class CreditCardPayment implements PaymentMethod {
  pay(amount: number): void {
    console.log(`Paid ${amount} using Credit Card`);
  }
}

class PaypalPayment implements PaymentMethod {
  pay(amount: number): void {
    console.log(`Paid ${amount} using PayPal`);
  }
}

class PaymentProcessor {
  constructor(private readonly paymentMethod: PaymentMethod) {}

  processPayment(amount: number): void {
    this.paymentMethod.pay(amount);
  }
}

const processor = new PaymentProcessor(new CreditCardPayment());
processor.processPayment(42);
```

**Same idea for shapes:** each shape implements `area()`; a calculator sums
`shape.area()` and never branches on type.

```ts
interface Shape {
  area(): number;
}

class Circle implements Shape {
  constructor(public readonly radius: number) {}

  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle implements Shape {
  constructor(
    public readonly length: number,
    public readonly width: number,
  ) {}

  area(): number {
    return this.length * this.width;
  }
}

function totalArea(shapes: Shape[]): number {
  return shapes.reduce((sum, shape) => sum + shape.area(), 0);
}
```

**Why it matters:** new variants extend the system without reopening the
orchestrator and risking regressions.

---

## Example 3: LSP — honest substitution for birds

**Violating:** subtype breaks the base contract.

```ts
class Bird {
  fly(): void {
    console.log("Flying");
  }
}

class Ostrich extends Bird {
  fly(): void {
    throw new Error("Ostriches cannot fly");
  }
}

function migrate(bird: Bird): void {
  bird.fly();
}

migrate(new Ostrich()); // blows up
```

**Correct:** model shared behavior every subtype can fulfill.

```ts
abstract class Bird {
  abstract move(): void;
}

class FlyingBird extends Bird {
  move(): void {
    console.log("Flying");
  }
}

class WalkingBird extends Bird {
  move(): void {
    console.log("Walking");
  }
}

class Sparrow extends FlyingBird {}
class Ostrich extends WalkingBird {}

function relocate(bird: Bird): void {
  bird.move();
}

relocate(new Sparrow());
relocate(new Ostrich());
```

**Rectangle / Square note:** if `Square` overrides setters so width and height
always match, callers that set width and height independently on a `Rectangle`
get wrong areas. Prefer separate types (or a shared read-only shape) over
forcing square into a mutable rectangle hierarchy.

**Why it matters:** polymorphic APIs are only safe when every subtype honors the
same contract.

---

## Example 4: ISP — role interfaces for workers

**Violating:** robot forced to implement `eat`.

```ts
interface Worker {
  work(): void;
  eat(): void;
}

class Robot implements Worker {
  work(): void {
    console.log("Robot working");
  }

  eat(): void {
    throw new Error("Robots do not eat");
  }
}
```

**Correct:** segregate roles; implement only what applies.

```ts
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

class Human implements Workable, Eatable {
  work(): void {
    console.log("Human working");
  }

  eat(): void {
    console.log("Human eating");
  }
}

class Robot implements Workable {
  work(): void {
    console.log("Robot working");
  }
}
```

**Why it matters:** fat interfaces create fake implementations and couple clients
to methods they never call.

---

## Example 5: DIP — inject a database abstraction

**Violating:** high-level service owns a concrete database.

```ts
class MySQLDatabase {
  connect(): void {
    console.log("Connecting to MySQL");
  }

  query(sql: string): void {
    console.log(`Querying MySQL: ${sql}`);
  }
}

class UserService {
  private readonly database = new MySQLDatabase();

  createUser(id: string): void {
    this.database.connect();
    this.database.query(`INSERT INTO users (id) VALUES ('${id}')`);
  }
}
```

**Correct:** both sides depend on an abstraction; inject the concrete.

```ts
interface Database {
  connect(): void;
  query(sql: string): void;
}

class MySQLDatabase implements Database {
  connect(): void {
    console.log("Connecting to MySQL");
  }

  query(sql: string): void {
    console.log(`Querying MySQL: ${sql}`);
  }
}

class PostgresDatabase implements Database {
  connect(): void {
    console.log("Connecting to PostgreSQL");
  }

  query(sql: string): void {
    console.log(`Querying PostgreSQL: ${sql}`);
  }
}

class UserService {
  constructor(private readonly database: Database) {}

  createUser(id: string): void {
    this.database.connect();
    this.database.query(`INSERT INTO users (id) VALUES ('${id}')`);
  }
}

const users = new UserService(new MySQLDatabase());
users.createUser("u-1");

const usersOnPostgres = new UserService(new PostgresDatabase());
usersOnPostgres.createUser("u-2");
```

**Why it matters:** swapping storage, using an in-memory fake in tests, or adding
a new backend does not rewrite the domain service—only the wiring.
