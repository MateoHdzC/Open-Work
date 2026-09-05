# OpenWork 🤖
> **Professional Autonomous Windows Desktop Agent & Computer Workspace Environment**

OpenWork is a native Windows desktop agent application built with Electron, React, TypeScript, and Node.js. It connects your personal AI models (OpenAI, Anthropic, Google Gemini, OpenRouter, Ollama) directly to your Windows desktop, giving the model an empirical execution runtime with real tools, verified computer controls, persistent memory, and a safety confirmation firewall.

---

## ⚠️ Fundamental Principle: OpenWork is NOT an AI

1. **OpenWork is NOT an AI model.**
2. **OpenWork does not train, host, or simulate an AI model.**
3. **All intelligence originates exclusively from the model connected via your user-provided API key.**
4. OpenWork serves solely as the execution environment:
```
USER ➔ OPENWORK ➔ PROVIDER API ➔ AI MODEL ➔ OPENWORK ➔ WINDOWS TOOLS ➔ WINDOWS PC ➔ REALITY ➔ AI MODEL ➔ USER
```

---

## 🌟 Key Features

- **Empirical Reality Verification**: OpenWork never blindly trusts the model. When a model claims an application was launched, a file was modified, or tests passed, the Verification Engine checks the actual operating system state (process tree, window handles, filesystem mutation, exit codes).
- **Two Exclusive Modes**:
  - **CHAT Mode**: Conversational dialogue, conceptual architecture analysis, writing, and explanations without system tool execution.
  - **AGENT Mode**: Autonomous computer workspace operations with full Windows tool suite, filesystem access, PowerShell/CMD terminal, browser, and hardware simulation.
- **Dynamic Model Discovery**: No rigid static lists. Connect your API key and OpenWork dynamically queries the provider's `/models` endpoint to discover available models and their capabilities (vision, reasoning, tool calling).
- **Comprehensive Windows Tool Suite**:
  - **Applications**: `open_application`, `close_application`, `focus_window`, `list_windows`, `get_active_window`, `minimize_window`, `maximize_window`.
  - **Hardware Control**: `move_mouse`, `click`, `double_click`, `right_click`, `drag`, `scroll`, `type_text`, `press_key`, `key_combination`, `screenshot`, `screen_state`.
  - **Filesystem**: `read_file`, `write_file`, `create_file`, `delete_file`, `rename_file`, `move_file`, `copy_file`, `create_directory`, `delete_directory`, `list_directory`.
  - **Terminal**: `execute_command`, `execute_powershell`, `execute_cmd` with full stdout, stderr, and exit code capture.
  - **Browser**: `open_browser`, `navigate_browser`, `read_page`, `click_browser`, `type_browser`, `scroll_browser`, `browser_screenshot`.
  - **Development & Git**: `detect_project`, `git_status`, `git_diff`, `git_log`, `git_branch`, `git_commit`, `run_tests`, `run_build`.
  - **Specialized 3D Apps**: `blender_execute_python` (Python `bpy` script execution in Blender background or active instances).
- **Security Confirmation Firewall**: Safe read-only tasks execute autonomously. Destructive or irreversible actions (file/folder deletion, critical process termination, destructive terminal commands) require explicit user authorization.
- **4-Tier Persistent Memory**:
  - **Permanent**: Global user preferences, interface settings, programming styles.
  - **Project**: Architecture guidelines, conventions, repository decisions.
  - **Conversation**: Session history and task milestones.
  - **Working Memory**: Active task state and resumption checkpoints ("Continúa donde nos quedamos").
- **Duplex Voice Integration**: Continuous voice input via Speech Recognition and spoken output with live interruption support.
- **Live Emergency Controls**: Immediate **Stop**, **Pause**, and **Resume** execution controls.

---

## 💻 Requirements

- **Operating System**: Windows 10 or Windows 11 (64-bit)
- **Node.js**: v20.x or v22.x+ (Node v24 supported)
- **PowerShell**: 5.1 or PowerShell 7+ (pre-installed on Windows)
- **Hardware**: 4 GB RAM minimum (8 GB recommended)

---

## 🚀 Installation & Getting Started

### 1. Clone and Install
```powershell
git clone https://github.com/MateoHdzC/Open-work.git
cd openwork
npm install
```

### 2. Build and Run in Development
```powershell
# Build renderer and main processes
npm run build

# Launch native Electron application
npm start
```

### 3. Generate Windows Installer (`OpenWork-Setup.exe`)
```powershell
npm run package:win
```
The installer will be generated in `release/OpenWork-Setup.exe`.

---

## ⚙️ Connecting Your API Key

1. Navigate to **Settings** in the sidebar.
2. Select **Providers & Keys**.
3. Choose your provider:
   - **OpenAI**
   - **Anthropic**
   - **Google Gemini**
   - **OpenRouter**
   - **Ollama** (Local models, no API key needed)
   - **Custom OpenAI-compatible endpoints**
4. Enter your personal API key (stored securely in `~/.openwork/` encrypted via OS-level encryption / safeStorage).
5. Click **Test Connection & Discover Models**.
6. Select your preferred model and click **Save & Set as Active**.

---

## 📁 Setting Up a Workspace

1. Click on **Workspace** in the sidebar.
2. Click **Select Folder** to open the Windows native folder picker.
3. Choose your target project folder (e.g. `C:\Users\You\Projects\MyApp`).
4. OpenWork automatically scans and detects your project stack (Node.js, Python, Rust, Go, Java, C#, Git repository).

---

## 💬 Usage Examples

### Software Engineering Task
> *"Inspect the repository, find out why `npm run build` fails, fix the compilation error in `src/app.ts`, and run the test suite."*

**Execution Flow**:
1. OpenWork passes the instruction to your connected AI model.
2. The model calls `detect_project` and `run_build`.
3. OpenWork executes the command in PowerShell and captures the compiler error.
4. The model analyzes the error and calls `read_file("src/app.ts")`.
5. OpenWork provides the exact source code.
6. The model calls `write_file` with the corrected code.
7. OpenWork applies the file change and verifies its existence.
8. The model calls `run_tests`.
9. OpenWork runs the tests, verifies exit code 0, and returns the verified result.
10. The model responds with a summary of the fix.

### Windows Application Automation
> *"Abre Blender y ejecuta este script para crear un cubo rojo."*

**Execution Flow**:
1. Model calls `open_application("blender")`.
2. Windows launches Blender.
3. OpenWork verifies the process is active in the Windows process tree.
4. Model calls `blender_execute_python` with the `bpy` script.
5. OpenWork executes the Python script and verifies scene status.
6. Model confirms completion to the user.

---

## 🔒 Security Architecture

- **Context Isolation**: Electron runs with `contextIsolation: true` and `nodeIntegration: false`. The renderer communicates exclusively via typed IPC channels defined in `src/preload/index.ts`.
- **Confirmation Firewall**: Destructive actions (`delete_file`, `delete_directory`, `close_application`, critical shell commands) trigger an explicit confirmation prompt in the UI and require confirmation before execution.
- **Zero Cloud Leakage**: API keys and memories are saved strictly on your local PC (`~/.openwork/`). No data is relayed to central servers.

---

## 🧪 Testing

Run the automated test suite with Vitest:
```powershell
npm test
```

---

## 📄 License

MIT License © 2026 OpenWork Contributors