# TinyOwl JS SDK

Official JavaScript SDK for TinyOwl Observability - A lightweight event logging and monitoring solution with enterprise-grade security features.

## ⚡ Quick Start

```javascript
import { TinyOwl, initTinyIT } from "@tinyOwlJs/observability";

// TinyOwl SDK - Enhanced Security Mode (Recommended)
const tinyowl = new TinyOwl({
  apiKey: "YOUR_API_KEY",
  projectSecret: "YOUR_PROJECT_SECRET", // 🔒 For HMAC verification
});

// Or use the new TinyIT SDK
const tinyit = initTinyIT({
  apiUrl: "https://api.tinyowl.com",
  apiKey: "YOUR_API_KEY",
});

// Log an event
await tinyowl.log("User signed in", {
  severity: "info",
  context: { userId: "123" },
});

// Or with TinyIT
await tinyit.info("User signed in", { userId: "123" });
```

## 🛡️ Security Features

### HMAC Signature Verification

- **Payload Integrity**: SHA-256 HMAC ensures data hasn't been tampered with
- **Secret-based Authentication**: Uses project secret separate from API key
- **Automatic Security**: Enabled by default when `projectSecret` is provided

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
npm install @tinyOwlJs/observability
```

## 🔧 Configuration

### TinyOwl SDK (Legacy Compatible)

```javascript
const client = new TinyOwl({
  apiKey: "YOUR_API_KEY", // Required: Project API key
  projectSecret: "YOUR_PROJECT_SECRET", // Required: For HMAC verification
  baseUrl: "https://api.tinyowl.com", // Optional: API endpoint
  timeout: 5000, // Optional: Request timeout (ms)
  enableHMAC: true, // Optional: Enable HMAC (default: true)
});
```

### TinyIT SDK (Modern)

```javascript
const tinyit = initTinyIT({
  apiUrl: "https://api.tinyowl.com",
  apiKey: "YOUR_API_KEY",
  options: {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 5000,
  },
});
```

### Legacy Mode (Backward Compatible)

```javascript
const client = new TinyOwl({
  apiKey: "YOUR_API_KEY",
  enableHMAC: false, // Disable security features
});
```

## 🚀 Usage Examples

### Basic Logging with TinyOwl SDK

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

### TinyIT SDK (Modern Approach)

```javascript
// Direct logging methods
await tinyit.info("User signed in", { userId: "123" });
await tinyit.warn("API rate limit approaching", { currentRate: 95 });
await tinyit.error("Database connection failed", { database: "users" });
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

### Real-World Examples

#### E-commerce Application

```javascript
import { TinyOwl, initTinyIT } from "@tinyOwlJs/observability";

const logger = new TinyOwl({ apiKey: process.env.TINYOWL_API_KEY });
// Or use the modern TinyIT SDK
const tinyit = initTinyIT({
  apiUrl: "https://api.tinyowl.com",
  apiKey: process.env.TINYOWL_API_KEY,
});

// Track successful purchases
async function trackPurchase(order) {
  await logger.info("Purchase completed", {
    orderId: order.id,
    amount: order.total,
    items: order.items.length,
    userId: order.userId,
  });

  // Or with TinyIT
  await tinyit.info("Purchase completed", order);
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

The SDK includes full TypeScript definitions for both SDKs:

```typescript
import {
  TinyOwl,
  initTinyIT,
  Severity,
  LogOptions,
} from "@tinyOwlJs/observability";

// TinyOwl SDK
const client = new TinyOwl({
  apiKey: "YOUR_API_KEY",
});

const options: LogOptions = {
  severity: "info",
  context: {
    userId: "123",
    action: "login",
  },
};

await client.log("User action", options);

// TinyIT SDK
const tinyit = initTinyIT({
  apiUrl: "https://api.tinyowl.com",
  apiKey: "YOUR_API_KEY",
});

await tinyit.info("User action", { userId: "123", action: "login" });
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
    hmacVerified: true  // 🆕 Indicates HMAC verification was used
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
} from "@tinyOwlJs/observability";

const eventData = {
  message: "Custom security implementation",
  severity: "info",
  context: { custom: "data" },
};

const securityHeaders = createSecureHeaders(eventData, projectSecret);

const response = await fetch("https://api.tinyowl.com/ingest", {
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
//   baseUrl: "https://api.tinyowl.com",
//   timeout: 5000,
//   enableHMAC: true,
//   hasApiKey: true,
//   hasProjectSecret: true,
//   hmacEnabled: true
// }
```

## 📚 Migration Guide

Upgrading from the legacy SDK? See our [Migration Guide](./MIGRATION_GUIDE.md) for step-by-step instructions.

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

// Or with TinyIT
const tinyit = initTinyIT({
  apiUrl: "https://api.tinyowl.com",
  apiKey: process.env.TINYOWL_API_KEY,
});
```

## Best Practices

### 🔒 Security Best Practices

1. **Use Enhanced Security**: Always provide `projectSecret` for production applications

   ```javascript
   const client = new TinyOwl({
     apiKey: process.env.TINYOWL_API_KEY,
     projectSecret: process.env.TINYOWL_PROJECT_SECRET, // 🔒 Required for security
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

3. **Monitor Security Verification**: Check `hmacVerified` in responses

   ```javascript
   const response = await client.log("Event");
   if (!response.data?.hmacVerified) {
     console.warn("Event logged without HMAC verification");
   }
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

**Version**: 0.1.0 (TinyOwl SDK + TinyIT Modern Architecture)  
**Last Updated**: October 26, 2025
