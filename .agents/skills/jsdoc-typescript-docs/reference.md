# JSDoc Worked Examples

Full examples for the rules in [SKILL.md](SKILL.md). Read this file when you need a complete pattern for a function, class, or interface.

## Function documentation

````ts
/**
 * Calculates the total price including tax and discounts.
 *
 * @description Applies discounts before tax calculation.
 * Discounts are applied in order of magnitude (largest first).
 *
 * @param items - Line items to calculate
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param discounts - Optional discount codes to apply
 * @returns Total price after discounts and tax
 *
 * @throws {ValidationError} If taxRate is negative
 * @throws {InvalidDiscountError} If discount code is invalid
 *
 * @example
 * ```typescript
 * const total = calculateTotal(
 *   [{ price: 100 }, { price: 50 }],
 *   0.08,
 *   ['SAVE10']
 * );
 * // Returns: 145.80 (150 - 10% discount = 135, + 8% tax)
 * ```
 */
function calculateTotal(
  items: LineItem[],
  taxRate: number,
  discounts?: string[],
): number {
  // Implementation
}
````

## Class documentation

````ts
/**
 * Manages user authentication and session lifecycle.
 *
 * @description Handles login, logout, session refresh, and
 * multi-device session management. Uses JWT for stateless
 * authentication with Redis for session invalidation tracking.
 *
 * @example
 * ```typescript
 * const auth = new AuthService(config);
 * const session = await auth.login(credentials);
 * await auth.logout(session.id);
 * ```
 */
class AuthService {
  /**
   * Creates an AuthService instance.
   *
   * @param config - Authentication configuration
   * @param config.jwtSecret - Secret for signing JWTs
   * @param config.sessionTtl - Session time-to-live in seconds
   */
  constructor(private config: AuthConfig) {}

  /**
   * Authenticates a user and creates a session.
   *
   * @param credentials - User credentials
   * @returns Session object with tokens
   * @throws {InvalidCredentialsError} If authentication fails
   */
  async login(credentials: Credentials): Promise<Session> {}
}
````

## Interface and type documentation

```ts
/**
 * Configuration for the caching layer.
 *
 * @description Controls cache behavior including TTL,
 * invalidation strategy, and storage backend selection.
 */
interface CacheConfig {
  /** Time-to-live in seconds. Default: 3600 */
  ttl: number;

  /** Maximum items to cache. Default: 1000 */
  maxSize: number;

  /**
   * Storage backend to use.
   * - 'memory': In-process LRU cache
   * - 'redis': Distributed Redis cache
   */
  backend: "memory" | "redis";

  /** Redis connection string (required if backend is 'redis') */
  redisUrl?: string;
}
```