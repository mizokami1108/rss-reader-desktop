@echo off
chcp 65001 >nul
echo ===================================
echo RSS Reader Quick Fix
echo ===================================
echo.
echo 1. Checking Node.js installation...
node --version
npm --version
echo.
echo 2. Reinstalling node_modules...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
npm install
echo.
echo 3. Testing webpack...
node_modules\.bin\webpack --version
echo.
echo 4. All set! You can now run:
echo    start-dev.bat
echo.
pause