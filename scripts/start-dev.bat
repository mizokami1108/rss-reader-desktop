@echo off
chcp 65001 >nul
echo ===================================
echo RSS Reader Development Server
echo ===================================
echo.
echo Checking node_modules...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)
echo.
echo Starting webpack development server...
echo Open http://localhost:3000 in your browser
echo.
echo Press Ctrl+C to stop the server
echo.
node_modules\.bin\webpack serve --config webpack.renderer.config.js