/**
 * Example usage of the Enhanced Echo Nova SDK with Security Features
 * 
 * This file demonstrates how to use the SDK with HMAC signature verification,
 * timestamp validation, and nonce-based replay attack prevention.
 */

import { EchoNova, signPayload, generateNonce, createSecureHeaders } from '../dist/index.js';

// Example 1: SDK with Enhanced Security (Recommended)
async function enhancedSecurityExample() {
  console.log('🔒 Example 1: Enhanced Security Mode');
  
  const sdk = new EchoNova({
    apiKey: 'your-api-key-here',
    projectSecret: 'your-project-secret-here', // 🔥 From backend response
    enableHMAC: true,
    baseUrl: 'http://localhost:5001/api',
  });

  try {
    const response = await sdk.info('User login successful', {
      userId: 'user123',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });

    console.log('✅ Event logged with HMAC verification:', response);
    console.log('🛡️ HMAC Verified:', response.data?.hmacVerified);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Example 2: Backward Compatibility (No HMAC)
async function legacyModeExample() {
  console.log('\n📱 Example 2: Legacy Mode (Backward Compatibility)');
  
  const legacySDK = new EchoNova({
    apiKey: 'your-api-key-here',
    enableHMAC: false, // Explicitly disable HMAC
    baseUrl: 'http://localhost:5001/api',
  });

  try {
    const response = await legacySDK.warning('Legacy system alert', {
      system: 'payment-processor',
      message: 'High CPU usage detected',
    });

    console.log('✅ Legacy event logged:', response);
    console.log('🔓 HMAC Verified:', response.data?.hmacVerified || 'Not used');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Example 3: Manual HMAC Implementation (Advanced Users)
async function manualHMACExample() {
  console.log('\n🔧 Example 3: Manual HMAC Implementation');
  
  const apiKey = 'your-api-key';
  const projectSecret = 'your-project-secret';
  const eventData = {
    message: 'Manual HMAC verification test',
    severity: 'info',
    context: { 
      testId: 'manual-123',
      timestamp: new Date().toISOString(),
    },
  };

  try {
    // Create security headers manually
    const securityHeaders = createSecureHeaders(eventData, projectSecret);
    
    console.log('🔐 Generated Security Headers:', {
      signature: securityHeaders['x-signature'].substring(0, 16) + '...',
      timestamp: securityHeaders['x-timestamp'],
      nonce: securityHeaders['x-nonce'].substring(0, 8) + '...',
    });

    // Make manual fetch request
    const response = await fetch('http://localhost:5001/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...securityHeaders,
      },
      body: JSON.stringify({
        apiKey,
        ...eventData,
      }),
    });

    const data = await response.json();
    console.log('✅ Manual HMAC event logged:', data);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Example 4: Security Utilities Demo
function securityUtilitiesDemo() {
  console.log('\n🛠️ Example 4: Security Utilities Demo');
  
  const payload = {
    message: 'Test message',
    severity: 'info',
    context: { testKey: 'testValue' },
  };
  
  const secret = 'demo-secret-key';
  
  // Generate nonce
  const nonce = generateNonce();
  console.log('🔀 Generated Nonce:', nonce);
  
  // Sign payload
  const signature = signPayload(payload, secret);
  console.log('🔏 Payload Signature:', signature.substring(0, 16) + '...');
  
  // Create complete security headers
  const headers = createSecureHeaders(payload, secret);
  console.log('📋 Complete Security Headers:', {
    signature: headers['x-signature'].substring(0, 16) + '...',
    timestamp: headers['x-timestamp'],
    nonce: headers['x-nonce'].substring(0, 8) + '...',
  });
}

// Example 5: Configuration Information
function configurationExample() {
  console.log('\n⚙️ Example 5: SDK Configuration');
  
  const sdk = new EchoNova({
    apiKey: 'demo-key',
    projectSecret: 'demo-secret',
    baseUrl: 'https://api.production.com',
    timeout: 10000,
  });

  const config = sdk.getConfig();
  console.log('🔧 SDK Configuration:', config);
}

// Example 6: Error Handling
async function errorHandlingExample() {
  console.log('\n🚨 Example 6: Error Handling');
  
  // Example with invalid configuration
  try {
    const invalidSDK = new EchoNova({
      apiKey: '', // Invalid - empty API key
    });
  } catch (error) {
    console.log('❌ Configuration Error:', error instanceof Error ? error.message : error);
  }

  // Example with invalid message
  try {
    const sdk = new EchoNova({
      apiKey: 'valid-key',
      enableHMAC: false,
    });
    
    await sdk.log('', { severity: 'info' }); // Invalid - empty message
  } catch (error) {
    console.log('❌ Validation Error:', error instanceof Error ? error.message : error);
  }

  // Example with invalid severity
  try {
    const sdk = new EchoNova({
      apiKey: 'valid-key',
      enableHMAC: false,
    });
    
    // @ts-ignore - Intentionally using invalid severity for demo
    await sdk.log('Test message', { severity: 'invalid' });
  } catch (error) {
    console.log('❌ Severity Error:', error instanceof Error ? error.message : error);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 Echo Nova SDK Security Examples\n');
  console.log('=' .repeat(50));
  
  // Run synchronous examples first
  securityUtilitiesDemo();
  configurationExample();
  await errorHandlingExample();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📡 Network Examples (require running backend):');
  console.log('💡 Start your Echo Nova backend on http://localhost:5001');
  console.log('💡 Update API keys and project secrets before testing');
  console.log('=' .repeat(50));
  
  // Uncomment these when you have a running backend
  // await enhancedSecurityExample();
  // await legacyModeExample();  
  // await manualHMACExample();
  
  console.log('\n✨ All examples completed!');
}

// Export for use in other files
export {
  enhancedSecurityExample,
  legacyModeExample,
  manualHMACExample,
  securityUtilitiesDemo,
  configurationExample,
  errorHandlingExample,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}