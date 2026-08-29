# code

**Org:** hanzoai  ·  **Ecosystem:** hanzo  ·  **Path:** `/Users/a/work/hanzo/hanzoai/code`
**Origin:** https://github.com/hanzoai/code.git

## Discovery

This file (`CLAUDE.md`) is the canonical agent-facing readme; `LLM.md` is a symlink to it. Update either name and both stay in sync.

## Where to look first

- `README.md` — human-facing overview (if present)
- `package.json` / `Cargo.toml` / `pyproject.toml` / `go.mod` — language & deps
- `.github/workflows/` — CI surface
- `docs/` — extended docs (if present)

## Sibling repos

See the org-level `LLM.md` at `/Users/a/work/hanzo/hanzoai/LLM.md` for the full inventory of sibling repos and inter-repo dependencies.
## Upstream pin (kept here, not in customer docs)

Hanzo Code is based on **VS Code v1.94.0** (`package.json` name `code-dev`,
version `1.94.0`). The AI code lives in `src/vs/workbench/contrib/void/` and
`src/vs/workbench/contrib/code/browser/`.

**Do not rename the `void` identifiers.** `product.json` carries
`applicationName: "void"`, `dataFolderName: ".code-editor"` and
`darwinBundleIdentifier: "com.hanzoai.code"`. The first two determine the user's
on-disk config directory — changing them orphans every existing install.
`VOID_CODEBASE_GUIDE.md`, `.voidrules` and `void_icons/` are contributor-facing
and can be renamed independently.

docs.hanzo.ai/docs/skills/hanzo-code no longer leads with the fork lineage.
