@echo off
chcp 65001 >nul
echo ===================================
echo RSS Reader Fixed Development Server
echo ===================================
echo.
echo Installing missing polyfills if needed...
npm install --save-dev util
echo.
echo Starting development server...
echo.
echo Browser should open at: http://localhost:3000
echo UI should display with sample data
echo.
echo Press Ctrl+C to stop the server
echo.
node_modules\.bin\webpack serve --config webpack.renderer.config.js