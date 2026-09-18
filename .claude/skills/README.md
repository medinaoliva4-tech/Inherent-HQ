# Skills del repo

Las skills de cada departamento **viven adentro del brain de su departamento**, no acá:

```
agents/creative/
├── .claude-plugin/plugin.json     ← lo vuelve un plugin cargable
├── WORKFLOW.md                    ← cómo trabaja el departamento
└── skills/
    ├── COMO-LAS-USA.md            ← el índice
    ├── creatividad/SKILL.md       ← el orquestador
    └── cr-*/SKILL.md              ← una carpeta por skill
```

**Por qué así.** Un departamento tiene que entenderse abriendo **una sola carpeta**. Y resulta que esa
estructura —`plugin.json` + `skills/<skill>/SKILL.md`— es exactamente la que Claude carga como
plugin, así que no hace falta ni duplicar archivos ni poner atajos.

| Departamento | Dónde están sus skills | ¿Ya migrado? |
|---|---|---|
| ④ Creatividad | `agents/creative/skills/` | ✅ |
| ⑤ Producción | `agents/production/skills/` | ✅ |
| ①②③ (hoy juntos) | `.claude/skills/st-*` + `.claude/skills/estrategia` | ⬜ todavía acá |

## Reglas

1. **Una skill vive en un solo lugar.** Nunca se copia a `.claude/skills/`: una copia se
   desincroniza en dos ciclos y nadie sabe cuál manda.
2. **Al crear una skill nueva:** carpeta dentro de `agents/<departamento>/skills/` con su `SKILL.md`,
   y se agrega a `COMO-LAS-USA.md` de ese departamento. No hay que registrarla en ningún otro lado.
3. **El `name` del frontmatter manda** sobre el nombre de la carpeta a la hora de invocarla. Se
   mantienen iguales igual, para que no haya sorpresas.

> Lo que queda en esta carpeta son las skills de ①②③, que todavía no se migraron porque ese
> departamento está por separarse en tres.
