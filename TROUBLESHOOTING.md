# Troubleshooting & Common Issues: OpenWork

This document provides resolutions for common issues when installing, running, and using OpenWork on Windows.

---

## 1. Electron or Node Build Issues

### Issue: `electron` not recognized or failed to download
- **Cause**: Windows firewall or corporate proxy blocked the initial Electron binary download during `npm install`.
- **Solution**: Run the Electron post-install downloader explicitly:
  ```powershell
  node node_modules/electron/install.js
  ```

### Issue: Vite build error about missing modules
- **Cause**: Out-of-date node_modules cache.
- **Solution**:
  ```powershell
  npm run build:renderer
  ```

### Issue: `cd openwork` fails (`ItemNotFoundException`) and `npm install` throws `ENOENT: no such file or directory, open '...\package.json'`
- **Cause**: By default, `git clone https://github.com/MateoHdzC/Open-work.git` creates a directory named `Open-work` (with a hyphen and capitalization). Attempting to run `cd openwork` fails, leaving the terminal in the parent directory where no `package.json` exists.
- **Solution**: Navigate into the exact folder created by Git:
  ```powershell
  cd Open-work
  npm install
  ```
  Or clone into `openwork` explicitly:
  ```powershell
  git clone https://github.com/MateoHdzC/Open-work.git openwork
  cd openwork
  npm install
  ```

### Issue: `remove ...\OpenWork.exe: Acceso denegado` / `Invalid file descriptor to ICU data`
- **Cause**: An earlier instance of `OpenWork.exe` is still running or hung in memory (often keeping an error dialog open in the background), which locks the binary on Windows. When `electron-builder` tries to overwrite it, access is denied and the destination directory becomes partially extracted/corrupted.
- **Solution**: Terminate any lingering instances and clean the release folder:
  ```powershell
  Stop-Process -Name OpenWork -Force -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force release/win-unpacked -ErrorAction SilentlyContinue
  npm run package:win
  ```
  *(The `npm run package:win` script now automatically runs this cleanup step).*

---

## 2. Windows Computer Control & PowerShell Issues

### Issue: `powershell` execution policy errors
- **Cause**: Default Windows execution policy restricted script execution.
- **Solution**: OpenWork invokes commands with `-NoProfile -Command`. If you encounter execution policy restrictions on your machine, run in an administrative PowerShell terminal:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### Issue: Window manipulation or mouse click does not register on elevated windows
- **Cause**: If target applications (e.g. Task Manager, an admin Command Prompt) are running with elevated Administrator privileges, standard non-elevated desktop processes cannot send synthetic inputs to them due to Windows UIPI (User Interface Privilege Isolation).
- **Solution**: Run OpenWork with Administrator privileges if you need the agent to interact with elevated admin software.

---

## 3. Provider Connection & API Key Issues

### Issue: `401 Unauthorized` or `Invalid API Key`
- **Cause**: The API key entered in **Settings ➔ Providers & Keys** is invalid or expired.
- **Solution**: Verify the key with your provider (OpenAI, Anthropic, Google Gemini, OpenRouter). Click **Test Connection & Discover Models** in Settings to verify connectivity before running tasks.

### Issue: Ollama local models not connecting
- **Cause**: Ollama is not running or listening on `http://localhost:11434`.
- **Solution**: Start Ollama in PowerShell (`ollama serve`) and verify models with `ollama list`. OpenWork will dynamically discover all installed models.

---

## 4. Blender 3D Automation

### Issue: Blender executable not found
- **Cause**: Blender is installed in a non-standard path not present in Windows `PATH`.
- **Solution**: Add your Blender installation directory (e.g. `C:\Program Files\Blender Foundation\Blender 4.2`) to your Windows User or System `PATH` environment variable.
