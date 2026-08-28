# Issue tracker: GitHub

Issues and specs for this repository live as GitHub issues. Use the `gh` CLI for all
operations and infer the repository from `git remote -v`.

## Conventions

- Create: `gh issue create --title "..." --body "..."`.
- Read: `gh issue view <number> --comments`, including labels and prior triage notes.
- List: `gh issue list --state open --json number,title,body,labels,comments` with the
  appropriate state and label filters.
- Comment: `gh issue comment <number> --body "..."`.
- Label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close: `gh issue close <number> --comment "..."`.

## Pull requests as a triage surface

**PRs as a request surface: no.** Explicitly named PRs may still be inspected, but external
PRs are not included in triage discovery. GitHub shares one number space across issues and
PRs, so resolve a bare `#42` with `gh pr view 42` and fall back to `gh issue view 42`.

## Skill vocabulary

- "Publish to the issue tracker" means create a GitHub issue.
- "Fetch the relevant ticket" means run `gh issue view <number> --comments`.

## Wayfinding

- A map is one issue labelled `wayfinder:map`.
- Child tickets use GitHub sub-issues when available; otherwise link them from the map task
  list and add `Part of #<map>` to each child.
- Represent blockers with native issue dependencies when available. Otherwise add a
  `Blocked by: #<n>` line.
- The frontier is the first unassigned open child, in map order, with no open blocker.
- Claim with `gh issue edit <n> --add-assignee @me`.
- Resolve by commenting with the result, closing the child, and adding its durable context
  pointer to the map.
