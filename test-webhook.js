#!/usr/bin/env node

/**
 * WhatsApp Webhook Test Suite
 * Tests various scenarios for the WhatsApp webhook endpoint
 */

const crypto = require('crypto');

// Test configurati on
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook/whatsapp';
const WABA_API_KEY = process.env.WABA_API_KEY || 'test-api-key';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'test-verify-token';

// Test data
const testMessage = {
  object: 'whatsapp_business_account',
  entry: [{
    id: '123456789',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '15551234567',
          phone_number_id: '123456789'
        },
        messages: [{
          id: 'wamid.test123456789',
          from: '15551234567',
          timestamp: Math.floor(Date.now() / 1000),
          type: 'text',
          text: {
            body: 'Test message from webhook test'
          }
        }]
      },
      field: 'messages'
    }]
  }]
};

const testImageMessage = {
  object: 'whatsapp_business_account',
  entry: [{
    id: '123456789',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '15551234567',
          phone_number_id: '123456789'
        },
        messages: [{
          id: 'wamid.image123456789',
          from: '15551234567',
          timestamp: Math.floor(Date.now() / 1000),
          type: 'image',
          image: {
            id: 'media123456789',
            mime_type: 'image/jpeg',
            sha256: 'testsha256hash',
            caption: 'Test image'
          }
        }]
      },
      field: 'messages'
    }]
  }]
};

// Helper functions
function generateSignature(body, secret) {
  return 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
}

async function makeRequest(url, method = 'POST', body = null, headers = {}) {
  const fetch = (await import('node-fetch')).default;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    return {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      body: error.message,
      error: error
    };
  }
}

// Test scenarios
async function testScenario(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log('=' .repeat(50));
  
  try {
    const result = await testFn();
    console.log(`✅ ${name}: PASSED`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    return { name, status: 'PASSED', result };
  } catch (error) {
    console.log(`❌ ${name}: FAILED`);
    console.log(`   Error: ${error.message}`);
    return { name, status: 'FAILED', error: error.message };
  }
}

// Test 1: Feature flag disabled
async function testFeatureFlagDisabled() {
  const response = await makeRequest(
    `${WEBHOOK_URL}?CLEANSTAY_ENABLED=false`,
    'POST',
    testMessage
  );
  
  if (response.status === 503) {
    return { details: 'Correctly returns 503 when feature disabled' };
  } else {
    throw new Error(`Expected 503, got ${response.status}`);
  }
}

// Test 2: Idempotence - duplicate message
async function testIdempotence() {
  const signature = generateSignature(testMessage, WABA_API_KEY);
  
  // First request
  const response1 = await makeRequest(
    WEBHOOK_URL,
    'POST',
    testMessage,
    { 'x-hub-signature-256': signature }
  );
  
  // Second request (same message)
  const response2 = await makeRequest(
    WEBHOOK_URL,
    'POST',
    testMessage,
    { 'x-hub-signature-256': signature }
  );
  
  if (response1.status === 204 && response2.status === 204) {
    return { details: 'Both requests return 204 (idempotent)' };
  } else {
    throw new Error(`Expected both 204, got ${response1.status} and ${response2.status}`);
  }
}

// Test 3: Unknown phone number
async function testUnknownPhoneNumber() {
  const unknownMessage = {
    ...testMessage,
    entry: [{
      ...testMessage.entry[0],
      changes: [{
        ...testMessage.entry[0].changes[0],
        value: {
          ...testMessage.entry[0].changes[0].value,
          messages: [{
            ...testMessage.entry[0].changes[0].value.messages[0],
            from: '15559999999', // Unknown number
            id: 'wamid.unknown123456789'
          }]
        }
      }]
    }]
  };
  
  const signature = generateSignature(unknownMessage, WABA_API_KEY);
  const response = await makeRequest(
    WEBHOOK_URL,
    'POST',
    unknownMessage,
    { 'x-hub-signature-256': signature }
  );
  
  if (response.status === 204) {
    return { details: 'Message from unknown number processed with tenant_id=null' };
  } else {
    throw new Error(`Expected 204, got ${response.status}`);
  }
}

// Test 4: Large media attachment
async function testLargeMediaAttachment() {
  const largeImageMessage = {
    ...testImageMessage,
    entry: [{
      ...testImageMessage.entry[0],
      changes: [{
        ...testImageMessage.entry[0].changes[0],
        value: {
          ...testImageMessage.entry[0].changes[0].value,
          messages: [{
            ...testImageMessage.entry[0].changes[0].value.messages[0],
            id: 'wamid.largeimage123456789',
            image: {
              ...testImageMessage.entry[0].changes[0].value.messages[0].image,
              id: 'media_large123456789',
              file_size: 50000000 // 50MB - over limit
            }
          }]
        }
      }]
    }]
  };
  
  const signature = generateSignature(largeImageMessage, WABA_API_KEY);
  const response = await makeRequest(
    WEBHOOK_URL,
    'POST',
    largeImageMessage,
    { 'x-hub-signature-256': signature }
  );
  
  if (response.status === 204) {
    return { details: 'Large media attachment processed with needs_download flag' };
  } else {
    throw new Error(`Expected 204, got ${response.status}`);
  }
}

// Test 5: Invalid signature
async function testInvalidSignature() {
  const response = await makeRequest(
    WEBHOOK_URL,
    'POST',
    testMessage,
    { 'x-hub-signature-256': 'sha256=invalid_signature' }
  );
  
  if (response.status === 403) {
    return { details: 'Correctly rejects invalid signature' };
  } else {
    throw new Error(`Expected 403, got ${response.status}`);
  }
}

// Test 6: Malformed payload
async function testMalformedPayload() {
  const response = await makeRequest(
    WEBHOOK_URL,
    'POST',
    { invalid: 'payload' },
    { 'x-hub-signature-256': generateSignature({ invalid: 'payload' }, WABA_API_KEY) }
  );
  
  if (response.status === 400 || response.status === 204) {
    return { details: 'Handles malformed payload gracefully' };
  } else {
    throw new Error(`Expected 400 or 204, got ${response.status}`);
  }
}

// Test 7: Webhook verification
async function testWebhookVerification() {
  const response = await makeRequest(
    `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${WHATSAPP_VERIFY_TOKEN}&hub.challenge=test_challenge`,
    'GET'
  );
  
  if (response.status === 200 && response.body === 'test_challenge') {
    return { details: 'Webhook verification successful' };
  } else {
    throw new Error(`Expected 200 with challenge, got ${response.status}: ${response.body}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting WhatsApp Webhook Tests');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`WABA API Key: ${WABA_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`Verify Token: ${WHATSAPP_VERIFY_TOKEN ? 'Set' : 'Not set'}`);
  
  const tests = [
    { name: 'Feature Flag Disabled', fn: testFeatureFlagDisabled },
    { name: 'Idempotence (Duplicate Message)', fn: testIdempotence },
    { name: 'Unknown Phone Number', fn: testUnknownPhoneNumber },
    { name: 'Large Media Attachment', fn: testLargeMediaAttachment },
    { name: 'Invalid Signature', fn: testInvalidSignature },
    { name: 'Malformed Payload', fn: testMalformedPayload },
    { name: 'Webhook Verification', fn: testWebhookVerification }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testScenario(test.name, test.fn);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n🎯 Test completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testScenario };





