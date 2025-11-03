#!/usr/bin/env node

/**
 * AI Parser Evaluation Script
 * Tests 20 sentences with different languages, typos, and edge cases
 */

const testCases = [
  // CZECH TESTS
  { input: "Začínám úklid bytu 302", expected: { type: "start_cleaning", property_hint: "302", confidence: 0.95 } },
  { input: "Došel Domestos a Jar", expected: { type: "supply_out", payload: { items: ["Domestos", "Jar"] }, confidence: 0.9 } },
  { input: "6 postelí vyměněno, 8 špinavých", expected: { type: "linen_used", payload: { changed: 6, dirty: 8 }, confidence: 0.9 } },
  { input: "Hotovo", expected: { type: "done", confidence: 0.95 } },
  { input: "Začínám úklid Nikolajka", expected: { type: "start_cleaning", property_hint: "Nikolajka", confidence: 0.95 } },
  { input: "Došel toaletní papír", expected: { type: "supply_out", payload: { items: ["toaletní papír"] }, confidence: 0.9 } },
  { input: "3 postele vyměněno", expected: { type: "linen_used", payload: { changed: 3 }, confidence: 0.9 } },
  { input: "Úklid dokončen", expected: { type: "done", confidence: 0.95 } },
  { input: "Poznámka: klíče v zásuvce", expected: { type: "note", payload: { text: "klíče v zásuvce" }, confidence: 0.8 } },
  { input: "Foto: po úklidu", expected: { type: "photo_meta", payload: { description: "po úklidu" }, confidence: 0.8 } },

  // UKRAINIAN TESTS
  { input: "Починаю прибирання 302", expected: { type: "start_cleaning", property_hint: "302", confidence: 0.95 } },
  { input: "Закінчив прибирання", expected: { type: "done", confidence: 0.95 } },
  { input: "Закінчилось мило", expected: { type: "supply_out", payload: { items: ["мило"] }, confidence: 0.9 } },
  { input: "4 ліжка змінені", expected: { type: "linen_used", payload: { changed: 4 }, confidence: 0.9 } },
  { input: "Прибирання квартири 15", expected: { type: "start_cleaning", property_hint: "15", confidence: 0.95 } },

  // ENGLISH TESTS
  { input: "Starting cleaning apt 302", expected: { type: "start_cleaning", property_hint: "302", confidence: 0.95 } },
  { input: "Finished cleaning", expected: { type: "done", confidence: 0.95 } },
  { input: "Out of detergent", expected: { type: "supply_out", payload: { items: ["detergent"] }, confidence: 0.9 } },
  { input: "5 beds changed", expected: { type: "linen_used", payload: { changed: 5 }, confidence: 0.9 } },
  { input: "Cleaning apartment 15", expected: { type: "start_cleaning", property_hint: "15", confidence: 0.95 } },

  // EDGE CASES - should return ask
  { input: "ahoj", expected: { ask: true } },
  { input: "123", expected: { ask: true } },
  { input: "", expected: { ask: true } },
  { input: "xyz", expected: { ask: true } },
  { input: "?", expected: { ask: true } },

  // TYPO TESTS
  { input: "Zacínám úklid bytu 302", expected: { type: "start_cleaning", property_hint: "302", confidence: 0.8 } }, // missing háček
  { input: "Dosel Domestos", expected: { type: "supply_out", payload: { items: ["Domestos"] }, confidence: 0.8 } }, // missing háček
  { input: "Hotovo!", expected: { type: "done", confidence: 0.9 } }, // with exclamation
  { input: "6 posteli vymeneno", expected: { type: "linen_used", payload: { changed: 6 }, confidence: 0.8 } }, // missing háčky

  // SHORT/CHAOTIC MESSAGES
  { input: "302", expected: { ask: true } }, // just number
  { input: "úklid", expected: { ask: true } }, // just word
  { input: "postele", expected: { ask: true } }, // just word
  { input: "domestos jar", expected: { type: "supply_out", payload: { items: ["domestos", "jar"] }, confidence: 0.7 } }, // short list
  { input: "hotovo 302", expected: { type: "done", property_hint: "302", confidence: 0.8 } }, // done with property

  // CONFIDENCE THRESHOLD TESTS
  { input: "něco divného", expected: { ask: true } }, // unclear message
  { input: "bla bla bla", expected: { ask: true } }, // nonsense
  { input: "úklid něco", expected: { ask: true } }, // partial cleaning message
];

// Mock API call to parse endpoint
async function testParseMessage(text) {
  try {
    const response = await fetch('http://localhost:3000/api/ai/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error testing "${text}":`, error.message);
    return { error: error.message };
  }
}

// Evaluate results
function evaluateResult(actual, expected, input) {
  const result = {
    input,
    actual,
    expected,
    passed: false,
    issues: []
  };

  // Check if expected is ask
  if (expected.ask) {
    if (actual.ask) {
      result.passed = true;
    } else {
      result.issues.push(`Expected ask, got: ${JSON.stringify(actual)}`);
    }
    return result;
  }

  // Check type
  if (actual.type !== expected.type) {
    result.issues.push(`Type mismatch: expected ${expected.type}, got ${actual.type}`);
  }

  // Check property_hint
  if (expected.property_hint && actual.property_hint !== expected.property_hint) {
    result.issues.push(`Property hint mismatch: expected ${expected.property_hint}, got ${actual.property_hint}`);
  }

  // Check payload
  if (expected.payload) {
    if (!actual.payload) {
      result.issues.push(`Missing payload: expected ${JSON.stringify(expected.payload)}`);
    } else {
      // Simple payload comparison
      const expectedKeys = Object.keys(expected.payload);
      const actualKeys = Object.keys(actual.payload);
      if (expectedKeys.length !== actualKeys.length) {
        result.issues.push(`Payload key count mismatch: expected ${expectedKeys.length}, got ${actualKeys.length}`);
      }
    }
  }

  // Check confidence threshold
  if (actual.confidence < 0.6) {
    result.issues.push(`Low confidence (${actual.confidence}): should return ask`);
  }

  // Check if confidence is reasonable
  if (actual.confidence > 1.0 || actual.confidence < 0.0) {
    result.issues.push(`Invalid confidence: ${actual.confidence}`);
  }

  result.passed = result.issues.length === 0;
  return result;
}

// Main evaluation function
async function runEvaluation() {
  console.log('🧪 AI Parser Evaluation');
  console.log('=' .repeat(80));
  console.log();

  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: "${testCase.input}"`);
    
    const actual = await testParseMessage(testCase.input);
    const evaluation = evaluateResult(actual, testCase.expected, testCase.input);
    
    results.push(evaluation);
    
    if (evaluation.passed) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ FAILED');
      console.log(`   Issues: ${evaluation.issues.join(', ')}`);
      failed++;
    }
    
    console.log();
  }

  // Summary table
  console.log('📊 EVALUATION RESULTS');
  console.log('=' .repeat(80));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
  console.log();

  // Detailed results table
  console.log('📋 DETAILED RESULTS');
  console.log('=' .repeat(80));
  console.log('Input | Type | Property | Payload | Confidence | Ask | Status');
  console.log('-'.repeat(80));
  
  results.forEach((result, index) => {
    const input = testCases[index].input.substring(0, 20) + (testCases[index].input.length > 20 ? '...' : '');
    const type = result.actual.type || 'N/A';
    const property = result.actual.property_hint || 'N/A';
    const payload = result.actual.payload ? 'Yes' : 'No';
    const confidence = result.actual.confidence ? result.actual.confidence.toFixed(2) : 'N/A';
    const ask = result.actual.ask ? 'Yes' : 'No';
    const status = result.passed ? '✅' : '❌';
    
    console.log(`${input.padEnd(23)} | ${type.padEnd(8)} | ${property.padEnd(8)} | ${payload.padEnd(7)} | ${confidence.padEnd(10)} | ${ask.padEnd(3)} | ${status}`);
  });

  // Confidence analysis
  console.log();
  console.log('📊 CONFIDENCE ANALYSIS');
  console.log('=' .repeat(80));
  
  const confidenceResults = results.filter(r => r.actual.confidence !== undefined);
  const lowConfidence = confidenceResults.filter(r => r.actual.confidence < 0.6);
  const highConfidence = confidenceResults.filter(r => r.actual.confidence >= 0.8);
  
  console.log(`Low confidence (< 0.6): ${lowConfidence.length}`);
  console.log(`High confidence (>= 0.8): ${highConfidence.length}`);
  console.log(`Average confidence: ${(confidenceResults.reduce((sum, r) => sum + r.actual.confidence, 0) / confidenceResults.length).toFixed(2)}`);
  
  if (lowConfidence.length > 0) {
    console.log();
    console.log('⚠️  LOW CONFIDENCE CASES:');
    lowConfidence.forEach(r => {
      const testCase = testCases[results.indexOf(r)];
      console.log(`   "${testCase.input}" → confidence: ${r.actual.confidence}`);
    });
  }

  console.log();
  console.log('🎯 EVALUATION COMPLETE');
}

// Run evaluation
if (require.main === module) {
  runEvaluation().catch(console.error);
}

module.exports = { runEvaluation, testCases };





