#!/usr/bin/env bash
# Delega una tarea a Codex EN TU MAC (ahí ya tiene sesión con tu plan: no gasta API). Crea una rama, corre Codex y deja el diff para revisar.
# Uso:   bash ceo-os/scripts/codex-delegar.sh "<tarea>" [nombre-de-rama]
# Antes: `codex login` una vez en tu Mac. Después revisa con `git diff main...` y corre `cd ceo-os && npm test`.
set -euo pipefail
tarea="${1:?Falta la tarea: bash ceo-os/scripts/codex-delegar.sh \"<tarea>\" [rama]}"
rama="codex/${2:-$(date +%m%d-%H%M)}"
raiz="$(git rev-parse --show-toplevel)"; cd "$raiz"
command -v codex >/dev/null || { echo "No encuentro codex. Instálalo: npm i -g @openai/codex  y luego: codex login"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Hay cambios sin guardar. Haz commit o stash primero."; exit 1; }
git switch -c "$rama"
echo "→ Rama $rama. Codex trabaja en ceo-os/ (lee ceo-os/AGENTS.md)…"
codex exec --sandbox workspace-write --cd "$raiz/ceo-os" "$tarea

Sigue ceo-os/AGENTS.md. Al final corre las pruebas que toques y resume qué hiciste y qué no pudiste verificar."
git add -A && git -c user.name="${GIT_AUTHOR_NAME:-codex}" -c user.email="${GIT_AUTHOR_EMAIL:-codex@local}" commit -qm "Codex: ${tarea:0:70}" || echo "(Codex no dejó cambios)"
echo "→ Listo. Revisa:  git diff main...$rama --stat   y   cd ceo-os && npm test"
echo "→ NADA se subió. Si te sirve:  git push -u origin $rama"
