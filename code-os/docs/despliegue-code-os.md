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
- La interfaz solo se sirve cuando existe el flag `~/code-os-data/interfaz-activada`, que el **asistente** crea únicamente si todas las revisiones críticas pasan.

## Una sola vez: tres comandos

Desde tu Mac (el código ya está copiado al VPS en `~/code-os`; si cambia, repite el primero):

```bash
bash code-os/despliegue/sincronizar.sh          # copia puente, interfaz y scripts; compila (sin tocar producción)
```
```bash
ssh -t inherent-gw 'bash ~/code-os/despliegue/habilitar-bwrap.sh'   # perfil de AppArmor solo para /usr/bin/bwrap (respaldo incluido)
```
```bash
ssh -t inherent-gw 'bash ~/code-os/despliegue/instalar.sh'          # respaldo, LiteLLM con base de datos, servicio del puente, Tailscale Serve
```

Luego, en el VPS:

```bash
code-os-asistente usuario rodrigo --directos cp-,nv-   # crea tu llave virtual y tu token (se muestra una vez)
sudo systemctl restart code-os-puente
code-os-login rodrigo                                   # inicias sesión de Claude con TU cuenta (opcional)
code-os-asistente                                       # revisa todo y activa la interfaz si pasa
```

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
