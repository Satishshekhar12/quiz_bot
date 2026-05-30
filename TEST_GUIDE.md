# OpenAI MCQ Test Guide

## 📋 Setup Steps

### Step 1: Save the Test Image

You have an MCQ question image attached. Save it as:
```
d:\codings\react native learn\backup tic tac\McqQ1.jpg
```

**How to save:**
1. Right-click the attached image in your editor
2. Select "Save Image As..."
3. Save as `McqQ1.jpg` in the project root folder

### Step 2: Verify Setup

Run this to check everything is in place:

```powershell
cd "d:\codings\react native learn\backup tic tac"
node test-setup.js
```

Expected output:
```
✓ openai.config.json found
  Model: gpt-3.5-turbo
  API Key: sk-proj-...

✓ openai-test.js found
✓ Found image: McqQ1.jpg (45000 bytes)
```

### Step 3: Run the Test

Use the PowerShell script:

```powershell
cd "d:\codings\react native learn\backup tic tac"
.\openai-test.ps1 -ImagePath "McqQ1.jpg"
```

Or use the batch script:

```cmd
cd d:\codings\react native learn\backup tic tac
openai-test.bat McqQ1.jpg
```

Or run Node directly:

```powershell
cd "d:\codings\react native learn\backup tic tac"
node openai-test.js McqQ1.jpg
```

---

## 🎯 Expected Output

When successful, you'll see:

```
🔬 OpenAI MCQ Test - Phase 1 Verification

Step 1: Loading API Key
ℹ Reading api.txt...
✓ API key loaded (length: 150)

Step 2: Processing Image
ℹ Loading image: McqQ1.jpg
✓ Image converted to base64 (45000 bytes)

Step 3: Preparing OpenAI API Request
ℹ Request prepared
ℹ Model: gpt-3.5-turbo

Step 4: Calling OpenAI API
ℹ Sending request to https://api.openai.com/v1/chat/completions...
✓ Response received in 1234ms

Step 5: Parsing Response
✓ API response successful

Step 6: Results

EXTRACTED ANSWER:
C

RAW API RESPONSE:
C

REQUEST DURATION:
1234ms

METADATA:
  Model: gpt-3.5-turbo
  Prompt Tokens: 250
  Completion Tokens: 5
  Total Tokens: 255

Total Test Duration: 1250ms
```

---

## 📝 Question for Reference

Your test image contains:

```
Research completed in 1982 found that in the United States soil erosion

A - reduced the productivity of farmland by 20 per cent.
B - was almost as severe as in India and China.
C - was causing significant damage to 20 per cent of farmland.
D - could be reduced by converting cultivated land to meadow or forest.
```

**Correct Answer: C**

---

## 🛠️ Troubleshooting

### Image Not Found
- Make sure `McqQ1.jpg` is saved in the project root
- Check file name spelling (case-sensitive on some systems)

### API Error: Model not found
- Verify `openai.config.json` has: `"model": "gpt-3.5-turbo"`
- Don't use gpt-4-mini (not available in your account)

### Connection Error
- Check internet connection
- Verify OpenAI API key in `openai.config.json`
- Check if OpenAI API is accessible from your network

### File Encoding Issues
- Ensure image is in JPEG or PNG format
- Test with smaller images first

---

## 📁 Files Created

- `openai-test.js` - Node.js test script (sends image to OpenAI)
- `openai-test.ps1` - PowerShell test runner
- `openai-test.bat` - Batch file test runner
- `test-setup.js` - Setup verification script
- `TEST_GUIDE.md` - This file

---

## ✅ What Gets Tested

1. ✓ API key loading from config
2. ✓ Image file reading
3. ✓ Base64 encoding
4. ✓ OpenAI API connection
5. ✓ Response parsing
6. ✓ Answer extraction (A-E)
7. ✓ Error handling & retries

---

## 🚀 Next Steps

After successful test:
1. Run `npm start` to start the React Native app
2. Press 'S' to capture photos
3. Photos are analyzed automatically
4. Answers appear in status box + sent to Telegram
