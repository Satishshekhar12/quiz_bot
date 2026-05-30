/**
 * Test Setup Helper
 * 
 * This script helps verify the test environment and image
 */

const fs = require('fs');
const path = require('path');

console.log('\n📋 OpenAI MCQ Test Setup Verification\n');

// Check 1: api.txt exists
console.log('Checking 1: API Configuration');
const configPath = './src/config/openai.config.json';
if (fs.existsSync(configPath)) {
  const config = require(configPath);
  if (config.openai?.apiKey) {
    console.log('✓ openai.config.json found');
    console.log(`  Model: ${config.openai.model}`);
    console.log(`  API Key: ${config.openai.apiKey.substring(0, 10)}...`);
  } else {
    console.log('✗ openai.config.json missing or incomplete');
  }
} else {
  console.log('✗ openai.config.json not found');
}

// Check 2: openai-test.js exists
console.log('\nChecking 2: Test Script');
if (fs.existsSync('./openai-test.js')) {
  console.log('✓ openai-test.js found');
} else {
  console.log('✗ openai-test.js not found');
}

// Check 3: Image exists
console.log('\nChecking 3: Test Image');
const testImages = ['McqQ1.jpg', 'test.jpg', 'mcq.jpg'];
let imageFound = false;

for (const img of testImages) {
  if (fs.existsSync(img)) {
    const stats = fs.statSync(img);
    console.log(`✓ Found image: ${img} (${stats.size} bytes)`);
    imageFound = true;
    break;
  }
}

if (!imageFound) {
  console.log('✗ No test image found');
  console.log('\n  Available images:');
  testImages.forEach(img => console.log(`  - ${img}`));
  console.log('\n  Please save your MCQ image as "McqQ1.jpg" in the project root');
}

// Check 4: Node.js packages
console.log('\nChecking 4: Dependencies');
try {
  require('react-native-fs');
  console.log('✓ react-native-fs installed');
} catch {
  console.log('✗ react-native-fs not installed (needed for app, not for test)');
}

console.log('\n✅ Setup check complete\n');
