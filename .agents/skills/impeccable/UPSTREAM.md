# Installed upstream skill

- Source: https://github.com/pbakaus/impeccable
- Official instructions: https://impeccable.style/docs
- Reviewed source revision: `df3a4abe7d0840d5f60324812c432e00b66a4e75`
- CLI/skill: 4.8.0; engine launcher: 0.1.18 (verified download manifest included).
- Installed with `npx --yes impeccable@4.8.0 install --providers=codex --scope=project --yes`.
- License: Apache-2.0, copied from official source to LICENSE.
- Local changes: trailing whitespace only in extract.md, harden.md and optimize.md;
  Git normalizes the Windows launcher CRLF. No upstream rule or executable change.

ARgala's approved product decisions and repository instructions take precedence
over generic skill defaults. See the sibling `argala-ui` skill and root DESIGN.md.
Codex project hooks require trust approval through `/hooks`; no trust is inferred
from installation. No binary or credential is committed. Project telemetry is off.
