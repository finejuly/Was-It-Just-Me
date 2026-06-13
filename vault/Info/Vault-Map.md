# Vault Map — paths, roles & skill assignments

Defines the role of **every** path in the vault and which Loop skill reads/writes it. Maintained as part of Loop setup ([PREPARATION.md](../../PREPARATION.md)). Skills live in [.claude/skills/](../../.claude/skills/); the loop's control flow is [LOOP.md](../../LOOP.md).

## Path → role → skills

| Path | Role | Writes / moves | Reads |
| --- | --- | --- | --- |
| `Loop/config.md` | Runtime config (`refresh_minutes`, `unanswered_issue_limit`) | _(human-edited)_ | `loop-orchestrate` |
| `Loop/PRD.md` | Product requirements — single source of truth | `loop-prd` (orchestrator finalizes) | all modules |
| `Loop/GOAL.md` | Prioritized goals + milestones, derived from PRD | `loop-goal` | `loop-orchestrate`, `loop-discovery`, `loop-plan`, `loop-create-task` |
| `Loop/Progress.md` | Current status snapshot (refreshed each loop) | `loop-progress` (orchestrator-owned) | `loop-orchestrate`, `loop-goal` |
| `Loop/Preferences.md` | Durable conventions/decisions applied each loop | `loop-learn` | `loop-orchestrate`, `loop-plan`, `loop-create-task`, `loop-implement` |
| `Loop/Issues/pending/` | Decisions awaiting user approval/rejection (gates implementation) | `loop-create-issue` | `loop-orchestrate` (gate) |
| `Loop/Issues/approved/` | Approved decisions → source for tasks | _(user moves here)_ | `loop-create-task` |
| `Loop/Issues/rejected/` | Declined decisions, kept for learning | _(user moves here)_ | `loop-learn` |
| `Loop/Tasks/candidates/` | Proposed, not-yet-planned tasks | `loop-discovery`, `loop-create-task` | `loop-plan` |
| `Loop/Tasks/ready/` | Planned tasks with acceptance criteria | `loop-plan` | `loop-implement` |
| `Loop/Tasks/active/` | Tasks currently being implemented | `loop-implement` | `loop-orchestrate` |
| `Loop/Tasks/done/` | Completed tasks | `loop-implement` | `loop-review`, `loop-learn` |
| `Reviews/` | Independent review findings (triaged into tasks/issues) | `loop-review` | `loop-orchestrate` (triage), `loop-learn` |
| `Run Log/` | Append-only history of loop runs | `loop-orchestrate` / `loop-progress` | `loop-orchestrate` |
| `Info/Resources.md` | External reference links | _(human-edited)_ | `loop-discovery` |
| `Info/Vault-Map.md` | This meta doc — roles & assignments | _(setup-maintained)_ | humans, `loop-orchestrate` |

→ **Every folder has a defined role and at least one skill that reads or writes it. No unused folders.**

## Skills → who invokes them (no missing, no unused)

| Skill | Module / role | Invoked by |
| --- | --- | --- |
| `loop-orchestrate` | Main Orchestrator (one invocation = one loop) | external automation / scheduler (loop entry point) |
| `loop-discovery` | Discovery module | `loop-orchestrate` (subagent) |
| `loop-plan` | Planning module | `loop-orchestrate` (subagent) |
| `loop-implement` | Implementation module (only code-writer) | `loop-orchestrate` |
| `loop-review` | Review module | `loop-orchestrate` (subagent) |
| `loop-learn` | Learning module | `loop-orchestrate` (subagent) |
| `loop-prd` | PRD Maintenance module | `loop-orchestrate`; bootstrap |
| `loop-goal` | GOAL generation | after `loop-prd` (and `loop-orchestrate`) |
| `loop-create-task` | Task creation from approved issues/reviews | `loop-orchestrate` (triage), `loop-discovery` |
| `loop-create-issue` | Raise approval/decision issues | `loop-orchestrate`, `loop-discovery`, `loop-plan`, `loop-review`, `loop-implement` |
| `loop-progress` | Write Progress.md + Run Log | `loop-orchestrate` |

→ **Every LOOP.md module + every PREPARATION.md capability maps to exactly one skill, and every skill is invoked in the loop. No missing skills, no unused skills.**

## Coverage vs. PREPARATION.md requirements

| Required capability | Skill |
| --- | --- |
| Reviewing & updating the PRD | `loop-prd` |
| Generating goals from the PRD | `loop-goal` |
| Creating tasks from approved issues + default settings | `loop-create-task` |
| Creating new issues | `loop-create-issue` |
| Executing tasks & implementing code | `loop-implement` |
| Writing Progress | `loop-progress` |
| "Other necessary" (LOOP.md modules) | `loop-orchestrate`, `loop-discovery`, `loop-plan`, `loop-review`, `loop-learn` |
