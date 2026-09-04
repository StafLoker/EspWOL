# Contributing

Thank you for contributing to this project!

## Commit Conventions

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**.

### Format

```
<type>(<scope>): <short description>
```

### Types

| Type       | When to use                              |
| ---------- | ------------------------------------------ |
| `feat`     | New feature                                |
| `fix`      | Bug fix                                    |
| `chore`    | Maintenance, deps, config                  |
| `docs`     | Documentation only                         |
| `refactor` | Code restructure, no behavior change       |
| `test`     | Adding or updating tests                   |
| `style`    | Formatting, whitespace                     |
| `ci`       | CI/CD changes                              |

### Examples

```
feat(auth): add login screen
fix(api): handle null response
chore: update dependencies
docs: update README
refactor(core): simplify event detection logic
```

## Code Style

These rules apply to any language used in the project, regardless of each language's concrete syntax.

### Naming C/C++

| Kind                    | Convention             | Example                                          | Note                              |
| ----------------------- | ---------------------- | ------------------------------------------------ | --------------------------------- |
| Public functions        | `snake_case`           | `cfgparser_load_ini`, `cfgparser_validate_url`   | Module prefix required            |
| Internal functions      | `snake_case`           | `trim_left`, `parse_kv`, `find_field`            | No prefix, not exposed in `.h`    |
| Structs and typedefs    | `PascalCase`           | `ConfigField`, `EnumValues`, `IntRange`          |                                   |
| Enums (type)            | `PascalCase`           | `ConfigType`, `CfgparserFormat`                  |                                   |
| Enums (values)          | `SCREAMING_SNAKE_CASE` | `CFGPARSER_TYPE_INT`, `CFGPARSER_FORMAT_INI`     |                                   |
| Macros and constants    | `SCREAMING_SNAKE_CASE` | `CFGPARSER_SUCCESS`, `CFGPARSER_MAX_LINE_LENGTH` | Module prefix required            |
| Variables and parameters| `snake_case`           | `field_count`, `temp_path`, `sec_name`           |                                   |

### File / Function Length

File and function size should be as long as necessary — no artificial limits.

### Variable / Attribute Declaration

Variables and attributes must be declared at the top of the class, struct, function, or scope (`{...}`), grouped by type so the scope is readable at a glance.

**Exception:**
- If a function has 1–3 variables and is short, they may be declared closer to their usage — though declaring them at the top is still preferred when possible.

### Global Variables

Prohibited, except for a resource shared between threads (protected with a mutex). Module-level state belongs to a class (or an explicit context struct), not to file-scope variables.

### Loop Conditions

Loop exit conditions must be explicit. Using `return` or `break` inside a loop to exit is **prohibited** — the exit condition must be expressed in the loop itself (loop condition).

Use `for` (for-each) only when iterating over the full range.

Use `while` when the loop has a conditional exit — at element X, or when condition X is no longer met. In languages like C, C++, Java where `for` supports an extra condition in the header, it may also be used for conditional iteration.

### Minimize Return Points

Minimize the number of exit points in a function — keep only the minimum necessary for maximum control over what the function returns. Early `return` is only allowed as an initial guard (parameter/resource validation at the start of a function), never inside the main logic of a loop.

### Differentiated Errors

A function that returns errors must distinguish the kind of failure (specific codes/types: `ERR_NOT_FOUND`, `ERR_INVALID_INPUT`, specific exceptions, etc.), not a single generic error. The caller needs to be able to react differently depending on the case.

### Recovery Before Failure

The program must always try to recover its state after an error, not die. An error is handled and reported (log/screen), not left to kill the process. An operation that can fail transiently (starting a service, connecting, etc.) is retried several times before being given up on. A definitive exception/failure is the last resort, once nothing else can be tried — not the default outcome of the first error.

### Resource Management

Every acquired resource (memory, connection, file, lock) must have a single, deterministic release point, ideally tied to the lifecycle of the object that owns it.

### Function Parameters

Maximum 3–4 parameters; 5–6 as a justified exception, never more. Beyond that, group them into a logical struct/object.

### Comments

Always document the public interface with the language's standard mechanism (Doxygen for C/C++, docstrings for Python, JSDoc/TSDoc for frontend); inside the body, comment only non-obvious decisions.

### Avoid Fragmenting Into Many Small Files

If the actual content fits in one or a few cohesive files, don't create one file per function/handler/component just out of habit. Split when size or responsibility justifies it, not mechanically.