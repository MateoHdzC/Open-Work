# Installation & Build Guide: OpenWork

This guide provides step-by-step instructions for installing, configuring, building, and distributing OpenWork on Windows 10 and 11.

---

## 1. System Requirements

- **Operating System**: Windows 10 (Build 19041+) or Windows 11 (64-bit)
- **Node.js**: v20.12.0+ or v22+ (tested and verified on Node v24.18.0)
- **Package Manager**: npm (v10+) or pnpm
- **PowerShell**: Built-in Windows PowerShell 5.1 or PowerShell 7 (pwsh)
- **Optional**: Blender 4.x for 3D Python automation

---

## 2. Cloning the Repository

Open PowerShell or Windows Terminal and clone the repository:

```powershell
git clone https://github.com/MateoHdzC/Open-work.git
cd openwork
```

---

## 3. Installing Dependencies

Install all core and development dependencies:

```powershell
npm install
```

Ensure the Electron and esbuild binaries are downloaded properly:
```powershell
node node_modules/electron/install.js
```

---

## 4. Development Workflow

OpenWork uses Vite for the React frontend and `tsc` for the Node/Electron main process.

### Running in Development Mode

To run OpenWork in development:

```powershell
# Step 1: Build the renderer and main process
npm run build

# Step 2: Launch Electron
npm start
```

For rapid hot-module reloading in the renderer:
```powershell
# Terminal 1: Launch Vite dev server
npm run dev:renderer

# Terminal 2: Start Electron
npm start
```

---

## 5. Running the Automated Test Suite

Execute the unit test suite verifying tools, security firewall, verification engine, and memory store:

```powershell
npm test
```

Expected output:
```text
Test Files  5 passed (5)
Tests       20 passed (20)
```

---

## 6. Building the Windows Installer (`OpenWork-Setup.exe`)

OpenWork uses `electron-builder` to bundle the native Windows executable and NSIS installer.

To produce a production build:

```powershell
npm run package:win
```

The output installer will be located at:
```text
release/OpenWork-Setup.exe
```

The installer supports:
- Custom installation directory selection
- Windows Start Menu shortcuts
- Desktop shortcut creation
- Automatic clean uninstaller
