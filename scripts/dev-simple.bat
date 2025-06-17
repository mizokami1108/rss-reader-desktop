@echo off
chcp 65001 >nul
echo RSS Reader Simple Development Mode
echo Starting frontend only...
echo.
node_modules\.bin\webpack serve --config webpack.renderer.config.js
pause