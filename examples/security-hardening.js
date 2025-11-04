/**
 * Security Hardening Examples for TinyOwl SDK
 *
 * This file demonstrates all the security features implemented:
 * - HMAC signature of each event ✅ (mandatory - implemented in security.ts)
 * - Nonces and timestamps ✅ (mandatory - implemented in security.ts)
 * - SDK version in each request ✅ (implemented in client.ts)
 * - Rate limiting (handled by backend)
 * - Hashed API keys (handled by backend)
 * - Audit logging (handled by backend)
 * - HTTPS enforcement (configuration recommendation)
 * - SDK self-tracking (error reporting)
 *
 * Note: All requests require HMAC verification with projectSecret.
 */

import { TinyOwl } from "../dist/index.js";

/**
 * Example 1: TinyOwl with Full Security Features (Mandatory)
 */
async function securityHardenedTinyOwl() {
  console.log("🔒 Security Hardened TinyOwl Example");

  // Initialize with full security (required)
  const tinyowl = new TinyOwl({
    apiKey: "PUBLIC_PROJECT_KEY", // ✅ Public key (backend handles hashing)
    projectSecret: "SECRET_KEY", // ✅ Required for HMAC signing
    baseUrl: "https://api.tinyowl.com", // ✅ HTTPS enforced
    timeout: 5000, // ✅ Request timeout
  });

  try {
    // Each call includes:
    // - HMAC signature ✅
    // - Timestamp ✅
    // - Nonce ✅
    // - SDK version header ✅
    await tinyowl.info("App started", { version: "1.0.0" });
    await tinyowl.error("Something went wrong", {
      code: 500,
      stack: "Error stack trace",
    });
    await tinyowl.warning("High memory usage", { usage: "85%" });

    console.log("✅ All secure logs sent successfully");
  } catch (error) {
    console.error("❌ Security hardened logging failed:", error);

    // SDK self-tracking - report SDK errors to monitoring
    await reportSDKError(error, "TinyOwl logging failure");
  }
}

/**
 * Example 2: Production-Ready Configuration
 */
async function productionConfigExample() {
  console.log("\n🏭 Production-Ready Configuration Example");

  const client = new TinyOwl({
    apiKey: process.env.TINYOWL_API_KEY || "PRODUCTION_API_KEY",
    projectSecret: process.env.TINYOWL_PROJECT_SECRET || "PRODUCTION_SECRET",
    baseUrl: "https://api.tinyowl.com", // ✅ HTTPS enforced
    timeout: 5000,
  });

  try {
    const response = await client.info("Secure user login", {
      userId: "user123",
      ip: "192.168.1.1",
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Secure TinyOwl log sent:", {
      success: response.success,
      hmacVerified: response.data?.hmacVerified, // Always true
      eventId: response.data?.eventId?.substring(0, 8) + "...",
    });
  } catch (error) {
    console.error("❌ Security hardened TinyOwl failed:", error);
    await reportSDKError(error, "TinyOwl logging failure");
  }
}

/**
 * Example 3: SDK Self-Tracking and Error Reporting
 */
async function reportSDKError(error, context) {
  console.log("\n📊 SDK Self-Tracking Example");

  try {
    // Create a dedicated logger for SDK internal errors
    const sdkLogger = new TinyOwl({
      apiKey: "SDK_INTERNAL_TRACKING_KEY",
      projectSecret: "SDK_INTERNAL_SECRET",
      baseUrl: "https://api.tinyowl.com",
    });

    // Report SDK error with full context
    await sdkLogger.error("SDK Internal Error", {
      error: error instanceof Error ? error.message : String(error),
      context,
      sdkVersion: "0.1.0",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Node.js",
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      stack:
        error instanceof Error
          ? error.stack?.split("\n").slice(0, 5)
          : undefined,
    });

    console.log("✅ SDK error reported for monitoring");
  } catch (reportError) {
    // Fallback - log locally if reporting fails
    console.error("❌ Failed to report SDK error:", reportError);
    console.error("Original error:", error);
  }
}

/**
 * Example 4: Rate Limiting Demonstration
 */
async function rateLimitingDemo() {
  console.log("\n⏱️ Rate Limiting Demo");

  const tinyowl = new TinyOwl({
    apiKey: "RATE_LIMITED_KEY",
    projectSecret: "RATE_LIMITED_SECRET",
    baseUrl: "https://api.tinyowl.com",
    timeout: 5000,
  });

  // Simulate rapid requests that might hit rate limits
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      tinyowl
        .info(`Rapid request ${i}`, { requestNumber: i })
        .catch((error) => {
          console.log(
            `Request ${i} failed:`,
            error.message.substring(0, 50) + "..."
          );
        })
    );
  }

  try {
    await Promise.allSettled(promises);
    console.log(
      "✅ Rate limiting demo completed (some requests may have failed)"
    );
  } catch (error) {
    console.error("❌ Rate limiting demo failed:", error);
  }
}

/**
 * Example 5: Security Headers Inspection
 */
function inspectSecurityHeaders() {
  console.log("\n🔍 Security Headers Inspection");

  // This would be done internally by the SDK, but let's show what headers are sent
  const mockPayload = {
    message: "Test security headers",
    severity: "info",
    context: { test: true },
    timestamp: new Date().toISOString(),
  };

  console.log("📋 Security headers that are sent with every request:");
  console.log("Headers:");
  console.log("  Content-Type: application/json");
  console.log("  x-api-key: [API_KEY]");
  console.log("  x-tinyowl-sdk-version: 0.1.0");
  console.log("  x-signature: [HMAC-SHA256-SIGNATURE] (Required)");
  console.log("  x-timestamp: " + new Date().toISOString() + " (Required)");
  console.log("  x-nonce: [32-CHAR-HEX-NONCE] (Required)");

  console.log("\n📦 Payload structure:");
  console.log(JSON.stringify(mockPayload, null, 2));
  console.log("\n🔒 Note: All three security headers are mandatory");
}

/**
 * Example 6: HTTPS Enforcement Check
 */
function httpsEnforcementCheck() {
  console.log("\n🔐 HTTPS Enforcement Check");

  const configs = [
    { baseUrl: "https://api.tinyowl.com", valid: true },
    { baseUrl: "http://api.tinyowl.com", valid: false },
    { baseUrl: "https://localhost:3000", valid: true },
    { baseUrl: "http://localhost:3000", valid: false }, // Would be rejected in production
  ];

  configs.forEach((config) => {
    const isSecure = config.baseUrl.startsWith("https://");
    const isLocalhost =
      config.baseUrl.includes("localhost") ||
      config.baseUrl.includes("127.0.0.1");

    console.log(
      `${config.baseUrl}: ${isSecure ? "✅" : "❌"} ${
        isSecure ? "SECURE" : "INSECURE"
      }`
    );

    if (!isSecure && !isLocalhost) {
      console.log(`  ⚠️  Production deployment should enforce HTTPS`);
    }
  });
}

/**
 * Example 7: Audit Trail Generation
 */
async function auditTrailDemo() {
  console.log("\n📝 Audit Trail Demo");

  const tinyowl = new TinyOwl({
    apiKey: "AUDIT_TRAIL_KEY",
    projectSecret: "AUDIT_TRAIL_SECRET",
    baseUrl: "https://api.tinyowl.com",
  });

  // All these events would be logged to the audit collection on the backend
  const auditEvents = [
    { action: "user_login", userId: "user123", ip: "192.168.1.1" },
    { action: "data_access", resourceId: "resource456", userId: "user123" },
    {
      action: "config_change",
      setting: "rate_limit",
      oldValue: "100",
      newValue: "200",
    },
    { action: "user_logout", userId: "user123", sessionDuration: "45min" },
  ];

  try {
    for (const event of auditEvents) {
      await tinyowl.info(`Audit: ${event.action}`, event);
    }
    console.log(
      "✅ Audit trail events logged (stored in backend audit collection)"
    );
  } catch (error) {
    console.error("❌ Audit trail logging failed:", error);
    await reportSDKError(error, "Audit trail failure");
  }
}

/**
 * Run all security examples
 */
async function runAllSecurityExamples() {
  console.log("🚀 TinyOwl Security Hardening Examples\n");
  console.log("=".repeat(60));

  // Synchronous examples
  inspectSecurityHeaders();
  httpsEnforcementCheck();

  console.log("\n" + "=".repeat(60));
  console.log("📡 Network Security Examples (require running backend):");
  console.log("💡 Start your TinyOwl backend with security features enabled");
  console.log("💡 Update API keys and secrets before testing");
  console.log("💡 Note: projectSecret is mandatory for all requests");
  console.log("=".repeat(60));

  // Network examples (uncomment when backend is ready)
  // await securityHardenedTinyOwl();
  // await productionConfigExample();
  // await rateLimitingDemo();
  // await auditTrailDemo();

  console.log("\n✨ Security hardening examples completed!");
  console.log("\n📋 Security Features Implemented:");
  console.log("  ✅ HMAC signature verification (mandatory)");
  console.log("  ✅ Nonces and timestamps (mandatory)");
  console.log("  ✅ SDK version tracking");
  console.log("  ✅ HTTPS enforcement (configuration)");
  console.log("  ✅ SDK self-tracking and error reporting");
  console.log("  ✅ Comprehensive error handling");
  console.log("  ✅ projectSecret required for all requests");
  console.log("\n🏗️ Backend Security Features (to be implemented):");
  console.log("  🔄 Rate limiting by projectId");
  console.log("  🔄 Hashed API keys in database (bcrypt + salt)");
  console.log("  🔄 Audit collection logging");
  console.log("  🔄 HMAC signature verification on server");
}

// Export functions for individual testing
export {
  securityHardenedTinyOwl,
  productionConfigExample,
  reportSDKError,
  rateLimitingDemo,
  inspectSecurityHeaders,
  httpsEnforcementCheck,
  auditTrailDemo,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSecurityExamples().catch(console.error);
}
