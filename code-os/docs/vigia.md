# Vigía: el radar de tecnología

Mantiene al sistema al día de MCPs, código abierto y nuevas formas de hacer el trabajo de cada departamento. Una vez por semana trae lo nuevo, lo filtra por departamento y deja un informe corto en `code-os/vigia/informes/AAAA-MM-DD.md`.

## Qué necesita el CEO

1. **Aprobar el horario:** lunes 7:00 (hora de Guatemala), una vez por semana, en el VPS.
2. **Decidir si usa IA:** sin IA cuesta 0; con IA usa `nivel-bajo` (modelos abiertos gratis en NVIDIA por LiteLLM), unas 6 llamadas por semana.
3. Pasar sus fuentes extra cuando quiera: se agregan al final de `fuentes.json`.

Nada se programa hasta su OK.

## Cómo se corre

```bash
# Sin IA (solo palabras clave). Cuesta 0.
node code-os/vigia/vigia.mjs --sin-ia

# Con IA por LiteLLM del VPS (sin llaves en el repo: vienen del entorno)
VIGIA_LLM_URL=http://127.0.0.1:4000 VIGIA_LLM_KEY="$LITELLM_MASTER_KEY" \
  node code-os/vigia/vigia.mjs --nivel nivel-bajo --max-llamadas 6

# Ver el informe sin escribir nada
node code-os/vigia/vigia.mjs --sin-ia --seco

# Pruebas
node --test code-os/vigia/test/vigia.test.mjs
```

Opciones: `--desde AAAA-MM-DD` (por defecto, la última corrida; la primera vez, 7 días atrás) · `--fecha` (nombre del informe) · `--nivel` (alias de LiteLLM) · `--max-llamadas` · `--sin-ia` · `--seco`.

Requisitos: Node 22 y `gh` con sesión iniciada (para la API de GitHub). Si falla la IA o una fuente, el informe sale igual y lista lo que falló.

## Propuesta de horario (para aprobar; NO está creada)

```cron
# Lunes 13:00 UTC = 7:00 en Guatemala
0 13 * * 1  cd ~/Inherent-HQ && git pull -q && node code-os/vigia/vigia.mjs --nivel nivel-bajo >> ~/vigia.log 2>&1
```

El informe queda en el VPS. Subirlo al repo o mandarlo al OS es otro paso que se decide después.

## Cómo funciona

| Archivo | Para qué |
|---|---|
| `fuentes.json` | Lista de fuentes. Tipos: `rss`, `hn`, `github_busqueda`, `github_releases`, `mcp_registro`. `activa: false` la apaga sin borrarla; `peso` sube o baja su puntaje |
| `temas.json` | Palabras clave por departamento y la línea de «por qué le sirve» cuando no hay IA; `ruido` resta |
| `estado/estado.json` | Fecha de la última corrida y lo ya visto (120 días). No se sube al repo |
| `informes/` | Un informe por corrida |

Pasos: trae lo nuevo desde la última corrida → quita repetidos y lo ya visto → agrega estrellas, licencia y último commit de los repos de GitHub → clasifica por departamento → (opcional) la IA ajusta departamento, relevancia y la línea de «por qué» → escribe el informe.

El informe trae: **Candidatos a probar** (repos con ≥500 ★, licencia clara, commits recientes; con coste y riesgo), **Novedades de herramientas vigiladas** (la versión más reciente de cada una) y **Lo nuevo por departamento** con recomendación probar / vigilar / ignorar.

Lo que se escribe a mano entre `<!-- curado:inicio -->` y `<!-- curado:fin -->` se conserva si se vuelve a correr el mismo día.

## Fuentes elegidas y por qué

| Fuente | Qué da | Cómo, gratis | Frecuencia |
|---|---|---|---|
| [Registro oficial de MCP](https://registry.modelcontextprotocol.io) | Todos los servidores MCP publicados o actualizados | API `v0.1/servers?updated_since=` | Continua |
| GitHub (búsquedas y temas `mcp-server`, `ai-agents`, `marketing-automation`, `video-editing`, `web-scraping`) | Repos nuevos que crecen rápido | `gh api search/repositories` | Diaria |
| GitHub releases de lo que usamos o probamos | Versiones nuevas (FilmCraft, Figwright, graphify, LiteLLM, Scrapling…) | `gh api repos/…/releases` | Continua |
| [Hacker News](https://news.ycombinator.com) | Lo que la comunidad técnica empuja (≥80 puntos) | API de Algolia | Continua |
| [Blog de MCP](https://blog.modelcontextprotocol.io) | Cambios del protocolo | RSS | Semanal |
| [Claude Code releases](https://github.com/anthropics/claude-code/releases) | Funciones nuevas del motor | Atom | Varias por semana |
| [Simon Willison](https://simonwillison.net) | El mejor filtro diario de IA práctica | Atom | Diaria |
| [Latent Space](https://www.latent.space) | Agentes e ingeniería de IA a fondo | RSS | Semanal |
| [TLDR AI](https://tldr.tech/ai) · [Ben's Bites](https://www.bensbites.com) · [AINews (smol.ai)](https://news.smol.ai) | Resumen de noticias de IA | RSS | Diaria |
| [Vercel changelog](https://vercel.com/changelog) · [OpenAI news](https://openai.com/news) · [Hugging Face blog](https://huggingface.co/blog) | Plataformas y modelos (peso bajo) | RSS / Atom | Diaria |
| [Product Hunt](https://www.producthunt.com) | Herramientas nuevas (peso bajo) | RSS | Diaria |
| [Social Media Today](https://www.socialmediatoday.com) | Cambios en Meta, TikTok, IG, LinkedIn | RSS | Diaria |
| [Jon Loomer](https://www.jonloomer.com) | Meta Ads en detalle | RSS | Varias por semana |
| [PPC Land](https://ppc.land) | Google, Meta y TikTok Ads | RSS | Diaria |
| [r/mcp](https://www.reddit.com/r/mcp) | Servidores MCP que la gente prueba | RSS | Semanal (top) |

Apagadas o descartadas:
- **r/ClaudeAI, r/PPC, r/n8n:** Reddit responde 429 (demasiadas peticiones) sin cuenta; quedan en `fuentes.json` con `activa: false`. Se activan si se crea una app gratis de Reddit.
- **X (Twitter):** su API ya no es gratis. Descartado.
- **YouTube:** cada canal tiene RSS gratis (`https://www.youtube.com/feeds/videos.xml?channel_id=…`); se agregan los canales que elija el CEO.
- **Listas «awesome»** ([punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers), 98k ★): se cubren mejor con el registro oficial y las búsquedas de GitHub. `appcypher/awesome-mcp-servers` está archivada.
- **Search Engine Land:** su RSS bloquea lectores automáticos (403). **Anthropic news** no tiene RSS; lo cubren Simon Willison y Claude Code releases.
