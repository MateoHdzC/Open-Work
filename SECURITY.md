# Security Policy & Permissions Model: OpenWork

OpenWork provides AI models with real execution capabilities on your Windows computer. Because real execution carries inherent risks, OpenWork incorporates a multi-layer security model designed to give autonomy for standard development while guarding against destructive operations.

---

## 1. Zero-Trust AI Execution Model

1. **The Model is Not Privileged**: An AI model cannot directly run system code. It can only emit structured tool requests (e.g. `delete_file`, `execute_command`).
2. **OpenWork Controls the Gateway**: OpenWork evaluates every tool request against its internal security firewall before any execution is attempted.
3. **No Simulation of Permissions**: If an action is forbidden or rejected by the user, OpenWork reports that failure directly to the model.

---

## 2. Tool Risk Classification

The Security Firewall classifies actions into three tiers:

| Tier | Characteristics | Examples | Behavior |
| :--- | :--- | :--- | :--- |
| **Safe** | Read-only actions that do not alter OS state | `read_file`, `list_directory`, `list_windows`, `screenshot`, `git_status` | Executes autonomously |
| **Sensitive** | Modifications to files or non-destructive terminal runs | `write_file`, `execute_command` (standard builds/tests) | Executes autonomously with audit logging |
| **Destructive** | Irreversible changes, deletions, process termination | `delete_file`, `delete_directory`, `close_application`, destructive shell commands (`rmdir`, `format`) | **Requires explicit user authorization** |

---

## 3. The Confirmation Firewall

When a model requests a destructive action:
1. Execution is suspended immediately.
2. The agent transitions to state `WaitingForConfirmation`.
3. An explicit confirmation card is rendered in the conversation UI.
4. The user must review the exact tool parameters and click **Authorize** or **Cancel** (or say "Sí" / "Yes" when a confirmation is actively pending).
5. A generic "Sí" in normal dialogue will never authorize a destructive action unless a confirmation is currently pending.

---

## 4. Local Credential Storage

- API keys provided by the user are never sent to third-party telemetries or central OpenWork servers.
- Keys are encrypted locally using Windows DPAPI via Electron's `safeStorage` API, or AES-256 with machine-scoped key derivations.
- Stored credentials reside strictly in `~/.openwork/settings.json`.

---

## 5. Reporting Vulnerabilities

If you discover a potential vulnerability within OpenWork, please report it via GitHub Security Advisories or contact the repository maintainer directly.
