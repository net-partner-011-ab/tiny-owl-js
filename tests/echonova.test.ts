/**
 * Unit tests for EchoNova — traceId correlation (task 013.5)
 *
 * Covers:
 *  - autoTraceId (default on/off)
 *  - withContext(): immutability, fresh traceId per child, explicit override
 *  - Merge precedence: call-site > scope (withContext) > defaultContext > auto
 *  - Invalid traceId handling (drop with warn, event still ships)
 *  - Wire payload shape (traceId top-level, stripped from context)
 *  - Concurrency safety (two children from same parent don't share traceId)
 */

import { jest } from "@jest/globals";

// ── mock fetch globally (set up in tests/setup.ts for all suites) ──────────
const mockFetch = globalThis.fetch as jest.MockedFunction<
  (...args: any[]) => Promise<any>
>;

// ── import under test ───────────────────────────────────────────────────────
import { EchoNova } from "../src/index.js";

// ── helpers ─────────────────────────────────────────────────────────────────
const BASE_CONFIG = {
  apiKey: "test-api-key",
  projectSecret: "test-project-secret",
  baseUrl: "http://localhost:5001/api",
};

/** Extract the parsed body from the last fetch() call. */
function lastBody(): Record<string, unknown> {
  const calls = mockFetch.mock.calls;
  const last = calls[calls.length - 1];
  const init = last?.[1] as RequestInit | undefined;
  return JSON.parse(init?.body as string);
}

/** UUID v4 pattern. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── tests ────────────────────────────────────────────────────────────────────

describe("EchoNova — autoTraceId", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "ok", data: {} }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("generates a UUID traceId by default (autoTraceId: true)", async () => {
    const logger = new EchoNova(BASE_CONFIG);
    await logger.info("hello");
    expect(lastBody().traceId).toMatch(UUID_RE);
  });

  it("reuses the same instanceTraceId across multiple log calls", async () => {
    const logger = new EchoNova(BASE_CONFIG);
    await logger.info("first");
    const id1 = lastBody().traceId as string;
    await logger.warning("second");
    const id2 = lastBody().traceId as string;
    expect(id1).toBe(id2);
    expect(id1).toMatch(UUID_RE);
  });

  it("does NOT generate a traceId when autoTraceId: false", async () => {
    const logger = new EchoNova({ ...BASE_CONFIG, autoTraceId: false });
    await logger.info("no trace");
    expect(lastBody().traceId).toBeUndefined();
  });

  it("exposes instanceTraceId via getConfig()", () => {
    const logger = new EchoNova(BASE_CONFIG);
    const cfg = logger.getConfig();
    expect((cfg as any).instanceTraceId).toMatch(UUID_RE);
  });

  it("does not expose instanceTraceId when autoTraceId: false", () => {
    const logger = new EchoNova({ ...BASE_CONFIG, autoTraceId: false });
    const cfg = logger.getConfig();
    expect((cfg as any).instanceTraceId).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("EchoNova — withContext()", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "ok", data: {} }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("returns a new EchoNova instance (parent not mutated)", () => {
    const parent = new EchoNova(BASE_CONFIG);
    const child = parent.withContext({ userId: "u1" });
    expect(child).toBeInstanceOf(EchoNova);
    expect(child).not.toBe(parent);
  });

  it("child gets a fresh traceId different from parent's", async () => {
    const parent = new EchoNova(BASE_CONFIG);
    await parent.info("parent event");
    const parentTraceId = lastBody().traceId as string;

    const child = parent.withContext({ userId: "u1" });
    await child.info("child event");
    const childTraceId = lastBody().traceId as string;

    expect(childTraceId).toMatch(UUID_RE);
    expect(childTraceId).not.toBe(parentTraceId);
  });

  it("uses the explicit traceId passed to withContext", async () => {
    const parent = new EchoNova(BASE_CONFIG);
    const child = parent.withContext({ traceId: "my-request-id-001" });
    await child.info("event");
    expect(lastBody().traceId).toBe("my-request-id-001");
  });

  it("merges parent defaultContext into child scope", async () => {
    const parent = new EchoNova({
      ...BASE_CONFIG,
      defaultContext: { service: "checkout" },
    });
    const child = parent.withContext({ userId: "u1" });
    await child.info("event");
    const body = lastBody();
    expect((body.context as any).service).toBe("checkout");
    expect((body.context as any).userId).toBe("u1");
  });

  it("child scope overrides parent defaultContext on key conflict", async () => {
    const parent = new EchoNova({
      ...BASE_CONFIG,
      defaultContext: { env: "staging" },
    });
    const child = parent.withContext({ env: "production" });
    await child.info("event");
    expect((lastBody().context as any).env).toBe("production");
  });

  it("two siblings from the same parent get different traceIds", async () => {
    const parent = new EchoNova(BASE_CONFIG);
    const child1 = parent.withContext({ req: "A" });
    const child2 = parent.withContext({ req: "B" });
    await child1.info("from A");
    const idA = lastBody().traceId as string;
    await child2.info("from B");
    const idB = lastBody().traceId as string;
    expect(idA).toMatch(UUID_RE);
    expect(idB).toMatch(UUID_RE);
    expect(idA).not.toBe(idB);
  });

  it("no child traceId is generated when parent has autoTraceId: false and no explicit traceId", async () => {
    const parent = new EchoNova({ ...BASE_CONFIG, autoTraceId: false });
    const child = parent.withContext({ userId: "u1" });
    await child.info("event");
    expect(lastBody().traceId).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("EchoNova — merge precedence", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "ok", data: {} }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("call-site traceId overrides scope (instanceTraceId)", async () => {
    const logger = new EchoNova(BASE_CONFIG); // auto traceId
    await logger.info("override test", { traceId: "explicit-call" });
    expect(lastBody().traceId).toBe("explicit-call");
  });

  it("call-site context wins over defaultContext on key conflict", async () => {
    const logger = new EchoNova({
      ...BASE_CONFIG,
      defaultContext: { env: "staging", service: "checkout" },
    });
    await logger.info("event", { env: "production" });
    const body = lastBody();
    expect((body.context as any).env).toBe("production");
    expect((body.context as any).service).toBe("checkout");
  });

  it("traceId is NOT injected inside context — only top-level", async () => {
    const logger = new EchoNova(BASE_CONFIG);
    await logger.info("event");
    const body = lastBody();
    expect(body.traceId).toMatch(UUID_RE);
    expect((body.context as any)?.traceId).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("EchoNova — invalid traceId handling", () => {
  let warnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "ok", data: {} }),
    });
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    warnSpy.mockRestore();
  });

  it("drops traceId with a console.warn when it contains illegal chars (e.g. email)", async () => {
    const logger = new EchoNova({ ...BASE_CONFIG, autoTraceId: false });
    await logger.info("event", { traceId: "user@example.com" });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid traceId"),
    );
    // event still ships
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // traceId omitted from payload
    expect(lastBody().traceId).toBeUndefined();
  });

  it("drops traceId that exceeds 128 chars", async () => {
    const logger = new EchoNova({ ...BASE_CONFIG, autoTraceId: false });
    const longId = "a".repeat(129);
    await logger.info("event", { traceId: longId });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid traceId"),
    );
    expect(lastBody().traceId).toBeUndefined();
  });

  it("accepts traceId at exactly 128 chars with valid chars", async () => {
    const logger = new EchoNova({ ...BASE_CONFIG, autoTraceId: false });
    const validId = "a".repeat(128);
    await logger.info("event", { traceId: validId });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(lastBody().traceId).toBe(validId);
  });

  it("accepts W3C-style traceId with dots, dashes, colons", async () => {
    const logger = new EchoNova({ ...BASE_CONFIG, autoTraceId: false });
    const w3cId = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    await logger.info("event", { traceId: w3cId });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(lastBody().traceId).toBe(w3cId);
  });

  it("withContext warns and generates a fresh UUID when given an invalid traceId", () => {
    const parent = new EchoNova(BASE_CONFIG);
    parent.withContext({ traceId: "bad traceId with spaces" });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid traceId in withContext"),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("EchoNova — concurrency safety", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "ok", data: {} }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("10 concurrent children each get a unique traceId", () => {
    // Verify via getConfig() — avoids fetch ordering issues in parallel log calls
    const parent = new EchoNova(BASE_CONFIG);
    const children = Array.from({ length: 10 }, (_, i) =>
      parent.withContext({ req: i }),
    );
    const ids = children.map(
      (child) => child.getConfig().instanceTraceId as string,
    );
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
    ids.forEach((id) => expect(id).toMatch(UUID_RE));
  });
});
