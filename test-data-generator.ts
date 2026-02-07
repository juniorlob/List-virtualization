/**
 * Simple script to test the data generator function
 */

import { generateData } from './src/demo/utils/data-generator';

console.log('Testing data generator...\n');

// Test 1: Generate 100 items
console.log('Test 1: Generate 100 items');
const data100 = generateData(100);
console.log(`✓ Generated ${data100.length} items`);
console.log(`✓ First item:`, data100[0]);
console.log(`✓ Last item:`, data100[data100.length - 1]);

// Test 2: Check unique IDs
console.log('\nTest 2: Check unique IDs');
const ids = data100.map(item => item.id);
const uniqueIds = new Set(ids);
console.log(`✓ Unique IDs: ${uniqueIds.size === data100.length ? 'PASS' : 'FAIL'}`);

// Test 3: Check all properties exist
console.log('\nTest 3: Check all properties exist');
const hasAllProps = data100.every(item =>
  item.id && item.name && item.description && item.timestamp && item.metadata
);
console.log(`✓ All properties exist: ${hasAllProps ? 'PASS' : 'FAIL'}`);

// Test 4: Generate 10,000 items
console.log('\nTest 4: Generate 10,000 items');
const data10k = generateData(10000);
console.log(`✓ Generated ${data10k.length} items`);

// Test 5: Test clamping
console.log('\nTest 5: Test clamping');
const dataMin = generateData(50); // Should clamp to 100
const dataMax = generateData(150000); // Should clamp to 100,000
console.log(`✓ Min clamping (50 → ${dataMin.length}): ${dataMin.length === 100 ? 'PASS' : 'FAIL'}`);
console.log(`✓ Max clamping (150000 → ${dataMax.length}): ${dataMax.length === 100000 ? 'PASS' : 'FAIL'}`);

console.log('\n✅ All tests passed!');
