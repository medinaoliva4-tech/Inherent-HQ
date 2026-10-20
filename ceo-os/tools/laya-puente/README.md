# Puente de Laya

Laya es el motor de decisiones que corre **en tu compu**. Este puente deja que Inherent OS le pida
juicios desde el navegador: «¿encaja este lead?», «¿esta factura parece duplicada?».

## Instálalo (un comando, queda corriendo siempre)

**Mac o Linux** — en la Terminal (⌘ Espacio → «Terminal»):

```bash
curl -fsSL https://inherent-work.vercel.app/laya/instalar.sh | bash
```

**Windows** — en PowerShell:

```powershell
irm https://inherent-work.vercel.app/laya/instalar.ps1 | iex
```

- No necesitas Python ni permisos de administrador: el instalador trae su propio Python 3.12 (con `uv`)
  y deja todo en `~/.inherent/laya`.
- La primera vez baja el modelo en español (unos 650 MB). Tarda de 5 a 15 minutos.
- Queda encendido siempre, también al reiniciar: LaunchAgent `global.inherent.laya` en Mac, servicio
  de usuario `inherent-laya` en Linux (si no hay systemd de usuario, lo arranca con `nohup` y avisa),
  tarea programada «Inherent Laya» en Windows.
- Correrlo otra vez **actualiza** sin romper nada.
- En Inherent OS → **Inherent → Laya** el punto se pone verde solo.

Para quitarlo todo:

```bash
curl -fsSL https://inherent-work.vercel.app/laya/instalar.sh | bash -s -- --desinstalar
```

```powershell
& ([scriptblock]::Create((irm https://inherent-work.vercel.app/laya/instalar.ps1))) -Desinstalar
```

## Modelo local (opcional) · texto repetitivo sin gastar créditos

Para variantes de caption, alt text y títulos cortos, las skills de contenido pueden usar un modelo pequeño que
corre en tu compu. Es **opcional**: sin él, ese texto lo escribe el modelo más barato de Claude.

**Mac o Linux:**

```bash
curl -fsSL https://inherent-work.vercel.app/laya/instalar.sh | bash -s -- --modelo-local
```

**Windows** (PowerShell):

```powershell
& ([scriptblock]::Create((irm https://inherent-work.vercel.app/laya/instalar.ps1))) -ModeloLocal
```

- Instala **Ollama** sin permisos de administrador, dentro de `~/.inherent/laya/ollama`, y baja **`gemma3:4b`**
  (~3.4 GB, escribe bien en español). Queda encendido siempre en `http://127.0.0.1:11434`.
- Si ya tienes Ollama encendido, lo usa tal cual y solo baja el modelo.
- Corre después de Laya: si algo falla ahí, Laya ya quedó funcionando. Correrlo otra vez no rompe nada.
- Si ya tienes Laya y solo quieres el modelo: `--solo-modelo-local` (Windows: `-SoloModeloLocal`).
- Otro modelo de [ollama.com/library](https://ollama.com/library): `LAYA_MODELO_LOCAL=qwen3.5:4b` antes del comando.
- En Inherent OS → **Inherent → Laya**, el paso «Modelo local (opcional)» se pone verde solo.
- `--desinstalar` también lo quita.

## Si algo falla

- Log del puente: `~/.inherent/laya/log/puente.log` (rota solo: 1 MB × 3).
- Log de la instalación: `~/.inherent/laya/log/instalar.log` · log del modelo local: `~/.inherent/laya/log/ollama.log`.
- Salud: `curl http://127.0.0.1:7357/health` → versión, modelo cargado y si está listo.

## A mano (para desarrollo)

Necesitas Python 3.10 o más nuevo. Desde la raíz del repo:

```bash
pip install "laya[serve]"
python ceo-os/tools/laya-puente/puente.py
```

Déjalo abierto mientras trabajas. Para apagarlo: `Ctrl + C`.

## Lo que tienes que saber

- Escucha solo en `127.0.0.1:7357`: nadie de afuera de tu compu le puede hablar. Otro puerto:
  `LAYA_PUENTE_PUERTO` (el OS lo busca en 7357).
- Solo acepta pedidos de la web del OS. Si la abres en otro dominio, agrégalo:
  `LAYA_PUENTE_ORIGENES="https://otro.dominio,http://localhost:*" python ceo-os/tools/laya-puente/puente.py`
- Chrome te va a preguntar si dejas que Inherent OS hable con tu compu: dale **Permitir**.
- Carga el modelo al arrancar, así el primer juicio es rápido.
- `public/laya/puente.py` es una copia idéntica de este archivo (la que baja el instalador). Si cambias
  uno, copia el otro: `cp ceo-os/tools/laya-puente/puente.py ceo-os/public/laya/puente.py`.
- Sin puente encendido, el botón «Pedir a Laya» deja el juicio **pendiente**. Claude Code lo
  resuelve en una compu que tenga Laya por MCP:
  `pip install "laya[mcp]"` y luego `claude mcp add laya -- laya-mcp-server`.
  Después pídele: «resuelve los juicios pendientes de Laya».
