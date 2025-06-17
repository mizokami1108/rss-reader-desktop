# Windows Setup Guide

This guide will help you run the RSS Reader application on Windows.

## Prerequisites

1. **Node.js** (v16 or higher) - Download from [nodejs.org](https://nodejs.org/)
2. **Git** (optional) - For version control

## Installation

1. Open Command Prompt or PowerShell as Administrator
2. Navigate to the project directory:
   ```cmd
   cd C:\Users\tapio\dev\rss-reader-desktop
   ```
3. Install dependencies:
   ```cmd
   npm install
   ```

## Running the Application

### Option 1: Using Batch Files (Recommended for Windows)

**For Development:**
```cmd
dev.bat
```
This will start both the renderer and main processes in separate windows.

**For Building:**
```cmd
build.bat
```
This will build the application for production.

### Option 2: Using npm Scripts

**Start Development Server (React only):**
```cmd
npm run start:renderer
```
This starts the React development server at http://localhost:3000

**Build the Application:**
```cmd
npm run build
```

**Start Built Application:**
```cmd
npm start
```
Note: Electron may not work in WSL, so run this in native Windows Command Prompt.

## Development Workflow

### For Frontend Development (React UI):
1. Run `npm run start:renderer` or `dev.bat`
2. Open http://localhost:3000 in your browser
3. Make changes to files in `src/renderer/`
4. The page will auto-reload with your changes

### For Full Application Development:
1. Use `dev.bat` to start both processes
2. The Electron window will open automatically
3. Make changes to either frontend or backend code
4. Restart as needed

## Troubleshooting

### Common Issues:

**1. "command not found" errors:**
- Make sure Node.js is installed and in your PATH
- Try using `npx` before commands: `npx webpack serve`

**2. Electron doesn't start in WSL:**
- Use native Windows Command Prompt instead of WSL
- Try `dev.bat` for better Windows compatibility

**3. Port 3000 already in use:**
- Kill existing processes: `taskkill /f /im node.exe`
- Or change port in `webpack.renderer.config.js`

**4. Build errors:**
- Clear node_modules: `rmdir /s node_modules && npm install`
- Clear build cache: `rmdir /s dist`

## File Structure for Development

```
src/
├── renderer/           # React frontend (what you see in the UI)
│   ├── components/    # UI components
│   ├── contexts/      # State management
│   └── index.tsx      # Entry point
├── main/              # Electron backend
│   ├── database/      # SQLite database
│   ├── services/      # RSS parsing
│   └── main.ts        # Main process
└── shared/            # Shared types
```

## Making Changes

### To modify the UI:
- Edit files in `src/renderer/components/`
- Changes will hot-reload in the browser/Electron window

### To modify RSS parsing or database:
- Edit files in `src/main/`
- Restart the application to see changes

### To add new features:
1. Update database schema in `src/main/database/`
2. Add new IPC handlers in `src/main/ipc/`
3. Update frontend contexts in `src/renderer/contexts/`
4. Add new UI components in `src/renderer/components/`

## Production Build

1. Run `build.bat` or `npm run build`
2. The built files will be in the `dist/` folder
3. Run `npm start` to launch the production version

## Getting Help

If you encounter issues:
1. Check the console for error messages
2. Ensure all dependencies are installed: `npm install`
3. Try deleting `node_modules` and `dist` folders, then reinstall
4. Use the batch files for better Windows compatibility