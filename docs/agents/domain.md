# Domain Docs

This Vencord fork uses a multi-context layout for fork-owned domains.

## Before exploring

1. Read `CONTEXT-MAP.md` at the repository root.
2. Read each mapped `CONTEXT.md` relevant to the task.
3. Read related decisions under root `docs/adr/` and context-local `docs/adr/` directories
   when they exist.

Missing context or ADR files are not an error. Create them lazily only when a domain term or
qualifying architectural decision is actually resolved.

## Consumer rules

- Use the glossary's canonical term in issues, plans, tests, code, and documentation.
- Do not add general programming concepts to a domain glossary.
- Surface conflicts with an existing ADR instead of silently overriding it.
- `CONTEXT-MAP.md` lists only contexts introduced or actively managed by this fork; upstream
  Vencord modules remain outside the BetterSliders domain unless explicitly mapped.
