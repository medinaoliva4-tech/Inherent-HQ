# Skills del repo

Las skills de cada departamento **viven adentro del brain de su departamento**, no acá:

```
agents/creative/
├── .claude-plugin/plugin.json     ← la identidad del plugin (no lo carga: ver abajo)
├── WORKFLOW.md                    ← cómo trabaja el departamento
└── skills/
    ├── COMO-LAS-USA.md            ← el índice
    ├── creatividad/SKILL.md       ← el orquestador
    └── cr-*/SKILL.md              ← una carpeta por skill
```

**Por qué así.** Un departamento tiene que entenderse abriendo **una sola carpeta**. Y esa estructura
—`plugin.json` + `skills/<skill>/SKILL.md`— es exactamente la de un plugin de Claude, así que no hace
falta ni duplicar archivos ni poner atajos.

🛑 **Pero un plugin no se carga solo.** Hacen falta dos registros, y los dos ya están en el repo:

| Archivo | Qué hace |
|---|---|
| `.claude-plugin/marketplace.json` *(raíz del repo)* | Lista los departamentos y dice en qué carpeta vive cada uno |
| `.claude/settings.json` → `extraKnownMarketplaces` + `enabledPlugins` | Deja los dos habilitados para todo el que clone el repo |

Sin esos dos archivos, un `plugin.json` suelto **no hace nada**: las skills del departamento
simplemente no aparecen. Fue así hasta el 17-sep-2026.

**Cómo se invocan.** Las de un plugin llevan el prefijo del departamento —`creatividad:cr-brief`,
`produccion:pr-jornadas`—. Las de esta carpeta van sin prefijo: `estrategia`, `st-foundation`.

**En una rama sin mergear:** el marketplace se lee del repo publicado, así que hasta el merge hay que
registrarlo a mano una vez con `/plugin marketplace add .` desde la raíz.

| Departamento | Dónde están sus skills | ¿Ya migrado? |
|---|---|---|
| ④ Creatividad | `agents/creative/skills/` | ✅ |
| ⑤ Producción | `agents/production/skills/` | ✅ |
| ①②③ (hoy juntos) | `.claude/skills/st-*` + `.claude/skills/estrategia` | ⬜ todavía acá |

## Reglas

1. **Una skill vive en un solo lugar.** Nunca se copia a `.claude/skills/`: una copia se
   desincroniza en dos ciclos y nadie sabe cuál manda.
2. **Al crear una skill nueva:** carpeta dentro de `agents/<departamento>/skills/` con su `SKILL.md`,
   y se agrega a `COMO-LAS-USA.md` de ese departamento. No hay que registrarla en ningún otro lado
   — el departamento ya está registrado. **Un departamento nuevo sí:** va listado en
   `.claude-plugin/marketplace.json` y habilitado en `.claude/settings.json`, o no existe.
3. **El `name` del frontmatter manda** sobre el nombre de la carpeta a la hora de invocarla. Se
   mantienen iguales igual, para que no haya sorpresas.

> Lo que queda en esta carpeta son las skills de ①②③, que todavía no se migraron porque ese
> departamento está por separarse en tres.
