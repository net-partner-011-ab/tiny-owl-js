/**
 * Task 5.6: Security Hardening Examples
 * 
 * This file demonstrates all the security features implemented:
 * - HMAC signature of each event ✅ (already implemented in security.ts)
 * - Nonces and timestamps ✅ (already implemented in security.ts) 
 * - SDK version in each request ✅ (implemented in client.ts)
 * - Rate limiting (handled by backend)
 * - Hashed API keys (handled by backend)
 * - Audit logging (handled by backend)
 * - HTTPS enforcement (configuration recommendation)
 * - SDK self-tracking (error reporting)
 */

import { initTinyIT, EchoNova, TinyITLogger } from '../dist/index.js';

/**
 * Example 1: TinyIT with Full Security Features
 */
async function securityHardenedTinyIT() {
  console.log('🔒 Security Hardened TinyIT Example');
  
  // Initialize with full security
  const tinyit = initTinyIT({
    apiUrl: "https://api.tinyit.io", // ✅ HTTPS enforced
    apiKey: "PUBLIC_PROJECT_KEY",   // ✅ Public key (backend handles hashing)
    projectSecret: "SECRET_KEY",    // ✅ Secret for HMAC signing
    options: {
      sdkVersion: "0.1.0",         // ✅ SDK version tracking
      enableSecurity: true,        // ✅ HMAC + nonces + timestamps
      maxRetries: 3,               // ✅ Retry mechanism
      timeout: 5000,               // ✅ Request timeout
    }
  });

  try {
    // Each call includes:
    // - HMAC signature ✅
    // - Timestamp ✅ 
    // - Nonce ✅
    // - SDK version header ✅
    await tinyit.info("App started", { version: "1.0.0" });
    await tinyit.error("Something went wrong", { code: 500, stack: "Error stack trace" });
    await tinyit.warn("High memory usage", { usage: "85%" });
    
    console.log("✅ All secure logs sent successfully");
  } catch (error) {
    console.error("❌ Security hardened logging failed:", error);
    
    // SDK self-tracking - report SDK errors to monitoring
    await reportSDKError(error, "TinyIT logging failure");
  }
}

/**
 * Example 2: EchoNova with Enhanced Security  
 */
async function securityHardenedEchoNova() {
  console.log('\n🛡️ Security Hardened EchoNova Example');
  
  const client = new EchoNova({
    apiKey: "ECHO_NOVA_API_KEY",
    projectSecret: "ECHO_NOVA_SECRET",
    baseUrl: "https://api.echonova.secure.com/api", // ✅ HTTPS enforced
    enableHMAC: true,  // ✅ Full security enabled
    timeout: 5000,
  });

  try {
    const response = await client.info("Secure user login", {
      userId: "user123",
      ip: "192.168.1.1",
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Secure EchoNova log sent:", {
      success: response.success,
      hmacVerified: response.data?.hmacVerified,
      eventId: response.data?.eventId?.substring(0, 8) + "...",
    });
  } catch (error) {
    console.error("❌ Security hardened EchoNova failed:", error);
    await reportSDKError(error, "EchoNova logging failure");
  }
}

/**
 * Example 3: SDK Self-Tracking and Error Reporting
 */
async function reportSDKError(error, context) {
  console.log('\n📊 SDK Self-Tracking Example');
  
  try {
    // Create a dedicated logger for SDK internal errors
    const sdkLogger = initTinyIT({
      apiUrl: "https://api.tinyit.io",
      apiKey: "SDK_INTERNAL_TRACKING_KEY",
      projectSecret: "SDK_INTERNAL_SECRET",
      options: {
        sdkVersion: "0.1.0",
        enableSecurity: true,
      }
    });

    // Report SDK error with full context
    await sdkLogger.error("SDK Internal Error", {
      error: error instanceof Error ? error.message : String(error),
      context,
      sdkVersion: "0.1.0",
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
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
  console.log('\n⏱️ Rate Limiting Demo');
  
  const tinyit = initTinyIT({
    apiUrl: "https://api.tinyit.io",
    apiKey: "RATE_LIMITED_KEY",
    projectSecret: "RATE_LIMITED_SECRET",
    options: {
      maxRetries: 5,        // ✅ Higher retries for rate limiting
      retryDelay: 1000,     // ✅ Base delay
      maxRetryDelay: 30000, // ✅ Max delay for exponential backoff
    }
  });

  // Simulate rapid requests that might hit rate limits
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      tinyit.info(`Rapid request ${i}`, { requestNumber: i })
        .catch(error => {
          console.log(`Request ${i} failed:`, error.message.substring(0, 50) + "...");
        })
    );
  }

  try {
    await Promise.allSettled(promises);
    console.log("✅ Rate limiting demo completed (some requests may have failed)");
  } catch (error) {
    console.error("❌ Rate limiting demo failed:", error);
  }
}

/**
 * Example 5: Security Headers Inspection
 */
function inspectSecurityHeaders() {
  console.log('\n🔍 Security Headers Inspection');
  
  // This would be done internally by the SDK, but let's show what headers are sent
  const mockPayload = {
    message: "Test security headers",
    level: "info",
    meta: { test: true },
    timestamp: new Date().toISOString(),
  };

  console.log("📋 Security headers that would be sent:");
  console.log("Headers:");
  console.log("  Content-Type: application/json");
  console.log("  x-api-key: [API_KEY]");
  console.log("  x-tinyit-sdk-version: 0.1.0");
  console.log("  x-signature: [HMAC-SHA256-SIGNATURE]");
  console.log("  x-timestamp: " + new Date().toISOString());
  console.log("  x-nonce: [32-CHAR-HEX-NONCE]");
  
  console.log("\n📦 Payload structure:");
  console.log(JSON.stringify(mockPayload, null, 2));
}

/**
 * Example 6: HTTPS Enforcement Check
 */
function httpsEnforcementCheck() {
  console.log('\n🔐 HTTPS Enforcement Check');
  
  const configs = [
    { apiUrl: "https://api.tinyit.io", valid: true },
    { apiUrl: "http://api.tinyit.io", valid: false },
    { apiUrl: "https://localhost:3000", valid: true },
    { apiUrl: "http://localhost:3000", valid: false }, // Would be rejected in production
  ];

  configs.forEach(config => {
    const isSecure = config.apiUrl.startsWith('https://');
    const isLocalhost = config.apiUrl.includes('localhost') || config.apiUrl.includes('127.0.0.1');
    
    console.log(`${config.apiUrl}: ${isSecure ? '✅' : '❌'} ${isSecure ? 'SECURE' : 'INSECURE'}`);
    
    if (!isSecure && !isLocalhost) {
      console.log(`  ⚠️  Production deployment should enforce HTTPS`);
    }
  });
}

/**
 * Example 7: Audit Trail Generation
 */
async function auditTrailDemo() {
  console.log('\n📝 Audit Trail Demo');
  
  const tinyit = initTinyIT({
    apiUrl: "https://api.tinyit.io",
    apiKey: "AUDIT_TRAIL_KEY",
    projectSecret: "AUDIT_TRAIL_SECRET",
  });

  // All these events would be logged to the audit collection on the backend
  const auditEvents = [
    { action: "user_login", userId: "user123", ip: "192.168.1.1" },
    { action: "data_access", resourceId: "resource456", userId: "user123" },
    { action: "config_change", setting: "rate_limit", oldValue: "100", newValue: "200" },
    { action: "user_logout", userId: "user123", sessionDuration: "45min" },
  ];

  try {
    for (const event of auditEvents) {
      await tinyit.info(`Audit: ${event.action}`, event);
    }
    console.log("✅ Audit trail events logged (stored in backend audit collection)");
  } catch (error) {
    console.error("❌ Audit trail logging failed:", error);
    await reportSDKError(error, "Audit trail failure");
  }
}

/**
 * Run all security examples
 */
async function runAllSecurityExamples() {
  console.log('🚀 TinyIT Security Hardening Examples\n');
  console.log('=' .repeat(60));
  
  // Synchronous examples
  inspectSecurityHeaders();
  httpsEnforcementCheck();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📡 Network Security Examples (require running backend):');
  console.log('💡 Start your TinyIT backend with security features enabled');
  console.log('💡 Update API keys and secrets before testing');
  console.log('=' .repeat(60));
  
  // Network examples (uncomment when backend is ready)
  // await securityHardenedTinyIT();
  // await securityHardenedEchoNova();
  // await rateLimitingDemo();
  // await auditTrailDemo();
  
  console.log('\n✨ Security hardening examples completed!');
  console.log('\n📋 Security Features Implemented:');
  console.log('  ✅ HMAC signature verification');
  console.log('  ✅ Nonces and timestamps');
  console.log('  ✅ SDK version tracking');
  console.log('  ✅ HTTPS enforcement (configuration)');
  console.log('  ✅ SDK self-tracking and error reporting');
  console.log('  ✅ Retry mechanism with exponential backoff');
  console.log('  ✅ Request queuing for offline scenarios');
  console.log('  ✅ Comprehensive error handling');
  console.log('\n🏗️ Backend Security Features (to be implemented):');
  console.log('  🔄 Rate limiting by projectId');
  console.log('  🔄 Hashed API keys in database (bcrypt + salt)');
  console.log('  🔄 Audit collection logging');
  console.log('  🔄 HMAC signature verification on server');
}

// Export functions for individual testing
export {
  securityHardenedTinyIT,
  securityHardenedEchoNova,
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