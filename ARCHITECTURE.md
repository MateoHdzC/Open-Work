# Architecture Specification: OpenWork

This document outlines the modular design, data flow, IPC contracts, and verification pipelines of OpenWork.

---

## 1. High-Level Architectural Flow

OpenWork enforces a strict architectural boundary between the **AI Brain** (which belongs to the user's provider) and the **Local Execution Body** (which belongs to OpenWork):

```
+-------------------------------------------------------------+
|                        USER INTERFACE                       |
|         React + TypeScript + Vite Desktop Renderer          |
+-------------------------------------------------------------+
                              |
                              | Typed ContextBridge IPC
                              v
+-------------------------------------------------------------+
|                    ELECTRON MAIN PROCESS                    |
|                      src/main/index.ts                      |
+-------------------------------------------------------------+
       |                                          |
       | LLM Request                              | Real Execution
       v                                          v
+------------------------+              +---------------------+
|     MODEL GATEWAY      |              |    AGENT ENGINE     |
|   OpenAI / Anthropic   |              |  ReAct Cycle Loop   |
|   Google / OpenRouter  |              +---------------------+
|     Ollama / Custom    |                         |
+------------------------+                         v
       |                                +---------------------+
       | Tool Call Response             |  SECURITY FIREWALL  |
       v                                | Safe vs Destructive |
+------------------------+              +---------------------+
|    AI MODEL DECISION   |                         |
|   "open_application"   |                         v
+------------------------+              +---------------------+
                                        |     TOOL SYSTEM     |
                                        | Windows / Terminal  |
                                        | Mouse / Files / App |
                                        +---------------------+
                                                   |
                                                   v
                                        +---------------------+
                                        |     WINDOWS OS      |
                                        | PowerShell / Win32  |
                                        +---------------------+
                                                   |
                                                   v
                                        +---------------------+
                                        | VERIFICATION ENGINE |
                                        | Reality Check on OS |
                                        +---------------------+
                                                   |
                                                   | Verified Result
                                                   v
                                        +---------------------+
                                        |    MODEL GATEWAY    |
                                        +---------------------+
```

---

## 2. Process Separation & Security

### Electron Main (`src/main/index.ts`)
- Manages native OS resources, window lifecycle, and background processes.
- Houses the `AgentEngine`, `ToolRegistry`, `ModelGateway`, `MemoryStore`, and `SecurityFirewall`.
- Stores sensitive API keys using OS-level DPAPI encryption (`safeStorage`) or machine-scoped AES-256-CBC.
- Does not allow arbitrary web code to execute Node.js APIs.

### Preload Script (`src/preload/index.ts`)
- Configured with `contextIsolation: true` and `nodeIntegration: false`.
- Exposes a typed `window.openwork` object via `contextBridge.exposeInMainWorld`.
- Strictly controls what events and arguments can pass between Renderer and Main.

### Renderer Process (`src/renderer/`)
- Pure React 19 + TypeScript application.
- Uses Vite for high-speed compilation and bundling.
- Never directly executes shell commands or reads disk files; all actions request IPC handlers.

---

## 3. Core Subsystems

### 1. Agent Engine (`src/agent/engine.ts`)
Orchestrates the ReAct (Reasoning + Action) execution loop:
1. Receives prompt from user.
2. Injects persistent memory and workspace context.
3. Requests model reasoning and potential tool calls via `ModelGateway`.
4. Evaluates tool permissions via `SecurityFirewall`.
5. Executes tools via `ToolRegistry`.
6. Inspects physical operating system state via `VerificationEngine`.
7. Returns empirical results back to the model.
8. Repeats until task completion or user interrupt (**Stop / Pause**).

### 2. State Machine (`src/agent/types.ts`)
Maintains real-time status across 8 discrete states:
- `Idle`: Ready for instructions.
- `Thinking`: Model is processing and streaming tokens.
- `Running`: OpenWork is executing system tools on Windows.
- `WaitingForConfirmation`: Destructive tool execution paused pending user approval.
- `Paused`: Execution temporarily suspended by user.
- `Completed`: Task finished with verified outcomes.
- `Failed`: Critical error encountered during execution.
- `Cancelled`: Task aborted via user Stop command.

### 3. Empirical Verification Engine (`src/verification/engine.ts`)
- Verifies process tree instances for application launches.
- Verifies filesystem mutations and content snippets.
- Verifies build and test execution exit codes.

### 4. 4-Tier Memory Bank (`src/memory/store.ts`)
Backed by local SQLite (`~/.openwork/openwork.sqlite`) with category indexes:
- `permanent`: User preferences and coding standards.
- `project`: Architecture rules and repository setup.
- `conversation`: Thread history and milestones.
- `working`: Active task state for seamless task resumption.
