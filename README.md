# TinyOwl JS SDK

Official JavaScript SDK for TinyOwl Observability - A lightweight event logging and monitoring solution with enterprise-grade security features.

## 🤖 AI Agent Setup

Drop [`tinyowl-sdk.instructions.md`](https://github.com/net-partner-011-ab/tiny-owl-js/blob/main/tinyowl-sdk.instructions.md) into your project root and tell your AI agent or Copilot:

> "Follow the instructions in `tinyowl-sdk.instructions.md` and integrate the TinyOwl SDK."

The file contains step-by-step integration instructions, framework examples (Express, Next.js, Node.js), error handling patterns, and security guidelines — everything an AI agent needs to complete the integration in one pass.

---

## ⚡ Quick Start

```javascript
import { TinyOwl } from "@tiny-owl-kit/observability";

// TinyOwl SDK - Enhanced Security Mode (Required)
const tinyowl = new TinyOwl({
  apiKey: "YOUR_API_KEY",
  projectSecret: "YOUR_PROJECT_SECRET", // 🔒 Required for HMAC verification
});

// Log an event
await tinyowl.log("User signed in", {
  severity: "info",
  context: { userId: "123" },
});
```

## 🛡️ Security Features

All requests to the TinyOwl backend **require HMAC signature verification**. The following security features are mandatory:

### HMAC Signature Verification (Required)

- **Payload Integrity**: SHA-256 HMAC ensures data hasn't been tampered with
- **Secret-based Authentication**: Uses project secret separate from API key
- **Mandatory Security**: Always enabled - `projectSecret` is required

### Timestamp Validation

- **Replay Protection**: Requests must be within 1 minute of server time
- **Clock Skew Tolerance**: 30-second tolerance for clock differences
- **Automatic Timestamping**: SDK handles timestamp generation

### Nonce-based Protection

- **Cryptographically Secure**: Uses crypto.randomBytes for nonce generation
- **Replay Attack Prevention**: Each request uses a unique nonce
- **Automatic Management**: SDK handles nonce generation and validation

## 📦 Installation

```bash
npm install @tiny-owl-kit/observability
```

## 🔧 Configuration

```javascript
const client = new TinyOwl({
  apiKey: "YOUR_API_KEY", // Required: Project API key
  projectSecret: "YOUR_PROJECT_SECRET", // Required: For HMAC verification
  baseUrl: "https://be.tiny-owl-kit.io", // Optional: API endpoint
  timeout: 5000, // Optional: Request timeout (ms)
});
```

**Note**: Both `apiKey` and `projectSecret` are required. The backend enforces HMAC verification for all requests.

## 🚀 Usage Examples

### Basic Logging

```javascript
// Simple info log
await client.log("User signed in");

// Log with severity
await client.log("Payment processed", { severity: "info" });

// Log with context data
await client.log("Order created", {
  severity: "info",
  context: {
    orderId: "ORD-12345",
    amount: 99.99,
    currency: "USD",
  },
});
```

### Severity Levels

The SDK supports three severity levels: `info`, `warning`, and `error`.

```javascript
// Info level (default)
await client.log("User logged in", { severity: "info" });

// Warning level
await client.log("API rate limit approaching", {
  severity: "warning",
  context: { currentRate: 95 },
});

// Error level
await client.log("Database connection failed", {
  severity: "error",
  context: {
    database: "users",
    error: "Connection timeout",
  },
});
```

### Convenience Methods

The SDK provides convenience methods for each severity level:

```javascript
// Info logging
await client.info("User logged in", { userId: "123" });

// Warning logging
await client.warning("Disk space low", { availableGB: 2 });

// Error logging
await client.error("Payment failed", {
  orderId: "ORD-123",
  error: "Card declined",
});
```

### 📁 Example Files

For complete, runnable examples, check out these files in the repository:

- **[security-examples.js](./examples/security-examples.js)** - Basic security features, SDK configuration, error handling, and manual HMAC implementation
- **[security-hardening.js](./examples/security-hardening.js)** - Production-ready examples, audit trails, rate limiting, HTTPS enforcement, and SDK self-tracking

These examples demonstrate all security features and best practices for production deployments.

### Real-World Examples

#### E-commerce Application

```javascript
import { TinyOwl } from "@tiny-owl-kit/observability";

const logger = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET,
});

// Track successful purchases
async function trackPurchase(order) {
  await logger.info("Purchase completed", {
    orderId: order.id,
    amount: order.total,
    items: order.items.length,
    userId: order.userId,
  });
}

// Track payment failures
async function trackPaymentError(order, error) {
  await logger.error("Payment processing failed", {
    orderId: order.id,
    amount: order.total,
    error: error.message,
    paymentMethod: order.paymentMethod,
  });
}

// Track inventory warnings
async function trackLowStock(product) {
  await logger.warning("Low stock alert", {
    productId: product.id,
    currentStock: product.stock,
    threshold: product.minStock,
  });
}
```

#### User Authentication

```javascript
// Successful login
await client.info("User login successful", {
  userId: user.id,
  email: user.email,
  loginMethod: "password",
  ip: request.ip,
});

// Failed login attempt
await client.warning("Failed login attempt", {
  email: request.body.email,
  reason: "Invalid password",
  ip: request.ip,
  attempts: loginAttempts,
});

// Account locked
await client.error("Account locked due to multiple failed attempts", {
  userId: user.id,
  email: user.email,
  failedAttempts: 5,
});
```

#### API Monitoring

```javascript
// Track API response times
await client.info("API request completed", {
  endpoint: "/api/users",
  method: "GET",
  responseTime: 145,
  statusCode: 200,
});

// Track slow queries
await client.warning("Slow database query detected", {
  query: "SELECT * FROM orders WHERE...",
  duration: 2500,
  threshold: 1000,
});

// Track API errors
await client.error("API request failed", {
  endpoint: "/api/payments",
  method: "POST",
  statusCode: 500,
  error: error.message,
});
```

## Error Handling

The SDK throws errors for invalid inputs and network issues:

```javascript
try {
  await client.log("Event message", { severity: "info" });
} catch (error) {
  console.error("Failed to log event:", error.message);

  // Handle specific security errors
  if (error.message.includes("Invalid signature")) {
    console.error("HMAC verification failed - check project secret");
  } else if (error.message.includes("timestamp is too old")) {
    console.error("Request timeout - check network connectivity");
  } else if (error.message.includes("replay attack")) {
    console.error("Duplicate request detected");
  }
}
```

### Common Errors

- **Invalid API Key**: `401 Unauthorized`
- **Invalid Signature**: `"Invalid signature"` (HMAC verification failed)
- **Timestamp Too Old**: `"Request timestamp is too old"` (> 1 minute)
- **Replay Attack**: `"Nonce already used (replay attack)"`
- **Missing Project Secret**: `"Project secret not configured for HMAC verification"`
- **Invalid Severity**: `"Invalid severity. Must be one of: info, warning, error"`
- **Missing Message**: `"Message is required and must be a string"`
- **Request Timeout**: `"Request timeout after 5000ms"`

## TypeScript Support

The SDK includes full TypeScript definitions:

```typescript
import { TinyOwl, Severity, LogOptions } from "@tiny-owl-kit/observability";

const client = new TinyOwl({
  apiKey: "YOUR_API_KEY",
  projectSecret: "YOUR_PROJECT_SECRET",
});

const options: LogOptions = {
  severity: "info",
  context: {
    userId: "123",
    action: "login",
  },
};

await client.log("User action", options);
```

## API Response

All logging methods return a promise that resolves to:

```typescript
{
  success: true,
  message: "Event logged successfully",
  data: {
    eventId: "64f1a2b3c4d5e6f7g8h9i0j1",
    timestamp: "2025-09-18T10:30:45.123Z",
    hmacVerified: true  // Always true - HMAC verification is mandatory
  }
}
```

## 🔒 Advanced Security Usage

### Manual HMAC Implementation

For advanced use cases, you can manually create security headers:

```javascript
import {
  createSecureHeaders,
  signPayload,
  generateNonce,
} from "@tiny-owl-kit/observability";

const eventData = {
  message: "Custom security implementation",
  severity: "info",
  context: { custom: "data" },
};

const securityHeaders = createSecureHeaders(eventData, projectSecret);

const response = await fetch("https://be.tiny-owl-kit.io/api/ingest", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...securityHeaders,
  },
  body: JSON.stringify({
    apiKey: "your-api-key",
    ...eventData,
  }),
});
```

### Configuration Debugging

Check your SDK security configuration:

```javascript
const config = client.getConfig();
console.log(config);
// Output:
// {
//   baseUrl: "https://be.tiny-owl-kit.io",
//   timeout: 5000,
//   hasApiKey: true,
//   hasProjectSecret: true,
//   hmacEnabled: true  // Always true
// }
```

## 📚 Migration Guide

Upgrading from the legacy SDK without HMAC? You must now provide a `projectSecret`:

```javascript
// Before (Legacy - No longer supported)
const client = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY,
});

// After (Required)
const client = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET, // Now required
});
```

## 🔧 Environment Variables

Store your credentials securely:

```bash
# .env file
TINYOWL_API_KEY=your_api_key_here
TINYOWL_PROJECT_SECRET=your_project_secret_here
```

```javascript
const client = new TinyOwl({
  apiKey: process.env.TINYOWL_API_KEY,
  projectSecret: process.env.TINYOWL_PROJECT_SECRET,
});
```

## Best Practices

### 🔒 Security Best Practices

1. **Always Provide Project Secret**: The `projectSecret` is required for all requests

   ```javascript
   const client = new TinyOwl({
     apiKey: process.env.TINYOWL_API_KEY,
     projectSecret: process.env.TINYOWL_PROJECT_SECRET, // Required
   });
   ```

2. **Secure Credential Storage**: Use environment variables or secret managers

   ```javascript
   // ✅ Good - Environment variables
   const client = new TinyOwl({
     apiKey: process.env.TINYOWL_API_KEY,
     projectSecret: process.env.TINYOWL_PROJECT_SECRET,
   });

   // ❌ Bad - Hardcoded secrets
   const client = new TinyOwl({
     apiKey: "hardcoded-api-key",
     projectSecret: "hardcoded-secret",
   });
   ```

3. **Verify HMAC in Responses**: The `hmacVerified` field confirms secure transmission

   ```javascript
   const response = await client.log("Event");
   console.log(response.data.hmacVerified); // Always true
   ```

### 🚀 General Best Practices

1. **Handle Errors Gracefully**: Don't let logging errors crash your application

   ```javascript
   try {
     await client.log("Event");
   } catch (error) {
     console.error("Logging failed:", error);
     // Continue application flow
   }
   ```

2. **Use Appropriate Severity Levels**:
   - `info`: Regular operational events
   - `warning`: Unusual events that may require attention
   - `error`: Errors and failures that need immediate attention

3. **Include Relevant Context**: Add useful context data for debugging

   ```javascript
   await client.error("Database query failed", {
     query: "SELECT...",
     database: "users",
     duration: 5000,
     error: error.message,
   });
   ```

4. **Don't Log Sensitive Data**: Avoid logging passwords, tokens, or PII

   ```javascript
   // ❌ Bad
   await client.log("User login", { password: user.password });

   // ✅ Good
   await client.log("User login", { userId: user.id });
   ```

5. **Monitor Performance**: Track SDK response times and failures

   ```javascript
   const start = Date.now();
   try {
     await client.log("Performance test");
     const duration = Date.now() - start;
     if (duration > 1000) {
       console.warn(`Slow logging: ${duration}ms`);
     }
   } catch (error) {
     console.error("Logging failed:", error);
   }
   ```

## Requirements

- Node.js 18+ (or any environment with `fetch` support)
- TinyOwl backend service running and accessible

## Links

- [GitHub Repository](https://github.com/Regis011/tiny-owl-kit)
- [TinyOwl Documentation](https://github.com/Regis011/tiny-owl-kit/tree/main/docs)
- [API Reference](https://github.com/Regis011/tiny-owl-kit/blob/main/docs/API.md)

## License

MIT License - see [LICENSE](../LICENSE) file for details.

## Support

For issues and questions:

- [GitHub Issues](https://github.com/Regis011/tiny-owl-kit/issues)
- [Documentation](https://github.com/Regis011/tiny-owl-kit/tree/main/docs)

---

**Version**: 1.2.2  
**Last Updated**: March 30, 2026
