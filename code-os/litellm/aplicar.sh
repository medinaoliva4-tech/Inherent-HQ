#!/usr/bin/env bash
# Aplica los niveles en producción. Correr desde la raíz del repo:  bash code-os/litellm/aplicar.sh
# Respalda, copia, reinicia SOLO litellm.service y verifica. Si algo falla, restaura el respaldo.
set -euo pipefail
H=inherent-gw; G=/home/deploy/gateway; F=$(date +%Y%m%d%H%M)
scp -q code-os/litellm/litellm.yaml $H:$G/litellm.yaml.nuevo
scp -q code-os/cuotas/cuotas_callback.py $H:$G/cuotas_callback.py
ssh $H "set -e; cd $G; cp litellm.yaml respaldo-gw/litellm.yaml.antes-niveles-final-$F; mv litellm.yaml.nuevo litellm.yaml; mkdir -p cuotas
  systemctl restart litellm.service
  for i in \$(seq 1 40); do curl -s -m3 localhost:4000/health/liveliness >/dev/null && break; sleep 3; done
  curl -s -m5 localhost:4000/health/liveliness >/dev/null || { cp respaldo-gw/litellm.yaml.antes-niveles-final-$F litellm.yaml; systemctl restart litellm.service; echo 'FALLÓ: restaurado el respaldo'; exit 1; }
  systemctl is-active litellm.service gw-worker.service"
echo "Listo. Respaldo: respaldo-gw/litellm.yaml.antes-niveles-final-$F"
