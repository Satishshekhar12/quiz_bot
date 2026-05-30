#!/usr/bin/env powershell
<#
.SYNOPSIS
    OpenAI MCQ Test Runner
    Tests OpenAI API with a provided MCQ image
    
.DESCRIPTION
    This script runs the Node.js OpenAI test against a specified image file
    
.PARAMETER ImagePath
    Path to the MCQ image file to test
    
.EXAMPLE
    .\openai-test.ps1 -ImagePath "McqQ1.jpg"
#>

param(
    [string]$ImagePath = "McqQ1.jpg"
)

# Colors for output
$colors = @{
    Reset = "`e[0m"
    Bright = "`e[1m"
    Green = "`e[32m"
    Red = "`e[31m"
    Yellow = "`e[33m"
    Cyan = "`e[36m"
    Gray = "`e[90m"
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n$($colors.Bright)$($colors.Cyan)$Message$($colors.Reset)`n"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$($colors.Green)✓$($colors.Reset) $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "$($colors.Red)✗$($colors.Reset) $Message"
}

function Write-Info {
    param([string]$Message)
    Write-Host "$($colors.Cyan)ℹ$($colors.Reset) $Message"
}

# Check if image file exists
Write-Header "🧪 OpenAI MCQ Test Runner"
Write-Info "Image path: $ImagePath"

if (-not (Test-Path $ImagePath)) {
    Write-Error "Image file not found: $ImagePath"
    Write-Info "Please provide a valid image path"
    exit 1
}

Write-Success "Image file found"

# Check if Node.js is available
Write-Info "Checking Node.js availability..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js $nodeVersion found"
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    exit 1
}

# Check if openai-test.js exists
Write-Info "Checking for openai-test.js..."
if (-not (Test-Path "openai-test.js")) {
    Write-Error "openai-test.js not found in current directory"
    Write-Info "Please ensure you're in the project root directory"
    exit 1
}

Write-Success "openai-test.js found"

# Run the test
Write-Header "🚀 Running OpenAI MCQ Test"
Write-Info "This will send your image to OpenAI for MCQ analysis..."

try {
    node openai-test.js $ImagePath
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Header "✅ Test completed successfully!"
    } else {
        Write-Header "⚠️ Test completed with exit code: $exitCode"
    }
} catch {
    Write-Error "Failed to run test: $_"
    exit 1
}

exit $exitCode
