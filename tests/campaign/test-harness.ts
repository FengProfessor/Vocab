/**
 * E2E & Integration Test Harness for 05/09 Back-to-School (Khai Giảng) Campaign.
 * Self-contained, zero-external-dependency test runner and Supabase / NextRequest emulator.
 */

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface SuiteStats {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

export class TestRunner {
  private currentSuite = 'Default Suite';
  private results: TestResult[] = [];
  private beforeHooks: (() => Promise<void> | void)[] = [];
  private afterHooks: (() => Promise<void> | void)[] = [];

  describe(name: string, fn: () => void | Promise<void>) {
    this.currentSuite = name;
    fn();
  }

  beforeEach(fn: () => Promise<void> | void) {
    this.beforeHooks.push(fn);
  }

  afterEach(fn: () => Promise<void> | void) {
    this.afterHooks.push(fn);
  }

  async it(name: string, fn: () => Promise<void> | void): Promise<void> {
    const start = Date.now();
    for (const hook of this.beforeHooks) {
      await hook();
    }

    try {
      await fn();
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: true,
        durationMs,
      });
      console.log(`  [PASS] ${name} (${durationMs}ms)`);
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const error = err instanceof Error ? err : new Error(String(err));
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: false,
        durationMs,
        error,
      });
      console.error(`  [FAIL] ${name} (${durationMs}ms) -> ${error.message}`);
    } finally {
      for (const hook of this.afterHooks) {
        await hook();
      }
    }
  }

  getStats(): SuiteStats {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;
    const durationMs = this.results.reduce((acc, r) => acc + r.durationMs, 0);

    return {
      suiteName: this.currentSuite,
      total,
      passed,
      failed,
      durationMs,
      results: this.results,
    };
  }

  clear() {
    this.results = [];
    this.beforeHooks = [];
    this.afterHooks = [];
  }
}

// ─────────────────────────────────────────
// Expect & Assertion Library
// ─────────────────────────────────────────

export function expect<T>(actual: T) {
  const isNot = false;

  const matchers = (negate: boolean) => ({
    toBe(expected: unknown) {
      const pass = actual === expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to be' : 'to be'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toEqual(expected: unknown) {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to equal' : 'to equal'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toContain(item: unknown) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(String(item));
      } else if (Array.isArray(actual)) {
        pass = actual.includes(item);
      }
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to contain' : 'to contain'} ${JSON.stringify(item)}`,
        );
      }
    },
    toMatch(regex: RegExp) {
      const pass = typeof actual === 'string' && regex.test(actual);
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected "${actual}" ${negate ? 'not to match' : 'to match'} ${regex.toString()}`,
        );
      }
    },
    toBeGreaterThan(expected: number) {
      const pass = typeof actual === 'number' && actual > expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be greater than' : 'to be greater than'} ${expected}`,
        );
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual >= expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be >=' : 'to be >='} ${expected}`,
        );
      }
    },
    toBeLessThan(expected: number) {
      const pass = typeof actual === 'number' && actual < expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be less than' : 'to be less than'} ${expected}`,
        );
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to be null' : 'to be null'}`,
        );
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected value ${negate ? 'to be undefined' : 'to be defined'}`);
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected value ${negate ? 'not to be undefined' : 'to be undefined'}`);
      }
    },
    toThrow(expected?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new Error('Expected a function to test toThrow');
      }
      let threw = false;
      let errorMsg = '';
      try {
        (actual as Function)();
      } catch (e) {
        threw = true;
        errorMsg = e instanceof Error ? e.message : String(e);
      }
      if (negate ? threw : !threw) {
        throw new Error(
          negate
            ? 'Expected function not to throw, but it threw an error'
            : 'Expected function to throw an error, but it did not throw',
        );
      }
      if (!negate && expected) {
        if (typeof expected === 'string') {
          if (!errorMsg.includes(expected)) {
            throw new Error(
              `Expected error message to include "${expected}", but got: "${errorMsg}"`,
            );
          }
        } else if (!expected.test(errorMsg)) {
          throw new Error(
            `Expected error message to match ${expected}, but got: "${errorMsg}"`,
          );
        }
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      const pass = !Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      }
    },
  });

  return {
    ...matchers(false),
    not: matchers(true),
  };
}

export async function assertRejects(
  fn: () => Promise<unknown> | unknown,
  expectedPattern?: RegExp | string,
): Promise<void> {
  let threw = false;
  let thrownError: unknown = null;
  try {
    await fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }

  if (!threw) {
    throw new Error('Expected function to throw an error, but it succeeded.');
  }

  if (expectedPattern && thrownError) {
    const msg = thrownError instanceof Error ? thrownError.message : String(thrownError);
    if (typeof expectedPattern === 'string') {
      if (!msg.includes(expectedPattern)) {
        throw new Error(
          `Expected error message to include "${expectedPattern}", but got: "${msg}"`,
        );
      }
    } else if (!expectedPattern.test(msg)) {
      throw new Error(
        `Expected error message to match ${expectedPattern}, but got: "${msg}"`,
      );
    }
  }
}

// ─────────────────────────────────────────
// In-Memory Supabase Client Emulator
// ─────────────────────────────────────────

export interface MockDatabaseState {
  profiles: Array<{
    id: string;
    email?: string;
    full_name?: string;
    plan?: string;
    plan_expires_at?: string | null;
    province?: string | null;
    daily_goal?: number;
    notification_hour?: number;
    role?: string;
    created_at?: string;
  }>;
  orders: Array<{
    id: string;
    user_id: string;
    plan: string;
    amount: number;
    payment_method: string;
    period_months: number;
    coupon_code: string | null;
    status: string;
    order_kind: string;
    seats: number;
    starts_at?: string;
    expires_at?: string;
    paid_at?: string;
    note?: string | null;
    created_at?: string;
  }>;
  coupons: Array<{
    id: string;
    code: string;
    discount_pct: number | null;
    discount_amount: number | null;
    max_uses: number | null;
    used_count: number;
    valid_from: string;
    valid_until: string | null;
    applicable_plans: string[] | null;
    is_active: boolean;
  }>;
  pilot_leads: Array<{
    id: string;
    contact_name: string;
    email: string;
    phone: string;
    organization: string;
    teacher_count: number;
    student_count: number;
    source: string;
    status: string;
    message: string;
    admin_note?: string | null;
    contacted_at?: string | null;
    converted_at?: string | null;
    created_at: string;
    updated_at?: string;
  }>;
  subscription_history: Array<{
    id: string;
    user_id: string;
    old_plan: string | null;
    new_plan: string;
    reason: string;
    order_id?: string;
    created_at: string;
  }>;
  user_gamification: Array<{
    user_id: string;
    current_streak: number;
    best_streak: number;
    xp: number;
  }>;
}

export function createInitialMockDb(): MockDatabaseState {
  return {
    profiles: [
      {
        id: 'user-free-1',
        email: 'student_free@example.com',
        full_name: 'Học Viên Mất Gốc',
        plan: 'free',
        plan_expires_at: null,
        province: null,
        daily_goal: 10,
        notification_hour: 20,
        role: 'student',
        created_at: '2026-08-01T00:00:00Z',
      },
      {
        id: 'user-active-pro',
        email: 'pro_user@example.com',
        full_name: 'Học Viên VIP',
        plan: 'pro',
        // 30 days active remaining from now
        plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        province: 'Hà Nội',
        daily_goal: 20,
        notification_hour: 19,
        role: 'student',
        created_at: '2026-07-01T00:00:00Z',
      },
      {
        id: 'user-admin-1',
        email: 'thayphong@lingopro.vn',
        full_name: 'Thầy Phong',
        plan: 'premium',
        plan_expires_at: null,
        province: 'Hà Nội',
        role: 'admin',
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
    orders: [],
    coupons: [
      {
        id: 'cp-khaigiang',
        code: 'KHAIGIANG3M',
        discount_pct: 100,
        discount_amount: null,
        max_uses: 10000,
        used_count: 0,
        valid_from: '2026-09-01T00:00:00Z',
        valid_until: '2026-12-31T23:59:59Z',
        applicable_plans: ['pro'],
        is_active: true,
      },
      {
        id: 'cp-thayphong',
        code: 'THAYPHONG3M',
        discount_pct: 100,
        discount_amount: null,
        max_uses: 5000,
        used_count: 0,
        valid_from: '2026-09-01T00:00:00Z',
        valid_until: '2026-12-31T23:59:59Z',
        applicable_plans: ['pro'],
        is_active: true,
      },
      {
        id: 'cp-expired',
        code: 'EXPIRED3M',
        discount_pct: 100,
        discount_amount: null,
        max_uses: 100,
        used_count: 10,
        valid_from: '2026-01-01T00:00:00Z',
        valid_until: '2026-08-01T00:00:00Z',
        applicable_plans: ['pro'],
        is_active: true,
      },
      {
        id: 'cp-inactive',
        code: 'INACTIVE3M',
        discount_pct: 100,
        discount_amount: null,
        max_uses: 100,
        used_count: 0,
        valid_from: '2026-09-01T00:00:00Z',
        valid_until: '2026-12-31T00:00:00Z',
        applicable_plans: ['pro'],
        is_active: false,
      },
    ],
    pilot_leads: [],
    subscription_history: [],
    user_gamification: [],
  };
}

export function createMockSupabaseClient(initialDb?: MockDatabaseState) {
  const db: MockDatabaseState = initialDb || createInitialMockDb();

  let authedUser: { id: string; email?: string } | null = {
    id: 'user-free-1',
    email: 'student_free@example.com',
  };

  const client = {
    _db: db,
    setAuthUser(user: { id: string; email?: string } | null) {
      authedUser = user;
    },
    auth: {
      async getUser(token?: string) {
        if (!token && !authedUser) {
          return { data: { user: null }, error: new Error('No token') };
        }
        if (token === 'admin-token') {
          return {
            data: { user: { id: 'user-admin-1', email: 'thayphong@lingopro.vn' } },
            error: null,
          };
        }
        if (token === 'pro-token') {
          return {
            data: { user: { id: 'user-active-pro', email: 'pro_user@example.com' } },
            error: null,
          };
        }
        return { data: { user: authedUser }, error: null };
      },
    },
    from(tableName: keyof MockDatabaseState) {
      const filters: Array<(item: any) => boolean> = [];
      let orderByField: string | null = null;
      let orderAscending = true;
      let limitCount: number | null = null;

      const queryBuilder = {
        select(fields = '*') {
          return queryBuilder;
        },
        eq(field: string, value: any) {
          filters.push((item) => item[field] === value);
          return queryBuilder;
        },
        in(field: string, values: any[]) {
          filters.push((item) => values.includes(item[field]));
          return queryBuilder;
        },
        order(field: string, opts?: { ascending?: boolean }) {
          orderByField = field;
          orderAscending = opts?.ascending ?? true;
          return queryBuilder;
        },
        limit(count: number) {
          limitCount = count;
          return queryBuilder;
        },
        async single() {
          const rows = queryBuilder._execute();
          if (rows.length === 0) {
            return { data: null, error: new Error(`Row not found in ${String(tableName)}`) };
          }
          return { data: rows[0], error: null };
        },
        async maybeSingle() {
          const rows = queryBuilder._execute();
          return { data: rows[0] || null, error: null };
        },
        async then(resolve: (value: { data: any; error: any }) => void) {
          const rows = queryBuilder._execute();
          resolve({ data: rows, error: null });
        },
        _execute() {
          const table = (db[tableName] as any[]) || [];
          let result = table.filter((item) => filters.every((fn) => fn(item)));
          if (orderByField) {
            result = [...result].sort((a, b) => {
              if (a[orderByField!] < b[orderByField!]) return orderAscending ? -1 : 1;
              if (a[orderByField!] > b[orderByField!]) return orderAscending ? 1 : -1;
              return 0;
            });
          }
          if (limitCount !== null) {
            result = result.slice(0, limitCount);
          }
          return result;
        },
        insert(records: any | any[]) {
          const list = Array.isArray(records) ? records : [records];
          const inserted: any[] = [];
          for (const item of list) {
            const row = {
              id: item.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              created_at: item.created_at || new Date().toISOString(),
              ...item,
            };
            (db[tableName] as any[]).push(row);
            inserted.push(row);
          }

          return {
            select(fields = '*') {
              return {
                single: async () => ({ data: inserted[0], error: null }),
                maybeSingle: async () => ({ data: inserted[0] || null, error: null }),
                then: (resolve: (v: { data: any[]; error: any }) => void) =>
                  resolve({ data: inserted, error: null }),
              };
            },
            async single() {
              return { data: inserted[0], error: null };
            },
            async then(resolve: (v: { data: any[]; error: any }) => void) {
              resolve({ data: inserted, error: null });
            },
          };
        },
        update(updates: any) {
          return {
            eq(field: string, value: any) {
              filters.push((item) => item[field] === value);
              return {
                select(fields = '*') {
                  return {
                    single: async () => {
                      const rows = queryBuilder._execute();
                      if (rows.length === 0) {
                        return { data: null, error: new Error('Update target not found') };
                      }
                      Object.assign(rows[0], updates);
                      return { data: rows[0], error: null };
                    },
                  };
                },
                then: async (resolve: (v: { data: any; error: any }) => void) => {
                  const rows = queryBuilder._execute();
                  for (const r of rows) {
                    Object.assign(r, updates);
                  }
                  resolve({ data: rows, error: null });
                },
              };
            },
          };
        },
      };

      return queryBuilder;
    },
    async rpc(name: string, args: Record<string, any>) {
      if (name === 'redeem_free_coupon_order') {
        const { p_user_id, p_plan, p_coupon_code, p_base_amount } = args;
        const now = new Date();
        const profile = db.profiles.find((p) => p.id === p_user_id);
        const startsAt = profile?.plan_expires_at && new Date(profile.plan_expires_at) > now
          ? new Date(profile.plan_expires_at)
          : now;
        
        // Compute 90 days for campaign codes
        const days = ['KHAIGIANG3M', 'THAYPHONG3M'].includes(p_coupon_code?.toUpperCase()) ? 90 : 30;
        const expiresAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000);

        const newOrder = {
          id: `ord-${Date.now()}`,
          user_id: p_user_id,
          plan: p_plan,
          amount: 0,
          payment_method: args.p_payment_method || 'bank_transfer',
          period_months: args.p_period_months || 1,
          coupon_code: p_coupon_code,
          status: 'paid',
          order_kind: 'individual',
          seats: 1,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          paid_at: now.toISOString(),
          created_at: now.toISOString(),
        };
        db.orders.push(newOrder);

        if (profile) {
          const oldPlan = profile.plan || 'free';
          profile.plan = p_plan;
          profile.plan_expires_at = expiresAt.toISOString();

          db.subscription_history.push({
            id: `sub-${Date.now()}`,
            user_id: p_user_id,
            old_plan: oldPlan,
            new_plan: p_plan,
            reason: 'payment',
            order_id: newOrder.id,
            created_at: now.toISOString(),
          });
        }

        return { data: [newOrder], error: null };
      }

      if (name === 'increment_coupon_usage') {
        const coupon = db.coupons.find((c) => c.code === args.p_code);
        if (coupon) coupon.used_count += 1;
        return { data: true, error: null };
      }

      if (name === 'confirm_paid_order') {
        const order = db.orders.find((o) => o.id === args.p_order_id);
        if (!order) return { data: null, error: new Error('Order not found') };
        order.status = 'paid';
        return {
          data: { success: true, plan: order.plan, expiresAt: order.expires_at || '' },
          error: null,
        };
      }

      return { data: null, error: new Error(`Mock RPC ${name} not implemented`) };
    },
  };

  return client;
}
