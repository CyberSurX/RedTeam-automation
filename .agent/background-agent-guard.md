---
name: background-agent-guard
description: Validates agent behavior - prevents fake data injection, off-topic work, and ensures task focus
version: 1.0.0
type: pre-execution-guard
triggers:
  - on_agent_task_start
  - on_agent_task_complete
  - on_file_write
  - on_code_generation
---

# Background Agent Guard

## Purpose
This guard monitors and validates all background agent activities to ensure:
1. No fake/placeholder data is injected into the codebase
2. Agents stay focused on assigned tasks
3. No unauthorized modifications occur
4. Quality standards are maintained

## Pre-Execution Validation Rules

### Rule 1: Task Relevance Check
Before any agent begins work, validate:

```yaml
validation:
  task_alignment:
    - Verify task description matches user's original request
    - Check that target files are relevant to the task
    - Ensure no scope creep beyond requested changes
    - Flag any attempt to modify unrelated files
```

### Rule 2: Fake Data Detection Patterns
Block any content containing these patterns:

```yaml
blocked_patterns:
  placeholder_data:
    - "TODO: implement"
    - "FIXME"
    - "placeholder"
    - "fake_data"
    - "mock_value"
    - "test123"
    - "example.com" # unless explicitly testing
    - "lorem ipsum"
    - "foo/bar/baz" # unless in documentation
    - "xxx"
    - "yyy"
    - "zzz"

  fake_credentials:
    - "password123"
    - "admin123"
    - "secret_key_here"
    - "your_api_key"
    - "sk-..."  # OpenAI style keys
    - "AKIA..."  # AWS keys

  incomplete_implementations:
    - "pass  # implement later"
    - "raise NotImplementedError"
    - "// TODO"
    - "/* implement */"
    - "return None  # placeholder"
    - "return {}"  # empty returns in non-void functions
```

### Rule 3: Off-Topic Work Prevention
Agents must NOT perform these activities unless explicitly requested:

```yaml
prohibited_actions:
  - Adding unrelated features
  - Refactoring code not mentioned in task
  - Creating new files not required by task
  - Modifying configuration files without reason
  - Installing new dependencies without justification
  - Changing project structure unexpectedly
  - Adding comments to unchanged code
  - Formatting/linting files outside task scope
```

## Post-Execution Validation

### Quality Gates

```yaml
quality_checks:
  code_quality:
    - All new functions have proper error handling
    - No hardcoded secrets or credentials
    - Type hints used consistently
    - Code follows project conventions

  task_completion:
    - All requested changes implemented
    - No partial implementations
    - Tests added for new functionality
    - Documentation updated if needed

  behavior_verification:
    - Changes limited to task scope
    - No unexpected file modifications
    - No data leakage between tasks
    - Clean git diff (no unrelated changes)
```

## Enforcement Actions

### On Violation Detection

```yaml
enforcement:
  severity_levels:
    critical:
      - Fake credentials detected
      - Unauthorized file access
      - Data injection attempt
      action: BLOCK_IMMEDIATELY + ALERT_USER

    high:
      - Off-topic modifications
      - Incomplete implementations
      - Scope creep
      action: ROLLBACK_CHANGES + REQUEST_CORRECTION

    medium:
      - Placeholder content
      - Missing error handling
      - Style violations
      action: FLAG_FOR_REVIEW + CONTINUE

    low:
      - Minor documentation gaps
      - Optional improvements missed
      action: LOG_WARNING + CONTINUE
```

## Integration with Agent System

### Pre-Task Hook
```bash
#!/bin/bash
validate_task_scope() {
    local task_description="$1"
    local target_files="$2"

    if [[ -z "$task_description" ]]; then
        echo "ERROR: Empty task description"
        exit 1
    fi

    if [[ ${#task_description} -lt 10 ]]; then
        echo "ERROR: Task description too short"
        exit 1
    fi
}
```

### Post-Task Hook
```bash
#!/bin/bash
verify_changes() {
    local git_diff=$(git diff --name-only)
    local expected_files="$1"

    for changed_file in $git_diff; do
        if ! echo "$expected_files" | grep -q "$changed_file"; then
            echo "WARNING: Unexpected change to: $changed_file"
        fi
    done

    git diff | grep -iE "(TODO|FIXME|placeholder|fake_)" && {
        echo "ERROR: Blocked pattern detected in changes"
        exit 1
    }
}
```

## Configuration

```json
{
  "background_agent_guard": {
    "enabled": true,
    "strict_mode": true,
    "allow_placeholder_in_tests": true,
    "allow_todo_in_wip_branches": false,
    "auto_rollback": true,
    "alert_threshold": "high",
    "log_all_violations": true
  }
}
```
