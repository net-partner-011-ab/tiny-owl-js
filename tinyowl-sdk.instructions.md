# TinyOwl SDK — AI Agent Integration Instructions

> Drop this file in your project root and tell your AI agent:
> **"Follow the instructions in `tinyowl-sdk.instructions.md` and integrate the TinyOwl SDK."**

---

## What is TinyOwl?

TinyOwl is a lightweight observability and event logging platform. The SDK sends structured events (info, warning, error) to a TinyOwl backend with optional HMAC-signed security.

---

## Step 1 — Install the package

```bash
npm install @tiny-owl-kit/observability
# or
yarn add @tiny-owl-kit/observability
```

---

## Step 2 — Add credentials to your `.env` file

You need two credentials from the TinyOwl dashboard:

```bash
# .env
TINYOWL_API_KEY=your_api_key_here
TINYOWL_PROJECT_SECRET=your_project_secret_here
TINYOWL_BASE_URL=https://be.tiny-owl-kit.io/api   # or http://localhost:5001/api for local dev
```

**Never hardcode credentials in source code.** Always read from environment variables.

---

## Step 3 — Initialize the client

The exported class is `TinyOwl`. Import it once and reuse the instance.

### JavaScript / CommonJS

```javascript
import { TinyOwl } from "@tiny-owl-kit/observability";

export const logger = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET, // enables HMAC signing
  baseUrl: process.env.TINYOWL_BASE_URL, // optional, defaults to http://localhost:5001/api
  timeout: 5000, // optional, milliseconds
});
```

### TypeScript

```typescript
import {
  TinyOwl,
  type LogOptions,
  type LogResponse,
} from "@tiny-owl-kit/observability";

export const logger = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY!,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET,
  baseUrl: process.env.TINYOWL_BASE_URL,
});
```

**Important:** When `projectSecret` is provided, HMAC signing is enabled automatically.
Both `apiKey` and `projectSecret` are required for production use.

---

## Step 4 — Log events

### Convenience methods (recommended)

```javascript
// Info — regular operational events
await logger.info("User signed in", { userId: "abc123", method: "password" });

// Warning — unusual events that may need attention
await logger.warning("Disk space low", { availableGB: 1.2 });

// Error — failures that need immediate attention
await logger.error("Payment failed", {
  orderId: "ORD-999",
  reason: "Card declined",
});
```

### Generic log method

```javascript
await logger.log("Order created", {
  severity: "info", // "info" | "warning" | "error"  (default: "info")
  context: {
    orderId: "ORD-001",
    amount: 49.99,
  },
});
```

### Method signatures

| Method                       | Parameters                                             | Notes                                        |
| ---------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| `log(message, options?)`     | `message: string`, `options?: { severity?, context? }` | Generic, severity defaults to `"info"`       |
| `info(message, context?)`    | `message: string`, `context?: Record<string, any>`     | Shorthand for severity `"info"`              |
| `warning(message, context?)` | `message: string`, `context?: Record<string, any>`     | Shorthand for severity `"warning"`           |
| `error(message, context?)`   | `message: string`, `context?: Record<string, any>`     | Shorthand for severity `"error"`             |
| `getConfig()`                | —                                                      | Returns config metadata (no secrets exposed) |

---

## Step 5 — Handle errors

Wrap logging calls so SDK failures never crash the application:

```javascript
async function safeLog(message, context = {}) {
  try {
    await logger.error(message, context);
  } catch (err) {
    // Log to console as fallback; never let observability failures break the app
    console.error("[TinyOwl] Logging failed:", err.message);
  }
}
```

### Common error messages

| Error                                                      | Cause                 | Fix                                 |
| ---------------------------------------------------------- | --------------------- | ----------------------------------- |
| `"API key is required"`                                    | `apiKey` missing      | Set `TINYOWL_API_KEY` env var       |
| `"Invalid signature"`                                      | Wrong `projectSecret` | Verify `TINYOWL_PROJECT_SECRET`     |
| `"Request timestamp is too old"`                           | Clock skew > 1 min    | Check server time sync              |
| `"Nonce already used (replay attack)"`                     | Duplicate request     | SDK handles this automatically      |
| `"Request timeout after 5000ms"`                           | Network issue         | Check `baseUrl`, increase `timeout` |
| `"Invalid severity. Must be one of: info, warning, error"` | Wrong severity value  | Use only allowed values             |

---

## Framework integration examples

### Express.js middleware

```javascript
// middleware/logger.js
import { TinyOwl } from "@tiny-owl-kit/observability";

export const logger = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET,
  baseUrl: process.env.TINYOWL_BASE_URL,
});

// Error handler middleware — add AFTER all other middleware
export function errorLoggingMiddleware(err, req, res, next) {
  logger
    .error("Unhandled server error", {
      method: req.method,
      path: req.path,
      statusCode: err.status || 500,
      error: err.message,
    })
    .catch(() => {}); // never await in error handler

  next(err);
}
```

### Next.js (App Router)

```typescript
// lib/logger.ts
import { TinyOwl } from "@tiny-owl-kit/observability";

// Singleton — reuse across server-side calls
export const logger = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY!,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET,
  baseUrl: process.env.TINYOWL_BASE_URL,
});
```

```typescript
// app/api/orders/route.ts
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    // ... handle order
    await logger.info("Order created", { orderId: body.orderId });
    return Response.json({ success: true });
  } catch (error) {
    await logger.error("Order creation failed", {
      error: (error as Error).message,
    });
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
```

### Node.js background job

```javascript
import { TinyOwl } from "@tiny-owl-kit/observability";

const logger = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET,
});

export async function processJob(job) {
  await logger.info("Job started", { jobId: job.id, type: job.type });

  try {
    await doWork(job);
    await logger.info("Job completed", {
      jobId: job.id,
      duration: job.duration,
    });
  } catch (error) {
    await logger.error("Job failed", { jobId: job.id, error: error.message });
    throw error;
  }
}
```

---

## What NOT to log

```javascript
// ❌ Never log sensitive data
await logger.info("User login", { password: user.password });
await logger.info("Payment", { cardNumber: "4111..." });
await logger.info("Auth", { token: req.headers.authorization });

// ✅ Log safe identifiers and outcomes instead
await logger.info("User login", { userId: user.id, method: "password" });
await logger.info("Payment processed", {
  orderId: order.id,
  amount: order.total,
});
await logger.info("Auth checked", { userId: req.user.id, endpoint: req.path });
```

---

## API response shape

All logging methods resolve to:

```typescript
{
  success: boolean;
  message: string;
  data?: {
    eventId: string;      // unique ID of the stored event
    timestamp: string;    // ISO 8601
    hmacVerified?: boolean; // true when projectSecret was used
  };
}
```

---

## Verify the integration

Run this one-time check to confirm credentials and connectivity work:

```javascript
import { TinyOwl } from "@tiny-owl-kit/observability";

const logger = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET,
  baseUrl: process.env.TINYOWL_BASE_URL,
});

// Config check (never logs secrets)
console.log(logger.getConfig());
// Expected output:
// { baseUrl: "...", timeout: 5000, hasApiKey: true, hasProjectSecret: true, hmacEnabled: true }

// Connectivity test
const result = await logger.info("SDK integration test");
console.log(result);
// Expected: { success: true, message: "Event logged successfully", data: { eventId: "...", ... } }
```

---

## Requirements

- Node.js 18+ (or any runtime with native `fetch`)
- A running TinyOwl backend (local: `http://localhost:5001`, production: your hosted URL)
- API key and project secret from TinyOwl dashboard

---

## References

- [README](./README.md) — full SDK documentation
- [security-examples.js](./examples/security-examples.js) — security feature examples
- [security-hardening.js](./examples/security-hardening.js) — production hardening examples
- [TypeScript definitions](./index.d.ts) — full type reference
