# Despliegue de Code OS en el VPS

Todo corre en el VPS Contabo (`ssh inherent-gw`, usuario `deploy`). Estado real al 2026-11-10 al final de este documento.

```
Tailscale ──▶ tailscale serve :8080 ──▶ 127.0.0.1:4300 puente ──▶ 127.0.0.1:4000 LiteLLM ──▶ proveedores
 (tu tailnet)                              │  sirve la interfaz   └▶ Postgres 127.0.0.1:5433 (llaves virtuales)
                                           └▶ 127.0.0.1:4200 cuotas (medidor)
```

## Cómo se publica y por qué

**Opción elegida: el propio puente sirve la interfaz (misma dirección y mismo origen que la API) y se publica con `tailscale serve`, solo dentro de tu tailnet.**

- Un solo proceso y un solo puerto: sin CORS, sin segundo servidor, sin proxy que mantener.
- El puente sigue escuchando **solo en 127.0.0.1** (el arranque aborta si se le pide otra cosa). Lo que abre el acceso es Tailscale Serve, que únicamente atiende a dispositivos de tu tailnet. **No** se usa Funnel (internet público).
- Dos capas: estar en la tailnet **y** el token de cada persona. La interfaz estática se sirve sin token (hace falta para cargar la pantalla de entrada); no contiene datos ni llaves.
- Se descartó abrir un puerto público con login propio: más superficie de ataque y habría que construir y mantener un login. Se descartó escuchar en la IP de Tailscale: rompe la regla de «solo 127.0.0.1».
- Hoy se sirve por `http://<nombre-del-vps>:8080` (el túnel de Tailscale ya va cifrado). Si quieres `https://` con certificado, se activa «HTTPS Certificates» en el panel de Tailscale (DNS) y se cambia a `tailscale serve --bg https+insecure://…` / `--https=443`; la interfaz no cambia.
- La página exige sesión (cookie de `/entrar`); los archivos estáticos no.
- La interfaz solo se sirve cuando existe el flag `~/code-os-data/interfaz-activada`, que el **asistente** crea únicamente si todas las revisiones críticas pasan.

## Un solo comando (desde tu Mac)

```bash
bash code-os/despliegue/code-os.sh
```

La primera vez configura todo (copia el código, instala con respaldo y verificación, crea tu usuario, te pregunta si quieres iniciar tu sesión de Claude) y te deja **dentro**. Las siguientes veces solo abre Code OS ya con tu sesión.

- **Sin pegar token:** tu token queda en el Llavero de macOS (nunca se imprime). El comando abre una página local que lo envía al puente (`POST /entrar`); el puente responde con una cookie `HttpOnly` y `SameSite=Strict`, y entras directo. El token **no** va en el JavaScript de la interfaz. Si abres la dirección sin sesión, sale una pantalla para pegarlo (una vez por navegador); `/salir` cierra la sesión.
- **Tu sesión de Claude** es opcional y la haces tú con tu cuenta (`code-os-login <usuario>` en el servidor, o la pregunta del comando).
- Para actualizar después de un cambio: el mismo comando con `configurar`.

Los pasos sueltos (por si prefieres hacerlos a mano): `sincronizar.sh` (Mac) → `habilitar-bwrap.sh` (una vez, con sudo en el VPS) → `instalar.sh` (VPS) → `code-os-asistente usuario <id>` → `sudo systemctl restart code-os-puente` → `code-os-asistente`.

`instalar.sh` deshace solo el cambio de LiteLLM si no vuelve con base de datos, y no continúa si `litellm`, `gw-worker` o `cuotas` quedan inactivos. Para revertir a mano: `sudo rm /etc/systemd/system/litellm.service.d/db.conf && sudo systemctl daemon-reload && sudo systemctl restart litellm`.

## Qué instala y por qué

| Pieza | Qué es | Reversa |
|---|---|---|
| `bubblewrap` + perfil AppArmor `bwrap` | Confina cada sesión (Ubuntu 24.04 lo bloquea sin perfil). El perfil es solo para `/usr/bin/bwrap`; el ajuste global del sistema no cambia | `sudo rm /etc/apparmor.d/bwrap && sudo apparmor_parser -R /etc/apparmor.d/bwrap` |
| Postgres 16 en Docker (`litellm-pg`, 127.0.0.1:5433) | LiteLLM necesita base de datos para **llaves virtuales** (por persona, con tope y niveles). Contraseña generada en el servidor: `~/gateway/litellm-db.env` (600) | `docker rm -f litellm-pg` |
| `~/gateway/.venv-vk` | Segundo entorno de LiteLLM (misma versión 1.108.0) con `prisma`. El de producción **no se toca**; el servicio lo usa por un drop-in | borrar el drop-in |
| `litellm.service.d/db.conf` | Apunta LiteLLM al venv con base de datos | ver arriba |
| `code-os-puente.service` | Usuario `deploy`, solo 127.0.0.1:4300. **Sin** `EnvironmentFile` del Gateway: el puente no ve la master ni las llaves de proveedores | `sudo systemctl disable --now code-os-puente` |
| `code-os-login`, `code-os-asistente` | Atajos en `/usr/local/bin` | borrar |
| `claude` (`@anthropic-ai/claude-code`) | Cliente oficial para el login de cada persona | `sudo npm rm -g @anthropic-ai/claude-code` |

Respaldos: `~/respaldo-codeos-<fecha>/` (unidades systemd, `litellm.yaml`, `dpkg`, AppArmor; **nunca** el `.env`).

## Actualizar la interfaz

`bash code-os/despliegue/sincronizar.sh` (o, en el VPS, `bash ~/code-os/despliegue/recompilar-ui.sh`). El puente sirve `~/code-os/ui/dist` sin reiniciarse.

## Llaves virtuales y respaldos

La llave de cada persona lista **sus niveles y los respaldos de esos niveles** (`router_settings.fallbacks` de `litellm.yaml`): LiteLLM revisa el acceso del modelo de respaldo con la llave de quien llama; sin ellos, cuando Cline Pass se agota el nivel no cae a NVIDIA y devuelve el 429. Medido: con la llave sin respaldos, `nivel-medio` → 429; con ellos → responde NVIDIA en ~3 s. Si cambias los respaldos en `litellm.yaml`, vuelve a correr `code-os-asistente usuario <id>` para rotar la llave.

## Nivel alto con suscripción

Cada persona usa **su** cuenta de Claude, en su HOME del servidor (`~/code-os-data/users/<id>/home`), con `code-os-login <id>`. El asistente y el puente solo preguntan `claude auth status`; nunca piden ni leen contraseñas ni tokens. No se comparte una cuenta entre usuarios y el token no se pasa a LiteLLM. Sin sesión (o si llega a su límite de 5 h antes de empezar), `nivel-alto` corre por LiteLLM → Cline Pass top. Cada turno por suscripción se registra en el medidor como `claude_login`.

## Estado al 2026-11-10

Ver el informe del PR: qué quedó probado de punta a punta y qué espera una aprobación del CEO (perfil de AppArmor y cambio de LiteLLM en producción).

## Figma (Figwright) e imágenes en el chat

Diseño: el **líder** de Figwright corre en la Mac (Figma + plugin, `127.0.0.1:3055`). Un LaunchAgent de la Mac abre el túnel inverso `ssh -R 127.0.0.1:3055:127.0.0.1:3055 inherent-gw` (solo expone ese puerto, solo en el loopback del VPS). En el VPS no hay demonio: el puente lanza un Figwright **seguidor** por sesión dentro de bubblewrap (versión fijada en `/opt/code-os-mcp/figwright`) y lo cierra al terminar el turno. Si el túnel no responde, el puente no lo lanza (el VPS nunca toma el puerto y no le bloquea el túnel a la Mac) y la capacidad sale `sin_conexion` con el motivo.

1. Mac: `bash code-os/despliegue/sincronizar.sh` (ahora también copia `code-os/imagen`).
2. VPS: `ssh -t inherent-gw 'bash ~/code-os/despliegue/figwright-seguidor.sh --dry-run'` y, si se ve bien, sin `--dry-run` y con `--reiniciar`.
3. Mac del diseñador: `bash code-os/despliegue/figwright-tunel-mac.sh --dry-run`, luego sin `--dry-run`. Estado: `--estado`. Quitar: `--desinstalar`.
4. Verificar: `GET /capacidades` → `figwright: lista`; en una sesión con `capacidades:["figwright"]`, el agente llama `list_files` y `use_file` antes de escribir.

Actualizar Figwright: primero la Mac, después el VPS con `--version` igual a la de la Mac (un seguidor más nuevo que el líder le pide abdicar). Volver atrás: `figwright-seguidor.sh --revertir <respaldo>`.
