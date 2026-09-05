# OpenWork 🤖
> **Autonomous Windows AI Desktop Agent & Computer Workspace Environment**

OpenWork is an open-source, local-first Windows desktop agent application designed to give AI models direct, verified interaction with your computer, applications, workspace files, browser, terminal, mouse, keyboard, and screen.

---

## 🌟 Core Architecture & Principles

- **🧠 Model = Brain, OpenWork = Body & Tools**: Intelligence belongs to the AI model. OpenWork provides the local tools, permissions firewall, memory context, and computer control runtime.
- **🔐 Zero-Copy OpenKey Integration**: Seamlessly connects with your local OpenKey vault (`~/.openkey/openkey.sqlite`) to use your machine-scoped AES-256-GCM encrypted API keys without duplicate storage.
- **🔄 Autonomous ReAct & Verification Loop**: Executes tool chains step-by-step and **actively verifies real Windows outcomes** (checking process trees, exit codes, and filesystem mutations).
- **🛡️ Confirmation Firewall**: Safe read-only actions execute seamlessly, while sensitive or destructive tasks (e.g. deleting files, terminating processes) require explicit user confirmation.
- **🎙️ Continuous Duplex Voice**: Natural voice input and spoken output with live interruption / barge-in support.
- **🧠 Persistent Memory Engine**: Remembers user preferences, project context, and working memory across sessions in local SQLite.
- **🖥️ Computer & Windows Control**:
  - **Applications**: Launch and verify apps like Blender, Roblox Studio, Unity, Visual Studio Code, Chrome, etc.
  - **Mouse & Keyboard**: Cursor positioning, clicks, text typing, and key combinations.
  - **Screen**: Desktop screenshot capture and observation.
  - **Terminal**: Native PowerShell and CMD execution in the workspace.
  - **Filesystem**: Deep file inspection, editing, directory management, and git tracking.
  - **Browser**: Session-aware web navigation and content extraction.
- **📊 Real-Time Activity Feed**: Live task progress monitoring with status states (`Running`, `Completed`, `Waiting`, `Paused`, `Failed`, `Cancelled`) and global emergency **Stop / Pause** controls.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Windows 10 / 11**
- **Node.js** v20+ or v24+
- **npm** or **pnpm**

### 2. Installation & Setup

Clone the OpenWork repository:

```bash
git clone https://github.com/MateoHdzC/Open-work.git
cd Open-work
npm install
```

Build the TypeScript core:

```bash
npm run build
```

Link OpenWork globally so you can launch it from anywhere in Windows:

```bash
npm link
```

---

## 🎮 How to Use OpenWork

### 1. Launching OpenWork

Start the OpenWork Desktop Studio:

```bash
openwork
```

Open your browser at:
👉 **[http://127.0.0.1:3100](http://127.0.0.1:3100)**

### 2. Interaction Modes

- **Agent Mode (Default)**: Full autonomous tool usage, Windows automation, application launching, and workspace development.
- **Chat Mode**: Focused reasoning and conversation without triggering local system actions.

### 3. Voice Interaction

Click the **Voice** button in the top toolbar to start continuous voice conversation. Speak naturally to command the agent (e.g., *"Open Blender"*, *"Run the test suite"*, *"Inspect my project files"*).

### 4. OpenKey Integration Status

Check the status of your local OpenKey vault connection from the command line:

```bash
openwork status
```

---

## 🧪 Testing

Run the automated test suite with Vitest:

```bash
npm test
```

---

## 📜 License

MIT License © 2026 [MateoHdzC](https://github.com/MateoHdzC/Open-work).