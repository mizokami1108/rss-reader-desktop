@echo off
chcp 65001 >nul
echo RSS Reader Development Starting...
echo.
echo Starting renderer process...
start "Renderer" cmd /k "node_modules\.bin\webpack serve --config webpack.renderer.config.js"
echo.
echo Waiting for renderer to start...
timeout /t 8 /nobreak > nul
echo.
echo Starting main process...
start "Main" cmd /k "node_modules\.bin\electron ."
echo.
echo Development servers started!
echo Renderer: http://localhost:3000
echo Main: Electron window should open
pause