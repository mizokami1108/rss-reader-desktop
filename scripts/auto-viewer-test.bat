@echo off
chcp 65001 >nul
echo ===================================
echo RSS Reader with Auto Viewer
echo ===================================
echo.
echo New Features Added:
echo - 🎬 Auto RSS Viewer (Full-screen slideshow)
echo - ⏯️  Play/Pause controls
echo - ⚡ Speed adjustment (2-8 seconds)
echo - 🔄 Auto-refresh feeds
echo - ⌨️  Keyboard shortcuts (ESC, Space, Arrow keys)
echo - 📊 Progress bar
echo.
echo Access Auto Viewer:
echo 1. Sidebar: "Auto RSS Viewer" button
echo 2. Header: Slideshow icon
echo.
echo Starting development server...
echo Open http://localhost:3000
echo.
node_modules\.bin\webpack serve --config webpack.renderer.config.js