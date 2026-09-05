# Changelog: OpenWork

All notable changes to the OpenWork Windows Desktop Agent project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-05

### Added
- **Native Windows Desktop Architecture**: Re-engineered OpenWork into a full native Electron desktop application with React 19, TypeScript, and Vite.
- **Security & Process Isolation**: Strict context isolation (`contextIsolation: true`, `nodeIntegration: false`) with typed ContextBridge IPC interface.
- **Model Gateway & Dynamic Discovery**:
  - Support for OpenAI, Anthropic, Google Gemini, OpenRouter, Ollama, and Custom OpenAI endpoints.
  - Dynamic discovery querying `/models` endpoints without hardcoded static lists.
  - Local credential storage with Windows DPAPI encryption (`safeStorage`).
- **Autonomous Agent Loop & State Machine**:
  - 8 distinct execution states (`Idle`, `Thinking`, `Running`, `WaitingForConfirmation`, `Paused`, `Completed`, `Failed`, `Cancelled`).
  - Dual modes: **CHAT** (dialogue only) and **AGENT** (full computer control).
  - Immediate user emergency controls (**Stop**, **Pause**, **Resume**).
- **Comprehensive Windows Tool Suite**:
  - Window & application management (`open_application`, `close_application`, `focus_window`, `list_windows`, `get_active_window`, `minimize_window`, `maximize_window`).
  - Hardware simulation (`move_mouse`, `click`, `double_click`, `right_click`, `drag`, `scroll`, `type_text`, `press_key`, `key_combination`, `screenshot`, `screen_state`).
  - Deep filesystem operations (`read_file`, `write_file`, `create_file`, `delete_file`, `rename_file`, `move_file`, `copy_file`, `create_directory`, `delete_directory`, `list_directory`).
  - Native terminal execution with full stdout/stderr capture (`execute_command`, `execute_powershell`, `execute_cmd`).
  - Browser control (`open_browser`, `navigate_browser`, `read_page`, `click_browser`, `type_browser`, `scroll_browser`, `browser_screenshot`).
  - Development tools (`detect_project`, `git_status`, `git_diff`, `git_log`, `git_branch`, `git_commit`, `run_tests`, `run_build`).
  - 3D app integration (`blender_execute_python`).
- **Empirical Reality Verification Engine**: Automated OS-level validation of application processes, filesystem mutations, and test runs.
- **Security Firewall**: Classification of actions into Safe, Sensitive, and Destructive tiers with interactive authorization prompts.
- **4-Tier Persistent Memory Store**: Permanent preferences, project rules, conversation history, and working task checkpoints backed by SQLite.
- **Continuous Duplex Voice**: Real-time microphone dictation and speech synthesis with interruption support.
- **Modern Desktop UI**:
  - Sidebar navigation with mode switcher.
  - Live conversation area with inline tool status and verification badges.
  - Input bar with voice controls and emergency interruption buttons.
  - Workspace inspector with automatic tech stack detection.
  - Real-time audit activity ledger.
  - Memory bank manager.
  - Multi-provider settings and key manager.
- **Packaging**: Windows NSIS setup package generation (`OpenWork-Setup.exe`) configured via `electron-builder`.
