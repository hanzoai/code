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

## 2026-11-19: Hanzo Unified Shell Look & Feel Alignment

- **Built-in Default Themes (`extensions/theme-defaults/`)**:
  - Added canonical `Hanzo Dark` (`themes/hanzo_dark.json`) and `Hanzo Light` (`themes/hanzo_light.json`) themes, and aliased `Default Dark Modern` / `Default Light Modern` to inherit from them.
  - Configured `ThemeSettingDefaults` and boot splash colors (`COLOR_THEME_DARK_INITIAL_COLORS`, `COLOR_THEME_LIGHT_INITIAL_COLORS`) in `src/vs/workbench/services/themes/common/workbenchThemeService.ts` to match `Hanzo Dev` and `Hanzo Team`:
    - Dark: `#09090b` outer floor / rail / titlebar / statusbar, `#0c0c0f` sidebar, `#111114` editor & panel stage, `#222226` hairline borders, `#fafafa` / `#a1a1aa` / `#71717a` ink, `#ffffff` / `#e4e4e7` monochrome accents, `#10b981` live green, `#f59e0b` warning, `#ef4444` error (zero `#007ACC` / `#0078D4` / `#68217A`).
    - Light: `#f8f8fa` outer floor / rail / titlebar / statusbar, `#f4f4f6` sidebar, `#ffffff` editor & panel stage, `#e4e4e7` hairline borders, `#18181b` / `#52525b` / `#71717a` ink.
- **Product & AI Model Defaults (`product.json`, `src/vs/workbench/contrib/code/`)**:
  - Updated `product.json` (`Hanzo IDE` / `ai.hanzo.code`, Open VSX gallery, `Hanzo Dark` / `Hanzo Light` defaults, `hanzo.id` IAM issuer, `X-Org-Id` org header, `zen6-coder` default model + `Zen 6` lineup `zen6`, `zen6-coder`, `zen6-flash`, `zen6-max`, `zen6-free`, `zen-vl`).
  - Replaced all legacy `qwen2` / `qwen2.5` and `zen4` / `zen5` model entries and UI tooltips with `Zen 6` (`zen6`, `zen6-coder`, `zen6-flash`, `zen6-max`, `zen6-free`, `zen-vl`) and `qwen3+` (`qwen3-coder:30b`, `qwen3-coder:8b`, `qwen3:8b`, `qwen/qwen3-235b-a22b`) across `modelCapabilities.ts`, `Settings.tsx`, `CodeTooltip.tsx`, `sendLLMMessage.impl.ts`, and prebuilt `react/out` bundles.
  - Replaced legacy Void blue accents (`#007FD4`, `#306dce`, `#3b82f6`) in `code.css` and `react/src/styles.css` with monochrome VS Code theme variables.
- **Validation**:
  - Run `node --test test/hanzo-theme.test.mjs` to validate JSON schemas, Unified Shell color tokens, and the `qwen3+` model policy.

