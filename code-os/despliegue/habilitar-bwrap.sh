#!/usr/bin/env bash
# Una sola vez, con sudo. Ubuntu 24.04 bloquea los user namespaces sin perfil: sin esto bubblewrap no funciona y
# Code/Plan quedan apagados. Crea un perfil de AppArmor SOLO para /usr/bin/bwrap (no cambia el ajuste global del
# sistema) y comprueba que funciona. Para deshacerlo: sudo rm /etc/apparmor.d/bwrap && sudo apparmor_parser -R /etc/apparmor.d/bwrap
set -euo pipefail
command -v bwrap >/dev/null || sudo apt-get install -y bubblewrap
R="$HOME/respaldo-codeos-$(date +%Y%m%d%H%M)"; mkdir -p "$R"; sudo cp -a /etc/apparmor.d "$R/apparmor.d"; echo "respaldo: $R"
printf 'abi <abi/4.0>,\ninclude <tunables/global>\nprofile bwrap /usr/bin/bwrap flags=(unconfined) {\n  userns,\n}\n' | sudo tee /etc/apparmor.d/bwrap >/dev/null
sudo apparmor_parser -r /etc/apparmor.d/bwrap
bwrap --ro-bind /usr /usr --symlink usr/bin /bin --symlink usr/lib /lib --symlink usr/lib64 /lib64 --proc /proc --dev /dev --unshare-pid /usr/bin/true && echo "✓ bubblewrap funciona" || { echo "✗ bubblewrap sigue sin funcionar"; exit 1; }
