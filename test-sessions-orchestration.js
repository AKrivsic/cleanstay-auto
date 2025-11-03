#!/usr/bin/env node

/**
 * Sessions Orchestration Test Suite
 * Tests the complete flow of session management with real API calls
 */

const testConfig = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  tenantId: process.env.TEST_TENANT_ID || 'test-tenant-123',
  cleanerPhone: process.env.TEST_CLEANER_PHONE || '+420123456789',
  propertyHint: '302'
};

// Helper function to make API calls
async function makeRequest(url, method = 'POST', body = null) {
  const fetch = (await import('node-fetch')).default;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
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
      json: responseText ? JSON.parse(responseText) : null
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      body: error.message,
      json: null,
      error: error
    };
  }
}

// Helper function to check active sessions
async function checkActiveSessions() {
  const response = await makeRequest(
    `${testConfig.baseUrl}/api/ingest?tenantId=${testConfig.tenantId}&cleanerPhone=${testConfig.cleanerPhone}`,
    'GET'
  );
  
  return response.json;
}

// Helper function to send message
async function sendMessage(text) {
  const response = await makeRequest(
    `${testConfig.baseUrl}/api/ingest`,
    'POST',
    {
      text,
      from_phone: testConfig.cleanerPhone,
      tenantId: testConfig.tenantId
    }
  );
  
  return response.json;
}

// Test scenarios
async function testScenario(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log('=' .repeat(60));
  
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

// A) Happy Path: start → supply_out → linen_used → done
async function testHappyPath() {
  console.log('Testing happy path workflow...');
  
  // 1. Start cleaning
  console.log('1. Starting cleaning...');
  const startResult = await sendMessage('Začínám úklid 302');
  
  if (startResult.ask) {
    throw new Error(`Expected session start, got ask: ${startResult.ask}`);
  }
  
  if (!startResult.ok || !startResult.sessionId) {
    throw new Error(`Start failed: ${JSON.stringify(startResult)}`);
  }
  
  console.log(`   Session started: ${startResult.sessionId}`);
  
  // Check active session
  const activeSession = await checkActiveSessions();
  if (!activeSession.active) {
    throw new Error('No active session found after start');
  }
  
  console.log(`   Active session confirmed: ${activeSession.sessionId}`);
  
  // 2. Supply out
  console.log('2. Reporting supply out...');
  const supplyResult = await sendMessage('Došel Domestos');
  
  if (supplyResult.ask) {
    throw new Error(`Expected event append, got ask: ${supplyResult.ask}`);
  }
  
  if (!supplyResult.ok || !supplyResult.sessionId) {
    throw new Error(`Supply out failed: ${JSON.stringify(supplyResult)}`);
  }
  
  console.log(`   Supply out event added to session: ${supplyResult.sessionId}`);
  
  // 3. Linen used
  console.log('3. Reporting linen used...');
  const linenResult = await sendMessage('6 postelí vyměněno');
  
  if (linenResult.ask) {
    throw new Error(`Expected event append, got ask: ${linenResult.ask}`);
  }
  
  if (!linenResult.ok || !linenResult.sessionId) {
    throw new Error(`Linen used failed: ${JSON.stringify(linenResult)}`);
  }
  
  console.log(`   Linen used event added to session: ${linenResult.sessionId}`);
  
  // 4. Done
  console.log('4. Finishing cleaning...');
  const doneResult = await sendMessage('Hotovo');
  
  if (doneResult.ask) {
    throw new Error(`Expected session close, got ask: ${doneResult.ask}`);
  }
  
  if (!doneResult.ok || !doneResult.closed) {
    throw new Error(`Done failed: ${JSON.stringify(doneResult)}`);
  }
  
  console.log(`   Session closed: ${doneResult.sessionId}`);
  
  // Check no active session
  const finalSession = await checkActiveSessions();
  if (finalSession.active) {
    throw new Error('Session still active after done');
  }
  
  console.log('   No active session confirmed');
  
  return { 
    details: 'Complete workflow: 1 session opened → 3 events → 1 session closed' 
  };
}

// B) Conflict: start twice without closing
async function testConflict() {
  console.log('Testing session conflict...');
  
  // 1. Start first session
  console.log('1. Starting first session...');
  const firstResult = await sendMessage('Začínám úklid 302');
  
  if (firstResult.ask) {
    throw new Error(`First start failed: ${firstResult.ask}`);
  }
  
  console.log(`   First session: ${firstResult.sessionId}`);
  
  // 2. Try to start second session (should conflict)
  console.log('2. Trying to start second session...');
  const conflictResult = await sendMessage('Začínám úklid 205');
  
  if (!conflictResult.ask) {
    throw new Error(`Expected conflict ask, got: ${JSON.stringify(conflictResult)}`);
  }
  
  if (!conflictResult.ask.includes('Mám ukončit předchozí')) {
    throw new Error(`Wrong conflict message: ${conflictResult.ask}`);
  }
  
  console.log(`   Conflict detected: ${conflictResult.ask}`);
  
  // 3. Simulate confirmation (close first, open second)
  console.log('3. Simulating conflict resolution...');
  
  // Close first session manually
  const closeResult = await sendMessage('Hotovo'); // This should close the first session
  if (closeResult.ask) {
    throw new Error(`Close first session failed: ${closeResult.ask}`);
  }
  
  console.log('   First session closed');
  
  // Now start second session
  const secondResult = await sendMessage('Začínám úklid 205');
  if (secondResult.ask) {
    throw new Error(`Second start failed: ${secondResult.ask}`);
  }
  
  console.log(`   Second session started: ${secondResult.sessionId}`);
  
  return { 
    details: 'Conflict resolved: first session closed, second session opened' 
  };
}

// C) Done without start
async function testDoneWithoutStart() {
  console.log('Testing done without start...');
  
  // Ensure no active session
  const initialSession = await checkActiveSessions();
  if (initialSession.active) {
    // Close any existing session
    await sendMessage('Hotovo');
  }
  
  // Try to finish without starting
  console.log('1. Trying to finish without starting...');
  const doneResult = await sendMessage('Hotovo');
  
  if (!doneResult.ask) {
    throw new Error(`Expected ask for property, got: ${JSON.stringify(doneResult)}`);
  }
  
  if (!doneResult.ask.includes('U kterého bytu ukončuješ')) {
    throw new Error(`Wrong done message: ${doneResult.ask}`);
  }
  
  console.log(`   Correct ask message: ${doneResult.ask}`);
  
  return { 
    details: 'Done without start correctly asks for property' 
  };
}

// D) TTL Auto-close simulation
async function testTTLAutoClose() {
  console.log('Testing TTL auto-close...');
  
  // Start a session
  console.log('1. Starting session for TTL test...');
  const startResult = await sendMessage('Začínám úklid 302');
  
  if (startResult.ask) {
    throw new Error(`Start failed: ${startResult.ask}`);
  }
  
  console.log(`   Session started: ${startResult.sessionId}`);
  
  // Check session is active
  const activeSession = await checkActiveSessions();
  if (!activeSession.active) {
    throw new Error('Session not active after start');
  }
  
  console.log('   Session confirmed active');
  
  // Note: In real test, we would wait 4+ hours or manually trigger auto-close
  // For this test, we'll just verify the session exists and can be closed
  console.log('2. Simulating TTL auto-close...');
  
  // Close session manually (simulating auto-close)
  const closeResult = await sendMessage('Hotovo');
  if (closeResult.ask) {
    throw new Error(`Close failed: ${closeResult.ask}`);
  }
  
  console.log(`   Session closed: ${closeResult.sessionId}`);
  
  // Verify no active session
  const finalSession = await checkActiveSessions();
  if (finalSession.active) {
    throw new Error('Session still active after close');
  }
  
  console.log('   No active session confirmed');
  
  return { 
    details: 'TTL simulation: session opened and closed successfully' 
  };
}

// E) Delayed photo after done
async function testDelayedPhoto() {
  console.log('Testing delayed photo after done...');
  
  // Start and finish a session
  console.log('1. Starting and finishing session...');
  const startResult = await sendMessage('Začínám úklid 302');
  if (startResult.ask) {
    throw new Error(`Start failed: ${startResult.ask}`);
  }
  
  const doneResult = await sendMessage('Hotovo');
  if (doneResult.ask) {
    throw new Error(`Done failed: ${doneResult.ask}`);
  }
  
  console.log('   Session completed');
  
  // Try to send photo after session is closed
  console.log('2. Sending delayed photo...');
  const photoResult = await sendMessage('Foto: po úklidu');
  
  if (!photoResult.ask) {
    throw new Error(`Expected ask for property, got: ${JSON.stringify(photoResult)}`);
  }
  
  if (!photoResult.ask.includes('U kterého bytu jsi')) {
    throw new Error(`Wrong photo message: ${photoResult.ask}`);
  }
  
  console.log(`   Correct ask message: ${photoResult.ask}`);
  
  return { 
    details: 'Delayed photo correctly asks to start new session' 
  };
}

// Main test runner
async function runOrchestrationTests() {
  console.log('🚀 Starting Sessions Orchestration Tests');
  console.log(`Base URL: ${testConfig.baseUrl}`);
  console.log(`Tenant ID: ${testConfig.tenantId}`);
  console.log(`Cleaner Phone: ${testConfig.cleanerPhone}`);
  
  const tests = [
    { name: 'Happy Path Workflow', fn: testHappyPath },
    { name: 'Session Conflict Resolution', fn: testConflict },
    { name: 'Done Without Start', fn: testDoneWithoutStart },
    { name: 'TTL Auto-Close Simulation', fn: testTTLAutoClose },
    { name: 'Delayed Photo After Done', fn: testDelayedPhoto }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testScenario(test.name, test.fn);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 ORCHESTRATION TEST SUMMARY');
  console.log('=' .repeat(60));
  
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
  
  console.log('\n🎯 Orchestration testing complete!');
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runOrchestrationTests().catch(console.error);
}

module.exports = { runOrchestrationTests, testConfig };





