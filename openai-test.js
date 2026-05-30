/**
 * OpenAI MCQ Test Script
 * 
 * This is a standalone Node.js test script for Phase 1 verification
 * It does NOT require React Native - runs directly in Node.js
 * 
 * Usage: node openai-test.js <image-path>
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

/**
 * Read API configuration from config file
 */
function readConfig() {
  const configPath = path.join(__dirname, 'src/config/openai.config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('openai.config.json not found');
  }
  
  const configData = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configData);
  
  if (!config.openai?.apiKey) {
    throw new Error('API key not found in config');
  }
  
  return {
    apiKey: config.openai.apiKey,
    model: config.openai.model || 'gpt-3.5-turbo',
  };
}

/**
 * Convert image to base64
 */
function imageToBase64(imagePath) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Extract MCQ answer from OpenAI response
 */
function extractMCQAnswer(response) {
  if (!response) return undefined;
  
  const cleaned = response.trim().toUpperCase();
  
  // Check if it's a single letter answer
  const match = cleaned.match(/^[A-E]$/);
  if (match) {
    return match[0];
  }
  
  // Try to find first occurrence of valid answer
  const firstAnswer = cleaned.match(/[A-E]/);
  if (firstAnswer) {
    log.warning(`Response contains extra text, extracted: ${firstAnswer[0]}`);
    return firstAnswer[0];
  }
  
  log.warning(`Could not extract valid answer from: ${response}`);
  return undefined;
}

/**
 * Main test function
 */
async function testOpenAIMCQ(imagePath) {
  const startTime = Date.now();
  
  try {
    log.header('🔬 OpenAI MCQ Test - Phase 1 Verification');
    
    // Step 1: Read API key and model from config
    log.section('Step 1: Loading Configuration');
    log.info('Reading openai.config.json...');
    const { apiKey, model } = readConfig();
    log.success(`API key loaded (length: ${apiKey.length})`);
    log.info(`Key starts with: ${apiKey.substring(0, 8)}...`);
    log.info(`Model: ${model}`);
    
    // Step 2: Load and convert image
    log.section('Step 2: Processing Image');
    log.info(`Loading image: ${imagePath}`);
    const imageBase64 = imageToBase64(imagePath);
    log.success(`Image converted to base64 (${imageBase64.length} bytes)`);
    
    // Step 3: Prepare API request
    log.section('Step 3: Preparing OpenAI API Request');
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You will receive an image containing a multiple-choice question.

Analyze the image carefully and return ONLY the final answer option.

Valid outputs:
A
B
C
D
E

No explanation.
No reasoning.
No extra text.
Return only a single option.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 10,
      temperature: 0,
    };
    
    log.info('Request prepared');
    log.info(`Model: ${requestBody.model}`);
    log.info(`Max tokens: ${requestBody.max_tokens}`);
    log.info(`Temperature: ${requestBody.temperature}`);
    
    // Step 4: Send request to OpenAI
    log.section('Step 4: Calling OpenAI API');
    log.info('Sending request to https://api.openai.com/v1/chat/completions...');
    const apiStartTime = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    const apiDuration = Date.now() - apiStartTime;
    log.success(`Response received in ${apiDuration}ms`);
    
    // Step 5: Parse response
    log.section('Step 5: Parsing Response');
    const data = await response.json();
    
    if (!response.ok) {
      log.error(`API Error (Status: ${response.status})`);
      log.error(`Message: ${data.error?.message || 'Unknown error'}`);
      
      if (data.error?.code === 'invalid_api_key') {
        log.error('The API key in api.txt appears to be invalid');
      }
      
      return {
        success: false,
        error: data.error?.message || 'API request failed',
        status: response.status,
      };
    }
    
    const rawResponse = data.choices?.[0]?.message?.content || '';
    const answer = extractMCQAnswer(rawResponse);
    
    // Step 6: Display results
    log.section('Step 6: Results');
    log.success('MCQ Analysis Complete!');
    
    console.log(`\n${colors.bright}${colors.green}EXTRACTED ANSWER:${colors.reset}`);
    console.log(`${colors.bright}${colors.green}${answer || 'N/A'}${colors.reset}\n`);
    
    console.log(`${colors.bright}RAW API RESPONSE:${colors.reset}`);
    console.log(`${colors.gray}${rawResponse}${colors.reset}\n`);
    
    console.log(`${colors.bright}REQUEST DURATION:${colors.reset}`);
    console.log(`${colors.cyan}${apiDuration}ms${colors.reset}\n`);
    
    console.log(`${colors.bright}METADATA:${colors.reset}`);
    console.log(`  Model: ${data.model}`);
    console.log(`  Prompt Tokens: ${data.usage?.prompt_tokens}`);
    console.log(`  Completion Tokens: ${data.usage?.completion_tokens}`);
    console.log(`  Total Tokens: ${data.usage?.total_tokens}\n`);
    
    const totalDuration = Date.now() - startTime;
    log.section(`Total Test Duration: ${totalDuration}ms`);
    
    return {
      success: true,
      answer,
      rawResponse,
      requestDuration: apiDuration,
      totalDuration,
      metadata: {
        model: data.model,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.log(`\n${colors.red}${error.stack}${colors.reset}\n`);
    
    return {
      success: false,
      error: error.message,
      totalDuration: Date.now() - startTime,
    };
  }
}

// Get image path from command line arguments
const imagePath = process.argv[2];

if (!imagePath) {
  log.error('Please provide an image path as an argument');
  console.log(`\nUsage: node openai-test.js <image-path>\n`);
  console.log(`Example: node openai-test.js ./mcq-image.jpg\n`);
  process.exit(1);
}

// Run the test
testOpenAIMCQ(imagePath).then((result) => {
  process.exit(result.success ? 0 : 1);
});
