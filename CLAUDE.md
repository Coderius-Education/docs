# Coderius — gedeelde instructies

Deze map bevat twee soorten repos:

- **`*-docs/`** — Docusaurus-leersites. Volg de schrijfstijl, het didactisch kader en de schrijfskills hieronder.
- **`play/`** — Python-bibliotheek. Library-conventies, géén docs-conventies; zie `play/CLAUDE.md`.

Elke repo heeft zijn eigen `CLAUDE.md` met uitsluitend project-specifieke aanvullingen (lesvolgorde, naam-prefixen, lab-framing, …). Die wordt automatisch bovenop deze gids geladen.

## Preview-links

Elke branch krijgt per site automatisch een preview op
`https://<branch-met-streepjes>--<site-id>.preview.coderius.nl/` — de `/` in de
branchnaam wordt een `-`, de site-id is de mapnaam onder `sites/`. Voorbeeld:
branch `claude/status-ttlwfx` + site `play` →
`https://claude-status-ttlwfx--play.preview.coderius.nl/`. Zet in elke
PR-beschrijving de preview-links van de aangepaste sites.

## Schrijfstijl (alleen voor *-docs)
@org-handbook/WRITING_STYLE_GUIDE.md

## Didactisch kader (PRIMM, scaffolding, cognitive load)
@org-handbook/CLAUDE.md

## Skills voor goed schrijven
@org-handbook/WRITING_SKILLS.md
