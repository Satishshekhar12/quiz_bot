@echo off
REM OpenAI MCQ Test Runner
REM Usage: openai-test.bat [image-path]

setlocal enabledelayedexpansion

echo.
echo ====================================================
echo   OpenAI MCQ Test Runner
echo ====================================================
echo.

REM Check if image path provided
if "%1"=="" (
    set "IMAGE_PATH=McqQ1.jpg"
) else (
    set "IMAGE_PATH=%1"
)

echo Image: %IMAGE_PATH%
echo.

REM Check if image exists
if not exist "%IMAGE_PATH%" (
    echo ERROR: Image file not found: %IMAGE_PATH%
    echo.
    echo Please save your MCQ image as "McqQ1.jpg" in this directory
    exit /b 1
)

echo Found image: %IMAGE_PATH%
echo.

REM Check Node.js
for /f "tokens=*" %%i in ('node --version 2^>nul') do set "NODE_VER=%%i"
if "%NODE_VER%"=="" (
    echo ERROR: Node.js not found. Please install Node.js
    exit /b 1
)

echo Node.js: %NODE_VER%
echo.

REM Run the test
echo Starting OpenAI MCQ test...
echo.

node openai-test.js "%IMAGE_PATH%"

set "EXIT_CODE=%ERRORLEVEL%"
echo.
if %EXIT_CODE% equ 0 (
    echo Test completed successfully!
) else (
    echo Test completed with exit code: %EXIT_CODE%
)

exit /b %EXIT_CODE%
