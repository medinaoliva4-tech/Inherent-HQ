#!/bin/bash
# Motor de medios del Agente de Video: ffmpeg (edición) + faster-whisper (transcripción).
# Sin esto, la Fase 1 del método arranca BLOQUEADA.
set -euo pipefail

# Solo en sesiones remotas (Buzz / cloud). En local cada quien maneja su entorno.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

log() { echo "[inherent-video] $*" >&2; }

if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  log "ffmpeg ya presente: $(ffmpeg -version 2>/dev/null | head -1)"
else
  log "instalando ffmpeg..."
  export DEBIAN_FRONTEND=noninteractive
  SUDO=""
  [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && SUDO="sudo"
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq --no-install-recommends ffmpeg
  log "ffmpeg instalado: $(ffmpeg -version 2>/dev/null | head -1)"
fi

if python3 -c "import faster_whisper" >/dev/null 2>&1; then
  log "faster-whisper ya presente"
else
  log "instalando faster-whisper..."
  # --break-system-packages: Debian/Ubuntu marcan el Python del sistema como externally-managed (PEP 668)
  python3 -m pip install --quiet --disable-pip-version-check --break-system-packages faster-whisper \
    || python3 -m pip install --quiet --disable-pip-version-check faster-whisper \
    || log "AVISO: faster-whisper no se pudo instalar — la transcripcion local queda no disponible"
fi

log "motor de medios listo"
