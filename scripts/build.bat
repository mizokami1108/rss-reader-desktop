@echo off
echo Building RSS Reader...
echo.
echo Building renderer...
npm run build:renderer
if %errorlevel% neq 0 (
    echo Renderer build failed!
    pause
    exit /b 1
)
echo.
echo Building main process...
npm run build:main
if %errorlevel% neq 0 (
    echo Main process build failed!
    pause
    exit /b 1
)
echo.
echo Build completed successfully!
echo To start the application, run: npm start
pause